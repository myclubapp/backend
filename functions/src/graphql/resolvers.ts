/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from "node-fetch";

const localResolvers = {
  Query: {
    clubs: ()=>{
      fetch("https://api-v2.swissunihockey.ch/api/clubs")
          .then((response: any) => response.json())
          .then((data: any) => console.log(data));
    },
    teams: (clubId: string, season: string)=>{
      fetch("https://api-v2.swissunihockey.ch/api/teams?mode=by_club&club_id=" + clubId + "&season=" + season)
          .then((response: any) => response.json())
          .then((data: any) => console.log(data));
    },
    seasons: ()=>{
      fetch("https://api-v2.swissunihockey.ch/api/seasons")
          .then((response: any) => response.json())
          .then((data: any) => console.log(data));
    },
    rankings: (season: string, teamId: string)=>{
      fetch("https://api-v2.swissunihockey.ch/api/rankings?season=" + season + "&team_id=" + teamId)
          .then((response: any) => response.json())
          .then((data: any) => console.log(data));
    },
    news: ()=>{
      fetch("https://api.newsroom.co/walls?token=xgoo9jkoc2ee&count=30&channelId=663&tag=news")
          .then((response: any) => response.json())
          .then((data: any) => console.log(data));
    },
  },
};

module.exports = localResolvers;
