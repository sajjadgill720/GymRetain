"use client";
import { useLiveRefresh } from '@/lib/use-live-refresh';

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "../../components/AppLayout";
import { AtRiskMembersTable } from "../../components/AtRiskMembersTable";
import { api } from "../../lib/api";
import { MemberRiskDetails } from "../../types";
import {
  ArrowsClockwise,
  ShieldCheck,
} from "@/components/icons";

function RetentionContent() {
  const params = useSearchParams();
  const [members, setMembers] = useState<MemberRiskDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fetchRisk = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMembers(await api.getAtRiskMembers());
    } catch {
      setError("We couldn’t load the follow-up queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);
  useLiveRefresh(fetchRisk);
  useEffect(() => {
    fetchRisk();
  }, [fetchRisk]);
  const urgent = members.filter((member) => member.riskLevel === "HIGH").length;
  const slipping = members.filter(
    (member) => member.riskLevel === "MEDIUM",
  ).length;
  const overdue = members.filter(
    (member) => member.factors.isPaymentOverdue,
  ).length;

  return (
    <AppLayout onRefreshData={fetchRisk}>
      <div className="retention-workspace max-w-[1480px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="membership-heading flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1>Retention</h1>
            <p className="text-xs sm:text-sm text-content-secondary mt-1">Spot changing routines. Plan the next follow-up.</p>
          </div>
          <button
            onClick={fetchRisk}
            disabled={loading}
            className="flex items-center gap-2.5 rounded-lg px-4 py-2.5 border border-surface-border bg-surface text-xs font-medium"
          >
            <ArrowsClockwise
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Refreshing" : "Refresh queue"}
          </button>
        </div>

        <dl className="membership-summary retention-summary" aria-label="Retention overview">
          <div><dt>Priority follow-ups</dt><dd className="text-status-danger-text">{loading ? "—" : urgent}</dd><span className="sr-only">Members with high retention risk</span></div>
          <div><dt>Changing routines</dt><dd className="text-status-warning-text">{loading ? "—" : slipping}</dd><span className="sr-only">Members whose attendance is slipping</span></div>
          <div><dt>Payments up to date</dt><dd>{loading ? "—" : members.length - overdue}</dd><span className="sr-only">Members in this queue without overdue fees</span></div>
        </dl>
        {error && (
          <p role="alert" className="text-sm text-status-danger-text">
            {error}
          </p>
        )}
        <section id="follow-up-queue" className="scroll-mt-24">
          <AtRiskMembersTable
            members={members}
            showFilters
            loading={loading}
            initialSearch={params.get("search") || ""}
            initialRisk={
              params.get("risk") === "HIGH"
                ? "HIGH"
                : params.get("risk") === "MEDIUM"
                  ? "MEDIUM"
                  : "ALL"
            }
          />
        </section>
        <p className="text-[11px] text-content-tertiary flex items-center gap-2 pb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Risk signals guide your team’s judgment.
        </p>
      </div>
    </AppLayout>
  );
}

export default function RetentionPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading member care…</p>}>
      <RetentionContent />
    </Suspense>
  );
}
