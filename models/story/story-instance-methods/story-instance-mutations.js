async function publish() {
  if (this.published) return null;

  this.publishedAt = Date.now();
  this.published = true;
  return this.save();
}

module.exports = {
  publish,
};
