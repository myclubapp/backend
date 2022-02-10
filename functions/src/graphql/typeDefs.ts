/* eslint-disable max-len */
const typeDefs = /* GraphQL */ `
type Team {
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
    """
    the list of Games by this team
    """
    games: [Game],
    rankings: [Ranking],
    statistics: [Statistics],

    details: [TeamDetail],

}

type TeamDetail {
    """
    Team Detail documentation
    """
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
}
type Club {
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
    """
    the list of Teams by this club
    """
    teams: [Team],
    clubGames: [Game],
    # statistics
}
type Season {
    id: ID!, # the ! means that every object _must_ have an id
    season: String,
    name: String,
}

type Game {
    id: ID!, # the ! means that every object _must_ have an id
}

type News {
    id: ID!, # the ! means that every object _must_ have an id
    title: String,
    slug: String,
    image: String,
    date: String,
    leadText: String,
    text: String,
    htmlText: String,
    tags: [String],
    author: String,
    authorImage: String,
}
type Ranking {
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
    ranking: String,
}

type Statistics {
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
   
}

# the schema allows the following query:
type Query {
    news: [News] # General Swiss Unihockey Newsfeed
    seasons: [Season], # Season Data
    clubs: [Club], # List of clubs
    teams(clubId: String, season: String): [Team], # List of Teams for a given Club
    team(teamId: String): Team, #TODO Check Team Detail.. 
    games(teamId: String, season: String): [Game], # List of Games for a given Team 
    clubGames(clubId: String, season: String): [Game], # List of Games for a given Team 
    rankings(teamId: String, season: String): [Ranking], # Ranking for a given Team
}
`;
export default typeDefs;
