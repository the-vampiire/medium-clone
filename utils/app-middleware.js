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
    req.query.limit = isNaN(Number(limit)) ? 10 : limit;
    req.query.currentPage = isNaN(Number(currentPage)) ? 0 : currentPage;
  }

  next();
};

// export as Array to spread, order matters!
module.exports = {
  addRequestContext,
  sanitizePaginationQuery,

  appMiddleware: [
    bodyParser.json(),
    bodyParser.urlencoded({ extended: false }),
    sanitizePaginationQuery,
    addRequestContext({ models }),
  ],
};
