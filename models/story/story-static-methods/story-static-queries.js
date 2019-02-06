async function getLatestStories(query) {
  const { limit = 10, currentPage = 0 } = query;

  // limit to max of 20 results per page
  const limitBy = Math.max(limit, 20);
  const skipBy = limitBy * currentPage;

  const latestStories = await models.Story
    .find({ published: true })
    .sort({ publishedAt: -1 })
    .limit(limitBy)
    .skip(skipBy);

  const stories = await Promise.all(latestStories.map(story => story.toResponseShape()));
  return { stories, pagination };
}

module.exports = {
  getLatestStories,
};
