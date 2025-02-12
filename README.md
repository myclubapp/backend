[![Build + Deploy](https://github.com/myclubapp/backend/actions/workflows/main.yml/badge.svg)](https://github.com/myclubapp/backend/actions/workflows/main.yml)

# Backend for myclub-app

This backend powers the following apps:
- volleyballclub.app
- unihockeyclub.app  
- handballclub.app  
- turnverein.app
- basketballclub.app  
- fussballclub.app  

## JOBS

### Update Club Data
Runs every **Monday at 08:00 AM** for: 
- Swiss Unihockey
- Swiss Volleyball
- Swiss Handball
- Swiss Turnverband

### Update Team Data
Runs every **Monday at 08:10 AM** for active clubs: 
- Swiss Unihockey
- Swiss Volleyball
- Swiss Handball
- Swiss Turnverband (not provided)

### Update Game Data
Runs **every morning at 06:00 AM** for active clubs:
- Swiss Unihockey
- Swiss Volleyball
- Swiss Handball

## GraphQL API for Sports Data
For some sports, data is provided by external APIs and transformed into the format used by myclub-app.  

⚠️ **To access this data, an API key from the respective association is required.**  

### **Swiss Unihockey API**
- 📄 Based on this [documentation](https://api-v2.swissunihockey.ch/api/doc/table/overview)  
- 🌍 **API Endpoint:** [Swiss Unihockey API](https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissunihockey)  

📌 **Available Services:**  
- Clubs  
- Teams  
- Meisterschaft*  
- Ranglisten*  
- Statistiken *(not yet implemented)*  
- News  

### **Swiss Volleyball API**
- 📄 Based on this [documentation](https://myvolley.volleyball.ch/SwissVolley.wsdl)  
- 🌍 **API Endpoint:** [Swiss Volleyball API](https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissvolley)  

📌 **Available Services:**  
- Clubs  
- Teams  
- Meisterschaft*  
- Ranglisten *(not yet implemented)*  

### **Swiss Handball API**
- 📄 Based on this [documentation](https://clubapi-test.handball.ch/swagger/index.html)  
- 🌍 **API Endpoint:** [Swiss Handball API](https://europe-west6-myclubmanagement.cloudfunctions.net/api/swisshandball)  

📌 **Available Services:**  
- Clubs  
- Teams  
- Meisterschaft*  
- Ranglisten*  

### **STV Schweizer Turnverband**
- 🌍 **API Endpoint:** [Swiss Turnverband API](https://europe-west6-myclubmanagement.cloudfunctions.net/api/swissturnverband)  

📌 **Available Services:**  
- Vereine  
- Angebote  

### **Swiss Basketball (Not Supported Yet)**
🚧 Currently not supported. Planned for future implementation.

### **Swiss Football (Not Supported Yet)**
🚧 Currently not supported. Planned for future implementation.

## Installed Packages
- `express` - Web framework for Node.js
- [`express-graphql`](https://www.npmjs.com/package/express-graphql) - Middleware for running GraphQL
- `graphql` - GraphQL library
- `graphql-tools` - Utilities for schema building
- `html-to-text` - Converts news feeds from HTML to plain text
- `node-fetch` - Fetch API for Node.js
- `soap` - SOAP web service client

## Tutorials & Help
🔗 Helpful articles:  
- [GraphQL Schema Generation](https://www.graphql-tools.com/docs/generate-schema)

### **Firebase Related Tutorials**
- [Using GraphQL with Firebase](https://medium.com/mehak-vohra/using-graphql-to-query-your-firebase-realtime-database-a6e6cbd6aa3a)

## Resolver Documentation
- [Apollo GraphQL Resolvers](https://www.apollographql.com/docs/apollo-server/data/resolvers/)

## Open Issues
Feel free to contribute by submitting a Pull Request (PR).  

### **Husky - Git Hooks**
- [How to Add Commit Hooks with Husky](https://www.freecodecamp.org/news/how-to-add-commit-hooks-to-git-with-husky-to-automate-code-tasks/)