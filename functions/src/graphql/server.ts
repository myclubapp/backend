import * as express from "express";
import {graphqlHTTP} from "express-graphql";
import {makeExecutableSchema} from "@graphql-tools/schema";

import typeDefsSU from "./swissunihockey/typeDefs";
import resolversSU from "./swissunihockey/resolvers";

import typeDefsSV from "./swissvolley/typeDefs";
import resolversSV from "./swissvolley/resolvers";

const schemaSU = makeExecutableSchema({
  typeDefs: typeDefsSU,
  resolvers: resolversSU,
});

const app = express();
app.use("/swissunihockey", graphqlHTTP({
  schema: schemaSU,
  graphiql: true,
}));

const schemaSV = makeExecutableSchema({
  typeDefs: typeDefsSV,
  resolvers: resolversSV,
});

app.use("/swissvolley", graphqlHTTP({
  schema: schemaSV,
  graphiql: true,
}));

module.exports = app;
