const mongoose = require('mongoose');
const { Story } = require('../../index');
const { dbConnect, teardown } = require('../../../test-utils');

describe('Story Model hooks', () => {
  beforeAll(() => dbConnect(mongoose));
  afterAll(() => {
    const collections = ['stories'];
    return teardown(mongoose, collections);
  });

  describe('pre-save hook', () => {
    const badBody = `
      <script>alert("you have been hacked you fool")</script>
      # Some legitimate title
      - a few bullent points
      - and another
    `;

    test('sanitizes (stripped of malicious tags) the Story body before saving during create()', async () => {
      const savedStory = await Story.create({ title: 'ok', body: badBody });
      expect(savedStory.body.includes('<script>')).toBe(false);
    });
  });
}); 