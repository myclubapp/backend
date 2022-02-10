import * as express from "express";
import * as cors from "cors";
import {graphqlHTTP} from "express-graphql";
import {makeExecutableSchema} from "@graphql-tools/schema";

import typeDefs from "./typeDefs";
import resolvers from "./resolvers";

import typeDefsSU from "./swissunihockey/typeDefs";
import resolversSU from "./swissunihockey/resolvers";

import typeDefsSV from "./swissvolley/typeDefs";
import resolversSV from "./swissvolley/resolvers";

import typeDefsSH from "./swisshandball/typeDefs";
import resolversSH from "./swisshandball/resolvers";

import typeDefsSB from "./swissbasketball/typeDefs";
import resolversSB from "./swissbasketball/resolvers";

const app = express();
app.use(cors());

const schema = makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers: resolvers,
});

app.use("/", graphqlHTTP({
  schema: schema,
  graphiql: true,
}));

const schemaSU = makeExecutableSchema({
  typeDefs: typeDefsSU,
  resolvers: resolversSU,
});

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
