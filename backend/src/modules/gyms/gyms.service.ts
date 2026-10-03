import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateGymDto } from './dto/update-gym.dto';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';

@Injectable()
export class GymsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGymDetails(gymId: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      include: {
        _count: {
          select: {
            members: true,
            staff: true,
            checkIns: true,
          },
        },
      },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    return gym;
  }

  async updateGymDetails(gymId: string, dto: UpdateGymDto, staffId?: string, actorRole: string = 'GYM_OWNER') {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const updated = await this.prisma.gym.update({
      where: { id: gymId },
      data: dto as any,
    });

    if (dto.capacity !== undefined || dto.capacityPolicy !== undefined) {
      await this.prisma.auditLog.create({
        data: {
          gymId,
          staffId: staffId || null,
          actorRole,
          action: 'CAPACITY_SETTINGS_UPDATE',
          resource: 'GYM_CAPACITY',
          metadata: {
            previousCapacity: gym.capacity,
            newCapacity: updated.capacity,
            previousPolicy: gym.capacityPolicy,
            newPolicy: updated.capacityPolicy,
          },
        },
      });
    }

    return updated;
  }

  async getCapacityStatus(gymId: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: { capacity: true, capacityPolicy: true, name: true },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const currentOpenSessions = await this.prisma.checkIn.count({
      where: {
        gymId,
        sessionStatus: 'OPEN',
      },
    });

    const capacity = gym.capacity || 100;
    const utilizationPercent = Math.round((currentOpenSessions / capacity) * 100);
    const isOverCapacity = currentOpenSessions > capacity;

    return {
      currentOccupancy: currentOpenSessions,
      capacity,
      capacityPolicy: gym.capacityPolicy,
      utilizationPercent,
      isOverCapacity,
      warningMessage: isOverCapacity
        ? `Warning: Current attendance (${currentOpenSessions}) exceeds configured capacity (${capacity}). Admission may be blocked or restricted.`
        : null,
    };
  }

  /**
   * Phase 1 QR Check-In: Generates a signed QR code payload and image (DataURL)
   * for front-desk display / physical placard.
   */
  async getFrontDeskQrCode(gymId: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: { id: true, name: true, slug: true, qrCodeSecret: true },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    // QR Payload encodes gym id and signed secret
    const qrPayload = JSON.stringify({
      gymId: gym.id,
      slug: gym.slug,
      qrSecret: gym.qrCodeSecret,
      v: 1,
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
    });

    return {
      gymId: gym.id,
      gymName: gym.name,
      qrPayload,
      qrDataUrl,
    };
  }

  /**
   * Rotate QR secret if physical QR was compromised
   */
  async rotateQrSecret(gymId: string, staffId?: string, actorRole: string = 'GYM_OWNER') {
    const newSecret = randomUUID();
    const updated = await this.prisma.gym.update({
      where: { id: gymId },
      data: { qrCodeSecret: newSecret },
      select: { id: true, name: true, qrCodeSecret: true },
    });

    await this.prisma.auditLog.create({
      data: {
        gymId,
        staffId: staffId || null,
        actorRole,
        action: 'QR_SECRET_ROTATION',
        resource: 'GYM_QR',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      message: 'QR code secret rotated successfully. Previous physical prints are now invalidated.',
      gym: updated,
    };
  }
}
