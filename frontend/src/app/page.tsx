"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthProvider";
import {
  DashboardSummary,
  AttendanceTrendPoint,
  MemberRiskDetails,
} from "@/types";
import {
  OperationsState,
  localDate,
  money,
  downloadCsv,
} from "@/lib/operations";
import {
  Users,
  UserCheck,
  ArrowRight,
  Plus,
  ArrowUpRight,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  Warning,
  Download,
  Fire,
  RefreshCw,
  QrCode,
} from "@/components/icons";

export default function DashboardPage() {
  const { user, activeGym, isLoading: authLoading } = useAuth();
  const canManage =
    !user || ["GYM_OWNER", "GYM_MANAGER", "SUPER_ADMIN"].includes(user.role);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [operations, setOperations] = useState<OperationsState | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [risk, setRisk] = useState<MemberRiskDetails[]>([]);
  const [trend, setTrend] = useState<AttendanceTrendPoint[]>([]);
  const [period, setPeriod] = useState(14);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string[]>([]);
  const [busyTask, setBusyTask] = useState("");
  const [taskError, setTaskError] = useState("");
  const request = useRef(0);
  const timezone = activeGym?.timezone || "Asia/Karachi";
  const today = localDate(new Date(), timezone);
  const load = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setFailed([]);
    const results = await Promise.allSettled([
      api.getDashboardSummary(),
      canManage ? api.getOperations() : Promise.resolve(null),
      canManage ? api.getPaymentRecords() : Promise.resolve([]),
      api.getAtRiskMembers(),
      canManage ? api.getSubscriptions() : Promise.resolve([]),
    ]);
    if (id !== request.current) return;
    const labels = [
      "Overview",
      "Operations",
      "Collections",
      "Retention",
      "Memberships",
    ];
    const errors: string[] = [];
    results.forEach((result, index) => {
      if (result.status === "rejected") errors.push(labels[index]);
      else {
        if (index === 0) setSummary(result.value as DashboardSummary);
        if (index === 1) setOperations(result.value as OperationsState | null);
        if (index === 2) setPayments(result.value as any[]);
        if (index === 3) setRisk(result.value as MemberRiskDetails[]);
        if (index === 4) setSubscriptions(result.value as any[]);
      }
    });
    setFailed(errors);
    setLoading(false);
  }, [canManage]);
  useEffect(() => {
    if (!authLoading) load();
    return () => {
      request.current++;
    };
  }, [load, authLoading, activeGym?.id]);
  useEffect(() => {
    if (authLoading) return;
    let alive = true;
    api
      .getAttendanceTrends(period)
      .then((rows) => {
        if (alive) setTrend(rows);
      })
      .catch(() => {
        if (alive) setTrend([]);
      });
    return () => {
      alive = false;
    };
  }, [period, activeGym?.id, authLoading]);
  const kpis = summary?.kpis;
  const occupancy = kpis?.currentlyCheckedIn || 0;
  const capacity = kpis?.capacity || 100;
  const usage = Math.round((occupancy / capacity) * 100);
  const collections = payments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((sum, payment) => sum + Number(payment.amount || 0) * 100, 0);
  const renewals = subscriptions.filter(
    (item) =>
      item.status === "ACTIVE" &&
      localDate(new Date(item.endDate), timezone) >= today &&
      Date.parse(item.endDate) <= Date.now() + 7 * 86400000,
  );
  const dues = subscriptions.filter(
    (item) => item.status === "PENDING_PAYMENT" || item.status === "EXPIRED",
  );
  const tasks =
    operations?.tasks
      .filter((task) => !task.completed)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)) || [];
  const sessions =
    operations?.sessions
      .filter(
        (session) =>
          localDate(new Date(session.startsAt), timezone) === today &&
          session.status === "SCHEDULED",
      )
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)) || [];
  const leads =
    operations?.leads.filter(
      (lead) => !["JOINED", "LOST"].includes(lead.stage),
    ) || [];
  const attendanceTotal = trend.reduce((sum, point) => sum + point.checkIns, 0);
  const max = Math.max(1, ...trend.map((point) => point.checkIns));
  const finishTask = async (id: string) => {
    if (!operations) return;
    setBusyTask(id);
    setTaskError("");
    try {
      setOperations(
        await api.mutateOperations({
          kind: "tasks",
          action: "update",
          id,
          version: operations.version,
          data: { completed: true },
        }),
      );
    } catch (err) {
      setTaskError(
        err instanceof Error ? err.message : "Could not complete the task.",
      );
    } finally {
      setBusyTask("");
    }
  };
  const report = () =>
    downloadCsv(
      `gym-daily-brief-${today}.csv`,
      ["Metric", "Value", "Period"],
      [
        ["Gym", activeGym?.name || "Demo gym", today],
        ["Active members", kpis?.activeMembers ?? "Unavailable", today],
        [
          "Unique check-ins",
          kpis?.membersCheckedInToday ?? "Unavailable",
          today,
        ],
        ["Open visits", kpis?.currentlyCheckedIn ?? "Unavailable", today],
        [
          "Completed collections (PKR)",
          failed.includes("Collections") ? "Unavailable" : collections / 100,
          "All recorded payments",
        ],
        ["Follow-ups", risk.length, today],
        [
          "Sessions scheduled",
          operations ? sessions.length : "Unavailable",
          today,
        ],
        ...trend.map((point) => ["Attendance", point.checkIns, point.date]),
      ],
    );
  return (
    <AppLayout onRefreshData={load}>
      <div className="studio-page studio-overview">
        <div className="studio-page-heading">
          <div>
            <p className="premium-eyebrow">
              Your gym, at a glance{" "}
              <span className="studio-eyebrow-divider">/</span>{" "}
              {new Intl.DateTimeFormat("en-PK", {
                day: "numeric",
                month: "long",
                timeZone: timezone,
              }).format(new Date())}
            </p>
            <h1>
              A stronger gym.
              <br />
              <span className="studio-heading-soft">Every single day.</span>
            </h1>
            <p>
              {user ? `Good to see you, ${user.name.split(" ")[0]}. ` : ""}Your
              members, your business, and the next right move.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="studio-button"
              disabled={loading}
              onClick={load}
              aria-label="Refresh dashboard"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              className="studio-button"
              onClick={report}
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              Daily brief
            </button>
            <Link
              href="/members?new=1"
              className="studio-button studio-button-primary"
            >
              <Plus className="w-4 h-4" />
              Add member
            </Link>
          </div>
        </div>
        {!!failed.length && (
          <div role="alert" data-tone="warning" className="studio-alert">
            <Warning className="w-4 h-4 shrink-0" />
            <span>
              {failed.join(", ")} could not be loaded. Refresh or check your
              connection before making decisions.
            </span>
          </div>
        )}
        <div className="studio-overview-hero">
          <section className="studio-business-card">
            <div className="flex justify-between gap-4">
              <span className="premium-eyebrow">
                A healthy business starts with belonging
              </span>
              <CreditCard className="w-5 h-5 opacity-60" />
            </div>
            <p className="studio-business-label">
              {canManage ? "Recorded collections" : "Member check-ins today"}
            </p>
            <div className="studio-business-number">
              {loading
                ? "—"
                : canManage
                  ? failed.includes("Collections")
                    ? "—"
                    : money(collections)
                  : (kpis?.membersCheckedInToday ?? "—")}
            </div>
            <p className="studio-business-caption">
              {canManage
                ? "Completed payments in your ledger · all time"
                : "Distinct members who visited today"}
            </p>
            <div className="studio-business-footer">
              <div>
                <span>
                  {canManage ? "Renewals in 7 days" : "Current floor count"}
                </span>
                <strong>
                  {loading
                    ? "—"
                    : canManage
                      ? failed.includes("Memberships")
                        ? "—"
                        : renewals.length
                      : occupancy}
                </strong>
              </div>
              <div>
                <span>
                  {canManage ? "Unpaid / expired plans" : "Active members"}
                </span>
                <strong>
                  {loading
                    ? "—"
                    : canManage
                      ? failed.includes("Memberships")
                        ? "—"
                        : dues.length
                      : (kpis?.activeMembers ?? "—")}
                </strong>
              </div>
              <Link
                href={canManage ? "/subscriptions" : "/check-in"}
                aria-label={
                  canManage ? "Manage memberships and fees" : "Open front desk"
                }
                className="studio-round-link"
              >
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
          <section className="studio-floor-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="premium-eyebrow">The floor, right now</p>
                <h2>Room for good energy.</h2>
              </div>
              <span className="studio-label">
                {api.dashboardUsesDemoData ? "Sample" : "Session count"}
              </span>
            </div>
            <div className="studio-floor-body">
              <div
                className="studio-occupancy-ring"
                style={{
                  background: `conic-gradient(var(${usage >= 100 ? "--status-danger-accent" : usage >= 80 ? "--status-warning-accent" : "--accent-brand"}) ${Math.min(usage, 100) * 3.6}deg, var(--bg-subtle) 0deg)`,
                }}
              >
                <div>
                  <strong>{loading ? "—" : occupancy}</strong>
                  <span>of {capacity} places</span>
                </div>
              </div>
              <div className="studio-floor-details">
                <span
                  className="status-pill"
                  data-tone={
                    usage >= 100
                      ? "danger"
                      : usage >= 80
                        ? "warning"
                        : "success"
                  }
                >
                  {usage >= 100
                    ? "At capacity"
                    : usage >= 80
                      ? "Getting busy"
                      : "Comfortable"}
                </span>
                <p>
                  <strong>
                    {loading ? "—" : (kpis?.membersCheckedInToday ?? "—")}
                  </strong>{" "}
                  unique visits today
                </p>
                <p>
                  <strong>{kpis?.averageVisitDurationMinutes ?? "—"}</strong>{" "}
                  min. average visit
                </p>
                <Link href="/settings" className="studio-text-link">
                  Capacity settings <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
            <Link href="/check-in" className="studio-floor-action">
              <QrCode className="w-4 h-4" />
              Open the front desk <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </section>
        </div>
        <div className="studio-health-grid">
          {[
            {
              label: "Active members",
              value: kpis?.activeMembers,
              detail: "People building a routine",
              icon: Users,
              tone: "success",
              href: "/members",
            },
            {
              label: "Retention queue",
              value: failed.includes("Retention") ? undefined : risk.length,
              detail: "A personal follow-up can help",
              icon: Warning,
              tone: risk.length ? "danger" : "success",
              href: "/retention",
            },
            {
              label: canManage ? "Open enquiries" : "Today’s attendance",
              value: canManage
                ? operations
                  ? leads.length
                  : undefined
                : kpis?.membersCheckedInToday,
              detail: canManage
                ? "Your next members start here"
                : "Every visit is a step forward",
              icon: canManage ? Users : UserCheck,
              tone: "warning",
              href: canManage ? "/operations?view=leads" : "/check-in",
            },
            {
              label: canManage ? "Sessions today" : "Visits today",
              value: canManage
                ? operations
                  ? sessions.length
                  : undefined
                : kpis?.visitsToday,
              detail: canManage
                ? "Make every session count"
                : "Including return visits",
              icon: Calendar,
              tone: "success",
              href: canManage ? "/operations?view=sessions" : "/check-in",
            },
          ].map((metric) => (
            <Link
              key={metric.label}
              href={metric.href}
              className="studio-health-card"
              data-tone={metric.tone}
            >
              <div>
                <span>{metric.label}</span>
                <metric.icon className="w-4 h-4" />
              </div>
              <strong>{loading ? "—" : (metric.value ?? "—")}</strong>
              <p>
                {metric.detail}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </p>
            </Link>
          ))}
        </div>
        <div className="studio-main-grid">
          <section className="premium-panel overflow-hidden">
            <div className="studio-section-header">
              <div>
                <p className="premium-eyebrow">Consistency, in motion</p>
                <h2>Attendance rhythm</h2>
              </div>
              <div className="studio-period" aria-label="Attendance period">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    aria-pressed={period === days}
                    onClick={() => setPeriod(days)}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>
            <div className="studio-chart-topline">
              <strong>
                {attendanceTotal.toLocaleString()}
                <span> check-ins</span>
              </strong>
              <span>
                {trend.length ? Math.round(attendanceTotal / trend.length) : 0}{" "}
                daily average
              </span>
            </div>
            <div
              className="studio-bar-chart"
              role="img"
              aria-label={`Daily attendance for ${period} days, ${attendanceTotal} check-ins total`}
            >
              {trend.map((point) => (
                <div key={point.date} className="studio-chart-column">
                  <span className="studio-bar-tooltip">
                    {point.date}
                    <br />
                    {point.checkIns} visits
                  </span>
                  <div
                    className="studio-chart-bar"
                    tabIndex={0}
                    aria-label={`${point.date}: ${point.checkIns} visits`}
                    style={{
                      height: `${Math.max(2, (point.checkIns / max) * 100)}%`,
                    }}
                  />
                </div>
              ))}
              {!trend.length && (
                <p className="studio-empty">No attendance data available.</p>
              )}
            </div>
            <div className="studio-chart-axis">
              <span>{trend[0]?.date || "—"}</span>
              <span>Last {period} days</span>
              <span>{trend[trend.length - 1]?.date || "—"}</span>
            </div>
          </section>
          <section className="studio-agenda">
            <div className="studio-section-header">
              <div>
                <p className="premium-eyebrow">
                  A little focus goes a long way
                </p>
                <h2>
                  {canManage ? "Your next right moves" : "Your quick actions"}
                </h2>
              </div>
              <Link
                href={canManage ? "/operations?view=tasks" : "/check-in"}
                aria-label="Open daily tasks"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <Link href="/retention" className="studio-action-row">
              <span className="studio-action-symbol" data-tone="danger">
                <Warning className="w-4 h-4" />
              </span>
              <div>
                <strong>Reconnect with your members</strong>
                <span>{risk.length} people in the follow-up queue</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/subscriptions" className="studio-action-row">
              <span className="studio-action-symbol" data-tone="warning">
                <CreditCard className="w-4 h-4" />
              </span>
              <div>
                <strong>Keep renewals on track</strong>
                <span>
                  {canManage
                    ? `${renewals.length} renewals in the next 7 days`
                    : "Review memberships and fees"}
                </span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {canManage &&
              tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="studio-task studio-agenda-task">
                  <button
                    className="studio-task-check"
                    disabled={!!busyTask}
                    aria-label={`Complete ${task.title}`}
                    onClick={() => finishTask(task.id)}
                  >
                    {busyTask === task.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : null}
                  </button>
                  <div>
                    <strong>{task.title}</strong>
                    <span>
                      {task.dueDate < today
                        ? "Overdue"
                        : task.dueDate === today
                          ? "Due today"
                          : task.dueDate}
                    </span>
                  </div>
                </div>
              ))}
            {taskError && (
              <p
                role="alert"
                className="text-sm text-status-danger-text px-6 py-3"
              >
                {taskError}
              </p>
            )}
            <Link
              href={canManage ? "/operations?view=tasks" : "/check-in"}
              className="studio-agenda-footer"
            >
              {canManage ? "View the team checklist" : "Manage attendance"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </section>
        </div>
        <div className="studio-main-grid">
          <section className="premium-panel overflow-hidden">
            <div className="studio-section-header">
              <div>
                <p className="premium-eyebrow">Care before churn</p>
                <h2>A conversation worth having.</h2>
              </div>
              <Link className="studio-text-link" href="/retention">
                View queue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="studio-retention-list">
              {risk.slice(0, 4).map((member) => (
                <Link
                  href="/retention"
                  key={member.memberId}
                  className="studio-retention-row"
                >
                  <span className="studio-avatar">
                    {member.fullName
                      .split(" ")
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div className="flex-1">
                    <strong>{member.fullName}</strong>
                    <small>
                      {member.memberCode} ·{" "}
                      {member.factors.daysSinceLastCheckIn} days since last
                      visit
                    </small>
                  </div>
                  <span
                    className="status-pill"
                    data-tone={
                      member.riskLevel === "HIGH" ? "danger" : "warning"
                    }
                  >
                    {member.riskLevel === "HIGH" ? "Priority" : "Slipping"}
                  </span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              ))}
              {!risk.length && (
                <p className="studio-empty">
                  {failed.includes("Retention")
                    ? "The queue could not be loaded."
                    : "No follow-ups in your queue right now."}
                </p>
              )}
            </div>
          </section>
          <section className="premium-panel overflow-hidden">
            <div className="studio-section-header">
              <div>
                <p className="premium-eyebrow">On the calendar</p>
                <h2>
                  {canManage ? "Today’s sessions" : "Streaks worth celebrating"}
                </h2>
              </div>
              <Link
                href={
                  canManage ? "/operations?view=sessions" : "/rewards/winners"
                }
                aria-label="View all"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            {canManage ? (
              <div>
                {sessions.slice(0, 3).map((session) => (
                  <Link
                    href="/operations?view=sessions"
                    className="studio-compact-session"
                    key={session.id}
                  >
                    <span>
                      {new Intl.DateTimeFormat("en-PK", {
                        hour: "numeric",
                        minute: "2-digit",
                        timeZone: timezone,
                      }).format(new Date(session.startsAt))}
                    </span>
                    <div>
                      <strong>{session.title}</strong>
                      <small>
                        {session.coach} · {session.attendees.length}/
                        {session.capacity} booked
                      </small>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ))}
                {!sessions.length && (
                  <div className="studio-empty">
                    <Calendar className="w-6 h-6" />
                    <p>
                      {operations
                        ? "No sessions scheduled for today."
                        : "Connect Operations to see today’s schedule."}
                    </p>
                    <Link
                      href="/operations?view=sessions"
                      className="studio-text-link"
                    >
                      Open schedule <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {summary?.streakLeaders?.slice(0, 3).map((member) => (
                  <div key={member.memberId} className="studio-compact-session">
                    <Fire className="w-4 h-4" />
                    <strong>{member.memberName}</strong>
                    <span>{member.currentStreak} days</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <div className="studio-product-footer">
          <span>
            <CheckCircle2 className="w-3.5 h-3.5" />A little more clarity. A lot
            more care.
          </span>
          <Link href="/settings">
            Workspace & subscription <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
