import * as fastify from "fastify";
import plugin from "fastify-plugin";
import * as http from "http";

import limitOffsetPaginationStrategy = require("./strategies/limit-offset");

async function fastifyPaginationImplementation(
  instance: fastify.FastifyInstance,
  options: fastifyPaginationPlugin.IFastifyPaginationOptions,
) {
  const strategy = options.strategy || limitOffsetPaginationStrategy();

  instance.decorateRequest("parsePagination", strategy.parsePagination);
  instance.decorateReply("sendWithPagination", strategy.sendWithPagination);
}

const fastifyPaginationPlugin = plugin(fastifyPaginationImplementation);

namespace fastifyPaginationPlugin {
  export interface IPage<T> {
    count: number;
    page: T[];
  }

  export type PaginationParser<T = any> = (this: fastify.FastifyRequest) => T;

  export type PaginatedReplySender = <T = any>(
    this: fastify.FastifyReply<http.ServerResponse>,
    page: IPage<T>,
  ) => void;

  export interface IFastifyPaginationStrategy {
    parsePagination: PaginationParser;
    sendWithPagination: PaginatedReplySender;
  }

  export interface IFastifyPaginationOptions {
    strategy: IFastifyPaginationStrategy;
  }
}

export = fastifyPaginationPlugin;
