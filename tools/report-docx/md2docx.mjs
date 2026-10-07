#!/usr/bin/env node
/**
 * Đổi một file Markdown đơn giản sang Word (.docx), khổ A4, font Arial.
 * Dùng cho báo cáo tuần: node tools/report-docx/md2docx.mjs <vao.md> [ra.docx]
 * Không ghi tham số ra thì tạo file .docx cùng tên, cùng thư mục.
 *
 * Hỗ trợ: # tiêu đề tài liệu, ## mục, ### mục con, đoạn văn, danh sách "- " (lồng bằng 2 dấu cách),
 * danh sách "1. ", ô đánh dấu "- [ ]" / "- [x]", bảng "| a | b |", trích dẫn "> ", khối ``` ```, đường kẻ "---",
 * chữ đậm **...** và mã `...` trong dòng.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, LevelFormat, Packer, PageNumber, Paragraph,
  ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';

const [, , input, outputArg] = process.argv;
if (!input) {
  console.error('Cách dùng: node tools/report-docx/md2docx.mjs <vao.md> [ra.docx]');
  process.exit(1);
}
const output = outputArg ?? input.replace(/\.md$/i, '') + '.docx';

const FONT = 'Arial';
const ACCENT = '0F766E';
const PAGE_W = 9638; // A4 trừ lề 2 cm
const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

/** **đậm** và `mã` trong một dòng. */
const inline = (text, base = {}) =>
  text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    .filter(Boolean)
    .map((s) => {
      if (s.startsWith('**')) return new TextRun({ ...base, text: s.slice(2, -2), bold: true });
      if (s.startsWith('`')) return new TextRun({ ...base, text: s.slice(1, -1), font: 'Consolas', color: '374151' });
      return new TextRun({ ...base, text: s });
    });

const splitRow = (line) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));

function makeTable(rows) {
  const [header, , ...body] = rows; // bỏ dòng | --- |
  const n = header.length;
  const w = Math.floor(PAGE_W / n);
  const widths = Array.from({ length: n }, (_, i) => (i === n - 1 ? PAGE_W - w * (n - 1) : w));
  const cell = (text, i, isHeader) =>
    new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: isHeader ? ACCENT : 'FFFFFF' },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: (text || ' ')
        .split(/<br\s*\/?>/i)
        .map((t) => new Paragraph({ children: inline(t, isHeader ? { bold: true, color: 'FFFFFF' } : {}) })),
    });
  return new Table({
    width: { size: PAGE_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: header.map((t, i) => cell(t, i, true)) }),
      ...body.map((r) => new TableRow({ children: widths.map((_, i) => cell(r[i] ?? '', i, false)) })),
    ],
  });
}

const blocks = [];
const lines = fs.readFileSync(input, 'utf8').replace(/\r\n/g, '\n').split('\n');
let numberedList = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const t = line.trim();
  if (!t) continue;

  if (t.startsWith('```')) {
    const code = [];
    while (++i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i]);
    for (const c of code)
      blocks.push(new Paragraph({
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F3F4F6' },
        spacing: { after: 0 },
        children: [new TextRun({ text: c || ' ', font: 'Consolas', size: 18 })],
      }));
    blocks.push(new Paragraph({ children: [] }));
    continue;
  }
  if (t.startsWith('|')) {
    const rows = [];
    while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]));
    i--;
    blocks.push(makeTable(rows), new Paragraph({ children: [] }));
    continue;
  }
  if (/^-{3,}$/.test(t)) {
    blocks.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB', space: 4 } }, children: [] }));
    continue;
  }
  if (t.startsWith('# ')) {
    blocks.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: t.slice(2), bold: true, size: 40, color: ACCENT })] }));
    continue;
  }
  if (t.startsWith('## ')) { blocks.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: inline(t.slice(3)) })); continue; }
  if (t.startsWith('### ')) { blocks.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: inline(t.slice(4)) })); continue; }
  if (t.startsWith('> ')) {
    blocks.push(new Paragraph({
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FEF3C7' },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'D97706', space: 6 } },
      indent: { left: 120 },
      children: inline(t.slice(2)),
    }));
    continue;
  }
  const level = Math.min(Math.floor((line.length - line.trimStart().length) / 2), 2);
  const check = t.match(/^- \[( |x|X)\] (.*)$/);
  if (check) {
    blocks.push(new Paragraph({ indent: { left: 360 + level * 360, hanging: 360 }, spacing: { after: 60 },
      children: [new TextRun({ text: check[1] === ' ' ? '☐  ' : '☑  ' }), ...inline(check[2])] }));
    continue;
  }
  if (t.startsWith('- ') || t.startsWith('* ')) {
    blocks.push(new Paragraph({ numbering: { reference: 'bullet', level }, spacing: { after: 60 }, children: inline(t.slice(2)) }));
    continue;
  }
  const num = t.match(/^\d+\. (.*)$/);
  if (num) {
    // Mỗi danh sách số liền nhau dùng một instance riêng để đánh số lại từ 1.
    const prev = lines[i - 1]?.trim() ?? '';
    if (!/^\d+\. /.test(prev) && !/^\s{2,}/.test(lines[i - 1] ?? '')) numberedList++;
    blocks.push(new Paragraph({ numbering: { reference: 'number', level: 0, instance: numberedList }, spacing: { after: 60 }, children: inline(num[1]) }));
    continue;
  }
  blocks.push(new Paragraph({ spacing: { after: 120 }, children: inline(t) }));
}

const listLevel = (format, text, level) => ({
  level, format, text, alignment: AlignmentType.LEFT,
  style: { paragraph: { indent: { left: 720 + level * 360, hanging: 360 } } },
});

const doc = new Document({
  creator: 'Nhóm gym-management-system',
  title: path.basename(input, '.md'),
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 28, bold: true, color: ACCENT }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 24, bold: true, color: '111827' }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullet', levels: [0, 1, 2].map((l) => listLevel(LevelFormat.BULLET, ['•', '◦', '▪'][l], l)) },
      { reference: 'number', levels: [listLevel(LevelFormat.DECIMAL, '%1.', 0)] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
        new TextRun({ text: `${path.basename(input, '.md')} · trang `, size: 18, color: '9CA3AF' }),
        new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '9CA3AF' }),
      ] })] }),
    },
    children: blocks,
  }],
});

fs.writeFileSync(output, await Packer.toBuffer(doc));
console.log(`Đã tạo ${output}`);
