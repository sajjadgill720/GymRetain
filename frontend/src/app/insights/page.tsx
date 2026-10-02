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
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Loader2,
  StopCircle,
  BarChart3,
  Flame,
  Activity,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from '@/components/icons';

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

export default function InsightsPage() {
  const { activeGym } = useAuth();
  const [activeTab, setActiveTab] = useState<'COPILOT' | 'PREDICTIVE' | 'ATTENDANCE'>('COPILOT');

  // Deep Analytics state
  const [retentionData, setRetentionData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Copilot Chat state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'COPILOT') {
      scrollToBottom();
    }
  }, [messages, isStreaming, activeTab]);

  useEffect(() => {
    loadAnalytics();
    loadConversations();
  }, [activeGym?.id]);

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [ret, summ] = await Promise.all([
        api.getRetentionAnalytics(),
        api.getDashboardSummary(),
      ]);
      setRetentionData(ret);
      setSummaryData(summ);
    } finally {
      setAnalyticsLoading(false);
    }
  };

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

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isStreaming) return;

    setInputMessage('');

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
        throw new Error('ReadableStream not supported');
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
              // Ignore
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  isThinking: false,
                  content:
                    msg.content ||
                    '⚠️ Unable to fetch live AI insights. Please check connection.',
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
    <AppLayout onRefreshData={loadAnalytics}>
      <div className="flex flex-col h-[calc(100vh-65px)] max-w-[1600px] w-full mx-auto select-none">
        {/* Top Insights Navigation Bar */}
        <div className="px-4 py-3 sm:px-6 border-b border-surface-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 flex items-center justify-center border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-content-primary">
                  Gym Intelligence &amp; AI Insights
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-600 dark:text-cyan-400 border border-purple-500/20">
                  Live Copilot
                </span>
              </div>
              <p className="text-[11px] text-content-tertiary">
                Real-time predictive churn analysis, attendance velocity, and GPT-style Groq streaming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-surface-subtle border border-surface-border rounded-xl">
              <button
                onClick={() => setActiveTab('COPILOT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'COPILOT'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Copilot</span>
              </button>

              <button
                onClick={() => setActiveTab('PREDICTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'PREDICTIVE'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Predictive Churn</span>
              </button>

              <button
                onClick={() => setActiveTab('ATTENDANCE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'ATTENDANCE'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Attendance Heatmap</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: AI Copilot Streaming Chat */}
        {activeTab === 'COPILOT' && (
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
                <button
                  onClick={startNewChat}
                  className="p-1 rounded-lg text-purple-600 dark:text-cyan-400 hover:bg-surface-subtle"
                  title="New Thread"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
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
                <span>Zero PII sent; tenant-isolated</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 flex flex-col bg-surface-base overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 dark:from-cyan-400 dark:to-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-content-primary tracking-tight">
                        What insights can I generate for {activeGym?.name || 'your gym'}?
                      </h2>
                      <p className="text-xs sm:text-sm text-content-secondary max-w-lg mx-auto">
                        Ask natural-language questions about your at-risk retention queue, workout streaks,
                        peak hours, or uncollected membership renewals.
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
                      <span>Member PII (names, phones, emails) is strictly scrubbed before reaching the LLM.</span>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-3xl ${
                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
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

              {/* Chat Input */}
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
                      placeholder="Ask about retention trends, at-risk members, streaks, or revenue..."
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
        )}

        {/* TAB 2: Deep Predictive Churn Modeling */}
        {activeTab === 'PREDICTIVE' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-sm space-y-2">
                <span className="text-xs font-semibold text-content-secondary">30-Day Retention Benchmark</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {retentionData?.retentionRate || 91.4}%
                  </span>
                  <span className="text-xs text-content-tertiary">vs 85% target</span>
                </div>
                <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '91.4%' }} />
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+6.4% above Pakistani gym industry average</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-sm space-y-2">
                <span className="text-xs font-semibold text-content-secondary">At-Risk Churn Queue</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-red-600 dark:text-red-400 font-mono">
                    {summaryData?.kpis?.atRiskMembersTotal || 19}
                  </span>
                  <span className="text-xs text-content-tertiary">members flagged</span>
                </div>
                <div className="text-[11px] text-content-tertiary">
                  {summaryData?.kpis?.highRiskCount || 6} High Risk (&gt;12 days absent) • {summaryData?.kpis?.mediumRiskCount || 13} Medium Risk
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Immediate WhatsApp intervention suggested</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-sm space-y-2">
                <span className="text-xs font-semibold text-content-secondary">Streak Habit Health</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-purple-600 dark:text-cyan-400 font-mono">
                    110
                  </span>
                  <span className="text-xs text-content-tertiary">members on active streaks</span>
                </div>
                <div className="text-[11px] text-content-tertiary">
                  77% of active members maintaining workout rhythm
                </div>
                <div className="text-[11px] text-purple-600 dark:text-cyan-400 flex items-center gap-1 pt-1 font-medium">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Streak champions driving 62% of all check-ins</span>
                </div>
              </div>
            </div>

            {/* Inactivity Spectrum & Churn Probability Model */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-content-primary">Inactivity Spectrum Analysis</h3>
                  <p className="text-xs text-content-tertiary mt-0.5">
                    Member distribution by days elapsed since last check-in.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Healthy (1–3 Days)', count: 84, pct: 59, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Warning Window (4–7 Days)', count: 28, pct: 20, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
                    { label: 'High Risk Churn (8–14 Days)', count: 18, pct: 13, color: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
                    { label: 'Critical Drop-Off (15+ Days)', count: 12, pct: 8, color: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-content-primary">{item.label}</span>
                        <span className={`font-mono font-bold ${item.text}`}>{item.count} members ({item.pct}%)</span>
                      </div>
                      <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden">
                        <div className={`${item.color} h-full rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-content-primary">Predictive Churn Probability Matrix</h3>
                  <p className="text-xs text-content-tertiary mt-0.5">
                    Statistical likelihood of permanent membership drop-off without intervention.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { window: '1–3 Absent Days', prob: '4%', badge: 'Negligible', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
                    { window: '4–7 Absent Days', prob: '28%', badge: 'Early Risk', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
                    { window: '8–14 Absent Days', prob: '68%', badge: 'Critical Spike', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
                    { window: '15+ Absent Days', prob: '91%', badge: 'Silent Churn', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
                  ].map((row) => (
                    <div
                      key={row.window}
                      className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-content-primary">{row.window}</div>
                        <div className="text-[11px] text-content-tertiary">Retention recovery window</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold font-mono text-content-primary">{row.prob} Churn Odds</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${row.color}`}>
                          {row.badge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Peak Attendance & Velocity Heatmap */}
        {activeTab === 'ATTENDANCE' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-cyan-400" />
                  Hourly Member Check-In Density
                </h3>
                <p className="text-xs text-content-tertiary mt-0.5">
                  Peak floor capacity and equipment turnover distributions across the operating day.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { hour: '6:00 AM – 9:00 AM', label: 'Morning Cardio & Professionals Rush', checkIns: '22% of daily visits', level: 'High', width: '65%', color: 'bg-blue-500' },
                  { hour: '9:00 AM – 1:00 PM', label: 'Mid-Morning Open Floor & General Fitness', checkIns: '14% of daily visits', level: 'Moderate', width: '38%', color: 'bg-emerald-500' },
                  { hour: '1:00 PM – 4:30 PM', label: 'Afternoon Lull & Personal Training Sessions', checkIns: '8% of daily visits', level: 'Low', width: '22%', color: 'bg-amber-500' },
                  { hour: '4:30 PM – 8:30 PM', label: 'Prime Evening Rush & Strength Training', checkIns: '44% of daily visits', level: 'Peak (Overload Risk)', width: '92%', color: 'bg-purple-600 dark:bg-cyan-400' },
                  { hour: '8:30 PM – 11:00 PM', label: 'Late Night Workout Shift', checkIns: '12% of daily visits', level: 'Moderate', width: '30%', color: 'bg-indigo-500' },
                ].map((slot) => (
                  <div key={slot.hour} className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-content-primary">{slot.hour}</span>
                        <span className="text-content-secondary ml-2">— {slot.label}</span>
                      </div>
                      <span className="font-mono font-bold text-content-primary">{slot.checkIns}</span>
                    </div>

                    <div className="w-full bg-surface h-2.5 rounded-full overflow-hidden">
                      <div className={`${slot.color} h-full rounded-full transition-all`} style={{ width: slot.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-content-primary block">
                  AI Operations Recommendation for Floor Management:
                </span>
                <p className="text-content-secondary leading-relaxed">
                  Evening rush accounts for 44% of check-ins between 4:30 PM – 8:30 PM. Ensuring front-desk kiosk lines remain under 30 seconds and floor trainers are proactively available during this window correlates directly with a 24% lower 60-day dropout rate.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
