'use client';

import { Modal, ProgressRing } from '@/components/ui';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '../../components/AppLayout';
import { api } from '../../lib/api';
import { Member } from '../../types';
import {
  Users,
  Search,
  Plus,
  Flame,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  X,
  CheckCircle2,
  Filter,
  Dumbbell,
  Utensils,
  ChevronRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Copy,
  QrCode,
  ShieldAlert,
} from '@/components/icons';

function MembersDirectory() {
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loadError, setLoadError] = useState('');
  const requestId = useRef(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [trainerFilter, setTrainerFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Member Detail Story Drawer state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberDietPlans, setMemberDietPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Reassign from Member Detail
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [targetTrainerId, setTargetTrainerId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  // Member QR Credential State
  const [memberQrData, setMemberQrData] = useState<any | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const loadMemberQr = async (memberId: string) => {
    setQrLoading(true);
    try {
      const data = await api.getMemberQrCode(memberId);
      setMemberQrData(data);
    } catch {
      setMemberQrData(null);
    } finally {
      setQrLoading(false);
    }
  };

  const handleRotateMemberQr = async () => {
    if (!selectedMember) return;
    setQrLoading(true);
    try {
      const res = await api.rotateMemberQrCredential(selectedMember.id);
      setMemberQrData(res);
      setToastMessage(`New QR credential generated for ${selectedMember.firstName}. Previous code invalidated.`);
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to rotate QR credential');
    } finally {
      setQrLoading(false);
    }
  };

  const handleRevokeMemberQr = async () => {
    if (!selectedMember) return;
    setQrLoading(true);
    try {
      const res = await api.revokeMemberQrCredential(selectedMember.id);
      setMemberQrData(res);
      setToastMessage(`QR credential revoked for ${selectedMember.firstName}. Member cannot scan until re-issued.`);
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to revoke QR credential');
    } finally {
      setQrLoading(false);
    }
  };

  // New Member form state
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGender, setFormGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [formPlan, setFormPlan] = useState('Monthly Gold');
  const [formPricePaisa, setFormPricePaisa] = useState(650000); // 6,500 PKR
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchMembers = async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setLoadError('');
    try {
      const result = await api.getMembers({
        search,
        status: statusFilter || undefined,
        trainerId: trainerFilter && trainerFilter !== 'unassigned' ? trainerFilter : undefined,
        unassigned: trainerFilter === 'unassigned',
      });
      if (currentRequest === requestId.current) setMembers(result?.members || []);
    } catch (error) {
      if (currentRequest === requestId.current) {
        setMembers([]);
        setLoadError(error instanceof TypeError ? 'Could not connect. Please try again in a moment.' : error instanceof Error ? error.message : 'Could not load members. Please try again.');
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api.getTrainers().then(result => {
      if (!cancelled) {
        setTrainers(result || []);
        if (result?.length) setTargetTrainerId(result[0].id);
      }
    }).catch(() => {});
    api.getDietTemplates().then(result => { if (!cancelled) setTemplates(result || []); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    if (searchParams.get('new') === '1') setIsAddModalOpen(true);
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(fetchMembers, 200);
    return () => { clearTimeout(timer); requestId.current++; };
  }, [search, statusFilter, trainerFilter]);

  const handleOpenMemberStory = async (member: Member) => {
    setSelectedMember(member);
    loadMemberQr(member.id);
    try {
      const plans = await api.getMemberDietPlans(member.id);
      setMemberDietPlans(plans);
    } catch {
      setMemberDietPlans([]);
    }
  };

  const handleConfirmReassign = async () => {
    if (!selectedMember || !targetTrainerId) return;
    setReassigning(true);
    try {
      await api.reassignTrainer(selectedMember.id, targetTrainerId);
      const coach = trainers.find((t) => t.id === targetTrainerId);
      setToastMessage(`${selectedMember.firstName} is now assigned to Coach ${coach?.name || 'Selected Coach'}.`);
      setIsReassignOpen(false);
      await fetchMembers();
      // refresh story
      const updatedMember = members.find((m) => m.id === selectedMember.id) || selectedMember;
      setSelectedMember(updatedMember);
    } finally {
      setReassigning(false);
    }
  };

  const handleUnassignCurrentMember = async () => {
    if (!selectedMember) return;
    setReassigning(true);
    try {
      await api.unassignMember(selectedMember.id);
      setToastMessage(`${selectedMember.firstName} is now unassigned from any coach.`);
      setIsReassignOpen(false);
      await fetchMembers();
      setSelectedMember((prev) =>
        prev
          ? {
              ...prev,
              trainerAssignments: [],
            }
          : null,
      );
    } finally {
      setReassigning(false);
    }
  };

  const handleQuickCloneTemplate = async (templateId: string) => {
    if (!selectedMember) return;
    try {
      await api.cloneDietTemplate({
        templateId,
        memberId: selectedMember.id,
      });
      setToastMessage(`Template plan cloned and assigned to ${selectedMember.firstName}!`);
      const plans = await api.getMemberDietPlans(selectedMember.id);
      setMemberDietPlans(plans);
      await fetchMembers();
    } catch {
      setToastMessage('Failed to clone template');
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName || !formPhone) return;

    setFormSubmitting(true);
    try {
      await api.createMember({
        firstName: formFirstName,
        lastName: formLastName,
        phone: formPhone,
        email: formEmail || undefined,
        gender: formGender,
        planName: formPlan,
        planType: 'MONTHLY',
        planPricePaisa: formPricePaisa,
      });

      setIsAddModalOpen(false);
      setFormFirstName('');
      setFormLastName('');
      setFormPhone('');
      setFormEmail('');
      await fetchMembers();
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <AppLayout onRefreshData={fetchMembers}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {loadError && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-status-danger-border bg-status-danger-bg p-4 text-sm"><span>{loadError}</span><button onClick={fetchMembers} className="shrink-0 px-3 py-2 rounded-lg border border-surface-border text-xs font-semibold">Try again</button></div>}
        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-status-success-bg border border-status-success-border text-status-success-text px-4 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-success-text" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-zinc-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Page Context Header */}
        <div className="page-context flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600 dark:text-brass-400" />
                Member Directory
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-subtle text-content-secondary border border-surface-border">
                {members.length} Total Members
              </span>
            </div>
            <p className="text-xs text-content-tertiary mt-1">
              View member attendance streaks, assigned trainers, workout consistency, and active membership plans.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs shadow-sm btn-shadow transition-all shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-surface border border-surface-border rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, member code (e.g. GR-1001), or phone..."
              className="w-full bg-surface-subtle border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500 dark:focus:border-brass-400 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0">
            <Filter className="w-3.5 h-3.5 text-content-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="FROZEN">Frozen (On Hold)</option>
            </select>

            <select
              value={trainerFilter}
              onChange={(e) => setTrainerFilter(e.target.value)}
              className="bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
            >
              <option value="">All Coaches</option>
              <option value="unassigned">Unassigned Members</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  Coach {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-surface border border-surface-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-content-secondary">
              <thead className="bg-surface-subtle border-b border-surface-border text-[11px] uppercase tracking-wider text-content-tertiary font-semibold select-none">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Workout Streak</th>
                  <th className="py-3 px-4">Trainer</th>
                  <th className="py-3 px-4">Membership Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {members.map((member) => {
                  const currentStreak = member.streak?.currentStreak || 0;
                  const activePlan = member.memberships?.[0];
                  const activeAssignment = member.trainerAssignments?.find((a) => a.isActive);
                  const assignedTrainer = activeAssignment?.trainer;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => handleOpenMemberStory(member)}
                      className="hover:bg-surface-subtle/50 transition-colors group cursor-pointer"
                    >
                      {/* Member Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-surface-subtle border border-surface-border flex items-center justify-center text-xs font-semibold text-content-primary shrink-0">
                            {member.firstName?.[0]}
                            {member.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-medium text-content-primary group-hover:text-brand-600 dark:group-hover:text-brass-400 transition-colors">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-[11px] text-content-tertiary font-mono">
                              {member.memberCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-1.5 text-content-primary">
                          <Phone className="w-3.5 h-3.5 text-content-tertiary" />
                          <span>{member.phone}</span>
                        </div>
                        {member.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-content-tertiary mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-content-tertiary" />
                            <span>{member.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Streak Badge */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-status-warning-bg border border-status-warning-border text-status-warning-text font-mono text-xs">
                          <Flame className="w-3.5 h-3.5 text-status-warning-text" />
                          <span className="font-semibold">{currentStreak}</span>
                          <span className="text-[10px] opacity-80">days</span>
                        </div>
                      </td>

                      {/* Assigned Trainer Column */}
                      <td className="py-3.5 px-4">
                        {assignedTrainer ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-700 dark:text-brass-400 border border-brand-500/20 text-xs font-medium">
                            <Dumbbell className="w-3.5 h-3.5 text-brand-600 dark:text-brass-400" />
                            <span>Coach {assignedTrainer.name}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-surface-subtle text-content-tertiary border border-surface-border italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Active Plan */}
                      <td className="py-3.5 px-4">
                        {activePlan ? (
                          <div>
                            <div className="font-medium text-content-primary">{activePlan.planName}</div>
                            <div className="text-[11px] text-content-tertiary font-mono">
                              PKR {(activePlan.price / 100).toLocaleString()} • Exp: {activePlan.endDate}
                            </div>
                          </div>
                        ) : (
                          <span className="text-content-tertiary italic text-xs">No active plan</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                            member.status === 'ACTIVE'
                              ? 'bg-status-success-bg text-status-success-text border border-status-success-border'
                              : member.status === 'FROZEN'
                              ? 'bg-status-warning-bg text-status-warning-text border border-status-warning-border'
                              : 'bg-surface-subtle text-content-tertiary border border-surface-border'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : member.status === 'FROZEN'
                                ? 'bg-amber-500'
                                : 'bg-zinc-400'
                            }`}
                          />
                          {member.status === 'ACTIVE'
                            ? 'Active'
                            : member.status === 'FROZEN'
                            ? 'Frozen'
                            : 'Inactive'}
                        </span>
                      </td>

                      {/* Story Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs text-content-secondary hover:text-content-primary font-medium px-2.5 py-1 rounded-lg hover:bg-surface-subtle border border-surface-border transition-colors btn-shadow"
                        >
                          <span>View profile</span>
                          <ChevronRight className="w-3.5 h-3.5 text-content-tertiary" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MEMBER'S PROFILE & ATTENDANCE AT A GLANCE (Drawer / Modal) */}
      {selectedMember && (
        <Modal isOpen={!!selectedMember} onClose={() => setSelectedMember(null)} title="Member story" variant="drawer" maxWidth="xl">
          <div className="space-y-5">
            {/* Member Profile Header */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-surface-border">
              <div className="w-12 h-12 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-center text-sm font-bold text-content-primary shrink-0">
                {selectedMember.firstName?.[0]}
                {selectedMember.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-content-primary truncate">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-subtle text-content-tertiary border border-surface-border">
                    {selectedMember.memberCode}
                  </span>
                </div>
                <div className="text-xs text-content-tertiary font-mono mt-0.5">
                  {selectedMember.phone} {selectedMember.email ? `• ${selectedMember.email}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4"><ProgressRing value={selectedMember.streak?.currentStreak || 0} max={Math.max(7,selectedMember.streak?.longestStreak || 7)} label="Streak progress" /><p className="text-sm text-content-secondary">Every visit builds a stronger routine.</p></div>
            {/* Attendance & Streak Quick Glance */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border btn-shadow">
                <div className="text-[11px] text-content-tertiary font-medium">Current Streak</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <Flame className="w-4 h-4 text-status-warning-text shrink-0" />
                  <span className="text-xl font-bold font-mono text-content-primary">
                    {selectedMember.streak?.currentStreak || 0}
                  </span>
                  <span className="text-[10px] text-content-tertiary">days</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border btn-shadow">
                <div className="text-[11px] text-content-tertiary font-medium">Longest Streak</div>
                <div className="mt-1 text-xl font-bold font-mono text-content-primary">
                  {selectedMember.streak?.longestStreak || 0} <span className="text-[10px] text-content-tertiary font-normal">days</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border btn-shadow">
                <div className="text-[11px] text-content-tertiary font-medium">Membership Tier</div>
                <div className="mt-1 text-sm font-semibold text-content-primary truncate">
                  {selectedMember.memberships?.[0]?.planName || 'Monthly Gold'}
                </div>
              </div>
            </div>

            {/* Assigned Trainer Section */}
            {(() => {
              const activeAssign = selectedMember.trainerAssignments?.find((a) => a.isActive);
              const coach = activeAssign?.trainer;

              return (
                <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-brand-600 dark:text-brass-400" />
                      <span>Coaching &amp; Personal Training</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsReassignOpen(true)}
                        className="px-2.5 py-1 rounded-xl bg-surface hover:bg-surface-subtle text-content-primary text-xs font-medium border border-surface-border btn-shadow transition-colors"
                      >
                        {coach ? 'Change Coach' : '+ Assign Coach'}
                      </button>
                      {coach && (
                        <button
                          onClick={handleUnassignCurrentMember}
                          className="px-2.5 py-1 rounded-xl bg-surface hover:bg-rose-500/10 text-content-secondary hover:text-rose-500 text-xs font-medium border border-surface-border btn-shadow transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-9 h-9 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-xs font-bold text-content-secondary">
                      {coach ? coach.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : '—'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-content-primary">
                        {coach
                          ? `${selectedMember.firstName} is assigned to Coach ${coach.name}`
                          : `${selectedMember.firstName} has no coach assigned`}
                      </div>
                      <div className="text-[11px] text-content-tertiary">
                        {coach
                          ? 'Personal trainer assigned for regular guidance and workout accountability.'
                          : 'Assign an active gym trainer to guide workouts and nutrition.'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Member QR Attendance Credential Card */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-brand-600 dark:text-brass-400" />
                  <span>Member QR Attendance Credential</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    memberQrData?.status === 'ACTIVE'
                      ? 'bg-status-success-bg text-status-success-text'
                      : 'bg-status-danger-bg text-status-danger-text'
                  }`}
                >
                  {memberQrData?.status === 'ACTIVE' ? 'Active Credential' : 'Revoked'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface p-3.5 rounded-xl border border-surface-border">
                {memberQrData?.qrDataUrl ? (
                  <img
                    src={memberQrData.qrDataUrl}
                    alt="Member QR Attendance Credential"
                    className="w-32 h-32 rounded-lg border border-slate-200 p-1 shadow-sm object-contain shrink-0"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg border border-surface-border flex flex-col items-center justify-center bg-surface-subtle shrink-0">
                    <QrCode className="w-10 h-10 text-content-tertiary mb-1" />
                    <span className="text-[10px] text-content-tertiary font-mono">
                      {qrLoading ? 'Loading QR...' : 'No Credential'}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-content-secondary flex-1">
                  <p className="leading-relaxed">
                    Opaque cryptographically random token used strictly for front-desk check-in lookup. Contains no personal information.
                  </p>
                  <div className="text-[10px] text-content-tertiary font-mono">
                    Issued:{' '}
                    {memberQrData?.issuedAt
                      ? new Date(memberQrData.issuedAt).toLocaleDateString()
                      : 'Not issued'}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleRotateMemberQr}
                      disabled={qrLoading}
                      className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-[11px] transition-all btn-shadow disabled:opacity-50"
                    >
                      {qrLoading ? 'Processing...' : 'Rotate Credential'}
                    </button>
                    {memberQrData?.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={handleRevokeMemberQr}
                        disabled={qrLoading}
                        className="px-3 py-1.5 rounded-xl text-status-danger-text hover:bg-status-danger-bg border border-status-danger-border font-semibold text-[11px] transition-all btn-shadow disabled:opacity-50"
                      >
                        Revoke Credential
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Nutrition Protocol & Active Diet Plan Section */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-status-success-text" />
                  <span>Diet &amp; Meal Plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-content-tertiary">Quick assign:</span>
                  {templates.slice(0, 2).map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleQuickCloneTemplate(tpl.id)}
                      className="px-2 py-0.5 rounded bg-surface hover:bg-surface-subtle text-content-primary text-[10px] font-medium border border-surface-border btn-shadow"
                    >
                      {tpl.goal === 'WEIGHT_LOSS' ? 'Fat Loss (1800 kcal)' : 'Muscle Gain (2800 kcal)'}
                    </button>
                  ))}
                </div>
              </div>

              {memberDietPlans.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-surface-border pb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-content-primary">{memberDietPlans[0].title}</h4>
                      <p className="text-[11px] text-content-tertiary">
                        Prepared by {memberDietPlans[0].createdBy?.name || 'Assigned Coach'}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-status-success-bg text-status-success-text border border-status-success-border text-[10px] font-semibold">
                      {memberDietPlans[0].goal.replace('_', ' ')}
                    </span>
                  </div>

                  {memberDietPlans[0].notes && (
                    <div className="text-xs text-content-secondary bg-surface p-2.5 rounded-xl border border-surface-border italic">
                      &quot;{memberDietPlans[0].notes}&quot;
                    </div>
                  )}

                  {/* Meals Breakdown Table */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider">
                      Daily Meals:
                    </div>
                    <div className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface overflow-hidden text-xs">
                      {memberDietPlans[0].meals?.map((meal: any, idx: number) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-surface-subtle text-content-primary font-semibold text-[10px]">
                              {meal.mealType}
                            </span>
                            <span className="text-content-secondary">{meal.description}</span>
                          </div>
                          {(meal.calories || meal.proteinG) && (
                            <span className="text-content-tertiary font-mono text-[11px] shrink-0">
                              {meal.calories ? `${meal.calories} kcal` : ''} {meal.proteinG ? `• ${meal.proteinG}g protein` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Utensils className="w-7 h-7 text-content-tertiary mx-auto mb-1.5" />
                  <p className="text-xs font-medium text-content-secondary">No diet plan assigned yet</p>
                  <p className="text-[11px] text-content-tertiary mt-0.5">
                    Select a quick plan above or use Diet Planner to create a personalized meal plan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Reassign Trainer Sub-Modal */}
      {isReassignOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-sm w-full rounded-2xl p-5 border border-surface-border shadow-2xl relative">
            <h3 className="text-sm font-semibold text-content-primary mb-1">Assign Primary Coach</h3>
            <p className="text-xs text-content-secondary mb-3">
              Assigning coach for {selectedMember.firstName} {selectedMember.lastName}
            </p>
            <select
              value={targetTrainerId}
              onChange={(e) => setTargetTrainerId(e.target.value)}
              className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary mb-4 focus:outline-none focus:border-brand-500"
            >
              {trainers
                .filter((t) => t.isActive && !t.isArchived)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    Coach {t.name}
                  </option>
                ))}
            </select>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReassignOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-content-tertiary hover:text-content-primary btn-shadow"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reassigning}
                onClick={handleConfirmReassign}
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs btn-shadow disabled:opacity-50"
              >
                {reassigning ? 'Saving...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-lg w-full rounded-3xl p-5 sm:p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle shadow-sm btn-shadow"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brass-400 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content-primary">Add New Gym Member</h3>
                <p className="text-[11px] text-content-tertiary">Enter details to create member profile and start tracking check-ins</p>
              </div>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-content-secondary block mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    placeholder="e.g. Usman"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500 dark:focus:border-brass-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-content-secondary block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    placeholder="e.g. Khan"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500 dark:focus:border-brass-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-content-secondary block mb-1">
                    Phone (WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+923001234567"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-primary placeholder-content-tertiary font-mono focus:outline-none focus:border-brand-500 dark:focus:border-brass-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-content-secondary block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="member@email.com"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500 dark:focus:border-brass-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-content-secondary block mb-1">
                  Membership Plan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formPlan}
                    onChange={(e) => {
                      setFormPlan(e.target.value);
                      if (e.target.value === 'Monthly Standard') setFormPricePaisa(500000);
                      if (e.target.value === 'Monthly Gold') setFormPricePaisa(650000);
                      if (e.target.value === 'Quarterly VIP') setFormPricePaisa(1600000);
                    }}
                    className="bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500 dark:focus:border-brass-400"
                  >
                    <option value="Monthly Standard">Monthly Standard (5,000 PKR)</option>
                    <option value="Monthly Gold">Monthly Gold (6,500 PKR)</option>
                    <option value="Quarterly VIP">Quarterly VIP (16,000 PKR)</option>
                  </select>

                  <div className="bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-status-success-text font-mono flex items-center">
                    PKR {(formPricePaisa / 100).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-content-tertiary hover:text-content-primary transition-colors btn-shadow"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs shadow-sm btn-shadow disabled:opacity-50 transition-all"
                >
                  {formSubmitting ? 'Registering...' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function MembersPage() {
  return <Suspense fallback={<div className="p-8 text-content-secondary">Loading members…</div>}><MembersDirectory /></Suspense>;
}
