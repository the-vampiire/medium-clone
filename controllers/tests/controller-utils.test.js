const {
  extractFieldErrors,
  newResourceResponse,
} = require('../controller-utils');


describe('Shared Controller Utilities', () => {
  describe('extractFieldErrors(): extracts Mongo ValidationError messages for field(s)', () => {
    const validationError = {
      errors: { 
        username: {
          message: 'Invalid username. Usernames may only contain alpha-numeric characters, "_", and "-".',
          name: 'ValidatorError',
          properties: [Object],
          kind: 'user defined',
          path: 'username',
          value: 'b@dname',
          reason: undefined,
        },
        password: { 
          message: 'password must be at least 6 characters long',
          name: 'ValidatorError',
          properties: [Object],
          kind: 'minlength',
          path: 'password',
          value: 'test',
          reason: undefined,
        },
      }
    };

    test('errors defined: returns a fieldErrors object { fieldName: errorMessage, ...}', () => {
      const fieldErrors = extractFieldErrors(validationError.errors);
      expect(fieldErrors).toEqual({
        username: validationError.errors.username.message,
        password: validationError.errors.password.message,
      });
    });

    test('errors undefined or null: returns an empty object {}', () => {
      const fieldErrors = extractFieldErrors();
      expect(fieldErrors).toEqual({});
    });
  });
});