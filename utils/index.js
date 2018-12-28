const getDatabaseURI = (env) => {
  switch(env) {
    case 'test':
      return process.env.TEST_DB_URI;
    case 'production':
      return process.env.DB_URI;
    default:
      return process.env.DEV_DB_URI;
  }
}

module.exports = {
  getDatabaseURI,
};
