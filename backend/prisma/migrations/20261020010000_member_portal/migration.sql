-- CreateTable
CREATE TABLE "member_profiles" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "goal" VARCHAR(200) NOT NULL DEFAULT 'Build a consistent routine',
    "weekly_target" INTEGER NOT NULL DEFAULT 3,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "meal_checklist" JSONB NOT NULL DEFAULT '{}',
    "freeze_used_on" DATE,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_bookings" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'BOOKED',
    "attendee_label" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "class_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_logs" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "minutes" INTEGER NOT NULL,
    "notes" VARCHAR(2000),
    "logged_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_records" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "exercise" VARCHAR(100) NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "logged_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "waist_cm" DOUBLE PRECISION,
    "logged_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_messages" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "trainer_id" UUID NOT NULL,
    "sender" VARCHAR(10) NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainer_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_requests" (
    "id" UUID NOT NULL,
    "gym_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_profiles_member_id_key" ON "member_profiles"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_profiles_gym_id_member_id_key" ON "member_profiles"("gym_id", "member_id");

-- CreateIndex
CREATE INDEX "class_bookings_gym_id_session_id_status_created_at_idx" ON "class_bookings"("gym_id", "session_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "class_bookings_gym_id_member_id_session_id_key" ON "class_bookings"("gym_id", "member_id", "session_id");

-- CreateIndex
CREATE INDEX "workout_logs_gym_id_member_id_logged_at_idx" ON "workout_logs"("gym_id", "member_id", "logged_at");

-- CreateIndex
CREATE INDEX "personal_records_gym_id_member_id_logged_at_idx" ON "personal_records"("gym_id", "member_id", "logged_at");

-- CreateIndex
CREATE INDEX "measurements_gym_id_member_id_logged_at_idx" ON "measurements"("gym_id", "member_id", "logged_at");

-- CreateIndex
CREATE INDEX "trainer_messages_gym_id_member_id_created_at_idx" ON "trainer_messages"("gym_id", "member_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_gym_id_member_id_idx" ON "push_subscriptions"("gym_id", "member_id");

-- CreateIndex
CREATE INDEX "announcements_gym_id_created_at_idx" ON "announcements"("gym_id", "created_at");

-- CreateIndex
CREATE INDEX "member_requests_gym_id_member_id_created_at_idx" ON "member_requests"("gym_id", "member_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "members_gym_id_id_key" ON "members"("gym_id", "id");

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_gym_id_member_id_fkey" FOREIGN KEY ("gym_id", "member_id") REFERENCES "members"("gym_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_gym_id_member_id_fkey" FOREIGN KEY ("gym_id", "member_id") REFERENCES "members"("gym_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_gym_id_member_id_fkey" FOREIGN KEY ("gym_id", "member_id") REFERENCES "members"("gym_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_gym_id_member_id_fkey" FOREIGN KEY ("gym_id", "member_id") REFERENCES "members"("gym_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_gym_id_member_id_fkey" FOREIGN KEY ("gym_id", "member_id") REFERENCES "members"("gym_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_messages" ADD CONSTRAINT "trainer_messages_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_messages" ADD CONSTRAINT "trainer_messages_gym_id_member_id_fkey" FOREIGN KEY ("gym_id", "member_id") REFERENCES "members"("gym_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_messages" ADD CONSTRAINT "trainer_messages_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_gym_id_member_id_fkey" FOREIGN KEY ("gym_id", "member_id") REFERENCES "members"("gym_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_requests" ADD CONSTRAINT "member_requests_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_requests" ADD CONSTRAINT "member_requests_gym_id_member_id_fkey" FOREIGN KEY ("gym_id", "member_id") REFERENCES "members"("gym_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
