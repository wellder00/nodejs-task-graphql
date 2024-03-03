import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema, graphQlSchema } from './schemas.js';
import { graphql, parse, validate } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { initializeDataLoaders } from './initializeDataLoaders.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const { query, variables } = req.body;

      const depthFiveDepthError = validate(graphQlSchema, parse(query), [depthLimit(5)]);

      if (depthFiveDepthError.length) {
        return { data: null, errors: depthFiveDepthError };
      }
      const { prisma } = fastify;
      return await graphql({
        schema: graphQlSchema,
        source: query,
        variableValues: variables,
        contextValue: { prisma, ...initializeDataLoaders(prisma) },
      });
    },
  });
};

export default plugin;
