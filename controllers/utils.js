const buildEndpoint = ({
  basePath,
  path,
  paginated = false,
}) => `${process.env.domain}/${basePath}/${path || ''}${paginated ? `?${paginationDefault()}` : ''}`;

const paginationDefault = () => 'limit=10&page=0';

module.exports = {
  buildEndpoint,
  paginationDefault,
};
