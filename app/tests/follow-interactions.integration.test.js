const { testManager, request, app } = require('./utils');

const tm = new testManager({});
const { DOMAIN } = process.env;

/**
 * --------------------------
 * COVERS: user follower/following interactions
 * --------------------------
 * Followers Controller [/users/@username/followers]
 * - POST: follow the path user
 * - GET: retrieve list of the path user's followers
 * 
 * User Controller [/users/@username]
 * - GET /following: retrieve the list of users the path user is following
 * 
 * Follower Controller [/users/@username/followers/@followerName]
 * - GET: confirmation endpoint of a follower following the path user
 * - DELETE: unfollowing endpoint between the follower and the path user
 */

describe('Integration Tests: Follower/Following Interactions', () => {
  let users, vamp;
  beforeAll(async () => {
    users = await tm.setup();
    [vamp] = users;
  });

  afterAll(async () => tm.teardown());

  describe('POST /users/@username/followers: follow a user', () => {
    test('@vamp can follow @witch', () => {
      return request(app).post('/users/@witch/followers')
        .set('Authorization', `Bearer ${vamp.token}`)
        .expect(201)
        .expect('Location', `${DOMAIN}/users/@witch/followers/@vamp`);
    });
  });
  
  describe('GET /users/@username/followers: retrieve the users followers', () => {
    test('@witch followers includes @vamp', async () => {
      const res = await request(app).get('/users/@witch/followers');
      const { body } = res;
      expect(body.followers).toBeDefined();
      expect(body.followers.length).toBe(1);
      expect(body.followers[0].username).toBe('vamp');
    });

    test('@vamp followers list is empty', async () => {
      const res = await request(app).get('/users/@vamp/followers');
      const { body } = res;
      expect(body.followers).toBeDefined();
      expect(body.followers.length).toBe(0);
    });
  });

  describe('GET /users/@username/following: retrieve the list of users the user is following', () => {
    test('@vamp followed users list includes @witch', async () => {
      const res = await request(app).get('/users/@vamp/following');
      const { body } = res;
      expect(body.followed_users).toBeDefined();
      expect(body.followed_users.length).toBe(1);
      expect(body.followed_users[0].username).toBe('witch');
    });

    test('@witch followed users list is empty', async () => {
      const res = await request(app).get('/users/@witch/following');
      const { body } = res;
      expect(body.followed_users).toBeDefined();
      expect(body.followed_users.length).toBe(0);
    });
  });

  describe('GET /users/@username/followers/@followerUsername: confirm if a user (follower) is following the path user', () => {
    test('@vamp is confirmed to be following @witch: 204 no-content response', () => {
      return request(app).get('/users/@witch/followers/@vamp').expect(204);
    });

    test('@witch is confirmed to not be following @vamp: 404 response', () => {
      return request(app).get('/users/@vamp/followers/@witch').expect(404);
    });
  });

  describe('DELETE /users/@username/followers/@followerUsername: authed user (follower) unfollow path user', () => {
    test('@vamp can unfollow @witch: 204 no-content response', () => {
      return request(app).delete('/users/@witch/followers/@vamp')
      .set('Authorization', `Bearer ${vamp.token}`)
      .expect(204);
    });
  });
});
