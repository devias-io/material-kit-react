const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadProcessarValor() {
  const tsFile = fs.readFileSync(path.join(__dirname, 'processarValor.ts'), 'utf8');
  const transpiled = ts.transpileModule(tsFile, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  });
  const module = { exports: {} };
  const fn = new Function('require', 'module', 'exports', transpiled.outputText);
  fn(require, module, module.exports);
  return module.exports.processarValor;
}

const processarValor = loadProcessarValor();

describe('processarValor', () => {
  it('interprets multiple comma-separated thousands groups as an integer', () => {
    expect(processarValor('3,276,340')).toBe(3276340);
  });

  it('treats a single comma as a decimal separator', () => {
    expect(processarValor('1,234')).toBeCloseTo(1.234);
  });

  it('preserves high precision decimal values with a single comma', () => {
    expect(processarValor('1,37286685')).toBeCloseTo(1.37286685);
  });

  it('converts fractional values below one', () => {
    expect(processarValor('0,125')).toBeCloseTo(0.125);
  });

  it('parses Brazilian-formatted values with thousands points and decimal comma', () => {
    expect(processarValor('1.234,56')).toBeCloseTo(1234.56);
  });

  it('normalizes decimal representations with trailing zeros', () => {
    expect(processarValor('1,000')).toBe(1);
  });
});
