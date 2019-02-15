const { testManager, request, app, mocks, extractPath, expectedShapes } = require('./utils');

const { clapExpectedShape, userExpectedShape, storyExpectedShape } = expectedShapes;
const tm = new testManager({});

/**
 * --------------------------
 * COVERS: clapping interactions
 * --------------------------
 * Story-Claps Controller [/stories/:storySlug/claps]
 * - POST: create a new story clap
 * - GET: get a list of the story's clapped readers
 * 
 * Reader-Clap Controller [/stories/:storySlug/claps/:usernameSlug]
 * - GET: get the reader's story-clap details
 * - PATCH: update the count or delete a reader's story-clap
 * 
 * User Controller [/users/:usernameSlug/]
 * - GET /clapped: get a list of the stories the user has clapped for
 */

describe('Integration Tests: Clapping Interactions', () => {
  const clapCount = 30;
  let newClapURL;

  let author, reader, story, storyURL;
  beforeAll(async () => {
    [author, reader] = await tm.setup();

    const response = await request(app).post('/stories')
      .set('Authorization', `Bearer ${author.token}`)
      .send(mocks.storyMock({ author }));
    
    story = response.body;

    storyURL = extractPath(story.links.storyURL, '/stories');
    newClapURL = `${storyURL}/claps/@${reader.username}`;
  });

  afterAll(() => tm.teardown());

  describe('POST /stories/:storySlug/claps: create a new clap for a story', () => {
    let response;
    beforeAll(async () => {
      response = await request(app).post(`${storyURL}/claps`)
        .set('Authorization', `Bearer ${reader.token}`)
        .send({ count: clapCount });
    });

    test('returns a 201 response with Location header pointing to the new Clap resource', () => {
      expect(response.status).toBe(201);

      const locationURL = extractPath(response.headers.location, '/stories');
      expect(locationURL).toBe(`/stories/${story.slug}/claps/@${reader.username}`);
    });

    test('response is in Clap Response Shape', () => {
      Object.keys(clapExpectedShape)
        .forEach(field => expect(response.body).toHaveProperty(field));
    });

    test('clap response links field has Clap Resource Links shape', () => {
      Object.keys(clapExpectedShape.links)
        .forEach(field => expect(response.body.links).toHaveProperty(field));
    });

    test('Clap count is set correctly', () => expect(response.body.count).toBe(clapCount));
  });

  describe('GET /stories/:storySlug/claps: get a list of the readers who clapped for the story', () => {
    let response;
    beforeAll(async () => { response = await request(app).get(`${storyURL}/claps`); });

    test('returns a paginable list of clapped readers', () => {
      const { body } = response;
      expect(body).toHaveProperty('pagination');
      expect(body).toHaveProperty('readers');
    });

    test('response includes clapsCount field holding the aggregate count of reader claps', () => {
      expect(response.body.clapsCount).toBe(clapCount);
    });

    test('readers field elements are in User Response Shape', () => {
      Object.keys(userExpectedShape)
        .forEach(field => expect(response.body.readers[0]).toHaveProperty(field));
    });
  });

  describe('GET /users/:usernameSlug/clapped: get a list of stories the user has clapped for', () => {
    let response;
    beforeAll(async () => { response = await request(app).get(`/users/@${reader.username}/clapped`); });

    test('returns a paginable list of clapped stories', () => {
      const { body } = response;
      expect(body).toHaveProperty('pagination');
      expect(body).toHaveProperty('clapped_stories');
    });

    test('clapped stories field elements contain { clap, story } fields', () => {
      const clappedStory = response.body.clapped_stories[0];
      expect(clappedStory).toHaveProperty('clap');
      expect(clappedStory).toHaveProperty('story');
    });

    test('clap field is in Clap Response Shape', () => {
      const clapField = response.body.clapped_stories[0].clap;
      Object.keys(clapExpectedShape)
        .forEach(field => expect(clapField).toHaveProperty(field));
    });

    test('story field is in Story Response Shape', () => {
      const storyField = response.body.clapped_stories[0].story;
      Object.keys(storyExpectedShape)
        .forEach(field => expect(storyField).toHaveProperty(field));
    });

    test('contains the story and clap details for the reader\'s new clap', () => {
      const clappedStories = response.body.clapped_stories;
      expect(clappedStories.length).toBe(1);

      const clappedStory = clappedStories[0];
      expect(clappedStory.story.title).toBe(story.title);

      const isReadersClap = clappedStory.clap.links.readerURL.includes(reader.username);
      expect(isReadersClap).toBe(true);
    });
  });

  describe('GET /stories/:storySlug/claps/:usernameSlug: gets details about an individual reader\'s story clap', () => {
    let response;
    beforeAll(async () => { response = await request(app).get(newClapURL); });

    test('response is in Clap Response Shape', () => {
      Object.keys(clapExpectedShape)
        .forEach(field => expect(response.body).toHaveProperty(field));
    });

    test('returns details about the reader\'s new story clap', () => {
      const isReadersClap = response.body.links.readerURL.includes(reader.username);
      expect(isReadersClap).toBe(true); 
    });
  });

  describe('PATCH /stories/:storySlug/claps/:usernameSlug: updates the count or deletes a reader\'s story clap', () => {
    test('request data { count: # }: returns the updated clap with new clap count', async () => {
      const newCount = 13;
      expect(newCount).not.toBe(clapCount); // in case someone edits the test values

      const { body } = await request(app).patch(newClapURL)
        .set('Authorization', `Bearer ${reader.token}`)
        .send({ count: newCount });

      Object.keys(clapExpectedShape)
        .forEach(field => expect(body).toHaveProperty(field));

      expect(body.count).toBe(newCount);
    });

    test('request data { count: null }: deletes the reader\'s story clap and returns a 204 no-content response', async () => {
      const response = await request(app).patch(newClapURL)
        .set('Authorization', `Bearer ${reader.token}`)
        .send({ count: null });

      expect(response.status).toBe(204);

      // confirm it was deleted
      const deletedCheck = await request(app).get(newClapURL);
      expect(deletedCheck.status).toBe(404);
    });
  });
});