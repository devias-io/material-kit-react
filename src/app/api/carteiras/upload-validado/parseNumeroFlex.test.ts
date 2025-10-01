import { parseNumeroFlex } from './parseNumeroFlex';

describe('parseNumeroFlex', () => {
  it('interprets thousand separators using dots', () => {
    expect(parseNumeroFlex('1.234')).toBe(1234);
  });

  it('interprets thousand separators with trailing zeros', () => {
    expect(parseNumeroFlex('2.000')).toBe(2000);
  });

  it('preserves decimal commas when both separators exist', () => {
    expect(parseNumeroFlex('1.234,56')).toBeCloseTo(1234.56);
  });

  it('keeps decimal dots when no thousands separators are present', () => {
    expect(parseNumeroFlex('1234.56')).toBeCloseTo(1234.56);
  });

  it('keeps decimal numbers below one untouched', () => {
    expect(parseNumeroFlex('0.123')).toBeCloseTo(0.123);
  });
});
