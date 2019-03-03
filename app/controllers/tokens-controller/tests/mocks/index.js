const authedUserMock = { id: 'anID' };

const mockENV = {
  DOMAIN: 'api domain',
  ENCRYPTION_SECRET: 'encryption bits',
  ACCESS_TOKEN_SECRET: 'access bits',
  ACCESS_TOKEN_LIFESPAN: '1800000', // 30m
  REFRESH_TOKEN_SECRET: 'refresh bits',
  REFRESH_TOKEN_LIFESPAN: '604800000', // 7d
};

module.exports = {
  mockENV,
  authedUserMock,
};
