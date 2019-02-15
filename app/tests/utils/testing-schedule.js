/**
 * --------------------------------
 * Testing Schedule
 * - test configured error handling
 * - test nonsense
 * --------------------------------
 * 
 * Tokens Controller: /tokens
 * - POST: authenticate for token
 * 
 * Users Controller: /users/
 * - POST: registration
 * 
 * User Controller: /users/:usernameSlug/
 * - GET: user details
 * - GET /following: get users being followed
 *  - pagination
 * - GET /stories: get users published stories
 *  - pagination
 * - GET /responses: get users published responses
 *  - pagination 
 * 
 * User Followers Controller: /users/:usernameSlug/followers
 * - POST /followers: follow a user
 * - GET /followers: get followers
 * 
 * User Follower Controller: /users/:usernameSlug/followers/:followerSlug
 * - GET: confirm followship
 * - DELETE: unfollow user
 * 
 * Stories Controller: /stories
 * - POST: create new story
 * - GET: get paginated list of new stories
 *  - pagination
 * 
 * Story Controller: /stories/:storySlug
 * - GET: get story
 * - PATCH: update story
 * - DELETE: delete story
 * - GET /replies: get replies
 *  - pagination
 * - POST /replies: reply to story
 * 
 * Story Claps Controller: /stories/:storySlug/claps
 * - GET: get clapped readers
 *  - pagination
 * - POST: clap for a story
 * 
 * Reader Clap Controller: /stories/:storySlug/claps/:usernameSlug
 * - GET: get readers story clap detail
 * - PATCH: update reader story clap
 */