const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const dashboard = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../src/lib/dashboard.ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText,
  { exports: dashboard, Intl },
);
const state = () => ({
  version: 0,
  leads: [],
  sessions: [],
  expenses: [],
  tasks: [],
});
test("retention work keeps higher risk scores first without changing the source list", () => {
  const risk = [
    {
      memberId: "a",
      fullName: "Amy",
      memberCode: "A",
      riskLevel: "HIGH",
      riskScore: 80,
      factors: { daysSinceLastCheckIn: 12 },
    },
    {
      memberId: "z",
      fullName: "Zara",
      memberCode: "Z",
      riskLevel: "HIGH",
      riskScore: 95,
      factors: { daysSinceLastCheckIn: 20 },
    },
  ];
  const result = dashboard.buildFocusItems({
    risk,
    subscriptions: [],
    operations: null,
    today: "2026-10-16",
    timezone: "Asia/Karachi",
    canManage: false,
  });
  assert.equal(result[0].title, "Zara");
  assert.equal(risk[0].fullName, "Amy");
});
test("financial windows handle previous years and leap months", () => {
  assert.equal(
    dashboard.reportWindow("last-month", "2026-01-10").start,
    "2025-12-01",
  );
  assert.equal(
    dashboard.reportWindow("last-month", "2026-01-10").end,
    "2025-12-31",
  );
  assert.equal(
    dashboard.reportWindow("last-month", "2024-03-01").end,
    "2024-02-29",
  );
  assert.equal(dashboard.reportWindow("month", "2026-10-16").end, "2026-10-16");
});
test("collections use completed PKR receipts in gym-local dates and retain paisa", () => {
  const operations = state();
  operations.expenses = [
    { date: "2026-10-01", amountPaisa: 25000 },
    { date: "2026-10-17", amountPaisa: 90000 },
  ];
  const payments = [
    {
      amount: 1000.55,
      currency: "PKR",
      status: "COMPLETED",
      paidAt: "2026-09-30T20:00:00Z",
    },
    {
      amount: 20,
      currency: "PKR",
      status: "COMPLETED",
      createdAt: "2026-10-16T10:00:00Z",
    },
    {
      amount: 100,
      currency: "PKR",
      status: "FAILED",
      paidAt: "2026-10-01T00:00:00Z",
    },
    {
      amount: 100,
      currency: "USD",
      status: "COMPLETED",
      paidAt: "2026-10-01T00:00:00Z",
    },
    {
      amount: 100,
      currency: "PKR",
      status: "COMPLETED",
      paidAt: "2026-10-16T20:00:00Z",
    },
    { amount: 100, currency: "PKR", status: "COMPLETED", paidAt: "not a date" },
  ];
  const result = dashboard.ledgerTotals(
    payments,
    operations,
    "month",
    "2026-10-16",
    "Asia/Karachi",
  );
  assert.equal(result.collected, 102055);
  assert.equal(result.receipts, 2);
  assert.equal(result.expenses, 25000);
  assert.equal(result.cashDifference, 77055);
  assert.equal(
    dashboard.ledgerTotals([], null, "month", "2026-10-16", "Asia/Karachi")
      .cashDifference,
    null,
  );
});
test("attention queue prioritizes high risk and unsettled memberships; expiry does not imply debt", () => {
  const operations = state();
  operations.leads = [
    { id: "due", name: "Ali", stage: "NEW", followUpDate: "2026-10-16" },
    { id: "future", name: "Later", stage: "NEW", followUpDate: "2026-10-17" },
    { id: "lost", name: "Lost", stage: "LOST", followUpDate: "2026-10-15" },
  ];
  operations.tasks = [
    {
      id: "task",
      title: "Call renewals",
      dueDate: "2026-10-15",
      completed: false,
      priority: "NORMAL",
    },
    {
      id: "done",
      title: "Done",
      dueDate: "2026-10-15",
      completed: true,
      priority: "HIGH",
    },
  ];
  const risk = [
    {
      memberId: "risk-a",
      fullName: "Sara",
      memberCode: "GR A&1",
      riskScore: 90,
      riskLevel: "HIGH",
      factors: { daysSinceLastCheckIn: 14 },
    },
  ];
  const subscriptions = [
    {
      id: "pending",
      status: "PENDING_PAYMENT",
      endDate: "2026-10-01",
      planName: "Pass",
      member: { firstName: "Ayesha", memberCode: "GR-1" },
    },
    {
      id: "expired",
      status: "EXPIRED",
      endDate: "2026-10-01",
      planName: "Pass",
    },
    {
      id: "renew",
      status: "ACTIVE",
      endDate: "2026-10-23T12:00:00Z",
      planName: "Pass",
    },
  ];
  const items = dashboard.buildFocusItems({
    risk,
    subscriptions,
    operations,
    today: "2026-10-16",
    timezone: "Asia/Karachi",
    canManage: true,
  });
  assert.equal(items.length, 5);
  assert.equal(items[0].priority, 0);
  assert.equal(items[1].priority, 0);
  assert.ok(
    !items.some(
      (item) =>
        item.id.includes("expired") ||
        item.id.includes("future") ||
        item.id.includes("lost") ||
        item.id.includes("done"),
    ),
  );
  assert.match(
    items.find((item) => item.category === "Retention").href,
    /GR%20A%261/,
  );
});
test("non-management attention queues exclude finances, leads and team tasks", () => {
  const operations = state();
  operations.tasks = [
    {
      id: "t",
      title: "Private task",
      dueDate: "2026-10-01",
      completed: false,
      priority: "HIGH",
    },
  ];
  assert.equal(
    dashboard.buildFocusItems({
      risk: [],
      subscriptions: [{ id: "s", status: "PENDING_PAYMENT" }],
      operations,
      today: "2026-10-16",
      timezone: "Asia/Karachi",
      canManage: false,
    }).length,
    0,
  );
});
