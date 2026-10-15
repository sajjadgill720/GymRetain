"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthProvider";
import {
  OperationsState,
  OperationKind,
  Lead,
  GymSession,
  emptyOperations,
  localDate,
  money,
  downloadCsv,
} from "@/lib/operations";
import {
  Plus,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Users,
  CreditCard,
  Download,
  Search,
  Clock,
  MessageCircle,
  Check,
  X,
} from "@/components/icons";

const tabs = [
  { id: "leads", label: "Lead pipeline", icon: Users },
  { id: "sessions", label: "Schedule", icon: Calendar },
  { id: "expenses", label: "Expenses", icon: CreditCard },
  { id: "tasks", label: "Team checklist", icon: CheckCircle2 },
] as const;
const stages: Lead["stage"][] = ["NEW", "CONTACTED", "TRIAL", "JOINED", "LOST"];
const stageLabels = {
  NEW: "New enquiry",
  CONTACTED: "In conversation",
  TRIAL: "Trial booked",
  JOINED: "Joined",
  LOST: "Not proceeding",
};
const sources = ["Walk-in", "Referral", "Instagram", "Website", "Other"];
const categories = [
  "Rent",
  "Payroll",
  "Utilities",
  "Equipment",
  "Marketing",
  "Other",
];
const inputClass = "studio-input";
function OperationsContent() {
  const params = useSearchParams();
  const { activeGym, user, isLoading: authLoading } = useAuth();
  const tab: OperationKind = tabs.some((item) => item.id === params.get("view"))
    ? (params.get("view") as OperationKind)
    : "leads";
  const [state, setState] = useState<OperationsState>(emptyOperations());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [day, setDay] = useState(localDate());
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [editor, setEditor] = useState<{
    kind: OperationKind;
    id?: string;
  } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [attendee, setAttendee] = useState("");
  const allowed =
    !user || ["GYM_OWNER", "GYM_MANAGER", "SUPER_ADMIN"].includes(user.role);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setState(await api.getOperations());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load operations.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!authLoading && allowed) load();
    else if (!authLoading) setLoading(false);
  }, [load, activeGym?.id, authLoading, allowed]);
  const save = async (
    kind: OperationKind,
    data: Record<string, unknown>,
    id?: string,
  ) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await api.mutateOperations({
        kind,
        action: id ? "update" : "create",
        version: state.version,
        id,
        data,
      });
      setState(next);
      setNotice(
        api.hasSession()
          ? "Saved to your gym workspace."
          : "Saved in this browser’s demo workspace.",
      );
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save. Please try again.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  const open = (kind: OperationKind, record?: any) => {
    setError("");
    setNotice("");
    setEditor({ kind, id: record?.id });
    if (kind === "leads")
      setForm({
        name: record?.name || "",
        phone: record?.phone || "",
        source: record?.source || "Walk-in",
        stage: record?.stage || "NEW",
        followUpDate: record?.followUpDate || localDate(),
        notes: record?.notes || "",
      });
    if (kind === "sessions") {
      const date = new Date(record?.startsAt || `${day}T18:00:00`);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setForm({
        title: record?.title || "",
        coach: record?.coach || "",
        startsAt: local,
        duration: String(record?.duration || 60),
        capacity: String(record?.capacity || 12),
        status: record?.status || "SCHEDULED",
      });
    }
    if (kind === "expenses")
      setForm({
        title: record?.title || "",
        category: record?.category || "Other",
        amount: String((record?.amountPaisa || 0) / 100 || ""),
        date: record?.date || localDate(),
        notes: record?.notes || "",
      });
    if (kind === "tasks")
      setForm({
        title: record?.title || "",
        dueDate: record?.dueDate || localDate(),
        priority: record?.priority || "NORMAL",
        completed: String(record?.completed || false),
      });
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    if (
      editor.kind === "sessions" &&
      !Number.isFinite(Date.parse(form.startsAt))
    ) {
      setError("Enter a valid session date and time.");
      return;
    }
    let data: Record<string, unknown> = { ...form };
    if (editor.kind === "sessions")
      data = {
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
        duration: Number(form.duration),
        capacity: Number(form.capacity),
        attendees:
          state.sessions.find((item) => item.id === editor.id)?.attendees || [],
      };
    if (editor.kind === "expenses") {
      const { amount, ...rest } = form;
      data = { ...rest, amountPaisa: Math.round(Number(amount) * 100) };
    }
    if (editor.kind === "tasks")
      data = { ...form, completed: form.completed === "true" };
    if (await save(editor.kind, data, editor.id)) setEditor(null);
  };
  const field = (
    name: string,
    label: string,
    type = "text",
    options?: string[],
  ) => (
    <label key={name} className="studio-field">
      <span>{label}</span>
      {options ? (
        <select
          className={inputClass}
          value={form[name] || ""}
          onChange={(event) => setForm({ ...form, [name]: event.target.value })}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {name === "stage"
                ? stageLabels[option as Lead["stage"]]
                : option.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          rows={3}
          maxLength={2000}
          className={inputClass}
          value={form[name] || ""}
          onChange={(event) => setForm({ ...form, [name]: event.target.value })}
        />
      ) : (
        <input
          className={inputClass}
          type={type}
          value={form[name] || ""}
          required={!["notes", "followUpDate"].includes(name)}
          maxLength={name === "phone" ? 24 : 250}
          min={
            name === "amount"
              ? "0.01"
              : name === "capacity"
                ? "1"
                : name === "duration"
                  ? "15"
                  : undefined
          }
          max={
            name === "capacity"
              ? "500"
              : name === "duration"
                ? "480"
                : name === "amount"
                  ? "100000000"
                  : undefined
          }
          step={name === "amount" ? "0.01" : "1"}
          onChange={(event) => setForm({ ...form, [name]: event.target.value })}
        />
      )}
    </label>
  );
  const booking = state.sessions.find((session) => session.id === bookingId);
  const leadList = state.leads.filter((lead) =>
    `${lead.name} ${lead.phone} ${lead.source}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const sessions = state.sessions
    .filter(
      (session) =>
        localDate(
          new Date(session.startsAt),
          activeGym?.timezone || "Asia/Karachi",
        ) === day,
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const expenses = state.expenses.filter(
    (expense) =>
      expense.date.startsWith(month) &&
      `${expense.title} ${expense.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const exportCurrent = () => {
    if (tab === "leads")
      downloadCsv(
        "gym-leads.csv",
        ["Name", "Phone", "Source", "Stage", "Follow-up", "Notes"],
        leadList.map((lead) => [
          lead.name,
          lead.phone,
          lead.source,
          stageLabels[lead.stage],
          lead.followUpDate,
          lead.notes,
        ]),
      );
    if (tab === "sessions")
      downloadCsv(
        "gym-sessions.csv",
        [
          "Session",
          "Coach",
          "Starts at",
          "Duration",
          "Capacity",
          "Bookings",
          "Status",
        ],
        sessions.map((session) => [
          session.title,
          session.coach,
          session.startsAt,
          session.duration,
          session.capacity,
          session.attendees.length,
          session.status,
        ]),
      );
    if (tab === "expenses")
      downloadCsv(
        "gym-expenses.csv",
        ["Description", "Category", "Amount (PKR)", "Date", "Notes"],
        expenses.map((expense) => [
          expense.title,
          expense.category,
          expense.amountPaisa / 100,
          expense.date,
          expense.notes,
        ]),
      );
    if (tab === "tasks")
      downloadCsv(
        "gym-tasks.csv",
        ["Task", "Due", "Priority", "Completed"],
        state.tasks.map((task) => [
          task.title,
          task.dueDate,
          task.priority,
          task.completed ? "Yes" : "No",
        ]),
      );
  };
  return (
    <AppLayout onRefreshData={load}>
      <div className="studio-page">
        <div className="studio-page-heading">
          <div>
            <p className="premium-eyebrow">The business behind the training</p>
            <h1>Keep your gym moving.</h1>
            <p>
              From the first enquiry to the last session. One place for the work
              that matters.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCurrent}
              disabled={loading || !allowed}
              className="studio-button"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => open(tab)}
              disabled={loading || !allowed}
              className="studio-button studio-button-primary"
            >
              <Plus className="w-4 h-4" />
              {tab === "leads"
                ? "Add enquiry"
                : tab === "sessions"
                  ? "Schedule session"
                  : tab === "expenses"
                    ? "Record expense"
                    : "Add task"}
            </button>
          </div>
        </div>
        <div
          className="studio-tabs"
          role="navigation"
          aria-label="Operations sections"
        >
          {tabs.map((item) => (
            <Link
              key={item.id}
              href={`/operations?view=${item.id}`}
              aria-current={tab === item.id ? "page" : undefined}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>
        {!allowed ? (
          <div className="studio-empty">
            <h2>Owner and manager workspace</h2>
            <p>
              Your role can use the front-desk and member tools. Business
              operations are managed by your gym owner.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div role="alert" className="studio-alert" data-tone="danger">
                <span>{error}</span>
                <button
                  onClick={load}
                  disabled={busy}
                  className="studio-button"
                >
                  Refresh
                </button>
              </div>
            )}
            {notice && (
              <p role="status" className="studio-alert" data-tone="success">
                <CheckCircle2 className="w-4 h-4" />
                {notice}
              </p>
            )}
            {loading ? (
              <div className="studio-empty" role="status">
                Loading your workspace…
              </div>
            ) : (
              <>
                <div className="studio-summary-strip">
                  <div>
                    <span>Open enquiries</span>
                    <strong>
                      {
                        state.leads.filter(
                          (lead) => !["JOINED", "LOST"].includes(lead.stage),
                        ).length
                      }
                    </strong>
                  </div>
                  <div>
                    <span>Today’s sessions</span>
                    <strong>
                      {
                        state.sessions.filter(
                          (session) =>
                            localDate(new Date(session.startsAt)) ===
                              localDate() && session.status === "SCHEDULED",
                        ).length
                      }
                    </strong>
                  </div>
                  <div>
                    <span>Expenses this month</span>
                    <strong>
                      {money(
                        state.expenses
                          .filter((expense) =>
                            expense.date.startsWith(localDate().slice(0, 7)),
                          )
                          .reduce(
                            (sum, expense) => sum + expense.amountPaisa,
                            0,
                          ),
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Open team tasks</span>
                    <strong>
                      {state.tasks.filter((task) => !task.completed).length}
                    </strong>
                  </div>
                </div>
                {tab === "leads" && (
                  <>
                    <div className="studio-toolbar">
                      <div className="relative">
                        <Search className="studio-search-icon" />
                        <input
                          aria-label="Search leads"
                          className="studio-input pl-10"
                          placeholder="Search enquiries"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                        />
                      </div>
                      <p>Move enquiries forward with a clear next step.</p>
                    </div>
                    <div className="studio-kanban">
                      {stages.map((stage) => (
                        <section key={stage} className="studio-lane">
                          <div className="studio-lane-title">
                            <h2>{stageLabels[stage]}</h2>
                            <span>
                              {
                                leadList.filter((lead) => lead.stage === stage)
                                  .length
                              }
                            </span>
                          </div>
                          {leadList
                            .filter((lead) => lead.stage === stage)
                            .map((lead) => (
                              <article key={lead.id} className="studio-lead">
                                <button
                                  className="studio-record-title"
                                  onClick={() => open("leads", lead)}
                                >
                                  {lead.name}
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <p>{lead.phone}</p>
                                <span className="studio-label">
                                  {lead.source}
                                </span>
                                {lead.notes && (
                                  <p className="studio-lead-note">
                                    {lead.notes}
                                  </p>
                                )}
                                {lead.followUpDate &&
                                  !["JOINED", "LOST"].includes(stage) && (
                                    <p
                                      className={
                                        lead.followUpDate <= localDate()
                                          ? "text-status-warning-text"
                                          : ""
                                      }
                                    >
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      Follow up {lead.followUpDate}
                                    </p>
                                  )}
                                <label
                                  className="sr-only"
                                  htmlFor={`stage-${lead.id}`}
                                >
                                  Stage for {lead.name}
                                </label>
                                <select
                                  id={`stage-${lead.id}`}
                                  disabled={busy}
                                  value={lead.stage}
                                  onChange={(event) =>
                                    save(
                                      "leads",
                                      { stage: event.target.value },
                                      lead.id,
                                    )
                                  }
                                  className="studio-input text-xs"
                                >
                                  {stages.map((value) => (
                                    <option key={value} value={value}>
                                      {stageLabels[value]}
                                    </option>
                                  ))}
                                </select>
                                <a
                                  href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${lead.name.split(" ")[0]}, thank you for your interest in ${activeGym?.name || "our gym"}. When would you like to visit?`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="studio-text-link"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Message on WhatsApp
                                </a>
                              </article>
                            ))}
                          {!leadList.some((lead) => lead.stage === stage) && (
                            <p className="studio-lane-empty">
                              No enquiries here yet
                            </p>
                          )}
                        </section>
                      ))}
                    </div>
                    <p className="studio-footnote">
                      “Joined” tracks conversion. Create the member’s profile
                      and membership in{" "}
                      <Link className="underline" href="/members">
                        Members
                      </Link>{" "}
                      to enable check-in and billing.
                    </p>
                  </>
                )}
                {tab === "sessions" && (
                  <>
                    <div className="studio-toolbar">
                      <label className="studio-field">
                        <span>
                          Schedule date ·{" "}
                          {activeGym?.timezone || "Asia/Karachi"}
                        </span>
                        <input
                          type="date"
                          className="studio-input"
                          value={day}
                          onChange={(event) => setDay(event.target.value)}
                          aria-label="Schedule date"
                        />
                      </label>
                      <p>
                        Capacity limits and coach conflicts are checked before
                        saving.
                      </p>
                    </div>
                    <div className="studio-session-list">
                      {sessions.map((session) => (
                        <article key={session.id} className="studio-session">
                          <div className="studio-session-time">
                            <strong>
                              {new Intl.DateTimeFormat("en-PK", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: activeGym?.timezone || "Asia/Karachi",
                              }).format(new Date(session.startsAt))}
                            </strong>
                            <span>{session.duration} minutes</span>
                          </div>
                          <div className="flex-1">
                            <span className="studio-label">
                              {session.status.replaceAll("_", " ")}
                            </span>
                            <h2>{session.title}</h2>
                            <p>{session.coach}</p>
                          </div>
                          <div className="studio-booking-count">
                            <strong>
                              {session.attendees.length}
                              <span> / {session.capacity}</span>
                            </strong>
                            <div className="studio-progress">
                              <i
                                style={{
                                  width: `${(session.attendees.length / session.capacity) * 100}%`,
                                }}
                              />
                            </div>
                            <span>
                              {session.capacity - session.attendees.length}{" "}
                              places available
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="studio-button"
                              onClick={() => open("sessions", session)}
                            >
                              Edit
                            </button>
                            <button
                              className="studio-button studio-button-primary"
                              onClick={() => {
                                setBookingId(session.id);
                                setAttendee("");
                                setError("");
                              }}
                            >
                              Bookings
                            </button>
                          </div>
                        </article>
                      ))}
                      {!sessions.length && (
                        <div className="studio-empty">
                          <Calendar className="w-7 h-7" />
                          <h2>A little room in the schedule.</h2>
                          <p>
                            Add a group class, PT appointment or trial session.
                          </p>
                          <button
                            className="studio-button studio-button-primary"
                            onClick={() => open("sessions")}
                          >
                            Schedule a session
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {tab === "expenses" && (
                  <div className="premium-panel overflow-hidden">
                    <div className="studio-section-header">
                      <div>
                        <p className="premium-eyebrow">
                          Know where your money goes
                        </p>
                        <h2>
                          Expense ledger{" "}
                          <span>
                            {money(
                              expenses.reduce(
                                (sum, expense) => sum + expense.amountPaisa,
                                0,
                              ),
                            )}
                          </span>
                        </h2>
                      </div>
                      <input
                        aria-label="Expense month"
                        type="month"
                        className="studio-input w-auto"
                        value={month}
                        onChange={(event) => setMonth(event.target.value)}
                      />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="studio-table">
                        <thead>
                          <tr>
                            <th>Expense</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Manage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map((expense) => (
                            <tr key={expense.id}>
                              <td>
                                <strong>{expense.title}</strong>
                                <small>{expense.notes}</small>
                              </td>
                              <td>{expense.category}</td>
                              <td>{expense.date}</td>
                              <td className="font-medium tabular-nums">
                                {money(expense.amountPaisa)}
                              </td>
                              <td>
                                <button
                                  className="studio-button"
                                  onClick={() => open("expenses", expense)}
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                          {!expenses.length && (
                            <tr>
                              <td colSpan={5} className="text-center py-12">
                                No recorded expenses for this month.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <p className="studio-footnote px-6 py-4">
                      Internal expense tracking in PKR. Export the ledger for
                      your accountant.
                    </p>
                  </div>
                )}
                {tab === "tasks" && (
                  <div className="premium-panel">
                    <div className="studio-section-header">
                      <div>
                        <p className="premium-eyebrow">
                          A shared standard of care
                        </p>
                        <h2>Your team’s checklist</h2>
                      </div>
                      <span className="studio-label">
                        {state.tasks.filter((task) => task.completed).length} of{" "}
                        {state.tasks.length} complete
                      </span>
                    </div>
                    <div className="studio-task-list">
                      {[...state.tasks]
                        .sort(
                          (a, b) =>
                            Number(a.completed) - Number(b.completed) ||
                            a.dueDate.localeCompare(b.dueDate),
                        )
                        .map((task) => (
                          <div key={task.id} className="studio-task">
                            <button
                              aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`}
                              aria-pressed={task.completed}
                              disabled={busy}
                              className={`studio-task-check ${task.completed ? "is-complete" : ""}`}
                              onClick={() =>
                                save(
                                  "tasks",
                                  { completed: !task.completed },
                                  task.id,
                                )
                              }
                            >
                              {task.completed && <Check className="w-4 h-4" />}
                            </button>
                            <div className="flex-1">
                              <p
                                className={
                                  task.completed
                                    ? "line-through text-content-tertiary"
                                    : "font-medium"
                                }
                              >
                                {task.title}
                              </p>
                              <small>
                                {task.dueDate}
                                {!task.completed && task.dueDate < localDate()
                                  ? " · Overdue"
                                  : ""}
                              </small>
                            </div>
                            {task.priority === "HIGH" && !task.completed && (
                              <span data-tone="warning" className="status-pill">
                                Priority
                              </span>
                            )}
                            <button
                              className="studio-button"
                              onClick={() => open("tasks", task)}
                            >
                              Edit
                            </button>
                          </div>
                        ))}
                      {!state.tasks.length && (
                        <p className="studio-empty">
                          Add your first team task.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
        <Modal
          isOpen={!!editor}
          onClose={() => !busy && setEditor(null)}
          title={`${editor?.id ? "Edit" : "Add"} ${editor?.kind === "leads" ? "enquiry" : editor?.kind === "sessions" ? "session" : editor?.kind === "expenses" ? "expense" : "task"}`}
          description="Keep the details your team needs, in one place."
          maxWidth="lg"
        >
          <form onSubmit={submit} className="space-y-4">
            {editor?.kind === "leads" && (
              <>
                {field("name", "Full name")}
                {field("phone", "Phone", "tel")}
                <div className="grid grid-cols-2 gap-3">
                  {field("source", "Source", "text", sources)}
                  {field("stage", "Stage", "text", stages)}
                </div>
                {field("followUpDate", "Follow-up date", "date")}
                {field("notes", "Notes", "textarea")}
              </>
            )}
            {editor?.kind === "sessions" && (
              <>
                {field("title", "Session title")}
                {field("coach", "Coach")}
                <p className="text-xs text-content-secondary">
                  Time is entered in your device’s local timezone and shown in
                  the gym’s timezone.
                </p>
                {field("startsAt", "Date and time", "datetime-local")}
                <div className="grid grid-cols-2 gap-3">
                  {field("duration", "Duration (minutes)", "number")}
                  {field("capacity", "Available places", "number")}
                </div>
                {field("status", "Status", "text", [
                  "SCHEDULED",
                  "COMPLETED",
                  "CANCELLED",
                ])}
              </>
            )}
            {editor?.kind === "expenses" && (
              <>
                {field("title", "Description")}
                <div className="grid grid-cols-2 gap-3">
                  {field("amount", "Amount (PKR)", "number")}
                  {field("date", "Paid on", "date")}
                </div>
                {field("category", "Category", "text", categories)}
                {field("notes", "Notes", "textarea")}
              </>
            )}
            {editor?.kind === "tasks" && (
              <>
                {field("title", "Task")}
                {field("dueDate", "Due date", "date")}
                {field("priority", "Priority", "text", ["NORMAL", "HIGH"])}
              </>
            )}
            {error && (
              <p role="alert" className="text-sm text-status-danger-text">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-4 border-t border-surface-border">
              <button
                type="button"
                disabled={busy}
                className="studio-button"
                onClick={() => setEditor(null)}
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="studio-button studio-button-primary"
              >
                {busy ? "Saving…" : "Save details"}
              </button>
            </div>
          </form>
        </Modal>
        <Modal
          isOpen={!!booking}
          onClose={() => !busy && setBookingId(null)}
          title={booking?.title || "Session bookings"}
          description={
            booking
              ? `${booking.attendees.length} of ${booking.capacity} places booked · ${booking.coach}`
              : undefined
          }
        >
          {booking && (
            <div className="space-y-4">
              <div className="space-y-2">
                {booking.attendees.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 rounded-lg bg-canvas"
                  >
                    <span className="text-sm">{name}</span>
                    <button
                      aria-label={`Remove ${name} from session`}
                      disabled={busy || booking.status !== "SCHEDULED"}
                      onClick={() =>
                        save(
                          "sessions",
                          {
                            attendees: booking.attendees.filter(
                              (item) => item !== name,
                            ),
                          },
                          booking.id,
                        )
                      }
                      className="p-2 rounded-lg text-status-danger-text"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {!booking.attendees.length && (
                  <p className="text-sm text-content-secondary">
                    No attendees booked yet.
                  </p>
                )}
              </div>
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!attendee.trim()) return;
                  if (
                    await save(
                      "sessions",
                      { attendees: [...booking.attendees, attendee.trim()] },
                      booking.id,
                    )
                  )
                    setAttendee("");
                }}
                className="space-y-3"
              >
                <label className="studio-field">
                  <span>Attendee name</span>
                  <input
                    className="studio-input"
                    maxLength={100}
                    value={attendee}
                    required
                    onChange={(event) => setAttendee(event.target.value)}
                  />
                </label>
                <button
                  disabled={
                    busy ||
                    booking.attendees.length >= booking.capacity ||
                    booking.status !== "SCHEDULED"
                  }
                  className="studio-button studio-button-primary w-full"
                >
                  {booking.attendees.length >= booking.capacity
                    ? "Session is full"
                    : booking.status !== "SCHEDULED"
                      ? "Session is closed"
                      : "Book a place"}
                </button>
              </form>
              {error && (
                <p role="alert" className="text-sm text-status-danger-text">
                  {error}
                </p>
              )}
              <p className="studio-footnote">
                Class bookings reserve a place. Gym check-in is recorded
                separately at the front desk.
              </p>
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
export default function OperationsPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading operations…</p>}>
      <OperationsContent />
    </Suspense>
  );
}
