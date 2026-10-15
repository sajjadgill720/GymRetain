import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { MembershipStatus, PaymentStatus } from "@prisma/client";
import { addMonths } from "date-fns";
import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { RenewSubscriptionDto } from "./dto/renew-subscription.dto";
import { RecordPaymentDto } from "./dto/record-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}
  private async transaction<T>(
    gymId: string,
    operation: (tx: any) => Promise<T>,
    lock = true,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.current_gym_id', ${gymId}, true), set_config('app.is_super_admin', 'false', true)`;
      if (lock)
        await tx.$queryRaw`SELECT id FROM gyms WHERE id = ${gymId}::uuid FOR UPDATE`;
      return operation(tx);
    });
  }
  private amount(value: number) {
    const paisa = Math.round(value * 100);
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      !Number.isSafeInteger(paisa) ||
      paisa > 10000000000
    )
      throw new BadRequestException("Invalid payment amount");
    return paisa;
  }
  private subscription(row: any) {
    return {
      ...row,
      price: row.price / 100,
      startDate: new Date(row.startDate).toISOString(),
      endDate: new Date(row.endDate).toISOString(),
      status:
        row.status === "ACTIVE" && new Date(row.endDate) < new Date()
          ? "EXPIRED"
          : row.status,
      latestPayment: row.payments?.[0]
        ? {
            ...row.payments[0],
            amount: row.payments[0].amount / 100,
            paidAt: row.payments[0].paidAt?.toISOString() || null,
          }
        : null,
    };
  }
  async listSubscriptions(gymId: string, status?: string) {
    const rows: any[] = await this.transaction(
      gymId,
      (tx) =>
        tx.membership.findMany({
          where: { gymId },
          include: {
            member: {
              select: {
                id: true,
                memberCode: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            payments: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          orderBy: { endDate: "asc" },
        }),
      false,
    );
    const items = rows.map((row) => this.subscription(row));
    return !status || status === "ALL"
      ? items
      : items.filter((row) => row.status === status);
  }
  async createSubscription(gymId: string, dto: CreateSubscriptionDto) {
    const startDate = new Date(dto.startDate),
      endDate = new Date(dto.endDate);
    if (
      !Number.isFinite(startDate.getTime()) ||
      !Number.isFinite(endDate.getTime()) ||
      endDate <= startDate
    )
      throw new BadRequestException("Membership end must follow its start");
    const price = this.amount(dto.price);
    return this.transaction(gymId, async (tx) => {
      if (!(await tx.member.findFirst({ where: { id: dto.memberId, gymId } })))
        throw new NotFoundException("Member not found in this gym");
      const row = await tx.membership.create({
        data: {
          gymId,
          memberId: dto.memberId,
          planName: dto.planName,
          planType: dto.planType,
          price,
          currency: "PKR",
          startDate,
          endDate,
          status:
            price === 0
              ? MembershipStatus.ACTIVE
              : MembershipStatus.PENDING_PAYMENT,
          autoRenew: dto.autoRenew ?? false,
        },
        include: { member: true },
      });
      return this.subscription(row);
    });
  }
  async renewSubscription(
    gymId: string,
    id: string,
    dto: RenewSubscriptionDto,
  ) {
    const months = dto.durationMonths ?? 1;
    if (!Number.isInteger(months) || months < 1 || months > 36)
      throw new BadRequestException("Renewal duration must be 1–36 months");
    return this.transaction(gymId, async (tx) => {
      const membership = await tx.membership.findFirst({
        where: { id, gymId },
      });
      if (!membership)
        throw new NotFoundException("Membership not found in this gym");
      if (membership.status === MembershipStatus.PENDING_PAYMENT)
        throw new ConflictException(
          "Settle the pending membership payment before renewing again.",
        );
      if (
        !dto.recordPayment &&
        membership.price > 0 &&
        membership.status === MembershipStatus.ACTIVE &&
        new Date(membership.endDate).getTime() > Date.now()
      )
        throw new BadRequestException(
          "This paid term is still active. Record a received renewal fee, or wait until expiry to create an unpaid renewal.",
        );
      const amount =
        dto.amount === undefined ? membership.price : this.amount(dto.amount);
      if (dto.recordPayment && amount < membership.price)
        throw new BadRequestException(
          "Record the full renewal amount, or renew as pending payment.",
        );
      const endDate = addMonths(
        new Date(Math.max(Date.now(), new Date(membership.endDate).getTime())),
        months,
      );
      const updated = await tx.membership.update({
        where: { id },
        data: {
          endDate,
          status:
            dto.recordPayment || membership.price === 0
              ? MembershipStatus.ACTIVE
              : MembershipStatus.PENDING_PAYMENT,
        },
      });
      if (dto.recordPayment)
        await tx.payment.create({
          data: {
            gymId,
            memberId: membership.memberId,
            membershipId: id,
            amount,
            currency: membership.currency,
            provider: dto.paymentProvider || "CASH",
            status: PaymentStatus.COMPLETED,
            providerReference: `RCPT-${randomUUID().slice(0, 12)}`,
            paidAt: new Date(),
          },
        });
      return this.subscription(updated);
    });
  }
  async cancelSubscription(gymId: string, id: string) {
    return this.transaction(gymId, async (tx) => {
      const membership = await tx.membership.findFirst({
        where: { id, gymId },
      });
      if (!membership)
        throw new NotFoundException("Membership not found in this gym");
      return tx.membership.update({
        where: { id },
        data: { status: MembershipStatus.CANCELLED, autoRenew: false },
      });
    });
  }
  async listPayments(gymId: string) {
    const rows: any[] = await this.transaction(
      gymId,
      (tx) =>
        tx.payment.findMany({
          where: { gymId },
          include: {
            member: {
              select: {
                id: true,
                memberCode: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            membership: { select: { planName: true, planType: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
      false,
    );
    return rows.map((row) => ({
      ...row,
      amount: row.amount / 100,
      paidAt: row.paidAt?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
    }));
  }
  async recordPayment(
    gymId: string,
    staffId: string,
    dto: RecordPaymentDto,
    actorRole = "GYM_STAFF",
  ) {
    const amount = this.amount(dto.amount);
    if (!amount)
      throw new BadRequestException("Payment must be greater than zero");
    return this.transaction(gymId, async (tx) => {
      const member = await tx.member.findFirst({
        where: { id: dto.memberId, gymId },
      });
      if (!member) throw new NotFoundException("Member not found in this gym");
      const membership = dto.membershipId
        ? await tx.membership.findFirst({
            where: { id: dto.membershipId, gymId, memberId: dto.memberId },
          })
        : null;
      if (dto.membershipId && !membership)
        throw new NotFoundException(
          "Membership does not belong to this member and gym",
        );
      if (membership?.status === MembershipStatus.CANCELLED)
        throw new BadRequestException("This membership was cancelled");
      const currency = membership?.currency || "PKR";
      if (dto.currency && dto.currency !== currency)
        throw new BadRequestException(
          "Payment currency does not match the membership",
        );
      const reference =
        dto.providerReference?.trim() || `RCPT-${randomUUID().slice(0, 12)}`;
      if (
        await tx.payment.findFirst({
          where: { gymId, providerReference: reference },
        })
      )
        throw new ConflictException(
          "This receipt/reference has already been recorded",
        );
      const status = dto.status || PaymentStatus.COMPLETED;
      const row = await tx.payment.create({
        data: {
          gymId,
          memberId: dto.memberId,
          membershipId: dto.membershipId,
          amount,
          currency,
          provider: dto.provider,
          status,
          providerReference: reference,
          paidAt:
            status === PaymentStatus.COMPLETED
              ? dto.paidAt
                ? new Date(dto.paidAt)
                : new Date()
              : null,
          paymentMethodDetails: {
            notes: dto.notes || "",
            recordedByStaffId: staffId,
          },
        },
        include: { member: true },
      });
      if (
        membership &&
        membership.status === MembershipStatus.PENDING_PAYMENT &&
        status === PaymentStatus.COMPLETED
      ) {
        const paid = await tx.payment.aggregate({
          where: {
            gymId,
            membershipId: membership.id,
            status: PaymentStatus.COMPLETED,
            createdAt: { gte: membership.updatedAt },
          },
          _sum: { amount: true },
        });
        if ((paid._sum.amount || 0) >= membership.price)
          await tx.membership.update({
            where: { id: membership.id },
            data: { status: MembershipStatus.ACTIVE },
          });
      }
      await tx.auditLog.create({
        data: {
          gymId,
          staffId,
          actorRole,
          action: "PAYMENT_RECORDED",
          resource: "PAYMENT",
          metadata: { paymentId: row.id, amount, currency, status },
        },
      });
      return { ...row, amount: row.amount / 100 };
    });
  }
  async getMetrics(gymId: string) {
    const [subscriptions, payments, gym] = await Promise.all([
      this.listSubscriptions(gymId),
      this.listPayments(gymId),
      this.transaction<{ timezone: string } | null>(
        gymId,
        (tx) =>
          tx.gym.findUnique({
            where: { id: gymId },
            select: { timezone: true },
          }),
        false,
      ),
    ]);
    const zone = gym?.timezone || "Asia/Karachi";
    const month = (date: Date) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
      }).format(date);
    const currentMonth = month(new Date());
    return {
      activeSubscriptions: subscriptions.filter(
        (row) => row.status === "ACTIVE",
      ).length,
      pendingPayments: subscriptions.filter(
        (row) => row.status === "PENDING_PAYMENT",
      ).length,
      expiredSubscriptions: subscriptions.filter(
        (row) => row.status === "EXPIRED",
      ).length,
      expiringWithin7Days: subscriptions.filter(
        (row) =>
          row.status === "ACTIVE" &&
          new Date(row.endDate) >= new Date() &&
          new Date(row.endDate).getTime() <= Date.now() + 7 * 86400000,
      ).length,
      totalRevenueRecorded: payments
        .filter(
          (row) =>
            row.status === "COMPLETED" &&
            row.paidAt &&
            month(new Date(row.paidAt)) === currentMonth,
        )
        .reduce((sum, row) => sum + row.amount, 0),
      currency: "PKR",
      totalSubscriptionsTracked: subscriptions.length,
    };
  }
}
