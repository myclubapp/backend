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
        'liga': league.leagueId,
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
async function getClubs() {
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
    });
  });
  return gameList;
}

async function getGame(gameId: string) {
  logger.info('not working anymore');
}

async function getRankings(groupId: string) {
  // https://api.volleyball.ch/indoor/ranking/24319

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
  const data = await fetch('https://api.newsroom.co/walls?token=1pdtktbc3ra5i&count=20&tag=top,pin,!top,!pin&channelId=484');
  const newsData = await data.json();
  const newsList = <any>[];
  // newsData._embedded.wallList.forEach((item: any) => {
  for (const item of newsData._embedded.wallList) {
    // GET IMAGE IF AVAILABLE
    let imagePath = item.featuredImage;// Object.hasOwn(item, "featuredImage"); // THIS IS MAINLY FOR DESKTOP USAGE
    try {
      if (item.media && item.media.length == 0 && !imagePath) {
        // NOTHING HERE -> SOCIAL MEDIA POST without IMAGE
        imagePath = item.author.image;
      } else if (item.media && item.media.length == 1) {
        // GET WHAT WE HAVE
        imagePath = item.media[1].url;
      } else if (item.media && item.media.length > 1) {
        // GET Mobile Picture
        imagePath = item.media.find((image: any) => image.resolution == 'mobile').url;
      }
    } catch (e) {
      logger.info(JSON.stringify(item.media));
    }

    newsList.push({
      id: item.id,
      title: item.title,
      leadText: item.leadText,
      date: item.date,
      slug: item.slug,
      image: imagePath,
      text: item.html,
      htmlText: item.html,
      tags: item.tags,
      author: item.authorName || item.author.name || item.source,
      authorImage: item.author.image,
      url: item.url,
    });
  }
  // });
  return newsList;
}
