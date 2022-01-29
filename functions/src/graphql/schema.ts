const { gql } = require('apollo-server-express');

const types = gql `

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

}
type Query {
    teams(clubId: String, season: String): [Team],
    clubs: [Club],
    seasons: [Season],
    news: [News]
}
`;

module.exports = types;