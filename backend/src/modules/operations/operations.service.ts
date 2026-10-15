import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";

export type OperationKind = "leads" | "sessions" | "expenses" | "tasks";
export interface OperationsState {
  version: number;
  leads: any[];
  sessions: any[];
  expenses: any[];
  tasks: any[];
}
export const emptyOperations = (): OperationsState => ({
  version: 0,
  leads: [],
  sessions: [],
  expenses: [],
  tasks: [],
});
const fields = {
  leads: ["name", "phone", "source", "stage", "followUpDate", "notes"],
  sessions: [
    "title",
    "coach",
    "startsAt",
    "duration",
    "capacity",
    "attendees",
    "status",
  ],
  expenses: ["title", "category", "amountPaisa", "date", "notes"],
  tasks: ["title", "dueDate", "priority", "completed"],
};
function text(
  value: unknown,
  name: string,
  max = 250,
  optional = false,
): string {
  if (optional && (value === undefined || value === "")) return "";
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new BadRequestException(`Invalid ${name}`);
  return value.trim();
}
function choice(value: unknown, values: string[], name: string): string {
  if (typeof value !== "string" || !values.includes(value))
    throw new BadRequestException(`Invalid ${name}`);
  return value;
}
function integer(
  value: unknown,
  name: string,
  min: number,
  max: number,
): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < min ||
    (value as number) > max
  )
    throw new BadRequestException(`Invalid ${name}`);
  return value as number;
}
function date(value: unknown, name: string, optional = false): string {
  if (optional && !value) return "";
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw new BadRequestException(`Invalid ${name}`);
  return value;
}
export function validateOperation(kind: OperationKind, input: any) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new BadRequestException("Invalid record");
  if (Object.keys(input).some((key) => !fields[kind]?.includes(key)))
    throw new BadRequestException("Unknown record fields");
  if (kind === "leads") {
    const phone = text(input.phone, "phone", 24);
    if (!/^\+?[\d ()-]{7,24}$/.test(phone))
      throw new BadRequestException("Invalid phone");
    return {
      name: text(input.name, "name"),
      phone,
      source: choice(
        input.source,
        ["Walk-in", "Referral", "Instagram", "Website", "Other"],
        "source",
      ),
      stage: choice(
        input.stage,
        ["NEW", "CONTACTED", "TRIAL", "JOINED", "LOST"],
        "stage",
      ),
      followUpDate: date(input.followUpDate, "follow-up date", true),
      notes: text(input.notes, "notes", 2000, true),
    };
  }
  if (kind === "sessions") {
    const startsAt = text(input.startsAt, "session date", 40);
    if (Number.isNaN(Date.parse(startsAt)) || !/T/.test(startsAt))
      throw new BadRequestException("Invalid session date");
    const attendees = input.attendees ?? [];
    const capacity = integer(input.capacity, "capacity", 1, 500);
    if (
      !Array.isArray(attendees) ||
      attendees.length > capacity ||
      attendees.some(
        (name) => typeof name !== "string" || !name.trim() || name.length > 100,
      ) ||
      new Set(attendees.map((name) => name.trim().toLowerCase())).size !==
        attendees.length
    )
      throw new BadRequestException("Check capacity or duplicate attendees");
    return {
      title: text(input.title, "session title"),
      coach: text(input.coach, "coach", 100),
      startsAt: new Date(startsAt).toISOString(),
      duration: integer(input.duration, "duration", 15, 480),
      capacity,
      attendees: attendees.map((name) => name.trim()),
      status: choice(
        input.status,
        ["SCHEDULED", "COMPLETED", "CANCELLED"],
        "session status",
      ),
    };
  }
  if (kind === "expenses")
    return {
      title: text(input.title, "expense"),
      category: choice(
        input.category,
        ["Rent", "Payroll", "Utilities", "Equipment", "Marketing", "Other"],
        "category",
      ),
      amountPaisa: integer(input.amountPaisa, "amount", 1, 10000000000),
      date: date(input.date, "expense date"),
      notes: text(input.notes, "notes", 2000, true),
    };
  if (kind === "tasks") {
    if (typeof input.completed !== "boolean")
      throw new BadRequestException("Invalid task status");
    return {
      title: text(input.title, "task"),
      dueDate: date(input.dueDate, "due date"),
      priority: choice(input.priority, ["NORMAL", "HIGH"], "priority"),
      completed: input.completed,
    };
  }
  throw new BadRequestException("Invalid record type");
}

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}
  async read(gymId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.current_gym_id', ${gymId}, true), set_config('app.is_super_admin', 'false', true)`;
      const gym = await tx.gym.findUnique({
        where: { id: gymId },
        select: { settings: true },
      });
      if (!gym) throw new NotFoundException("Gym not found");
      return (gym.settings as any)?.operations || emptyOperations();
    });
  }
  async mutate(
    gymId: string,
    actor: { sub: string; role: string },
    command: {
      kind: OperationKind;
      action: "create" | "update";
      id?: string;
      version: number;
      data: any;
    },
  ) {
    if (
      !fields[command.kind] ||
      !["create", "update"].includes(command.action) ||
      !Number.isInteger(command.version) ||
      command.version < 0
    )
      throw new BadRequestException("Invalid operation");
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.current_gym_id', ${gymId}, true), set_config('app.is_super_admin', 'false', true)`;
      await tx.$queryRaw`SELECT id FROM gyms WHERE id = ${gymId}::uuid FOR UPDATE`;
      const gym = await tx.gym.findUnique({
        where: { id: gymId },
        select: { settings: true },
      });
      if (!gym) throw new NotFoundException("Gym not found");
      const settings = (gym.settings as Record<string, any>) || {};
      const state: OperationsState = JSON.parse(
        JSON.stringify(settings.operations || emptyOperations()),
      );
      if (state.version !== command.version)
        throw new ConflictException(
          "Another team member changed this workspace. Refresh and try again.",
        );
      const records = state[command.kind];
      const index =
        command.action === "update"
          ? records.findIndex((record) => record.id === command.id)
          : -1;
      if (command.action === "update" && index < 0)
        throw new NotFoundException("Record not found in this gym");
      if (command.action === "create" && records.length >= 500)
        throw new BadRequestException(
          "This workspace supports 500 records per category. Export and contact support before adding more.",
        );
      const previous = index >= 0 ? records[index] : {};
      const content = validateOperation(command.kind, {
        ...Object.fromEntries(
          Object.entries(previous).filter(([key]) =>
            fields[command.kind].includes(key),
          ),
        ),
        ...command.data,
      });
      const record = {
        ...content,
        id: previous.id || randomUUID(),
        createdAt: previous.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (command.kind === "sessions") {
        const session = record as any;
        if (
          session.status === "SCHEDULED" &&
          state.sessions.some(
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
          throw new ConflictException(
            "This coach already has a session at that time.",
          );
      }

      if (index < 0) records.unshift(record);
      else records[index] = record;
      state.version++;
      await tx.gym.update({
        where: { id: gymId },
        data: { settings: { ...settings, operations: state } as any },
      });
      await tx.auditLog.create({
        data: {
          gymId,
          staffId: actor.sub,
          actorRole: actor.role,
          action: `OPERATIONS_${command.action.toUpperCase()}`,
          resource: command.kind,
          metadata: { recordId: record.id, version: state.version },
        },
      });
      return state;
    });
  }
}
