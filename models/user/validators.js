const usernameValidator = {
  validator: (value) => {
    // may not begin with '_' or '-'
    // may include any alpha-numeric, '-', '_'
    // look at this face: [^_-] lol
    return /^[^_-]([A-Za-z0-9_]){3,19}$/.test(value);
  },

  message: 'Invalid username. Usernames may only contain alpha-numeric characters.\
    "-" and "_" characters are only allowed if not used as the first character',
};

module.exports = {
  usernameValidator,
};