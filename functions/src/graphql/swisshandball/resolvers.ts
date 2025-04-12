/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";

// import * as fetch from 'node-fetch';
import {logger} from 'firebase-functions';
// const {convert} = require("html-to-text");

import * as fs from 'fs';
const handballClubJSON = fs.readFileSync('./src/scheduler/utils/handball_clubs_with_teams_and_contact.json', 'utf8');
import {defineSecret} from 'firebase-functions/params';
import {onInit} from 'firebase-functions/v2/core';
import {SecretParam} from 'firebase-functions/lib/params/types.js';

let swisshandballToken: SecretParam | undefined;

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
  onInit(() => {
    swisshandballToken = defineSecret('SWISSHANDBALL_SH_' + clubId + '_TOKEN');
  });
  if (swisshandballToken) {
    logger.info('>> https://clubapi.handball.ch/rest/v1/clubs/' + clubId + '/teams');
    // const swisshandballToken = defineSecret('SWISSHANDBALL_SH_' + clubId + '_TOKEN');;
    // eslint-disable-next-line no-undef
    const data = await fetch('https://clubapi.handball.ch/rest/v1/clubs/' + clubId + '/teams', {
      headers: {'Authorization': 'Basic ' + swisshandballToken?.value() || ''},
    });

    const teamData = await data.json();
    // logger.info(teamData);
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
  onInit(() => {
    swisshandballToken = defineSecret('SWISSHANDBALL_SH_' + clubId + '_TOKEN');
  });
  if (swisshandballToken) {
    logger.info('>> https://clubapi.handball.ch/rest/v1/teams/' + teamId);
    // eslint-disable-next-line no-undef
    const data = await fetch('https://clubapi.handball.ch/rest/v1/teams/' + teamId, {
      headers: {'Authorization': 'Basic ' + swisshandballToken?.value() || ''},
    });
    const teamData = await data.json();
    // logger.info(teamData);

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
  // logger.info(clubData);
  const clubList = <any>[];
  for (const item of data) {
    // logger.info(item.halls);
    clubList.push({
      ...item,
      id: item.id,
      name: item.name,
      logo: `https://www.handball.ch/images/club/${item.id}.png?height=140&language=de-CH`,
      latitude: item.latitude,
      longitude: item.longitude,
      foundingYear: item.founding_year,
      // address: item.address,
      halls: item.halls || [],
      phone: item.phone,
      website: item.website,
      link_club: 'https://www.handball.ch' + item.club_link,
      link_location: item.google_maps_link,
      // address: addressArray,
    });
    //  }
  }
  return clubList;
}

async function getClub(clubId: string) {
  swisshandballToken = defineSecret('SWISSHANDBALL_SH_' + clubId + '_TOKEN');
  if (swisshandballToken) {
    logger.info('>> https://clubapi.handball.ch/rest/v1/clubs/' + clubId);
    // eslint-disable-next-line no-undef
    const data = await fetch('https://clubapi.handball.ch/rest/v1/clubs/' + clubId, {
      headers: {'Authorization': 'Basic ' + swisshandballToken?.value() || ''},
    });

    const clubData = await data.json();
    logger.info(clubData);

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
  swisshandballToken = defineSecret('SWISSHANDBALL_SH_' + clubId + '_TOKEN');
  if (swisshandballToken) {
    logger.info('>> https://clubapi.handball.ch/rest/v1/clubs/' + clubId + '/games');
    // eslint-disable-next-line no-undef
    const data = await fetch('https://clubapi.handball.ch/rest/v1/clubs/' + clubId + '/games', {
      headers: {'Authorization': 'Basic ' + swisshandballToken?.value() || ''},
    });
    const gameData = await data.json();
    gameData.forEach((item: any) => {
      // logger.info(item);
      gameList.push({

        id: item.gameId,
        gameNr: item.gameNr,
        name: item.gameTypeShort + ' ' + item.teamAName + ' - ' + item.teamBName,
        description: item.gameTypeLong + ' ' + item.teamAName + ' - ' + item.teamBName,

        dateTime: new Date(item.gameDateTime),
        time: item.gameDateTime.substr(11, 5),
        date: item.gameDateTime.substr(8, 2) + '.' + item.gameDateTime.substr(5, 2) + '.' + item.gameDateTime.substr(0, 4),
        languageId: item.languageId,

        teamHomeId: 'sh-' + item.teamAId,
        teamHome: item.teamAName,
        teamHomeLogo: `https://www.handball.ch/images/logo/${item.teamAId}.png?fallbackType=club&fallbackId=${item.clubTeamAId}&height=25&width=25&scale=canvas`, // item.cells[1].image.url,,
        teamHomeLogoText: 'Logo ' + item.teamAName,

        teamAwayId: 'sh-' + item.teamBId,
        teamAway: item.teamBName,
        teamAwayLogo: `https://www.handball.ch/images/logo/${item.teamBId}.png?fallbackType=club&fallbackId=${item.clubTeamBId}&height=25&width=25&scale=canvas`, // item.cells[1].image.url,,
        teamAwayLogoText: 'Logo ' + item.teamBName,

        clubTeamAId: 'sh-' + item.clubTeamAId,
        clubTeamBId: 'sh-' + item.clubTeamBId,

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

        referee1: '',
        referee2: '',

        gameStatusId: item.gameStatusId,
        gameStatus: item.gameStatus,
        roundNr: item.roundNr,

        spectators: item.spectators,

        result: item.teamAScoreFT + ':' + item.teamBScoreFT + '(' + item.teamAScoreHT + ':' + item.teamBScoreHT + ')',
      });
    });
  }
  return gameList;
}

async function getGames(teamId: string, clubId: string) {
  const gameList = <any>[];
  swisshandballToken = defineSecret('SWISSHANDBALL_SH_' + clubId + '_TOKEN');
  if (swisshandballToken) {
    logger.info('>> https://clubapi.handball.ch/rest/v1/teams/' + teamId + '/games');
    // eslint-disable-next-line no-undef
    const data = await fetch('https://clubapi.handball.ch/rest/v1/teams/' + teamId + '/games', {
      headers: {'Authorization': 'Basic ' + swisshandballToken?.value() || ''},
    });

    const gameData = await data.json();
    gameData.forEach((item: any) => {
      gameList.push({
        id: item.gameId,
        gameNr: item.gameNr,
        name: item.gameTypeShort + ' ' + item.teamAName + ' - ' + item.teamBName,
        description: item.gameTypeLong + ' ' + item.teamAName + ' - ' + item.teamBName,

        dateTime: new Date(item.gameDateTime),
        time: item.gameDateTime.substr(11, 5),
        date: item.gameDateTime.substr(8, 2) + '.' + item.gameDateTime.substr(5, 2) + '.' + item.gameDateTime.substr(0, 4),
        languageId: item.languageId,

        teamHomeId: 'sh-' + item.teamAId,
        teamHome: item.teamAName,
        teamHomeLogo: `https://www.handball.ch/images/logo/${item.teamAId}.png?fallbackType=club&fallbackId=${item.clubTeamAId}&height=25&width=25&scale=canvas`, // item.cells[1].image.url,,
        teamHomeLogoText: 'Logo ' + item.teamAName,

        teamAwayId: 'sh-' + item.teamBId,
        teamAway: item.teamBName,
        teamAwayLogo: `https://www.handball.ch/images/logo/${item.teamBId}.png?fallbackType=club&fallbackId=${item.clubTeamBId}&height=25&width=25&scale=canvas`, // item.cells[1].image.url,,
        teamAwayLogoText: 'Logo ' + item.teamBName,

        clubTeamAId: 'sh-' + item.clubTeamAId,
        clubTeamBId: 'sh-' + item.clubTeamBId,

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

        referee1: '',
        referee2: '',

        gameStatusId: item.gameStatusId,
        gameStatus: item.gameStatus,
        roundNr: item.roundNr,

        spectators: item.spectators,

        result: item.teamAScoreFT + ':' + item.teamBScoreFT + '(' + item.teamAScoreHT + ':' + item.teamBScoreHT + ')',
      });
    });
  }
  return gameList;
}


async function getRankings(teamId: string, clubId: string) {
  const rankingList = <any>[];
  swisshandballToken = defineSecret('SWISSHANDBALL_SH_' + clubId + '_TOKEN');
  if (swisshandballToken) {
    logger.info('>> https://clubapi.handball.ch/rest/v1/teams/' + teamId + '/group');
    // eslint-disable-next-line no-undef
    const data = await fetch('https://clubapi.handball.ch/rest/v1/teams/' + teamId + '/group', {
      headers: {'Authorization': 'Basic ' + swisshandballToken?.value() || ''},
    });

    const rankingData = await data.json();
    logger.info(JSON.stringify(rankingData));

    rankingData.ranking.forEach((item: any) => {
      rankingList.push({
        id: item.teamId,
        name: item.teamName, // 2 teamname

        teamId: 'sh-' + item.teamId,
        clubId: 'sh-' + item.clubId,

        /* "groupText": "MU19E",
        "leagueLong": "Junioren U19 Elite",
        "leagueShort": "MU19E",
        "leagueId": 3220,
        "languageId": 1,
        "modus": "14 Teams in einer 2-fach Runde",
        */

        image: `https://www.handball.ch/images/logo/${item.teamId}.png?fallbackType=club&fallbackId=${item.clubId}&height=25&width=25&scale=canvas`, // item.cells[1].image.url,
        games: item.totalGames, // Sp Spiele 3
        gamesSoW: '', // SoW Spiele ohne Wertung 4
        wins: item.totalWins, // S Siege 5
        loss: item.totalLoss, // N Niederlage 7
        draw: item.totalDraws, // U Unentschieden 6
        goals: item.totalPoints, // T Tore 8
        goalDifference: item.totalScoresPlus, // TD Tordifferenz 9
        pointQuotient: item.totalScoresMinus, // PQ 10
        points: item.totalPoints, // P 11
        ranking: item.rank, // 0
        season: '2024',
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
  // eslint-disable-next-line no-undef
  const response = await fetch('https://www.handball.ch/Umbraco/Api/Entities/Collect', {
    'credentials': 'include',
    'headers': {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0',
      'Accept': '*/*',
      'Accept-Language': 'de-CH',
      'content-type': 'application/json',
      'Sec-GPC': '1',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Priority': 'u=4',
    },
    'referrer': 'https://www.handball.ch/de/news/',
    'body': '[{"id":"63284de-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"link"},{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"lead"}]},{"id":"umb://document/79edadac9feb41a69ba5f9611cb5d1c1de-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"umb://document/6a49c284f70e4f12a26239f792323a55de-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"umb://document/0db9ebc11ff44a13ba365f31a16e7e41de-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"umb://document/3c7a8f73385a46169feb7a82c2c784cbde-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"umb://document/a198ceebd3c8404bb421f4c6dbe0008ade-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"umb://document/c40e03d3590b4d0bbac7ec244680aaa6de-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"umb://document/90aafef98a1d4b8985a1f432a136530ade-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"umb://document/b9e432a6a02b45b98c692b2446047500de-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"umb://document/0dff523774a64effb8ff657733d8fe9ade-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"umb://document/94122245e9d942dda89f63190346ea55de-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"umb://document/ee8ff0fcd3c0470ab03a71291db82a8cde-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"umb://document/3a144ab739654d6cb1f5840e128e61f5de-CH","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"image"},{"name":"subtitle"},{"name":"title"},{"name":"image"},{"name":"lead"},{"name":"link"}]},{"id":"63277de-CH_0","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"subtitle"},{"name":"title"},{"name":"lead"},{"name":"link"}]},{"id":"63277de-CH_1","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"subtitle"},{"name":"title"},{"name":"lead"},{"name":"link"}]},{"id":"63277de-CH_2","type":"news","entityId":null,"categories":"","clubs":"","requestUrl":"/de/news/","fields":[{"name":"subtitle"},{"name":"title"},{"name":"lead"},{"name":"link"}]}]',
    'method': 'POST',
    'mode': 'cors',
  });
  const data = await response.json();

  data.forEach((item: { fields: any[]; id: string; type: string }) => {
    const getField = (name: string) => item.fields.find((f) => f.name === name)?.value || null;

    const subtitleRaw = getField('subtitle') || '';
    const subtitleClean = subtitleRaw.replace(/&nbsp;/g, ' ').replace(/&bull;/g, '•');
    const dateStr = subtitleClean.split('•')?.[1]?.trim() || null;

    // Convert from "dd.mm.yyyy" to ISO format
    let formattedDate = null;
    if (dateStr && /^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('.');
      formattedDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
    }
    const rawId = item.id.replace(/^umb:\/\/document\//, '').replace(/de-CH$/, '');

    newsList.push({
      id: rawId,
      title: getField('title'),
      leadText: getField('lead'),
      date: formattedDate,
      slug: 'https://www.handball.ch' + getField('link'),
      image: 'https://www.handball.ch' + getField('image'),
      text: getField('lead'),
      htmlText: getField('lead'),
      tags: [item.type],
      author: 'Handball Schweiz',
      authorImage: 'https://www.handball.ch/media/pund1t2l/logo.png?rxy=0.5%2C0.5&height=340',
      url: 'https://www.handball.ch' + getField('link'),
    });
  });
  return newsList;
}
