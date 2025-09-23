const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

function loadProcessarValor() {
  const filePath = path.resolve(__dirname, 'processarValor.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2018
    }
  });

  const wrapper = `(function (exports, require, module, __filename, __dirname) { ${outputText}\n})`;
  const compiled = vm.runInThisContext(wrapper, { filename: filePath });
  const module = { exports: {} };
  compiled(module.exports, require, module, filePath, path.dirname(filePath));
  return module.exports;
}

const { processarValor } = loadProcessarValor();

describe('processarValor', () => {
  it('interprets canonical Brazilian numbers correctly', () => {
    expect(processarValor('1.234.567,89')).toBeCloseTo(1234567.89);
  });

  it('interprets canonical American numbers correctly', () => {
    expect(processarValor('1,234,567.89')).toBeCloseTo(1234567.89);
  });

  it('preserves high precision values with ambiguous separators', () => {
    const original = 3.27634009;
    expect(processarValor('3.276340,09')).toBeCloseTo(original);
  });

  it('handles values with only a decimal comma', () => {
    expect(processarValor('1234,56')).toBeCloseTo(1234.56);
  });
});
