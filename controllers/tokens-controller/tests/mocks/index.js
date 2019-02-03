const secret = 'super secret';
const stringOptions = 'algorithm: HS256, expiresIn: 1h, issuer: Medium REST Clone';

module.exports = {
  setupEnv: () => {
    process.env.JWT_SECRET = secret;
    process.env.JWT_OPTIONS = stringOptions;
    process.env.ENCRYPTION_SECRET = 'secret';
  },
  teardownEnv: () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_OPTIONS;
    delete process.env.ENCRYPTION_SECRET;
  },
  secret,
  stringOptions,
  authedUserMock: { id: 'aUserID'},
};
