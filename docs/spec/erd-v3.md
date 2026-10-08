# ERD v3 (đã chốt 05/10/2026) — 18 bảng

PostgreSQL 15+, khóa chính UUID, thời điểm `timestamptz`, không xóa cứng (dùng `status`).
Các con số tính ra được thì không lưu cột: số buổi đã tập/còn lại, khách hay hội viên, PT phụ trách.

## Ràng buộc quan trọng (Prisma không tự sinh, phải viết SQL tay trong migration)

- `orders`: unique một đơn PENDING mỗi (member_id, package_id) — partial unique index.
- `payments`: `merchant_ref` unique; `gateway_txn_id` unique khi khác null; một SUCCESS mỗi đơn; một PENDING mỗi đơn.
- `subscriptions`: `order_id` unique (quan hệ 1–1 với orders).
- `appointments`: exclusion constraint (btree_gist) để lịch CONFIRMED không chồng giờ cùng `trainer_id`, và cùng `member_id`.
- `appointment_proposals`: tối đa một OPEN mỗi `appointment_id`.
- `check_ins`: một lượt `checked_out_at IS NULL` mỗi `member_id`.
- `class_enrollments`: unique (class_id, member_id) khi REGISTERED.
- `trainer_availabilities`: khoảng thời gian của cùng một PT không chồng nhau.
- `notifications.dedup_key` unique; `audit_logs` chỉ INSERT.
- Tìm tên không dấu: extension `unaccent` + `pg_trgm` trên `users.full_name`.
- Kiểm tra trùng lịch giữa lớp học và lịch PT trong transaction có `SELECT … FROM trainers WHERE id = $1 FOR UPDATE`.

## Sơ đồ

