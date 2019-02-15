const mongoose = require('mongoose');
const { validateObjectID, extractStoryID } = require('../story-controller-utils');

describe('Story Controller utilities', () => {
  describe('validateObjectID(): validates a candidate ID', () => {
    test('valid ObjectID: returns the ID as an Object ID', () => {
      const id = new mongoose.Types.ObjectId();
      const output = validateObjectID(id)
      expect(output).toBe(id);
      expect(output.constructor.name).toBe('ObjectID');
    });

    test('invalid ObjectID: returns null', () => {
      const id = 'not an id';
      expect(validateObjectID(id)).toBeNull();
    });
  });

  describe('extractStoryID(): extracts the story ID from a story slug', () => {
    test('valid story slug: returns the extracted story ID as an Object ID', () => {
      const id = new mongoose.Types.ObjectId();
      const storySlug = `this-is-an-awesome-title-${id}`;
      const output = extractStoryID(storySlug);
      expect(output).not.toBeNull();
    });

    test('invalid story slug: returns null', () => {
      const storySlug = 'this-is-a-bad-sluggie-';
      const output = extractStoryID(storySlug);
      expect(output).toBeNull();
    });
  });
});