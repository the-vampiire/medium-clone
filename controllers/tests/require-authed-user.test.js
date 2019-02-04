const {
  extractBearerToken,
  notAuthedResponse,
  getAuthedUser,
  requireAuthedUser,
} = require('../require-authed-user');

describe('Required Authed User utilities', () => {
  describe('extractBearerToken(): extracts the Bearer JWT from Authorization header', () => {
    test('given auth header: returns JWT', () => {
      const token = 'iAmATokenISwear';
      const headers = { authorization: `Bearer ${token}` };
      expect(extractBearerToken(headers)).toBe(token);
    });

    test('empty auth header: returns null', () => {
      const headers = { authorization: '' };
      expect(extractBearerToken(headers)).toBeNull();
    });

    test('auth header without "Bearer <Token>" shape: returns null', () => {
      const headers = { authorization: 'Bearer' };
      expect(extractBearerToken(headers)).toBeNull();
    });
  });
}); 