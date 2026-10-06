# Sơ đồ trạng thái

- **Ai sở hữu:** Triển. **Khi nào cập nhật:** khi đổi trạng thái hay chuyển trạng thái trong ERD hoặc API.
- Đã có: Đơn hàng, Gói hội viên, Lịch PT. Triển bổ sung Thanh toán, Đề xuất lịch, Đăng ký lớp, Lượt check-in trước 09/10.
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

## Còn thiếu (Triển)
- Thanh toán: PENDING → SUCCESS / FAILED.
- Đề xuất lịch: OPEN → ACCEPTED / REJECTED / SUPERSEDED.
- Đăng ký lớp: REGISTERED → CANCELLED.
- Lượt check-in: đang trong phòng → đã ra (SELF, STAFF, AUTO).
