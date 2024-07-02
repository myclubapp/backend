/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require("node-fetch");
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const {convert} = require("html-to-text");

import fs = require("fs");
const handballClubJSON = fs.readFileSync("./src/scheduler/utils/handball_clubs_with_teams_and_contact.json", "utf8");

import * as functions from "firebase-functions";
// const headers: any = {"Authorization": "Basic " + functions.config().swisshandball.token};

export default {

  Club: {
    teams(parent: any, args: any, context: any, info: any) {
      return getTeams(parent.id);
    },
    games(parent: any, args: any, context: any, info: any) {
      return getClubGames(parent.id);
    },
  },
  Team: {
    games(parent: any, args: any, context: any, info: any) {
      return getGames(parent.id, parent.clubId);
    },
    rankings(parent: any, args: any, context: any, info: any) {
      return getRankings(parent.id, parent.clubId);
    },
    details(parent: any, args: any, context: any, info: any) {
      return getTeam(parent.id, parent.clubId);
    },
  },

  SwissHandball: {
    clubs: () => {
      return getClubs();
    },
    club: (parent: any, args: {
      clubId: string
    }, context: any, info: any) => {
      return getClub(args.clubId);
    },
    team: (parent: any, args: {
      teamId: string; clubId: string;
    }, context: any, info: any) => {
      return getTeam(args.teamId, args.clubId);
    },
    teams: (parent: any, args: {
      clubId: string; season: string;
    }, context: any, info: any) => {
      return getTeams(args.clubId);
    },
    games: (parent: any, args: {
      teamId: string; season: string; clubId: string;
    }, context: any, info: any) => {
      return getGames(args.teamId, args.clubId);
    },
    clubGames: (parent: any, args: {
      clubId: string; season: string;
    }, context: any, info: any) => {
      return getClubGames(args.clubId);
    },
    rankings: (parent: any, args: {
      id: string; season: string; clubId: string;
    }, context: any, info: any) => {
      return getRankings(args.id, args.clubId);
    },
    news: () => {
      return getNews();
    },
  },
};

async function getTeams(clubId: string) {
  const teamList = <any>[];
  if (functions.config().swisshandball["sh-" + clubId] && functions.config().swisshandball["sh-" + clubId].token) {
    const token = functions.config().swisshandball["sh-" + clubId].token;
    const data = await fetch("https://clubapi.handball.ch/rest/v1/clubs/" + clubId + "/teams", {
      headers: {"Authorization": "Basic " + token},
    });

    const teamData = await data.json();
    // console.log(teamData);
    for (const item of teamData) {
      // teamData.forEach((item: any) => {
      teamList.push({
        id: item.teamId,
        name: item.teamName,

        logo: `https://www.handball.ch/images/logo/${item.teamId}.png?fallbackType=club&fallbackId=${clubId}&height=25&width=25&scale=canvas`,
        liga: item.groupText,

        clubId: item.clubId,
        clubName: item.clubName,

        groupId: item.groupId,
        groupText: item.groupText,

        leagueId: item.leagueId,
        leagueLong: item.leagueLong,
        leagueShort: item.leagueShort,
      });
    }
  }

  return teamList;
}

async function getTeam(teamId: string, clubId: string) {
  if (functions.config().swisshandball["sh-" + clubId] && functions.config().swisshandball["sh-" + clubId].token) {
    const token = functions.config().swisshandball["sh-" + clubId].token;
    const data = await fetch("https://clubapi.handball.ch/rest/v1/teams/" + teamId, {
      headers: {"Authorization": "Basic " + token},
    });
    const teamData = await data.json();
    // console.log(teamData);

    return {
      id: teamId,
      name: teamData.teamName,
    };
  } else {
    return null;
  }
}
async function getClubs() {
  const data: Array<any> = JSON.parse(handballClubJSON);
  // console.log(clubData);
  const clubList = <any>[];
  for (const item of data) {
    clubList.push({
      id: item.id,
      name: item.name,
      logo: `https://www.handball.ch/images/club/${item.id}.png?height=140&language=de-CH`,
      latitude: item.latitude,
      longitude: item.longitude,
      foundingYear: item.founding_year,
      address: item.address,
      phone: item.phone,
      website: item.website,
      link_club: "https://www.handball.ch" + item.club_link,
      link_location: item.google_maps_link,
      // address: addressArray,
    });
    //  }
  }
  return clubList;
}

