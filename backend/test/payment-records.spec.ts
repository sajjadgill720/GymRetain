import { PaymentsService } from "../src/modules/payments/payments.service";
describe("Payment ledger integrity", () => {
  const pending = {
    id: "membership-a",
    memberId: "member-a",
    price: 500000,
    currency: "PKR",
    status: "PENDING_PAYMENT",
    updatedAt: new Date("2026-10-16T10:00:00Z"),
  };
  function setup() {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      member: { findFirst: jest.fn().mockResolvedValue({ id: "member-a" }) },
      membership: {
        findFirst: jest.fn().mockResolvedValue(pending),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      payment: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(async ({ data }) => ({ ...data, id: "receipt-a" })),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 200000 } }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    return {
      service: new PaymentsService({
        $transaction: async (callback) => callback(tx),
      } as any),
      tx,
    };
  }
  const dto: any = {
    memberId: "member-a",
    membershipId: "membership-a",
    amount: 2000,
    provider: "CASH",
    providerReference: "RECEIPT-1",
  };
  it("does not extend an unpaid term twice", async () => {
    const { service, tx } = setup();
    await expect(
      service.renewSubscription("gym-a", "membership-a", {
        durationMonths: 1,
        recordPayment: false,
      }),
    ).rejects.toThrow("pending");
    expect(tx.membership.update).not.toHaveBeenCalled();
  });
  it("preserves an existing paid term when an early unpaid renewal is requested", async () => {
    const { service, tx } = setup();
    tx.membership.findFirst.mockResolvedValueOnce({
      ...pending,
      status: "ACTIVE",
      endDate: new Date(Date.now() + 86400000),
    } as any);
    await expect(
      service.renewSubscription("gym-a", "membership-a", {
        durationMonths: 1,
        recordPayment: false,
      }),
    ).rejects.toThrow("still active");
    expect(tx.membership.update).not.toHaveBeenCalled();
  });
  it("converts rupees to paisa, keeps partial payments pending and scopes the renewal balance", async () => {
    const { service, tx } = setup();
    const result = await service.recordPayment("gym-a", "owner", dto);
    expect(result.amount).toBe(2000);
    expect(tx.payment.create.mock.calls[0][0].data.amount).toBe(200000);
    expect(tx.membership.findFirst).toHaveBeenCalledWith({
      where: { id: "membership-a", gymId: "gym-a", memberId: "member-a" },
    });
    expect(tx.membership.update).not.toHaveBeenCalled();
    expect(tx.payment.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { gte: pending.updatedAt },
          status: "COMPLETED",
        }),
      }),
    );
  });
  it("activates only when completed payments cover the current price", async () => {
    const { service, tx } = setup();
    tx.payment.aggregate.mockResolvedValue({ _sum: { amount: 500000 } });
    await service.recordPayment("gym-a", "owner", dto);
    expect(tx.membership.update).toHaveBeenCalledWith({
      where: { id: "membership-a" },
      data: { status: "ACTIVE" },
    });
  });
  it("failed payments never activate memberships", async () => {
    const { service, tx } = setup();
    await service.recordPayment("gym-a", "owner", { ...dto, status: "FAILED" });
    expect(tx.payment.aggregate).not.toHaveBeenCalled();
    expect(tx.membership.update).not.toHaveBeenCalled();
    expect(tx.payment.create.mock.calls[0][0].data.paidAt).toBeNull();
  });
  it("rejects cross-member membership IDs, duplicate receipts and zero amounts before writing", async () => {
    const { service, tx } = setup();
    tx.membership.findFirst.mockResolvedValueOnce(null);
    await expect(service.recordPayment("gym-a", "owner", dto)).rejects.toThrow(
      "does not belong",
    );
    tx.payment.findFirst.mockResolvedValueOnce({ id: "old" });
    await expect(service.recordPayment("gym-a", "owner", dto)).rejects.toThrow(
      "already",
    );
    await expect(
      service.recordPayment("gym-a", "owner", { ...dto, amount: 0 }),
    ).rejects.toThrow("greater");
    expect(tx.payment.create).not.toHaveBeenCalled();
  });
  it("empty ledgers stay empty and database errors propagate", async () => {
    const { service, tx } = setup();
    expect(await service.listPayments("gym-a")).toEqual([]);
    expect(await service.listSubscriptions("gym-a")).toEqual([]);
    tx.payment.findMany.mockRejectedValueOnce(new Error("offline"));
    await expect(service.listPayments("gym-a")).rejects.toThrow("offline");
  });
});
