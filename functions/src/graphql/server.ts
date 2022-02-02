import * as express from "express";
import {graphqlHTTP} from "express-graphql";
import {makeExecutableSchema} from "@graphql-tools/schema";

import typeDefsSU from "./swissunihockey/typeDefs";
import resolversSU from "./swissunihockey/resolvers";

import typeDefsSV from "./swissvolley/typeDefs";
import resolversSV from "./swissvolley/resolvers";

import typeDefsSH from "./swisshandball/typeDefs";
import resolversSH from "./swisshandball/resolvers";

import typeDefsSB from "./swissbasketball/typeDefs";
import resolversSB from "./swissbasketball/resolvers";

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

const schemaSH = makeExecutableSchema({
  typeDefs: typeDefsSH,
  resolvers: resolversSH,
});


app.use("/swisshandball", graphqlHTTP({
  schema: schemaSH,
  graphiql: true,
}));

const schemaSB = makeExecutableSchema({
  typeDefs: typeDefsSB,
  resolvers: resolversSB,
});


app.use("/swissbasketball", graphqlHTTP({
  schema: schemaSB,
  graphiql: true,
}));

module.exports = app;
