import express from 'express';
import cors from 'cors';
import {graphqlHTTP} from 'express-graphql';
import {makeExecutableSchema} from '@graphql-tools/schema';

import typeDefsSU from './swissunihockey/typeDefs';
import resolversSU from './swissunihockey/resolvers';

import typeDefsSV from './swissvolley/typeDefs';
import resolversSV from './swissvolley/resolvers';

import typeDefsSH from './swisshandball/typeDefs';
import resolversSH from './swisshandball/resolvers';

import typeDefsSB from './swissbasketball/typeDefs';
import resolversSB from './swissbasketball/resolvers';

import typeDefsST from './swissturnverband/typeDefs';
import resolversST from './swissturnverband/resolvers';

import typeDefsSE from './swisstennis/typeDefs';
import resolversSE from './swisstennis/resolvers';

const app = express();
app.use(cors());

// Konfiguration für alle Sportverbände
const sportsConfigs = [
  {path: 'swissunihockey', typeDefs: typeDefsSU, resolvers: resolversSU},
  {path: 'swissvolley', typeDefs: typeDefsSV, resolvers: resolversSV},
  {path: 'swisshandball', typeDefs: typeDefsSH, resolvers: resolversSH},
  {path: 'swissbasketball', typeDefs: typeDefsSB, resolvers: resolversSB},
  {path: 'swissturnverband', typeDefs: typeDefsST, resolvers: resolversST},
  {path: 'swisstennis', typeDefs: typeDefsSE, resolvers: resolversSE},
];

// Automatische Schema-Erstellung und Route-Konfiguration
sportsConfigs.forEach(({path, typeDefs, resolvers}) => {
  const schema = makeExecutableSchema({typeDefs, resolvers});
  app.use(`/${path}`, graphqlHTTP({
    schema,
    graphiql: true,
  }));
});

// eslint-disable-next-line no-undef
module.exports = app;
