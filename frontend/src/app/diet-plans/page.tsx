'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { api } from '../../lib/api';
import {
  Utensils,
  Plus,
  Search,
  Flame,
  Award,
  Calendar,
  Clock,
  Sparkles,
  Send,
  Copy,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Target,
  FileText,
  Activity,
  User,
  Shield,
  MessageCircle,
} from '@/components/icons';

interface MemberDietItem {
  id: string;
  memberId: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberCode: string;
    phone: string;
    currentStreak: number;
  };
  title: string;
  goal: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'CUSTOM';
  customGoal?: string | null;
  targetCalories?: number;
  targetProteinG?: number;
  targetCarbsG?: number;
  targetFatG?: number;
  mealsCount: number;
  updatedAt: string;
  meals: Array<{
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
    description: string;
    calories?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
  }>;
}

interface DietTemplate {
  id: string;
  title: string;
  goal: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'CUSTOM';
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  meals: Array<{
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
    description: string;
    calories?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
  }>;
}

const DEFAULT_TEMPLATES: DietTemplate[] = [
  {
    id: 'tmpl-1',
    title: 'Pakistani High-Protein Hypertrophy',
    goal: 'MUSCLE_GAIN',
    description: 'High protein lean bulking surplus with local Desi foods (chicken tikka, daal, eggs, brown roti).',
    calories: 2750,
    proteinG: 165,
    carbsG: 310,
    fatG: 75,
    meals: [
      { mealType: 'BREAKFAST', description: '4 egg whites + 2 whole eggs, 2 slices whole wheat toast, green tea', calories: 420, proteinG: 32, carbsG: 36, fatG: 16 },
      { mealType: 'LUNCH', description: '200g grilled chicken boti, 1.5 cup brown rice or 2 rotis, cucumber raita', calories: 650, proteinG: 52, carbsG: 68, fatG: 14 },
      { mealType: 'SNACK', description: 'Whey protein shake with 1 banana & 15 almonds', calories: 340, proteinG: 28, carbsG: 34, fatG: 9 },
      { mealType: 'DINNER', description: '180g beef mince (qeema) with boiled chickpeas and steamed spinach', calories: 580, proteinG: 44, carbsG: 42, fatG: 18 },
    ],
  },
  {
    id: 'tmpl-2',
    title: 'Calorie Deficit Fat Loss Protocol',
    goal: 'WEIGHT_LOSS',
    description: 'Moderate carb, high protein deficit designed to shed fat while preserving muscle mass.',
    calories: 1850,
    proteinG: 155,
    carbsG: 160,
    fatG: 52,
    meals: [
      { mealType: 'BREAKFAST', description: '3 boiled eggs, 1 slice multi-grain bread, black coffee with zero sugar', calories: 310, proteinG: 22, carbsG: 20, fatG: 14 },
      { mealType: 'LUNCH', description: '180g grilled chicken breast salad with olive oil & lemon dressing', calories: 450, proteinG: 48, carbsG: 18, fatG: 16 },
      { mealType: 'SNACK', description: 'Greek yogurt (150g) with handful of berries or green apple', calories: 180, proteinG: 16, carbsG: 22, fatG: 2 },
      { mealType: 'DINNER', description: '200g grilled white fish or boiled lentils (daal) with steamed vegetables', calories: 420, proteinG: 42, carbsG: 34, fatG: 8 },
    ],
  },
  {
    id: 'tmpl-3',
    title: 'Athletic Maintenance & Energy Balance',
    goal: 'MAINTENANCE',
    description: 'Balanced macronutrients for active athletes and regular gym-goers aiming to maintain body composition.',
    calories: 2250,
    proteinG: 140,
    carbsG: 260,
    fatG: 65,
    meals: [
      { mealType: 'BREAKFAST', description: 'Oatmeal bowl (60g oats, 1 scoop whey, skimmed milk, chia seeds)', calories: 460, proteinG: 34, carbsG: 58, fatG: 10 },
      { mealType: 'LUNCH', description: '160g chicken pulao or chapli kebab with mixed green salad and mint raita', calories: 590, proteinG: 42, carbsG: 64, fatG: 16 },
      { mealType: 'SNACK', description: 'Peanut butter on 2 rice cakes + black coffee', calories: 250, proteinG: 10, carbsG: 28, fatG: 12 },
      { mealType: 'DINNER', description: '150g grilled fish or chicken with baked sweet potato and broccoli', calories: 510, proteinG: 40, carbsG: 48, fatG: 14 },
    ],
  },
];

