const {
  extractFieldErrors,
  newResourceResponse,
  failedAuthResponse,
} = require('../controller-utils');

const resMock = {
  set: jest.fn(),
  json: jest.fn(),
  status: jest.fn(() => resMock),
}

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

  describe('newResourceResponse(): builds a 201 JSON response for POST creation handlers', () => {
    const resourceURLName = 'storyURL';
    const resourceURLValue = 'im a url';
    const responseData = { links: {} };
    responseData.links[resourceURLName] = resourceURLValue;

    newResourceResponse(responseData, resourceURLName, resMock);

    test('sets the Location header using the responseData.links.urlName value', () => {
      expect(resMock.set).toHaveBeenCalledWith({ Location: responseData.links[resourceURLName] });
    });

    test('returns a 201 status JSON response using responseData', () => {
      expect(resMock.status).toHaveBeenCalledWith(201);
      expect(resMock.json).toHaveBeenCalledWith(responseData);
    });
  });
});