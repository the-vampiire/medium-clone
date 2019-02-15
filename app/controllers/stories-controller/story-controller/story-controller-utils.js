const mongoose = require('mongoose');

/**
 * Validates an ID candidate to be a valid MongoDB ObjectID
 * @param {string} id the ID to test
 * @returns {string} success: ID converted to an ObjectID
 * @returns {null} failure: null
 */
const validateObjectID = (id) => {
  try {
    return mongoose.Types.ObjectId(id);
  }
  catch(invalidTypeError) {
    return null;
  }
};

/**
 * Extracts the Story ID from a story slug
 * - calls validateObjectID before returning
 * @param {string} storySlug a story slug from a request
 * @returns {string} successful extraction: storyID
 * @returns {null} unsuccessful extraction: null
 */
const extractStoryID = (storySlug) => {
  const slugSplit = storySlug.split('-');
  const storyID = slugSplit[slugSplit.length - 1];

  return validateObjectID(storyID);
};

module.exports = {
  validateObjectID,
  extractStoryID,
};