const {
  validateUsername,
  validatePassword,
} = require('../validators');

describe('User Model validators', () => {
  describe('username validator', () => {
    test('rejects usernames less than 3 characters in length', () => {
      const short = 'us';
      expect(validateUsername(short)).toBe(false);
    });

    test('rejects usernames greater than 20 characters in length', () => {
      const long = Array(21).fill('a').join('');
      expect(validateUsername(long)).toBe(false);
    });
    
    test(
      'rejects usernames that begin with "_"',
      () => expect(validateUsername('_aUsername')).toBe(false),
    );
    
    test(
      'rejects usernames that begin with "-"',
      () => expect(validateUsername('-aUsername')).toBe(false),
    );

    test('rejects usernames with characters that are not alpha, numeric, "-", or "_"', () => {
      const nonAlpha = ['@signsAnd-stuff', 'hash#tags','dollar$igns', 'per%cents', 'star**s'];
      nonAlpha.forEach(invalidUsername => expect(validateUsername(invalidUsername)).toBe(false));
    });
  });
});