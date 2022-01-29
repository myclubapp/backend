import {ApolloServer} from "apollo-server-express";
import * as express from "express";

// const cors = require('cors');

import typeDefs = require("./schema");
import resolvers = require("./resolvers");

const app = express();

// Automatically allow cross-origin requests
// app.use(cors({ origin: true }));

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
});

server.applyMiddleware({app, path: "/", cors: true});

module.exports = app;
