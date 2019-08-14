import fastify from "fastify";

import paginationPlugin from "../index";
import limitOffsetPaginationStrategy, {
  DEFAULT_LIMIT,
  DEFAULT_LIMIT_PARAMETER,
  DEFAULT_MAX_LIMIT,
  DEFAULT_OFFSET_PARAMETER,
} from "./limit-offset";

async function injectRequestAndGetResponsePayload(
  app: fastify.FastifyInstance,
  parameters: { [k: string]: any } = {},
) {
  const response = await app.inject({
    method: "GET",
    query: parameters,
    url: "/",
  });

  return JSON.parse(response.payload);
}

function generateNumberSequenceUpTo(n: number) {
  return Array.from(new Array(n)).map((x, i) => i + 1);
}

describe("LimitOffsetStrategy", () => {
  describe("with defaults", () => {
    let app: fastify.FastifyInstance;

    beforeEach(() => {
      app = fastify()
        .register(paginationPlugin, {
          strategy: limitOffsetPaginationStrategy(),
        })
        .get("/", {}, async (request, reply) =>
          reply.send(request.parsePagination()),
        );
    });

    afterEach(async () => {
      await app.close();
    });

    it("sets a default limit if none is provided", async () => {
      const payload = await injectRequestAndGetResponsePayload(app);

      expect(payload.limit).toBe(DEFAULT_LIMIT);
    });

    it("sets a default maximum limit if none is provided", async () => {
      const payload = await injectRequestAndGetResponsePayload(app, {
        limit: 1000,
      });

      expect(payload.limit).toBe(DEFAULT_MAX_LIMIT);
    });

    it("sets a default limit parameter key if none is provided", async () => {
      const payload = await injectRequestAndGetResponsePayload(app);

      expect(payload).toHaveProperty(DEFAULT_LIMIT_PARAMETER);
    });

    it("sets a default offset parameter key if none is provided", async () => {
      const payload = await injectRequestAndGetResponsePayload(app);

      expect(payload).toHaveProperty(DEFAULT_OFFSET_PARAMETER);
    });
  });

  describe("with overrides", () => {
    it("supports receiving a default limit", async () => {
      const app = fastify()
        .register(paginationPlugin, {
          strategy: limitOffsetPaginationStrategy({ defaultLimit: 50 }),
        })
        .get("/", {}, async (request, reply) =>
          reply.send(request.parsePagination()),
        );

      const payload = await injectRequestAndGetResponsePayload(app);

      expect(payload.limit).toBeDefined();
      expect(payload.limit).toBe(50);

      await app.close();
    });

    it("supports receiving a custom limit parameter key", async () => {
      const app = fastify()
        .register(paginationPlugin, {
          strategy: limitOffsetPaginationStrategy({ limitParameter: "foo" }),
        })
        .get("/", {}, async (request, reply) =>
          reply.send(request.parsePagination()),
        );

      const payload = await injectRequestAndGetResponsePayload(app, {
        foo: 55,
      });

      expect(payload.limit).toBeDefined();
      expect(payload.limit).toBe(55);

      await app.close();
    });

    it("supports receiving a customer offset parameter key", async () => {
      const app = fastify()
        .register(paginationPlugin, {
          strategy: limitOffsetPaginationStrategy({ offsetParameter: "foo" }),
        })
        .get("/", {}, async (request, reply) =>
          reply.send(request.parsePagination()),
        );

      const payload = await injectRequestAndGetResponsePayload(app, {
        foo: 10,
      });

      expect(payload.offset).toBeDefined();
      expect(payload.offset).toBe(10);

      await app.close();
    });

    it("supports receiving a custom maximum limit", async () => {
      const app = fastify()
        .register(paginationPlugin, {
          strategy: limitOffsetPaginationStrategy({ maximumLimit: 1000 }),
        })
        .get("/", {}, async (request, reply) =>
          reply.send(request.parsePagination()),
        );

      const payload = await injectRequestAndGetResponsePayload(app, {
        limit: 1000,
      });

      expect(payload.limit).toBe(1000);

      await app.close();
    });
  });

  describe("#sendWithPagination", () => {
    let app: fastify.FastifyInstance;
    let items: number[] = [];

    beforeEach(() => {
      items = generateNumberSequenceUpTo(100);
      app = fastify()
        .register(paginationPlugin, {
          strategy: limitOffsetPaginationStrategy(),
        })
        .get("/", {}, async (request, reply) => {
          const { limit, offset } = request.parsePagination();
          const page = items.slice(offset, offset + limit);

          reply.sendWithPagination({ count: items.length, page });
        });
    });

    afterEach(async () => {
      await app.close();
    });

    it("returns next result page", async () => {
      const payload = await injectRequestAndGetResponsePayload(app);

      expect(payload).toHaveProperty("next");
      expect(payload.next).toBe("limit=20&offset=20");
    });

    it("returns next result page as null if limit is greater or equal to item count", async () => {
      items = generateNumberSequenceUpTo(20);

      let payload = await injectRequestAndGetResponsePayload(app);

      expect(payload.next).toBeNull();

      items = generateNumberSequenceUpTo(10);
      payload = await injectRequestAndGetResponsePayload(app);

      expect(payload.next).toBeNull();
    });

    it("returns next result page as null if limit and offset sum is greater or equal to item count", async () => {
      items = generateNumberSequenceUpTo(30);

      let payload = await injectRequestAndGetResponsePayload(app, {
        offset: 10,
      });

      expect(payload.next).toBeNull();

      payload = await injectRequestAndGetResponsePayload(app, { offset: 20 });

      expect(payload.next).toBeNull();
    });

    it("returns previous result page", async () => {
      const payload = await injectRequestAndGetResponsePayload(app, {
        offset: 20,
      });

      expect(payload.previous).toBeDefined();
      expect(payload.previous).toBe("limit=20&offset=0");
    });

    it("returns previous result page as null if offset is zero", async () => {
      const payload = await injectRequestAndGetResponsePayload(app);

      expect(payload.previous).toBeNull();
    });

    it("returns previous result page as null if offset and limit subtraction is lesser to 0", async () => {
      const payload = await injectRequestAndGetResponsePayload(app, {
        offset: 10,
      });

      expect(payload.previous).toBeNull();
    });
  });
});
