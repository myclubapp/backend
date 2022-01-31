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
based on https://api-v2.swissunihockey.ch/api/doc/table/overview#return-types

available under: 
https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey

### Swiss Volleyball API
available under: 
https://europe-west6-myclubmanagement.cloudfunctions.net/api/xxx

### Swiss Handball
available under: 
https://europe-west6-myclubmanagement.cloudfunctions.net/api/xxx

### Swiss Basketball
available under: 
https://europe-west6-myclubmanagement.cloudfunctions.net/api/xxx

# Installed packages
- express
- expres-graphql https://www.npmjs.com/package/express-graphql
- graphql
- graphql-tools
- html-to-text (needed to convert neews feed)
- node-fetch (needed to fetch data from apis)

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