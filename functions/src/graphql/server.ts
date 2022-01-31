import * as express from "express";
import {graphqlHTTP} from "express-graphql";
import {makeExecutableSchema} from "@graphql-tools/schema";

import typeDefs from "./typeDefs";
import resolvers from "./resolvers";


const schema = makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers: resolvers,
});

const app = express();
app.use("/swissunihockey", graphqlHTTP({
  schema: schema,
  graphiql: true,
}));

module.exports = app;
