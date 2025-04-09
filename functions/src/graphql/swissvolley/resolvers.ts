/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";

// import fetch from 'node-fetch';
import {logger} from 'firebase-functions';
import {defineSecret} from 'firebase-functions/params';
// import {onInit} from 'firebase-functions/v2/core';
import {SecretParam} from 'firebase-functions/lib/params/types.js';
let swissvolleyToken: SecretParam | undefined;

export default {
  SwissVolley: {
    news: () => {
      return getNews();
    },
    clubs: (parent: any, args: any, context: any, info: any) => {
      return getClubs();
    },
    club: (parent: any, args: { clubId: string }, context: any, info: any) => {
      return getClub(args.clubId); // 913245 "VBG Klettgau
    },
    teams: (parent: any, args: { clubId: string}, context: any, info: any) => {
      return getTeams(args.clubId);
    },
    team: (parent: any, args: { teamId: string }, context: any, info: any) => {
      return getTeam(args.teamId);
    },


    games: (parent: any, args: {teamId: string}, context: any, info: any) => {
      return getGames(args.teamId);
    },
    rankings: (parent: any, args: {groupId: string}, context: any, info: any) => {
      return getRankings(args.groupId);
    },
    associations: (parent: any, args: any, context: any, info: any) => {
      return getAssociations();
    },


  },
  Club: {
    teams(parent: any) {
      return getTeams(parent.id);
    },
  },
  Team: {
    games(parent: any, args: any, context: any, info: any) {
      return getGames(parent.id);
    },
    rankings(parent: any, args: any, context: any, info: any) {
      return getRankings(parent.id);
    },
  },
  Game: {
    details(parent: any, args: any, context: any, info: any) {
      return getGame(parent.id);
    },
  },

  Association: {
    clubs(parent: any, args: any, context: any, info: any) {
      return getClubs();
    },
  },
};
// https://swissvolley.docs.apiary.io/#reference/indoor/season-collection/list-seasons
async function getAssociations() {
  return [
    {id: 'NATIONAL', name: 'NATIONAL'},
    {id: 'RVNO', name: 'RVNO'},
    {id: 'GSGL', name: 'GSGL'},
    {id: 'RVI', name: 'RVI'},
    {id: 'RVZ', name: 'RVZ'},
    {id: 'RVA', name: 'RVA'},
    {id: 'SVRW', name: 'SVRW'},
    {id: 'SVRF', name: 'SVRF'},
    {id: 'SVRBE', name: 'SVRBE'},
    {id: 'SV', name: 'SV'},
    {id: 'SVRG', name: 'SVRG'},
    {id: 'SVRV', name: 'SVRV'},
    {id: 'SVRN', name: 'SVRN'},
    {id: 'SVRJS', name: 'SVRJS'},
    {id: 'SVRS', name: 'SVRS'},
    {id: 'SVRBA', name: 'SVRBA'},
    {id: 'SVRA', name: 'SVRA'},
    {id: 'SVRI', name: 'SVRI'},
    {id: 'SVRZ', name: 'SVRZ'},
    {id: 'SVRNO', name: 'SVRNO'},
    {id: 'SVRGSGL', name: 'SVRGSGL'},
    {id: 'SVRT', name: 'SVRT'},
  ];
}

async function getTeam(teamId: string) {
  // https://api.volleyball.ch/indoor/teams/2404
  swissvolleyToken = defineSecret('SWISSVOLLEY_TOKEN');
  logger.info('>> https://api.volleyball.ch/indoor/teams/' + teamId);
  // eslint-disable-next-line no-undef
  const data = await fetch('https://api.volleyball.ch/indoor/teams/' + teamId, {
    headers: {
      // 'Accept': 'application/json',
      'Authorization': swissvolleyToken?.value() || '',
      'Content-Type': 'application/json',
    },
  });
  const teamData = await data.json();
  const league = teamData.league;
  delete teamData.league;
  const club = teamData.club;
  delete teamData.club;

  return {
    ...league,
    ...club,
    ...teamData,
    id: teamData.teamId,
    name: teamData.caption,
    logo: teamData.teamlogo,
    website: teamData.website,
  };
}

async function getTeams(clubId: string) {
  try {
    swissvolleyToken = defineSecret('SWISSVOLLEY_TOKEN');
    logger.info('>> https://api.volleyball.ch/indoor/teams?clubId=' + clubId);
    // eslint-disable-next-line no-undef
    const data = await fetch('https://api.volleyball.ch/indoor/teams?clubId=' + clubId, {
      method: 'GET',
      // redirect: "follow",
      headers: {
        'Content-Type': 'application/json',
        // 'Accept': 'application/json',
        'Authorization': swissvolleyToken?.value() || '',
      },
    });

    // Check if the response is okay before proceeding
    if (!data.ok) {
      // throw new Error(`HTTP error! Status: ${data.status}`);
      logger.info(`HTTP error! Status: ${data.status} ${data.statusText}`);
      return [];
    }

    const teamListData = await data.json();
    const teamList = < any > [];
    teamListData.forEach((item: any) => {
      const league = item.league;
      delete item.league;
      const club = item.club;
      delete item.club;

      teamList.push({
        ...item,
        ...league,
        ...club,
        'id': item.teamId,
        'liga': `${league.caption} - ${club.gender}`,
        'name': item.caption,
        'logo': item.teamlogo,
      });
    });
    return teamList;
  } catch (error) {
    logger.error('Error fetching club data:', error);
    return []; // Return an empty array or handle the error as needed
  }
}

