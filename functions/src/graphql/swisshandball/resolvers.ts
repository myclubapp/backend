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
const headers: any = {"Authorization": "Basic " + functions.config().swisshandball.token};

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
      return getGames(parent.id);
    },
    rankings(parent: any, args: any, context: any, info: any) {
      return getRankings(parent.id);
    },
    details(parent: any, args: any, context: any, info: any) {
      return getTeam(parent.id);
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
      teamId: string
    }, context: any, info: any) => {
      return getTeam(args.teamId);
    },
    teams: (parent: any, args: {
      clubId: string;season: string;
    }, context: any, info: any) => {
      return getTeams(args.clubId);
    },
    games: (parent: any, args: {
      teamId: string;season: string;
    }, context: any, info: any) => {
      return getGames(args.teamId);
    },
    clubGames: (parent: any, args: {
      clubId: string;season: string;
    }, context: any, info: any) => {
      return getClubGames(args.clubId);
    },
    rankings: (parent: any, args: {
      id: string;season: string;
    }, context: any, info: any) => {
      return getRankings(args.id);
    },
    news: () => {
      return getNews();
    },
  },
};

async function getTeams(clubId: string) {
  const teamList = < any > [];
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

async function getTeam(teamId: string) {
  // teamId is wrong -> change to clubId for token fetch
  const token = functions.config().swisshandball["sh-" + teamId].token;
  if (token) {
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
  const clubList = < any > [];
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
  const data = await fetch("https://clubapi.handball.ch/rest/v1/clubs/" + clubId, {
    headers: headers,
  });
  const clubData = await data.json();
  console.log(clubData);

  /* const contactDataRequest = await fetch("https://www.handball.ch/Umbraco/Api/MatchCenter/Query", {
    "headers": {
      "content-type": "application/json",
      "__RequestVerificationToken": "Wtq36irQvaqcaf7CxprqiNm5KqIj1lV6FUmjv5oAVHr12jELhomIm-pah3Z-XEZAoUOxLmsI2c6vmZp_xUZr5arLqCY1",
      "Cookie": "__RequestVerificationToken=QQ0HjCIIvHqUxo1Ur6KE8WkBbCet-QkH6YqDvmcMrKlsGBonyZM7Bq37_1uT2SoeDP7wZ8Oot7r6P-x6SE60X2nQ8IQ1; _dd_s=logs=1&id=0ccf55d7-fd2d-44f3-ac4c-b033b19d4da9&created=1649076359310&expire=1649077394496",
    },
    "body": `{"operationName":"getClubContactDetail","variables":{"clubId":"${clubId}"},"query":"query getClubContactDetail($clubId: Int) {\n  clubContactDetail(clubId: $clubId) {\n    name\n    zipCode\n    city\n    canton\n    email\n    phone\n    latitude\n    longitude\n    foundingYear\n    website\n    contactPerson {\n      firstName\n      lastName\n      phone\n      email\n      __typename\n    }\n    teams {\n      name\n      email\n      __typename\n    }\n    venues {\n      venueId\n      name\n      __typename\n    }\n    __typename\n  }\n}\n"}`,
    "method": "POST",
    "mode": "cors",
  });

  const contactData = await contactDataRequest.json();
  // console.log(">>>" + JSON.stringify(contactData));
  const contact = contactData.data.clubContactDetail[0];
  // console.log(JSON.stringify(contact));

  const addressArray = [{
    id: clubId,
    firstName: contact.contactPerson.firstName,
    lastName: contact.contactPerson.lastName,
    street: "",
    number: "",
    postalcode: contact.zipCode,
    city: contact.city,
    email: contact.contactPerson.email,
    phone: contact.contactPerson.phone,
  }, {
    id: clubId + "-2",
    firstName: contact.contactPerson.firstName,
    lastName: contact.contactPerson.lastName,
    street: "",
    number: "",
    postalcode: contact.zipCode,
    city: contact.city,
    email: contact.email,
    phone: contact.phone,
  }];
  */
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
}


async function getClubGames(clubId: string) {
  const data = await fetch("https://clubapi.handball.ch/rest/v1/clubs/" + clubId + "/games", {
    headers: headers,
  });
  const gameData = await data.json();
  const gameList = < any > [];
  gameData.forEach((item: any) => {
    console.log(item);
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
  return gameList;
}

async function getGames(teamId: string) {
  const data = await fetch("https://clubapi.handball.ch/rest/v1/teams/" + teamId + "/games", {
    headers: headers,
  });
  const gameData = await data.json();
  const gameList = < any > [];
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
    /*     {
        "gameId": 423129,
        "gameNr": 1795,
        "gameDateTime": "2021-09-04T15:00:00",
        "gameTypeLong": "Hallenmeisterschaft",
        "gameTypeShort": "MS",
        "teamAName": "Kadetten Schaffhausen",
        "teamBName": "SG Arbon Lakers",
        "leagueLong": "Junioren U13 Inter",
        "leagueShort": "MU13I",
        "round": null,
        "gameStatus": "Gespielt",
        "teamAScoreHT": 21,
        "teamBScoreHT": 3,
        "teamAScoreFT": 47,
        "teamBScoreFT": 7,
        "venue": "Schaffhausen BBC Arena B",
        "venueAddress": "Schweizersbildstrasse 10",
        "venueZip": 8207,
        "venueCity": "Schaffhausen",
        "spectators": 45,
        "roundNr": 5
    }, */
  });
  return gameList;
}

// async function getGame(gameId: string) {
// DOES NOT EXIST
/* const data = await fetch("https://clubapi.handball.ch/rest/v1/games/" + gameId, {
    headers: headers,
  });
  const gameData = await data.json();

  return {
    id: gameData.gameId,
    name: gameData.data.title,
    description: gameData.data.subtitle,

    teamHomeId: "sh-",
    teamHome: gameData.data.teamAName,
    teamHomeLogo: "",
    teamHomeLogoText: "Logo " + gameData.data.teamAName,

    teamAwayId: "sh-",
    teamAway: gameData.data.teamBName,
    teamAwayLogo: "",
    teamAwayLogoText: "Logo " + gameData.data.teamBName,

    liga: gameData.data.leagueShort,
    ligaText: gameData.data.leagueLong,

    venue: gameData.data.venue,
    venueAddress: gameData.data.venueAddress,
    venueZip: gameData.data.venueZip,
    venueCity: gameData.data.venueCity,

    referee1: "",
    referee2: "",

    spectators: gameData.data.spectators,
    result: gameData.data.teamAScoreFT + ":" + gameData.data.teamBScoreFT + "(" + gameData.data.teamAScoreHT + ":" + gameData.data.teamBScoreHT + ")",
  };

  /*     {
      "gameId": 423129,
      "gameNr": 1795,
      "gameDateTime": "2021-09-04T15:00:00",
      "gameTypeLong": "Hallenmeisterschaft",
      "gameTypeShort": "MS",
      "teamAName": "Kadetten Schaffhausen",
      "teamBName": "SG Arbon Lakers",
      "leagueLong": "Junioren U13 Inter",
      "leagueShort": "MU13I",
      "round": null,
      "gameStatus": "Gespielt",
      "teamAScoreHT": 21,
      "teamBScoreHT": 3,
      "teamAScoreFT": 47,
      "teamBScoreFT": 7,
      "venue": "Schaffhausen BBC Arena B",
      "venueAddress": "Schweizersbildstrasse 10",
      "venueZip": 8207,
      "venueCity": "Schaffhausen",
      "spectators": 45,
      "roundNr": 5
  }, */
// }


async function getRankings(teamId: string) {
  const data = await fetch("https://clubapi.handball.ch/rest/v1/teams/" + teamId + "/group", {
    headers: headers,
  });
  const rankingData = await data.json();
  console.log(JSON.stringify(rankingData));
  const rankingList = < any > [];
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

      image: "", // item.cells[1].image.url,
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
  return rankingList;
}

async function getNews() {
  const newsList = < any > [];
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
