import * as http from "http";

import fastify from "fastify";
import plugin = require("./index");

declare module "fastify" {
  interface FastifyRequest {
    parsePagination<T = any>(this: fastify.FastifyRequest): T;
  }

  interface FastifyReply<HttpResponse> {
    sendWithPagination: plugin.PaginatedReplySender;
  }
}