function getClub(clubId: string) {
  logger.info('not needed');
}
// https://swissvolley.docs.apiary.io/#reference/indoor/clubs-collection/list-clubs
// https://api.volleyball.ch/indoor/clubs?region=SVRBE&skipClubsWithoutAtLeast1ContactData=false
async function getClubs(): Promise<any[]> {
  try {
    swissvolleyToken = defineSecret('SWISSVOLLEY_TOKEN');
    // logger.info('> swissvolleyToken', swissvolleyToken?.value());
    // eslint-disable-next-line no-undef
    const data = await fetch('https://api.volleyball.ch/indoor/clubs', {
      headers: {
        // 'Accept': 'application/json',
        'Authorization': swissvolleyToken?.value() || '',
        'Content-Type': 'application/json',
      },
    });

    // Check if the response is okay before proceeding
    if (!data.ok) {
      // throw new Error(`HTTP error! Status: ${data.status}`);
      logger.info(`HTTP error! Status: ${data.status} ${data.statusText}`);
      return [];
    }

    const clubData = await data.json();
    const clubList: {
      contact: any;
      mainHall: any; id: any; name: any; website: any; clubId: any; caption: any;
}[] = [];

    clubData.forEach((item: { clubId: any; caption: any; website: any; }) => {
      return clubList.push({
        ...item,
        id: item.clubId,
        name: item.caption,
        website: item.website,
        contact: undefined,
        mainHall: undefined,
      });
    });

    return clubList;
  } catch (error) {
    logger.error('Error fetching club data:', error);
    return []; // Return an empty array or handle the error as needed
  }
}
async function getGames(teamId: string) {
  const gameList = < any > [];
  swissvolleyToken = defineSecret('SWISSVOLLEY_TOKEN');
  logger.info('>> https://api.volleyball.ch/indoor/games?teamId=' + teamId + '&includeCup=1');

  // eslint-disable-next-line no-undef
  const data = await fetch('https://api.volleyball.ch/indoor/games?teamId=' + teamId + '&includeCup=1', { // region=SVRNO& not needed
    headers: {
      // 'Accept': 'application/json',
      'Authorization': swissvolleyToken?.value() || '',
      'Content-Type': 'application/json',
    },
  });
  const gameData = await data.json();

  gameData.forEach((item: any) => {
    gameList.push({
      ...item,
      id: item.gameId,
      date: item.playDate,
    });
  });
  return gameList;
}

async function getGame(gameId: string) {
  logger.info('not working anymore');
}

async function getRankings(groupId: string) {
  // https://api.volleyball.ch/indoor/ranking/24319
  swissvolleyToken = defineSecret('SWISSVOLLEY_TOKEN');
  logger.info('>> https://api.volleyball.ch/indoor/ranking/' + groupId);
  // eslint-disable-next-line no-undef
  const data = await fetch('https://api.volleyball.ch/indoor/ranking/' + groupId, {
    headers: {
      // 'Accept': 'application/json',
      'Authorization': swissvolleyToken?.value() || '',
      'Content-Type': 'application/json',
    },
  });
  const rankingData = await data.json();
  const rankingList = < any > [];
  rankingData.forEach((item: any) => {
    rankingList.push({
      ...item,
      id: item.teamId,
      name: item.teamCaption,
      ranking: item.rank,
      wins: item.wins,
      loss: item.defeats,
      points: item.points,
    });
  });
  return rankingList;
}


// Top story https://api.newsroom.co/walls?token=1pdtktbc3ra5i&tag=top&channelId=484&count=9

async function getNews() {
// eslint-disable-next-line no-undef
  const response = await fetch('https://www.volleyball.ch/de/news', {
    credentials: 'include',
    headers: {
      'Accept': 'text/x-component',
      'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
      'Next-Action': 'f23de5cb1c55c3d37d9bd899db66b0ee3dc3fed2',
      'Next-Router-State-Tree': '%5B%22%22%2C%7B%22children%22%3A%5B%5B%22slug%22%2C%22de%2Fnews%22%2C%22oc%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Fde%2Fnews%22%2C%22refresh%22%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
      'Content-Type': 'text/plain;charset=UTF-8',
      'Sec-GPC': '1',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Priority': 'u=0',
    },
    referrer: 'https://www.volleyball.ch/de/news',
    body: '["5a3ac054-84a2-47fc-946c-adb1a14be756","","de_CH",0,30]',
    method: 'POST',
    mode: 'cors',
  });

  const rawText = await response.text();

  // Match the line starting with 1: and capture the JSON object
  const match = rawText.match(/1:\s*({[\s\S]*})/);
  if (!match) {
    throw new Error('Failed to parse response');
  }

  let parsed;
  try {
    parsed = JSON.parse(match[1]);
  } catch (e: any) {
    throw new Error('Failed to parse JSON from match: ' + e.message);
  }

  const articles = parsed?.data || [];

  const newsList = [];

  for (const item of articles) {
    logger.info(item.title);
    const imagePath = item.imagorImageObject?.src || item.teaserImage?.uri;

    newsList.push({
      id: item.identifier,
      title: item.title,
      leadText: item.leadText,
      date: item.date,
      slug: item.uri,
      image: imagePath,
      text: item.leadText, // Full article content not provided; using leadText as fallback
      htmlText: item.leadText, // Same as above
      tags: item.topicsData?.map((tag: { title: any; }) => tag.title),
      author: item.teaserImage?.copyrightNotice || 'Swiss Volley',
      authorImage: '', // Not available in the payload
      url: `https://www.volleyball.ch${item.uri}`,
    });
  }

  return newsList;
}
