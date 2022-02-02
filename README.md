[![Build + Deploy](https://github.com/myclubapp/backend/actions/workflows/main.yml/badge.svg)](https://github.com/myclubapp/backend/actions/workflows/main.yml)

# Backend für myclub-app

used for the following apps: 
- volleyballclub.app
- unihockeyclub.app  
- handballclub.app  
- basketballclub.app  
- fussballclub.app  

## GraphQL API for Sports Data
Available APIs are: 

### Swiss unihockey API
based on this [documentation](https://api-v2.swissunihockey.ch/api/doc/table/overview#return-types)

available [here](https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey):

### Swiss Volleyball API
based on this [documentation](https://myvolley.volleyball.ch/SwissVolley.wsdl)
available [here](https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley): 


Supported organizations:
- National
- RVNO
- GSGL
- RVI
- RVZ
- RVA
- SVRW
- SVRF
- SVRBE

### Swiss Handball (Not supported yet)
available under: 
n/a

### Swiss Basketball (Not supported yet)
available under: 
n/a

### Swiss Football (Not supported yet)
available under: 
n/a

# Installed packages
- express
- [expres-graphql](https://www.npmjs.com/package/express-graphql)
- graphql
- graphql-tools
- html-to-text (needed to convert neews feed)
- node-fetch (needed to fetch data from apis)
- soap (needed to fetch data from apis)

# Tutorials and help:

helpful articles
- https://www.graphql-tools.com/docs/generate-schema

## Firebase related tutorials
https://medium.com/mehak-vohra/using-graphql-to-query-your-firebase-realtime-database-a6e6cbd6aa3a

## Resolver Documentation
https://www.apollographql.com/docs/apollo-server/data/resolvers/

## Typescript
https://medium.com/free-code-camp/build-an-apollo-graphql-server-with-typescript-and-webpack-hot-module-replacement-hmr-3c339d05184f

# Open Issues
Feel free to contribute by providing a PR. 

## Husky
- https://www.freecodecamp.org/news/how-to-add-commit-hooks-to-git-with-husky-to-automate-code-tasks/

## Other issues
- tbd