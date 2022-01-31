/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require("node-fetch");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {convert} = require("html-to-text");
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
    teams: async (clubId: string, season: string)=>{
      const data = await fetch("https://api-v2.swissunihockey.ch/api/teams?mode=by_club&club_id=" + clubId + "&season=" + season);
      const teamData = await data.json();
      console.log(teamData.entries);
      const teamList = <any>[];
      teamData.entries.forEach((item:any)=>{
        teamList.push({id: item.set_in_context.club_id,
          name: item.text,
        });
      });
      return teamList;
    },
    seasons: async ()=>{
      const data = await fetch("https://api-v2.swissunihockey.ch/api/seasons");
      const seasonData = await data.json();
      console.log(seasonData.entries);
      const seasonList = <any>[];
      seasonData.entries.forEach((item:any)=>{
        seasonList.push({id: item.set_in_context.season,
          name: item.text,
        });
      });
      return seasonList;
    },
    rankings: async (season: string, teamId: string)=>{
      const data = await fetch("https://api-v2.swissunihockey.ch/api/rankings?season=" + season + "&team_id=" + teamId);
      const rankingData = await data.json();
      console.log(rankingData.entries);
      const rankingList = <any>[];
      rankingData.entries.forEach((item:any)=>{
        rankingList.push({id: item.set_in_context.club_id,
          name: item.text,
        });
      });
      return rankingList;
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
          text: convert(item.html),
          htmlText: item.text,
        });
      });
      return newsList;
    },
  },
};
