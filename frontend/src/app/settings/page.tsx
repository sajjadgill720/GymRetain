'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { api } from '../../lib/api';
import {
  ShieldCheck,
  CreditCard,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Building2,
  Mail,
  RotateCw,
  X,
  Check,
} from '@/components/icons';

export default function SettingsAndBillingPage() {
  const [activeTab, setActiveTab] = useState<'BILLING' | 'TEAM' | 'CAPACITY'>('BILLING');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Billing state
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [simulating, setSimulating] = useState(false);

  // Team state
  const [staffList, setStaffList] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'STAFF' | 'TRAINER'>('STAFF');
  const [inviting, setInviting] = useState(false);

  // Capacity & Operations state
  const [capacity, setCapacity] = useState(100);
  const [policy, setPolicy] = useState<'WARNING_ONLY' | 'BLOCK_AT_CAPACITY'>('WARNING_ONLY');
  const [savingCapacity, setSavingCapacity] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [bStatus, invs, staff, invites, capStatus] = await Promise.all([
        api.getSaasBillingStatus(),
        api.getSaasInvoices(),
        api.getStaffTeam(),
        api.getStaffInvitations(),
        api.getCapacityStatus(),
      ]);
      setBillingStatus(bStatus);
      setInvoices(invs);
      setStaffList(staff);
      setInvitations(invites);
      if (capStatus?.capacity) setCapacity(capStatus.capacity);
      if (capStatus?.capacityPolicy) setPolicy(capStatus.capacityPolicy);
    } catch (error: any) {
      showToast(error?.message || 'Could not load settings. Check the connection and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Plan review never changes entitlements or claims that a payment succeeded.
  const handleReviewPlan = async (plan: 'STARTER' | 'PRO' | 'ENTERPRISE') => {
    setSimulating(true);
    try {
      showToast(`${plan} selected. Online checkout is not connected yet. No payment has been taken and your plan has not changed.`);
    } catch (err: any) {
      showToast(err?.message || 'Payment simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleCancelSub = async () => {
    if (!confirm('Are you sure you want to cancel your GymRetain SaaS subscription? Your gym data will be preserved.')) {
      return;
    }
    setSimulating(true);
    try {
      await api.cancelSaasSubscription();
      showToast('Subscription cancelled. Tenant data preserved.');
      await loadAll();
    } catch (err: any) {
      showToast(err?.message || 'Cancellation failed');
    } finally {
      setSimulating(false);
    }
  };

  // Staff invite
  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await api.inviteStaffMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      showToast(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      await loadAll();
    } catch (err: any) {
      showToast(err?.message || 'Failed to send invitation. Check staff limits.');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      await api.revokeStaffInvitation(id);
      showToast('Invitation revoked');
      await loadAll();
    } catch (err: any) {
      showToast(err?.message || 'Revocation failed');
    }
  };

  const handleUpdateRole = async (staffId: string, currentRole: string) => {
    const newRole = currentRole === 'STAFF' ? 'TRAINER' : 'STAFF';
    try {
      await api.updateStaffRole(staffId, newRole);
      showToast(`Role updated to ${newRole}`);
      await loadAll();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update role');
    }
  };

  // Save Capacity Settings
  const handleSaveCapacity = async () => {
    setSavingCapacity(true);
    try {
      await api.updateCapacity({
        capacity: Number(capacity),
        capacityPolicy: policy,
      });
      showToast('Gym floor capacity settings updated');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update capacity');
    } finally {
      setSavingCapacity(false);
    }
  };

  return (
    <AppLayout>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-surface border border-surface-border text-content-primary shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-status-success-text shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1500px] w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brass-400" />
              Gym SaaS &amp; Administration
            </h1>
            <p className="text-xs text-content-secondary mt-1">
              Manage your GymRetain software subscription, staff team access, and floor capacity settings.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-subtle border border-surface-border rounded-xl">
            <button
              onClick={() => setActiveTab('BILLING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all btn-shadow ${
                activeTab === 'BILLING'
                  ? 'bg-surface text-brand-600 dark:text-brass-400 shadow-sm border border-surface-border'
                  : 'text-content-tertiary hover:text-content-primary'
              }`}
            >
              SaaS Subscription
            </button>
            <button
              onClick={() => setActiveTab('TEAM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all btn-shadow ${
                activeTab === 'TEAM'
                  ? 'bg-surface text-brand-600 dark:text-brass-400 shadow-sm border border-surface-border'
                  : 'text-content-tertiary hover:text-content-primary'
              }`}
            >
              Team &amp; Roles
            </button>
            <button
              onClick={() => setActiveTab('CAPACITY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all btn-shadow ${
                activeTab === 'CAPACITY'
                  ? 'bg-surface text-brand-600 dark:text-brass-400 shadow-sm border border-surface-border'
                  : 'text-content-tertiary hover:text-content-primary'
              }`}
            >
              Capacity &amp; Timezone
            </button>
          </div>
        </div>

        {/* TAB 1: SAAS SUBSCRIPTION & BILLING */}
        {activeTab === 'BILLING' && (
          <div className="space-y-6">
            {/* Current Plan Overview Card */}
            <div data-tone={billingStatus?.status === 'ACTIVE' ? 'success' : billingStatus?.status === 'PAST_DUE' ? 'danger' : 'warning'} className="status-surface p-6 rounded-2xl bg-surface border border-surface-border shadow-sm btn-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brass-400">
                    Active GymRetain Software Plan
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="text-2xl font-extrabold text-content-primary">
                      {billingStatus?.plan || 'STARTER'} Plan
                    </h2>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        billingStatus?.status === 'ACTIVE'
                          ? 'bg-status-success-bg text-status-success-text border border-status-success-border'
                          : billingStatus?.status === 'TRIAL'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-brass-400 border border-blue-500/30'
                          : billingStatus?.status === 'PAST_DUE'
                          ? 'bg-status-warning-bg text-status-warning-text border border-status-warning-border'
                          : 'bg-status-danger-bg text-status-danger-text border border-status-danger-border'
                      }`}
                    >
                      {billingStatus?.status || 'TRIAL'}
                    </span>
                  </div>
                  <p className="text-xs text-content-tertiary mt-1">
                    Period Renewal / Expiry:{' '}
                    {billingStatus?.currentPeriodEnd
                      ? new Date(billingStatus.currentPeriodEnd).toLocaleDateString()
                      : 'Active'}
                  </p>
                </div>

                {billingStatus?.status !== 'CANCELLED' && (
                  <button
                    onClick={handleCancelSub}
                    disabled={simulating}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-status-danger-text hover:bg-status-danger-bg border border-status-danger-border transition-all btn-shadow self-start md:self-auto"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>

              {/* Entitlement Quotas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border">
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-content-secondary">Member Capacity Quota</span>
                    <span className="font-mono text-content-primary font-bold">
                      {billingStatus?.entitlements?.currentMemberCount || 0} /{' '}
                      {billingStatus?.entitlements?.maxMembers || 150} members
                    </span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-surface-border">
                    <div
                      className="bg-brand-600 dark:bg-brass-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((billingStatus?.entitlements?.currentMemberCount || 0) /
                              (billingStatus?.entitlements?.maxMembers || 150)) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-content-tertiary mt-1.5">
                    Server enforces member addition limit based on active plan.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border">
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-content-secondary">Staff Seat Quota</span>
                    <span className="font-mono text-content-primary font-bold">
                      {billingStatus?.entitlements?.currentStaffCount || 0} /{' '}
                      {billingStatus?.entitlements?.maxStaff || 3} staff seats
                    </span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-surface-border">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((billingStatus?.entitlements?.currentStaffCount || 0) /
                              (billingStatus?.entitlements?.maxStaff || 3)) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-content-tertiary mt-1.5">
                    Front-desk and trainer seats allowed for your gym branch.
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Starter */}
              <div className="p-5 rounded-2xl bg-surface border border-surface-border flex flex-col justify-between btn-shadow">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-content-secondary uppercase">Starter</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle text-content-tertiary">
                      Up to 150 Members
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-content-primary mb-1">
                    ₨5,000 <span className="text-xs font-normal text-content-tertiary">/month</span>
                  </div>
                  <p className="text-xs text-content-secondary mb-4">
                    For boutique studios and single-floor independent gyms.
                  </p>
                  <ul className="text-xs text-content-secondary space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-status-success-text shrink-0" />
                      <span>150 Active Members</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-status-success-text shrink-0" />
                      <span>3 Staff / Trainer Seats</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-status-success-text shrink-0" />
                      <span>QR Attendance &amp; Floor Capacity</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleReviewPlan('STARTER')}
                  disabled={simulating}
                  className="w-full py-2.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-bold text-content-primary transition-all btn-shadow"
                >
                  Review Starter
                </button>
              </div>

              {/* Pro */}
              <div className="p-5 rounded-2xl bg-surface border-2 border-brand-500/50 flex flex-col justify-between relative shadow-xl btn-shadow">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  Recommended
                </span>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-brand-600 dark:text-brass-400 uppercase">
                      Pro Retention
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brass-400">
                      Up to 500 Members
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-content-primary mb-1">
                    ₨12,000 <span className="text-xs font-normal text-content-tertiary">/month</span>
                  </div>
                  <p className="text-xs text-content-secondary mb-4">
                    For growing fitness clubs that want automated retention nudges.
                  </p>
                  <ul className="text-xs text-content-secondary space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-status-success-text shrink-0" />
                      <span>500 Active Members</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-status-success-text shrink-0" />
                      <span>10 Staff / Trainer Seats</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-status-success-text shrink-0" />
                      <span>AI Retention Radar &amp; WhatsApp Nudges</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-status-success-text shrink-0" />
                      <span>Missed check-out audit reconciliation</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleReviewPlan('PRO')}
                  disabled={simulating}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-white dark:hover:bg-zinc-200 text-xs font-bold text-white dark:text-black shadow-md btn-shadow transition-all"
                >
                  Review Pro
                </button>
              </div>

              {/* Enterprise */}
              <div className="p-5 rounded-2xl bg-surface border border-surface-border flex flex-col justify-between btn-shadow">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-content-secondary uppercase">Enterprise</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle text-content-tertiary">
                      Unlimited
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-content-primary mb-1">
                    ₨25,000 <span className="text-xs font-normal text-content-tertiary">/month</span>
                  </div>
                  <p className="text-xs text-content-secondary mb-4">
                    For gym chains and multi-branch operations.
                  </p>
                  <ul className="text-xs text-content-secondary space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-status-success-text shrink-0" />
                      <span>Unlimited Members &amp; Staff</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-status-success-text shrink-0" />
                      <span>Multi-Branch Isolation &amp; Sync</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-status-success-text shrink-0" />
                      <span>Dedicated Account Manager &amp; Custom SLA</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => handleReviewPlan('ENTERPRISE')}
                  disabled={simulating}
                  className="w-full py-2.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-bold text-content-primary transition-all btn-shadow"
                >
                  Review Enterprise
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-status-warning-bg border border-status-warning-border text-sm text-content-secondary">
              <h3 className="font-semibold text-content-primary mb-1">Online checkout is being prepared</h3>
              <p>Review the plans before choosing. Payments are not collected here yet; choosing a plan here does not change your subscription.</p>
            </div>
            {/* SaaS Invoices Table */}
            <div className="p-5 rounded-2xl bg-surface border border-surface-border btn-shadow">
              <h3 className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
                SaaS Subscription Invoices
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border text-content-tertiary">
                      <th className="pb-2">Invoice</th>
                      <th className="pb-2">Plan</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-content-tertiary">
                          No SaaS invoices recorded yet.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-2.5 font-mono text-content-primary">{inv.id.slice(0, 12)}</td>
                          <td className="py-2.5">{inv.plan}</td>
                          <td className="py-2.5 font-mono">₨{(inv.amount / 100).toLocaleString()}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success-bg text-status-success-text">
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-content-tertiary">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEAM & ROLES */}
        {activeTab === 'TEAM' && (
          <div className="space-y-6">
            {/* Invite Form */}
            <div className="p-5 rounded-2xl bg-surface border border-surface-border btn-shadow">
              <h3 className="text-sm font-bold text-content-primary mb-1">Invite New Staff Member</h3>
              <p className="text-xs text-content-secondary mb-4">
                Send an invitation to a front-desk receptionist or fitness coach.
              </p>

              <form onSubmit={handleInviteStaff} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="coach@yourgym.com"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-primary focus:border-brand-500 outline-none"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="px-4 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-primary focus:border-brand-500 outline-none"
                >
                  <option value="STAFF">Front-Desk Staff</option>
                  <option value="TRAINER">Trainer / Coach</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-white dark:hover:bg-zinc-200 text-xs font-bold text-white dark:text-black transition-all btn-shadow disabled:opacity-50"
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </form>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div className="p-5 rounded-2xl bg-surface border border-surface-border btn-shadow">
                <h3 className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
                  Pending Invitations ({invitations.length})
                </h3>
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-content-primary">{inv.email}</div>
                        <div className="text-[10px] text-content-tertiary">
                          Role: {inv.role} • Expires {new Date(inv.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="px-3 py-1 rounded-lg text-status-danger-text hover:bg-status-danger-bg border border-status-danger-border text-[11px] font-semibold btn-shadow"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Staff List */}
            <div className="p-5 rounded-2xl bg-surface border border-surface-border btn-shadow">
              <h3 className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
                Active Staff Members ({staffList.length})
              </h3>
              <div className="space-y-2.5">
                {staffList.map((st) => (
                  <div
                    key={st.id}
                    className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-content-primary">
                        {st.user?.name || 'Staff Member'}
                      </div>
                      <div className="text-[11px] text-content-tertiary font-mono">
                        {st.user?.email} • Joined {new Date(st.joinedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brass-400 border border-brand-500/20">
                        {st.role}
                      </span>
                      {st.role !== 'OWNER' && (
                        <button
                          onClick={() => handleUpdateRole(st.id, st.role)}
                          className="text-[10px] px-2.5 py-1 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface border border-surface-border btn-shadow"
                        >
                          Switch Role
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CAPACITY & TIMEZONE */}
        {activeTab === 'CAPACITY' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-surface border border-surface-border btn-shadow space-y-4">
              <h3 className="text-sm font-bold text-content-primary">
                Gym Floor Operational Capacity Settings
              </h3>
              <p className="text-xs text-content-secondary">
                Configure your gym’s physical floor capacity threshold and admission policy when crowded.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-content-secondary block mb-1">
                    Floor Capacity Limit (Headcount)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={capacity}
                    onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm font-mono font-bold text-content-primary focus:border-brand-500 outline-none"
                  />
                  <p className="text-[10px] text-content-tertiary mt-1">
                    Note: Operational guide, not a certified fire safety or municipal code.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-content-secondary block mb-1">
                    Admission Policy
                  </label>
                  <select
                    value={policy}
                    onChange={(e) => setPolicy(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-xs font-semibold text-content-primary focus:border-brand-500 outline-none"
                  >
                    <option value="WARNING_ONLY">Warning-Only Policy (Permit entry with staff alert)</option>
                    <option value="BLOCK_AT_CAPACITY">Admission-Blocking Policy (Reject until checkout)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex justify-end">
                <button
                  onClick={handleSaveCapacity}
                  disabled={savingCapacity || !Number.isInteger(capacity) || capacity < 1 || capacity > 10000}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-white dark:hover:bg-zinc-200 text-xs font-bold text-white dark:text-black shadow-md btn-shadow transition-all disabled:opacity-50"
                >
                  {savingCapacity ? 'Saving...' : 'Save Capacity Settings'}
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-surface-border btn-shadow space-y-3">
              <h3 className="text-sm font-bold text-content-primary">
                IANA Timezone &amp; Daily Boundaries
              </h3>
              <p className="text-xs text-content-secondary">
                Daily streak boundaries, reset times, and attendance statistics are calculated using your gym’s configured IANA timezone (<code className="font-mono text-brand-600 dark:text-brass-400">Asia/Karachi</code>).
              </p>
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-tertiary space-y-1">
                <div>• All database timestamps are stored uniformly in UTC.</div>
                <div>• Day boundaries use half-open intervals <code className="font-mono">[startUtc, endUtc)</code> honoring local daylight-saving transitions.</div>
                <div>• Historical attendance sessions and streaks remain intact during timezone shifts.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
