const models = require('./models');
const bodyParser = require('body-parser');

const addRequestContext = (context) => (req, _, next) => {
  const { models } = context;
  req.models = models;
  
  next();
};

// export as Array to spread, order matters!
module.exports = [
  bodyParser.json(),
  bodyParser.urlencoded({ extended: false }),
  addRequestContext(models),
];
