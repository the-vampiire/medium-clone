# Medium.com backend explored as a REST API
As an avid user of [medium.com](https://medium.com/@vampiire) I decided to explore how their API could be cloned. Recently I have been spending a tremendous amount of time learning and implementing GraphQL servers but not nearly as much exploring RESTful design. While Medium is one of the many high profile services to migrate to GraphQL ([see the lovely Sasha's awesome talk](https://www.youtube.com/watch?v=3Ermkejz0iE)) I thought this would be a good opportunity to explore a REST API approach using NodeJS.

Most of the REST APIs you see these days use the Swagger CLI. In an effort to cement a deep understanding in RESTful design and implementation I chose to research and write this project by hand using a minimal number of packages. My goals for this project are to gain a hollistic understanding of RESTful design to provide a more meaningful and less biased comparison against the GraphQL API design I adore. 

I also wanted to dig deeper into MongoDB and Mongoose to gain an equally hollistic understanding of how a document DBMS compares to the PostgreSQL choice I usually opt for.

Long term I hope to finish this project and explore a GraphQL wrapping design next. As GraphQL grows in popularity it will be increasingly valuable to understand how to migrate an older REST API to a modern GraphQL API. Alright enough rambling...

## Requirements
- a MongoDB database
  - test: `medium_clone_test`
  - dev: `medium_clone`
  - prod: your choice
- The following ENV vars
  - add these in a `.env` in the top level directory of the project
  - feel free to set your own values, these are the test values I've been using
```sh
DEV_DB_URI=mongodb://127.0.0.1:27017/medium_clone
TEST_DB_URI=mongodb://127.0.0.1:27017/medium_clone_test

PORT=8008
DOMAIN=http://localhost:8008

JWT_SECRET=super secret
JWT_OPTIONS=algorithm: HS256, expiresIn: 24h, issuer: Medium REST Clone

ENCRYPTION_SECRET=even secreter
```

## Testing: [Jest](https://jestjs.io)
- `npm i`: install dependencies
- `npm test`: run all tests
- `npm run test:verbose`: run all tests with the fancy Jest output full of the checkmarks that I'm addicted to...
- `npm run test:coverage`: run tests and produce the Jest coverage report

# Usage
- all request and response payloads enforce `application/json` encoding
- all errors will include the appropriate status code and an `{ error }` JSON response describing the request error (unless otherwise specified)

## Authentication
- All endpoints that require authentication must include an `Authorization` header
  - `{ headers: { 'Authorization': Bearer <ACCESS TOKEN> } }`
- If an access token is invalid or invalidated you will receive the following error
  - `401` status code `{ error: failed to authenticate }`
  - authorization is endpoint dependent and errors will be listed under the respective endpoint description
### Requesting an Access Token
- Access tokens are signed JWT with a 48 hour expiration
- **After a [user account has been registered](#/users/:%20Users%20Collection%20entry%20point)** a new access token can be requested
- `POST` `/tokens`: Create a new access token
  - success response: `{ token }`
    - use this `token` in all subsequent requests, see [Authentication](#Authentication)
  - errors
    - missing username: `400` status code
    - missing password: `400 status code`
    - invalid credentials: `401` status code
      - **note** to limit exposure there is no further detail on whether the `username` and / or `password` credentials are invalid

## Pagination
- paginable resources will contain a `pagination` field of the following shape:
```js
{
  ...resource payload...,
  pagination: {
    limit: Number,
    currentPage: Number,
    hasNext: boolean,
    nextPageURL: URL || null
  },
}
```
- you can continue to paginate by requesting to `nextPageURL`
- if `hasNext` is `false` then the final page has been reached
- you can manually adjust the pagination parameters by modifying `limit` and / or `currentPage` query parameters in the request URL
  - the `pagination` response field will maintain these adjustments when generating `hasNext` and `nextPageURL`
  - ex: `/users/@the-vampiire/stories?limit=3&currentPage=5`
    - will return the 5th page of results with up to 3 results per page

# Entities

## User
Represents a member of the community
- aliases: `author, reader`
### User Schema
```js
{
  slug: String,
  username: String,
  avatarURL: URL || null,
  createdAt: Date,
  updatedAt: Date,
  links: { // all sub-fields: URL
    userURL,
    followersURL, // paginated
    followingURL, // paginated
    storiesURL, // paginated
    responsesURL, // paginated
    clappedStoriesURL, // paginated
  },
}
```
- the `slug` field is the user identifier
- the `links` field contains resource links to the user's owned resources

### `/users/`: Users Collection entry point
- `POST`: register a new user account
  - request payload: `{ username: String, password: String, verifyPassword: String }`
    - username restrictions: [3-20 chars] alpha, numeric, `-`, and `_`
    - password restrictions: [6+ chars]
  - success response
    - payload: [User Schema](#User%20Schema)
    - `201` status with Location header to the new user
  - errors
    - missing any of required fields: `400` status code
    - password mismatch: `400` status code
    - username already registered: `409` status code
    - validation error: `400` status code and `{ error, fields }` JSON response
      - `fields` will contain an object of each failing field with a validation error message value
        - ex: `{ error, fields: { password: 'must be at least 6 characters long' } }`

### `/users/:userSlug/`: User Entity entry point
- the `userSlug` is the `slug` field of the User entity
  - slug shape: `@username`
- global errors
  - user not found: `404` status code
  - invalid user slug: `400` status code
- `GET` `/users/:userSlug/`: User discovery
  - response payload: [User](#User%20Schema)
- `GET` `/users/:userSlug/stories`: Author's published stories
  - sorted by published date descending
  - response payload: `{ stories, pagination }`
    - `stories` shape: [[Story]](#Story%20Schema)
    - `pagination` shape: [Pagination](#Pagination)
- `GET` `/users/:userSlug/responses`: Reader's published responses
  - sorted by published date descending
  - response payload: `{ responses, pagination }`
    - `responses` shape: [[Story]](#Story%20Schema)
    - `pagination` shape: [Pagination](#Pagination)
- `GET` `/users/:userSlug/clapped`: Stories the reader has clapped for
  - sorted by clap count descending
  - response payload: `{ clapped_stories, pagination }`
    - `clapped_stories` shape: [{ clap, story }]
      - `clap` shape: [Clap](#Clap%20Schema)
      - `story` shape: [Story](#Story%20Schema)
    - `pagination` shape: [Pagination](#Pagination)
- `GET` `/users/:userSlug/following`: Users the User is following
  - response payload: `{ followed_users, pagination }`
    - `followed_users` shape: [[User]](#User%20Schema)
    - `pagination` shape: [Pagination](#Pagination)
- `GET` `/users/:userSlug/followers/`: Users following the User
  - response payload: `{ followers, pagination }`
    - `followers` shape: [[User]](User%20Schema)
    - `pagination` shape: [Pagination](#Pagination)
- `POST` `/users/:userSlug/followers/`: Follow the User
  - **authentication required** see [Authentication](#Authentication)
  - the authenticated user follows the User
  - success response
    - `201` status code with Location header to the new follower
  - errors
    - following self: `403` status code
    - already following: `400` status code
- `GET` `/users/:userSlug/followers/:followerSlug`: Following confirmation
  - the `followerSlug` is the user slug for the follower
  - responses
    - is following: `204` status code, no-content response
    - is not following: `404` status code
- `DELETE` `/users/:userSlug/followers/:followerSlug`: Following confirmation
  - **authentication required** see [Authentication](#Authentication)
  - **follow ownership required** the authenticated user must match the `followerSlug`
  - success response
    - `204` status code, no-content response
  - errors
    - authenticated user is not the follower: `403` status code
    - follower not found: `404` status code
    - not following: `400` status code

## Story