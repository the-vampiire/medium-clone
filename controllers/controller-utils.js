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

module.exports = {
  buildEndpoint,
  paginationQueryString,
};
