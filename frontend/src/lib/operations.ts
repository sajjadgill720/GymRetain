export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  stage: "NEW" | "CONTACTED" | "TRIAL" | "JOINED" | "LOST";
  followUpDate: string;
  notes: string;
  createdAt?: string;
}
export interface GymSession {
  id: string;
  title: string;
  coach: string;
  startsAt: string;
  duration: number;
  capacity: number;
  attendees: string[];
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}
export interface Expense {
  id: string;
  title: string;
  category: string;
  amountPaisa: number;
  date: string;
  notes: string;
}
export interface GymTask {
  id: string;
  title: string;
  dueDate: string;
  priority: "NORMAL" | "HIGH";
  completed: boolean;
}
export interface OperationsState {
  version: number;
  leads: Lead[];
  sessions: GymSession[];
  expenses: Expense[];
  tasks: GymTask[];
}
export type OperationKind = "leads" | "sessions" | "expenses" | "tasks";
export interface OperationCommand {
  kind: OperationKind;
  action: "create" | "update";
  version: number;
  id?: string;
  data: Record<string, unknown>;
}
export function localDate(
  value = new Date(),
  timezone = "Asia/Karachi",
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}
export const money = (paisa: number) =>
  `Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 }).format(paisa / 100)}`;
export const emptyOperations = (): OperationsState => ({
  version: 0,
  leads: [],
  sessions: [],
  expenses: [],
  tasks: [],
});
export function demoOperations(): OperationsState {
  const today = localDate();
  return {
    version: 0,
    leads: [
      {
        id: "demo-lead-1",
        name: "Ali Raza",
        phone: "+923001234561",
        source: "Referral",
        stage: "TRIAL",
        followUpDate: today,
        notes: "Interested in the strength program. Trial tour requested.",
      },
      {
        id: "demo-lead-2",
        name: "Sara Khan",
        phone: "+923001234562",
        source: "Instagram",
        stage: "NEW",
        followUpDate: today,
        notes: "Asked about monthly memberships.",
      },
      {
        id: "demo-lead-3",
        name: "Daniyal Ahmed",
        phone: "+923001234563",
        source: "Walk-in",
        stage: "CONTACTED",
        followUpDate: today,
        notes: "Prefers evening training.",
      },
    ],
    sessions: [
      {
        id: "demo-session-1",
        title: "Strength foundations",
        coach: "Coach Usman",
        startsAt: new Date(`${today}T18:00:00+05:00`).toISOString(),
        duration: 60,
        capacity: 12,
        attendees: ["Hamza Sheikh", "Fatima Zahra", "Zaid Siddiqui"],
        status: "SCHEDULED",
      },
      {
        id: "demo-session-2",
        title: "Small-group conditioning",
        coach: "Coach Ayesha",
        startsAt: new Date(`${today}T19:30:00+05:00`).toISOString(),
        duration: 45,
        capacity: 8,
        attendees: ["Bilal Ahmed", "Ali Raza"],
        status: "SCHEDULED",
      },
    ],
    expenses: [
      {
        id: "demo-expense-1",
        title: "Equipment servicing",
        category: "Equipment",
        amountPaisa: 1200000,
        date: today,
        notes: "Monthly preventive maintenance",
      },
      {
        id: "demo-expense-2",
        title: "Front-desk supplies",
        category: "Other",
        amountPaisa: 250000,
        date: today,
        notes: "",
      },
    ],
    tasks: [
      {
        id: "demo-task-1",
        title: "Call members with overdue renewals",
        dueDate: today,
        priority: "HIGH",
        completed: false,
      },
      {
        id: "demo-task-2",
        title: "Prepare the evening trial tour",
        dueDate: today,
        priority: "NORMAL",
        completed: false,
      },
      {
        id: "demo-task-3",
        title: "Check equipment before opening",
        dueDate: today,
        priority: "NORMAL",
        completed: true,
      },
    ],
  };
}
export function applyDemoOperation(
  state: OperationsState,
  command: OperationCommand,
): OperationsState {
  if (command.version !== state.version)
    throw new Error("The workspace changed. Refresh and try again.");
  const next: OperationsState = JSON.parse(JSON.stringify(state));
  const records = next[command.kind] as unknown as Record<string, unknown>[];
  const index =
    command.action === "update"
      ? records.findIndex((record) => record.id === command.id)
      : -1;
  if (command.action === "update" && index < 0)
    throw new Error("Record no longer exists. Refresh the workspace.");
  if (command.action === "create" && records.length >= 500)
    throw new Error("The demo supports 500 records per category.");
  const entry: Record<string, unknown> = {
    ...(index < 0 ? {} : records[index]),
    ...command.data,
    id: index < 0 ? crypto.randomUUID() : command.id,
  };
  if (command.kind === "sessions") {
    const session = entry as unknown as GymSession;
    if (
      !Number.isInteger(session.capacity) ||
      session.capacity < 1 ||
      !Array.isArray(session.attendees) ||
      session.attendees.length > session.capacity ||
      new Set(session.attendees.map((name) => name.trim().toLowerCase()))
        .size !== session.attendees.length
    )
      throw new Error("Check capacity or duplicate attendees.");
    if (
      session.status === "SCHEDULED" &&
      next.sessions.some(
        (other) =>
          other.id !== session.id &&
          other.status === "SCHEDULED" &&
          other.coach.trim().toLowerCase() ===
            session.coach.trim().toLowerCase() &&
          Date.parse(other.startsAt) <
            Date.parse(session.startsAt) + session.duration * 60000 &&
          Date.parse(session.startsAt) <
            Date.parse(other.startsAt) + other.duration * 60000,
      )
    )
      throw new Error("This coach already has a session at that time.");
  }
  if (
    command.kind === "expenses" &&
    (!Number.isSafeInteger(entry.amountPaisa) || Number(entry.amountPaisa) <= 0)
  )
    throw new Error("Enter an amount greater than zero.");
  if (index < 0) records.unshift(entry);
  else records[index] = entry;
  next.version++;
  return next;
}
export function csvDocument(headers: string[], rows: unknown[][]): string {
  const cell = (value: unknown) => {
    const text = String(value ?? "");
    return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
  };
  return (
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n")
  );
}
export function downloadCsv(
  name: string,
  headers: string[],
  rows: unknown[][],
) {
  const url = URL.createObjectURL(
    new Blob([csvDocument(headers, rows)], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
