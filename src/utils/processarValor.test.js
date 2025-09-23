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
  it('interprets multiple commas as thousand separators', () => {
    expect(processarValor('3,276,340')).toBe(3276340);
  });

  it('interprets single comma followed by three digits as thousand separator', () => {
    expect(processarValor('1,234')).toBe(1234);
  });

  it('keeps last comma as decimal separator for fractional values', () => {
    expect(processarValor('0,0845')).toBeCloseTo(0.0845);
  });
});
