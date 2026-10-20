"use client";
import { useLiveRefresh } from '@/lib/use-live-refresh';

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProgressRing, CountUp } from '@/components/ui';
import { AppLayout } from "@/components/AppLayout";
import { QuickCheckInModal } from "@/components/QuickCheckInModal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthProvider";
import {
  DashboardSummary,
  AttendanceTrendPoint,
  MemberRiskDetails,
} from "@/types";
import { OperationsState, money, downloadCsv } from "@/lib/operations";
import {
  buildFocusItems,
  gymDate,
  ledgerTotals,
  DashboardSubscription,
  LedgerPayment,
  FocusCategory,
  ReportPeriod,
} from "@/lib/dashboard";
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Download,
  Users,
  UserCheck,
  CreditCard,
  Calendar,
  Check,
  CheckCircle2,
  Warning,
  Fire,
} from "@/components/icons";

const categories: ("All" | FocusCategory)[] = [
  "All",
  "Retention",
  "Payments",
  "Renewals",
  "Leads",
  "Tasks",
];
const periodNames: Record<ReportPeriod, string> = {
  month: "This month",
  "last-month": "Last month",
  all: "All time",
};
const categoryDescriptions: Record<FocusCategory, string> = {
  Retention: "Members whose routines may need a personal check-in.",
  Payments:
    "Memberships marked pending. Review the ledger before collecting a fee.",
  Renewals: "Active memberships ending today or within the next seven days.",
  Leads: "Open enquiries with follow-ups due today or earlier.",
  Tasks: "Incomplete checklist items due today or earlier.",
};
function PanelHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="desk-panel-header">
      <div>
        {eyebrow && <p className="premium-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function DashboardWorkspace() {
  const { user, activeGym, isLoading: authLoading } = useAuth();
  const canManage =
    !user || ["GYM_OWNER", "GYM_MANAGER", "SUPER_ADMIN"].includes(user.role);
  const timezone = activeGym?.timezone || "Asia/Karachi";
  const today = gymDate(new Date(), timezone);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [operations, setOperations] = useState<OperationsState | null>(null);
  const [payments, setPayments] = useState<LedgerPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<DashboardSubscription[]>(
    [],
  );
  const [risk, setRisk] = useState<MemberRiskDetails[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("month");
  const [filter, setFilter] = useState<"All" | FocusCategory>("All");
  const [expanded, setExpanded] = useState(false);
  const [chartDays, setChartDays] = useState(14);
  const [chartRevision, setChartRevision] = useState(0);
  const [trend, setTrend] = useState<AttendanceTrendPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [busyTask, setBusyTask] = useState("");
  const [taskError, setTaskError] = useState("");
  const [completedTask, setCompletedTask] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const request = useRef(0);
  const load = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setTaskError("");
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
      const value = result.status === "fulfilled" ? result.value : null;
      if (result.status === "rejected") errors.push(labels[index]);
      if (index === 0) setSummary(value as DashboardSummary | null);
      if (index === 1) setOperations(value as OperationsState | null);
      if (index === 2) setPayments((value || []) as LedgerPayment[]);
      if (index === 3) setRisk((value || []) as MemberRiskDetails[]);
      if (index === 4)
        setSubscriptions((value || []) as DashboardSubscription[]);
    });
    setFailed(errors);
    setUpdatedAt(new Date());
    setLoading(false);
  }, [canManage]);
  const refresh = () => {
    load();
    setChartRevision((value) => value + 1);
  };
  useLiveRefresh(refresh);
  useEffect(() => {
    if (!authLoading) load();
    return () => {
      request.current++;
    };
  }, [load, authLoading, activeGym?.id]);
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setChartLoading(true);
    setChartError(false);
    api
      .getAttendanceTrends(chartDays)
      .then((rows) => {
        if (active) setTrend(rows);
      })
      .catch(() => {
        if (active) {
          setTrend([]);
          setChartError(true);
        }
      })
      .finally(() => {
        if (active) setChartLoading(false);
      });
    return () => {
      active = false;
    };
  }, [chartDays, chartRevision, activeGym?.id, authLoading]);
  const ledger = ledgerTotals(
    payments,
    operations,
    reportPeriod,
    today,
    timezone,
  );
  const focus = buildFocusItems({
    risk,
    subscriptions,
    operations,
    today,
    timezone,
    canManage,
  });
  const filtered =
    filter === "All" ? focus : focus.filter((item) => item.category === filter);
  const shown = expanded ? filtered : filtered.slice(0, 4);
  const highRisk = risk.filter((member) => member.riskLevel === "HIGH").length;
  const pending = subscriptions.filter(
    (sub) => sub.status === "PENDING_PAYMENT",
  ).length;
  const sessions =
    operations?.sessions
      .filter(
        (session) =>
          gymDate(session.startsAt, timezone) === today &&
          session.status !== "CANCELLED",
      )
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)) || [];
  const nextSession = sessions.find(
    (session) =>
      session.status === "SCHEDULED" &&
      Date.parse(session.startsAt) + session.duration * 60000 > Date.now(),
  );
  const kpis = summary?.kpis;
  const occupancy = kpis?.currentlyCheckedIn ?? null;
  const capacity = kpis?.capacity && kpis.capacity > 0 ? kpis.capacity : null;
  const usage =
    occupancy !== null && capacity
      ? Math.round((occupancy / capacity) * 100)
      : null;
  const overviewReady = !loading && !failed.includes("Overview") && !!summary;
  const financeReady = !loading && !failed.includes("Collections");
  const operationsReady =
    !loading && !failed.includes("Operations") && !!operations;
  const attendanceTotal = trend.reduce((sum, point) => sum + point.checkIns, 0);
  const maxAttendance = Math.max(1, ...trend.map((point) => point.checkIns));
  const dueTasks =
    operations?.tasks.filter((task) => !task.completed && task.dueDate <= today)
      .length || 0;
  const openLeads =
    operations?.leads.filter(
      (lead) => !["JOINED", "LOST"].includes(lead.stage),
    ) || [];
  const categoriesShown = canManage
    ? categories
    : (["All", "Retention"] as const);
  const toggleTask = async (id: string, title: string, completed: boolean) => {
    if (!operations || busyTask) return;
    setBusyTask(id);
    setTaskError("");
    try {
      setOperations(
        await api.mutateOperations({
          kind: "tasks",
          action: "update",
          id,
          version: operations.version,
          data: { completed },
        }),
      );
      setCompletedTask(completed ? { id, title } : null);
    } catch (error) {
      setTaskError(
        error instanceof Error
          ? error.message
          : "Could not update the task. Refresh and try again.",
      );
    } finally {
      setBusyTask("");
    }
  };
  const report = () =>
    downloadCsv(
      `gym-daily-brief-${today}.csv`,
      ["Metric", "Value", "Period / basis"],
      [
        ["Gym", activeGym?.name || "Demo gym", today],
        [
          "Data mode",
          api.hasSession() ? "Authenticated workspace" : "Demo samples",
          today,
        ],
        [
          "Last refresh attempt",
          updatedAt?.toISOString() || "Not loaded",
          "Timestamp",
        ],
        [
          "Active members",
          overviewReady ? kpis?.activeMembers : "Unavailable",
          today,
        ],
        [
          "Unique visitors today",
          overviewReady ? kpis?.membersCheckedInToday : "Unavailable",
          today,
        ],
        ...(canManage
          ? [
              [
                "Completed collections (PKR)",
                financeReady ? ledger.collected / 100 : "Unavailable",
                `${ledger.label}; ${ledger.start || "earliest"} through ${ledger.end}`,
              ],
              [
                "Recorded expenses (PKR)",
                operationsReady && ledger.expenses !== null
                  ? ledger.expenses / 100
                  : "Unavailable",
                ledger.label,
              ],
              [
                "Recorded cash difference (PKR)",
                financeReady &&
                operationsReady &&
                ledger.cashDifference !== null
                  ? ledger.cashDifference / 100
                  : "Unavailable",
                "Collections minus expenses; not profit",
              ],
              [
                "Pending memberships",
                failed.includes("Memberships") ? "Unavailable" : pending,
                "Count; not an outstanding balance",
              ],
            ]
          : []),
        [
          "High-risk follow-ups",
          failed.includes("Retention") ? "Unavailable" : highRisk,
          "Current queue",
        ],
        ...(!chartError
          ? trend.map((point) => [
              "Attendance check-ins",
              point.checkIns,
              point.date,
            ])
          : [["Attendance", "Unavailable", `Last ${chartDays} days`]]),
      ],
    );
  return (
    <AppLayout onRefreshData={refresh}>
      <div className="desk-page">
        <header className="desk-heading">
          <div>
            <p className="premium-eyebrow">
              {activeGym?.name || "Your gym workspace"}{" "}
              <span aria-hidden="true">/</span>{" "}
              {new Intl.DateTimeFormat("en-PK", {
                weekday: "short",
                day: "numeric",
                month: "long",
                timeZone: timezone,
              }).format(new Date())}
            </p>
            <h1>Your day, in focus.</h1>
            <p>
              {user ? `Welcome back, ${user.name.split(" ")[0]}. ` : ""}See what
              matters. Take the next step.
            </p>
          </div>
          <div className="desk-header-actions">
            <Link className="studio-button" href="/members?new=1">
              <Plus className="w-4 h-4" />
              Add member
            </Link>
            <button
              className="studio-button studio-button-primary"
              onClick={() => setCheckInOpen(true)}
            >
              <UserCheck className="w-4 h-4" />
              Check in a member
            </button>
          </div>
        </header>
        <div className="desk-context">
          <p role="status" aria-live="polite">
            <span
              className="desk-status-dot"
              data-tone={
                loading
                  ? "info"
                  : failed.length || chartError
                    ? "warning"
                    : "success"
              }
            />
            {loading
              ? "Updating your workspace…"
              : `${api.hasSession() ? "Workspace" : "Sample data"} · ${failed.length || chartError ? "Partially refreshed" : "Updated"} ${updatedAt ? new Intl.DateTimeFormat("en-PK", { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(updatedAt) : "—"}`}
            <span className="desk-timezone">{timezone}</span>
          </p>
          <div>
            <button
              className="desk-quiet-button"
              disabled={loading || chartLoading}
              onClick={report}
            >
              <Download className="w-3.5 h-3.5" />
              Export brief
            </button>
            <button
              className="desk-quiet-button"
              disabled={loading}
              onClick={refresh}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
        {!!failed.length && (
          <div className="studio-alert" data-tone="warning" role="alert">
            <Warning className="w-4 h-4 shrink-0" />
            <span>
              {failed.join(", ")} unavailable. These sections show unavailable
              values; other tools remain usable.
            </span>
            <button
              className="studio-button"
              disabled={loading}
              onClick={refresh}
            >
              Retry
            </button>
          </div>
        )}
        <div className="desk-metric-heading">
          <h2>At a glance</h2>
          {canManage && (
            <label>
              Financial period{" "}
              <select
                aria-label="Financial period"
                value={reportPeriod}
                onChange={(event) =>
                  setReportPeriod(event.target.value as ReportPeriod)
                }
              >
                <option value="month">This month</option>
                <option value="last-month">Last month</option>
                <option value="all">All time</option>
              </select>
            </label>
          )}
        </div>
        <div className="desk-metrics" aria-busy={loading}>
          {canManage ? (
            <Link
              className="desk-metric desk-metric-featured"
              href="/subscriptions?view=payments"
            >
              <div>
                <span>Recorded collections</span>
                <CreditCard className="w-4 h-4" />
              </div>
              <strong>{financeReady ? money(ledger.collected) : "—"}</strong>
              <p>
                {periodNames[reportPeriod]} ·{" "}
                {financeReady
                  ? `${ledger.receipts} completed receipt${ledger.receipts === 1 ? "" : "s"}`
                  : loading
                    ? "Loading receipts…"
                    : "Unavailable"}
              </p>
              <span className="desk-metric-link">
                View payment register <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ) : (
            <Link className="desk-metric desk-metric-featured" href="/check-in">
              <div>
                <span>Inside the gym</span>
                <UserCheck className="w-4 h-4" />
              </div>
              <strong>{overviewReady ? <CountUp value={occupancy} /> : "—"}</strong>
              <p>Open check-in sessions</p>
              <span className="desk-metric-link">
                Open front desk <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          )}
          <Link className="desk-metric" href="/members">
            <div>
              <span>Active members</span>
              <Users className="w-4 h-4" />
            </div>
            <strong>{overviewReady ? kpis?.activeMembers : "—"}</strong>
            <p>Current member status</p>
            <span className="desk-metric-link">
              Open directory <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>
          <Link
            className="desk-metric"
            data-tone={highRisk ? "danger" : "success"}
            href="/retention?risk=HIGH"
          >
            <div>
              <span>Priority follow-ups</span>
              <Warning className="w-4 h-4" />
            </div>
            <strong>
              {!loading && !failed.includes("Retention") ? highRisk : "—"}
            </strong>
            <p>Members with high retention risk</p>
            <span className="desk-metric-link">
              Review member care <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>
          <Link className="desk-metric" data-tone="success" href="/check-in">
            <div>
              <span>Visitors today</span>
              <UserCheck className="w-4 h-4" />
            </div>
            <strong>{overviewReady ? kpis?.membersCheckedInToday : "—"}</strong>
            <p>Distinct members · gym local date</p>
            <span className="desk-metric-link">
              Manage attendance <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
        <div className="desk-work-grid">
          <section
            className="desk-panel desk-focus"
            aria-busy={loading}
            aria-labelledby="focus-title"
          >
            <div className="desk-panel-header">
              <div>
                <p className="premium-eyebrow">Start here</p>
                <h2 id="focus-title">
                  Needs your attention{" "}
                  <span className="desk-count">
                    {loading ? "—" : focus.length}
                  </span>
                </h2>
              </div>
              <span className="desk-panel-note">Prioritized work items</span>
            </div>
            <div
              className="desk-filters"
              role="group"
              aria-label="Filter attention items"
            >
              {categoriesShown.map((category) => (
                <button
                  key={category}
                  aria-pressed={filter === category}
                  onClick={() => {
                    setFilter(category);
                    setExpanded(false);
                  }}
                >
                  {category}
                  <span>
                    {loading
                      ? "—"
                      : category === "All"
                        ? focus.length
                        : focus.filter((item) => item.category === category)
                            .length}
                  </span>
                </button>
              ))}
            </div>
            <p className="desk-queue-note">
              {filter === "All"
                ? "High-risk members and unsettled memberships come first."
                : categoryDescriptions[filter]}{" "}
              {failed.length > 0 ? "Unavailable sections are excluded." : ""}
            </p>
            {completedTask && (
              <div role="status" className="desk-task-feedback">
                <CheckCircle2 className="w-4 h-4" />
                <span>Completed: {completedTask.title}</span>
                <button
                  disabled={!!busyTask}
                  onClick={() =>
                    toggleTask(completedTask.id, completedTask.title, false)
                  }
                >
                  Undo
                </button>
              </div>
            )}
            {taskError && (
              <p role="alert" className="studio-alert mx-5" data-tone="danger">
                {taskError}
              </p>
            )}
            {loading ? (
              <div className="desk-empty" role="status">
                Loading your priorities…
              </div>
            ) : shown.length ? (
              <ul className="desk-focus-list">
                {shown.map((item) => (
                  <li key={item.id}>
                    <span className="desk-item-icon" data-tone={item.tone}>
                      {item.category === "Retention" ? (
                        <Users />
                      ) : item.category === "Payments" ? (
                        <CreditCard />
                      ) : item.category === "Renewals" ? (
                        <Calendar />
                      ) : item.category === "Leads" ? (
                        <UserCheck />
                      ) : (
                        <Check />
                      )}
                    </span>
                    <div className="desk-item-copy">
                      <span>{item.category}</span>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                    {item.taskId ? (
                      <button
                        className="studio-button desk-complete-button"
                        disabled={!!busyTask}
                        onClick={() =>
                          toggleTask(item.taskId!, item.title, true)
                        }
                        aria-label={`Complete ${item.title}`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Complete</span>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className="desk-row-action"
                        aria-label={`${item.action}: ${item.title}`}
                      >
                        <span>{item.action}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="desk-empty">
                <CheckCircle2 className="w-7 h-7" />
                <strong>
                  {failed.length
                    ? "No items from available sections."
                    : "You’re up to date here."}
                </strong>
                <p>
                  {filter === "All"
                    ? "No priority reviews or due work in the available records."
                    : "Try another category or review the full workspace."}
                </p>
              </div>
            )}
            {!loading && filtered.length > 4 && (
              <button
                className="desk-panel-footer"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
              >
                {expanded
                  ? "Show fewer items"
                  : `Show all ${filtered.length} items`}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {canManage && (
              <div className="desk-focus-shortcuts">
                <Link href="/subscriptions?status=PENDING_PAYMENT">
                  {loading || failed.includes("Memberships") ? "—" : pending}{" "}
                  pending memberships
                </Link>
                <Link href="/operations?view=tasks">
                  {operationsReady ? dueTasks : "—"} tasks due
                </Link>
              </div>
            )}
          </section>
          <section className="desk-panel desk-today">
            <PanelHeader
              eyebrow="Today’s operations"
              title={canManage ? "On the schedule" : "On the floor"}
            >
              {canManage && (
                <Link
                  className="desk-icon-link"
                  href={`/operations?view=sessions&date=${today}`}
                  aria-label="Open today's schedule"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              )}
            </PanelHeader>
            <div className="desk-floor-strip">
              {overviewReady && capacity > 0 && <div className="capacity-ring"><ProgressRing value={occupancy} max={capacity} label="Gym capacity" size={74} /></div>}
              <div>
                <span>Inside now</span>
                <strong>
                  {overviewReady ? occupancy : "—"}{" "}
                  <small>{capacity ? `/ ${capacity}` : "places"}</small>
                </strong>
              </div>
              <span
                className="status-pill"
                data-tone={
                  usage === null
                    ? "info"
                    : usage >= 100
                      ? "danger"
                      : usage >= 80
                        ? "warning"
                        : "success"
                }
              >
                {!overviewReady
                  ? loading
                    ? "Loading"
                    : "Unavailable"
                  : usage === null
                    ? "No capacity set"
                    : usage >= 100
                      ? "At capacity"
                      : usage >= 80
                        ? "Getting busy"
                        : "Space available"}
              </span>
              <div className="desk-floor-track" aria-hidden="true">
                <i
                  style={{
                    width: `${overviewReady && usage !== null ? Math.min(100, usage) : 0}%`,
                  }}
                />
              </div>
              <p>Open sessions depend on members checking out.</p>
            </div>
            {canManage ? (
              <>
                <div className="desk-schedule-label">
                  <span>
                    {operationsReady
                      ? `${sessions.length} sessions today`
                      : "Schedule unavailable"}
                  </span>
                  <span>{nextSession ? "Next / in progress" : timezone}</span>
                </div>
                {operationsReady ? (
                  sessions.length ? (
                    <ol className="desk-schedule">
                      {sessions.slice(0, 3).map((session) => (
                        <li
                          key={session.id}
                          data-next={nextSession?.id === session.id}
                        >
                          <span className="desk-session-dot" />
                          <time dateTime={session.startsAt}>
                            {new Intl.DateTimeFormat("en-PK", {
                              hour: "numeric",
                              minute: "2-digit",
                              timeZone: timezone,
                            }).format(new Date(session.startsAt))}
                          </time>
                          <div>
                            <Link
                              href={`/operations?view=sessions&date=${today}`}
                            >
                              {session.title}
                            </Link>
                            <p>
                              {session.coach} · {session.duration} min
                            </p>
                            <span className="desk-session-seats">
                              {session.status === "COMPLETED"
                                ? "Completed"
                                : session.attendees.length >= session.capacity
                                  ? "Fully booked"
                                  : `${session.capacity - session.attendees.length} places available`}
                              <span>
                                {session.attendees.length}/{session.capacity}{" "}
                                booked
                              </span>
                            </span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="desk-empty desk-empty-small">
                      <Calendar className="w-6 h-6" />
                      <p>No sessions scheduled today.</p>
                      <Link
                        href="/operations?view=sessions"
                        className="studio-text-link"
                      >
                        Schedule a session{" "}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="desk-empty desk-empty-small">
                    <p>
                      {loading
                        ? "Loading today’s schedule…"
                        : "Refresh to reconnect to the schedule."}
                    </p>
                  </div>
                )}
                <Link
                  className="desk-panel-footer"
                  href={`/operations?view=sessions&date=${today}`}
                >
                  View full schedule
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <div className="desk-staff-actions">
                <Link className="studio-button" href="/check-in">
                  Manage check-ins <ArrowRight className="w-4 h-4" />
                </Link>
                <Link className="studio-button" href="/members">
                  Find a member <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </section>
        </div>
        <div className="desk-work-grid">
          <section className="desk-panel" aria-busy={chartLoading}>
            <PanelHeader eyebrow="Member engagement" title="Attendance rhythm">
              <div
                className="desk-chart-period"
                role="group"
                aria-label="Attendance period"
              >
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    aria-pressed={chartDays === days}
                    onClick={() => setChartDays(days)}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </PanelHeader>
            <div className="desk-chart-stat">
              <strong>
                {chartLoading || chartError
                  ? "—"
                  : attendanceTotal.toLocaleString()}{" "}
                <span>check-ins</span>
              </strong>
              <p>
                {chartLoading
                  ? "Updating attendance…"
                  : chartError
                    ? "Attendance unavailable"
                    : `${trend.length ? Math.round(attendanceTotal / trend.length) : 0} daily average · ${trend.length} reported days`}
              </p>
            </div>
            {chartError ? (
              <div className="desk-empty">
                <p role="alert">Attendance could not be loaded.</p>
                <button
                  className="studio-button"
                  onClick={() => setChartRevision((value) => value + 1)}
                >
                  Retry attendance
                </button>
              </div>
            ) : chartLoading ? (
              <div className="desk-chart-loading" role="status">
                Loading daily attendance…
              </div>
            ) : trend.length ? (
              <>
                <div
                  className="desk-chart"
                  role="img"
                  aria-label={`${attendanceTotal} check-ins across ${trend.length} reported days. Exact daily values are in the table below.`}
                >
                  {trend.map((point) => (
                    <div
                      key={point.date}
                      title={`${point.date}: ${point.checkIns} check-ins`}
                    >
                      <i
                        style={{
                          height: `${Math.max(2, (point.checkIns / maxAttendance) * 100)}%`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="desk-chart-axis">
                  <span>{trend[0].date}</span>
                  <span>Check-ins, including repeat visits</span>
                  <span>{trend[trend.length - 1].date}</span>
                </div>
                <details className="desk-chart-details">
                  <summary>View daily figures</summary>
                  <div>
                    <table>
                      <caption className="sr-only">
                        Attendance check-ins by date
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Gym local date</th>
                          <th scope="col">Check-ins</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trend.map((point) => (
                          <tr key={point.date}>
                            <th scope="row">{point.date}</th>
                            <td>{point.checkIns}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            ) : (
              <div className="desk-empty">
                <p>No attendance records for this period.</p>
                <Link href="/check-in" className="studio-text-link">
                  Open the front desk <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </section>
          {canManage ? (
            <section className="desk-panel desk-money">
              <PanelHeader
                eyebrow={ledger.label}
                title="Your recorded cash flow"
              >
                <Link
                  className="desk-icon-link"
                  href="/subscriptions?view=payments"
                  aria-label="View payment records"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </PanelHeader>
              <dl>
                <div>
                  <dt>Completed collections</dt>
                  <dd>
                    {financeReady ? money(ledger.collected) : "Unavailable"}
                  </dd>
                </div>
                <div>
                  <dt>Recorded expenses</dt>
                  <dd>
                    {operationsReady && ledger.expenses !== null
                      ? money(ledger.expenses)
                      : "Unavailable"}
                  </dd>
                </div>
                <div className="desk-cash-difference">
                  <dt>Recorded cash difference</dt>
                  <dd>
                    {financeReady &&
                    operationsReady &&
                    ledger.cashDifference !== null
                      ? money(ledger.cashDifference)
                      : "—"}
                  </dd>
                </div>
              </dl>
              <p className="desk-money-note">
                Collections minus recorded expenses. This is a cash snapshot,
                not profit or an outstanding balance.
              </p>
              <div className="desk-money-actions">
                <Link
                  className="studio-button"
                  href="/subscriptions?view=payments&record=1"
                >
                  Record payment
                </Link>
                <Link
                  className="studio-button"
                  href="/operations?view=expenses"
                >
                  Manage expenses
                </Link>
              </div>
            </section>
          ) : (
            <section className="desk-panel">
              <PanelHeader
                eyebrow="Member experience"
                title="Keep the momentum"
              />
              <p className="desk-money-note">
                Celebrate consistency and review the members who need a personal
                check-in.
              </p>
              <Link className="desk-panel-footer" href="/retention">
                Review follow-ups <ArrowRight className="w-4 h-4" />
              </Link>
              <Link className="desk-panel-footer" href="/rewards/winners">
                View member milestones <ArrowRight className="w-4 h-4" />
              </Link>
            </section>
          )}
        </div>
        <div
          className={`desk-work-grid ${!canManage ? "desk-single-panel" : ""}`}
        >
          {canManage && (
            <section className="desk-panel">
              <PanelHeader
                eyebrow="From enquiry to membership"
                title="Your lead pipeline"
              >
                <Link
                  className="desk-icon-link"
                  href="/operations?view=leads"
                  aria-label="Open lead pipeline"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </PanelHeader>
              <div className="desk-pipeline">
                {[
                  { stage: "NEW", label: "New" },
                  { stage: "CONTACTED", label: "In conversation" },
                  { stage: "TRIAL", label: "Trial booked" },
                  { stage: "JOINED", label: "Joined" },
                ].map((item) => (
                  <Link
                    key={item.stage}
                    href={`/operations?view=leads&stage=${item.stage}`}
                  >
                    <strong>
                      {operationsReady
                        ? operations?.leads.filter(
                            (lead) => lead.stage === item.stage,
                          ).length
                        : "—"}
                    </strong>
                    <span>{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ))}
              </div>
              <div className="desk-pipeline-note">
                <span>
                  {operationsReady
                    ? `${openLeads.length} open enquiries`
                    : "Pipeline unavailable"}
                </span>
                <Link href="/operations?view=leads">
                  Manage enquiries <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </section>
          )}
          <section className="desk-panel">
            <PanelHeader eyebrow="A reason to return" title="Member momentum">
              <Link
                className="desk-icon-link"
                href="/rewards/winners"
                aria-label="View member milestones"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </PanelHeader>
            {overviewReady && summary?.streakLeaders.length ? (
              <ul className="desk-momentum">
                {summary.streakLeaders.slice(0, 3).map((member) => (
                  <li key={member.memberId}>
                    <span className="desk-avatar">
                      {member.memberName
                        .split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <Link
                      href={`/members?search=${encodeURIComponent(member.memberCode)}`}
                    >
                      {member.memberName}
                      <small>{member.memberCode}</small>
                    </Link>
                    <span>
                      <Fire className="w-4 h-4" />
                      {member.currentStreak} days
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="desk-empty desk-empty-small">
                <p>
                  {failed.includes("Overview")
                    ? "Member milestones are unavailable."
                    : loading
                      ? "Loading member momentum…"
                      : "Check-in streaks will appear here as members build a routine."}
                </p>
              </div>
            )}
          </section>
        </div>
        <footer className="desk-footer">
          <span>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Built around your next useful action.
          </span>
          <Link href="/settings">
            Workspace settings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </footer>
      </div>
      <QuickCheckInModal
        isOpen={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onCheckInSuccess={refresh}
      />
    </AppLayout>
  );
}
