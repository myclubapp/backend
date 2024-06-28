/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */


const typeDefs = /* GraphQL */ `

type Team {
    
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
    
    logo: String,
    liga: String,
    info: String,
    
    clubId: String,
    clubName: String,

    groupId: String,
    groupText: String,

    leagueId: String,
    leagueLong: String,
    leagueShort: String,

    website: String,
    portrait: String,
    """
    the list of Games by this team
    """
    games: [Game],
    rankings: [Ranking],

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

    address: String.
    """
    the list of Teams by this club
    """
    teams: [Team],
    games: [Game],
    # statistics
}

type ContactAddress {
    id: ID!,
    firstName: String,
    lastName: String,
    street: String,
    number: String,
    postalcode: String,
    city: String,
    email: String,
    phone: String,
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
    url: String,
}
type Ranking {
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
    ranking: String,
}


type SwissHandball {
    news: [News] # General Swiss Unihockey Newsfeed
    clubs: [Club], # List of clubs
    club(clubId: String): Club, # List of clubs
    teams(clubId: String): [Team], # List of Teams for a given Club
    team(teamId: String): Team, #TODO Check Team Detail.. 
    games(teamId: String): [Game], # List of Games for a given Team 
    clubGames(clubId: String): [Game], # List of Games for a given Team 
    rankings(teamId: String): [Ranking], # Ranking for a given Team
}


schema {
    query: SwissHandball
}

`;
export default typeDefs;
