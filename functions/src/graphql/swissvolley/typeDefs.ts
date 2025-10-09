const typeDefs = /* GraphQL */ `

type Team {
    """
    Team Documentation
    """

    id: ID!, # the ! means that every object _must_ have an id
    name: String,

    logo: String,
    liga: String,
    info: String,

    website: String,
    portrait: String,

    gender: String,
    clubId: String,
    clubCaption: String,
    leagueCaption: String,


    games: [Game], # List of games for given team
    rankings: [Ranking]
    # statistics: [Statistics], # statistics for given team

}
type Club {
    """
    Club documentation
    """
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
    logo: String,
    website: String,

    latitude: String,
    longitude: String,
    foundingYear: String,

    teams: [Team], # List of Teams for given Club


}

type Game {
    """
    Game documentation
    """
    id: ID!, # the ! means that every object _must_ have an id
    date: String,
    time: String,
    location: String,
    city: String,
    name: String,
    description: String,
    longitude: String,
    latitude: String,
    teamHome: String,
    teamHomeLogo: String,
    teamAway: String,
    teamAwayLogo: String,
    result: String,
    resultDetail: String,
}


type News {
    """
    News documentation
    """
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
    """
    Ranking documentation
    """
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
    rank: String,
}

type Association {
    """
    Association documentation
    """  
    id: ID!,
    name: String,

    clubs: [Club], # List of Clubs for given Association
    # leagues: [League] # List of League for given Association
}

# the schema allows the following query:
type SwissVolley {
    news: [News] # General Swiss Unihockey Newsfeed

    clubs: [Club], # List of clubs
    club(clubId: String): Club, # List of clubs

    teams(clubId: String): [Team], # List of Teams for a given Club
    team(teamId: String): Team, # TODO: Check if the same as Team

    games(teamId: String): [Game], # List of Games for a given Team 

    rankings(groupId: String): [Ranking], # Ranking for a given Team

    associations: [Association],
}


schema {
    query: SwissVolley
  }


`;
export default typeDefs;
