import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { subDays, startOfDay, addMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting GymRetain database seeding...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.whatsAppMessageLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.rewardRedemption.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.streak.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.member.deleteMany();
  await prisma.gymStaff.deleteMany();
  await prisma.gym.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('GymRetain2026!', 10);

  // 1. Platform Super Admin
  const superAdmin = await prisma.gymStaff.create({
    data: {
      email: 'superadmin@gymretain.pk',
      name: 'GymRetain Platform Admin',
      phone: '+923000000000',
      passwordHash: defaultPasswordHash,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 2. Gym 1: Iron House Gym & Fitness (Lahore)
  const gym1 = await prisma.gym.create({
    data: {
      name: 'Iron House Gym & Fitness',
      slug: 'iron-house-lahore',
      phone: '+924235750000',
      email: 'contact@ironhouse.pk',
      address: 'Plot 42-B, Main Boulevard, Gulberg III, Lahore',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      status: 'ACTIVE',
    },
  });

  const gym1Owner = await prisma.gymStaff.create({
    data: {
      gymId: gym1.id,
      email: 'bilal.owner@ironhouse.pk',
      name: 'Bilal Chaudhry',
      phone: '+923001234567',
      passwordHash: defaultPasswordHash,
      role: 'GYM_OWNER',
    },
  });

  const gym1Staff = await prisma.gymStaff.create({
    data: {
      gymId: gym1.id,
      email: 'usman.staff@ironhouse.pk',
      name: 'Usman Riaz',
      phone: '+923214567890',
      passwordHash: defaultPasswordHash,
      role: 'GYM_STAFF',
    },
  });

  // Rewards for Gym 1
  const reward10Days = await prisma.reward.create({
    data: {
      gymId: gym1.id,
      title: '10-Day Streak Warrior',
      description: 'Awarded for checking in 10 consecutive days without missing a day!',
      rewardType: 'BADGE',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 10,
      badgeIcon: 'flame-gold',
    },
  });

  const rewardProteinShake = await prisma.reward.create({
    data: {
      gymId: gym1.id,
      title: 'Free Whey Protein Shake',
      description: 'Redeemable at the juice bar for hitting a 15-day workout streak.',
      rewardType: 'FREE_ITEM',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 15,
      badgeIcon: 'cup-shake',
    },
  });

  // Members for Gym 1
  // Member A: Highly active, on a 12-day streak (Unlocked 10-day reward)
  const memberA = await prisma.member.create({
    data: {
      gymId: gym1.id,
      memberCode: 'GR-1001',
      firstName: 'Hamza',
      lastName: 'Sheikh',
      phone: '+923009876543',
      email: 'hamza.sheikh@gmail.com',
      gender: 'MALE',
      dateOfBirth: new Date(1995, 4, 15),
      joinDate: subDays(new Date(), 60),
      status: 'ACTIVE',
    },
  });

  await prisma.membership.create({
    data: {
      gymId: gym1.id,
      memberId: memberA.id,
      planName: 'Monthly Gold',
      planType: 'MONTHLY',
      price: 650000, // 6,500.00 PKR in paisa
      currency: 'PKR',
      startDate: subDays(new Date(), 10),
      endDate: addMonths(subDays(new Date(), 10), 1),
      status: 'ACTIVE',
    },
  });

  await prisma.streak.create({
    data: {
      gymId: gym1.id,
      memberId: memberA.id,
      currentStreak: 12,
      longestStreak: 12,
      lastCheckInDate: startOfDay(new Date()),
    },
  });

  // 12 daily check-ins for Member A
  for (let i = 11; i >= 0; i--) {
    await prisma.checkIn.create({
      data: {
        gymId: gym1.id,
        memberId: memberA.id,
        checkInTime: subDays(new Date(), i),
        checkInDate: startOfDay(subDays(new Date(), i)),
        method: 'QR_SCAN',
      },
    });
  }

  // Member A unlocked 10-day badge
  await prisma.rewardRedemption.create({
    data: {
      gymId: gym1.id,
      memberId: memberA.id,
      rewardId: reward10Days.id,
      status: 'UNLOCKED',
      unlockedAt: subDays(new Date(), 2),
    },
  });

  // Member B: At-risk churn member (Absent for 16 days, broken streak, payment overdue)
  const memberB = await prisma.member.create({
    data: {
      gymId: gym1.id,
      memberCode: 'GR-1002',
      firstName: 'Ayesha',
      lastName: 'Malik',
      phone: '+923331122334',
      email: 'ayesha.malik@outlook.com',
      gender: 'FEMALE',
      dateOfBirth: new Date(1998, 8, 22),
      joinDate: subDays(new Date(), 90),
      status: 'ACTIVE',
    },
  });

  await prisma.membership.create({
    data: {
      gymId: gym1.id,
      memberId: memberB.id,
      planName: 'Monthly Standard',
      planType: 'MONTHLY',
      price: 500000, // 5,000 PKR
      currency: 'PKR',
      startDate: subDays(new Date(), 45),
      endDate: subDays(new Date(), 15), // Expired 15 days ago!
      status: 'EXPIRED',
    },
  });

  await prisma.streak.create({
    data: {
      gymId: gym1.id,
      memberId: memberB.id,
      currentStreak: 0,
      longestStreak: 8,
      lastCheckInDate: startOfDay(subDays(new Date(), 16)),
      streakBrokenAt: subDays(new Date(), 15),
    },
  });

  // Member B had check-ins earlier but stopped 16 days ago
  await prisma.checkIn.create({
    data: {
      gymId: gym1.id,
      memberId: memberB.id,
      checkInTime: subDays(new Date(), 16),
      checkInDate: startOfDay(subDays(new Date(), 16)),
      method: 'MANUAL_STAFF',
    },
  });

  // 3. Gym 2: K-Town Crossfit & Performance (Karachi)
  const gym2 = await prisma.gym.create({
    data: {
      name: 'K-Town Crossfit & Performance',
      slug: 'ktown-crossfit',
      phone: '+922135830000',
      email: 'info@ktowncrossfit.pk',
      address: 'Sea View Road, Clifton Block 4, Karachi',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      status: 'ACTIVE',
    },
  });

  const gym2Owner = await prisma.gymStaff.create({
    data: {
      gymId: gym2.id,
      email: 'tariq.owner@ktowncrossfit.pk',
      name: 'Tariq Alvi',
      phone: '+923004455667',
      passwordHash: defaultPasswordHash,
      role: 'GYM_OWNER',
    },
  });

  const memberC = await prisma.member.create({
    data: {
      gymId: gym2.id,
      memberCode: 'GR-2001',
      firstName: 'Zaid',
      lastName: 'Siddiqui',
      phone: '+923129988776',
      email: 'zaid.siddiqui@gmail.com',
      gender: 'MALE',
      joinDate: subDays(new Date(), 30),
      status: 'ACTIVE',
    },
  });

  await prisma.streak.create({
    data: {
      gymId: gym2.id,
      memberId: memberC.id,
      currentStreak: 4,
      longestStreak: 6,
      lastCheckInDate: startOfDay(new Date()),
    },
  });

  // 4. Gym 3: Margalla Heights Fitness Club (Islamabad)
  const gym3 = await prisma.gym.create({
    data: {
      name: 'Margalla Heights Fitness Club',
      slug: 'margalla-heights',
      phone: '+92512650000',
      email: 'desk@margallafit.pk',
      address: 'F-7 Markaz, Islamabad',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      status: 'ACTIVE',
    },
  });

  const gym3Owner = await prisma.gymStaff.create({
    data: {
      gymId: gym3.id,
      email: 'hamza.owner@margallafit.pk',
      name: 'Hamza Abbasi',
      phone: '+923335566778',
      passwordHash: defaultPasswordHash,
      role: 'GYM_OWNER',
    },
  });

  // 5. Permanent Canary Defense Test Gym (for automated cross-tenant security verification)
  const canaryGym = await prisma.gym.create({
    data: {
      name: 'Canary Defense Test Gym',
      slug: 'canary-test-gym',
      phone: '+92510000000',
      email: 'canary@gymretain.pk',
      address: 'Canary Security Testing Suite, Islamabad',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      status: 'ACTIVE',
    },
  });

  const canaryOwner = await prisma.gymStaff.create({
    data: {
      gymId: canaryGym.id,
      email: 'canary.owner@gymretain.pk',
      name: 'Canary Security Officer',
      phone: '+923000000002',
      passwordHash: defaultPasswordHash,
      role: 'GYM_OWNER',
    },
  });

  const canaryMember = await prisma.member.create({
    data: {
      gymId: canaryGym.id,
      memberCode: 'CANARY-001',
      firstName: 'Canary',
      lastName: 'TargetMember',
      phone: '+923000000001',
      email: 'canary.member@gymretain.pk',
      gender: 'OTHER',
      status: 'ACTIVE',
    },
  });

  await prisma.streak.create({
    data: {
      gymId: canaryGym.id,
      memberId: canaryMember.id,
      currentStreak: 10,
      longestStreak: 10,
      lastCheckInDate: startOfDay(new Date()),
    },
  });

  console.log('✅ Seed completed with 3 Pakistani gyms + Permanent Canary Security Test Gym!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials (Password for all: GymRetain2026!):');
  console.log('1. Super Admin:       superadmin@gymretain.pk');
  console.log('2. Lahore Owner:      bilal.owner@ironhouse.pk (Gym: Iron House)');
  console.log('3. Lahore Staff:      usman.staff@ironhouse.pk');
  console.log('4. Karachi Owner:     tariq.owner@ktowncrossfit.pk (Gym: K-Town Crossfit)');
  console.log('5. Islamabad Owner:   hamza.owner@margallafit.pk (Gym: Margalla Heights)');
  console.log('6. Canary Test Gym:   canary.owner@gymretain.pk (Gym: Canary Defense)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
