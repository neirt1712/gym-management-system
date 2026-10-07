# Báo cáo tuần

- **Ai viết:** mỗi người một báo cáo cá nhân mỗi tuần (`/team-report`), từ chiều Thứ Sáu đến hết Chủ Nhật.
- **Ai tổng hợp:** Sơn chạy `/team-week-close xuat` (gom 5 báo cáo thành gói gửi Claude web) và `/team-week-close nhap` (đưa kết quả Claude web đã được họp duyệt về repo).
- **Claude web:** tài khoản chung của nhóm, đóng vai người tổng hợp: kiểm tra chéo, gom câu hỏi trùng nhau, tối ưu kế hoạch, tập hợp ý kiến, viết lại 5 prompt.
- **Ai đọc:** cả nhóm trong họp Thứ Hai; bản `.docx` dùng để nộp và in.
- Tuần 1 bắt đầu Thứ Hai 05/10/2026; tuần N = tuần chứa ngày báo cáo.

## Quy trình

```
Thứ Sáu–CN   mỗi người (Claude Code riêng): /team-report   → tuan-NN/<ten>.md + .docx, PR vào develop
CN tối / T2  Sơn: /team-week-close xuat                     → tuan-NN/TONG-HOP.md + GOI-CLAUDE-WEB.md
             Sơn dán GOI-CLAUDE-WEB.md vào Claude web        → Claude web trả lời theo khuôn A–F
Họp Thứ Hai  cả nhóm duyệt câu trả lời của Claude web (sửa, bác chỗ nào thì ghi lại)
Sau họp      Sơn: /team-week-close nhap                     → OPEN_QUESTIONS, STATUS, CHOT-TUAN-NN.md (+ .docx),
                                                               prompt-tuan-(NN+1)/<ten>.md
             mỗi người: git pull, dán prompt của mình vào Claude Code; gửi CHOT-TUAN-NN.md lên nhóm chat
```

Claude web không đọc được repo, nên mọi thứ gửi lên phải tự đủ nghĩa (gói xuất), và mọi kết quả phải quay về repo (bước nhập) thì Claude Code của từng người mới biết.

## Cấu trúc thư mục

```
docs/reports/
├── README.md                 file này
├── _MAU-ca-nhan.md           mẫu báo cáo cá nhân
├── _MAU-tong-hop.md          mẫu báo cáo tổng hợp
├── _MAU-prompt.md            mẫu prompt tuần sau
├── _MAU-gui-claude-web.md    hướng dẫn + khuôn trả lời cho Claude web
├── _MAU-chot.md              mẫu bản chốt tuần (gửi nhóm, làm bối cảnh tuần sau)
└── tuan-01/
    ├── tson.md, tson.docx    (5 người)
    ├── TONG-HOP.md, TONG-HOP.docx
    ├── GOI-CLAUDE-WEB.md       gói dán lên Claude web (bước xuat)
    ├── CHOT-TUAN-01.md, .docx  bản chốt sau họp (bước nhap)
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

Muốn đổi tên viết tắt: sửa bảng này qua PR, báo Sơn.

## Xuất Word

Lần đầu trên mỗi máy: `cd tools/report-docx`, `npm install`, rồi `cd ../..` về gốc repo.
Xuất một file: `node tools/report-docx/md2docx.mjs docs/reports/tuan-01/tson.md`.

## Commit

Báo cáo cá nhân: commit vào nhánh của tuần (ví dụ `tsonw1-report`), message `docs(report): tuần 1 báo cáo của tson`, PR vào `develop`. Sơn gộp các PR báo cáo trước khi chạy `/team-week-close xuat`.
