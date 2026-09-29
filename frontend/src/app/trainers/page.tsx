'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { api } from '../../lib/api';
import {
  Users,
  Dumbbell,
  Search,
  Plus,
  Flame,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Shield,
  Utensils,
  ChevronRight,
  X,
  Sparkles,
  Send,
  Copy,
  Edit2,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface AssignedClient {
  assignmentId: string;
  assignedAt: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberCode: string;
    phone: string;
    status: string;
    currentStreak: number;
    longestStreak: number;
    totalCheckIns: number;
  };
  dietPlan: {
    id: string | null;
    title: string | null;
    goal: string | null;
    customGoal: string | null;
    mealsCount: number;
    updatedAt: string | null;
    status: 'ACTIVE_PLAN' | 'NO_PLAN';
  };
}

interface TrainerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  assignedMembersCount: number;
  createdAt: string;
}

export default function TrainersPage() {
  const [viewMode, setViewMode] = useState<'ROSTER' | 'CLIENTS'>('CLIENTS');
  const [trainers, setTrainers] = useState<TrainerItem[]>([]);
  const [clients, setClients] = useState<AssignedClient[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reassignment Modal state
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignMember, setReassignMember] = useState<AssignedClient['member'] | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  // Diet View Modal state
  const [isViewPlanOpen, setIsViewPlanOpen] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<any | null>(null);
  const [viewingMember, setViewingMember] = useState<AssignedClient['member'] | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Diet Builder Modal state
  const [isDietBuilderOpen, setIsDietBuilderOpen] = useState(false);
  const [selectedMemberForDiet, setSelectedMemberForDiet] = useState<AssignedClient['member'] | null>(null);
  const [dietTitle, setDietTitle] = useState('');
  const [dietGoal, setDietGoal] = useState<'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'CUSTOM'>('WEIGHT_LOSS');
  const [dietCustomGoal, setDietCustomGoal] = useState('');
  const [dietNotes, setDietNotes] = useState('');
  const [dietMeals, setDietMeals] = useState<Array<{ mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'; description: string; calories?: number; proteinG?: number; carbsG?: number; fatG?: number }>>([
    { mealType: 'BREAKFAST', description: '3 boiled eggs, 1 brown toast, green tea', calories: 280, proteinG: 20 },
    { mealType: 'LUNCH', description: '150g grilled chicken, 1 cup brown rice, salad', calories: 450, proteinG: 42 },
    { mealType: 'DINNER', description: '200g white fish, steamed vegetables', calories: 350, proteinG: 38 },
  ]);
  const [dietSubmitting, setDietSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trainersData, clientsData, templatesData] = await Promise.all([
        api.getTrainers(),
        api.getTrainerMembers(),
        api.getDietTemplates(),
      ]);
      setTrainers(trainersData);
      setClients(clientsData);
      setTemplates(templatesData);
      if (trainersData.length > 0 && !selectedTrainerId) {
        setSelectedTrainerId(trainersData[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReassign = (member: AssignedClient['member']) => {
    setReassignMember(member);
    setIsReassignOpen(true);
  };

  const handleConfirmReassign = async () => {
    if (!reassignMember || !selectedTrainerId) return;
    setReassignSubmitting(true);
    try {
      await api.reassignTrainer(reassignMember.id, selectedTrainerId);
      setToastMessage(`Reassigned ${reassignMember.firstName} ${reassignMember.lastName} successfully.`);
      setIsReassignOpen(false);
      await fetchData();
    } finally {
      setReassignSubmitting(false);
    }
  };

  const handleViewDietPlan = async (member: AssignedClient['member']) => {
    setViewingMember(member);
    setIsViewPlanOpen(true);
    setLoadingPlan(true);
    try {
      const plans = await api.getMemberDietPlans(member.id);
      if (plans && plans.length > 0) {
        setViewingPlan(plans[0]);
      } else {
        setViewingPlan(null);
      }
    } catch {
      setViewingPlan(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleOpenDietBuilder = (member: AssignedClient['member']) => {
    setSelectedMemberForDiet(member);
    setDietTitle(`Tailored Nutrition — ${member.firstName}`);
    setIsDietBuilderOpen(true);
  };

  const handleApplyTemplate = (tpl: any) => {
    setDietTitle(tpl.title);
    setDietGoal(tpl.goal);
    setDietNotes(tpl.description || '');
    setDietMeals(tpl.mealsJson || []);
  };

  const handleAddMealRow = () => {
    setDietMeals([
      ...dietMeals,
      { mealType: 'SNACK', description: 'Handful of almonds & whey shake', calories: 200, proteinG: 24 },
    ]);
  };

  const handleRemoveMealRow = (index: number) => {
    setDietMeals(dietMeals.filter((_, i) => i !== index));
  };

  const handleUpdateMeal = (index: number, field: string, value: any) => {
    const updated = [...dietMeals];
    updated[index] = { ...updated[index], [field]: value };
    setDietMeals(updated);
  };

  const handleSaveDietPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForDiet || !dietTitle) return;

    setDietSubmitting(true);
    try {
      await api.createDietPlan({
        memberId: selectedMemberForDiet.id,
        title: dietTitle,
        goal: dietGoal,
        customGoal: dietGoal === 'CUSTOM' ? dietCustomGoal : undefined,
        notes: dietNotes,
        meals: dietMeals.map((m, idx) => ({ ...m, orderIndex: idx })),
        sendWhatsAppNotification: true,
      });

      setToastMessage(`Active diet plan created & sent via WhatsApp to ${selectedMemberForDiet.firstName}!`);
      setIsDietBuilderOpen(false);
      await fetchData();
    } finally {
      setDietSubmitting(false);
    }
  };

  // Filtered clients
  const filteredClients = clients.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.member.firstName.toLowerCase().includes(term) ||
      c.member.lastName.toLowerCase().includes(term) ||
      c.member.memberCode.toLowerCase().includes(term) ||
      c.member.phone.includes(term)
    );
  });

  return (
    <AppLayout onRefreshData={fetchData}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Toast Notification */}
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

        {/* 1. Header & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-zinc-800/60">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-zinc-300" />
                Trainers & Nutrition Hub
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                {trainers.length} Certified Trainers
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Trainer assignments, active client streak monitoring, and structured nutrition plan builder.
            </p>
          </div>

          {/* Perspective View Switcher */}
          <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-lg border border-zinc-800 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('CLIENTS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'CLIENTS'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>My Assigned Clients ({clients.length})</span>
            </button>
            <button
              onClick={() => setViewMode('ROSTER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'ROSTER'
                  ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Trainer Roster ({trainers.length})</span>
            </button>
          </div>
        </div>

        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium">Active Trainer Roster</span>
              <Dumbbell className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
              {trainers.length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Qualified coaching staff</p>
          </div>

          <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium">Assigned Clients</span>
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100 font-mono">
              {clients.length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Under direct trainer guidance</p>
          </div>

          <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium">Active Diet Plans</span>
              <Utensils className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-emerald-400 font-mono">
              {clients.filter((c) => c.dietPlan.status === 'ACTIVE_PLAN').length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Structured meals assigned</p>
          </div>

          <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium">Plans Pending Setup</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-amber-400 font-mono">
              {clients.filter((c) => c.dietPlan.status === 'NO_PLAN').length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Requires nutrition assignment</p>
          </div>
        </div>

        {/* 3. Search & Quick Filters */}
        <div className="bg-[#121215] border border-zinc-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assigned client by name, code, or phone..."
              className="w-full bg-[#18181B] border border-zinc-700/80 rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <span className="text-[11px] text-zinc-500">
              Showing {viewMode === 'CLIENTS' ? filteredClients.length : trainers.length} items
            </span>
          </div>
        </div>

        {/* 4. Main View Content */}
        {viewMode === 'CLIENTS' ? (
          /* TRAINER VIEW: Assigned Clients List */
          <div className="bg-[#121215] border border-zinc-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#18181B]/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold select-none">
                  <tr>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Workout Streak</th>
                    <th className="py-3 px-4">Total Check-Ins</th>
                    <th className="py-3 px-4">Nutrition Plan Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredClients.map((item) => {
                    const hasPlan = item.dietPlan.status === 'ACTIVE_PLAN';

                    return (
                      <tr key={item.assignmentId} className="hover:bg-zinc-800/30 transition-colors">
                        {/* Member */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-200">
                              {item.member.firstName?.[0]}
                              {item.member.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-medium text-zinc-100">
                                {item.member.firstName} {item.member.lastName}
                              </div>
                              <div className="text-[11px] text-zinc-500 font-mono">
                                {item.member.memberCode} • {item.member.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Streak */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-xs">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-semibold">{item.member.currentStreak}</span>
                            <span className="text-[10px] text-zinc-400">days</span>
                          </div>
                        </td>

                        {/* Check-Ins */}
                        <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">
                          {item.member.totalCheckIns} check-ins
                        </td>

                        {/* Diet Plan Status */}
                        <td className="py-3.5 px-4">
                          {hasPlan ? (
                            <button
                              onClick={() => handleViewDietPlan(item.member)}
                              className="text-left space-y-0.5 group cursor-pointer focus:outline-none block"
                              title="Click to view daily meal breakdown & macros"
                            >
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>{item.dietPlan.title}</span>
                                <Eye className="w-3 h-3 text-emerald-400/70 group-hover:text-emerald-300 ml-0.5" />
                              </span>
                              <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                                <span>{item.dietPlan.goal}</span>
                                <span>•</span>
                                <span>{item.dietPlan.mealsCount} Meals</span>
                                <span className="text-zinc-400 underline decoration-zinc-600 group-hover:text-emerald-400">View</span>
                              </div>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium">
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              No Plan Assigned
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasPlan && (
                              <button
                                onClick={() => handleViewDietPlan(item.member)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#18181B] hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 shadow-sm btn-shadow transition-colors"
                              >
                                <Eye className="w-3 h-3 text-zinc-400" />
                                <span>View Plan</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenDietBuilder(item.member)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 shadow-sm btn-shadow transition-colors"
                            >
                              <Utensils className="w-3 h-3 text-zinc-300" />
                              <span>{hasPlan ? 'Edit Plan' : '+ Build Plan'}</span>
                            </button>
                            <button
                              onClick={() => handleOpenReassign(item.member)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#18181B] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs border border-zinc-800 btn-shadow transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Reassign</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredClients.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-zinc-300">No assigned clients found</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Assign members to this trainer from the Member Directory or Trainer Roster.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* OWNER VIEW: Trainer Roster */
          <div className="bg-[#121215] border border-zinc-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#18181B]/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold select-none">
                  <tr>
                    <th className="py-3 px-4">Trainer Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Assigned Active Members</th>
                    <th className="py-3 px-4">Staff Role</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {trainers.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-zinc-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
                          {t.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span>{t.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        <div>{t.email}</div>
                        <div className="text-[11px] text-zinc-500">{t.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-zinc-800 text-zinc-200 border border-zinc-700">
                          <Users className="w-3 h-3 text-zinc-400" />
                          {t.assignedMembersCount} Members
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                          {t.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Diet Plan Builder Modal */}
        {isDietBuilderOpen && selectedMemberForDiet && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#121215] max-w-2xl w-full rounded-lg p-5 sm:p-6 border border-zinc-800 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => setIsDietBuilderOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 shadow-sm btn-shadow"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">Structured Nutrition Plan Builder</h3>
                  <p className="text-xs text-zinc-400">
                    Assigning to: <span className="text-zinc-200 font-medium">{selectedMemberForDiet.firstName} {selectedMemberForDiet.lastName}</span> ({selectedMemberForDiet.memberCode})
                  </p>
                </div>
              </div>

              {/* Template Quick Clone Strip */}
              <div className="p-3 rounded-lg bg-[#18181B] border border-zinc-800 mb-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Start from Standard Template:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs border border-zinc-700 transition-colors btn-shadow flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>{tpl.title.split('(')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSaveDietPlan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1">Plan Title *</label>
                    <input
                      type="text"
                      required
                      value={dietTitle}
                      onChange={(e) => setDietTitle(e.target.value)}
                      placeholder="e.g. 1,800 kcal Fat Loss Plan"
                      className="w-full bg-[#18181B] border border-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1">Nutrition Goal *</label>
                    <select
                      value={dietGoal}
                      onChange={(e: any) => setDietGoal(e.target.value)}
                      className="w-full bg-[#18181B] border border-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                    >
                      <option value="WEIGHT_LOSS">Weight Loss / Fat Loss</option>
                      <option value="MUSCLE_GAIN">Muscle Gain / Hypertrophy</option>
                      <option value="MAINTENANCE">Maintenance / Clean Athlete</option>
                      <option value="CUSTOM">Custom Goal</option>
                    </select>
                  </div>
                </div>

                {dietGoal === 'CUSTOM' && (
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1">Custom Goal Name</label>
                    <input
                      type="text"
                      value={dietCustomGoal}
                      onChange={(e) => setDietCustomGoal(e.target.value)}
                      placeholder="e.g. Contest Prep Peak Week"
                      className="w-full bg-[#18181B] border border-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                )}

                {/* Structured Meal List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">Daily Meals Breakdown</label>
                    <button
                      type="button"
                      onClick={handleAddMealRow}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Meal</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {dietMeals.map((meal, index) => (
                      <div key={index} className="p-3 rounded-md bg-[#18181B] border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={meal.mealType}
                            onChange={(e: any) => handleUpdateMeal(index, 'mealType', e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 font-semibold focus:outline-none"
                          >
                            <option value="BREAKFAST">BREAKFAST</option>
                            <option value="LUNCH">LUNCH</option>
                            <option value="DINNER">DINNER</option>
                            <option value="SNACK">SNACK</option>
                          </select>

                          {dietMeals.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMealRow(index)}
                              className="text-zinc-500 hover:text-red-400 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div>
                          <input
                            type="text"
                            value={meal.description}
                            onChange={(e) => handleUpdateMeal(index, 'description', e.target.value)}
                            placeholder="Meal contents: e.g. 150g grilled chicken, 1 cup brown rice..."
                            className="w-full bg-[#121215] border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Calories (kcal)</span>
                            <input
                              type="number"
                              placeholder="e.g. 400"
                              value={meal.calories || ''}
                              onChange={(e) => handleUpdateMeal(index, 'calories', parseInt(e.target.value, 10) || undefined)}
                              className="w-full bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                            />
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Protein (g)</span>
                            <input
                              type="number"
                              placeholder="e.g. 35"
                              value={meal.proteinG || ''}
                              onChange={(e) => handleUpdateMeal(index, 'proteinG', parseFloat(e.target.value) || undefined)}
                              className="w-full bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                            />
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Carbs (g)</span>
                            <input
                              type="number"
                              placeholder="e.g. 40"
                              value={meal.carbsG || ''}
                              onChange={(e) => handleUpdateMeal(index, 'carbsG', parseFloat(e.target.value) || undefined)}
                              className="w-full bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                            />
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Fat (g)</span>
                            <input
                              type="number"
                              placeholder="e.g. 12"
                              value={meal.fatG || ''}
                              onChange={(e) => handleUpdateMeal(index, 'fatG', parseFloat(e.target.value) || undefined)}
                              className="w-full bg-[#121215] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trainer Notes */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1">Coach Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={dietNotes}
                    onChange={(e) => setDietNotes(e.target.value)}
                    placeholder="e.g. Maintain hydration (3.5L/day), do not skip breakfast, post-workout within 45 min."
                    className="w-full bg-[#18181B] border border-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Delivery Notice */}
                <div className="p-3 rounded-md bg-zinc-800/40 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp utility notification will automatically dispatch to member ({selectedMemberForDiet.phone})</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsDietBuilderOpen(false)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors btn-shadow"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dietSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs shadow-sm btn-shadow-primary disabled:opacity-50 transition-all"
                  >
                    {dietSubmitting ? 'Saving...' : 'Save & Assign Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. Reassign Trainer Modal */}
        {isReassignOpen && reassignMember && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#121215] max-w-md w-full rounded-lg p-5 border border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => setIsReassignOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 shadow-sm btn-shadow"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Reassign Member Coach</h3>
                  <p className="text-[11px] text-zinc-500">
                    Client: {reassignMember.firstName} {reassignMember.lastName} ({reassignMember.memberCode})
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Select Certified Trainer</label>
                  <select
                    value={selectedTrainerId}
                    onChange={(e) => setSelectedTrainerId(e.target.value)}
                    className="w-full bg-[#18181B] border border-zinc-700 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                  >
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.assignedMembersCount} active clients)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-md bg-[#18181B] border border-zinc-800 text-[11px] text-zinc-400">
                  Previous assignment history is preserved as inactive records for audit tracking.
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsReassignOpen(false)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 btn-shadow"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={reassignSubmitting}
                    onClick={handleConfirmReassign}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs shadow-sm btn-shadow-primary disabled:opacity-50 transition-all"
                  >
                    {reassignSubmitting ? 'Updating...' : 'Confirm Reassignment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. View Diet Plan Details Modal */}
        {isViewPlanOpen && viewingMember && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#121215] max-w-2xl w-full max-h-[90vh] flex flex-col rounded-lg border border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-100">
                        {viewingPlan?.title || 'Nutrition & Diet Protocol'}
                      </h3>
                      {viewingPlan?.isActive && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Member: {viewingMember.firstName} {viewingMember.lastName} ({viewingMember.memberCode}) • {viewingMember.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsViewPlanOpen(false)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 btn-shadow"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {loadingPlan ? (
                  <div className="py-12 text-center text-xs text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-500" />
                    Loading diet plan details...
                  </div>
                ) : !viewingPlan ? (
                  <div className="py-10 text-center">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-zinc-200">No active diet plan found</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      This member currently does not have an active nutrition plan assigned.
                    </p>
                    <button
                      onClick={() => {
                        setIsViewPlanOpen(false);
                        handleOpenDietBuilder(viewingMember);
                      }}
                      className="mt-4 px-3.5 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs shadow-sm btn-shadow-primary"
                    >
                      + Create Plan Now
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Meta & Goal Banner */}
                    <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] text-zinc-500">Target Objective</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-zinc-200 text-xs">
                            {viewingPlan.goal === 'CUSTOM' ? viewingPlan.customGoal : viewingPlan.goal?.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                            {viewingPlan.meals?.length || 0} Scheduled Meals / Day
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-[11px] text-zinc-500">Supervising Coach</div>
                        <div className="text-xs font-medium text-zinc-300">
                          {viewingPlan.createdBy?.name || 'Assigned Coach'}
                        </div>
                      </div>
                    </div>

                    {/* Macronutrient Summary Cards */}
                    {(() => {
                      const totalCals = viewingPlan.meals?.reduce((acc: number, m: any) => acc + (m.calories || 0), 0) || 0;
                      const totalProtein = viewingPlan.meals?.reduce((acc: number, m: any) => acc + (m.proteinG || 0), 0) || 0;
                      const totalCarbs = viewingPlan.meals?.reduce((acc: number, m: any) => acc + (m.carbsG || 0), 0) || 0;
                      const totalFat = viewingPlan.meals?.reduce((acc: number, m: any) => acc + (m.fatG || 0), 0) || 0;

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="bg-[#18181B] border border-zinc-800/90 rounded-md p-2.5">
                            <span className="text-[10px] uppercase font-semibold text-zinc-500">Total Energy</span>
                            <div className="text-base font-semibold text-zinc-100 font-mono mt-0.5">
                              {totalCals > 0 ? `${totalCals} kcal` : 'Custom'}
                            </div>
                          </div>
                          <div className="bg-[#18181B] border border-zinc-800/90 rounded-md p-2.5">
                            <span className="text-[10px] uppercase font-semibold text-emerald-400">Protein</span>
                            <div className="text-base font-semibold text-emerald-300 font-mono mt-0.5">
                              {totalProtein > 0 ? `${totalProtein}g` : '—'}
                            </div>
                          </div>
                          <div className="bg-[#18181B] border border-zinc-800/90 rounded-md p-2.5">
                            <span className="text-[10px] uppercase font-semibold text-amber-400">Carbohydrates</span>
                            <div className="text-base font-semibold text-amber-300 font-mono mt-0.5">
                              {totalCarbs > 0 ? `${totalCarbs}g` : '—'}
                            </div>
                          </div>
                          <div className="bg-[#18181B] border border-zinc-800/90 rounded-md p-2.5">
                            <span className="text-[10px] uppercase font-semibold text-zinc-400">Healthy Fats</span>
                            <div className="text-base font-semibold text-zinc-300 font-mono mt-0.5">
                              {totalFat > 0 ? `${totalFat}g` : '—'}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Daily Meal Breakdown */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
                          Daily Structured Meals
                        </span>
                        <span className="text-zinc-500 text-[11px] font-mono">
                          {viewingPlan.meals?.length || 0} Meals
                        </span>
                      </div>

                      <div className="space-y-2 divide-y-0">
                        {viewingPlan.meals?.map((meal: any, idx: number) => {
                          const badgeColor =
                            meal.mealType === 'BREAKFAST'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : meal.mealType === 'LUNCH'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : meal.mealType === 'DINNER'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20';

                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-[#18181B] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                            >
                              <div className="flex items-start gap-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${badgeColor}`}
                                >
                                  {meal.mealType}
                                </span>
                                <span className="text-xs text-zinc-200 leading-relaxed">
                                  {meal.description}
                                </span>
                              </div>

                              {(meal.calories || meal.proteinG || meal.carbsG || meal.fatG) && (
                                <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono text-zinc-400 self-end sm:self-auto">
                                  {meal.calories && (
                                    <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300">
                                      {meal.calories} kcal
                                    </span>
                                  )}
                                  {meal.proteinG && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                                      {meal.proteinG}g P
                                    </span>
                                  )}
                                  {meal.carbsG && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                                      {meal.carbsG}g C
                                    </span>
                                  )}
                                  {meal.fatG && (
                                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                      {meal.fatG}g F
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Coach Notes */}
                    {viewingPlan.notes && (
                      <div>
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                          Coach Instructions & Notes
                        </span>
                        <div className="p-3 rounded-lg bg-[#18181B] border border-zinc-800 text-xs text-zinc-300 leading-relaxed italic">
                          "{viewingPlan.notes}"
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-zinc-800 bg-[#0E0E11] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setToastMessage(`Diet plan notification dispatched to WhatsApp (${viewingMember.phone}).`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#18181B] hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-800 text-xs font-medium btn-shadow transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Resend via WhatsApp</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewPlanOpen(false);
                      handleOpenDietBuilder(viewingMember);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 btn-shadow transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsViewPlanOpen(false)}
                    className="px-3.5 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs shadow-sm btn-shadow-primary transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
