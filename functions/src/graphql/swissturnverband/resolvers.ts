
/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";


// const fetch = require("node-fetch");

import * as fs from 'fs';
import {logger} from 'firebase-functions';
const stvClubsJSON = fs.readFileSync('./src/graphql/swissturnverband/clubs_data_final.json', 'utf8');


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
    let index = 1;
    for (const team of club.Teams) {
      const cleanData:any = {
        id: team.id + '-' + `${index}`,
        name: team.name,
        info: team.info,
        jahresbeitrag: team.jahresbeitrag,
        jahresbeitragWert: team.jahresbeitragWert,
        jahresbeitragWaehrung: team.jahresbeitragWaehrung,

      };

      teamList.push({
        ...cleanData,
        id: cleanData.id,
      });
      index++;
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
  for (const club of data) {
    delete club.Teams;
    delete club.teams;
    delete club.contactName;
    delete club.contactEmail;
    delete club.contactPhone;
    // logger.info(item.halls);
    clubList.push({
      ...club,
      id: club.id,
    });
    //  }
  }
  return clubList;
}

async function getClub(clubId: string) {
  logger.info('');
}


async function getClubGames(clubId: string) {
  logger.info('');
}

async function getGames(teamId: string) {
  logger.info('');
}


async function getRankings(teamId: string) {
  logger.info('');
}

async function getNews() {
  logger.info('');
}
