const typeDefs = /* GraphQL */ `
type Team {
    id: String,
    name: String,
    logo: String,
    teamImage: String 
}
type Club {
    id: String,
    name: String
}
type Season {
    id: String, 
    season: String,
    name: String
}

type News {
    id: String, 
    title: String
}
type Query {
    teams(clubId: String, season: String): [Team],
    clubs: [Club],
    seasons: [Season],
    news: [News]
}
schema {
    query: Query
  }
`;
export default typeDefs;
