# Báo cáo tuần

- **Ai viết:** mỗi người một báo cáo cá nhân mỗi tuần (`/team-report`), từ chiều Thứ Sáu đến hết Chủ Nhật.
- **Ai tổng hợp:** Huy Trường (PM) chạy `/team-week-close` sáng Thứ Hai, trước họp; Sơn chạy thay khi cần.
- **Ai đọc:** cả nhóm trong họp Thứ Hai; bản `.docx` dùng để nộp và in.
- Tuần 1 bắt đầu Thứ Hai 05/10/2026; tuần N = tuần chứa ngày báo cáo.

## Quy trình

```
Thứ Sáu–CN   mỗi người: /team-report        → tuan-NN/<ten>.md + <ten>.docx
Thứ Hai      Huy Trường: /team-week-close   → tuan-NN/TONG-HOP.md + .docx
                                              tuan-NN/prompt-tuan-(NN+1)/<ten>.md (5 bản)
Họp Thứ Hai  cả nhóm duyệt TONG-HOP, chốt thay đổi kế hoạch; mỗi người dán prompt của mình vào Claude Code
```

## Cấu trúc thư mục

```
docs/reports/
├── README.md                 file này
├── _MAU-ca-nhan.md           mẫu báo cáo cá nhân
├── _MAU-tong-hop.md          mẫu báo cáo tổng hợp
├── _MAU-prompt.md            mẫu prompt tuần sau
└── tuan-01/
    ├── tson.md, tson.docx    (5 người)
    ├── TONG-HOP.md, TONG-HOP.docx
    └── prompt-tuan-02/
        └── tson.md, tbang.md, trien.md, honganh.md, htruong.md
```

File `.md` là bản gốc (Claude đọc để tổng hợp). File `.docx` sinh ra từ `.md`, không sửa tay; muốn sửa thì sửa `.md` rồi xuất lại.

## Tên viết tắt (dùng cho tên file)

| Người | Vai trò | Tên file |
| --- | --- | --- |
| Trường Sơn | FE Lead | `tson` |
| Thanh Bằng | FE Sub | `tbang` |
| Triển | BE Lead | `trien` |
| Hồng Anh | BE Sub | `honganh` |
| Huy Trường | PM | `htruong` |

Muốn đổi tên viết tắt: sửa bảng này qua PR, báo Huy Trường.

## Xuất Word

Lần đầu trên mỗi máy: `cd tools/report-docx`, `npm install`, rồi `cd ../..` về gốc repo.
Xuất một file: `node tools/report-docx/md2docx.mjs docs/reports/tuan-01/tson.md`.

## Commit

Báo cáo cá nhân: commit vào nhánh của tuần (ví dụ `tsonw1-report`), message `docs(report): tuần 1 báo cáo của tson`, PR vào `develop`. Huy Trường gộp các PR báo cáo trước khi chạy `/team-week-close`.
