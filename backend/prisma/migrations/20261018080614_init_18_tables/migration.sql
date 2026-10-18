-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'TRAINER', 'MEMBER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'LOCKED');

-- CreateEnum
CREATE TYPE "TrainerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('GYM', 'PT');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('DAY', 'MONTH');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VNPAY', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'FROZEN', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CheckInMethod" AS ENUM ('QR', 'PHONE');

-- CreateEnum
CREATE TYPE "CheckoutType" AS ENUM ('SELF', 'STAFF', 'AUTO');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AwaitingRole" AS ENUM ('MEMBER', 'TRAINER');

-- CreateEnum
CREATE TYPE "ProposalKind" AS ENUM ('INITIAL', 'COUNTER', 'RESCHEDULE', 'CANCEL');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('OPEN', 'ACCEPTED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('SCHEDULED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('REGISTERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "dob" DATE,
    "avatar_url" TEXT,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "shift" TEXT,
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "failed_logins" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "member_code" TEXT NOT NULL,
    "qr_token" TEXT NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "experience_years" INTEGER,
    "status" "TrainerStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "trainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainer_availabilities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trainer_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trainer_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PackageType" NOT NULL,
    "price" INTEGER NOT NULL,
    "duration_value" INTEGER NOT NULL,
    "duration_unit" "DurationUnit" NOT NULL,
    "total_sessions" INTEGER,
    "session_minutes" INTEGER,
    "includes_class" BOOLEAN NOT NULL DEFAULT false,
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "renewal_of" UUID,
    "price_snapshot" INTEGER NOT NULL,
    "duration_value_snapshot" INTEGER NOT NULL,
    "duration_unit_snapshot" "DurationUnit" NOT NULL,
    "total_sessions_snapshot" INTEGER,
    "session_minutes_snapshot" INTEGER,
    "includes_class_snapshot" BOOLEAN NOT NULL,
    "starts_on" DATE NOT NULL,
    "total" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "receipt_no" TEXT,
    "paid_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "merchant_ref" TEXT NOT NULL,
    "gateway_txn_id" TEXT,
    "gateway_payload" JSONB,
    "confirmed_by" UUID,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "package_name" TEXT NOT NULL,
    "total_sessions" INTEGER,
    "session_minutes" INTEGER,
    "includes_class" BOOLEAN NOT NULL,
    "starts_on" DATE NOT NULL,
    "ends_on" DATE NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "frozen_from" DATE,
    "frozen_days" INTEGER,
    "freeze_reason" TEXT,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "method" "CheckInMethod" NOT NULL,
    "checked_in_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_out_at" TIMESTAMPTZ(6),
    "checkout_type" "CheckoutType",
    "checked_in_by" UUID NOT NULL,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscription_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "trainer_id" UUID NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "awaiting_role" "AwaitingRole",
    "version" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_by" UUID,
    "completed_at" TIMESTAMPTZ(6),
    "note" TEXT,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_proposals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID NOT NULL,
    "kind" "ProposalKind" NOT NULL,
    "proposed_by" UUID NOT NULL,
    "proposed_role" "Role" NOT NULL,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "note" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'OPEN',
    "reject_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "trainer_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "exercises" JSONB NOT NULL DEFAULT '[]',
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "trainer_id" UUID NOT NULL,
    "plan_id" UUID,
    "content" TEXT NOT NULL,
    "progress_percent" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trainer_id" UUID NOT NULL,
    "capacity" INTEGER NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "cancel_before_minutes" INTEGER NOT NULL DEFAULT 120,
    "status" "ClassStatus" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_enrollments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "class_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'REGISTERED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "class_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "dedup_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "members_user_id_key" ON "members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_member_code_key" ON "members"("member_code");

-- CreateIndex
CREATE UNIQUE INDEX "members_qr_token_key" ON "members"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "trainers_user_id_key" ON "trainers"("user_id");

-- CreateIndex
CREATE INDEX "trainer_availabilities_trainer_id_starts_at_idx" ON "trainer_availabilities"("trainer_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_receipt_no_key" ON "orders"("receipt_no");

-- CreateIndex
CREATE INDEX "orders_member_id_status_idx" ON "orders"("member_id", "status");

-- CreateIndex
CREATE INDEX "orders_status_expires_at_idx" ON "orders"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_merchant_ref_key" ON "payments"("merchant_ref");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_txn_id_key" ON "payments"("gateway_txn_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_order_id_key" ON "subscriptions"("order_id");

-- CreateIndex
CREATE INDEX "subscriptions_member_id_status_idx" ON "subscriptions"("member_id", "status");

-- CreateIndex
CREATE INDEX "check_ins_member_id_checked_in_at_idx" ON "check_ins"("member_id", "checked_in_at");

-- CreateIndex
CREATE INDEX "appointments_trainer_id_starts_at_idx" ON "appointments"("trainer_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_member_id_starts_at_idx" ON "appointments"("member_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_subscription_id_status_idx" ON "appointments"("subscription_id", "status");

-- CreateIndex
CREATE INDEX "appointment_proposals_appointment_id_created_at_idx" ON "appointment_proposals"("appointment_id", "created_at");

-- CreateIndex
CREATE INDEX "training_plans_member_id_idx" ON "training_plans"("member_id");

-- CreateIndex
CREATE INDEX "training_notes_member_id_created_at_idx" ON "training_notes"("member_id", "created_at");

-- CreateIndex
CREATE INDEX "classes_starts_at_idx" ON "classes"("starts_at");

-- CreateIndex
CREATE INDEX "classes_trainer_id_starts_at_idx" ON "classes"("trainer_id", "starts_at");

-- CreateIndex
CREATE INDEX "class_enrollments_member_id_idx" ON "class_enrollments"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedup_key_key" ON "notifications"("dedup_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_created_at_idx" ON "audit_logs"("target_type", "target_id", "created_at");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_availabilities" ADD CONSTRAINT "trainer_availabilities_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_renewal_of_fkey" FOREIGN KEY ("renewal_of") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_proposals" ADD CONSTRAINT "appointment_proposals_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_proposals" ADD CONSTRAINT "appointment_proposals_proposed_by_fkey" FOREIGN KEY ("proposed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_notes" ADD CONSTRAINT "training_notes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_notes" ADD CONSTRAINT "training_notes_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_notes" ADD CONSTRAINT "training_notes_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "training_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "trainers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- Ràng buộc Prisma không tự sinh, cho đủ 18 bảng (docs/spec/erd-v3.md, mục "Ràng buộc quan trọng").
-- CÁCH DÙNG: `npx prisma migrate dev --create-only --name init_18_tables`,
-- mở file migration.sql vừa sinh, DÁN TOÀN BỘ file này vào CUỐI, rồi `npx prisma migrate dev`.
-- ============================================================

-- rule: extension theo ADR 0001 (btree_gist cho chống chồng giờ; unaccent + pg_trgm cho tìm tên không dấu)
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- rule: tìm tên không dấu trên users.full_name (unaccent gốc không IMMUTABLE nên bọc lại để đánh index)
CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;
CREATE INDEX users_full_name_search_idx
  ON users USING gin (immutable_unaccent(lower(full_name)) gin_trgm_ops);

-- ---------- 10 bảng đầu ----------

-- rule: orders — mỗi (member_id, package_id) chỉ có một đơn PENDING (vi phạm → PENDING_ORDER_EXISTS)
CREATE UNIQUE INDEX orders_one_pending_per_member_package
  ON orders (member_id, package_id) WHERE status = 'PENDING';

-- rule: payments — một SUCCESS mỗi đơn; một PENDING mỗi đơn
CREATE UNIQUE INDEX payments_one_success_per_order ON payments (order_id) WHERE status = 'SUCCESS';
CREATE UNIQUE INDEX payments_one_pending_per_order ON payments (order_id) WHERE status = 'PENDING';

-- rule: check_ins — mỗi hội viên chỉ một lượt chưa check-out (vi phạm → ALREADY_CHECKED_IN)
CREATE UNIQUE INDEX check_ins_one_open_per_member ON check_ins (member_id) WHERE checked_out_at IS NULL;

-- rule: trainer_availabilities — các khoảng rảnh của cùng một PT không chồng nhau
ALTER TABLE trainer_availabilities
  ADD CONSTRAINT trainer_availabilities_no_overlap
  EXCLUDE USING gist (trainer_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&);

-- rule: khoảng thời gian hợp lệ
ALTER TABLE trainer_availabilities ADD CONSTRAINT trainer_availabilities_valid_range CHECK (ends_at > starts_at);
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_valid_range CHECK (ends_on >= starts_on);

-- rule: tiền VND là số nguyên không âm
ALTER TABLE packages ADD CONSTRAINT packages_price_nonneg CHECK (price >= 0);
ALTER TABLE orders   ADD CONSTRAINT orders_total_nonneg CHECK (total >= 0 AND price_snapshot >= 0);
ALTER TABLE payments ADD CONSTRAINT payments_amount_nonneg CHECK (amount >= 0);

-- rule: gói PT phải có số buổi; gói GYM không có (ERD: total_sessions null với GYM)
ALTER TABLE packages ADD CONSTRAINT packages_sessions_by_type
  CHECK ((type = 'PT' AND total_sessions > 0) OR (type = 'GYM' AND total_sessions IS NULL));

-- rule: bảo lưu tối đa 30 ngày (decisions.md #10)
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_frozen_days_range
  CHECK (frozen_days IS NULL OR frozen_days BETWEEN 1 AND 30);

-- ---------- 8 bảng còn lại ----------

-- rule: appointments — lịch CONFIRMED không chồng giờ cùng PT (vi phạm → SCHEDULE_CONFLICT)
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap_trainer
  EXCLUDE USING gist (trainer_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
  WHERE (status = 'CONFIRMED');

-- rule: appointments — lịch CONFIRMED không chồng giờ cùng hội viên (vi phạm → SCHEDULE_CONFLICT)
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap_member
  EXCLUDE USING gist (member_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
  WHERE (status = 'CONFIRMED');

ALTER TABLE appointments ADD CONSTRAINT appointments_valid_range CHECK (ends_at > starts_at);

-- rule: appointment_proposals — tối đa một đề xuất OPEN mỗi lịch
CREATE UNIQUE INDEX appointment_proposals_one_open
  ON appointment_proposals (appointment_id) WHERE status = 'OPEN';

ALTER TABLE appointment_proposals ADD CONSTRAINT appointment_proposals_valid_range
  CHECK ((kind = 'CANCEL' AND starts_at IS NULL AND ends_at IS NULL)
      OR (kind <> 'CANCEL' AND ends_at > starts_at));

-- rule: class_enrollments — mỗi hội viên một đăng ký REGISTERED mỗi lớp
CREATE UNIQUE INDEX class_enrollments_one_registered
  ON class_enrollments (class_id, member_id) WHERE status = 'REGISTERED';

ALTER TABLE classes ADD CONSTRAINT classes_valid_range CHECK (ends_at > starts_at);
ALTER TABLE classes ADD CONSTRAINT classes_capacity_pos CHECK (capacity > 0);
ALTER TABLE classes ADD CONSTRAINT classes_cancel_before_nonneg CHECK (cancel_before_minutes >= 0);

-- rule: tiến độ 0–100
ALTER TABLE training_plans ADD CONSTRAINT training_plans_progress_range CHECK (progress_percent BETWEEN 0 AND 100);
ALTER TABLE training_notes ADD CONSTRAINT training_notes_progress_range
  CHECK (progress_percent IS NULL OR progress_percent BETWEEN 0 AND 100);

-- rule: audit_logs chỉ INSERT, không sửa không xóa
CREATE OR REPLACE FUNCTION audit_logs_block_change() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs chỉ được INSERT';
END $$;
CREATE TRIGGER audit_logs_no_update_delete
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_block_change();
