"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import { api } from "../lib/api";
import { MemberRiskDetails } from "../types";
import {
  AlertTriangle,
  Clock,
  Search,
  ArrowRight,
  Send,
  CheckCircle2,
} from "@/components/icons";

interface AtRiskMembersTableProps {
  members: MemberRiskDetails[];
  limit?: number;
  showFilters?: boolean;
  loading?: boolean;
  initialSearch?: string;
  initialRisk?: "ALL" | "HIGH" | "MEDIUM";
}

export const AtRiskMembersTable: React.FC<AtRiskMembersTableProps> = ({
  members,
  limit,
  showFilters = true,
  loading = false,
  initialSearch = "",
  initialRisk = "ALL",
}) => {
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "ALL" | "HIGH" | "MEDIUM"
  >("ALL");
  useEffect(() => {
    setSearch(initialSearch);
    setSelectedFilter(initialRisk);
  }, [initialSearch, initialRisk]);
  const [activeNudgeMember, setActiveNudgeMember] =
    useState<MemberRiskDetails | null>(null);
  const [nudgeSent, setNudgeSent] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Retention Intervention State
  const [draftMessage, setDraftMessage] = useState("");
  const [outreachNotes, setOutreachNotes] = useState("");
  const [outreachOutcome, setOutreachOutcome] = useState("SENT");
  const [followUpDate, setFollowUpDate] = useState("");
  const [savingIntervention, setSavingIntervention] = useState(false);

  const filtered = members.filter((m) => {
    if (
      search &&
      !`${m.fullName} ${m.memberCode} ${m.phone}`
        .toLowerCase()
        .includes(search.toLowerCase().trim())
    )
      return false;
    if (selectedFilter === "HIGH") return m.riskLevel === "HIGH";
    if (selectedFilter === "MEDIUM") return m.riskLevel === "MEDIUM";
    return true;
  });

  const displayList = limit ? filtered.slice(0, limit) : filtered;

  const handleSelectMemberForNudge = (m: MemberRiskDetails) => {
    setSaveError("");
    setActiveNudgeMember(m);
    setDraftMessage(
      `Assalam-o-Alaikum ${m.fullName.split(" ")[0]} bhai! We noticed you haven't visited in the last ${m.factors.daysSinceLastCheckIn} days. Your fitness journey matters to us! Drop by anytime this week for a recharge session. 💪`,
    );
    setOutreachNotes("");
    setOutreachOutcome("SENT");
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    setFollowUpDate(nextWeek.toISOString().split("T")[0]);
  };

  const handleSendNudge = async () => {
    if (!activeNudgeMember) return;
    setSavingIntervention(true);
    setSaveError("");
    try {
      await api.recordRetentionIntervention({
        memberId: activeNudgeMember.memberId,
        outreachMethod: "WHATSAPP",
        notes: outreachNotes
          ? `${outreachNotes} | Draft: "${draftMessage}"`
          : draftMessage,
        outcome: outreachOutcome,
        followUpDate: followUpDate
          ? new Date(followUpDate).toISOString()
          : undefined,
      });
      setNudgeSent(true);
      setTimeout(() => {
        setNudgeSent(false);
        setActiveNudgeMember(null);
      }, 1800);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save the follow-up. Please try again.",
      );
    } finally {
      setSavingIntervention(false);
    }
  };

  return (
    <div className="premium-panel overflow-hidden">
      <div className="px-6 sm:px-8 pt-7 pb-6 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="premium-eyebrow mb-2">Make the next move</p>
          <h2 className="text-xl font-medium tracking-tight text-content-primary">
            Your follow-up queue
            <span className="ml-3 text-sm text-content-tertiary font-normal">
              {members.length}
            </span>
          </h2>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 w-4 h-4 text-content-tertiary" />
          <input
            type="search"
            aria-label="Search follow-up queue"
            placeholder="Find a member"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 w-full pl-10 pr-3 rounded-lg border border-surface-border bg-transparent text-xs outline-none focus:border-[var(--accent-brand)]"
          />
        </div>
      </div>
      {showFilters && (
        <div className="flex gap-5 sm:gap-7 border-b border-surface-border px-6 sm:px-8 overflow-x-auto">
          {(
            [
              { key: "ALL", label: "All members", count: members.length },
              {
                key: "HIGH",
                label: "Priority",
                count: members.filter((m) => m.riskLevel === "HIGH").length,
              },
              {
                key: "MEDIUM",
                label: "Slipping",
                count: members.filter((m) => m.riskLevel === "MEDIUM").length,
              },
            ] as const
          ).map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              aria-pressed={selectedFilter === filter.key}
              className={`relative flex items-center gap-2 pb-4 pt-1 text-xs whitespace-nowrap border-b-2 rounded-none ${selectedFilter === filter.key ? "border-[var(--accent-brand)] text-content-primary font-semibold" : "border-transparent text-content-secondary"}`}
            >
              {filter.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle text-content-secondary">
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <div
          role="status"
          className="py-16 text-center text-sm text-content-secondary"
        >
          Loading your follow-up queue…
        </div>
      ) : !displayList.length ? (
        <div className="py-16 px-6 text-center">
          <p className="text-sm font-medium">
            {search ? "No matching members" : "All clear for now"}
          </p>
          <p className="text-xs text-content-secondary mt-2">
            {search
              ? "Try another name or member code."
              : "No members in this group need a follow-up."}
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden divide-y divide-surface-border">
            {displayList.map((m) => (
              <div
                key={m.memberId}
                data-tone={m.riskLevel === "HIGH" ? "danger" : "warning"}
                className="status-member-card px-6 py-6"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[var(--accent-brand-bg)] text-[var(--accent-brand)] flex items-center justify-center text-xs font-medium shrink-0">
                    {m.fullName
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.fullName}</p>
                    <p className="text-[11px] text-content-tertiary mt-1">
                      {m.memberCode} · {m.factors.daysSinceLastCheckIn} days
                      away
                    </p>
                  </div>
                  <span
                    data-tone={m.riskLevel === "HIGH" ? "danger" : "warning"}
                    className="status-pill ml-auto"
                  >
                    {m.riskLevel === "HIGH" ? (
                      <AlertTriangle aria-hidden="true" />
                    ) : (
                      <Clock aria-hidden="true" />
                    )}
                    {m.riskLevel === "HIGH" ? "Priority" : "Slipping"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-5">
                  <span
                    data-tone={
                      m.factors.isPaymentOverdue ? "danger" : "success"
                    }
                    className="status-pill"
                  >
                    {m.factors.isPaymentOverdue ? (
                      <AlertTriangle aria-hidden="true" />
                    ) : (
                      <CheckCircle2 aria-hidden="true" />
                    )}
                    {m.factors.isPaymentOverdue ? "Overdue" : "Up to date"}
                  </span>
                  <button
                    onClick={() => handleSelectMemberForNudge(m)}
                    className="flex items-center gap-2 px-3 py-2 border border-surface-border rounded-lg text-xs font-medium"
                  >
                    Follow up <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="retention-table w-full text-left">
              <thead>
                <tr className="text-content-tertiary">
                  <th>Member</th>
                  <th>Signal</th>
                  <th>Attendance</th>
                  <th>Account</th>
                  <th className="text-right">Next step</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((m) => (
                  <tr
                    key={m.memberId}
                    data-tone={m.riskLevel === "HIGH" ? "danger" : "warning"}
                    className="status-row transition-colors"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-[var(--accent-brand-bg)] text-[var(--accent-brand)] flex items-center justify-center text-xs font-medium shrink-0">
                          {m.fullName
                            .split(" ")
                            .map((word) => word[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div>
                          <p className="font-medium whitespace-nowrap">
                            {m.fullName}
                          </p>
                          <p className="text-[11px] text-content-tertiary mt-1">
                            {m.memberCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        data-tone={
                          m.riskLevel === "HIGH" ? "danger" : "warning"
                        }
                        className="status-pill"
                      >
                        {m.riskLevel === "HIGH" ? (
                          <AlertTriangle aria-hidden="true" />
                        ) : (
                          <Clock aria-hidden="true" />
                        )}
                        {m.riskLevel === "HIGH" ? "Priority" : "Slipping"}
                      </span>
                    </td>
                    <td>
                      <p className="text-content-primary whitespace-nowrap">
                        {m.factors.daysSinceLastCheckIn} days away
                      </p>
                      <p className="text-[11px] text-content-tertiary mt-1">
                        Visits down {m.factors.frequencyDropPercentage}%
                      </p>
                    </td>
                    <td>
                      <span
                        data-tone={
                          m.factors.isPaymentOverdue ? "danger" : "success"
                        }
                        className="status-pill"
                      >
                        {m.factors.isPaymentOverdue ? (
                          <AlertTriangle aria-hidden="true" />
                        ) : (
                          <CheckCircle2 aria-hidden="true" />
                        )}
                        {m.factors.isPaymentOverdue
                          ? "Payment overdue"
                          : "Up to date"}
                      </span>
                      <p className="text-[11px] text-content-tertiary mt-1">
                        {m.factors.isRecentlyBrokenStreak
                          ? "Streak interrupted"
                          : "Routine changing"}
                      </p>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleSelectMemberForNudge(m)}
                        aria-label={`Follow up with ${m.fullName}`}
                        className="inline-flex items-center gap-3 rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-xs font-medium whitespace-nowrap hover:border-[var(--border-hover)]"
                      >
                        Follow up{" "}
                        <ArrowRight className="w-3.5 h-3.5 text-content-tertiary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <div className="border-t border-surface-border px-6 sm:px-8 py-4 text-[11px] text-content-tertiary flex flex-wrap items-center justify-between gap-2">
        <span>
          {displayList.length} of {members.length} members
          {search ? " matching your search" : " in your queue"}
        </span>
        <span>Personal follow-ups. Meaningful progress.</span>
      </div>

      <Modal
        isOpen={!!activeNudgeMember}
        onClose={() => setActiveNudgeMember(null)}
        title="Member follow-up"
        description="Review your message and record the outcome."
        maxWidth="lg"
      >
        {activeNudgeMember && (
          <>
            {/* Recipient info & Heuristic Explanation */}
            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border mb-4 text-xs space-y-1.5">
              <div className="flex justify-between text-content-tertiary">
                <span>Member:</span>
                <span className="font-semibold text-content-primary">
                  {activeNudgeMember.fullName} ({activeNudgeMember.memberCode})
                </span>
              </div>
              <div className="flex justify-between text-content-tertiary">
                <span>Attendance change:</span>
                <span className="text-status-danger-text font-bold">
                  {activeNudgeMember.factors.daysSinceLastCheckIn} days absent ·
                  Visits down{" "}
                  {activeNudgeMember.factors.frequencyDropPercentage}%
                </span>
              </div>
              <div className="text-[10px] text-content-tertiary pt-1 border-t border-surface-border">
                Use attendance signals as a starting point for a personal
                conversation.
              </div>
            </div>

            {/* Editable Outreach Draft */}
            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="font-semibold text-content-secondary block mb-1">
                  Your message
                </label>
                <textarea
                  rows={4}
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-subtle border border-surface-border text-content-primary focus:border-brand-500 outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-content-secondary block mb-1">
                    Conversation outcome
                  </label>
                  <select
                    value={outreachOutcome}
                    onChange={(e) => setOutreachOutcome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary focus:border-brand-500 outline-none"
                  >
                    <option value="SENT">Message Queued / Sent</option>
                    <option value="CALL_COMPLETED">Phone Call Completed</option>
                    <option value="MEMBER_RETURNED">
                      Member Promised Return
                    </option>
                    <option value="PAUSED_MEMBERSHIP">
                      Membership Paused (Travel/Medical)
                    </option>
                    <option value="UNRESPONSIVE">Unresponsive</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-content-secondary block mb-1">
                    Next Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-content-secondary block mb-1">
                  Team notes
                </label>
                <input
                  type="text"
                  value={outreachNotes}
                  onChange={(e) => setOutreachNotes(e.target.value)}
                  placeholder="e.g. Member had exams, returning next Monday"
                  className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <a
              href={`https://wa.me/${activeNudgeMember.phone.replace(/\D/g, "")}?text=${encodeURIComponent(draftMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-xl border border-surface-border px-4 py-3 text-sm font-medium mb-4 btn-shadow"
            >
              Review message in WhatsApp
            </a>
            <p className="text-xs text-content-secondary mb-4">
              Send your message in WhatsApp, then save the outcome and notes
              here.
            </p>
            {saveError && (
              <p role="alert" className="text-sm text-status-danger-text mb-4">
                {saveError}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-border">
              <button
                onClick={() => setActiveNudgeMember(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-content-tertiary hover:text-content-primary hover:bg-surface-subtle transition-all btn-shadow"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNudge}
                disabled={nudgeSent || savingIntervention}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md btn-shadow transition-all disabled:opacity-50"
              >
                {nudgeSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Intervention Logged!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>
                      {savingIntervention ? "Saving..." : "Save follow-up"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
