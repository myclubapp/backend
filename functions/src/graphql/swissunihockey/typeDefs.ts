/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */


const typeDefs = /* GraphQL */ `

type Team {
    
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
    
    logo: String,
    liga: String,
    info: String,

    website: String,
    portrait: String,
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
    logo: String,
    website: String,

    latitude: String,
    longitude: String,
    foundingYear: String,
    """
    the list of Teams by this club
    """
    teams: [Team],
    games: [Game],
    # statistics
}
type Season {
    id: ID!, # the ! means that every object _must_ have an id
    season: String,
    name: String,
}

type Game {
    id: ID!, # the ! means that every object _must_ have an id
    date: String,
    time: String,
    location: String,
    city: String,
    longitude: String,
    latitude: String,
    teamHome: String,
    teamAway: String,
    result: String,
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
    url: String,
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

type SwissUnihockey {
    news: [News] # General Swiss Unihockey Newsfeed
    seasons: [Season], # Season Data
    clubs: [Club], # List of clubs
    teams(clubId: String, season: String): [Team], # List of Teams for a given Club
    team(teamId: String): Team, #TODO Check Team Detail.. 
    games(teamId: String, season: String): [Game], # List of Games for a given Team 
    clubGames(clubId: String, season: String): [Game], # List of Games for a given Team 
    rankings(teamId: String, season: String): [Ranking], # Ranking for a given Team
}


schema {
    query: SwissUnihockey
}

`;
export default typeDefs;
