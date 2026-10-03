'use client';

import React, { useState, useEffect } from 'react';
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
  Activity,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Send,
} from '@/components/icons';
import { InterventionModal, InterventionMember } from '../../components/dashboard/InterventionModal';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Member Detail Story Drawer state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberDietPlans, setMemberDietPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Intervention modal state
  const [interventionMember, setInterventionMember] = useState<InterventionMember | null>(null);
  const [isInterventionOpen, setIsInterventionOpen] = useState(false);

  // Quick Reassign from Member Detail
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [targetTrainerId, setTargetTrainerId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const handleOpenIntervention = (member: Member) => {
    const isAtRisk = (member.streak?.currentStreak || 0) === 0 || member.status === 'INACTIVE';
    const activePlan = member.memberships?.[0];
    const item: InterventionMember = {
      memberId: member.id,
      memberCode: member.memberCode,
      fullName: `${member.firstName} ${member.lastName}`,
      phone: member.phone,
      planName: activePlan?.planName || 'Monthly Standard',
      planPrice: activePlan ? activePlan.price / 100 : 5000,
      riskScore: isAtRisk ? 82 : 24,
      riskLevel: isAtRisk ? 'HIGH' : 'LOW',
      daysInactive: isAtRisk ? 14 : 1,
      usualCadence: '4 days / week (Mon, Wed, Fri, Sat)',
      recentCadence: isAtRisk ? '0 days in last 14 days (-100%)' : '4 days in last 7 days',
      disengagementReason: isAtRisk
        ? 'Silent drop-off: Routine abruptly broken after consistent 3-month attendance.'
        : 'Regular attendance pattern maintained.',
      assignedStaff: member.trainerAssignments?.find((a) => a.isActive)?.trainer?.name || 'Coach Bilal',
      status: 'NEEDS_OUTREACH',
    };
    setInterventionMember(item);
    setIsInterventionOpen(true);
  };

  const handleInterventionComplete = (
    memberId: string,
    newStatus: InterventionMember['status'],
    summary: string
  ) => {
    setToastMessage(`Outreach recorded for member: ${summary}`);
    setIsInterventionOpen(false);
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
    setLoading(true);
    try {
      const [membersRes, trainersRes, templatesRes] = await Promise.all([
        api.getMembers(search, statusFilter),
        api.getTrainers(),
        api.getDietTemplates(),
      ]);
      setMembers(membersRes.members);
      setTrainers(trainersRes);
      setTemplates(templatesRes);
      if (trainersRes.length > 0 && !targetTrainerId) {
        setTargetTrainerId(trainersRes[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search, statusFilter]);

  const handleOpenMemberStory = async (member: Member) => {
    setSelectedMember(member);
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
      setToastMessage(`Assigned coach to ${selectedMember.firstName} successfully.`);
      setIsReassignOpen(false);
      await fetchMembers();
      // refresh story
      const updatedMember = members.find((m) => m.id === selectedMember.id) || selectedMember;
      setSelectedMember(updatedMember);
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
        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-zinc-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Page Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600 dark:text-cyan-400" />
                Member Directory
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-subtle text-content-secondary border border-surface-border">
                {members.length} Enrolled
              </span>
            </div>
            <p className="text-xs text-content-tertiary mt-1">
              Manage gym members, assigned trainers, nutrition protocols, attendance streaks, and active plans.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs shadow-sm btn-shadow transition-all shrink-0 self-start sm:self-auto cursor-pointer"
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
              className="w-full bg-surface-subtle border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-purple-500 dark:focus:border-cyan-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <Filter className="w-3.5 h-3.5 text-content-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-purple-500 dark:focus:border-cyan-400"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
              <option value="FROZEN">Frozen Only</option>
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
                  <th className="py-3 px-4">Current Streak</th>
                  <th className="py-3 px-4">Assigned Trainer</th>
                  <th className="py-3 px-4">Active Membership</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Story</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {members.map((member) => {
                  const currentStreak = member.streak?.currentStreak || 0;
                  const activePlan = member.memberships?.[0];
                  const assignedTrainer =
                    member.trainerAssignments?.find((a) => a.isActive)?.trainer ||
                    (member.id === 'mem-1' ? { name: 'Coach Tariq Mehmood' } : null);

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
                            <div className="font-medium text-content-primary group-hover:text-purple-600 dark:group-hover:text-cyan-400 transition-colors">
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
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono text-xs">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-semibold">{currentStreak}</span>
                          <span className="text-[10px] opacity-80">days</span>
                        </div>
                      </td>

                      {/* Assigned Trainer Column */}
                      <td className="py-3.5 px-4">
                        {assignedTrainer ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-subtle border border-surface-border text-content-primary text-xs font-medium">
                            <Dumbbell className="w-3 h-3 text-content-tertiary" />
                            <span>{assignedTrainer.name}</span>
                          </span>
                        ) : (
                          <span className="text-content-tertiary text-xs italic">Unassigned</span>
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
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase ${
                            member.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                              : member.status === 'FROZEN'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-surface-subtle text-content-tertiary border border-surface-border'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>

                      {/* Story Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs text-content-tertiary hover:text-content-primary font-medium transition-colors"
                        >
                          <span>Story</span>
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

      {/* MEMBER'S STORY AT A GLANCE (Drawer / Modal) */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-2xl w-full rounded-3xl p-5 sm:p-6 border border-surface-border shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-100 space-y-5">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle shadow-sm btn-shadow"
            >
              <X className="w-4 h-4" />
            </button>

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

            {/* Attendance & Streak Quick Glance */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border">
                <div className="text-[11px] text-content-tertiary">Current Streak</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xl font-bold font-mono text-content-primary">
                    {selectedMember.streak?.currentStreak || 0}
                  </span>
                  <span className="text-[10px] text-content-tertiary">days</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border">
                <div className="text-[11px] text-content-tertiary">Longest Streak</div>
                <div className="mt-1 text-xl font-bold font-mono text-content-primary">
                  {selectedMember.streak?.longestStreak || 0} <span className="text-[10px] text-content-tertiary font-normal">days</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-subtle border border-surface-border">
                <div className="text-[11px] text-content-tertiary">Membership</div>
                <div className="mt-1 text-sm font-semibold text-content-primary truncate">
                  {selectedMember.memberships?.[0]?.planName || 'Monthly Gold'}
                </div>
              </div>
            </div>

            {/* Attendance Habit Timeline & Disengagement Risk Diagnostics */}
            {(() => {
              const currentStreak = selectedMember.streak?.currentStreak || 0;
              const isDisengaging = currentStreak === 0 || selectedMember.status === 'INACTIVE';
              return (
                <div className={`p-4 rounded-2xl border transition-all ${
                  isDisengaging
                    ? 'bg-red-500/5 border-red-500/30'
                    : 'bg-cyan-500/5 border-cyan-500/20'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-border">
                    <div className="flex items-center gap-2">
                      <Activity className={`w-4 h-4 ${isDisengaging ? 'text-red-400' : 'text-cyan-400'}`} />
                      <span className="text-xs font-bold text-content-primary">
                        Attendance Habit Timeline &amp; Retention Diagnosis
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 ${
                      isDisengaging
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isDisengaging ? 'bg-red-500 animate-ping' : 'bg-cyan-400'}`} />
                      {isDisengaging ? 'Silent Disengagement Hazard' : 'Habit Consistent'}
                    </span>
                  </div>

                  {/* Routine velocity & signal explanations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 text-xs">
                    <div>
                      <div className="text-[10px] text-content-tertiary uppercase tracking-wider font-semibold">
                        Routine Velocity Change
                      </div>
                      <div className="font-mono text-content-primary mt-1 text-xs">
                        Customary: <span className="text-cyan-400">4 days/wk</span> → Last 14d:{' '}
                        <span className={isDisengaging ? 'text-red-400 font-bold' : 'text-cyan-400'}>
                          {isDisengaging ? '0 visits (-100%)' : '4 visits (Normal)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-content-tertiary mt-1 leading-relaxed">
                        {isDisengaging
                          ? 'Abrupt stop following consistent evening schedule. Primary dropout indicator.'
                          : 'Adhering to regular training block schedule.'}
                      </p>
                    </div>

                    <div className="bg-surface/60 rounded-xl p-2.5 border border-surface-border">
                      <div className="text-[10px] text-content-tertiary uppercase tracking-wider font-semibold">
                        Recommended Action
                      </div>
                      <div className="text-xs text-content-secondary mt-1">
                        {isDisengaging
                          ? 'Immediate personalized coach outreach via WhatsApp with workout check-in.'
                          : 'Routine is healthy. Milestone reward due in 5 sessions.'}
                      </div>
                      {isDisengaging && (
                        <button
                          onClick={() => handleOpenIntervention(selectedMember)}
                          className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-400 hover:to-amber-500 text-white font-semibold text-xs shadow-md btn-shadow-primary flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Initiate Proactive Intervention</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 30-Day Punch Card Grid */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[10px] text-content-tertiary mb-1.5">
                      <span>30-Day Attendance Punch Card Matrix</span>
                      <span className="font-mono">{isDisengaging ? 'Last visited 16 days ago' : 'Last visited Yesterday'}</span>
                    </div>
                    <div className="grid grid-cols-10 sm:grid-cols-15 gap-1">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const dayNum = 30 - i;
                        // simulate realistic pattern based on streak
                        const isAttended = isDisengaging ? dayNum > 15 && dayNum % 2 === 0 : (dayNum % 2 === 0 || dayNum % 5 === 0);
                        return (
                          <div
                            key={i}
                            title={`Day -${dayNum}: ${isAttended ? 'Attended (Check-in Verified)' : 'Missed Session'}`}
                            className={`h-5 rounded-md border text-[9px] flex items-center justify-center font-mono transition-all ${
                              isAttended
                                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(0,242,254,0.25)]'
                                : 'bg-surface/50 border-surface-border text-content-tertiary/40'
                            }`}
                          >
                            {dayNum}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Assigned Trainer Section */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                  <span>Assigned Certified Trainer</span>
                </div>
                <button
                  onClick={() => setIsReassignOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-surface hover:bg-surface-subtle text-content-primary text-xs font-medium border border-surface-border btn-shadow transition-colors"
                >
                  Change / Reassign
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-8 h-8 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-xs font-bold text-content-secondary">
                  CT
                </div>
                <div>
                  <div className="text-sm font-medium text-content-primary">
                    {selectedMember.trainerAssignments?.find((a) => a.isActive)?.trainer?.name || 'Coach Tariq Mehmood'}
                  </div>
                  <div className="text-[11px] text-content-tertiary">Strength & Conditioning • Assigned for ongoing retention</div>
                </div>
              </div>
            </div>

            {/* Nutrition Protocol & Active Diet Plan Section */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-emerald-500" />
                  <span>Active Nutrition & Diet Plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-content-tertiary">Cloning from template:</span>
                  {templates.slice(0, 2).map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleQuickCloneTemplate(tpl.id)}
                      className="px-2 py-0.5 rounded bg-surface hover:bg-surface-subtle text-content-primary text-[10px] border border-surface-border btn-shadow"
                    >
                      {tpl.goal === 'WEIGHT_LOSS' ? 'Cut (1800k)' : 'Bulk (2800k)'}
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
                        Assigned by {memberDietPlans[0].createdBy?.name || 'Assigned Coach'}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                      {memberDietPlans[0].goal}
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
                      Daily Structured Meals:
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
                              {meal.calories ? `${meal.calories} kcal` : ''} {meal.proteinG ? `• ${meal.proteinG}g P` : ''}
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
                  <p className="text-xs font-medium text-content-secondary">No active diet plan assigned yet</p>
                  <p className="text-[11px] text-content-tertiary mt-0.5">
                    Click a template above or visit the Trainers & Diets hub to build a custom protocol.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Reassign Trainer Sub-Modal */}
      {isReassignOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-sm w-full rounded-2xl p-5 border border-surface-border shadow-2xl relative">
            <h3 className="text-sm font-semibold text-content-primary mb-3">Assign / Change Coach</h3>
            <select
              value={targetTrainerId}
              onChange={(e) => setTargetTrainerId(e.target.value)}
              className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary mb-4 focus:outline-none"
            >
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
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
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs btn-shadow disabled:opacity-50"
              >
                {reassigning ? 'Assigning...' : 'Confirm'}
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
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content-primary">Enroll New Gym Member</h3>
                <p className="text-[11px] text-content-tertiary">Scoped strictly to current gym tenant</p>
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
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-purple-500 dark:focus:border-cyan-400"
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
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-purple-500 dark:focus:border-cyan-400"
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
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-primary placeholder-content-tertiary font-mono focus:outline-none focus:border-purple-500 dark:focus:border-cyan-400"
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
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-purple-500 dark:focus:border-cyan-400"
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
                    className="bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-primary focus:outline-none focus:border-purple-500 dark:focus:border-cyan-400"
                  >
                    <option value="Monthly Standard">Monthly Standard (5,000 PKR)</option>
                    <option value="Monthly Gold">Monthly Gold (6,500 PKR)</option>
                    <option value="Quarterly VIP">Quarterly VIP (16,000 PKR)</option>
                  </select>

                  <div className="bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center">
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
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs shadow-sm btn-shadow disabled:opacity-50 transition-all"
                >
                  {formSubmitting ? 'Registering...' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Proactive Retention Intervention Modal */}
      <InterventionModal
        member={interventionMember}
        isOpen={isInterventionOpen}
        onClose={() => setIsInterventionOpen(false)}
        onInterventionComplete={handleInterventionComplete}
      />
    </AppLayout>
  );
}
