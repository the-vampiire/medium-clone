const mongoose = require('mongoose');

/**
 * 
 * two approaches to modeling a follower / following relationship between users in mongo
 * 
 * we could store 'followers' and 'following' array fields on the User
 * these would hold references to the users they follow or are followed by respectively
 * 
 * getting followers [1 loop over smaller collection]:
 *   look up the user's document and populate the 'followers' list field
 * 
 * getting following [1 loop over smaller collection]:
 *   look up the user's document and populate the 'following' list field
 * 
 * making a connection (following / being followed):
 *   follow [1 loop over smaller collection]:
 *     look up the other user and push the current user's ID into the other user's 'followers' list
 *   following[1 loop over smaller collection]:
 *     look up the current user and push the other user's ID into the current user's 'following' list
 * 
 * check if current user is following another [1 loop over smaller collection, 1 loop over document array field]:
 *   iterate over User documents to find the other user by its ID
 *   iterate over the otherUser.followers list to confirm/deny the existence
 *   of the current user's ID
 * 
 * cleanup (deleting a User document) [0 loops]:
 *  both the follow and following lists are implicitly deleted as they exist on the document
 *  
 * we could go with a more familiar (from a SQL perspective) approach to using an associative collection. here each document
 * represents a connection between two users, either as a follower or followedUser
 * 
 * getting followers [1 loop over larger collection]:
 *   iterate over the Follow collection and find all documents where the current user's id is the 'followedUser'
 *   then populate the follower field of the Follow documents
 * 
 * getting following [1 loop over larger collection]:
 *   iterate over the Follow collection and find all documents where the current user's id is the 'follower'
 *   then populate the followedUser field of the Follow documents
 * 
 * cleanup (deleting a User document) [1 loop over larger collection]:
 *  when a User is deleted we have to iterate over the Follows collection
 *  and destroy all associations that reference the User
 *  we can implement this with a pre-remove hook and a few lines of code
 * 
 * making a connection (following / being followed):
 *  insert a document into the Follow collection with { followedUser: otherUser.id, follower: currentUser.id }
 * 
 * check if current user is following another [1 loop over larger collection]:
 *   iterate over the Follow documents and find a match for { followedUser: otherUser.id, follower: currentUser.id }
 * 
 * the only real benefit of using an associative collection is in checking if a user follows another. this is a common case
 * that will appear on every story and user profile view by another user in order to control the 'follow' button rendering on the client
 * 
 * 
 */

const followSchema = new mongoose.Schema({
  follower: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
  followedUser: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
});

const Follow = mongoose.model('follows', followSchema);

module.exports = Follow;