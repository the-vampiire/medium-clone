const buildEndpoint = ({
  basePath,
  path,
  paginated = false,
  limit,
  currentPage,
}) => {
  let endpoint =  `${process.env.DOMAIN}/${basePath}`;
  if (path) endpoint += `/${path}`;
  if (paginated || limit) endpoint += `?${paginationQueryString({ limit, currentPage })}`;
  return endpoint;
};

const paginationQueryString = ({ limit = 10, currentPage = 0 }) => `limit=${limit}&currentPage=${currentPage}`;

module.exports = {
  buildEndpoint,
  paginationQueryString,
};