const INITIAL_PLANS: MemberDietItem[] = [
  {
    id: 'dp-1',
    memberId: 'mem-1',
    member: {
      id: 'mem-1',
      firstName: 'Hamza',
      lastName: 'Sheikh',
      memberCode: 'GR-1001',
      phone: '+923001234567',
      currentStreak: 12,
    },
    title: 'Hypertrophy Power Surplus',
    goal: 'MUSCLE_GAIN',
    targetCalories: 2800,
    targetProteinG: 170,
    targetCarbsG: 320,
    targetFatG: 75,
    mealsCount: 4,
    updatedAt: '2026-09-25T14:30:00Z',
    meals: [
      { mealType: 'BREAKFAST', description: '4 eggs (2 whole, 2 whites), 2 brown bread slices, 1 banana', calories: 430, proteinG: 28, carbsG: 45, fatG: 15 },
      { mealType: 'LUNCH', description: '200g chicken breast, 1.5 cup boiled rice, fresh salad', calories: 680, proteinG: 54, carbsG: 72, fatG: 12 },
      { mealType: 'SNACK', description: '1 scoop whey protein with water, 1 apple, 15 almonds', calories: 320, proteinG: 26, carbsG: 30, fatG: 9 },
      { mealType: 'DINNER', description: '180g beef mince or chicken karahi (dry, low oil) with 2 whole wheat rotis', calories: 620, proteinG: 46, carbsG: 58, fatG: 18 },
    ],
  },
  {
    id: 'dp-2',
    memberId: 'mem-3',
    member: {
      id: 'mem-3',
      firstName: 'Zaid',
      lastName: 'Siddiqui',
      memberCode: 'GR-1003',
      phone: '+923129988776',
      currentStreak: 9,
    },
    title: 'Fat Loss Shred Protocol',
    goal: 'WEIGHT_LOSS',
    targetCalories: 1900,
    targetProteinG: 160,
    targetCarbsG: 170,
    targetFatG: 50,
    mealsCount: 3,
    updatedAt: '2026-09-26T11:00:00Z',
    meals: [
      { mealType: 'BREAKFAST', description: '3 boiled eggs, 1 brown toast, black coffee', calories: 310, proteinG: 22, carbsG: 20, fatG: 14 },
      { mealType: 'LUNCH', description: '180g chicken tikka breast, huge cucumber & tomato salad, lemon water', calories: 460, proteinG: 50, carbsG: 16, fatG: 14 },
      { mealType: 'DINNER', description: '200g grilled fish with steamed seasonal vegetables', calories: 410, proteinG: 42, carbsG: 24, fatG: 9 },
    ],
  },
  {
    id: 'dp-3',
    memberId: 'mem-4',
    member: {
      id: 'mem-4',
      firstName: 'Fatima',
      lastName: 'Zahra',
      memberCode: 'GR-1004',
      phone: '+923214455667',
      currentStreak: 7,
    },
    title: 'Clean Muscle Tone',
    goal: 'MAINTENANCE',
    targetCalories: 2100,
    targetProteinG: 130,
    targetCarbsG: 240,
    targetFatG: 60,
    mealsCount: 4,
    updatedAt: '2026-09-28T09:45:00Z',
    meals: [
      { mealType: 'BREAKFAST', description: 'Oatmeal with whey protein, chia seeds, and 1 boiled egg', calories: 440, proteinG: 32, carbsG: 52, fatG: 11 },
      { mealType: 'LUNCH', description: '150g grilled chicken with 1 cup brown rice and cucumber raita', calories: 540, proteinG: 40, carbsG: 58, fatG: 12 },
      { mealType: 'SNACK', description: 'Greek yogurt with handful of walnuts', calories: 220, proteinG: 14, carbsG: 12, fatG: 14 },
      { mealType: 'DINNER', description: '150g grilled fish or boiled daal with 1 roti and salad', calories: 450, proteinG: 36, carbsG: 48, fatG: 10 },
    ],
  },
];

