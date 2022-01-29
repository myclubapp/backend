const _fetch = require('node-fetch');

const localResolvers = {
  Query: {
    clubs: ()=>{
        _fetch('https://api-v2.swissunihockey.ch/api/clubs')
        .then((response: any) => response.json())
        .then((data: any) => console.log(data));

    },
    teams:(clubId: String, season: String)=>{
        _fetch('https://api-v2.swissunihockey.ch/api/teams?mode=by_club&club_id='  + clubId + '&season=' + season)
        .then((response: any) => response.json())
        .then((data: any) => console.log(data));
    },
    seasons: ()=>{
        _fetch('https://api-v2.swissunihockey.ch/api/seasons')
        .then((response: any) => response.json())
        .then((data: any) => console.log(data));
    },
    rankings: (season: String, teamId: String)=>{
        _fetch('https://api-v2.swissunihockey.ch/api/rankings?season=' + season + '&team_id=' + teamId)
        .then((response: any) => response.json())
        .then((data: any) => console.log(data));
    },
    news:()=>{
        _fetch('https://api.newsroom.co/walls?token=xgoo9jkoc2ee&count=30&channelId=663&tag=news')
        .then((response: any) => response.json())
        .then((data: any) => console.log(data));
    }
  },
};

module.exports = localResolvers;