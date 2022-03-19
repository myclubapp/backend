/* eslint-disable max-len */

const typeDefs = /* GraphQL */ `

type Team {
    """
    Team Documentation
    """

    id: ID!, # the ! means that every object _must_ have an id
    name: String,
    gender: String,
    clubId: String,
    clubCaption: String,
    leagueCaption: String,
    organisationCaption: String,


    games: [Game], # List of games for given team
    # statistics: [Statistics], # statistics for given team
    details: [TeamDetails], # details for given team

}
type Club {
    """
    Club documentation
    """
    id: ID!, # the ! means that every object _must_ have an id
    name: String,

    teams: [Team], # List of Teams for given Club
    games: [Game], # List of games for given team

}


type Game {
    """
    Game documentation
    """
    id: ID!, # the ! means that every object _must_ have an id
    details: GameDetails,
}

type GameDetails {
    """
    Game Detail documentation
    """
    id: ID!, # the ! means that every object _must_ have an id
}

type News {
    """
    News documentation
    """
    id: ID!, # the ! means that every object _must_ have an id
    title: String,
    slug: String,
    image: String,
    leadText: String,
    text: String,
    htmlText: String,
}
type Ranking {
    """
    Ranking documentation
    """
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
    rank: String,
}

type TeamDetails {
    """
    Team Detail documentation
    """
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
}

type Association {
    """
    Association documentation
    """  
    id: ID!,
    name: String,

    clubs: [Club], # List of Clubs for given Association
    leagues: [League] # List of League for given Association
}

type League {
    """
    Team Detail documentation
    """    
    id: ID!,
    name: String,

    phases: [Phase] # List of phases for given League
}

type Phase {
    """
    Phase Detail documentation
    """    
    id: ID!,
    name: String,

    groups: [Group] # List of groups for given Phase
}

type Group {
    """
    Group documentation
    """    
    id: ID!,
    name: String,

    rankings: [Ranking], # ranking for given team
}

# the schema allows the following query:
type Query {
    news: [News] # General Swiss Unihockey Newsfeed

    clubs: [Club], # List of clubs
    club(clubId: String): Club, # List of clubs

    teams(clubId: String): [Team], # List of Teams for a given Club
    team(teamId: String): TeamDetails, # TODO: Check if the same as Team

    games: [Game], # List of Games for a given Team 
    game(gameId: String): Game, # List of Games for a given Team 
    clubGames: [Game], # List of Games for a given Team 

    rankings(groupId: String): [Ranking], # Ranking for a given Team

    associations: [Association],
    leagues(associationId: String): [League],
    phases(leagueId: String): [Phase],
    groups(phaseId: String): [Group],
}
`;
export default typeDefs;
