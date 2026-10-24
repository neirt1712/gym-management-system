import type { Rule } from 'antd/es/form';

/** Khớp schema `Phone` trong docs/api/openapi.yaml. */
export const PHONE_PATTERN = /^0[0-9]{9}$/;

/** Khớp schema `Password` (8–72 ký tự). */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const PHONE_RULES: Rule[] = [
  { required: true, message: 'Nhập số điện thoại.' },
  { pattern: PHONE_PATTERN, message: 'Số điện thoại gồm 10 số, bắt đầu bằng 0.' },
];

export const PASSWORD_RULES: Rule[] = [
  { required: true, message: 'Nhập mật khẩu.' },
  { min: PASSWORD_MIN, message: `Mật khẩu từ ${PASSWORD_MIN} ký tự.` },
  { max: PASSWORD_MAX, message: `Mật khẩu tối đa ${PASSWORD_MAX} ký tự.` },
];
