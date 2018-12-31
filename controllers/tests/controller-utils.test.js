require('dotenv').config();
const { buildEndpoint, paginationQueryString } = require('../controller-utils');
const { DOMAIN } = process.env;

describe('Shared Controller Utilities', () => {
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
      const output = buildEndpoint({ basePath: 'test' });
      expect(output).toEqual(`${DOMAIN}/test`);
    });
    
    test('basePath + path: process.env.DOMAIN/basePath/path', () => {
      const output = buildEndpoint({ basePath: 'test', path: 'path/test' });
      expect(output).toEqual(`${DOMAIN}/test/path/test`);
    });
    
    test('basePath + path + paginated: process.env.DOMAIN/basePath/path?limit=10&currentPage=0', () => {
      const output = buildEndpoint({ basePath: 'test', path: 'path/test', paginated: true });
      expect(output).toEqual(`${DOMAIN}/test/path/test?${paginationQueryString({})}`);
    });
    
    test('basePath + path + limit: process.env.DOMAIN/basePath/path?limit=LIMIT&currentPage=0', () => {
      const output = buildEndpoint({ basePath: 'test', path: 'path/test', limit: 7 });
      expect(output).toEqual(`${DOMAIN}/test/path/test?${paginationQueryString({ limit: 7 })}`);
    });
    
    test('basePath + path + currentPage: process.env.DOMAIN/basePath/path?limit=10&currentPage=CURRENT_PAGE', () => {
      const output = buildEndpoint({ basePath: 'test', path: 'path/test', currentPage: 7 });
      expect(output).toEqual(`${DOMAIN}/test/path/test?${paginationQueryString({ currentPage: 7 })}`);
    });
  });
});