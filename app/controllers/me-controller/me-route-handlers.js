// TODO: docs and tests
const getMeHandler = (req, res) => {
  const { authedUser } = req.context;
  return res.json(authedUser.toResponseShape());
};

module.exports = {
  getMeHandler,
};
