const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const jwt = require('jsonwebtoken');

function loadVerifyToken() {
  const tsFile = fs.readFileSync(path.join(__dirname, 'auth.ts'), 'utf8');
  const transpiled = ts.transpileModule(tsFile, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
  const module = { exports: {} };
  const fn = new Function('require', 'module', 'exports', transpiled.outputText);
  fn(require, module, module.exports);
  return module.exports.verifyToken;
}

const verifyToken = loadVerifyToken();

describe('verifyToken', () => {
  const secret = 'test-secret';

  beforeAll(() => {
    process.env.JWT_SECRET = secret;
  });

  it('throws error when token is missing', () => {
    expect(() => verifyToken()).toThrow('Token not provided');
  });

  it('throws error for invalid token', () => {
    expect(() => verifyToken('invalid')).toThrow('Invalid token');
  });

  it('throws error for expired token', () => {
    const payload = { email: 'a', plan: 'ADMIN', userId: '1', exp: Math.floor(Date.now() / 1000) - 10 };
    const token = jwt.sign(payload, secret);
    expect(() => verifyToken(token)).toThrow('Token expired');
  });

  it('returns payload for valid token', () => {
    const payload = { email: 'admin@example.com', plan: 'ADMIN', userId: '1' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject(payload);
  });
});
