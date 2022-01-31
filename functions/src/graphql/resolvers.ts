/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require("node-fetch");

export default {
  Query: {
    clubs: async ()=>{
      console.log("Sandro");
      const data = await fetch("https://api-v2.swissunihockey.ch/api/clubs");
      const clubData = await data.json();
      console.log(clubData.entries);
      const clubList = <any>[];
      clubData.entries.forEach((item:any)=>{
        clubList.push({id: item.set_in_context.club_id,
          name: item.text,
        });
      });
      return clubList;
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
    news: async ()=>{
      const data = await fetch("https://api.newsroom.co/walls?token=xgoo9jkoc2ee&count=30&channelId=663&tag=news");
      const newsData = await data.json();
      const newsList = <any>[];
      newsData._embedded.wallList.forEach((item:any)=>{
        console.log(item);
        newsList.push({
          id: item.id,
          title: item.title,
          leadText: item.leadText,
          slug: item.slug,
          image: item.featureImage,
          text: item.html,
        });
      });
      return newsList;
    },
  },
};