export default function DietPlansPage() {
  const [plans, setPlans] = useState<MemberDietItem[]>(INITIAL_PLANS);
  const [templates, setTemplates] = useState<DietTemplate[]>(DEFAULT_TEMPLATES);
  const [activeTab, setActiveTab] = useState<'PLANS' | 'TEMPLATES' | 'CALCULATOR'>('PLANS');
  const [search, setSearch] = useState('');
  const [goalFilter, setGoalFilter] = useState<'ALL' | 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // View modal
  const [viewPlan, setViewPlan] = useState<MemberDietItem | null>(null);

  // Builder Modal
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderMemberCode, setBuilderMemberCode] = useState('');
  const [builderMemberName, setBuilderMemberName] = useState('');
  const [builderTitle, setBuilderTitle] = useState('');
  const [builderGoal, setBuilderGoal] = useState<'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'CUSTOM'>('WEIGHT_LOSS');
  const [builderCalories, setBuilderCalories] = useState(2000);
  const [builderProtein, setBuilderProtein] = useState(150);
  const [builderCarbs, setBuilderCarbs] = useState(200);
  const [builderFat, setBuilderFat] = useState(60);
  const [builderMeals, setBuilderMeals] = useState<Array<{
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
    description: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>>([
    { mealType: 'BREAKFAST', description: '3 boiled eggs, 1 brown toast, green tea', calories: 300, proteinG: 22, carbsG: 20, fatG: 14 },
    { mealType: 'LUNCH', description: '180g grilled chicken, 1 cup brown rice, cucumber salad', calories: 520, proteinG: 48, carbsG: 55, fatG: 12 },
    { mealType: 'DINNER', description: '200g white fish, steamed vegetables', calories: 380, proteinG: 40, carbsG: 22, fatG: 8 },
  ]);
  const [sendWhatsAppOnCreate, setSendWhatsAppOnCreate] = useState(true);

  // Template Assign Modal
  const [assigningTemplate, setAssigningTemplate] = useState<DietTemplate | null>(null);
  const [assignTargetMember, setAssignTargetMember] = useState('GR-1005 (Bilal Ahmed)');

  // Calculator State
  const [calcWeight, setCalcWeight] = useState(78);
  const [calcHeight, setCalcHeight] = useState(176);
  const [calcAge, setCalcAge] = useState(28);
  const [calcGender, setCalcGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [calcActivity, setCalcActivity] = useState<number>(1.55); // Moderate
  const [calcGoal, setCalcGoal] = useState<'CUT' | 'MAINTAIN' | 'BULK'>('BULK');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter plans
  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.member.firstName.toLowerCase().includes(search.toLowerCase()) ||
      p.member.lastName.toLowerCase().includes(search.toLowerCase()) ||
      p.member.memberCode.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase());

    const matchesGoal = goalFilter === 'ALL' || p.goal === goalFilter;
    return matchesSearch && matchesGoal;
  });

  // Calculate BMR & TDEE
  const bmr =
    calcGender === 'MALE'
      ? 10 * calcWeight + 6.25 * calcHeight - 5 * calcAge + 5
      : 10 * calcWeight + 6.25 * calcHeight - 5 * calcAge - 161;

  const tdee = Math.round(bmr * calcActivity);
  const targetCals =
    calcGoal === 'CUT'
      ? Math.round(tdee - 450)
      : calcGoal === 'BULK'
      ? Math.round(tdee + 350)
      : tdee;

  const targetProtein = Math.round(calcWeight * 2.0); // 2g per kg
  const targetFat = Math.round((targetCals * 0.25) / 9);
  const targetCarbs = Math.max(50, Math.round((targetCals - targetProtein * 4 - targetFat * 9) / 4));

  const handleSaveDietPlan = () => {
    if (!builderTitle.trim()) {
      showToast('Please provide a title for the plan');
      return;
    }

    const newPlan: MemberDietItem = {
      id: `dp-${Date.now()}`,
      memberId: `mem-${Date.now()}`,
      member: {
        id: `mem-${Date.now()}`,
        firstName: builderMemberName.split(' ')[0] || 'Member',
        lastName: builderMemberName.split(' ')[1] || '',
        memberCode: builderMemberCode || `GR-${1000 + plans.length + 1}`,
        phone: '+923001122334',
        currentStreak: 0,
      },
      title: builderTitle,
      goal: builderGoal,
      targetCalories: builderCalories,
      targetProteinG: builderProtein,
      targetCarbsG: builderCarbs,
      targetFatG: builderFat,
      mealsCount: builderMeals.length,
      updatedAt: new Date().toISOString(),
      meals: builderMeals,
    };

    setPlans([newPlan, ...plans]);
    setIsBuilderOpen(false);

    if (sendWhatsAppOnCreate) {
      showToast(`Diet plan "${builderTitle}" saved & WhatsApp delivered to ${newPlan.member.memberCode}! 📲`);
    } else {
      showToast(`Diet plan "${builderTitle}" saved successfully!`);
    }
  };

  const handleApplyTemplate = () => {
    if (!assigningTemplate) return;

    const newPlan: MemberDietItem = {
      id: `dp-${Date.now()}`,
      memberId: `mem-${Date.now()}`,
      member: {
        id: `mem-${Date.now()}`,
        firstName: assignTargetMember.split('(')[1]?.split(' ')[0] || 'Member',
        lastName: assignTargetMember.split('(')[1]?.replace(')', '').split(' ')[1] || '',
        memberCode: assignTargetMember.split(' ')[0] || 'GR-1005',
        phone: '+923009988776',
        currentStreak: 6,
      },
      title: assigningTemplate.title,
      goal: assigningTemplate.goal,
      targetCalories: assigningTemplate.calories,
      targetProteinG: assigningTemplate.proteinG,
      targetCarbsG: assigningTemplate.carbsG,
      targetFatG: assigningTemplate.fatG,
      mealsCount: assigningTemplate.meals.length,
      updatedAt: new Date().toISOString(),
      meals: assigningTemplate.meals,
    };

    setPlans([newPlan, ...plans]);
    setAssigningTemplate(null);
    showToast(`Template "${assigningTemplate.title}" assigned to ${newPlan.member.memberCode}!`);
  };

  const generateWhatsAppCopy = (plan: MemberDietItem) => {
    let copy = `🥗 *Your Personalized Diet Plan — GymRetain*\nSalam ${plan.member.firstName}! Here is your nutrition blueprint:\n\n`;
    copy += `🎯 *Goal:* ${plan.goal.replace('_', ' ')}\n`;
    copy += `🔥 *Daily Target:* ${plan.targetCalories || 2200} kcal\n`;
    copy += `💪 *Macros:* ${plan.targetProteinG || 150}g Protein | ${plan.targetCarbsG || 200}g Carbs | ${plan.targetFatG || 60}g Fats\n\n`;
    copy += `*Daily Meal Schedule:*\n`;

    plan.meals.forEach((m, idx) => {
      copy += `${idx + 1}. *${m.mealType}:* ${m.description} (${m.calories || 0} kcal, ${m.proteinG || 0}g protein)\n`;
    });

    copy += `\nStay consistent and hit your daily goals! Reply if you need adjustments. 💪`;
    return copy;
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto select-none">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-surface border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-content-primary flex items-center gap-2">
                <Utensils className="w-6 h-6 text-purple-600 dark:text-cyan-400" />
                Diet &amp; Meal Plans
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-cyan-400 border border-purple-500/20 font-mono">
                {plans.length} Active Plans
              </span>
            </div>
            <p className="text-xs text-content-tertiary mt-1">
              Create customized meal plans, set daily calories and protein targets, and send meal schedules to members on WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBuilderTitle('Custom Fat Loss & Tone');
                setBuilderMemberCode('GR-1008');
                setBuilderMemberName('Sana Tariq');
                setIsBuilderOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all btn-shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create Meal Plan</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-surface border border-surface-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-content-secondary">Total On Plans</span>
              <Activity className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-content-primary mt-1 font-mono">
              {plans.length}
            </div>
            <div className="text-[11px] text-content-tertiary mt-0.5">Assigned to gym members</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-surface-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-content-secondary">Avg Daily Target</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-content-primary mt-1 font-mono">
              {Math.round(plans.reduce((acc, p) => acc + (p.targetCalories || 2200), 0) / plans.length)} kcal
            </div>
            <div className="text-[11px] text-content-tertiary mt-0.5">Calorie balance baseline</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-surface-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-content-secondary">Goal Distribution</span>
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-content-primary mt-1 font-mono">
              {plans.filter((p) => p.goal === 'WEIGHT_LOSS').length}W / {plans.filter((p) => p.goal === 'MUSCLE_GAIN').length}M
            </div>
            <div className="text-[11px] text-content-tertiary mt-0.5">Weight Loss vs Muscle Gain</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-surface-border shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-content-secondary">Templates Ready</span>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-content-primary mt-1 font-mono">
              {templates.length}
            </div>
            <div className="text-[11px] text-content-tertiary mt-0.5">Desi &amp; global presets</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-surface-border pb-2">
          <button
            onClick={() => setActiveTab('PLANS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'PLANS'
                ? 'bg-purple-600 text-white btn-shadow'
                : 'bg-surface hover:bg-surface-subtle border border-surface-border text-content-secondary hover:text-content-primary btn-shadow'
            }`}
          >
            Member Diet Plans ({plans.length})
          </button>

          <button
            onClick={() => setActiveTab('TEMPLATES')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'TEMPLATES'
                ? 'bg-purple-600 text-white btn-shadow'
                : 'bg-surface hover:bg-surface-subtle border border-surface-border text-content-secondary hover:text-content-primary btn-shadow'
            }`}
          >
            Template Library ({templates.length})
          </button>

          <button
            onClick={() => setActiveTab('CALCULATOR')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'CALCULATOR'
                ? 'bg-purple-600 text-white btn-shadow'
                : 'bg-surface hover:bg-surface-subtle border border-surface-border text-content-secondary hover:text-content-primary btn-shadow'
            }`}
          >
            Macro &amp; TDEE Calculator
          </button>
        </div>

        {/* TAB 1: Member Diet Plans */}
        {activeTab === 'PLANS' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by member name, code, plan..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary placeholder-content-tertiary outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto">
                {(['ALL', 'WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoalFilter(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      goalFilter === g
                        ? 'bg-purple-500/15 text-purple-700 dark:text-cyan-400 font-semibold border border-purple-500/30'
                        : 'bg-surface text-content-secondary hover:text-content-primary border border-surface-border'
                    }`}
                  >
                    {g.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Member Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-5 rounded-2xl bg-surface border border-surface-border hover:border-purple-500/40 dark:hover:border-cyan-400/40 transition-all shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-content-primary">
                            {plan.member.firstName} {plan.member.lastName}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-subtle border border-surface-border text-content-tertiary">
                            {plan.member.memberCode}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-purple-700 dark:text-cyan-400 mt-0.5">
                          {plan.title}
                        </h3>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                          plan.goal === 'WEIGHT_LOSS'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : plan.goal === 'MUSCLE_GAIN'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-cyan-400 border border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {plan.goal.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Macros Bar */}
                    <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-content-primary flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          {plan.targetCalories || 2200} kcal/day
                        </span>
                        <span className="text-[11px] text-content-tertiary">
                          {plan.mealsCount} meals scheduled
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t border-surface-border/60">
                        <div>
                          <div className="font-mono font-bold text-content-primary">
                            {plan.targetProteinG || 150}g
                          </div>
                          <div className="text-[10px] text-content-tertiary">Protein</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-content-primary">
                            {plan.targetCarbsG || 200}g
                          </div>
                          <div className="text-[10px] text-content-tertiary">Carbs</div>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-content-primary">
                            {plan.targetFatG || 60}g
                          </div>
                          <div className="text-[10px] text-content-tertiary">Fat</div>
                        </div>
                      </div>
                    </div>

                    {/* Preview of meals */}
                    <div className="space-y-1">
                      {plan.meals.slice(0, 2).map((m, idx) => (
                        <div key={idx} className="text-[11px] text-content-secondary truncate flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <span className="font-bold text-content-primary">{m.mealType}:</span>
                          <span className="truncate">{m.description}</span>
                        </div>
                      ))}
                      {plan.meals.length > 2 && (
                        <div className="text-[10px] text-content-tertiary pt-0.5">
                          + {plan.meals.length - 2} more meals
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-border/60">
                    <button
                      onClick={() => setViewPlan(plan)}
                      className="flex-1 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-surface-border text-xs font-semibold text-content-primary flex items-center justify-center gap-1.5 transition-all btn-shadow"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-600 dark:text-cyan-400" />
                      <span>View Plan</span>
                    </button>

                    <button
                      onClick={() => {
                        const copy = generateWhatsAppCopy(plan);
                        navigator.clipboard.writeText(copy);
                        showToast(`WhatsApp diet template copied for ${plan.member.memberCode}! 📋`);
                      }}
                      className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs transition-all btn-shadow"
                      title="Copy WhatsApp format"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Template Library */}
        {activeTab === 'TEMPLATES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-content-primary">
                  Pre-Built Nutritional Templates
                </h2>
                <p className="text-xs text-content-tertiary">
                  Standardized Pakistani &amp; global fitness diets ready to assign to any gym member with 1 click.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-5 rounded-2xl bg-surface border border-surface-border hover:border-purple-500/40 dark:hover:border-cyan-400/40 transition-all shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-content-primary">
                        {tmpl.title}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase bg-purple-500/10 text-purple-600 dark:text-cyan-400 border border-purple-500/20">
                        {tmpl.goal.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-content-secondary leading-relaxed">
                      {tmpl.description}
                    </p>

                    <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border space-y-1 text-xs">
                      <div className="font-semibold text-content-primary flex items-center justify-between">
                        <span>{tmpl.calories} kcal / day</span>
                        <span className="text-[11px] text-content-tertiary font-mono">{tmpl.meals.length} meals</span>
                      </div>
                      <div className="text-[11px] text-content-tertiary">
                        {tmpl.proteinG}g Protein • {tmpl.carbsG}g Carbs • {tmpl.fatG}g Fat
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider block">
                        Included Meals:
                      </span>
                      {tmpl.meals.map((m, i) => (
                        <div key={i} className="text-[11px] text-content-secondary truncate flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <span className="font-bold text-content-primary">{m.mealType}:</span>
                          <span className="truncate">{m.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setAssigningTemplate(tmpl)}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all btn-shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Assign Template to Member</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Macro & TDEE Calculator */}
        {activeTab === 'CALCULATOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600 dark:text-cyan-400" />
                  Member Body Metrics &amp; Energy Expenditure
                </h2>
                <p className="text-xs text-content-tertiary mt-0.5">
                  Scientifically calculate BMR (Mifflin-St Jeor) and TDEE based on workout frequency.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-content-secondary block mb-1">
                    Gender
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['MALE', 'FEMALE'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setCalcGender(g)}
                        className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          calcGender === g
                            ? 'bg-purple-600 text-white btn-shadow'
                            : 'bg-surface-subtle text-content-secondary border border-surface-border'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-content-secondary block mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={calcAge}
                    onChange={(e) => setCalcAge(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-primary font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-content-secondary block mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-primary font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-content-secondary block mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={calcHeight}
                    onChange={(e) => setCalcHeight(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-primary font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-content-secondary block mb-1">
                  Activity Level
                </label>
                <select
                  value={calcActivity}
                  onChange={(e) => setCalcActivity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-primary outline-none"
                >
                  <option value={1.2}>Sedentary (Little or no workout)</option>
                  <option value={1.375}>Lightly Active (Workouts 1-3 days/week)</option>
                  <option value={1.55}>Moderately Active (Workouts 3-5 days/week)</option>
                  <option value={1.725}>Very Active (Intense workouts 6-7 days/week)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-content-secondary block mb-1">
                  Target Fitness Goal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CUT', label: 'Fat Loss (-450 kcal)' },
                    { id: 'MAINTAIN', label: 'Maintain (TDEE)' },
                    { id: 'BULK', label: 'Muscle Gain (+350 kcal)' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setCalcGoal(g.id as any)}
                      className={`p-2 rounded-xl text-center text-xs font-semibold transition-all ${
                        calcGoal === g.id
                          ? 'bg-purple-600 text-white btn-shadow'
                          : 'bg-surface-subtle text-content-secondary border border-surface-border hover:text-content-primary'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calculated Results Card */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-border shadow-sm flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-content-primary flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-500" />
                    Target Caloric &amp; Macro Breakdown
                  </h2>
                  <p className="text-xs text-content-tertiary mt-0.5">
                    Recommended daily intake based on calculated expenditure.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border">
                    <span className="text-xs text-content-secondary block">Basal Metabolic Rate (BMR)</span>
                    <span className="text-xl font-black text-content-primary font-mono">{Math.round(bmr)} kcal</span>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border">
                    <span className="text-xs text-content-secondary block">Maintenance (TDEE)</span>
                    <span className="text-xl font-black text-content-primary font-mono">{tdee} kcal</span>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
                  <span className="text-xs font-semibold text-purple-700 dark:text-cyan-400 uppercase tracking-wider">
                    Recommended Daily Target
                  </span>
                  <div className="text-3xl font-black text-purple-900 dark:text-cyan-300 font-mono">
                    {targetCals} kcal
                  </div>
                </div>

                {/* Macro Split */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-center">
                    <div className="text-xs font-semibold text-content-tertiary">Protein (2g/kg)</div>
                    <div className="text-lg font-black text-content-primary font-mono mt-0.5">{targetProtein}g</div>
                    <div className="text-[10px] text-content-tertiary">{targetProtein * 4} kcal</div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-center">
                    <div className="text-xs font-semibold text-content-tertiary">Carbohydrates</div>
                    <div className="text-lg font-black text-content-primary font-mono mt-0.5">{targetCarbs}g</div>
                    <div className="text-[10px] text-content-tertiary">{targetCarbs * 4} kcal</div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-center">
                    <div className="text-xs font-semibold text-content-tertiary">Fats (25%)</div>
                    <div className="text-lg font-black text-content-primary font-mono mt-0.5">{targetFat}g</div>
                    <div className="text-[10px] text-content-tertiary">{targetFat * 9} kcal</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setBuilderTitle(`${calcGoal === 'CUT' ? 'Fat Loss Deficit' : 'Muscle Gain Surplus'} (${targetCals} kcal)`);
                  setBuilderCalories(targetCals);
                  setBuilderProtein(targetProtein);
                  setBuilderCarbs(targetCarbs);
                  setBuilderFat(targetFat);
                  setIsBuilderOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all btn-shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Create Plan Using These Targets</span>
              </button>
            </div>
          </div>
        )}

        {/* MODAL 1: View Full Plan */}
        {viewPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface max-w-lg w-full rounded-2xl p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] flex flex-col">
              <button
                onClick={() => setViewPlan(null)}
                className="absolute right-4 top-4 p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 flex items-center justify-center border border-purple-500/20">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-content-primary">{viewPlan.title}</h3>
                  <p className="text-xs text-content-secondary">
                    Assigned to {viewPlan.member.firstName} {viewPlan.member.lastName} ({viewPlan.member.memberCode})
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border mb-4 grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="font-bold text-content-primary font-mono">{viewPlan.targetCalories || 2200}</div>
                  <div className="text-[10px] text-content-tertiary">Calories</div>
                </div>
                <div>
                  <div className="font-bold text-content-primary font-mono">{viewPlan.targetProteinG || 150}g</div>
                  <div className="text-[10px] text-content-tertiary">Protein</div>
                </div>
                <div>
                  <div className="font-bold text-content-primary font-mono">{viewPlan.targetCarbsG || 200}g</div>
                  <div className="text-[10px] text-content-tertiary">Carbs</div>
                </div>
                <div>
                  <div className="font-bold text-content-primary font-mono">{viewPlan.targetFatG || 60}g</div>
                  <div className="text-[10px] text-content-tertiary">Fat</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-4">
                <div className="text-xs font-bold text-content-primary uppercase tracking-wider">
                  Scheduled Meals ({viewPlan.meals.length})
                </div>
                {viewPlan.meals.map((meal, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-surface-subtle border border-surface-border space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-700 dark:text-cyan-400">
                        {meal.mealType}
                      </span>
                      {meal.calories && (
                        <span className="text-[11px] font-mono text-content-tertiary">
                          {meal.calories} kcal • {meal.proteinG || 0}g protein
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-content-secondary leading-relaxed">
                      {meal.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-surface-border">
                <button
                  onClick={() => {
                    const copy = generateWhatsAppCopy(viewPlan);
                    navigator.clipboard.writeText(copy);
                    showToast('WhatsApp diet message copied! 📋');
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 btn-shadow"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Copy WhatsApp Template</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Create Diet Plan Builder */}
        {isBuilderOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface max-w-lg w-full rounded-2xl p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] flex flex-col">
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 flex items-center justify-center border border-purple-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-content-primary">Create New Diet Plan</h3>
                  <p className="text-xs text-content-secondary">Set calories, macros, and daily meals</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-content-secondary block mb-1">
                      Member Code
                    </label>
                    <input
                      type="text"
                      value={builderMemberCode}
                      onChange={(e) => setBuilderMemberCode(e.target.value)}
                      placeholder="e.g. GR-1008"
                      className="w-full px-3 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-content-secondary block mb-1">
                      Member Name
                    </label>
                    <input
                      type="text"
                      value={builderMemberName}
                      onChange={(e) => setBuilderMemberName(e.target.value)}
                      placeholder="e.g. Sana Tariq"
                      className="w-full px-3 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-content-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-content-secondary block mb-1">
                    Plan Title
                  </label>
                  <input
                    type="text"
                    value={builderTitle}
                    onChange={(e) => setBuilderTitle(e.target.value)}
                    placeholder="e.g. 8-Week Hypertrophy Surplus"
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-content-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="font-semibold text-content-secondary block mb-1">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={builderCalories}
                      onChange={(e) => setBuilderCalories(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono outline-none text-center"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-content-secondary block mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={builderProtein}
                      onChange={(e) => setBuilderProtein(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono outline-none text-center"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-content-secondary block mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={builderCarbs}
                      onChange={(e) => setBuilderCarbs(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono outline-none text-center"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-content-secondary block mb-1">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      value={builderFat}
                      onChange={(e) => setBuilderFat(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono outline-none text-center"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-content-primary">Meals Schedule</span>
                    <button
                      type="button"
                      onClick={() =>
                        setBuilderMeals([
                          ...builderMeals,
                          { mealType: 'SNACK', description: 'Handful of almonds with green tea', calories: 150, proteinG: 6, carbsG: 6, fatG: 12 },
                        ])
                      }
                      className="text-[11px] font-semibold text-purple-600 dark:text-cyan-400 hover:underline"
                    >
                      + Add Meal
                    </button>
                  </div>

                  {builderMeals.map((meal, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-surface-subtle border border-surface-border space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={meal.mealType}
                          onChange={(e) => {
                            const updated = [...builderMeals];
                            updated[idx].mealType = e.target.value as any;
                            setBuilderMeals(updated);
                          }}
                          className="px-2 py-1 rounded-lg bg-surface border border-surface-border text-xs text-content-primary outline-none"
                        >
                          <option value="BREAKFAST">BREAKFAST</option>
                          <option value="LUNCH">LUNCH</option>
                          <option value="DINNER">DINNER</option>
                          <option value="SNACK">SNACK</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setBuilderMeals(builderMeals.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-xs p-1"
                        >
                          Remove
                        </button>
                      </div>

                      <input
                        type="text"
                        value={meal.description}
                        onChange={(e) => {
                          const updated = [...builderMeals];
                          updated[idx].description = e.target.value;
                          setBuilderMeals(updated);
                        }}
                        placeholder="Food items, portion sizes..."
                        className="w-full px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-content-primary outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="sendWa"
                    checked={sendWhatsAppOnCreate}
                    onChange={(e) => setSendWhatsAppOnCreate(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                  <label htmlFor="sendWa" className="text-xs text-content-secondary cursor-pointer">
                    Send WhatsApp nutrition summary notification to member now
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-subtle hover:bg-surface border border-surface-border text-xs font-semibold text-content-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDietPlan}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold btn-shadow"
                >
                  Save &amp; Assign Diet Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Template Quick-Assign */}
        {assigningTemplate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface max-w-md w-full rounded-2xl p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => setAssigningTemplate(null)}
                className="absolute right-4 top-4 p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 flex items-center justify-center border border-purple-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-content-primary">
                    Assign {assigningTemplate.title}
                  </h3>
                  <p className="text-xs text-content-secondary">
                    {assigningTemplate.calories} kcal • {assigningTemplate.meals.length} scheduled meals
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-5 text-xs">
                <div>
                  <label className="font-semibold text-content-secondary block mb-1">
                    Select Member
                  </label>
                  <select
                    value={assignTargetMember}
                    onChange={(e) => setAssignTargetMember(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-primary outline-none"
                  >
                    <option value="GR-1005 (Bilal Ahmed)">GR-1005 — Bilal Ahmed (Streak: 6 days)</option>
                    <option value="GR-1006 (Ali Raza)">GR-1006 — Ali Raza (Streak: 5 days)</option>
                    <option value="GR-1007 (Omer Farooq)">GR-1007 — Omer Farooq (At-Risk)</option>
                    <option value="GR-1008 (Sana Tariq)">GR-1008 — Sana Tariq (Medium Risk)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setAssigningTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-surface-subtle hover:bg-surface border border-surface-border text-xs font-semibold text-content-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold btn-shadow"
                >
                  Confirm &amp; Assign Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
