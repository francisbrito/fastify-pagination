import * as qs from "querystring";

import Validator from "ajv";
import * as fastify from "fastify";
import S from "fluent-schema";
import {
  IFastifyPaginationStrategy,
  PaginatedReplySender,
  PaginationParser,
} from "../index";

function limitOffsetPaginationStrategy(
  options: Partial<
    limitOffsetPaginationStrategy.ILimitOffsetStrategyOptions
  > = {},
): IFastifyPaginationStrategy {
  const {
    defaultLimit,
    limitParameter,
    maximumLimit,
    offsetParameter,
  }: limitOffsetPaginationStrategy.ILimitOffsetStrategyOptions = {
    defaultLimit:
      options.defaultLimit || limitOffsetPaginationStrategy.DEFAULT_LIMIT,
    limitParameter:
      options.limitParameter ||
      limitOffsetPaginationStrategy.DEFAULT_LIMIT_PARAMETER,
    maximumLimit:
      options.maximumLimit || limitOffsetPaginationStrategy.DEFAULT_MAX_LIMIT,
    offsetParameter:
      options.offsetParameter ||
      limitOffsetPaginationStrategy.DEFAULT_OFFSET_PARAMETER,
  };

  const validator = new Validator({
    allErrors: true,
    coerceTypes: true,
    removeAdditional: true,
  });
  validator.addSchema(
    S.object()
      .prop(
        limitParameter,
        S.number()
          .default(defaultLimit)
          .minimum(0),
      )
      .prop(
        offsetParameter,
        S.number()
          .default(0)
          .minimum(0),
      )
      .valueOf(),
    "paginationPlugin",
  );

  const parsePagination: limitOffsetPaginationStrategy.ILimitOffsetPaginationParser = function() {
    const request = this;
    const query = request.query || {};
    let limit: any;
    let offset: any;

    limit = parseInt(query[limitParameter], 10);
    offset = parseInt(query[offsetParameter], 10);

    limit = Number.isNaN(limit) ? defaultLimit : limit;
    offset = Number.isNaN(offset) ? 0 : offset;

    limit = Math.min(limit, maximumLimit);

    return { limit, offset };
  };

  const sendWithPagination: PaginatedReplySender = function({ count, page }) {
    const reply = this;
    // @ts-ignore
    const request = reply.request as fastify.FastifyRequest;
    const { limit, offset } = parsePagination.call(request);
    const next =
      offset + limit < count
        ? qs.stringify({ limit, offset: offset + limit })
        : null;
    const previous =
      offset - limit < 0
        ? null
        : qs.stringify({ limit, offset: offset - limit });

    reply.send({ count, next, previous, results: page });
  };

  return {
    parsePagination,
    sendWithPagination,
  };
}

namespace limitOffsetPaginationStrategy {
  export interface ILimitOffsetPaginationParser
    extends PaginationParser<ILimitOffsetPagination> {}

  export interface ILimitOffsetPagination {
    limit: number;
    offset: number;
  }

  export interface ILimitOffsetStrategyOptions {
    limitParameter: string;
    offsetParameter: string;
    defaultLimit: number;
    maximumLimit: number;
  }

  export const DEFAULT_LIMIT = 20;
  export const DEFAULT_MAX_LIMIT = 100;
  export const DEFAULT_LIMIT_PARAMETER = "limit";
  export const DEFAULT_OFFSET_PARAMETER = "offset";
}

export = limitOffsetPaginationStrategy;
