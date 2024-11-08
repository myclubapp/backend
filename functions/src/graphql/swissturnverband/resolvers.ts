/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const fetch = require("node-fetch");
// eslint-disable-next-line @typescript-eslint/no-var-requires

import fs = require("fs");
const stvClubsJSON = fs.readFileSync("./src/graphql/swissturnverband/clubs_data_final.json", "utf8");


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

  SwissTurnverband: {
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
  const data: Array<any> = JSON.parse(stvClubsJSON);
  const teamList = <any>[];
  // Find the club with the specified clubIdParent
  const club = data.find((club) => club.id === clubId);

  if (club && club.Teams) {
    for (const team of club.Teams) {
      const cleanData:any = {
        id: team.id,
        name: team.name.replace(/\s+/g, " ").trim(),
        info: team.info.replace(/\s+/g, " ").trim(),
        jahresbeitrag: team.jahresbeitrag,
      };

      teamList.push({
        ...cleanData,
        id: cleanData.id,
      });
    }
  }
  return teamList;
}

async function getTeam(teamId: string) {
  return {};
}
async function getClubs() {
  const data: Array<any> = JSON.parse(stvClubsJSON);
  const clubList = <any>[];
  for (const item of data) {
    delete item.teams;
    // console.log(item.halls);
    clubList.push({
      ...item,
      id: item.id,
    });
    //  }
  }
  return clubList;
}

async function getClub(clubId: string) {
  console.log("");
}


async function getClubGames(clubId: string) {
  console.log("");
}

async function getGames(teamId: string) {
  console.log("");
}


async function getRankings(teamId: string) {
  console.log("");
}

async function getNews() {
  console.log("");
}
