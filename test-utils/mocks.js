const f = require('faker');

const userMock = () => ({
  username: f.name.firstName(),
  avatarURL: f.internet.avatar(),
});

const storyMock = ({ author, title, body, parent, published = false }) => ({
  author,
  title: title || f.company.catchPhrase(),
  body: body || f.lorem.paragraphs(2),
  parent: parent || null,
  published,
  publishedAt: published ? Date.now() : null,
});

const clapMock = ({ user, story, count }) => ({
  user,
  story,
  count: count || 0,
});

module.exports = {
  userMock,
  storyMock,
  clapMock,
};