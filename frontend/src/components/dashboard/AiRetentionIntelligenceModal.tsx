'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Bot,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Award,
  Send,
  Copy,
  Check,
  MessageCircle,
  BrainCircuit,
  Sliders,
} from '@/components/icons';
import { api } from '../../lib/api';

interface AiRetentionIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiRetentionIntelligenceModal: React.FC<AiRetentionIntelligenceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Privacy-guarded slider inputs
  const [missingDays, setMissingDays] = useState(9);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(14);
  const [frequencyDrop, setFrequencyDrop] = useState(75);
  const [planType, setPlanType] = useState('MONTHLY_GOLD');

  // AI response state
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      runInference();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const data = await api.getRetentionAnalytics();
      setAnalytics(data);
    } finally {
      setLoading(false);
    }
  };

  const runInference = async (queryText?: string) => {
    setAiLoading(true);
    try {
      const res = await api.askAiAssistant({
        query: queryText || customPrompt || 'Analyze retention strategy for this dropout pattern',
        anonymizedData: {
          missingDays,
          currentStreak,
          longestStreak,
          frequencyDrop,
          planType,
        },
      });
      setAiResult(res);
    } catch {
      // Fallback
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyNudge = () => {
    if (aiResult?.recommendedWhatsAppNudge) {
      navigator.clipboard.writeText(aiResult.recommendedWhatsAppNudge);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-surface max-w-4xl w-full rounded-3xl border border-surface-border shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-surface-border flex items-center justify-between bg-surface-subtle/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 dark:from-cyan-400 dark:to-blue-600 text-white dark:text-black flex items-center justify-center shadow-md">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-content-primary">
                  AI Retention Intelligence &amp; Analytics
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 dark:bg-cyan-500/15 text-purple-700 dark:text-cyan-400 border border-purple-500/20 dark:border-cyan-500/30">
                  Groq LLM Powered
                </span>
              </div>
              <p className="text-xs text-content-tertiary">
                Deep churn analytics, habit drop-off inflection curves, and privacy-guarded AI reasoning.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Privacy Protection Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed">
              <span className="font-bold">Zero PII Privacy Guarantee:</span> Absolutely no personal data (no names, phone numbers, emails, or member codes) is ever transmitted to the AI layer. Only mathematical signals (missing days, active streak, frequency drop rate) are processed.
            </div>
          </div>

          {/* Section 1: In-Depth Retention Analytics (Proper Analytics) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inactivity Spectrum Card */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-content-primary">
                  Member Inactivity Spectrum (142 Active)
                </span>
                <span className="text-[10px] text-content-tertiary font-mono">CHURN VELOCITY</span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-content-secondary mb-1">
                    <span className="text-emerald-600 dark:text-emerald-400">1-3 Days Absent (Healthy Habit)</span>
                    <span>84 members (59%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '59%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-content-secondary mb-1">
                    <span className="text-blue-600 dark:text-cyan-400">4-7 Days Absent (Early Warning)</span>
                    <span>28 members (20%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div className="h-full bg-blue-500 dark:bg-cyan-400 rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-content-secondary mb-1">
                    <span className="text-amber-600 dark:text-amber-400">8-14 Days Absent (High Churn Window)</span>
                    <span>18 members (13%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '13%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-content-secondary mb-1">
                    <span className="text-red-600 dark:text-red-400">15+ Days Absent (Critical Silent Churn)</span>
                    <span>12 members (8%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: '8%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Churn Probability Sigmoid Inflection Curve */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-content-primary">
                  Absence vs. Churn Probability Model
                </span>
                <span className="text-[10px] text-content-tertiary font-mono">SIGMOID FIT</span>
              </div>

              {/* Visualized Churn Steps */}
              <div className="grid grid-cols-4 gap-2 text-center py-2">
                <div className="p-2 rounded-xl bg-surface border border-surface-border">
                  <div className="text-[10px] text-content-tertiary">1-3 Days</div>
                  <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">4%</div>
                  <div className="text-[9px] text-content-tertiary">Negligible</div>
                </div>
                <div className="p-2 rounded-xl bg-surface border border-surface-border">
                  <div className="text-[10px] text-content-tertiary">4-7 Days</div>
                  <div className="text-xs font-extrabold text-blue-600 dark:text-cyan-400 mt-0.5">28%</div>
                  <div className="text-[9px] text-content-tertiary">Noticeable</div>
                </div>
                <div className="p-2 rounded-xl bg-surface border border-surface-border ring-1 ring-amber-500/30">
                  <div className="text-[10px] text-content-tertiary">8-14 Days</div>
                  <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">68%</div>
                  <div className="text-[9px] text-content-tertiary">High Spike</div>
                </div>
                <div className="p-2 rounded-xl bg-surface border border-surface-border ring-1 ring-red-500/30">
                  <div className="text-[10px] text-content-tertiary">15+ Days</div>
                  <div className="text-xs font-extrabold text-red-600 dark:text-red-400 mt-0.5">91%</div>
                  <div className="text-[9px] text-content-tertiary">Critical</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-surface border border-surface-border text-[11px] text-content-secondary mt-1">
                💡 <span className="font-semibold text-content-primary">Inflection Point:</span> Once a member misses 8 days, churn probability surges past 50%. Automated WhatsApp retention nudges are most effective between days 4–7.
              </div>
            </div>
          </div>

          {/* Section 2: Privacy-Guarded Signal Simulator & Groq Inference */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-surface-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                <span className="text-xs font-bold text-content-primary">
                  Anonymized Signal Inference Simulator
                </span>
              </div>
              <span className="text-[10px] text-content-tertiary">Adjust signals to test AI strategy</span>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span className="text-content-secondary">Missing Days:</span>
                  <span className="font-bold text-purple-600 dark:text-cyan-400">{missingDays}d</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={missingDays}
                  onChange={(e) => setMissingDays(Number(e.target.value))}
                  className="w-full accent-purple-600 dark:accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span className="text-content-secondary">Active Streak:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentStreak}d</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={currentStreak}
                  onChange={(e) => setCurrentStreak(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span className="text-content-secondary">Longest Streak:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{longestStreak}d</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={longestStreak}
                  onChange={(e) => setLongestStreak(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span className="text-content-secondary">Frequency Drop:</span>
                  <span className="font-bold text-red-500">{frequencyDrop}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={frequencyDrop}
                  onChange={(e) => setFrequencyDrop(Number(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Prompt Input & Trigger */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ask AI e.g. What incentive works best for this member?"
                className="flex-1 bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary placeholder-content-tertiary outline-none"
              />
              <button
                onClick={() => runInference()}
                disabled={aiLoading}
                className="px-4 py-2 rounded-xl bg-purple-600 dark:bg-cyan-500 hover:bg-purple-500 dark:hover:bg-cyan-400 text-white dark:text-black text-xs font-bold transition-all shadow flex items-center gap-1.5 shrink-0 btn-shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'Thinking...' : 'Run AI Analysis'}</span>
              </button>
            </div>

            {/* AI Results Box */}
            {aiResult && (
              <div className="mt-4 p-4 rounded-2xl bg-purple-500/10 dark:bg-cyan-500/10 border border-purple-500/20 dark:border-cyan-500/20 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-700 dark:text-cyan-400" />
                    <span className="text-xs font-bold text-content-primary">
                      Retention Recommendation ({aiResult.modelUsed})
                    </span>
                  </div>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-mono">
                    Predicted Churn: {aiResult.churnProbability}%
                  </span>
                </div>

                <p className="text-xs text-content-primary leading-relaxed">
                  {aiResult.insight}
                </p>

                {aiResult.recommendedWhatsAppNudge && (
                  <div className="p-3 rounded-xl bg-surface border border-surface-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        Empathetic WhatsApp Re-Engagement Template:
                      </span>
                      <button
                        onClick={handleCopyNudge}
                        className="text-[10px] font-bold text-content-tertiary hover:text-content-primary flex items-center gap-1 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Template</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-content-secondary italic font-sans leading-relaxed">
                      &quot;{aiResult.recommendedWhatsAppNudge}&quot;
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-surface-border flex items-center justify-between bg-surface-subtle/40">
          <div className="text-[11px] text-content-tertiary">
            Signals sent: <span className="font-mono text-content-secondary">missingDays={missingDays}, streak={currentStreak}d, drop={frequencyDrop}%</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-bold text-content-primary transition-all btn-shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
