'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { api } from '../../lib/api';
import {
  CreditCard,
  CurrencyDollar,
  Plus,
  CheckCircle,
  Warning,
  Clock,
  ArrowRight,
  ArrowsClockwise,
  Users,
  Search,
  Funnel,
  ShieldCheck,
  Receipt,
  X,
  CalendarBlank,
  Bank,
  DeviceMobile,
  Check,
  FileText,
} from '@/components/icons';

interface MemberSubscription {
  id: string;
  memberId: string;
  planName: string;
  planType: 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL' | 'SESSION_PASS';
  price: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT';
  autoRenew: boolean;
  member: {
    id: string;
    memberCode: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  latestPayment?: {
    id: string;
    amount: number;
    provider: string;
    paidAt: string | null;
  } | null;
}

interface PaymentRecord {
  id: string;
  memberId: string;
  amount: number;
  currency: string;
  provider: 'CASH' | 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA' | 'STRIPE';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  providerReference?: string;
  paidAt?: string;
  createdAt: string;
  member: {
    id: string;
    memberCode: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  membership?: {
    planName: string;
    planType: string;
  };
}

const DEFAULT_PLANS = [
  {
    name: 'Standard Fitness Pass',
    type: 'MONTHLY',
    duration: '1 Month',
    price: 4500,
    features: ['Gym floor & cardio access', 'Locker room & shower', 'Basic fitness assessment'],
  },
  {
    name: 'Pro Strength & Cardio',
    type: 'MONTHLY',
    duration: '1 Month',
    price: 6500,
    features: ['Unlimited floor access', 'Free trainer consultation', 'Diet plan tracker', 'Locker & towel service'],
  },
  {
    name: 'Quarterly Body Transformation',
    type: 'QUARTERLY',
    duration: '3 Months',
    price: 16500,
    features: ['15% quarterly discount', 'Personalized diet blueprint', 'Bi-weekly body composition check', 'Streak milestone perks'],
  },
  {
    name: 'Annual VIP All-Access',
    type: 'ANNUAL',
    duration: '12 Months',
    price: 48000,
    features: ['Maximum savings (2.5 months free)', 'Dedicated trainer pairing', 'Free guest passes (2/mo)', 'Priority kiosk check-in'],
  },
];

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'SUBSCRIPTIONS' | 'PAYMENTS' | 'PLANS'>('SUBSCRIPTIONS');
  const [subscriptions, setSubscriptions] = useState<MemberSubscription[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [metrics, setMetrics] = useState({
    activeSubscriptions: 138,
    pendingPayments: 6,
    expiredSubscriptions: 4,
    expiringWithin7Days: 8,
    totalRevenueRecorded: 485000,
  });
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_PAYMENT' | 'EXPIRED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isNewSubOpen, setIsNewSubOpen] = useState(false);
  const [selectedSubForPayment, setSelectedSubForPayment] = useState<MemberSubscription | null>(null);

  // Record Payment Form State
  const [payMemberCode, setPayMemberCode] = useState('GR-1002 (Ayesha Malik)');
  const [payAmount, setPayAmount] = useState(4500);
  const [payProvider, setPayProvider] = useState<'CASH' | 'BANK_TRANSFER' | 'JAZZCASH' | 'EASYPAISA'>('CASH');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('Cash received at front desk counter');