```mermaid
erDiagram
    users ||--o| members : "hồ sơ hội viên"
    users ||--o| trainers : "hồ sơ PT"
    users ||--o{ password_reset_tokens : "đặt lại mật khẩu"
    users ||--o{ notifications : "nhận"
    users ||--o{ audit_logs : "thực hiện"
    users ||--o{ check_ins : "Staff xác nhận"
    users ||--o{ appointment_proposals : "đề xuất"
    trainers ||--o{ trainer_availabilities : "khung rảnh"
    packages ||--o{ orders : "được mua"
    packages ||--o{ subscriptions : "mẫu gói"
    members ||--o{ orders : "đặt"
    orders ||--o{ payments : "thanh toán"
    orders ||--o| subscriptions : "sinh ra"
    subscriptions |o--o{ orders : "gia hạn từ"
    members ||--o{ subscriptions : "sở hữu"
    subscriptions ||--o{ appointments : "dùng buổi"
    members ||--o{ appointments : "tập"
    trainers ||--o{ appointments : "dạy"
    appointments ||--|{ appointment_proposals : "thương lượng"
    subscriptions ||--o{ check_ins : "dùng để vào"
    members ||--o{ check_ins : "ra vào"
    trainers ||--o{ classes : "phụ trách"
    classes ||--o{ class_enrollments : "có"
    members ||--o{ class_enrollments : "đăng ký"
    members ||--o{ training_plans : "được lập"
    trainers ||--o{ training_plans : "lập"
    training_plans |o--o{ training_notes : "cập nhật tiến độ"
    members ||--o{ training_notes : "được ghi"
    trainers ||--o{ training_notes : "ghi"

    users {
        uuid id PK
        string email UK
        string phone UK
        string password_hash "null nếu chưa kích hoạt"
        string full_name
        date dob
        string avatar_url
        string role "ADMIN STAFF TRAINER MEMBER"
        string status "ACTIVE LOCKED"
        string shift "chỉ STAFF"
        int token_version
        int failed_logins
        timestamptz locked_until
        timestamptz created_at
    }
    members {
        uuid id PK
        uuid user_id FK, UK
        string member_code UK
        string qr_token UK
    }
    trainers {
        uuid id PK
        uuid user_id FK, UK
        text[] specialties
        text bio
        int experience_years
        string status "ACTIVE INACTIVE"
    }
    trainer_availabilities {
        uuid id PK
        uuid trainer_id FK
        timestamptz starts_at
        timestamptz ends_at
    }
    password_reset_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash
        timestamptz expires_at
        timestamptz used_at
    }
    packages {
        uuid id PK
        string name
        text description
        string type "GYM PT"
        int price "VND"
        int duration_value
        string duration_unit "DAY MONTH"
        int total_sessions "null với GYM"
        int session_minutes
        bool includes_class
        text[] benefits
        string status "ACTIVE INACTIVE"
    }
    orders {
        uuid id PK
        uuid member_id FK
        uuid package_id FK
        uuid renewal_of FK "gói được gia hạn"
        int price_snapshot
        int duration_value_snapshot
        string duration_unit_snapshot
        int total_sessions_snapshot
        int session_minutes_snapshot
        bool includes_class_snapshot
        date starts_on
        int total
        string status "PENDING PAID CANCELLED EXPIRED"
        timestamptz expires_at
        string receipt_no UK
        timestamptz paid_at
        uuid created_by FK
    }
    payments {
        uuid id PK
        uuid order_id FK
        string method "VNPAY CASH"
        int amount
        string status "PENDING SUCCESS FAILED"
        string merchant_ref UK
        string gateway_txn_id UK
        jsonb gateway_payload
        uuid confirmed_by FK
        timestamptz paid_at
    }
    subscriptions {
        uuid id PK
        uuid member_id FK
        uuid package_id FK
        uuid order_id FK, UK
        string package_name
        int total_sessions
        int session_minutes
        bool includes_class
        date starts_on
        date ends_on "tính cả ngày đó"
        string status "ACTIVE FROZEN EXPIRED CANCELLED"
        date frozen_from
        int frozen_days
        string freeze_reason
    }
    appointments {
        uuid id PK
        uuid subscription_id FK
        uuid member_id FK
        uuid trainer_id FK
        string status "PENDING CONFIRMED REJECTED CANCELLED COMPLETED NO_SHOW"
        string awaiting_role "MEMBER TRAINER"
        int version
        timestamptz starts_at
        timestamptz ends_at
        uuid completed_by FK
        timestamptz completed_at
        string note
    }
    appointment_proposals {
        uuid id PK
        uuid appointment_id FK
        string kind "INITIAL COUNTER RESCHEDULE CANCEL"
        uuid proposed_by FK
        string proposed_role
        timestamptz starts_at
        timestamptz ends_at
        string note
        string status "OPEN ACCEPTED REJECTED SUPERSEDED"
        string reject_reason
        timestamptz created_at
    }
    training_plans {
        uuid id PK
        uuid member_id FK
        uuid trainer_id FK
        string title
        jsonb exercises
        int progress_percent "0 đến 100"
        timestamptz updated_at
    }
    training_notes {
        uuid id PK
        uuid member_id FK
        uuid trainer_id FK
        uuid plan_id FK "có thể null"
        text content
        int progress_percent "có thể null"
        timestamptz created_at
    }
    classes {
        uuid id PK
        string name
        text description
        uuid trainer_id FK
        int capacity
        timestamptz starts_at
        timestamptz ends_at
        int cancel_before_minutes
        string status "SCHEDULED CANCELLED"
    }
    class_enrollments {
        uuid id PK
        uuid class_id FK
        uuid member_id FK
        string status "REGISTERED CANCELLED"
        timestamptz created_at
        timestamptz cancelled_at
    }
    check_ins {
        uuid id PK
        uuid member_id FK
        uuid subscription_id FK
        string method "QR PHONE"
        timestamptz checked_in_at
        timestamptz checked_out_at
        string checkout_type "SELF STAFF AUTO"
        uuid checked_in_by FK
    }
    notifications {
        uuid id PK
        uuid user_id FK
        string type
        string title
        text body
        string target_type
        uuid target_id
        bool is_read
        string dedup_key UK
        timestamptz created_at
    }
    audit_logs {
        uuid id PK
        uuid actor_id FK
        string action
        string target_type
        uuid target_id
        jsonb before
        jsonb after
        string reason
        timestamptz created_at
    }
```
