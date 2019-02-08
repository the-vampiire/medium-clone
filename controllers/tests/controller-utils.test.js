const {
  buildEndpoint,
  injectPagination,
  paginationQueryString,
  extractFieldErrors,
} = require('../controller-utils');

const DOMAIN = 'http://localhost:8008';
const basePath = 'test';
const path = 'path/test';


describe('Shared Controller Utilities', () => {
  beforeAll(() => { process.env.DOMAIN = DOMAIN; });
  afterAll(() => { delete process.env.DOMAIN });

  describe('paginationQueryString({ limit, currentPage })', () => {
    test('default: limit=10&currentPage=0', () => {
      const output = paginationQueryString({});
      expect(output).toEqual('limit=10&currentPage=0');
    });

    test('limit: limit=LIMIT&currentPage=0', () => {
      const output = paginationQueryString({ limit: 35 });
      expect(output).toEqual('limit=35&currentPage=0');
    });

    test('currentPage: limit=10&currentPage=CURRENT_PAGE', () => {
      const output = paginationQueryString({ currentPage: 3 });
      expect(output).toEqual('limit=10&currentPage=3');
    });

    test('limit + currentPage: limit=LIMIT&currentPage=CURRENT_PAGE', () => {
      const output = paginationQueryString({ limit: 25, currentPage: 12 });
      expect(output).toEqual('limit=25&currentPage=12');
    });
  });

  describe('buildEndpoint({ basePath, path, paginated, limit, currentPage })', () => {
    test('basePath only: process.env.DOMAIN/basePath', () => {
      const output = buildEndpoint({ basePath });
      expect(output).toEqual(`${DOMAIN}/test`);
    });
    
    test('basePath + path: process.env.DOMAIN/basePath/path', () => {
      const output = buildEndpoint({ basePath, path });
      expect(output).toEqual(`${DOMAIN}/test/path/test`);
    });
    
    test('basePath + path + paginated: process.env.DOMAIN/basePath/path?limit=10&currentPage=0', () => {
      const output = buildEndpoint({ basePath, path, paginated: true });
      expect(output).toEqual(`${DOMAIN}/test/path/test?${paginationQueryString({})}`);
    });
    
    test('basePath + path + limit: process.env.DOMAIN/basePath/path?limit=LIMIT&currentPage=0', () => {
      const output = buildEndpoint({ basePath, path, limit: 7 });
      expect(output).toEqual(`${DOMAIN}/test/path/test?${paginationQueryString({ limit: 7 })}`);
    });
    
    test('basePath + path + currentPage: process.env.DOMAIN/basePath/path?limit=10&currentPage=CURRENT_PAGE', () => {
      const output = buildEndpoint({ basePath, path, currentPage: 7 });
      expect(output).toEqual(`${DOMAIN}/test/path/test?${paginationQueryString({ currentPage: 7 })}`);
    });
  });

  describe('injectPagination({ path, basePath, output, limit, currentPage, totalDocuments })', () => {
    test(
      'returns the output object with "pagination" property and shape, \
fields: ["limit", "currentPage", "hasNext", "nextPageURL"]',
      () => {
        const output = injectPagination({ basePath, totalDocuments: 20 });
        expect(output.pagination).toBeDefined();
        ["limit", "currentPage", "hasNext", "nextPageURL"].forEach(
          field => expect(output.pagination[field]).toBeDefined(),
        );
      },
    );

    test(
      'basePath + totalDocuments [defaults, paginable total docs]: \
{ limit: 10, currentPage: 0, hasNext: true, nextPageURL: .../basePath/path?limit=10&currentPage=1 }',
      () => {
        const expected = {
          limit: 10,
          currentPage: 0,
          hasNext: true,
          nextPageURL: buildEndpoint({ basePath, currentPage: 1 }),
        };
        const output = injectPagination({ basePath, totalDocuments: 100 });
        expect(output.pagination).toEqual(expected);
      },
    );

    test(
      'basePath + totalDocuments [defaults, unpaginable total docs]: \
{ limit: 10, currentPage: 0, hasNext: false, nextPageURL: null }',
      () => {
        const expected = { limit: 10, currentPage: 0, hasNext: false, nextPageURL: null };
        const output = injectPagination({ basePath, totalDocuments: 2 });
        expect(output.pagination).toEqual(expected);
      },
    );
    
    describe('behavior when there are more stories to paginate', () => {
      test('all stories can be paginated over with "nextPageURL" until "pagination.hasNext" is null', async () => {
        const limit = 10;
        const expectedCycles = 10;
        const totalDocuments = limit * expectedCycles;

        let currentPage = 0;
        let paginationCycles = 0;
        while (currentPage !== null) {
          const paginatedResult = injectPagination({
            path,
            limit,
            basePath,
            currentPage,
            totalDocuments,
          });
    
          currentPage = paginatedResult.pagination.hasNext ? currentPage + 1 : null;
          ++paginationCycles;
        }

        expect(paginationCycles).toEqual(expectedCycles);
      });
    });
  });

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