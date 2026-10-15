'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { api } from '../../lib/api';
import { Trainer } from '../../types';
import {
  Users,
  Dumbbell,
  Search,
  Plus,
  Flame,
  Phone,
  Mail,
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
  Trash2,
  RefreshCw,
  Eye,
  UserPlus,
  UserMinus,
  CheckSquare,
  Square,
  Archive,
  ArrowsClockwise,
  Check,
} from '@/components/icons';

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

export default function TrainersPage() {
  const [viewMode, setViewMode] = useState<'COACHES' | 'CLIENTS' | 'UNASSIGNED'>('COACHES');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [clients, setClients] = useState<AssignedClient[]>([]);
  const [unassignedMembers, setUnassignedMembers] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Trainer Modal state
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addSpecialties, setAddSpecialties] = useState('');
  const [addPhotoUrl, setAddPhotoUrl] = useState('');
  const [addBio, setAddBio] = useState('');
  const [addIsActive, setAddIsActive] = useState(true);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit Trainer Modal state
  const [isEditTrainerOpen, setIsEditTrainerOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSpecialties, setEditSpecialties] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Remove Trainer Modal state
  const [isRemoveTrainerOpen, setIsRemoveTrainerOpen] = useState(false);
  const [removingTrainer, setRemovingTrainer] = useState<Trainer | null>(null);
  const [removeOption, setRemoveOption] = useState<'REASSIGN' | 'UNASSIGN'>('REASSIGN');
  const [removeReassignTrainerId, setRemoveReassignTrainerId] = useState('');
  const [removeSubmitting, setRemoveSubmitting] = useState(false);

  // Assign Members (Bulk & Single) Drawer / Modal state
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [selectedTrainerForAssignment, setSelectedTrainerForAssignment] = useState<Trainer | null>(null);
  const [selectedMemberIdsForBulk, setSelectedMemberIdsForBulk] = useState<string[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Reassignment Modal state for a single member
  const [isReassignSingleOpen, setIsReassignSingleOpen] = useState(false);
  const [reassignMember, setReassignMember] = useState<AssignedClient['member'] | null>(null);
  const [targetTrainerId, setTargetTrainerId] = useState('');
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
    setErrorMessage(null);
    try {
      const [trainersData, clientsData, unassignedData, membersRes, templatesData] = await Promise.all([
        api.getTrainers(),
        api.getTrainerMembers(),
        api.getUnassignedMembers(),
        api.getMembers(),
        api.getDietTemplates(),
      ]);

      setTrainers(trainersData);
      setClients(clientsData);
      setUnassignedMembers(unassignedData);
      setAllMembers(membersRes?.members || []);
      setTemplates(templatesData);

      // Pre-select fallback target trainer for reassignments
      const activeTrainers = trainersData.filter((t: Trainer) => t.isActive && !t.isArchived);
      if (activeTrainers.length > 0) {
        if (!targetTrainerId) setTargetTrainerId(activeTrainers[0].id);
        if (!removeReassignTrainerId && activeTrainers.length > 1) {
          setRemoveReassignTrainerId(activeTrainers[1].id);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load trainer records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- TRAINER ACTIONS ---

  const handleOpenAddTrainer = () => {
    setAddName('');
    setAddEmail('');
    setAddPhone('');
    setAddSpecialties('Strength, Hypertrophy');
    setAddPhotoUrl('');
    setAddBio('');
    setAddIsActive(true);
    setIsAddTrainerOpen(true);
  };

  const handleSaveAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;

    setAddSubmitting(true);
    setErrorMessage(null);
    try {
      const specialtiesArr = addSpecialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.createTrainer({
        name: addName.trim(),
        email: addEmail.trim() || undefined,
        phone: addPhone.trim() || undefined,
        specialties: specialtiesArr,
        photoUrl: addPhotoUrl.trim() || undefined,
        bio: addBio.trim() || undefined,
        isActive: addIsActive,
      });

      setToastMessage(`Trainer "${addName.trim()}" added successfully.`);
      setIsAddTrainerOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create trainer profile');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleOpenEditTrainer = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setEditName(trainer.name);
    setEditEmail(trainer.email || '');
    setEditPhone(trainer.phone || '');
    setEditSpecialties((trainer.specialties || []).join(', '));
    setEditPhotoUrl(trainer.photoUrl || '');
    setEditBio(trainer.bio || '');
    setEditIsActive(trainer.isActive);
    setIsEditTrainerOpen(true);
  };

  const handleSaveEditTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer || !editName.trim()) return;

    setEditSubmitting(true);
    setErrorMessage(null);
    try {
      const specialtiesArr = editSpecialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.updateTrainer(editingTrainer.id, {
        name: editName.trim(),
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        specialties: specialtiesArr,
        photoUrl: editPhotoUrl.trim() || undefined,
        bio: editBio.trim() || undefined,
        isActive: editIsActive,
      });

      setToastMessage(`Trainer "${editName.trim()}" updated successfully.`);
      setIsEditTrainerOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update trainer');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleOpenRemoveTrainer = (trainer: Trainer) => {
    setRemovingTrainer(trainer);
    // Find alternative active trainer
    const otherActive = trainers.find((t) => t.id !== trainer.id && t.isActive && !t.isArchived);
    if (otherActive) {
      setRemoveReassignTrainerId(otherActive.id);
      setRemoveOption('REASSIGN');
    } else {
      setRemoveOption('UNASSIGN');
    }
    setIsRemoveTrainerOpen(true);
  };

  const handleConfirmRemoveTrainer = async () => {
    if (!removingTrainer) return;

    setRemoveSubmitting(true);
    setErrorMessage(null);
    try {
      const hasAssigned = (removingTrainer.assignedMembersCount || 0) > 0;
      await api.removeTrainer(removingTrainer.id, {
        reassignTrainerId: hasAssigned && removeOption === 'REASSIGN' ? removeReassignTrainerId : undefined,
        unassignMembers: hasAssigned && removeOption === 'UNASSIGN' ? true : undefined,
      });

      setToastMessage(
        `Coach ${removingTrainer.name} removed and archived. Historical records preserved.`,
      );
      setIsRemoveTrainerOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to remove trainer');
    } finally {
      setRemoveSubmitting(false);
    }
  };

  // --- MEMBER ASSIGNMENT ACTIONS ---

  const handleOpenAssignDrawer = (trainer?: Trainer) => {
    const target = trainer || trainers.find((t) => t.isActive && !t.isArchived) || null;
    setSelectedTrainerForAssignment(target);
    setSelectedMemberIdsForBulk([]);
    setMemberSearchTerm('');
    setIsAssignDrawerOpen(true);
  };

  const toggleSelectMemberForBulk = (memberId: string) => {
    setSelectedMemberIdsForBulk((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  };

  const handleSelectAllUnassigned = () => {
    const unassignedIds = unassignedMembers.map((m) => m.id);
    const allSelected = unassignedIds.every((id) => selectedMemberIdsForBulk.includes(id));
    if (allSelected) {
      setSelectedMemberIdsForBulk((prev) => prev.filter((id) => !unassignedIds.includes(id)));
    } else {
      setSelectedMemberIdsForBulk((prev) => Array.from(new Set([...prev, ...unassignedIds])));
    }
  };

  const handleConfirmBulkAssign = async () => {
    if (!selectedTrainerForAssignment || selectedMemberIdsForBulk.length === 0) return;

    setAssignSubmitting(true);
    setErrorMessage(null);
    try {
      await api.bulkAssignTrainer(selectedTrainerForAssignment.id, selectedMemberIdsForBulk);
      setToastMessage(
        `Assigned ${selectedMemberIdsForBulk.length} member(s) to Coach ${selectedTrainerForAssignment.name}.`,
      );
      setIsAssignDrawerOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to assign members');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleOpenSingleReassign = (member: AssignedClient['member']) => {
    setReassignMember(member);
    const otherActive = trainers.find((t) => t.isActive && !t.isArchived);
    if (otherActive) setTargetTrainerId(otherActive.id);
    setIsReassignSingleOpen(true);
  };

  const handleConfirmSingleReassign = async () => {
    if (!reassignMember || !targetTrainerId) return;

    setReassignSubmitting(true);
    setErrorMessage(null);
    try {
      await api.reassignTrainer(reassignMember.id, targetTrainerId);
      const coach = trainers.find((t) => t.id === targetTrainerId);
      setToastMessage(
        `${reassignMember.firstName} ${reassignMember.lastName} is now assigned to Coach ${coach?.name || 'Selected Coach'}.`,
      );
      setIsReassignSingleOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reassign member');
    } finally {
      setReassignSubmitting(false);
    }
  };

  const handleUnassignMember = async (member: AssignedClient['member']) => {
    if (!confirm(`Are you sure you want to remove Coach assignment for ${member.firstName} ${member.lastName}?`)) {
      return;
    }

    setErrorMessage(null);
    try {
      await api.unassignMember(member.id);
      setToastMessage(`${member.firstName} ${member.lastName} is now unassigned.`);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to unassign member');
    }
  };

  // --- DIET PLAN ACTIONS ---

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

      setToastMessage(`Diet plan created & sent via WhatsApp to ${selectedMemberForDiet.firstName}!`);
      setIsDietBuilderOpen(false);
      await fetchData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save diet plan');
    } finally {
      setDietSubmitting(false);
    }
  };

  // --- FILTERING ---

  const filteredTrainers = trainers.filter((t) => {
    if (statusFilter === 'ACTIVE' && !t.isActive) return false;
    if (statusFilter === 'INACTIVE' && t.isActive) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      (t.email && t.email.toLowerCase().includes(term)) ||
      (t.phone && t.phone.includes(term)) ||
      (t.specialties && t.specialties.some((s) => s.toLowerCase().includes(term)))
    );
  });

  const filteredClients = clients.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.member.firstName.toLowerCase().includes(term) ||
      c.member.lastName.toLowerCase().includes(term) ||
      c.member.memberCode.toLowerCase().includes(term) ||
      c.member.phone.includes(term)
    );
  });

  const filteredUnassigned = unassignedMembers.filter((m) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      m.firstName?.toLowerCase().includes(term) ||
      m.lastName?.toLowerCase().includes(term) ||
      m.memberCode?.toLowerCase().includes(term) ||
      m.phone?.includes(term)
    );
  });

  return (
    <AppLayout onRefreshData={fetchData}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Toast / Error Notifications */}
        {toastMessage && (
          <div className="bg-status-success-bg border border-status-success-border text-status-success-text px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-success-text shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-zinc-200 btn-shadow">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-zinc-400 hover:text-zinc-200 btn-shadow">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. Header & Controls */}
        <div className="page-context flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600/10 dark:bg-brass-500/10 text-brand-600 dark:text-brass-400 flex items-center justify-center border border-brand-500/20 dark:border-brass-500/20 shadow-sm">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary flex items-center gap-2">
                  Trainers &amp; Coaches
                </h1>
                <p className="text-xs text-content-secondary mt-0.5">
                  Coach roster management, member assignments, workout consistency, and nutrition plans.
                </p>
              </div>
            </div>
          </div>

          {/* Action Strip: Add Trainer & View Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-surface-subtle p-1 rounded-xl border border-surface-border">
              <button
                onClick={() => setViewMode('COACHES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all btn-shadow ${
                  viewMode === 'COACHES'
                    ? 'bg-surface text-content-primary shadow-sm font-semibold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Coaches ({trainers.length})</span>
              </button>
              <button
                onClick={() => setViewMode('CLIENTS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all btn-shadow ${
                  viewMode === 'CLIENTS'
                    ? 'bg-surface text-content-primary shadow-sm font-semibold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Assigned Clients ({clients.length})</span>
              </button>
              <button
                onClick={() => setViewMode('UNASSIGNED')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all btn-shadow ${
                  viewMode === 'UNASSIGNED'
                    ? 'bg-surface text-content-primary shadow-sm font-semibold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Unassigned ({unassignedMembers.length})</span>
              </button>
            </div>

            <button
              onClick={handleOpenAddTrainer}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md btn-shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Trainer</span>
            </button>

            <button
              onClick={() => handleOpenAssignDrawer()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-subtle text-content-primary border border-surface-border text-xs font-medium btn-shadow transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-brand-600 dark:text-brass-400" />
              <span>Bulk Assign</span>
            </button>
          </div>
        </div>

        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div data-tone="success" className="status-summary status-surface bg-surface border border-surface-border rounded-2xl p-4 shadow-sm btn-shadow">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span className="font-semibold">Coaching Staff</span>
              <Dumbbell className="w-4 h-4 text-brand-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-content-primary font-mono">
              {trainers.filter((t) => t.isActive).length}{' '}
              <span className="text-xs font-normal text-content-tertiary">/ {trainers.length} total</span>
            </div>
            <p className="text-[11px] text-content-tertiary mt-1">Active personal coaches in gym</p>
          </div>

          <div data-tone={unassignedMembers.length > 0 ? "warning" : "success"} className="status-summary status-surface bg-surface border border-surface-border rounded-2xl p-4 shadow-sm btn-shadow">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span className="font-semibold">Assigned Members</span>
              <Users className="w-4 h-4 text-status-success-text" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-content-primary font-mono">
              {clients.length}
            </div>
            <p className="text-[11px] text-content-tertiary mt-1">
              {unassignedMembers.length} member(s) currently unassigned
            </p>
          </div>

          <div data-tone="success" className="status-summary status-surface bg-surface border border-surface-border rounded-2xl p-4 shadow-sm btn-shadow">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span className="font-semibold">Active Meal Plans</span>
              <Utensils className="w-4 h-4 text-status-success-text" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-status-success-text font-mono">
              {clients.filter((c) => c.dietPlan.status === 'ACTIVE_PLAN').length}
            </div>
            <p className="text-[11px] text-content-tertiary mt-1">Personalized nutrition guides shared</p>
          </div>

          <div data-tone="success" className="status-summary status-surface bg-surface border border-surface-border rounded-2xl p-4 shadow-sm btn-shadow">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span className="font-semibold">Active Streaks</span>
              <Flame className="w-4 h-4 text-status-warning-text" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-status-warning-text font-mono">
              {clients.filter((c) => c.member.currentStreak > 0).length}
            </div>
            <p className="text-[11px] text-content-tertiary mt-1">Clients training on schedule</p>
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="bg-surface border border-surface-border rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                viewMode === 'COACHES'
                  ? 'Search coach by name, specialty, email, phone...'
                  : viewMode === 'CLIENTS'
                  ? 'Search assigned client by name, code, phone...'
                  : 'Search unassigned members...'
              }
              className="w-full bg-surface-subtle border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            {viewMode === 'COACHES' && (
              <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-surface-border text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all btn-shadow ${
                    statusFilter === 'ALL'
                      ? 'bg-surface text-content-primary font-semibold shadow-sm'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg transition-all btn-shadow ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-surface text-status-success-text font-semibold shadow-sm'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  Active Only
                </button>
                <button
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`px-2.5 py-1 rounded-lg transition-all btn-shadow ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-surface text-content-primary font-semibold shadow-sm'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  Inactive
                </button>
              </div>
            )}

            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-content-secondary hover:text-content-primary btn-shadow transition-colors"
            >
              <ArrowsClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4. Main View Content */}
        {viewMode === 'COACHES' ? (
          /* COACHES VIEW: Polished Trainer Cards Grid */
          <div>
            {filteredTrainers.length === 0 ? (
              <div className="bg-surface border border-surface-border rounded-2xl p-12 text-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-center mx-auto mb-3 text-content-tertiary">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-content-primary">No coaches found</h3>
                <p className="text-xs text-content-secondary mt-1 max-w-sm mx-auto">
                  {search
                    ? 'No trainers match your search criteria. Try a different search term.'
                    : 'Start by adding your gym’s fitness trainers and assigning members to them.'}
                </p>
                {!search && (
                  <button
                    onClick={handleOpenAddTrainer}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs btn-shadow transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Trainer</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTrainers.map((trainer) => {
                  const initials = trainer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={trainer.id}
                      className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm btn-shadow flex flex-col justify-between hover:border-brand-500/40 transition-all duration-200"
                    >
                      <div>
                        {/* Top: Avatar, Name, Status Pill */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            {trainer.photoUrl ? (
                              <img
                                src={trainer.photoUrl}
                                alt={trainer.name}
                                className="w-12 h-12 rounded-xl object-cover border border-surface-border shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-500/20 text-brand-600 dark:text-brass-400 font-bold text-sm flex items-center justify-center border border-brand-500/30 shadow-sm">
                                {initials}
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-sm text-content-primary leading-tight">
                                {trainer.name}
                              </h3>
                              <p className="text-[11px] text-content-tertiary mt-0.5 font-mono">
                                {trainer.email || 'No email registered'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {trainer.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-status-success-bg text-status-success-text border border-status-success-border">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bio (if available) */}
                        {trainer.bio && (
                          <p className="text-xs text-content-secondary line-clamp-2 mb-3 leading-relaxed">
                            {trainer.bio}
                          </p>
                        )}

                        {/* Contact details */}
                        <div className="space-y-1 mb-3 text-xs text-content-secondary">
                          {trainer.phone && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <Phone className="w-3.5 h-3.5 text-content-tertiary" />
                              <span className="font-mono">{trainer.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Specialties Tags */}
                        {trainer.specialties && trainer.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {trainer.specialties.map((spec, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface-subtle text-content-secondary border border-surface-border"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bottom: Member Count & Action Buttons */}
                      <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-2 mt-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-subtle border border-surface-border text-xs text-content-primary">
                          <Users className="w-3.5 h-3.5 text-brand-500" />
                          <span className="font-mono font-semibold">{trainer.assignedMembersCount || 0}</span>
                          <span className="text-[11px] text-content-tertiary">assigned</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAssignDrawer(trainer)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-subtle text-content-primary text-xs font-medium border border-surface-border btn-shadow transition-colors"
                            title="Assign members to this coach"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-brand-600 dark:text-brass-400" />
                            <span>Assign</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditTrainer(trainer)}
                            className="p-1.5 rounded-lg bg-surface hover:bg-surface-subtle text-content-secondary hover:text-content-primary border border-surface-border btn-shadow transition-colors"
                            title="Edit Trainer Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenRemoveTrainer(trainer)}
                            className="p-1.5 rounded-lg bg-surface hover:bg-rose-500/10 text-content-secondary hover:text-rose-500 border border-surface-border btn-shadow transition-colors"
                            title="Remove or Archive Trainer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : viewMode === 'CLIENTS' ? (
          /* ASSIGNED CLIENTS VIEW: Table of Member Coaching Profiles */
          <div className="bg-surface border border-surface-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-content-secondary">
                <thead className="bg-surface-subtle border-b border-surface-border text-[11px] uppercase tracking-wider text-content-tertiary font-semibold select-none">
                  <tr>
                    <th className="py-3 px-4">Client Member</th>
                    <th className="py-3 px-4">Workout Streak</th>
                    <th className="py-3 px-4">Total Check-Ins</th>
                    <th className="py-3 px-4">Nutrition Plan</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredClients.map((item) => {
                    const hasPlan = item.dietPlan.status === 'ACTIVE_PLAN';

                    return (
                      <tr key={item.assignmentId} className="hover:bg-surface-subtle/50 transition-colors">
                        {/* Member & Assigned Coach Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-surface-subtle border border-surface-border flex items-center justify-center text-xs font-semibold text-content-primary">
                              {item.member.firstName?.[0]}
                              {item.member.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-medium text-content-primary">
                                {item.member.firstName} {item.member.lastName}
                              </div>
                              <div className="text-[11px] text-content-tertiary font-mono">
                                {item.member.memberCode} • {item.member.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Streak */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-subtle border border-surface-border text-content-primary font-mono text-xs">
                            <Flame className="w-3.5 h-3.5 text-status-warning-text" />
                            <span className="font-semibold">{item.member.currentStreak}</span>
                            <span className="text-[10px] text-content-tertiary">days</span>
                          </div>
                        </td>

                        {/* Check-Ins */}
                        <td className="py-3.5 px-4 font-mono text-xs text-content-secondary">
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
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-status-success-bg text-status-success-text border border-status-success-border text-[11px] font-medium group-hover:bg-status-success-bg transition-all">
                                <CheckCircle2 className="w-3 h-3 text-status-success-text" />
                                <span>{item.dietPlan.title}</span>
                                <Eye className="w-3 h-3 text-emerald-500/70 group-hover:text-status-success-text ml-0.5" />
                              </span>
                              <div className="text-[10px] text-content-tertiary font-mono flex items-center gap-1.5 mt-0.5">
                                <span>{item.dietPlan.goal}</span>
                                <span>•</span>
                                <span>{item.dietPlan.mealsCount} Meals</span>
                                <span className="text-brand-600 dark:text-brass-400 underline group-hover:opacity-80">View</span>
                              </div>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-status-warning-bg text-status-warning-text border border-status-warning-border text-[11px] font-medium">
                              <AlertCircle className="w-3 h-3 text-status-warning-text" />
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
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-subtle text-content-primary text-xs font-medium border border-surface-border shadow-sm btn-shadow transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-content-secondary" />
                                <span>View Plan</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenDietBuilder(item.member)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm btn-shadow transition-colors"
                            >
                              <Utensils className="w-3.5 h-3.5" />
                              <span>{hasPlan ? 'Edit Plan' : '+ Build Plan'}</span>
                            </button>
                            <button
                              onClick={() => handleOpenSingleReassign(item.member)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-subtle text-content-secondary hover:text-content-primary text-xs border border-surface-border btn-shadow transition-colors"
                              title="Reassign to another coach"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Reassign</span>
                            </button>
                            <button
                              onClick={() => handleUnassignMember(item.member)}
                              className="p-1.5 rounded-lg bg-surface hover:bg-rose-500/10 text-content-secondary hover:text-rose-500 border border-surface-border btn-shadow transition-colors"
                              title="Remove Coach Assignment"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
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
                  <Users className="w-8 h-8 text-content-tertiary mx-auto mb-2" />
                  <p className="text-sm font-medium text-content-primary">No assigned clients found</p>
                  <p className="text-xs text-content-secondary mt-1">
                    Assign members to your coaching staff using the "Bulk Assign" button above.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* UNASSIGNED MEMBERS QUEUE */
          <div className="bg-surface border border-surface-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-surface-subtle border-b border-surface-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-brand-600 dark:text-brass-400" />
                  Unassigned Member Queue
                </h3>
                <p className="text-xs text-content-secondary mt-0.5">
                  Members who do not currently have a personal fitness coach assigned.
                </p>
              </div>
              <button
                onClick={() => handleOpenAssignDrawer()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs btn-shadow transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bulk Assign to Coach</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-content-secondary">
                <thead className="bg-surface-subtle/50 border-b border-surface-border text-[11px] uppercase tracking-wider text-content-tertiary font-semibold select-none">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Member Code</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredUnassigned.map((member) => (
                    <tr key={member.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-content-primary">
                        {member.firstName} {member.lastName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-content-secondary">
                        {member.memberCode}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-content-secondary">
                        {member.phone}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-status-success-text font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active Member
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedMemberIdsForBulk([member.id]);
                            setIsAssignDrawerOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-subtle text-content-primary text-xs font-semibold border border-surface-border btn-shadow transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-brand-600 dark:text-brass-400" />
                          <span>Assign Coach</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUnassigned.length === 0 && (
                <div className="py-12 text-center">
                  <CheckCircle2 className="w-8 h-8 text-status-success-text mx-auto mb-2" />
                  <p className="text-sm font-medium text-content-primary">All active members are assigned to coaches!</p>
                  <p className="text-xs text-content-secondary mt-1">
                    No unassigned members currently in queue.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Add Trainer Modal */}
        {isAddTrainerOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface max-w-lg w-full rounded-2xl p-5 sm:p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => setIsAddTrainerOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle btn-shadow transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-brand-600/10 text-brand-600 dark:text-brass-400 flex items-center justify-center border border-brand-500/20">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-content-primary">Add New Trainer</h3>
                  <p className="text-xs text-content-secondary">
                    Create a coach profile for member assignments and workout guidance.
                  </p>
                </div>
              </div>

              {/* Informational banner about staff separation */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-[11px] text-content-secondary leading-relaxed mb-4 flex items-start gap-2">
                <Shield className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>
                  Trainer profiles are kept separate from staff login accounts. Adding a trainer does not automatically grant system login; use the Staff Invitation screen if dashboard access is required.
                </span>
              </div>

              <form onSubmit={handleSaveAddTrainer} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-content-secondary block mb-1">Coach Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Coach Sara Ahmed"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-content-secondary block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="sara@ironhouse.pk"
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-content-secondary block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      placeholder="+923001234567"
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-content-secondary block mb-1">
                    Specialties (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={addSpecialties}
                    onChange={(e) => setAddSpecialties(e.target.value)}
                    placeholder="e.g. Strength & Conditioning, CrossFit, Hypertrophy, Rehab"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-content-secondary block mb-1">Profile Photo URL (Optional)</label>
                  <input
                    type="url"
                    value={addPhotoUrl}
                    onChange={(e) => setAddPhotoUrl(e.target.value)}
                    placeholder="https://example.com/coach-photo.jpg"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-content-secondary block mb-1">Bio / Coaching Focus</label>
                  <textarea
                    rows={2}
                    value={addBio}
                    onChange={(e) => setAddBio(e.target.value)}
                    placeholder="Short description of coach experience, certifications, and target client goals..."
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl p-2.5 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="addTrainerActive"
                    checked={addIsActive}
                    onChange={(e) => setAddIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-border text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="addTrainerActive" className="text-xs font-medium text-content-primary cursor-pointer select-none">
                    Active Coach (Available for Member Assignments)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setIsAddTrainerOpen(false)}
                    className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle text-content-secondary text-xs font-medium border border-surface-border btn-shadow transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addSubmitting}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs btn-shadow transition-all disabled:opacity-50"
                  >
                    {addSubmitting ? 'Saving...' : 'Add Trainer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 6. Edit Trainer Modal */}
        {isEditTrainerOpen && editingTrainer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface max-w-lg w-full rounded-2xl p-5 sm:p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => setIsEditTrainerOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle btn-shadow transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-brand-600/10 text-brand-600 dark:text-brass-400 flex items-center justify-center border border-brand-500/20">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-content-primary">Edit Trainer Details</h3>
                  <p className="text-xs text-content-secondary">
                    Update profile, contact details, specialties, or active status.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveEditTrainer} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-content-secondary block mb-1">Coach Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-content-secondary block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-content-secondary block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-content-secondary block mb-1">
                    Specialties (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={editSpecialties}
                    onChange={(e) => setEditSpecialties(e.target.value)}
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-content-secondary block mb-1">Profile Photo URL</label>
                  <input
                    type="url"
                    value={editPhotoUrl}
                    onChange={(e) => setEditPhotoUrl(e.target.value)}
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-content-secondary block mb-1">Bio</label>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl p-2.5 text-xs text-content-primary focus:outline-none focus:border-brand-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editTrainerActive"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-border text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="editTrainerActive" className="text-xs font-medium text-content-primary cursor-pointer select-none">
                    Active Coach (Visible for Assignments)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setIsEditTrainerOpen(false)}
                    className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle text-content-secondary text-xs font-medium border border-surface-border btn-shadow transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs btn-shadow transition-all disabled:opacity-50"
                  >
                    {editSubmitting ? 'Saving...' : 'Update Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 7. Remove / Archive Trainer Modal */}
        {isRemoveTrainerOpen && removingTrainer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface max-w-lg w-full rounded-2xl p-5 sm:p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => setIsRemoveTrainerOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle btn-shadow transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-content-primary">Remove Coach: {removingTrainer.name}</h3>
                  <p className="text-xs text-content-secondary">
                    Review assigned members and historical data before confirming.
                  </p>
                </div>
              </div>

              {(removingTrainer.assignedMembersCount || 0) > 0 ? (
                <div className="space-y-3.5 mb-4">
                  <div className="p-3.5 rounded-xl bg-status-warning-bg border border-status-warning-border text-xs text-status-warning-text">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Action Required: {removingTrainer.assignedMembersCount} Active Assigned Member(s)</span>
                    </div>
                    <p className="mt-1 leading-relaxed text-[11px]">
                      This coach currently has active client assignments. Choose how you would like to handle their members:
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-3 rounded-xl border border-surface-border bg-surface-subtle cursor-pointer hover:border-brand-500/40 transition-colors">
                      <input
                        type="radio"
                        name="removeOption"
                        value="REASSIGN"
                        checked={removeOption === 'REASSIGN'}
                        onChange={() => setRemoveOption('REASSIGN')}
                        className="mt-0.5 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-content-primary block">
                          Reassign all members to another active coach
                        </span>
                        <span className="text-[11px] text-content-secondary block mt-0.5">
                          Move all {removingTrainer.assignedMembersCount} assigned member(s) to a replacement coach seamlessly.
                        </span>

                        {removeOption === 'REASSIGN' && (
                          <div className="mt-2.5">
                            <label className="text-[11px] font-medium text-content-tertiary block mb-1">
                              Select Target Coach:
                            </label>
                            <select
                              value={removeReassignTrainerId}
                              onChange={(e) => setRemoveReassignTrainerId(e.target.value)}
                              className="w-full bg-surface border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                            >
                              {trainers
                                .filter((t) => t.id !== removingTrainer.id && t.isActive && !t.isArchived)
                                .map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} ({t.assignedMembersCount || 0} active members)
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl border border-surface-border bg-surface-subtle cursor-pointer hover:border-brand-500/40 transition-colors">
                      <input
                        type="radio"
                        name="removeOption"
                        value="UNASSIGN"
                        checked={removeOption === 'UNASSIGN'}
                        onChange={() => setRemoveOption('UNASSIGN')}
                        className="mt-0.5 text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <span className="text-xs font-semibold text-content-primary block">
                          Leave all members unassigned
                        </span>
                        <span className="text-[11px] text-content-secondary block mt-0.5">
                          Deactivate the current coach assignments. Members will appear in the unassigned queue.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-secondary mb-4">
                  This coach does not currently have any active member assignments.
                </div>
              )}

              {/* Archiving Notice */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-[11px] text-content-tertiary leading-relaxed mb-4 flex items-start gap-2">
                <Archive className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>
                  To protect past audit history, attendance check-ins, and diet notes, this coach profile will be safely archived rather than permanently wiped.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsRemoveTrainerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle text-content-secondary text-xs font-medium border border-surface-border btn-shadow transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemoveTrainer}
                  disabled={removeSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs btn-shadow transition-all disabled:opacity-50"
                >
                  {removeSubmitting ? 'Processing...' : 'Confirm Removal & Archive'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. Assign / Bulk Assign Drawer / Modal */}
        {isAssignDrawerOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface max-w-xl w-full rounded-2xl p-5 sm:p-6 border border-surface-border shadow-2xl relative max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => setIsAssignDrawerOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle btn-shadow transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-3 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-brand-600/10 text-brand-600 dark:text-brass-400 flex items-center justify-center border border-brand-500/20">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-content-primary">Assign Members to Coach</h3>
                  <p className="text-xs text-content-secondary">
                    Select target coach and check members for primary coach assignment.
                  </p>
                </div>
              </div>

              {/* Target Coach Selection */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border mb-3 shrink-0">
                <label className="text-xs font-semibold text-content-primary block mb-1.5">
                  Target Coach *
                </label>
                <select
                  value={selectedTrainerForAssignment?.id || ''}
                  onChange={(e) => {
                    const t = trainers.find((tr) => tr.id === e.target.value) || null;
                    setSelectedTrainerForAssignment(t);
                  }}
                  className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                >
                  {trainers
                    .filter((t) => t.isActive && !t.isArchived)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        Coach {t.name} ({t.assignedMembersCount || 0} active assignments)
                      </option>
                    ))}
                </select>
              </div>

              {/* Member Search & Quick Selection Strip */}
              <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-content-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    placeholder="Search by member name, code, or phone..."
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSelectAllUnassigned}
                  className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs text-content-secondary hover:text-content-primary btn-shadow transition-colors shrink-0"
                >
                  Select All Unassigned
                </button>
              </div>

              {/* Scrollable Member List */}
              <div className="flex-1 overflow-y-auto border border-surface-border rounded-xl divide-y divide-surface-border">
                {allMembers
                  .filter((m) => {
                    if (!memberSearchTerm.trim()) return true;
                    const term = memberSearchTerm.toLowerCase();
                    return (
                      m.firstName?.toLowerCase().includes(term) ||
                      m.lastName?.toLowerCase().includes(term) ||
                      m.memberCode?.toLowerCase().includes(term) ||
                      m.phone?.includes(term)
                    );
                  })
                  .map((member) => {
                    const isSelected = selectedMemberIdsForBulk.includes(member.id);
                    const activeAssignment = member.trainerAssignments?.find((a: any) => a.isActive);
                    const currentTrainerName = activeAssignment?.trainer?.name;

                    return (
                      <div
                        key={member.id}
                        onClick={() => toggleSelectMemberForBulk(member.id)}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-brand-500/10 dark:bg-brand-950/20' : 'hover:bg-surface-subtle/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-brand-600 dark:text-brass-400 focus:outline-none"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brass-400" />
                            ) : (
                              <Square className="w-4 h-4 text-content-tertiary" />
                            )}
                          </button>
                          <div>
                            <div className="text-xs font-semibold text-content-primary">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-[11px] text-content-tertiary font-mono">
                              {member.memberCode} • {member.phone}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {currentTrainerName ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface text-content-secondary border border-surface-border">
                              Assigned to: Coach {currentTrainerName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-status-warning-bg text-status-warning-text border border-status-warning-border">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-surface-border flex items-center justify-between shrink-0 mt-3">
                <span className="text-xs font-medium text-content-secondary">
                  {selectedMemberIdsForBulk.length} member(s) selected
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAssignDrawerOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-subtle text-content-secondary text-xs font-medium border border-surface-border btn-shadow transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBulkAssign}
                    disabled={assignSubmitting || selectedMemberIdsForBulk.length === 0}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs btn-shadow transition-all disabled:opacity-50"
                  >
                    {assignSubmitting
                      ? 'Assigning...'
                      : `Assign ${selectedMemberIdsForBulk.length} Member(s)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. Single Member Reassign Modal */}
        {isReassignSingleOpen && reassignMember && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface max-w-md w-full rounded-2xl p-5 sm:p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => setIsReassignSingleOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle btn-shadow transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-brand-600/10 text-brand-600 dark:text-brass-400 flex items-center justify-center border border-brand-500/20">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-content-primary">Reassign Member Coach</h3>
                  <p className="text-xs text-content-secondary">
                    Transfer coaching responsibilities to a different trainer.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border text-xs mb-4">
                <span className="text-content-tertiary block text-[11px] mb-0.5">Member:</span>
                <span className="font-semibold text-content-primary text-sm">
                  {reassignMember.firstName} {reassignMember.lastName}
                </span>
                <span className="text-[11px] text-content-tertiary font-mono ml-2">
                  ({reassignMember.memberCode})
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <label className="text-xs font-semibold text-content-primary block">
                  Select New Primary Coach *
                </label>
                <select
                  value={targetTrainerId}
                  onChange={(e) => setTargetTrainerId(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                >
                  {trainers
                    .filter((t) => t.isActive && !t.isArchived)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        Coach {t.name} ({t.assignedMembersCount || 0} active clients)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsReassignSingleOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle text-content-secondary text-xs font-medium border border-surface-border btn-shadow transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSingleReassign}
                  disabled={reassignSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs btn-shadow transition-all disabled:opacity-50"
                >
                  {reassignSubmitting ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 10. Diet Plan Builder Modal */}
        {isDietBuilderOpen && selectedMemberForDiet && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface max-w-2xl w-full rounded-2xl p-5 sm:p-6 border border-surface-border shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => setIsDietBuilderOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle btn-shadow transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-status-success-bg border border-status-success-border text-status-success-text flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-content-primary">Structured Nutrition Plan Builder</h3>
                  <p className="text-xs text-content-secondary">
                    Assigning to: <span className="text-content-primary font-medium">{selectedMemberForDiet.firstName} {selectedMemberForDiet.lastName}</span> ({selectedMemberForDiet.memberCode})
                  </p>
                </div>
              </div>

              {/* Template Quick Clone Strip */}
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border mb-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-content-tertiary mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-status-warning-text" />
                  <span>Start from Standard Template:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-subtle text-content-primary text-xs border border-surface-border transition-colors btn-shadow flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3 text-content-secondary" />
                      <span>{tpl.title.split('(')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSaveDietPlan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-content-secondary block mb-1">Plan Title *</label>
                    <input
                      type="text"
                      required
                      value={dietTitle}
                      onChange={(e) => setDietTitle(e.target.value)}
                      placeholder="e.g. 1,800 kcal Fat Loss Plan"
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-content-secondary block mb-1">Nutrition Goal *</label>
                    <select
                      value={dietGoal}
                      onChange={(e: any) => setDietGoal(e.target.value)}
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
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
                    <label className="text-xs font-medium text-content-secondary block mb-1">Custom Goal Name</label>
                    <input
                      type="text"
                      value={dietCustomGoal}
                      onChange={(e) => setDietCustomGoal(e.target.value)}
                      placeholder="e.g. Competition Prep / Peak Week"
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-content-primary">Daily Meal Breakdown</label>
                    <button
                      type="button"
                      onClick={handleAddMealRow}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brass-400 hover:underline btn-shadow"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Meal / Snack</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {dietMeals.map((meal, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-surface-subtle border border-surface-border space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={meal.mealType}
                            onChange={(e: any) => handleUpdateMeal(idx, 'mealType', e.target.value)}
                            className="bg-surface border border-surface-border rounded-lg px-2 py-1 text-xs text-content-primary font-semibold"
                          >
                            <option value="BREAKFAST">Breakfast</option>
                            <option value="LUNCH">Lunch</option>
                            <option value="DINNER">Dinner</option>
                            <option value="SNACK">Snack</option>
                          </select>

                          {dietMeals.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMealRow(idx)}
                              className="text-content-tertiary hover:text-rose-500 p-1 btn-shadow"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          required
                          value={meal.description}
                          onChange={(e) => handleUpdateMeal(idx, 'description', e.target.value)}
                          placeholder="Items, portion sizes, ingredients..."
                          className="w-full bg-surface border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-content-primary focus:outline-none focus:border-brand-500"
                        />

                        <div className="grid grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-content-tertiary block text-[10px]">Calories</span>
                            <input
                              type="number"
                              value={meal.calories || ''}
                              onChange={(e) => handleUpdateMeal(idx, 'calories', parseInt(e.target.value) || 0)}
                              placeholder="kcal"
                              className="w-full bg-surface border border-surface-border rounded px-2 py-1 font-mono text-content-primary"
                            />
                          </div>
                          <div>
                            <span className="text-content-tertiary block text-[10px]">Protein (g)</span>
                            <input
                              type="number"
                              value={meal.proteinG || ''}
                              onChange={(e) => handleUpdateMeal(idx, 'proteinG', parseFloat(e.target.value) || 0)}
                              placeholder="g"
                              className="w-full bg-surface border border-surface-border rounded px-2 py-1 font-mono text-content-primary"
                            />
                          </div>
                          <div>
                            <span className="text-content-tertiary block text-[10px]">Carbs (g)</span>
                            <input
                              type="number"
                              value={meal.carbsG || ''}
                              onChange={(e) => handleUpdateMeal(idx, 'carbsG', parseFloat(e.target.value) || 0)}
                              placeholder="g"
                              className="w-full bg-surface border border-surface-border rounded px-2 py-1 font-mono text-content-primary"
                            />
                          </div>
                          <div>
                            <span className="text-content-tertiary block text-[10px]">Fats (g)</span>
                            <input
                              type="number"
                              value={meal.fatG || ''}
                              onChange={(e) => handleUpdateMeal(idx, 'fatG', parseFloat(e.target.value) || 0)}
                              placeholder="g"
                              className="w-full bg-surface border border-surface-border rounded px-2 py-1 font-mono text-content-primary"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-content-secondary block mb-1">Coach Notes</label>
                  <textarea
                    rows={2}
                    value={dietNotes}
                    onChange={(e) => setDietNotes(e.target.value)}
                    placeholder="Instructions regarding water intake, workout timing, cheat meals..."
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl p-2.5 text-xs text-content-primary focus:outline-none focus:border-brand-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setIsDietBuilderOpen(false)}
                    className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle text-content-secondary text-xs font-medium border border-surface-border btn-shadow transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dietSubmitting}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs btn-shadow transition-all disabled:opacity-50"
                  >
                    {dietSubmitting ? 'Saving...' : 'Save & Dispatch via WhatsApp'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 11. Diet View Modal */}
        {isViewPlanOpen && viewingMember && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface max-w-xl w-full rounded-2xl p-5 sm:p-6 border border-surface-border shadow-2xl relative max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => setIsViewPlanOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle btn-shadow transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-status-success-bg text-status-success-text flex items-center justify-center border border-status-success-border">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-content-primary">Client Nutrition Plan</h3>
                  <p className="text-xs text-content-secondary">
                    {viewingMember.firstName} {viewingMember.lastName} ({viewingMember.memberCode})
                  </p>
                </div>
              </div>

              {loadingPlan ? (
                <div className="py-12 text-center text-xs text-content-secondary">
                  <ArrowsClockwise className="w-5 h-5 animate-spin mx-auto mb-2 text-content-tertiary" />
                  Loading plan details...
                </div>
              ) : viewingPlan ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                    <div className="font-semibold text-sm text-content-primary">{viewingPlan.title}</div>
                    <div className="text-[11px] text-content-secondary font-mono mt-0.5">
                      Goal: {viewingPlan.goal}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-content-primary uppercase tracking-wider text-[11px]">
                      Scheduled Meals
                    </h4>
                    {viewingPlan.meals?.map((meal: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-content-primary block">{meal.mealType}</span>
                          <span className="text-content-secondary text-[11px]">{meal.description}</span>
                        </div>
                        {meal.calories && (
                          <span className="font-mono text-[11px] text-content-tertiary">
                            {meal.calories} kcal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {viewingPlan.notes && (
                    <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-secondary italic">
                      "{viewingPlan.notes}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-content-secondary">
                  No active diet plan recorded for this client.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsViewPlanOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle text-content-secondary text-xs font-medium border border-surface-border btn-shadow transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
