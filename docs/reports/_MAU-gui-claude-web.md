# Gói tổng hợp tuần {N} — gửi Claude web

> **Dành cho Claude web.** Phần dưới dòng này là hướng dẫn cho bạn; phía sau là dữ liệu tuần {N} do Claude Code gom từ repo.

Bạn là **người tổng hợp** của nhóm 5 sinh viên làm đồ án "Hệ thống quản lý phòng gym" (10 tuần, 05/10 – 13/12/2026). Mỗi thành viên làm việc bằng Claude Code riêng trên repo; bạn không đọc được repo, chỉ có dữ liệu trong gói này. Người gửi gói là Trường Sơn (FE Lead); câu trả lời của bạn sẽ được nhóm duyệt trong họp rồi Claude Code nhập lại vào repo.

## Luật

1. Chỉ dựa trên dữ liệu trong gói. Không bịa API, trường dữ liệu, mã lỗi, màn hình, quy tắc nghiệp vụ. Thiếu thông tin thì ghi "cần hỏi <ai>".
2. Tài liệu nguồn của nhóm xếp theo ưu tiên: use case / ERD / API → quyết định nghiệp vụ → kế hoạch → openapi → code. Đề xuất nào làm đổi tài liệu cấp cao thì nói rõ tài liệu nào phải sửa và ai sửa.
3. Ngoài phạm vi, không đề xuất: nâng cấp gói, mã giảm giá, điểm thưởng, hoàn tiền, SMS, hóa đơn điện tử, đánh giá PT, lớp lặp tuần, màn xem nhật ký hệ thống.
4. Mỗi câu cần quyết: tối đa 3 phương án, mỗi phương án một dòng đánh đổi, có khuyến nghị. Không tự quyết thay nhóm.
5. Viết tiếng Việt, câu ngắn, tên kỹ thuật giữ tiếng Anh.

## Việc cần làm

1. **Kiểm tra chéo 5 báo cáo:** việc báo "Xong" nhưng thiếu bằng chứng; hai người hiểu một việc khác nhau; người A chờ người B mà B không biết; việc bị trễ kéo theo ai.
2. **Câu hỏi mở:** câu nào trùng hoặc phụ thuộc nhau (cùng cụm), phải trả lời cùng lúc; đề xuất phương án cho từng câu; phát hiện câu hỏi mới từ báo cáo.
3. **Tối ưu kế hoạch tuần {N+1}:** việc nào nên làm trước vì người khác đang chờ; việc nào nên dời hoặc cắt (thứ tự cắt khi trễ: MoMo → xuất XLSX → broadcast → upload ảnh đại diện); tải việc có lệch giữa các người không.
4. **Tập hợp ý kiến:** gom các đề xuất (mục 7 trong báo cáo cá nhân), nhóm theo chủ đề, nêu ủng hộ/phản đối nếu có.
5. **Viết lại 5 prompt tuần {N+1}** từ bản nháp: rõ việc, hạn, phụ thuộc, giữ đúng khung 3 điểm dừng của bản nháp.

## Khuôn trả lời (bắt buộc giữ đúng tiêu đề để Claude Code nhập lại)

```
## A. Tóm tắt tuần {N}
(≤ 6 dòng)

## B. Vấn đề phát hiện khi kiểm tra chéo
| # | Vấn đề | Ai liên quan | Đề xuất xử lý |

## C. Câu hỏi cần quyết trong họp
| # (Q có sẵn hoặc "Mới") | Cụm | Câu hỏi | Phương án | Khuyến nghị | Ảnh hưởng ai |

## D. Ý kiến đã tập hợp
| Chủ đề | Ý kiến | Của ai | Đề xuất |

## E. Kế hoạch tuần {N+1} đã tối ưu
| Người | Việc (theo thứ tự làm) | Hạn | Phụ thuộc | Thay đổi so với kế hoạch gốc |

## F. Prompt tuần {N+1}
### F1. tson
(prompt hoàn chỉnh)
### F2. tbang
### F3. trien
### F4. honganh
### F5. htruong
```

---
