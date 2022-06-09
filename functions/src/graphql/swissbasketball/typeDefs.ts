
/* eslint-disable max-len */
const typeDefs = /* GraphQL */ `

type Club {
    """
    Club documentation
    """
    id: ID!, # the ! means that every object _must_ have an id
    name: String,
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
# the schema allows the following query:
type Query {
    news: [News] # General Swiss Unihockey Newsfeed

    clubs: [Club], # List of clubs
    
}
`;
export default typeDefs;
