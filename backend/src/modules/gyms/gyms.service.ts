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

  async updateGymDetails(gymId: string, dto: UpdateGymDto) {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    return this.prisma.gym.update({
      where: { id: gymId },
      data: dto,
    });
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
  async rotateQrSecret(gymId: string) {
    const newSecret = randomUUID();
    const updated = await this.prisma.gym.update({
      where: { id: gymId },
      data: { qrCodeSecret: newSecret },
      select: { id: true, name: true, qrCodeSecret: true },
    });

    return {
      message: 'QR code secret rotated successfully. Previous physical prints are now invalidated.',
      gym: updated,
    };
  }
}
