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

# API Documentation
- work in progress