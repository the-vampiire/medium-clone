const authenticationCookie = {};

const endpointMap = {
  user: {
    prefix: ':username',
    followers: [

    ],
    following: {

    },
    stories: [

    ],
    responses: {

    },
    claps: {

    },
  },

  story: {

  },

  topics: {
    root: {

    },

  },

  auth: {
    register: {
      method: 'POST',
      example: {
        username: 'the-vampiire',
        password: 'password',
        confirmPassword: 'password',
      },
    },
    login: {
      method: 'POST',
      authorization: null,
      example: {
        username: 'the-vampiire',
        password: 'password',
      },
    },
    logout: {
      method: 'GET',
      authentication: authenticationCookie,
    },
  }
};