const { testManager, request, app, mocks, extractPath, expectedShapes } = require('./utils');

const { storyExpectedShape } = expectedShapes;
const tm = new testManager({});

/**
 * --------------------------
 * COVERS: story/reply interactions
 * --------------------------
 * Stories Controller [/stories]
 * - POST: create new story
 * - GET: get a list of published stories
 * 
 * Story Controller [/stories/:storySlug]
 * - GET: access an individual story's details
 * - PATCH: update a story's title, body, and/or publishment
 * - DELETE: delete a story/story-reply
 * 
 * Replies Handlers [/stories/:storySlug/replies]
 * - POST: create a reply for the story
 * - GET: get a list of the story's replies
 * 
 * User Controller [/users/:usernameSlug/]
 * - GET /stories: get a list of the user's published stories
 * - GET /responses: get a list of the user's published story responses
 */

// mutate these objects during calls to carry data between tests
const newStoryData = {};
const newReplyData = {};

describe('Integration Tests: Story/Reply Interactions', () => {
  let author, replier;
  beforeAll(async () => {
    [author, replier] = await tm.setup();
  });

  afterAll(async () => tm.teardown());

  describe('POST /stories: creates a new story', () => {
    let response;
    beforeAll(async () => {
      response = await request(app).post('/stories')
        .set('Authorization', `Bearer ${author.token}`)
        .send(mocks.storyMock({ author }))
    });

    test('returns a 201 response with the Location header pointing to the new Story resource', () => {
      expect(response.status).toBe(201);
      expect(response.headers.location).toBeDefined();
    });

    test('returns the new Story details in Story Response Shape', () => {
      Object.keys(storyExpectedShape)
        .forEach(field => expect(response.body).toHaveProperty(field));
      
      // update story data for downstream tests
      const { title, body, links: { storyURL } } = response.body;
      newStoryData.title = title;
      newStoryData.body = body;
      // port is ephemeral with supertest, slice just the path out
      newStoryData.storyURL = extractPath(storyURL, '/stories');
    });

    test('Story is unpublished by default', () => expect(response.body.published).toBe(false));
  });

  describe('GET /stories/storySlug: get a story\'s details', () => {
    let response;
    beforeAll(async () => { response = await request(app).get(newStoryData.storyURL); });

    test('returns the Story in Story Response Shape', () => {
      if (response.body.error) console.log({ body: response.body, newStoryData });
      Object.keys(storyExpectedShape)
      .forEach(field => expect(response.body).toHaveProperty(field));
    });

    test('Story [author] field is in User Response Shape', () => {
      Object.keys(storyExpectedShape.author)
        .forEach(field => expect(response.body.author).toHaveProperty(field));
    });

    test('Story [links] field is in Story Resource Links shape', () => {
      Object.keys(storyExpectedShape.links)
        .forEach(field => expect(response.body.links).toHaveProperty(field));      
    });
  });

  describe('PATCH /stories/storySlug: update story data', () => {
    test('request data { title }: updates only the Story\'s title', async () => {
      const newTitle = 'this is the new title';
      const { body } = await request(app).patch(newStoryData.storyURL)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ title: newTitle });

      expect(body.title).toBe(newTitle);
      expect(body.body).toBe(newStoryData.body);
      expect(body.published).toBe(false);

      // update the title and storyURL
      newStoryData.title = body.title;
      newStoryData.storyURL = extractPath(body.links.storyURL, '/stories');
    });

    test('request data { body }: updates only the Story\'s body', async () => {
      const newBody = 'there is a whole bunch of body going on here bro. i mean look at all this body. MY GOD i have never seen such an all the body';
      const { body } = await request(app).patch(newStoryData.storyURL)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ body: newBody });

      expect(body.body).toBe(newBody);
      expect(body.title).toBe(newStoryData.title);
      expect(body.published).toBe(false);

      // update the body
      newStoryData.body = body.body;
    });

    test('request data { published: true }: updates the Story\'s published field and sets publishedAt date', async () => {
      const { body } = await request(app).patch(newStoryData.storyURL)
        .set('Authorization', `Bearer ${author.token}`)
        .send({ published: true });

      expect(body.published).toBe(true);
      expect(body.publishedAt).not.toBe(null);
      expect(body.body).toBe(newStoryData.body);
      expect(body.title).toBe(newStoryData.title);

      // update the published and publishedAt fields
      newStoryData.published = true;
      newStoryData.publishedAt = body.publishedAt;
    });
  });

  describe('POST /stories/:storySlug/replies: create a reply to the story', () => {
    let response;
    beforeAll(async () => { 
      response = await request(app).post(`${newStoryData.storyURL}/replies`)
      .set('Authorization', `Bearer ${replier.token}`)
      .send(mocks.storyMock({ author: replier }));
    });

    test('returns a 201 response with the Location header pointing to the new Story-reply resource', () => {
      expect(response.status).toBe(201);
      expect(response.headers.location).toBeDefined();
    });

    test('returns the new Story-reply details in Story Response Shape', () => {
      Object.keys(storyExpectedShape)
        .forEach(field => expect(response.body).toHaveProperty(field));
      
      // update story data for downstream tests
      const { title, body, links: { storyURL } } = response.body;
      newReplyData.title = title;
      newReplyData.body = body;
      // port is ephemeral with supertest, slice just the path out
      newReplyData.storyURL = extractPath(storyURL, '/stories');
    });

    test('Story-reply links field contains parentURL pointing at the original parent Story', () => {
      const parentURLPath = extractPath(response.body.links.parentURL, '/stories');
      expect(parentURLPath).toBe(newStoryData.storyURL);
    });

    test('Story-reply is published by default', () => expect(response.body.published).toBe(true));
  });

  describe('GET /stories/:storySlug/replies: get a list of the story\'s replies', () => {
    let response;
    beforeAll(async () => { response = await request(app).get(`${newStoryData.storyURL}/replies`); });

    test('returns a paginable list of the story\'s replies', () => {
      const { body } = response;
      expect(body).toHaveProperty('pagination');
      expect(body).toHaveProperty('replies');
    });

    test('replies list contains the new Story-reply', () => {
      const { body } = response;
      expect(body.replies.length).toBe(1);
      expect(body.replies[0].title).toBe(newReplyData.title);
    });
  });

  describe('GET /stories: get a list of published stories', () => {
    let response;
    beforeAll(async () => { response = await request(app).get('/stories'); });

    test('returns a paginable list of published stories', () => {
      const { body } = response;
      expect(body).toHaveProperty('pagination');
      expect(body).toHaveProperty('stories');
    });

    test('stories list does not contain Story-replies', () => {
      const hasReply = response.body.stories.some(story => story.title === newReplyData.title);
      expect(hasReply).toBe(false);
    });

    test('stories list contains the new Story', () => {
      expect(response.body.stories.length).toBe(1);
      expect(response.body.stories[0].title).toBe(newStoryData.title);
    });

    test('stories in stories list are in Story Response Shape', () => {
      Object.keys(storyExpectedShape)
        .forEach(field => expect(response.body.stories[0]).toHaveProperty(field));
    });

    test('new Story in stories list now has repliesURL defined', () => {
      const { repliesURL } = response.body.stories[0].links;
      expect(repliesURL).not.toBeNull();
    });
  });

  describe('GET /users/:usernameSlug/stories: get a list of the user\'s published stories', () => {
    let response;
    beforeAll(async () => { response = await request(app).get(`/users/@${author.username}/stories`); });

    test('returns a paginable list of the author\'s published stories', () => {
      const { body } = response;
      expect(body).toHaveProperty('pagination');
      expect(body).toHaveProperty('stories');
    });

    test('stories in stories list are in Story Response Shape', () => {
      Object.keys(storyExpectedShape)
        .forEach(field => expect(response.body.stories[0]).toHaveProperty(field));
    });
  });

  describe('GET /users/:usernameSlug/responses: get a list of the user\'s story responses', () => {
    let response;
    beforeAll(async () => { response = await request(app).get(`/users/@${replier.username}/responses`); });

    test('returns a paginable list of the author\'s published story responses', () => {
      const { body } = response;
      expect(body).toHaveProperty('pagination');
      expect(body).toHaveProperty('responses');
    });

    test('responses in responses list are in Story Response Shape', () => {
      Object.keys(storyExpectedShape)
        .forEach(field => expect(response.body.responses[0]).toHaveProperty(field));
    });
  });

  describe('DELETE /stories/:storySlug: delete a story/story reply', () => {
    test('user deleting a story they have not authored: 401 { error: authorship required } response', async () => {
      const response = await request(app).delete(newStoryData.storyURL)
      .set('Authorization', `Bearer ${replier.token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('authorship required');
    });

    test('story author can delete the story: 204 no-content response', async () => {
      const response = await request(app).delete(newStoryData.storyURL)
        .set('Authorization', `Bearer ${author.token}`);

      expect(response.status).toBe(204);
    });

    test('story-reply author can delete their reply: 204 no-content response', async () => {
      const response = await request(app).delete(newReplyData.storyURL)
        .set('Authorization', `Bearer ${replier.token}`);

      expect(response.status).toBe(204);
    });
  });
});
 