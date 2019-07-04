const app = require('../../app');
const mongoose = require('mongoose');
const request = require('supertest');
const expectedShapes = require('./expected-shapes');
const { extractCookies } = require('./extract-cookies');
const { utils: { testUtils: { dbConnect, teardown, mocks } } } = require('../../../db');

const defaultUsers = [
  { username: 'vamp', password: 'testing', verifyPassword: 'testing' },
  { username: 'witch', password: 'testing', verifyPassword: 'testing' },
];

function testManager ({ users }) {
  this.users = users || defaultUsers;

  this.registerUsers = function() {
    return Promise.all(
      this.users.map(user => request(app).post('/users').send(user)),
    );
  }

  this.attachUserRefreshTokens = async function() {
    await Promise.all(
      this.users.map(
        async user => {
          const res = await request(app)
            .post('/tokens')
            .send(user);
          
          const { refresh_token: refreshToken } = extractCookies(res.headers);
          user.refreshToken = refreshToken;
        }
      )
    );
  }

  this.authenticateUsers = async function() {
    if (this.users.every(user => !user.refreshToken)) {
      await this.attachUserRefreshTokens();
    }

    this.authedUsers = await Promise.all(
      this.users.map(
        async (user) => {
          const res = await request(app)
          .post('/tokens/access_token')
          .set(
            'cookie',
            `refresh_token=${user.refreshToken.value}`,
          );
          
          return { ...user, token: res.body.access_token };
        },
      ),
    );
  }

  this.dbConnect = function() {
    require('dotenv').config();

    return dbConnect(mongoose);
  }

  this.teardown = function(collections = ['users', 'stories', 'claps']) {
    return teardown(mongoose, collections);
  }

  this.setup = async function() {
    require('dotenv').config();

    await dbConnect(mongoose);
    await this.registerUsers().then(() => this.authenticateUsers());
    
    return this.authedUsers;
  }
}

const extractPath = (URL, rootPath) => URL.slice(URL.indexOf(rootPath));

module.exports = {
  app,
  mocks,
  request,
  mongoose,
  extractPath,
  testManager,
  defaultUsers,
  expectedShapes,
  extractCookies,
};
