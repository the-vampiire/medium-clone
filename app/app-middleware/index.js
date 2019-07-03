const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const { models } = require("../../db");
const env = require("dotenv").config().parsed || process.env;

const addRequestContext = context => (req, _, next) => {
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
  const {
    query: { limit, currentPage },
  } = req;

  if (limit !== undefined || currentPage !== undefined) {
    const limitNumber = Number(limit);
    const currentPageNumber = Number(currentPage);

    // use defaults and minimums to prevent pagination params from tricksy hobbitses
    req.query.limit = isNaN(limitNumber) ? 10 : Math.max(limitNumber, 1);
    req.query.currentPage = isNaN(currentPageNumber)
      ? 0
      : Math.max(currentPageNumber, 0);
  }

  next();
};

/**
 * Catches malformed JSON body errors
 * - success: calls next()
 * @returns 400 JSON response { error: malformed data }
 */
const handleMalformedJSON = (error, req, res, next) => {
  if (error instanceof SyntaxError) {
    return res.status(400).json({ error: "malformed data" });
  }

  next();
};

/**
 * Verifies request content type
 * - success: calls next()
 * @returns content-type header + not JSON: 415 JSON response { error }
 */
const verifyContentType = (req, res, next) => {
  const isJSON = req.is("json"); // null if content-type empty

  if (isJSON === false) {
    // false if content-type && not application/json
    return res.status(415).json({
      error: "invalid content-type. only application/json is accepted",
    });
  }

  next();
};

/**
 * CORS configuration
 */
const corsOptions = {
  origin: [
    // TODO: hosted client domain
    "http://localhost:3000", // default local client domain
  ],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = {
  // custom MW exports for testing
  addRequestContext,
  sanitizePaginationQuery,
  handleMalformedJSON,
  verifyContentType,

  // export as Array to spread. order matters, dont touch!
  appMiddleware: [
    cors(corsOptions),
    cookieParser(env.COOKIE_SECRET),
    verifyContentType,
    bodyParser.json(),
    bodyParser.urlencoded({ extended: false }),
    handleMalformedJSON,
    sanitizePaginationQuery,
    addRequestContext({ env, models }),
  ],
};
