const models = require('../models');
const bodyParser = require('body-parser');

const addRequestContext = (context) => (req, _, next) => {
  req.context = context;

  next();
};

/**
 * Validates the pagination query params: limit, currentPage
 * Sets query.limit and query.currentPage:
 * - original query param value if the value is numeric
 * - default values { limit: 10, currentPage: 0 } if the value is non-numeric (erroneous)
 * @param {Request} req Request object 
 * @param {} _ 
 * @param {Function} next next step function
 */
const sanitizePaginationQuery = (req, _, next) => {
  const { query: { limit, currentPage } } = req;

  if (limit !== undefined || currentPage !== undefined) {
    const limitNumber = Number(limit);
    const currentPageNumber = Number(currentPage);

    // use defaults and minimums to prevent pagination params from tricksy hobbitses
    req.query.limit = isNaN(limitNumber) ? 10 : Math.max(limitNumber, 1);
    req.query.currentPage = isNaN(currentPageNumber) ? 0 : Math.max(currentPageNumber, 0);
  }

  next();
};

/**
 * Catches global errors
 * @param {*} error 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const handleMalformedJSON = (error, req, res, next) => {
  if (error instanceof SyntaxError) {
    return res.status(400).json({ error: 'malformed data' });
  }

  next();
};

// export as Array to spread, order matters!
module.exports = {
  addRequestContext,
  sanitizePaginationQuery,
  handleMalformedJSON,

  appMiddleware: [
    bodyParser.json(),
    bodyParser.urlencoded({ extended: false }),
    handleMalformedJSON,
    sanitizePaginationQuery,
    addRequestContext({ models }),
  ],
};
