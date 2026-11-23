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
