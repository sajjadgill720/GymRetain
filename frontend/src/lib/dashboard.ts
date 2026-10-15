import type { OperationsState } from "./operations";
import type { MemberRiskDetails } from "../types";

export type ReportPeriod = "month" | "last-month" | "all";
export type FocusCategory =
  "Retention" | "Payments" | "Renewals" | "Leads" | "Tasks";
export interface FocusItem {
  id: string;
  category: FocusCategory;
  title: string;
  detail: string;
  href: string;
  action: string;
  priority: number;
  tone: "danger" | "warning" | "info";
  taskId?: string;
  riskScore?: number;
}
export interface LedgerPayment {
  amount: number;
  status: string;
  currency?: string;
  paidAt?: string | null;
  createdAt?: string;
}
export interface DashboardSubscription {
  id: string;
  status: string;
  endDate: string;
  planName: string;
  member?: { memberCode?: string; firstName?: string; lastName?: string };
}
export function gymDate(value: Date | string, timezone: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function reportWindow(period: ReportPeriod, today: string) {
  if (period === "all")
    return { start: "", end: today, label: "All recorded dates" };
  if (period === "month")
    return {
      start: `${today.slice(0, 7)}-01`,
      end: today,
      label: "Month to date",
    };
  const [year, month] = today.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10),
    end: new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10),
    label: "Last calendar month",
  };
}
export function ledgerTotals(
  payments: LedgerPayment[],
  operations: OperationsState | null,
  period: ReportPeriod,
  today: string,
  timezone: string,
) {
  const range = reportWindow(period, today);
  const includes = (date: string) =>
    !!date && (!range.start || date >= range.start) && date <= range.end;
  const completed = payments.filter(
    (payment) =>
      payment.status === "COMPLETED" &&
      (!payment.currency || payment.currency === "PKR") &&
      Number.isFinite(payment.amount) &&
      payment.amount >= 0 &&
      includes(gymDate(payment.paidAt || payment.createdAt || "", timezone)),
  );
  const collected = completed.reduce(
    (sum, payment) => sum + Math.round(payment.amount * 100),
    0,
  );
  const expenses =
    operations?.expenses
      .filter((expense) => includes(expense.date))
      .reduce((sum, expense) => sum + expense.amountPaisa, 0) ?? null;
  return {
    ...range,
    collected,
    receipts: completed.length,
    expenses,
    cashDifference: expenses === null ? null : collected - expenses,
  };
}
export function buildFocusItems({
  risk,
  subscriptions,
  operations,
  today,
  timezone,
  canManage,
}: {
  risk: MemberRiskDetails[];
  subscriptions: DashboardSubscription[];
  operations: OperationsState | null;
  today: string;
  timezone: string;
  canManage: boolean;
}): FocusItem[] {
  const items: FocusItem[] = [...risk]
    .sort((a, b) => b.riskScore - a.riskScore)
    .map((member) => ({
      id: `risk-${member.memberId}`,
      riskScore: member.riskScore,
      category: "Retention",
      title: member.fullName,
      detail: `${member.factors.daysSinceLastCheckIn} days since last visit`,
      href: `/retention?search=${encodeURIComponent(member.memberCode)}`,
      action: "Review member",
      priority: member.riskLevel === "HIGH" ? 0 : 2,
      tone: member.riskLevel === "HIGH" ? "danger" : "warning",
    }));
  if (canManage) {
    const lastRenewalDay = new Date(`${today}T12:00:00Z`);
    lastRenewalDay.setUTCDate(lastRenewalDay.getUTCDate() + 7);
    const through = lastRenewalDay.toISOString().slice(0, 10);
    for (const sub of subscriptions) {
      const name =
        [sub.member?.firstName, sub.member?.lastName]
          .filter(Boolean)
          .join(" ") || "Member";
      const search = encodeURIComponent(sub.member?.memberCode || name);
      const end = gymDate(sub.endDate, timezone);
      if (sub.status === "PENDING_PAYMENT")
        items.push({
          id: `payment-${sub.id}`,
          category: "Payments",
          title: name,
          detail: `${sub.planName} · payment pending`,
          href: `/subscriptions?status=PENDING_PAYMENT&search=${search}`,
          action: "Review fee",
          priority: 0,
          tone: "danger",
        });
      else if (sub.status === "ACTIVE" && end && end >= today && end <= through)
        items.push({
          id: `renewal-${sub.id}`,
          category: "Renewals",
          title: name,
          detail: `${sub.planName} · ends ${end}`,
          href: `/subscriptions?status=ACTIVE&search=${search}`,
          action: "Review renewal",
          priority: 1,
          tone: "warning",
        });
    }
    for (const lead of operations?.leads || [])
      if (
        !["JOINED", "LOST"].includes(lead.stage) &&
        lead.followUpDate &&
        lead.followUpDate <= today
      )
        items.push({
          id: `lead-${lead.id}`,
          category: "Leads",
          title: lead.name,
          detail: `Follow-up ${lead.followUpDate < today ? "overdue · " + lead.followUpDate : "due today"}`,
          href: `/operations?view=leads&search=${encodeURIComponent(lead.name)}`,
          action: "Open enquiry",
          priority: lead.followUpDate < today ? 1 : 2,
          tone: "warning",
        });
    for (const task of operations?.tasks || [])
      if (!task.completed && task.dueDate <= today)
        items.push({
          id: `task-${task.id}`,
          taskId: task.id,
          category: "Tasks",
          title: task.title,
          detail:
            task.dueDate < today ? `Overdue · ${task.dueDate}` : "Due today",
          href: "/operations?view=tasks",
          action: "Open checklist",
          priority: task.priority === "HIGH" || task.dueDate < today ? 1 : 2,
          tone: task.dueDate < today ? "warning" : "info",
        });
  }
  return items.sort(
    (a, b) =>
      a.priority - b.priority ||
      a.category.localeCompare(b.category) ||
      (b.riskScore || 0) - (a.riskScore || 0) ||
      a.title.localeCompare(b.title),
  );
}
