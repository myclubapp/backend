const { ApolloServer } = require('apollo-server-express');
const express = require('express')
//const cors = require('cors');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const app = express();

// Automatically allow cross-origin requests
// app.use(cors({ origin: true }));

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
});

server.applyMiddleware({app,path:'/',cors:true});

module.exports = server;