const { publish } = require('../story-instance-mutations');

describe('Story instance mutation methods', () => {
  describe('publish(): executes publishing operations', () => {
    const baseMock = { publish, save() { return this; } };

    test('already published: exits early and returns null', async () => {
      const storyMock = Object.assign({ published: true }, baseMock);
      const output = await storyMock.publish();
      expect(output).toBeNull();
    });

    test('not yet published: sets published and publishedAt, saves, and returns updated Story', async () => {
      const storyMock = Object.assign({ published: false }, baseMock);
      const saveSpy = jest.spyOn(storyMock, 'save');

      const output = await storyMock.publish();
      expect(saveSpy).toHaveBeenCalled();
      expect(output.published).toBe(true);
      expect(output.publishedAt).toBeDefined();
    });
  });
});