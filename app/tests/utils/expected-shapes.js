module.exports = {
  userExpectedShape: {
    username: 'vamp',
    avatarURL: null,
    createdAt: '2019-02-14T03:48:48.608Z',
    updatedAt: '2019-02-14T03:48:48.608Z',
    slug: '@vamp',
    links: {
      userURL: 'http://localhost:8008/users/@vamp',
      followersURL: 'http://localhost:8008/users/@vamp/followers?limit=10&currentPage=0',
      followingURL: 'http://localhost:8008/users/@vamp/following?limit=10&currentPage=0',
      storiesURL: 'http://localhost:8008/users/@vamp/stories?limit=10&currentPage=0',
      responsesURL: 'http://localhost:8008/users/@vamp/responses?limit=10&currentPage=0',
      clappedStoriesURL: 'http://localhost:8008/users/@vamp/clapped?limit=10&currentPage=0',
    },
  },

  storyExpectedShape: {
    publishedAt: null,
    published: false,
    title: 'Devolved background archive',
    body: 'Et repudiandae autem unde aut sunt et. Adipisci deleniti ex occaecati velit. Ducimus ab distinctio magnam est suscipit. Rerum quia voluptatem necessitatibus aut.\n \rCupiditate dolore quo eligendi nihil culpa unde aliquid. Qui nihil mollitia recusandae nam consequatur culpa. Et aliquam sit voluptatum eum officia. Optio deserunt recusandae iure.',
    author: {
      username: 'vamp',
      avatarURL: null,
      createdAt: '2019-02-14T03:48:48.608Z',
      updatedAt: '2019-02-14T03:48:48.608Z',
      slug: '@vamp',
      links: {
        userURL: 'http://localhost:8008/users/@vamp',
        followersURL: 'http://localhost:8008/users/@vamp/followers?limit=10&currentPage=0',
        followingURL: 'http://localhost:8008/users/@vamp/following?limit=10&currentPage=0',
        storiesURL: 'http://localhost:8008/users/@vamp/stories?limit=10&currentPage=0',
        responsesURL: 'http://localhost:8008/users/@vamp/responses?limit=10&currentPage=0',
        clappedStoriesURL: 'http://localhost:8008/users/@vamp/clapped?limit=10&currentPage=0',
      },
    },
    createdAt: '2019-02-14T03:48:48.919Z',
    updatedAt: '2019-02-14T03:48:48.919Z',
    slug: 'devolved-background-archive-5c64e5200e4f8208b0e1f6e0',
    clapsCount: 0,
    links: {
      storyURL: 'http://localhost:8008/stories/devolved-background-archive-5c64e5200e4f8208b0e1f6e0',
      authorURL: 'http://localhost:8008/users/@vamp',
      parentURL: null,
      repliesURL: null,
      clappedReadersURL: null,
    },
  },

  clapExpectedShape: {
    count: 30,
    createdAt: '2019-02-14T23:14:05.590Z',
    updatedAt: '2019-02-14T23:14:05.590Z',
    links: {
      readerURL: 'http://localhost:8008/users/@witch',
      storyURL: 'http://localhost:8008/stories/implemented-intermediate-adapter-5c65f63d522d2e40730c9e02',
      clapURL: 'http://localhost:8008/stories/implemented-intermediate-adapter-5c65f63d522d2e40730c9e02/claps/@witch',
    },
  }
};
