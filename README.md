[![travis build](https://api.travis-ci.org/the-vampiire/medium-clone.svg?branch=master)](https://travis-ci.org/the-vampiire/medium-clone)|[![Coverage Status](https://coveralls.io/repos/github/the-vampiire/medium-clone/badge.svg?branch=master)](https://coveralls.io/github/the-vampiire/medium-clone?branch=master)

# Medium.com backend explored as a REST API

As an avid user of [medium.com](https://medium.com/@vampiire) I decided to explore how their API could be built using NodeJS. I have been spending the past 2 years learning and implementing GraphQL servers but not nearly as much exploring (true) RESTful design. While Medium is one of the many high profile services to migrate to GraphQL ([see the lovely Sasha's awesome talk](https://www.youtube.com/watch?v=3Ermkejz0iE)) I thought this would be a good opportunity to explore an OpenAPI REST approach using NodeJS.

Most of the REST APIs you see these days use the Swagger CLI. In an effort to cement a deep understanding in RESTful design and implementation I chose to research and write this project by hand using a minimal number of packages. My goals for this project are to gain a hollistic understanding of RESTful design to provide a more meaningful and less biased comparison against the GraphQL API design I adore.

I also wanted to dig deeper into MongoDB and Mongoose to gain an equally hollistic understanding of how a document DBMS compares to the PostgreSQL choice I usually opt for.

Long term I hope to finish this project and explore a GraphQL wrapping design next. As GraphQL grows in popularity it will be increasingly valuable to understand how to migrate existing REST APIs to GraphQL. Alright enough rambling...

## Requirements

- a MongoDB database
  - test: `medium_clone_test`
  - dev: `medium_clone`
  - prod: your choice
- The following ENV vars
  - add these in a `.env` in the top level directory of the project
  - feel free to set your own values, these are the test values I've been using
  - **note that the `_LIFESPAN` env vars must be in ms**

```sh
DEV_DB_URI=
TEST_DB_URI=

PORT=
DOMAIN=localhost

COOKIE_SECRET=

SALT_ROUNDS=12
ENCRYPTION_SECRET=

ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_LIFESPAN=1800000

REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_LIFESPAN=604800000

```

## Testing: [Jest](https://jestjs.io)

- `npm i`: install dependencies
- `npm test`: run all tests
- `npm run test:verbose`: run all tests with the fancy Jest output full of the checkmarks that I'm addicted to...
- `npm run test:coverage`: run tests and produce the Jest coverage report

# Usage

- all request and response payloads enforce `application/json` encoding
  - any request with a body that does not have the `Content-Type` header as `application/json` will be rejected
- all errors will be sent with the noted status code and an `{ error }` JSON response describing the request error (unless otherwise specified)
  - some error responses will include additional fields in the JSON body

## Authentication

- All endpoints that require authentication must include an `Authorization` header with an access token
- If an access token is invalid you will receive the following JSON response
  - `401` status code `{ error: failed to authenticate }`
- Authorization is endpoint dependent and errors will be listed under the respective endpoint description

## Exploring the Authentication Flow

Authentication is separated into a usage of two JWTs that provide authentication and protection from both CSRF and XSS attacks. The pair is formed by a refresh token, transmitted via fortified cookie, and an access token, transmitted over an Authorization header. This system emerges from a modification of a typical server to server API authentication mechanism where both the refresh and access token are left to the consumer to protect. Authorization is controlled on each endpoint, token claims, or mixture of both.

The refresh token is stored in a signed, httpOnly, sameSite, secure, and path bound cookie `#fortified`. These cookie flags provide robust security from CSRF and XSS attacks (when consumed by modern browsers) and ensure a narrow usage space. The short-lived access token, being bound to the header, adds supplementary protection against CSRF attacks. The access token is to be restricted to in-memory use of the client application to prevent the most common and simplistic sort of XSS attacks that target browser storage.

The two tokens, their transport, and their usage provide a balance to each other across their respective transport medium risks. Together they form a cohesive unit with short (access token lifespan) windows of opportunity for authentication abuse.

The authentication process begins with the exchange of user credentials, a username and password, for a 7 day lifespan refresh token. The refresh token is identified, signed, and returned in a response cookie. A second request, carrying the refresh token cookie, can then be made to create an access token with a lifespan of 30 minutes. When an access token expires, or is near expiration, the client application can perform a transparent attempt at creating a new one - extending the user activity for 30 more minutes. The access token handler validates the refresh token and returns the access token in a JSON paylaod. When the new access token is created a new refresh token is also created and attached to the response to extend the authenticated session an additional 7 days.

This refreshing process can revolve until a user remains inactive for 7 days from the last moment of client activity (when the last refresh token was signed). At this point the user must re-authenticate and create a new refresh token to begin the cycle again.

As with all articles on stateless authentication mechanisms the a major question is always "how is revocation controlled?". The revocation process can be separated by its two actors - the user and the server. The user uses its mechanism to "log out" while the server uses revocation to manage system security and abuse.

User revocation targets its refresh token since it manages their session and is a predicate to the creation of the access token. Each refresh token is given a unique ID in the form of the JWT `jti` (JWT ID) claim durin signing. A revoked token is placed into a revoked token store that marks this ID as well as its expiration. All access token requests must pass both a JWT verification step as well as a query against this revoked token store.

In order to keep the queries light the revoked tokens are assigned a database TTL, time to live, which will auto delete them one hour after their signed expiration. The one hour window provides a buffer to guarantee that a revoked token will either fail verification due to natural expiration or by lookup in the revoked token store. Because the tokens auto delete the store remains mostly empty making these read operations, performed on every refresh phase, more performant.

Server revocation can be provided in two ways. The first is through a changing of the signing key. This is a drastic measure which invalidates every user session and forces re-authentication. This is the infamous "wipe clean" approach that should be used sparingly but comes at a low cost to the server as the workload is passed to the users in having to re-authenticate.

The second approach involves storing the refresh token ID in the user store during creation. When a user's refresh token is to be revoked individually this token field is set to null. During every token refresh process this field is checked. If it is null then the token has been revoked and re-authentication is required by the user. This process provides the server with fine-grained revocation control at the cost of a heavier workload by requiring a user store query during every refresh process (at its longest a second shy of the 30 minute access token lifespan, per user). An optional status field can flag users to reject or restrict future refresh token creation requests as needed.

The choice of server revocation mechanism is dependent on the application. For most client application backends the user revocation + signing key rotation approach is sufficient. If, however, the server needs greater control then the cost of user store queries may be worthwhile.

The flow can be modified to return the refresh token / access token directly to the consumer in the case of allowing 3rd party access on behalf of a user. Instead of sending the refresh token in the cookie it is now left to the consumer to protect the tokens.

### `/tokens`: Authentication Token entry point

- requesting a refresh token: `POST` `/tokens`
  - request payload: `{ username: String, password: String }`
  - success response
    - `204` no-content
    - attaches: refresh token cookie
      - flags: `httpOnly`, `secure`, `sameSite: 'strict'`
      - `domain: API domain`
      - `path: /tokens`,
  - errors
    - missing username or password: 400 status code
    - failed credential authentication: 401 status code
- requesting an access token: `POST` `/tokens/access_token`
  - requires: `refresh_token` cookie
  - request payload: none
  - success response
    - JSON `{ type: 'Bearer', access_token, expiration }`
      - `expiration` is a UNIX timestamp in ms
  - errors
    - missing or invalid refresh token cookie: 401 status code
    - revoked refresh token: 401 status code
- revoking a refresh token: `DELETE` `/tokens`
  - marks a refresh token as revoked and inhibits any future use of it
  - requires: `refresh_token` cookie
  - request payload: none
    - success response
      - `204` no-content
      - removes: refresh token cookie
  - errors
    - already revoked: 409 status code
    - failed to revoke: 500 status code

### Authentication Sample Flow

- `POST` `/tokens`: receive refresh token cookie in response
- `POST` `/tokens/access_token`: receive access token JSON response
- use the access token in the Authorization header for authentication required requests
  - `{ headers: { 'Authorization': Bearer <ACCESS TOKEN> } }`
- make new requests to `/tokens/access_token` to retrieve access tokens when the old one expires

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

- register a new user account: `POST` `/users`
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
- User discovery: `GET` `/users/:userSlug/`
  - response payload: [User](#User%20Schema)
- User's published stories: `GET` `/users/:userSlug/stories`
  - sorted by published date descending
  - response payload: `{ stories, pagination }`
    - `stories` shape: [[Story]](#Story%20Schema)
    - `pagination` shape: [Pagination](#Pagination)
- User's published story responses: `GET` `/users/:userSlug/responses`
  - sorted by published date descending
  - response payload: `{ responses, pagination }`
    - `responses` shape: [[Story]](#Story%20Schema)
    - `pagination` shape: [Pagination](#Pagination)
- Stories the User has clapped for: `GET` `/users/:userSlug/clapped`
  - sorted by clap count descending
  - response payload: `{ clapped_stories, pagination }`
    - `clapped_stories` shape: [{ clap, story }]
      - `clap` shape: [Clap](#Clap%20Schema)
      - `story` shape: [Story](#Story%20Schema)
    - `pagination` shape: [Pagination](#Pagination)
- Members the User is following: `GET` `/users/:userSlug/following`
  - response payload: `{ followed_users, pagination }`
    - `followed_users` shape: [[User]](#User%20Schema)
    - `pagination` shape: [Pagination](#Pagination)
- Members following the User: `GET` `/users/:userSlug/followers/`
  - response payload: `{ followers, pagination }`
    - `followers` shape: [[User]](User%20Schema)
    - `pagination` shape: [Pagination](#Pagination)
- Follow the User: `POST` `/users/:userSlug/followers/`
  - **authentication required** see [Authentication](#Authentication)
  - success response
    - `201` status code with Location header to the new follower
  - errors
    - following self: `403` status code
    - already following: `400` status code
- Following confirmation: `GET` `/users/:userSlug/followers/:followerSlug`
  - the `followerSlug` is the user slug for the follower
  - responses
    - is following: `204` status code, no-content response
    - is not following: `404` status code
- Unfollow the User: `DELETE` `/users/:userSlug/followers/:followerSlug`
  - **authentication required** see [Authentication](#Authentication)
  - **follow ownership required** the authenticated user must match the `followerSlug`
  - success response
    - `204` status code, no-content response
  - errors
    - authenticated user is not the follower: `403` status code
    - follower not found: `404` status code
    - not following: `400` status code

## Story

### Story Schema

## Clap

### Clap Schema
