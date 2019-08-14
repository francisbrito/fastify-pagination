# fastify-pagination
Response pagination for Fastify. Inspired by [`Django Rest Framework`](https://www.django-rest-framework.org/api-guide/pagination/)

## Install
```sh
npm install fastify-pagination
```
Or, if using `yarn`:
```sh
yarn add fastify-pagination
```

## Usage
```js
const fastify = require('fastify')();

fastify
  .register(require('fastify-pagination'))
  .get("/", {}, async (request, reply) => {
    const { limit, offset } = request.parsePagination();
    const { items, count } = await getItemsAndTotalCountWithPagination(limit, offset);

    reply.sendWithPagination({ count, page: items }); // adds `next` and `previous` properties.
  });
```
## API

Todo.
