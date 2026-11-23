import { InputNumber, type InputNumberProps } from 'antd';

/** Ô nhập tiền VND: số nguyên, phân cách hàng nghìn bằng dấu chấm (1.200.000 ₫). */
export const MoneyInput = (props: InputNumberProps<number>) => (
  <InputNumber<number>
    min={0}
    step={1000}
    precision={0}
    style={{ width: '100%' }}
    formatter={(v) => (v === undefined || v === null ? '' : `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
    parser={(v) => Number((v ?? '').replace(/\D/g, ''))}
    addonAfter="₫"
    {...props}
  />
);
