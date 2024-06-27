[![Build + Deploy](https://github.com/myclubapp/backend/actions/workflows/main.yml/badge.svg)](https://github.com/myclubapp/backend/actions/workflows/main.yml)

# Backend für myclub-app

used for the following apps: 
- volleyballclub.app
- unihockeyclub.app  
- handballclub.app  
- turnverein.app
- basketballclub.app  
- fussballclub.app  

## JOBS

### Update Club Data
Runs every monday 08:00 for: 
- SwissUnihockey
- Swissvolley
- Swisshandball
- Swiss Turnverband

### Update Team Data
Runs every monday 08:10 for active clubs: 
- SwissUnihockey
- Swissvolley (not in use)
- Swisshandball
- Swiss Turnverband (not provided)

### Update Game Data
Runs every Morning at 06:00 am for active clubs:
- Swissunihockey


## GraphQL API for Sports Data
Available APIs are: 

### Swiss unihockey API
based on this [documentation](https://api-v2.swissunihockey.ch/api/doc/table/overview)

available [here](https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey)

Verfügbare Dienste: 
- Clubs
- Teams
- Meisterschaft
- Ranglisten
- Statistiken

### Swiss Volleyball API
based on this [documentation](https://myvolley.volleyball.ch/SwissVolley.wsdl)

available [here](https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley)

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

Verfügbare Dienste: 
- Clubs
- Teams
- Meisterschaft
- Ranglisten


### Swiss Handball
based on this [documentation](https://clubapi-test.handball.ch/swagger/index.html) 
available [here](https://europe-west6-myclubmanagement.cloudfunctions.net/api/swisshandball): 


Verfügbare Dienste: 
- Vereine
- Teams
- Meisterschaft
- Ranglisten

### STV Schweizer Turnverband
available [here](https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissturnverband): 

Verfügbare Dienste: 
- Vereine
- Angebote

Nicht verfügbar: 
- News
- Ranglisten
- Wettkämpfe

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