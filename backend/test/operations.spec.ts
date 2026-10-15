import {
  OperationsService,
  emptyOperations,
  validateOperation,
} from "../src/modules/operations/operations.service";

describe("Operations records", () => {
  const actor = { sub: "owner", role: "GYM_OWNER" };
  const task = {
    title: "Call renewals",
    dueDate: "2026-10-16",
    priority: "HIGH",
    completed: false,
  };
  const session = {
    title: "Strength",
    coach: "Ayesha",
    startsAt: "2026-10-16T12:00:00Z",
    duration: 60,
    capacity: 2,
    attendees: ["Ali"],
    status: "SCHEDULED",
  };
  function setup(settings: any = { branding: "keep" }) {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      gym: {
        findUnique: jest.fn().mockResolvedValue({ settings }),
        update: jest.fn().mockResolvedValue({}),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: jest.fn(async (callback) => callback(tx)) };
    return { service: new OperationsService(prisma as any), tx };
  }
  it("rejects injected fields, invalid calendar dates, duplicate and over-capacity bookings", () => {
    expect(() =>
      validateOperation("tasks", { ...task, gymId: "other" }),
    ).toThrow("Unknown");
    expect(() =>
      validateOperation("tasks", { ...task, dueDate: "2026-02-30" }),
    ).toThrow("Invalid");
    expect(() =>
      validateOperation("sessions", {
        ...session,
        attendees: ["Ali", " ali "],
      }),
    ).toThrow("duplicate");
    expect(() =>
      validateOperation("sessions", {
        ...session,
        capacity: 1,
        attendees: ["Ali", "Sara"],
      }),
    ).toThrow("capacity");
  });
  it("creates scoped records, preserves unrelated settings and audits the same transaction", async () => {
    const { service, tx } = setup();
    const result = await service.mutate("gym-a", actor, {
      kind: "tasks",
      action: "create",
      version: 0,
      data: task,
    });
    expect(result.version).toBe(1);
    expect(result.tasks[0].id).toBeTruthy();
    expect(tx.gym.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "gym-a" },
        data: {
          settings: expect.objectContaining({
            branding: "keep",
            operations: result,
          }),
        },
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          gymId: "gym-a",
          staffId: "owner",
          actorRole: "GYM_OWNER",
        }),
      }),
    );
    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
  });
  it("rejects stale writes and IDs outside the current gym without modifying anything", async () => {
    const { service, tx } = setup({
      operations: { ...emptyOperations(), version: 3 },
    });
    await expect(
      service.mutate("gym-a", actor, {
        kind: "tasks",
        action: "create",
        version: 2,
        data: task,
      }),
    ).rejects.toThrow("changed");
    await expect(
      service.mutate("gym-a", actor, {
        kind: "tasks",
        action: "update",
        version: 3,
        id: "foreign",
        data: task,
      }),
    ).rejects.toThrow("not found");
    expect(tx.gym.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });
  it("rejects overlapping coach sessions before writing", async () => {
    const { service, tx } = setup({
      operations: {
        ...emptyOperations(),
        sessions: [{ ...session, id: "existing" }],
      },
    });
    await expect(
      service.mutate("gym-a", actor, {
        kind: "sessions",
        action: "create",
        version: 0,
        data: { ...session, startsAt: "2026-10-16T12:30:00Z" },
      }),
    ).rejects.toThrow("already has");
    expect(tx.gym.update).not.toHaveBeenCalled();
  });
  it("read failures propagate and empty gyms have no fabricated records", async () => {
    const { service, tx } = setup();
    expect(await service.read("gym-a")).toEqual(emptyOperations());
    tx.gym.findUnique.mockRejectedValueOnce(new Error("offline"));
    await expect(service.read("gym-a")).rejects.toThrow("offline");
  });
});