async function getClub(clubId: string) {
  if (functions.config().swisshandball["sh-" + clubId] && functions.config().swisshandball["sh-" + clubId].token) {
    const token = functions.config().swisshandball["sh-" + clubId].token;
    const data = await fetch("https://clubapi.handball.ch/rest/v1/clubs/" + clubId, {
      headers: {"Authorization": "Basic " + token},
    });

    const clubData = await data.json();
    console.log(clubData);

    return {
      id: clubId,
      name: clubData.clubName,
      logo: `https://www.handball.ch/images/club/${clubId}.png?height=140&language=de-CH`,
      /* website: contact.website || "",
        latitude: contact.latitude || "",
        longitude: contact.longitude || "",
        foundingYear: contact.foundingYear || "",
        address: addressArray, */
    };
  } else {
    return null;
  }
}


async function getClubGames(clubId: string) {
  const gameList = <any>[];
  if (functions.config().swisshandball["sh-" + clubId] && functions.config().swisshandball["sh-" + clubId].token) {
    const token = functions.config().swisshandball["sh-" + clubId].token;
    const data = await fetch("https://clubapi.handball.ch/rest/v1/clubs/" + clubId + "/games", {
      headers: {"Authorization": "Basic " + token},
    });
    const gameData = await data.json();
    gameData.forEach((item: any) => {
      // console.log(item);
      gameList.push({

        id: item.gameId,
        gameNr: item.gameNr,
        name: item.gameTypeShort + " " + item.teamAName + " - " + item.teamBName,
        description: item.gameTypeLong + " " + item.teamAName + " - " + item.teamBName,

        date: new Date(item.gameDateTime),
        time: new Date(item.gameDateTime),
        languageId: item.languageId,

        teamHomeId: "sh-" + item.teamAId,
        teamHome: item.teamAName,
        teamHomeLogo: "",
        teamHomeLogoText: "Logo " + item.teamAName,

        teamAwayId: "sh-" + item.teamBId,
        teamAway: item.teamBName,
        teamAwayLogo: "",
        teamAwayLogoText: "Logo " + item.teamBName,

        clubTeamAId: "sh-" + item.clubTeamAId,
        clubTeamBId: "sh-" + item.clubTeamBId,

        gameTypeLong: item.gameTypeLong,
        gameTypeShort: item.gameTypeShort,
        gameTypeId: item.gameTypeId,

        liga: item.leagueShort,
        ligaText: item.leagueLong,

        groupId: item.groupId,
        groupCupText: item.groupCupText,

        venue: item.venue,
        venueAddress: item.venueAddress,
        venueZip: item.venueZip,
        venueCity: item.venueCity,

        referee1: "",
        referee2: "",

        gameStatusId: item.gameStatusId,
        gameStatus: item.gameStatus,
        roundNr: item.roundNr,

        spectators: item.spectators,

        result: item.teamAScoreFT + ":" + item.teamBScoreFT + "(" + item.teamAScoreHT + ":" + item.teamBScoreHT + ")",
      });
    });
  }
  return gameList;
}

