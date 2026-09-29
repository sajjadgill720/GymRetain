'use client';

import React, { useState, useEffect } from 'react';
import { TopNavbar } from '../../components/TopNavbar';
import { QuickCheckInModal } from '../../components/QuickCheckInModal';
import { FrontDeskQrModal } from '../../components/FrontDeskQrModal';
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
} from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

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
      const res = await api.getMembers(search, statusFilter);
      setMembers(res.members);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search, statusFilter]);

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
    <div className="min-h-screen bg-[#111111] flex flex-col">
      <TopNavbar
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenCheckInModal={() => setIsCheckInOpen(true)}
      />

      <main className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
        {/* Page Context Ribbon */}
        <div className="border-b border-[#26221E] bg-[#161310]/50 py-4 px-4 sm:px-8">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F7F5F2]">Member Directory</h1>
              <p className="text-xs text-[#A39E98] mt-0.5">Manage gym members, attendance history, active streaks, and membership plans</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#BFA785] hover:bg-[#B29976] text-xs font-bold text-[#111111] shadow-md shadow-[#BFA785]/25 hover:shadow-lg hover:shadow-[#BFA785]/35 btn-shadow-primary transition-all shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
          {/* Search & Filters Bar */}
          <div className="bg-[#161310] border border-[#2A2520] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#A39E98] absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, member code (e.g. GR-1001), or phone (+92...)"
                className="w-full bg-[#1C1814] border border-[#2A2520] focus:border-[#BFA785] rounded-xl pl-10 pr-4 py-2 text-xs text-[#F7F5F2] placeholder-[#6B6661] focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
              <Filter className="w-4 h-4 text-[#A39E98]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1C1814] border border-[#2A2520] rounded-xl px-3 py-2 text-xs text-[#F7F5F2] focus:outline-none focus:border-[#BFA785]"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
                <option value="FROZEN">Frozen Only</option>
              </select>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#BFA785] hover:bg-[#B29976] text-xs font-bold text-[#111111] shadow-md shadow-[#BFA785]/25 hover:shadow-lg hover:shadow-[#BFA785]/35 btn-shadow-primary transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-[#161310] border border-[#2A2520] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#26221E] text-[#A39E98] text-[11px] uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-1">Member</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Current Streak</th>
                    <th className="pb-3">Active Membership</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-1">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26221E]">
                  {members.map((member) => {
                    const currentStreak = member.streak?.currentStreak || 0;
                    const activePlan = member.memberships?.[0];

                    return (
                      <tr key={member.id} className="hover:bg-[#1C1814]/60 transition-colors group">
                        {/* Member Name */}
                        <td className="py-3.5 pl-1">
                          <div className="font-semibold text-[#F7F5F2] group-hover:text-[#BFA785] transition-colors">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-[11px] text-[#A39E98] font-mono mt-0.5">
                            {member.memberCode}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5 text-[#F7F5F2] font-mono">
                            <Phone className="w-3.5 h-3.5 text-[#A39E98]" />
                            <span>{member.phone}</span>
                          </div>
                          {member.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#A39E98] mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-[#6B6661]" />
                              <span>{member.email}</span>
                            </div>
                          )}
                        </td>

                        {/* Streak Badge */}
                        <td className="py-3.5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#BFA785]/15 border border-[#BFA785]/30 text-[#BFA785]">
                            <Flame className="w-3.5 h-3.5 text-[#BFA785]" />
                            <span className="font-bold font-mono text-xs">{currentStreak}</span>
                            <span className="text-[10px] text-[#BFA785]">days</span>
                          </div>
                        </td>

                        {/* Active Plan */}
                        <td className="py-3.5">
                          {activePlan ? (
                            <div>
                              <div className="font-semibold text-[#F7F5F2]">{activePlan.planName}</div>
                              <div className="text-[10px] text-[#A39E98] font-mono">
                                PKR {(activePlan.price / 100).toLocaleString()} • Exp: {activePlan.endDate}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#6B6661] italic text-[11px]">No active plan</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5">
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              member.status === 'ACTIVE'
                                ? 'bg-[#4E9F6E]/15 text-[#4E9F6E] border border-[#4E9F6E]/30'
                                : member.status === 'FROZEN'
                                ? 'bg-[#E5A13B]/15 text-[#E5A13B] border border-[#E5A13B]/30'
                                : 'bg-[#26221E] text-[#A39E98]'
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 text-right pr-1">
                          <button
                            onClick={() => {
                              setIsCheckInOpen(true);
                            }}
                            className="text-xs px-3 py-1.5 rounded-xl bg-[#1C1814] hover:bg-[#26221E] text-[#F7F5F2] hover:text-[#BFA785] border border-[#2A2520] hover:border-[#BFA785]/40 transition-all shadow-sm btn-shadow"
                          >
                            Check In
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
      </main>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161310] max-w-lg w-full rounded-2xl p-6 border border-[#2A2520] shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-[#A39E98] hover:text-white hover:bg-[#26221E] shadow-sm btn-shadow"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#BFA785]/15 text-[#BFA785] flex items-center justify-center border border-[#BFA785]/30 shadow-sm shadow-[#BFA785]/10">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F7F5F2]">Enroll New Gym Member</h3>
                <p className="text-xs text-[#A39E98]">Scoped strictly to current gym tenant</p>
              </div>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#A39E98] block mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    placeholder="e.g. Usman"
                    className="w-full bg-[#1C1814] border border-[#2A2520] focus:border-[#BFA785] rounded-xl px-3 py-2 text-xs text-[#F7F5F2] placeholder-[#6B6661] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#A39E98] block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    placeholder="e.g. Khan"
                    className="w-full bg-[#1C1814] border border-[#2A2520] focus:border-[#BFA785] rounded-xl px-3 py-2 text-xs text-[#F7F5F2] placeholder-[#6B6661] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#A39E98] block mb-1">
                    Phone (WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+923001234567"
                    className="w-full bg-[#1C1814] border border-[#2A2520] focus:border-[#BFA785] rounded-xl px-3 py-2 text-xs text-[#F7F5F2] placeholder-[#6B6661] font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#A39E98] block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="member@email.com"
                    className="w-full bg-[#1C1814] border border-[#2A2520] focus:border-[#BFA785] rounded-xl px-3 py-2 text-xs text-[#F7F5F2] placeholder-[#6B6661] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#A39E98] block mb-1">
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
                    className="bg-[#1C1814] border border-[#2A2520] rounded-xl px-3 py-2 text-xs text-[#F7F5F2] focus:outline-none"
                  >
                    <option value="Monthly Standard">Monthly Standard (5,000 PKR)</option>
                    <option value="Monthly Gold">Monthly Gold (6,500 PKR)</option>
                    <option value="Quarterly VIP">Quarterly VIP (16,000 PKR)</option>
                  </select>

                  <div className="bg-[#1C1814] border border-[#2A2520] rounded-xl px-3 py-2 text-xs text-[#4E9F6E] font-mono flex items-center">
                    PKR {(formPricePaisa / 100).toLocaleString()} (paisa: {formPricePaisa})
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#26221E]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A39E98] hover:text-white hover:bg-[#26221E] transition-all btn-shadow"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#BFA785] hover:bg-[#B29976] disabled:opacity-50 text-xs font-bold text-[#111111] shadow-md shadow-[#BFA785]/25 hover:shadow-lg hover:shadow-[#BFA785]/35 btn-shadow-primary transition-all"
                >
                  {formSubmitting ? 'Registering...' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check In Modal */}
      <QuickCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onCheckInSuccess={() => fetchMembers()}
      />

      <FrontDeskQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
