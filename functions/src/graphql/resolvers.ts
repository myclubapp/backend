/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require("node-fetch");

export default {
  Query: {
    clubs: async ()=>{
      console.log("Sandro");
      const data = await fetch("https://api-v2.swissunihockey.ch/api/clubs");
      const dataJson = await data.json().entries;
      console.log(dataJson);
      return dataJson;
    },
    /* teams: (clubId: string, season: string)=>{
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
      return [{
        id: "123",
        title: "titel",
      }];
    }, */
  },
};
