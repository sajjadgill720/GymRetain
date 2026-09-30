'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthProvider';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Bot,
  User,
  ShieldCheck,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Loader2,
  StopCircle,
} from 'lucide-react';

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  isThinking?: boolean;
}

interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
}

const STARTER_PROMPTS = [
  {
    icon: TrendingDown,
    title: 'Retention Diagnosis',
    prompt: 'Why is member retention at risk this month, and what are the main churn triggers?',
  },
  {
    icon: Users,
    title: 'At-Risk Queue Analysis',
    prompt: 'Who are my highest-risk members right now and what interventions do you recommend?',
  },
  {
    icon: Calendar,
    title: '30-Day Attendance Trends',
    prompt: 'Summarize our check-in volume and attendance patterns over the last 30 days.',
  },
  {
    icon: DollarSign,
    title: 'Overdue Renewals',
    prompt: 'Which memberships are currently overdue or expired, and how much revenue is at risk?',
  },
];

export default function AiChatPage() {
  const { activeGym } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Load conversation threads on mount
  useEffect(() => {
    loadConversations();
  }, [activeGym?.id]);

  const loadConversations = async () => {
    try {
      const data = await api.getChatConversations();
      if (Array.isArray(data)) {
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  // Load messages when selecting a thread
  const selectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    setShowHistory(false);
    try {
      const data = await api.getChatMessages(convId);
      if (Array.isArray(data)) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            createdAt: m.createdAt,
          })),
        );
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const startNewChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setActiveConversationId(null);
    setMessages([]);
    setInputMessage('');
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await api.deleteChatConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Send message and stream SSE tokens word-by-word
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isStreaming) return;

    setInputMessage('');

    // Append user message immediately
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: query, createdAt: new Date().toISOString() },
      { id: assistantMsgId, role: 'assistant', content: '', isThinking: true },
    ]);

    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const token = api.getToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

    try {
      const response = await fetch(`${apiUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: query,
          conversationId: activeConversationId || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat API error (${response.status})`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);

              if (parsed.chunk) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          isThinking: false,
                          content: msg.content + parsed.chunk,
                        }
                      : msg,
                  ),
                );
              }

              if (parsed.done && parsed.conversationId) {
                if (!activeConversationId) {
                  setActiveConversationId(parsed.conversationId);
                  loadConversations();
                }
              }
            } catch {
              // Ignore non-json data chunk
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User aborted stream
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  isThinking: false,
                  content:
                    msg.content ||
                    '⚠️ Unable to fetch live AI insights. Please verify your connection or retry.',
                }
              : msg,
          ),
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-65px)] max-w-[1600px] w-full mx-auto select-none">
        {/* Top Header */}
        <div className="px-4 py-3 sm:px-6 border-b border-surface-border bg-surface flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 flex items-center justify-center border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-content-primary">
                  AI Operations &amp; Retention Insights
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  llama-3.3-70b-versatile
                </span>
              </div>
              <p className="text-[11px] text-content-tertiary">
                Real-time conversational intelligence grounded in {activeGym?.name || 'your gym'}&apos;s data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="lg:hidden p-2 rounded-xl bg-surface-subtle hover:bg-surface border border-surface-border text-content-secondary hover:text-content-primary text-xs flex items-center gap-1.5 btn-shadow"
              title="Chat History"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>

            <button
              onClick={startNewChat}
              className="px-3.5 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-surface-border text-content-primary text-xs font-semibold flex items-center gap-1.5 transition-all btn-shadow"
            >
              <Plus className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Chat Body & History Drawer */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Conversation History Sidebar */}
          <div
            className={`w-64 border-r border-surface-border bg-surface-subtle/50 flex flex-col transition-all duration-200 ${
              showHistory
                ? 'absolute inset-y-0 left-0 z-30 bg-surface shadow-2xl block'
                : 'hidden lg:flex'
            }`}
          >
            <div className="p-3 border-b border-surface-border flex items-center justify-between text-xs font-semibold text-content-secondary">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-cyan-400" />
                Recent Threads
              </span>
              <span className="text-[10px] font-mono text-content-tertiary">
                {conversations.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-content-tertiary">
                  No previous conversations yet.
                </div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                      activeConversationId === c.id
                        ? 'bg-purple-500/15 dark:bg-cyan-500/15 text-purple-700 dark:text-cyan-400 font-semibold'
                        : 'text-content-secondary hover:text-content-primary hover:bg-surface'
                    }`}
                  >
                    <span className="truncate flex-1 pr-2">{c.title}</span>
                    <button
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-content-tertiary hover:text-red-500 transition-opacity"
                      title="Delete thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-surface-border bg-surface/40 text-[11px] text-content-tertiary flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>PII scrubbed; tenant-isolated</span>
            </div>
          </div>

          {/* Main Messages View */}
          <div className="flex-1 flex flex-col bg-surface-base overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 ? (
                // Empty State with Starter Prompts
                <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 dark:from-cyan-400 dark:to-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-content-primary tracking-tight">
                      What insights can I generate for {activeGym?.name || 'your gym'}?
                    </h2>
                    <p className="text-xs sm:text-sm text-content-secondary max-w-lg mx-auto">
                      Ask natural language questions about your retention queue, member attendance streaks,
                      peak visit hours, or revenue renewals.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {STARTER_PROMPTS.map((starter) => (
                      <button
                        key={starter.title}
                        onClick={() => handleSendMessage(starter.prompt)}
                        className="p-4 rounded-2xl bg-surface hover:bg-surface-subtle border border-surface-border hover:border-purple-500/40 dark:hover:border-cyan-400/40 text-left transition-all group flex flex-col gap-1.5 btn-shadow"
                      >
                        <div className="flex items-center gap-2">
                          <starter.icon className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                          <span className="text-xs font-bold text-content-primary">
                            {starter.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-content-secondary line-clamp-2 leading-relaxed">
                          &ldquo;{starter.prompt}&rdquo;
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-content-tertiary">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Personal member details (names, phones, emails) are scrubbed before reaching the LLM.</span>
                  </div>
                </div>
              ) : (
                // Message List
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-3xl ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gradient-to-tr from-purple-600 to-indigo-500 dark:from-cyan-400 dark:to-blue-600 text-white'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white font-medium shadow-sm'
                          : 'bg-surface border border-surface-border text-content-primary shadow-sm'
                      }`}
                    >
                      {msg.isThinking && !msg.content ? (
                        <div className="flex items-center gap-2 text-content-tertiary py-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-cyan-400" />
                          <span className="italic">Analyzing real-time gym data...</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-line prose-xs">{msg.content}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-surface border-t border-surface-border">
              <div className="max-w-3xl mx-auto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 p-1.5 bg-surface-subtle border border-surface-border focus-within:border-purple-500 dark:focus-within:border-cyan-400 rounded-2xl shadow-inner transition-all"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about attendance trends, at-risk members, streaks, or revenue..."
                    disabled={isStreaming}
                    className="flex-1 bg-transparent px-3 py-2 text-xs text-content-primary placeholder-content-tertiary outline-none"
                  />

                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={handleStopStreaming}
                      className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all btn-shadow"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all btn-shadow"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  )}
                </form>

                <div className="flex items-center justify-between text-[10px] text-content-tertiary px-2 pt-2">
                  <span>Groq LLM streaming • llama-3.3-70b-versatile</span>
                  <span>Daily gym query limit: 50/day</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
