import { isEmptyPatch } from './patch';

class SampleDto {
  fullName?: string;
  email?: string | null;
}

describe('isEmptyPatch', () => {
  it('instance DTO chỉ có field undefined là rỗng', () => {
    const dto = Object.assign(new SampleDto(), { fullName: undefined, email: undefined });
    expect(Object.keys(dto).length).toBeGreaterThan(0);
    expect(isEmptyPatch(dto)).toBe(true);
  });

  it('gửi null để xóa giá trị không phải rỗng', () => {
    expect(isEmptyPatch({ email: null })).toBe(false);
  });

  it('có ít nhất một field có giá trị thì không rỗng', () => {
    expect(isEmptyPatch({ fullName: 'An', email: undefined })).toBe(false);
  });
});
