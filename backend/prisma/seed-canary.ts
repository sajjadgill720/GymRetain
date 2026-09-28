import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { startOfDay } from 'date-fns';

const prisma = new PrismaClient();

export const CANARY_GYM_ID = '99999999-9999-9999-9999-999999999999';
export const CANARY_OWNER_ID = '99999999-9999-9999-9999-999999999998';
export const CANARY_MEMBER_ID = '99999999-9999-9999-9999-999999999997';

/**
 * Permanent Canary Test Gym Seed Script
 *
 * CRITICAL ENVIRONMENT DIRECTIVE:
 * This canary tenant is a persistent security test benchmark in all non-production environments.
 * It MUST NEVER be deleted. It is used by CI/CD automated adversarial suites and post-deploy
 * smoke tests to prove that cross-tenant read/write operations fail across tenant boundaries.
 *
 * This script is 100% IDEMPOTENT (uses upsert) and will NOT delete or alter any demo or production data.
 */
async function seedCanary() {
  console.log('🔒 Ensuring permanent Canary Defense Test Gym exists...');

  const passwordHash = await bcrypt.hash('GymRetainCanary2026!', 10);

  // 1. Permanent Canary Gym
  const canaryGym = await prisma.gym.upsert({
    where: { id: CANARY_GYM_ID },
    update: {
      name: 'Canary Defense Test Gym',
      slug: 'canary-test-gym',
      status: 'ACTIVE',
      qrCodeSecret: 'canary-defense-secret-do-not-leak',
    },
    create: {
      id: CANARY_GYM_ID,
      name: 'Canary Defense Test Gym',
      slug: 'canary-test-gym',
      phone: '+92510000000',
      email: 'canary@gymretain.pk',
      address: 'Canary Defense Security Facility, Sector F-7, Islamabad',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      status: 'ACTIVE',
      qrCodeSecret: 'canary-defense-secret-do-not-leak',
    },
  });

  // 2. Permanent Canary Gym Owner
  const canaryOwner = await prisma.gymStaff.upsert({
    where: { id: CANARY_OWNER_ID },
    update: {
      gymId: canaryGym.id,
      email: 'canary.owner@gymretain.pk',
      isActive: true,
    },
    create: {
      id: CANARY_OWNER_ID,
      gymId: canaryGym.id,
      email: 'canary.owner@gymretain.pk',
      name: 'Canary Defense Security Officer',
      phone: '+923000000002',
      passwordHash,
      role: 'GYM_OWNER',
      isActive: true,
    },
  });

  // 3. Permanent Canary Target Member (Cross-tenant attack target)
  const canaryMember = await prisma.member.upsert({
    where: { id: CANARY_MEMBER_ID },
    update: {
      gymId: canaryGym.id,
      firstName: 'Canary',
      lastName: 'TargetMember',
      status: 'ACTIVE',
    },
    create: {
      id: CANARY_MEMBER_ID,
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

  // 4. Permanent Canary Streak Record
  const existingStreak = await prisma.streak.findUnique({
    where: { memberId: canaryMember.id },
  });

  if (!existingStreak) {
    await prisma.streak.create({
      data: {
        gymId: canaryGym.id,
        memberId: canaryMember.id,
        currentStreak: 14,
        longestStreak: 14,
        lastCheckInDate: startOfDay(new Date()),
      },
    });
  }

  // 5. Permanent Core WhatsApp Meta Templates
  const templates = [
    {
      name: 'streak_celebration',
      metaTemplateId: 'meta_streak_v1',
      category: 'UTILITY' as const,
      body: '🔥 Salam {{1}}! That is {{2}} days in a row at {{3}}! Momentum is everything—keep the flame alive! 💪',
    },
    {
      name: 'missed_visit_nudge',
      category: 'MARKETING' as const,
      metaTemplateId: 'meta_missed_visit_v1',
      body: 'Salam {{1}}! We missed you at {{2}} over the past {{3}} days. Your fitness goals are waiting—drop in for a session today! 🏋️‍♂️',
    },
    {
      name: 'payment_reminder',
      category: 'UTILITY' as const,
      metaTemplateId: 'meta_payment_reminder_v1',
      body: 'Salam {{1}}! Friendly reminder that your {{2}} membership renewal is due. Keep your workout access seamless. 💳',
    },
    {
      name: 'reward_unlocked',
      category: 'UTILITY' as const,
      metaTemplateId: 'meta_reward_unlocked_v1',
      body: '🎁 Congratulations {{1}}! You have unlocked a milestone reward: "{{2}}" at {{3}}! Claim it at the front desk. 🏆',
    },
  ];

  for (const t of templates) {
    await prisma.whatsAppTemplate.upsert({
      where: {
        gymId_name: {
          gymId: canaryGym.id,
          name: t.name,
        },
      },
      update: {
        metaTemplateId: t.metaTemplateId,
        category: t.category,
        body: t.body,
        isActive: true,
      },
      create: {
        gymId: canaryGym.id,
        name: t.name,
        metaTemplateId: t.metaTemplateId,
        category: t.category,
        body: t.body,
        isActive: true,
      },
    });
  }

  console.log('✅ Canary Defense Test Gym verified & persistent:');
  console.log(`   - Gym ID:     ${canaryGym.id} (${canaryGym.name})`);
  console.log(`   - Owner ID:   ${canaryOwner.id} (${canaryOwner.email})`);
  console.log(`   - Member ID:  ${canaryMember.id} (${canaryMember.memberCode} - ${canaryMember.firstName})`);
  console.log('   - Notice:     This tenant MUST NOT be deleted. Used by post-deploy isolation smoke checks.');
}

seedCanary()
  .catch((e) => {
    console.error('❌ Canary seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
