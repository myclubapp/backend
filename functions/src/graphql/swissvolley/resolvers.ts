/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require("node-fetch");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {convert} = require("html-to-text");

import soap = require("soap");
const soapUrl = "https://myvolley.volleyball.ch/SwissVolley.wsdl";

export default {
  Query: {
    clubs: () => {
      return getClubs(); // 913245 "VBG Klettgau
    },

    teams: (parent: any, args: { clubId: string}, context: any, info: any) => {
      return getTeams(args.clubId);
    },
    /*

        team: (parent: any, args: { teamId: string}, context: any, info: any) => {
          return getTeam(args.teamId);
        },
    games: (parent: any, args: { id: string; season: string; }, context: any, info: any) => {
      return getGames(args.id, args.season);
    },
    clubGames: (parent: any, args: { id: string; season: string; }, context: any, info: any) => {
      return getClubGames(args.id, args.season);
    },
    seasons: () => {
      return getSeason();
    },
    rankings: (parent: any, args: { id: string; season: string; }, context: any, info: any) => {
      return getRankings(args.id, args.season);
    },*/
    news: () => {
      return getNews();
    },
  },
  Club: {
    teams(parent: any) {
      return getTeams(parent.id);
    },
  },
  /*
  Team: {
    games(parent: any, args: any, context: any, info: any) {
      console.log(parent, args);
      // console.log(info.fieldName);
      // Get Year from prev. selection.

      const data = info.operation.selectionSet.selections[0].arguments.find((element:any)=>{
        return element.kind === "Argument" && element.name.kind === "Name" && element.name.value === "season";
      });
      // console.log(JSON.stringify(data.value.value));


      // console.log(JSON.stringify(info.operation.selectionSet.selections[0].arguments[1].value.value));
      // console.log(JSON.stringify(info.path));
      // console.log(JSON.stringify(context));

      return getGames(parent.id, data.value.value);
    },
    rankings(parent: any, args: any, context: any, info: any) {
      const data = info.operation.selectionSet.selections[0].arguments.find((element:any)=>{
        return element.kind === "Argument" && element.name.kind === "Name" && element.name.value === "season";
      });
      // console.log(JSON.stringify(data.value.value));
      return getRankings(parent.id, data.value.value);
    },

    statistics(parent: any, args: any, context: any, info: any) {
      return getStatistics(parent.id);
    },
    details(parent: any, args: any, context: any, info: any) {
      return getTeam(parent.id);
    },
  },*/
};


async function getTeams(clubId: string) {
  const args = {
    getTeamsByClubRequest: clubId,
  };
  const teamList = < any > [];
  const client = await soap.createClientAsync(soapUrl);
  // Loop at list with Verband Ids.. #TODO
  const result = await client.getTeamsByClubAsync(args);
  result[0].getTeamsByClubResponse.item.forEach((item:any)=>{
    console.log(item);

    teamList.push({
      id: item.ID_team.$value,
      name: item.Caption.$value,
      gender: item.Gender.$value,
      clubId: item.Club_ID.$value,
      clubCaption: item.ClubCaption.$value,
      leagueCaption: item.LeagueCaption.$value,
      organisationCaption: item.OrganisationCaption.$value

    });
  });
  return teamList;
}
/*
async function getTeam(teamId: string) {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/teams/" + teamId );
  const teamData = await data.json();
  console.log(teamData);

  return {
    id: teamId,
    name: teamData.data.regions[0].rows[0].cells[0].text[0],
  };
}
*/
async function getClubs() {
/*
         value: "NATIONAL"
          label: "RVNO"
          label: "GSGL"
          label: "RVI"
          label: "RVZ"
          label: "RVA"
          label: "SVRW"
          label: "SVRF"
          value: "SVRBE"
*/
  const args = {
    keyword: "RVNO",
  };
  const clubList = < any > [];
  const client = await soap.createClientAsync(soapUrl);
  // Loop at list with Verband Ids.. #TODO
  const result = await client.getActiveClubsAsync(args);
  result[0].getActiveClubsResponse.item.forEach((item:any)=>{
    clubList.push({
      id: item.ID_club.$value,
      name: item.Caption.$value,
    });
  });
  return clubList;

  /* const data = await fetch("https://api.volleyball.ch/indoor/clubs");
  const clubData = await data.json();
  const clubList = < any > [];
  clubData.forEach((item: any) => {
    clubList.push({
      id: item.clubId,
      name: item.caption,
    });
  });
  return clubList; */
}
/*
async function getClubGames(clubId: string, season: string) {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/games?mode=club&season=" + season + "&club_id=" + clubId);
  const gameData = await data.json();
  const gameList = < any > [];
  gameData.data.regions[0].rows.forEach((item: any) => {
    gameList.push({
      id: item.link.ids[0],
    });
  });
  return gameList;
}


async function getGames(teamId: string, season: string) {
  const data = await fetch("https://api.volleyball.ch/indoor/games?region=SV&teamId=5365&includeCup=1");
  const gameData = await data.json();
  const gameList = < any > [];
  gameData.data.regions[0].rows.forEach((item: any) => {
    gameList.push({
      id: item.link.ids[0],
    });
  });
  return gameList;
}

async function getSeason() {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/seasons");
  const seasonData = await data.json();
  // console.log(seasonData.entries);
  const seasonList = < any > [];
  seasonData.entries.forEach((item: any) => {
    seasonList.push({
      id: item.set_in_context.season,
      name: item.text,
      season: item.set_in_context.season,
    });
  });
  return seasonList;
}

async function getRankings(teamId: string, season: string) {
  const data = await fetch("https://api.volleyball.ch/indoor/ranking/14458");
  const rankingData = await data.json();
  console.log(rankingData.entries);
  const rankingList = < any > [];
  rankingData.data.regions[0].rows.forEach((item: any) => {
    rankingList.push({
      id: item.data.team.id,
      name: item.data.team.name,
      ranking: item.data.rank,
    });
  });
  return rankingList;
}

async function getStatistics(teamId: string) {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/teams/" + teamId + "/statistics");
  const rankingData = await data.json();
  console.log(rankingData.entries);
  const rankingList = < any > [];

  return rankingList;
}
*/

// Top story https://api.newsroom.co/walls?token=1pdtktbc3ra5i&tag=top&channelId=484&count=9

async function getNews() {
  const data = await fetch("https://api.newsroom.co/walls?token=1pdtktbc3ra5i&count=20&tag=top,pin,!top,!pin&channelId=484");
  const newsData = await data.json();
  const newsList = < any > [];
  newsData._embedded.wallList.forEach((item: any) => {
    console.log(item);
    newsList.push({
      id: item.id,
      title: item.title,
      leadText: item.leadText,
      slug: item.slug,
      image: item.featureImage,
      text: convert(item.html, {
        wordwrap: 130,
      }),
      htmlText: item.html,
    });
  });
  return newsList;
}
