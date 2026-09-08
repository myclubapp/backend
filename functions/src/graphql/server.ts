import express from 'express';
import cors from 'cors';
import {createHandler} from 'graphql-http/lib/use/express';
import {makeExecutableSchema} from '@graphql-tools/schema';

import typeDefsSU from './swissunihockey/typeDefs.js';
import resolversSU from './swissunihockey/resolvers.js';

import typeDefsSV from './swissvolley/typeDefs.js';
import resolversSV from './swissvolley/resolvers.js';

import typeDefsSH from './swisshandball/typeDefs.js';
import resolversSH from './swisshandball/resolvers.js';

import typeDefsSB from './swissbasketball/typeDefs.js';
import resolversSB from './swissbasketball/resolvers.js';

import typeDefsST from './swissturnverband/typeDefs.js';
import resolversST from './swissturnverband/resolvers.js';

import typeDefsSE from './swisstennis/typeDefs.js';
import resolversSE from './swisstennis/resolvers.js';

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

// Automatische Schema-Erstellung und Route-Konfiguration.
// graphql-http liefert keine GraphiQL-Oberfläche mit; zum Erkunden lokal
// `npx ruru -e https://europe-west6-myclubmanagement.cloudfunctions.net/api/<verband>`.
sportsConfigs.forEach(({path, typeDefs, resolvers}) => {
  const schema = makeExecutableSchema({typeDefs, resolvers});
  app.all(`/${path}`, createHandler({schema}));
});

export default app;
