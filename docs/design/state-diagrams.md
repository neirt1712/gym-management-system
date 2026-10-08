# Sơ đồ trạng thái

- **Ai sở hữu:** Triển. **Khi nào cập nhật:** khi đổi trạng thái hay chuyển trạng thái trong ERD hoặc API.
- Đủ 7 sơ đồ: Đơn hàng, Gói hội viên, Lịch PT, Thanh toán, Đề xuất lịch PT, Đăng ký lớp, Lượt check-in.
- Dán code vào mermaid.live hoặc draw.io để xuất ảnh cho báo cáo.

## Đơn hàng và gói hội viên

```mermaid
stateDiagram-v2
    direction LR
    state "Đơn hàng (orders)" as O {
        [*] --> PENDING
        PENDING --> PAID : có payment SUCCESS
        PENDING --> CANCELLED : hủy
        PENDING --> EXPIRED : quá hạn, job 5 phút
    }
    state "Gói hội viên (subscriptions)" as S {
        [*] --> ACTIVE
        ACTIVE --> FROZEN : freeze
        FROZEN --> ACTIVE : unfreeze, cộng số ngày bảo lưu
        ACTIVE --> EXPIRED : qua ends_on
        ACTIVE --> CANCELLED : Admin hủy
    }
    O --> S : PAID sinh gói
```

## Lịch PT (appointments)

```mermaid
stateDiagram-v2
    [*] --> PENDING : POST /appointments
    PENDING --> PENDING : đề xuất lại (COUNTER)
    PENDING --> CONFIRMED : accept
    PENDING --> REJECTED : reject
    CONFIRMED --> CONFIRMED : RESCHEDULE được đồng ý
    CONFIRMED --> CANCELLED : CANCEL được đồng ý
    CONFIRMED --> COMPLETED : PT xác nhận đã tập
    CONFIRMED --> NO_SHOW : PT xác nhận vắng
    REJECTED --> [*]
    CANCELLED --> [*]
    COMPLETED --> [*]
    NO_SHOW --> [*]
```

## Thanh toán (payments)

```mermaid
stateDiagram-v2
    direction LR
    [*] --> PENDING : chọn VNPAY hoặc CASH cho đơn
    PENDING --> SUCCESS : IPN VNPay thành công hoặc Staff confirm-cash
    PENDING --> FAILED : IPN báo thất bại
    PENDING --> FAILED : thanh toán lại, payment mới thay thế
    PENDING --> FAILED : đơn bị hủy hoặc hết hạn
    SUCCESS --> [*]
    FAILED --> [*]
    note right of SUCCESS
        Cùng một transaction
        đơn PAID, sinh receipt_no,
        gói hội viên ACTIVE, thông báo
    end note
```

- Mỗi đơn tối đa 1 payment PENDING và 1 payment SUCCESS (ERD v3).
- IPN gửi lặp không đổi trạng thái lần hai (unique `gateway_txn_id`).
- Giả định của Triển (openapi v0.1): đơn hết hạn thì payment PENDING chuyển FAILED, giống khi hủy đơn.
- Chưa chốt (Q17): IPN báo thành công cho payment đã FAILED vì bị thay thế.

## Đề xuất lịch PT (appointment_proposals)

```mermaid
stateDiagram-v2
    direction LR
    [*] --> OPEN : gửi đề xuất INITIAL, COUNTER, RESCHEDULE hoặc CANCEL
    OPEN --> ACCEPTED : bên đang được hỏi đồng ý
    OPEN --> REJECTED : bên đang được hỏi từ chối
    OPEN --> SUPERSEDED : bên đang được hỏi đề xuất giờ khác (COUNTER)
    ACCEPTED --> [*]
    REJECTED --> [*]
    SUPERSEDED --> [*]
```

- Mỗi lịch tối đa 1 đề xuất OPEN. Chỉ bên đang được hỏi (`awaiting_role`) mới được đồng ý, từ chối hoặc COUNTER.
- Mọi hành động gửi `expectedVersion`; thành công thì `appointments.version + 1`, lệch thì `STALE_VERSION`.
- Đề xuất ảnh hưởng lịch PT như sau:

| Loại đề xuất | Được đồng ý | Bị từ chối |
| --- | --- | --- |
| INITIAL, COUNTER (lịch PENDING) | Lịch → CONFIRMED | Lịch → REJECTED, nhả buổi đang giữ |
| RESCHEDULE (lịch CONFIRMED) | Lịch giữ CONFIRMED, đổi sang giờ mới | Lịch giữ nguyên giờ cũ |
| CANCEL (lịch CONFIRMED) | Lịch → CANCELLED, không trừ buổi | Lịch giữ nguyên |

## Đăng ký lớp (class_enrollments)

```mermaid
stateDiagram-v2
    direction LR
    [*] --> REGISTERED : hội viên đăng ký
    REGISTERED --> CANCELLED : hội viên hủy trước hạn hủy
    REGISTERED --> [*] : lớp diễn ra
    CANCELLED --> [*]
```

- Đăng ký cần gói ACTIVE có `includes_class` (`NO_CLASS_BENEFIT`) và lớp còn chỗ (`CLASS_FULL`).
- Hạn hủy: trước giờ bắt đầu `cancel_before_minutes` phút, mặc định 120 (quyết định 11); quá hạn thì `CANCELLATION_WINDOW_PASSED`.
- Hủy rồi đăng ký lại thì tạo dòng mới (unique `(class_id, member_id)` chỉ áp khi REGISTERED).
- Chưa chốt: Admin hủy lớp thì các đăng ký REGISTERED xử lý thế nào. Chốt khi viết openapi nhóm Lớp học (16/10).

## Lượt check-in (check_ins)

Bảng không có cột trạng thái; trạng thái suy ra từ `checked_out_at`.

```mermaid
stateDiagram-v2
    direction LR
    state "Đang trong phòng (checked_out_at trống)" as InGym
    state "Đã ra" as Out
    [*] --> InGym : Staff check-in bằng QR hoặc SĐT
    InGym --> Out : SELF, hội viên tự check-out
    InGym --> Out : STAFF, nhân viên làm hộ
    InGym --> Out : AUTO, job 23h59 tự đóng
    Out --> [*]
```

- Mỗi hội viên chỉ có 1 lượt đang trong phòng; check-in tiếp khi chưa ra thì `ALREADY_CHECKED_IN`.
- Check-in không trừ buổi PT.
