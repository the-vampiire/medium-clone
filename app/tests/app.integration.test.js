require('dotenv').config();

const app = require('../app');
const mongoose = require('mongoose');
const request = require('supertest');
const { utils: { testUtils: { dbConnect, teardown } } } = require('../../db');

const password = 'testing';
const vamp = { username: 'vamp', password, verifyPassword: password };
const witch = { username: 'witch', password, verifyPassword: password };
const users = [vamp, witch];

const { DOMAIN } = process.env;

describe('App integration tests', () => {
  beforeAll(async () => dbConnect(mongoose));
  afterAll(async () => teardown(mongoose, ['users', 'stories', 'claps']));

  describe('POST /users: registering new users', () => {
    users.forEach(
      user => test(`registers: ${user.username}`, () => {
        return request(app)
          .post('/users')
          .send({ ...user })
          .expect(201)
          .expect('Location', `${DOMAIN}/users/@${user.username}`);
      }),
    );
  });

  describe('GET /users/@username: requesting user details', () => {
    users.forEach(
      user => test(`retrieves user details for: ${user.username}`, async () => {
        const res = await request(app).get(`/users/@${user.username}`);
        const { body } = res;
        expect(body.username).toBe(user.username);
        expect(body.links).toBeDefined();
      }),
    );
  });

  describe('POST /tokens: authenticating a user', () => {
    users.forEach(
      user => test(`authenticates: ${user.username}`, async () => {
        const { username, password } = user;
        const res = await request(app).post('/tokens').send({ username, password });
        const { body } = res;
        expect(body.token).toBeDefined();
        user.token = body.token;
      }),
    );
  });

  describe('POST /users/@username/followers: follow a user', () => {
    test('vamp can follow witch', () => {
      return request(app).post('/users/@witch/followers')
        .set('Authorization', `Bearer ${vamp.token}`)
        .expect(201)
        .expect('Location', `${DOMAIN}/users/@witch/followers/@vamp`);
    });
  });
  
  describe('GET /users/@username/followers: retrieve the users followers', () => {
    test('witch followers includes vamp', async () => {
      const res = await request(app).get('/users/@witch/followers');
      const { body } = res;
      expect(body.followers).toBeDefined();
      expect(body.followers.length).toBe(1);
      expect(body.followers[0].username).toBe('vamp');
    });

    test('vamp followers list is empty', async () => {
      const res = await request(app).get('/users/@vamp/followers');
      const { body } = res;
      expect(body.followers).toBeDefined();
      expect(body.followers.length).toBe(0);
    });
  });

  describe('GET /users/@username/following: retrieve the list of users the user is following', () => {
    test('vamp followed users list includes witch', async () => {
      const res = await request(app).get('/users/@vamp/following');
      const { body } = res;
      expect(body.followed_users).toBeDefined();
      expect(body.followed_users.length).toBe(1);
      expect(body.followed_users[0].username).toBe('witch');
    });

    test('witch followed users list is empty', async () => {
      const res = await request(app).get('/users/@witch/following');
      const { body } = res;
      expect(body.followed_users).toBeDefined();
      expect(body.followed_users.length).toBe(0);
    });
  });

  describe('GET /users/@username/followers/@followerUsername: confirm if a user (follower) is following the path user', () => {
    test('vamp is confirmed to be following witch: 204 no-content response', () => {
      return request(app).get('/users/@witch/followers/@vamp').expect(204);
    });

    test('witch is confirmed to not be following vamp: 404 response', () => {
      return request(app).get('/users/@vamp/followers/@witch').expect(404);
    });
  });

  describe('DELETE /users/@username/followers/@followerUsername: authed user (follower) unfollow path user', () => {
    test('vamp can unfollow witch: 204 no-content response', () => {
      return request(app).delete('/users/@witch/followers/@vamp')
      .set('Authorization', `Bearer ${vamp.token}`)
      .expect(204);
    });
  });
});
