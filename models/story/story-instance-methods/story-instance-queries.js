async function getClapsCount() {
  const reduceClapsCount = claps => claps.reduce((total, clap) => total + clap.count, 0);
  
  return this.populate('claps').execPopulate()
    .then(() => reduceClapsCount(this.claps));
}

async function getClappedReaders() {
  const mapClappedUsers = claps => Promise.all(
    claps.map(clap => clap.populate('user').execPopulate().then(clap => clap.user)),
  );
  return this.populate('claps').execPopulate().then(() => mapClappedUsers(this.claps));
}

module.exports = {
  getClapsCount,
  getClappedReaders,
};
