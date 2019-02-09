const { addRequestContext, sanitizePaginationQuery } = require('../app-middleware');

const nextMock = jest.fn();

describe('App custom middleware', () => {
  afterEach(() => jest.clearAllMocks());

  test('addRequestContext(): copies the context object into req.context and calls next()', () => {
    const context = { models: {}, someOther: 'value' };
    const reqMock = { stuff: 'value' };
    
    // higher order func, call returned middleware for test
    addRequestContext(context)(reqMock, null, nextMock);
    expect(nextMock).toHaveBeenCalled();
    expect(reqMock.context).toEqual(context);
  });

  describe('sanitizePaginationQuery(): validates and corrects erroneous pagination query params', () => {
    const defaultQuery = { limit: 10, currentPage: 0 };

    test('valid params: passes req.query through and calls next()', () => {
      const reqMock = { query: defaultQuery };
      
      sanitizePaginationQuery(reqMock, null, nextMock);
      expect(nextMock).toHaveBeenCalled();
      expect(reqMock.query).toEqual(reqMock.query);
    });

    test('non-numeric limit: sets default req.query limit value and calls next()', () => {
      const reqMock = { query: { limit: 'bad', currentPage: 0 } };
      
      sanitizePaginationQuery(reqMock, null, nextMock);
      expect(nextMock).toHaveBeenCalled();
      expect(reqMock.query).toEqual(defaultQuery);
    });

    test('non-numeric currentPage: sets default req.query currentPage value and calls next()', () => {
      const reqMock = { query: { limit: 10, currentPage: 'bad' } };
      
      sanitizePaginationQuery(reqMock, null, nextMock);
      expect(nextMock).toHaveBeenCalled();
      expect(reqMock.query).toEqual(defaultQuery);
    });

    test('mixed values: no effect on valid param, sets default for invalid, and calls next()', () => {
      const reqMock = { query: { limit: 15, currentPage: 'bad' } };
      
      sanitizePaginationQuery(reqMock, null, nextMock);
      expect(nextMock).toHaveBeenCalled();
      expect(reqMock.query.limit).toBe(reqMock.query.limit);
      expect(reqMock.query.currentPage).toBe(defaultQuery.currentPage);
    });

    test('limit and currentPage undefined: no effect on req.query and calls next()', () => {
      const reqMock = { query: { differentParam: 'value' } };
      
      sanitizePaginationQuery(reqMock, null, nextMock);
      expect(nextMock).toHaveBeenCalled();
      expect(reqMock.query).toEqual(reqMock.query);
    });
  });
});