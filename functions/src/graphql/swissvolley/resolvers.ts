/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require("node-fetch");
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const {convert} = require("html-to-text");
import * as functions from "firebase-functions";

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

async function getAssociations() {
  return [
    {id: "NATIONAL", name: "NATIONAL"},
    {id: "RVNO", name: "RVNO"},
    {id: "GSGL", name: "GSGL"},
    {id: "RVI", name: "RVI"},
    {id: "RVZ", name: "RVZ"},
    {id: "RVA", name: "RVA"},
    {id: "SVRW", name: "SVRW"},
    {id: "SVRF", name: "SVRF"},
    {id: "SVRBE", name: "SVRBE"},
  ];
}

async function getTeam(teamId: string) {
// https://api.volleyball.ch/indoor/teams/2404
  const data = await fetch("https://api.volleyball.ch/indoor/teams/" + teamId, {
    headers: {
      "Accept": "application/json",
      "authorization": functions.config().swissvolley.token,
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
    console.log(">> https://api.volleyball.ch/indoor/teams?clubId=" + clubId);
    const data = await fetch("https://api.volleyball.ch/indoor/teams?clubId=" + clubId, {
      headers: {
        "Accept": "application/json",
        "authorization": functions.config().swissvolley.token,
      },
    });

    // Check if the response is okay before proceeding
    if (!data.ok) {
      // throw new Error(`HTTP error! Status: ${data.status}`);
      console.log(`HTTP error! Status: ${data.status}`);
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
        "id": item.teamId,
        "liga": league.leagueId,
        "name": item.caption,
        "logo": item.teamlogo,
      });
    });
    return teamList;
  } catch (error) {
    console.error("Error fetching club data:", error);
    return []; // Return an empty array or handle the error as needed
  }
}

function getClub(clubId: string) {
  console.log("not needed");
}

async function getClubs() {
  try {
    const data = await fetch("https://api.volleyball.ch/indoor/clubs", {
      headers: {
        "Accept": "application/json",
        "authorization": functions.config().swissvolley.token,
      },
    });

    // Check if the response is okay before proceeding
    if (!data.ok) {
      throw new Error(`HTTP error! Status: ${data.status}`);
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
    console.error("Error fetching club data:", error);
    return []; // Return an empty array or handle the error as needed
  }
}
async function getGames(teamId: string) {
  const gameList = < any > [];

  const data = await fetch("https://api.volleyball.ch/indoor/games?region=SVRNO&teamId=" + teamId + "&includeCup=1", {
    headers: {
      "Accept": "application/json",
      "authorization": functions.config().swissvolley.token,
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
  console.log("not working anymore");
}

async function getRankings(groupId: string) {
  // https://api.volleyball.ch/indoor/ranking/24319

  const data = await fetch("https://api.volleyball.ch/indoor/ranking/" + groupId, {
    headers: {
      "Accept": "application/json",
      "authorization": functions.config().swissvolley.token,
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
  const data = await fetch("https://api.newsroom.co/walls?token=1pdtktbc3ra5i&count=20&tag=top,pin,!top,!pin&channelId=484");
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
        imagePath = item.media.find((image: any) => image.resolution == "mobile").url;
      }
    } catch (e) {
      console.log(JSON.stringify(item.media));
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
