const usernameValidator = {
  validator: (value) => {
    // may include any alpha-numeric, '-', '_'
    return /^([A-Za-z0-9_-]){3,20}$/.test(value);
  },

  message: 'Invalid username. Usernames may only contain alpha-numeric characters, "_", and "-".',
};

module.exports = {
  usernameValidator,
};