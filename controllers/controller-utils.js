/**
 * Creates a pagination query string to be appended to an endpoint
 * @param {QueryStringOptions} options
 * @returns {string} a pagination query string
 * 
 * @type QueryStringOptions object
 * @property {number} limit [10] pagination limit
 * @property {number} currentPage [0] pagination page
 */
function paginationQueryString (options) {
  const { limit = 10, currentPage = 0 } = options;
  return `limit=${limit}&currentPage=${currentPage}`;
};

/**
 * Creates an endpoint: domain/basePath[/path][?paginationQueryString]
 * @param {EndpointOptions} options
 * @returns {string} a constructed endpoint
 * 
 * @type EndpointOptions object
 * @property {string} basePath the base path of the endpoint
 * @property {string} path the sub-path(s) of the endpoint
 * @property {boolean} paginated [false] add a pagination query string to the endpoint
 * @property {number} limit [if present adds pagination] the pagination LIMIT
 * @property {number} currentPage [if present adds pagination] the pagination CURRENT_PAGE
 */
function buildEndpoint (options) {
  const {
    path,
    limit,
    basePath,
    currentPage,
    paginated = false,
  } = options;

  let endpoint =  `${process.env.DOMAIN}/${basePath}`;
  if (path) endpoint += `/${path}`;

  const shouldPaginate = paginated || (limit !== undefined) || (currentPage !== undefined);
  if (shouldPaginate) endpoint += `?${paginationQueryString({ limit, currentPage })}`;
  
  return endpoint;
};

/**
 * Injects a pagination property into a response output
 * - pagination shape: { limit, currentPage, hasNext, nextPageURL }
 * - uses totalDocuments count to determine if there is an available nextPage
 * - if there is not a nextPage marks hasNext: false and nextPageURL: null
 * - if there is a nextPage marks hasNext: true and nextPageURL has its endpoint built
 * @param {PaginationOptions} options
 * @returns {object} { ...output, pagination }
 * 
 * @type PaginationOptions
 * @property {string} basePath base path of pagination
 * @property {string} path sub-path(s) of pagination
 * @property {object} output original response output
 * @property {number} totalDocuments total number of documents associated with resource
 * @property {number} limit [10] pagination LIMIT
 * @property {number} currentPage [0] pagination CURRENT_PAGE
 */
const injectPagination = (options) => {
  const {
    path,
    basePath,
    limit = 10,
    output = {},
    totalDocuments,
    currentPage = 0,
  } = options;
  
  const paginatedOutput = { ...output };
  paginatedOutput.pagination = { limit, currentPage, hasNext: false, nextPageURL: null };

  const nextPage = currentPage + 1;
  const hasNext = totalDocuments > nextPage * limit;

  if (hasNext) {
    paginatedOutput.pagination.hasNext = hasNext;
    paginatedOutput.pagination.nextPageURL = buildEndpoint({
      path,
      limit,
      basePath,
      currentPage: nextPage,
    });
  }

  return paginatedOutput;
};

/**
 * Extracts Mongo field errors from a Validation Error
 * @param {object} errors the errors object on the ValidationError instanc
 * @returns {object} a field errors object containing { field: errorMessage, ... }
 */
const extractFieldErrors = (errors) => Object
  .keys(errors)
  .reduce((fieldErrors, field) => {
    fieldErrors[field] = errors[field].message;
    return fieldErrors
  }, {});

module.exports = {
  buildEndpoint,
  injectPagination,
  paginationQueryString,
  extractFieldErrors,
};
