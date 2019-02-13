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
  beforeAll(async () => {
    await dbConnect(mongoose);
    process.env.SALT_ROUNDS = '1';
  });
  afterAll(async () => {
    await teardown(mongoose, ['users', 'stories', 'claps']);
    delete process.env.SALT_ROUNDS;
  });

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
});
