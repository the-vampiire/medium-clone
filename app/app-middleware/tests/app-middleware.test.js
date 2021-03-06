const {
  addRequestContext,
  sanitizePaginationQuery,
  handleMalformedJSON,
  verifyContentType,
} = require('../index');

const nextMock = jest.fn();
const resMock = { status: jest.fn(() => resMock), json: jest.fn() };

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

  describe('handleMalformedJSON(): catches malformed JSON errors from body parser', () => {
    beforeAll(() => jest.clearAllMocks());

    test('SyntaxError caught: returns 400 JSON response { error: "malformed data" }', () => {
      const error = new SyntaxError();
      
      handleMalformedJSON(error, null, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'malformed data' });
    });
    
    test('no Syntax error: calls next()', () => {
      handleMalformedJSON(null, null, null, nextMock);
      expect(nextMock).toHaveBeenCalled();
    });
  });

  describe('verifyContentType(): verifies content-type of incoming requests', () => {
    const reqMock = { is: jest.fn(), headers: {} };

    test('req.body defined and content-type is application/json: calls next()', () => {
      reqMock.is.mockImplementationOnce(() => true);

      verifyContentType(reqMock, resMock, nextMock);
      expect(nextMock).toBeCalled();
    });

    test('req.body not defined: calls next()', () => {
      reqMock.is.mockImplementationOnce(() => false);

      verifyContentType(reqMock, resMock, nextMock);
      expect(nextMock).toBeCalled();
    });

    test('req.body defined and content-type is not JSON: 415 JSON response { error }', () => {
      reqMock.is.mockImplementationOnce(() => false);
      const reqWithBody = Object.assign({ body: {} }, reqMock);

      verifyContentType(reqWithBody, resMock, nextMock);
      expect(resMock.status).toBeCalledWith(415);
      expect(resMock.json).toBeCalledWith({
        error: 'invalid content-type. only application/json is accepted',
      });
    });
  });
});