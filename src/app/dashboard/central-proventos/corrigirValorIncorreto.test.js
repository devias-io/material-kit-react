const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

function loadCorrigirValorIncorreto() {
  const filePath = path.resolve(__dirname, 'corrigirValorIncorreto.ts');
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

const { corrigirValorIncorreto } = loadCorrigirValorIncorreto();

describe('corrigirValorIncorreto', () => {
  it('recupera escala dinâmica para valores com casas embutidas', () => {
    const bruto = '182.073.774,00';
    const valorProcessado = parseFloat(bruto.replace(/\./g, '').replace(',', '.'));
    const resultado = corrigirValorIncorreto('TESTE3', valorProcessado, bruto);

    expect(resultado).toBeCloseTo(1.82073774);
  });
});