async function getGames(teamId: string, clubId: string) {
  const gameList = <any>[];
  if (functions.config().swisshandball["sh-" + clubId] && functions.config().swisshandball["sh-" + clubId].token) {
    const token = functions.config().swisshandball["sh-" + clubId].token;
    const data = await fetch("https://clubapi.handball.ch/rest/v1/teams/" + teamId + "/games", {
      headers: {"Authorization": "Basic " + token},
    });

    const gameData = await data.json();
    gameData.forEach((item: any) => {
      gameList.push({
        id: item.gameId,
        gameNr: item.gameNr,
        name: item.gameTypeShort + " " + item.teamAName + " - " + item.teamBName,
        description: item.gameTypeLong + " " + item.teamAName + " - " + item.teamBName,

        date: new Date(item.gameDateTime),
        time: new Date(item.gameDateTime),
        languageId: item.languageId,

        teamHomeId: "sh-" + item.teamAId,
        teamHome: item.teamAName,
        teamHomeLogo: "",
        teamHomeLogoText: "Logo " + item.teamAName,

        teamAwayId: "sh-" + item.teamBId,
        teamAway: item.teamBName,
        teamAwayLogo: "",
        teamAwayLogoText: "Logo " + item.teamBName,

        clubTeamAId: "sh-" + item.clubTeamAId,
        clubTeamBId: "sh-" + item.clubTeamBId,

        gameTypeLong: item.gameTypeLong,
        gameTypeShort: item.gameTypeShort,
        gameTypeId: item.gameTypeId,

        liga: item.leagueShort,
        ligaText: item.leagueLong,

        groupId: item.groupId,
        groupCupText: item.groupCupText,

        venue: item.venue,
        venueAddress: item.venueAddress,
        venueZip: item.venueZip,
        venueCity: item.venueCity,

        referee1: "",
        referee2: "",

        gameStatusId: item.gameStatusId,
        gameStatus: item.gameStatus,
        roundNr: item.roundNr,

        spectators: item.spectators,

        result: item.teamAScoreFT + ":" + item.teamBScoreFT + "(" + item.teamAScoreHT + ":" + item.teamBScoreHT + ")",
      });
    });
  }
  return gameList;
}


async function getRankings(teamId: string, clubId: string) {
  const rankingList = <any>[];
  if (functions.config().swisshandball["sh-" + clubId] && functions.config().swisshandball["sh-" + clubId].token) {
    const token = functions.config().swisshandball["sh-" + clubId].token;
    const data = await fetch("https://clubapi.handball.ch/rest/v1/teams/" + teamId + "/group", {
      headers: {"Authorization": "Basic " + token},
    });

    const rankingData = await data.json();
    console.log(JSON.stringify(rankingData));

    rankingData.ranking.forEach((item: any) => {
      rankingList.push({
        id: item.teamId,
        name: item.teamName, // 2 teamname

        teamId: "sh-" + item.teamId,
        clubId: "sh-" + item.clubId,

        /* "groupText": "MU19E",
        "leagueLong": "Junioren U19 Elite",
        "leagueShort": "MU19E",
        "leagueId": 3220,
        "languageId": 1,
        "modus": "14 Teams in einer 2-fach Runde",
        */

        image: `https://www.handball.ch/images/logo/${item.teamId}.png?fallbackType=club&fallbackId=${item.clubId}&height=25&width=25&scale=canvas`, // item.cells[1].image.url,
        games: item.totalGames, // Sp Spiele 3
        gamesSoW: "", // SoW Spiele ohne Wertung 4
        wins: item.totalWins, // S Siege 5
        loss: item.totalLoss, // N Niederlage 7
        draw: item.totalDraws, // U Unentschieden 6
        goals: item.totalPoints, // T Tore 8
        goalDifference: item.totalScoresPlus, // TD Tordifferenz 9
        pointQuotient: item.totalScoresMinus, // PQ 10
        points: item.totalPoints, // P 11
        ranking: item.rank, // 0
        season: "",
        title: rankingData.leagueLong,
      });

      /* {
        "rank": 1,
        "teamName": "Kadetten Schaffhausen",
        "totalPoints": 12,
        "totalPointsPerGame": 2.000,
        "totalWins": 6,
        "totalLoss": 0,
        "totalDraws": 0,
        "totalScoresPlus": 273,
        "totalScoresMinus": 119,
        "totalGames": 6,
        "totalScoresDiff": 154
    }, */
    });
  }
  return rankingList;
}

async function getNews() {
  const newsList = <any>[];
  // const data = await fetch("https://www.handball.ch/Umbraco/Api/Entities/Collect");
  // const newsData = await data.json();
  /* newsData._embedded.wallList.forEach((item: any) => {
    // console.log(item);
    newsList.push({
      id: item.id,
      title: item.title,
      leadText: item.leadText,
      date: item.date,
      slug: item.slug,
      image: item.media[2].url || item.featuredImage,
      text: convert(item.html, {
        wordwrap: 130,
      }),
      htmlText: item.text,
      tags: item.tags,
      author: item.author.realName,
      authorImage: item.author.image,
      url: item.url,
    });
  });*/
  return newsList;
}
