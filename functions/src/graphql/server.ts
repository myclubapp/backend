import * as express from "express";
import {graphqlHTTP} from "express-graphql";

import resolvers from "./resolvers";
import typeDefs from "./schema";

const app = express();
app.use("/graphql", graphqlHTTP({
  schema: typeDefs,
  rootValue: resolvers,
  graphiql: true,
}));

module.exports = app;