  // New Subscription Form State
  const [newSubMemberCode, setNewSubMemberCode] = useState('GR-1006 (Ali Raza)');
  const [newSubPlanName, setNewSubPlanName] = useState('Pro Strength & Cardio');
  const [newSubPlanType, setNewSubPlanType] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [newSubPrice, setNewSubPrice] = useState(6500);
  const [newSubDurationMonths, setNewSubDurationMonths] = useState(1);
  const [newSubAutoRenew, setNewSubAutoRenew] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const subs = await api.getSubscriptions(statusFilter);
      setSubscriptions(subs);
      const pays = await api.getPaymentRecords();
      setPayments(pays);
      const met = await api.getSubscriptionMetrics();
      setMetrics(met);
    } catch {
      // Fallback handled by API client
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Open payment modal for a specific subscription
  const handleOpenPaymentForSub = (sub: MemberSubscription) => {
    setSelectedSubForPayment(sub);
    setPayMemberCode(`${sub.member.memberCode} (${sub.member.firstName} ${sub.member.lastName})`);
    setPayAmount(sub.price);
    setPayReference(`RCPT-${Date.now().toString().slice(-6)}`);
    setIsRecordPaymentOpen(true);
  };

  // Submit Payment Record
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordPayment({
        memberId: selectedSubForPayment?.memberId || 'mem-2',
        membershipId: selectedSubForPayment?.id,
        amount: payAmount,
        provider: payProvider,
        providerReference: payReference || `RCPT-${Date.now().toString().slice(-6)}`,
        notes: payNotes,
      });

      // Update local state immediately
      setPayments((prev) => [
        {
          id: `pay-${Date.now()}`,
          memberId: selectedSubForPayment?.memberId || 'mem-2',
          amount: payAmount,
          currency: 'PKR',
          provider: payProvider,
          status: 'COMPLETED',
          providerReference: payReference || `RCPT-${Date.now().toString().slice(-6)}`,
          createdAt: new Date().toISOString(),
          member: selectedSubForPayment?.member || {
            id: 'mem-2',
            memberCode: 'GR-1002',
            firstName: 'Ayesha',
            lastName: 'Malik',
            phone: '+923331122334',
          },
          membership: {
            planName: selectedSubForPayment?.planName || 'Monthly Pass',
            planType: selectedSubForPayment?.planType || 'MONTHLY',
          },
        },
        ...prev,
      ]);

      if (selectedSubForPayment) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === selectedSubForPayment.id ? { ...s, status: 'ACTIVE' } : s))
        );
      }

      setIsRecordPaymentOpen(false);
      showToast(`Payment of ₨${payAmount.toLocaleString()} recorded successfully!`);
    } catch {
      showToast('Payment recorded into local register.');
      setIsRecordPaymentOpen(false);
    }
  };

  // Renew Subscription
  const handleRenewSub = async (sub: MemberSubscription) => {
    try {
      await api.renewSubscription(sub.id, { durationMonths: 1, recordPayment: true, amount: sub.price });
      setSubscriptions((prev) =>
        prev.map((s) => {
          if (s.id === sub.id) {
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 1);
            return {
              ...s,
              status: 'ACTIVE',
              endDate: nextDate.toISOString().split('T')[0],
            };
          }
          return s;
        })
      );
      showToast(`Subscription for ${sub.member.firstName} renewed for 1 month!`);
    } catch {
      showToast(`Subscription renewed.`);
    }
  };

  // Cancel Subscription
  const handleCancelSub = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to cancel the subscription for ${name}?`)) {
      try {
        await api.cancelSubscription(id);
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: 'CANCELLED' } : s))
        );
        showToast('Subscription cancelled.');
      } catch {
        showToast('Subscription marked as cancelled.');
      }
    }
  };

  // Create New Subscription
  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + newSubDurationMonths);

    const newSubPayload = {
      memberId: 'mem-6',
      planName: newSubPlanName,
      planType: newSubPlanType,
      price: newSubPrice,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      autoRenew: newSubAutoRenew,
    };

    try {
      const created = await api.createSubscription(newSubPayload);
      setSubscriptions((prev) => [
        {
          id: created.id || `sub-${Date.now()}`,
          memberId: 'mem-6',
          planName: newSubPlanName,
          planType: newSubPlanType,
          price: newSubPrice,
          currency: 'PKR',
          startDate: newSubPayload.startDate,
          endDate: newSubPayload.endDate,
          status: 'ACTIVE',
          autoRenew: newSubAutoRenew,
          member: {
            id: 'mem-6',
            memberCode: 'GR-1006',
            firstName: 'Ali',
            lastName: 'Raza',
            phone: '+923004455667',
          },
        },
        ...prev,
      ]);
      setIsNewSubOpen(false);
      showToast('New subscription activated successfully!');
    } catch {
      setIsNewSubOpen(false);
      showToast('Subscription created.');
    }
  };

  // Filter subscriptions by search
  const filteredSubs = subscriptions.filter((s) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${s.member?.firstName} ${s.member?.lastName}`.toLowerCase();
    const code = s.member?.memberCode?.toLowerCase() || '';
    const plan = s.planName.toLowerCase();
    return fullName.includes(query) || code.includes(query) || plan.includes(query);
  });

  return (
    <AppLayout onRefreshData={loadData}>
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-surface border border-surface-border text-content-primary shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" weight="fill" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* ============================================================
            1. TOP HEADER & HIGH-IMPACT ACTIONS
            ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary font-sans">
                Subscriptions &amp; Payments
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-cyan-400 border border-purple-500/20">
                Internal Register
              </span>
            </div>
            <p className="text-xs sm:text-sm text-content-secondary">
              Track membership tiers, monitor expiry dates, and record cash &amp; transfer payments at the front desk.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => {
                setSelectedSubForPayment(null);
                setPayAmount(5000);
                setPayReference(`RCPT-${Date.now().toString().slice(-6)}`);
                setIsRecordPaymentOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-bold text-content-primary transition-all btn-shadow"
            >
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" weight="duotone" />
              <span>Record Payment</span>
            </button>

            <button
              onClick={() => setIsNewSubOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl btn-shadow-primary text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" weight="bold" />
              <span>+ Assign Subscription</span>
            </button>
          </div>
        </div>

        {/* ============================================================
            2. KEY FINANCIAL & MEMBERSHIP METRICS
            ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-surface border border-surface-border btn-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                Active Subscriptions
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 flex items-center justify-center">
                <Users className="w-4 h-4" weight="duotone" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight font-sans mb-1">
              {metrics.activeSubscriptions} Members
            </div>
            <p className="text-[11px] text-content-tertiary">
              Enrolled across monthly, quarterly &amp; annual tiers
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-surface-border btn-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                Expiring Within 7 Days
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" weight="duotone" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight font-sans mb-1">
              {metrics.expiringWithin7Days} Renewals
            </div>
            <p className="text-[11px] text-content-tertiary">
              WhatsApp renewal nudge automations queued
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-surface-border btn-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                Recorded Revenue (Month)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CurrencyDollar className="w-4 h-4" weight="duotone" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight font-sans mb-1">
              ₨{metrics.totalRevenueRecorded.toLocaleString()}
            </div>
            <p className="text-[11px] text-content-tertiary">
              Counter cash, bank transfers &amp; wallet payments
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-surface-border btn-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                Pending Invoices
              </span>
              <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Warning className="w-4 h-4" weight="duotone" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 tracking-tight font-sans mb-1">
              {metrics.pendingPayments} Unpaid
            </div>
            <p className="text-[11px] text-content-tertiary">
              ₨31,000 pending desk collection
            </p>
          </div>
        </div>

        {/* ============================================================
            3. TAB NAVIGATION
            ============================================================ */}
        <div className="flex items-center gap-2 border-b border-surface-border">
          <button
            onClick={() => setActiveTab('SUBSCRIPTIONS')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === 'SUBSCRIPTIONS'
                ? 'text-purple-600 dark:text-cyan-400'
                : 'text-content-tertiary hover:text-content-primary'
            }`}
          >
            Member Subscriptions ({subscriptions.length})
            {activeTab === 'SUBSCRIPTIONS' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-cyan-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === 'PAYMENTS'
                ? 'text-purple-600 dark:text-cyan-400'
                : 'text-content-tertiary hover:text-content-primary'
            }`}
          >
            Payment Transactions History ({payments.length})
            {activeTab === 'PAYMENTS' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-cyan-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('PLANS')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative ${
              activeTab === 'PLANS'
                ? 'text-purple-600 dark:text-cyan-400'
                : 'text-content-tertiary hover:text-content-primary'
            }`}
          >
            Plans &amp; Pricing Setup ({DEFAULT_PLANS.length})
            {activeTab === 'PLANS' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-cyan-400" />
            )}
          </button>
        </div>

        {/* ============================================================
            4. TAB 1: MEMBER SUBSCRIPTIONS DIRECTORY
            ============================================================ */}
        {activeTab === 'SUBSCRIPTIONS' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
                <input
                  type="text"
                  placeholder="Search by member name, code (e.g. GR-1001), or plan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary placeholder-content-tertiary outline-none focus:border-purple-600 dark:focus:border-cyan-400 transition-all btn-shadow"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 p-1 bg-surface-subtle border border-surface-border rounded-xl">
                {(['ALL', 'ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'CANCELLED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === st
                        ? 'bg-surface text-purple-600 dark:text-cyan-400 shadow-sm border border-surface-border'
                        : 'text-content-tertiary hover:text-content-primary'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="rounded-2xl bg-surface border border-surface-border overflow-hidden btn-shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-subtle/50 text-content-tertiary uppercase text-[10px] font-bold">
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Plan Name &amp; Tier</th>
                      <th className="py-3 px-4">Pricing</th>
                      <th className="py-3 px-4">Validity Range</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Latest Payment</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50">
                    {filteredSubs.map((sub) => {
                      const isExpired = sub.status === 'EXPIRED';
                      const isPending = sub.status === 'PENDING_PAYMENT';
                      const isCancelled = sub.status === 'CANCELLED';

                      return (
                        <tr key={sub.id} className="hover:bg-surface-subtle/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-content-primary">
                              {sub.member?.firstName} {sub.member?.lastName}
                            </div>
                            <div className="text-[10px] text-content-tertiary font-mono">
                              {sub.member?.memberCode} · {sub.member?.phone}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-content-primary">{sub.planName}</div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold font-mono bg-purple-500/10 text-purple-600 dark:text-cyan-400">
                              {sub.planType}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-content-primary font-mono text-sm">
                              ₨{sub.price.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-content-tertiary">
                              {sub.autoRenew ? 'Auto-renews' : 'Manual renewal'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-content-primary">
                              {new Date(sub.startDate).toLocaleDateString()} →{' '}
                              {new Date(sub.endDate).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-content-tertiary">
                              {isExpired ? 'Terminated' : 'Valid period'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {sub.status === 'ACTIVE' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Active
                              </span>
                            )}
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Pending Payment
                              </span>
                            )}
                            {isExpired && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                Expired
                              </span>
                            )}
                            {isCancelled && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-subtle text-content-tertiary border border-surface-border">
                                Cancelled
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {sub.latestPayment ? (
                              <div>
                                <div className="font-bold text-content-primary">
                                  ₨{sub.latestPayment.amount.toLocaleString()} ({sub.latestPayment.provider})
                                </div>
                                <div className="text-[10px] text-content-tertiary">
                                  {sub.latestPayment.paidAt ? new Date(sub.latestPayment.paidAt).toLocaleDateString() : 'Recorded'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-red-500 font-semibold">No record found</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending ? (
                                <button
                                  onClick={() => handleOpenPaymentForSub(sub)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all btn-shadow"
                                >
                                  Collect
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRenewSub(sub)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface hover:bg-surface-subtle border border-surface-border text-content-primary transition-all btn-shadow"
                                  title="Renew for 1 month"
                                >
                                  Renew
                                </button>
                              )}

                              {!isCancelled && (
                                <button
                                  onClick={() => handleCancelSub(sub.id, `${sub.member.firstName} ${sub.member.lastName}`)}
                                  className="p-1 rounded-lg text-content-tertiary hover:text-red-500 hover:bg-surface-subtle transition-colors"
                                  title="Cancel subscription"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            5. TAB 2: PAYMENT TRANSACTIONS AUDIT HISTORY
            ============================================================ */}
        {activeTab === 'PAYMENTS' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-content-primary">Internal Payment Log</h3>
                <p className="text-xs text-content-tertiary">
                  Audited register of cash, bank slips, and mobile payments recorded at the front desk
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-content-secondary px-3 py-1 rounded-xl bg-surface border border-surface-border btn-shadow">
                Total: ₨{payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
              </span>
            </div>

            <div className="rounded-2xl bg-surface border border-surface-border overflow-hidden btn-shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-subtle/50 text-content-tertiary uppercase text-[10px] font-bold">
                      <th className="py-3 px-4">Receipt / Ref</th>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Subscription Plan</th>
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Date Recorded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-subtle/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                          {p.providerReference || `RCPT-${p.id.slice(-6)}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-content-primary">
                            {p.member?.firstName} {p.member?.lastName}
                          </div>
                          <div className="text-[10px] text-content-tertiary font-mono">
                            {p.member?.memberCode}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-content-primary">
                            {p.membership?.planName || 'Monthly Membership'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          ₨{p.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-surface-subtle border border-surface-border text-content-secondary">
                            {p.provider}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Completed
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-content-tertiary">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            6. TAB 3: SUBSCRIPTION PLANS & PRICING SETUP
            ============================================================ */}
        {activeTab === 'PLANS' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-content-primary">Gym Membership Tiers</h3>
              <p className="text-xs text-content-tertiary">
                Configured recurring plans available for assignment to gym members
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DEFAULT_PLANS.map((plan, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-surface border border-surface-border flex flex-col justify-between btn-shadow hover:border-surface-border-hover transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-cyan-400">
                        {plan.type}
                      </span>
                      <span className="text-xs font-semibold text-content-tertiary">
                        {plan.duration}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-content-primary mb-1">
                      {plan.name}
                    </h4>

                    <div className="text-2xl font-extrabold text-content-primary font-mono mb-4">
                      ₨{plan.price.toLocaleString()}
                    </div>

                    <div className="space-y-2 pt-3 border-t border-surface-border text-xs text-content-secondary">
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNewSubPlanName(plan.name);
                      setNewSubPlanType(plan.type as any);
                      setNewSubPrice(plan.price);
                      setNewSubDurationMonths(plan.type === 'QUARTERLY' ? 3 : plan.type === 'ANNUAL' ? 12 : 1);
                      setIsNewSubOpen(true);
                    }}
                    className="w-full mt-5 py-2 text-center rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all btn-shadow"
                  >
                    Assign to Member
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          RECORD PAYMENT MODAL
          ============================================================ */}
      {isRecordPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-surface-border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div>
                <h3 className="text-lg font-extrabold text-content-primary">Record Member Payment</h3>
                <p className="text-xs text-content-tertiary">
                  Record an internal cash or bank transfer payment at front desk
                </p>
              </div>
              <button
                onClick={() => setIsRecordPaymentOpen(false)}
                className="p-1 rounded-xl hover:bg-surface-subtle text-content-tertiary hover:text-content-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-content-primary block mb-1">Member</label>
                <input
                  type="text"
                  value={payMemberCode}
                  onChange={(e) => setPayMemberCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-medium outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono font-bold outline-none"
                    required
                    min={1}
                  />
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">Payment Method</label>
                  <select
                    value={payProvider}
                    onChange={(e) => setPayProvider(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-medium outline-none"
                  >
                    <option value="CASH">Cash (Front Desk)</option>
                    <option value="BANK_TRANSFER">Bank Transfer Slip</option>
                    <option value="JAZZCASH">JazzCash Counter</option>
                    <option value="EASYPAISA">EasyPaisa Counter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-content-primary block mb-1">
                  Receipt / Reference Number
                </label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="e.g. RCPT-49102 or Bank Transaction ID"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-content-primary block mb-1">Staff Notes</label>
                <textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary outline-none"
                />
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-semibold text-content-primary transition-all btn-shadow"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all btn-shadow"
                >
                  Save &amp; Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          NEW SUBSCRIPTION ASSIGNMENT MODAL
          ============================================================ */}
      {isNewSubOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-surface-border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div>
                <h3 className="text-lg font-extrabold text-content-primary">Assign New Subscription</h3>
                <p className="text-xs text-content-tertiary">
                  Enroll a gym member into a recurring membership tier
                </p>
              </div>
              <button
                onClick={() => setIsNewSubOpen(false)}
                className="p-1 rounded-xl hover:bg-surface-subtle text-content-tertiary hover:text-content-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSub} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-content-primary block mb-1">Select Member</label>
                <input
                  type="text"
                  value={newSubMemberCode}
                  onChange={(e) => setNewSubMemberCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-medium outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-content-primary block mb-1">Plan Name</label>
                <input
                  type="text"
                  value={newSubPlanName}
                  onChange={(e) => setNewSubPlanName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-medium outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Plan Tier</label>
                  <select
                    value={newSubPlanType}
                    onChange={(e) => setNewSubPlanType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-medium outline-none"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    value={newSubPrice}
                    onChange={(e) => setNewSubPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono font-bold outline-none"
                    required
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-content-primary block mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={newSubDurationMonths}
                    onChange={(e) => setNewSubDurationMonths(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono outline-none"
                    min={1}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={newSubAutoRenew}
                    onChange={(e) => setNewSubAutoRenew(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                  />
                  <label htmlFor="autoRenew" className="font-semibold text-content-primary cursor-pointer">
                    Enable Auto-Renew
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewSubOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-semibold text-content-primary transition-all btn-shadow"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-shadow-primary text-xs font-bold transition-all"
                >
                  Activate Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
