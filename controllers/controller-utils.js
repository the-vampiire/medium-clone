const buildEndpoint = ({
  basePath,
  path,
  paginated = false,
  limit,
  currentPage,
}) => {
  let endpoint =  `${process.env.DOMAIN}/${basePath}`;
  if (path) endpoint += `/${path}`;

  const shouldPaginate = paginated || (limit !== undefined) || (currentPage !== undefined);
  if (shouldPaginate) endpoint += `?${paginationQueryString({ limit, currentPage })}`;
  
  return endpoint;
};

const paginationQueryString = ({ limit = 10, currentPage = 0 }) => `limit=${limit}&currentPage=${currentPage}`;

const buildPagination = ({
  path,
  basePath,
  output= {},
  limit = 10,
  currentPage = 0,
  totalDocuments,
}) => {
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

module.exports = {
  buildEndpoint,
  buildPagination,
  paginationQueryString,
};
