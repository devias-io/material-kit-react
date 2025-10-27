import { aplicarViesOverride, isViesManual, normalizeViesOverride } from '../vies';

describe('utils/vies', () => {
  describe('normalizeViesOverride', () => {
    it('mantém o valor MANTER', () => {
      expect(normalizeViesOverride('MANTER')).toBe('MANTER');
    });

    it('retorna AUTO para valores não reconhecidos', () => {
      expect(normalizeViesOverride(undefined)).toBe('AUTO');
      expect(normalizeViesOverride(null)).toBe('AUTO');
      expect(normalizeViesOverride('INVALIDO' as any)).toBe('AUTO');
    });
  });

  describe('aplicarViesOverride', () => {
    it('retorna o viés automático quando override é AUTO', () => {
      expect(aplicarViesOverride('AUTO', 'Compra')).toBe('Compra');
    });

    it('prioriza o label manual quando override é MANTER', () => {
      expect(aplicarViesOverride('MANTER', 'Compra')).toBe('Manter');
      expect(aplicarViesOverride('MANTER', 'Compra', 'Manter viés')).toBe('Manter viés');
    });
  });

  describe('isViesManual', () => {
    it('identifica overrides manuais', () => {
      expect(isViesManual('MANTER')).toBe(true);
      expect(isViesManual('AUTO')).toBe(false);
      expect(isViesManual(undefined)).toBe(false);
    });
  });
});
