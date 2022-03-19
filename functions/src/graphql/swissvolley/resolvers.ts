/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
    club: (parent: any, args: { clubId: string }, context: any, info: any) => {
      return getClub(args.clubId); // 913245 "VBG Klettgau
    },
    clubs: (parent: any, args: { associationId: string }, context: any, info: any) => {
      return getClubs(args.associationId);
    },

    team: (parent: any, args: { teamId: string }, context: any, info: any) => {
      return getTeam(args.teamId);
    },
    teams: (parent: any, args: { clubId: string}, context: any, info: any) => {
      return getTeams(args.clubId);
    },

    games: (parent: any, args: {teamId: string}, context: any, info: any) => {
      return getGames(args.teamId);
    },
    game: (parent: any, args: {gameId: string }, context: any, info: any) => {
      return getGame(args.gameId);
    },
    clubGames: (parent: any, args: {id: string;season: string; }, context: any, info: any) => {
      return getClubGames(args.id);
    },

    associations: (parent: any, args: any, context: any, info: any) => {
      return getAssociations();
    },
    leagues: (parent: any, args: { associationId: string }, context: any, info: any) => {
      return getLeagues(args.associationId);
    },
    phases: (parent: any, args: { leagueId: string}, context: any, info: any) => {
      return getPhases(args.leagueId);
    },
    groups: (parent: any, args: {phaseId: string}, context: any, info: any) => {
      return getGroups(args.phaseId);
    },
    rankings: (parent: any, args: {groupId: string}, context: any, info: any) => {
      return getRankings(args.groupId);
    },

    /* team: (parent: any, args: { teamId: string}, context: any, info: any) => {
          return getTeam(args.teamId);
        },*/

    news: () => {
      return getNews();
    },
  },
  Club: {
    teams(parent: any) {
      return getTeams(parent.id);
    },
    games(parent: any) {
      return getClubGames(parent.id);
    },
  },
  Team: {
    games(parent: any, args: any, context: any, info: any) {
      return getGames(parent.id);
    },
  },
  Game: {
    details(parent: any, args: any, context: any, info: any) {
      return getGame(parent.id);
    },
  },

  Association: {
    clubs(parent: any, args: any, context: any, info: any) {
      return getClubs(parent.id);
    },
    leagues(parent: any, args: any, context: any, info: any) {
      return getLeagues(parent.id);
    },
  },
  League: {
    phases(parent: any, args: any, context: any, info: any) {
      return getPhases(parent.id);
    },
  },
  Phase: {
    groups(parent: any, args: any, context: any, info: any) {
      return getGroups(parent.id);
    },
  },
  Group: {
    rankings(parent: any, args: any, context: any, info: any) {
      return getRankings(parent.id);
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

async function getLeagues(associationId: string) {
  const args = {
    keyword: associationId,
  };
  const leagueList = < any > [];
  const client = await soap.createClientAsync(soapUrl);
  const result = await client.getLeaguesAsync(args);
  // console.log(JSON.stringify(result[0].leagues));
  result[0].leagues.item.forEach((item: any) => {
    leagueList.push({
      id: item.league_ID.$value,
      name: item.LeagueCategoryCaption.$value,
    });
  });
  return leagueList;
}

async function getPhases(leagueId: string) {
  const args = {
    league_ID: leagueId,
  };
  const phasesList = < any > [];
  const client = await soap.createClientAsync(soapUrl);
  const result = await client.getPhasesAsync(args);
  // console.log(JSON.stringify(result));
  try {
    result[0].phases.item.forEach((item: any) => {
      phasesList.push({
        id: item.phase_ID.$value,
        name: item.Caption.$value,
      });
    });
    return phasesList;
  } catch (e) {
    return [{
      id: result[0].phases.item.phase_ID.$value,
      name: result[0].phases.item.Caption.$value,
    }];
  }
}

async function getGroups(phaseId: string) {
  const args = {
    phase_ID: phaseId,
  };
  const groupsList = < any > [];
  const client = await soap.createClientAsync(soapUrl);
  const result = await client.getGroupsAsync(args);
  // console.log(JSON.stringify(result));

  try {
    result[0].groups.item.forEach((item: any) => {
      groupsList.push({
        id: item.group_ID.$value,
        name: item.Caption.$value,
      });
    });
    return groupsList;
  } catch (e) {
    return [{
      id: result[0].groups.item.group_ID.$value,
      name: result[0].groups.item.Caption.$value,
    }];
  }
}

async function getTeam(teamId: string) {
  const args = {
    team_ID: teamId,
  };
  const client = await soap.createClientAsync(soapUrl);
  const result = await client.getTeamDetailedAsync(args);
  // console.log(JSON.stringify(result));
  const item = result[0].team;
  return {
    id: item.ID_team.$value,
    name: item.Caption.$value,
    gender: item.Gender.$value,
    clubId: item.club_ID.$value,
    clubCaption: item.ClubCaption.$value,
    leagueCaption: item.LeagueCaption.$value,
    organisationCaption: item.OrganisationCaption.$value,
  };
}

async function getTeams(clubId: string) {
  const args = {
    getTeamsByClubRequest: clubId,
  };
  const teamList = < any > [];
  const client = await soap.createClientAsync(soapUrl);
  // Loop at list with Verband Ids.. #TODO
  const result = await client.getTeamsByClubAsync(args);
  // console.log(result);
  if (result[0] && result[0].getTeamsByClubResponse && result[0].getTeamsByClubResponse.item) {
    try {
      result[0].getTeamsByClubResponse.item.forEach((item: any) => {
        // console.log(item);
        teamList.push({
          id: item.ID_team.$value,
          name: item.Caption.$value,
          gender: item.Gender.$value,
          clubId: item.club_ID.$value,
          clubCaption: item.ClubCaption.$value,
          leagueCaption: item.LeagueCaption.$value,
          organisationCaption: item.OrganisationCaption.$value,
        });
      });
    } catch (e) {
      const item = result[0].getTeamsByClubResponse.item;
      // console.log(item);
      teamList.push({
        id: item.ID_team.$value,
        name: item.Caption.$value,
        gender: item.Gender.$value,
        clubId: item.club_ID.$value,
        clubCaption: item.ClubCaption.$value,
        leagueCaption: item.LeagueCaption.$value,
        organisationCaption: item.OrganisationCaption.$value,
      });
    }
    return teamList;
  }
}
/*
getTeamDetailed
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
async function getClubs(associationId: string) {
  const args = {
    keyword: associationId,
  };
  const clubList = < any > [];
  const client = await soap.createClientAsync(soapUrl);
  const result = await client.getActiveClubsAsync(args);
  result[0].getActiveClubsResponse.item.forEach((item: any) => {
    clubList.push({
      id: item.ID_club.$value,
      name: item.Caption.$value,
    });
  });
  return clubList;
}

/* async function getClubsWebApi() {
  const data = await fetch("https://api.volleyball.ch/indoor/clubs");
  const clubData = await data.json();
  const clubList = < any > [];
  clubData.forEach((item: any) => {
    clubList.push({
      id: item.clubId,
      name: item.caption,
    });
  });
  return clubList;
} */

async function getClub(clubId: string) {
  const args = {
    club_ID: clubId,
  };

  const client = await soap.createClientAsync(soapUrl);
  // Loop at list with Verband Ids.. #TODO
  const result = await client.getClubDetailsAsync(args);
  const item = result[0].getClubDetailsResponse;
  // console.log(JSON.stringify(item));
  return {
    id: item.ID_club.$value,
    name: item.Caption.$value,
  };
}

async function getGames(teamId: string) {
  const args = {
    team_ID: teamId,
  };
  const gameList = < any > [];
  const client = await soap.createClientAsync(soapUrl);
  const result = await client.getGamesTeamAsync(args);
  // console.log(JSON.stringify(result));
  result[0].games.item.forEach((item: any) => {
    // console.log(item);
    gameList.push({
      id: item.ID_game.$value,
      name: item.TeamHomeCaption.$value,
    });
  });
  return gameList;
}

async function getGame(gameId: string) {
  const args = {
    game_ID: gameId,
  };
  const client = await soap.createClientAsync(soapUrl);
  const result = await client.getGameDetailedAsync(args);
  const item = result[0].game;
  // console.log(item.league_ID.$value);
  // console.log(JSON.stringify(item));
  return {
    id: item.ID_game.$value,
    ID_game: item.ID_game.$value,
    IsCommited: item.IsCommited.$value,
    league_ID: item.league_ID.$value,
    LeagueCaption: item.LeagueCaption.$value,
    mode_ID: item.mode_ID.$value,
    ModeCaption: item.ModeCaption.$value,
    group_ID: item.group_ID.$value,
    GroupCaption: item.GroupCaption.$value,
    RoundIndex: item.RoundIndex.$value,
    PlayDate: item.PlayDate.$value,
    hall_ID: item.hall_ID.$value,
    HallCaption: item.HallCaption.$value || "",
    HallPlace: item.HallPlace.$value || "",
    HallAreaCode: item.HallAreaCode.$value || "",
    HallStreetNumber: item.HallStreetNumber.$value || "",
    HallStreet: item.HallStreet.$value || "",
    sportstaetten_ID: item.sportstaetten_ID.$value,
    TeamHomeID: item.TeamHomeID.$value,
    TeamHomeCaption: item.TeamHomeCaption.$value,
    TeamAwayID: item.TeamAwayID.$value,
    TeamAwayCaption: item.TeamAwayCaption.$value,
    Sets: item.Sets.$value || "",
    Result: item.Result.$value || "",
    RefereeFirstCaption: item.RefereeFirstCaption.$value,
    RefereeFirstID: item.RefereeFirstID.$value,
    RefereeSecondCaption: item.RefereeSecondCaption.$value || "",
    RefereeSecondID: item.RefereeSecondID.$value,
    LineRefereeFirstCaption: item.LineRefereeFirstCaption.$value || "",
    LineRefereeFirstID: item.LineRefereeFirstID.$value,
    LineRefereeSecondCaption: item.LineRefereeSecondCaption.$value || "",
    LineRefereeSecondID: item.LineRefereeSecondID.$value,
    DateMode: item.DateMode.$value,
    DateModeDate: item.DateModeDate.$value,
    GameReport: item.GameReport.$value,
    PlayDateDisplacement: item.PlayDateDisplacement.$value,
  };
}

async function getClubGames(clubId: string) {
  const args = {
    club_ID: clubId,
  };
  const gameList = < any > [];
  const client = await soap.createClientAsync(soapUrl);

  const result = await client.getGamesByClubAsync(args);
  result[0].getGamesByClubResponse.item.forEach((item: any) => {
    // console.log(item);
    gameList.push({
      id: item.ID_game.$value,
      name: item.TeamHomeCaption.$value,

      /*
      game.ID_game = element.ID_game.$value;
      game.IsCommited = element.IsCommited.$value;
      game.PlayDate = element.PlayDate.$value;
      game.OptionalGame = element.OptionalGame.$value;
      game.RoundIndex = element.RoundIndex.$value;
      game.TeamHomeID = element.TeamHomeID.$value;
      game.TeamHomeCaption = element.TeamHomeCaption.$value;
      game.TeamAwayID = element.TeamAwayID.$value;
      game.TeamAwayCaption = element.TeamAwayCaption.$value;
      game.Name1Ref = element.Name1Ref.$value;
      game.referee_ID = element.referee_ID.$value;
      game.Name2Ref = element.Name2Ref.$value;
      game.referee_second_ID = element.referee_second_ID.$value;
      game.Name3Ref = element.Name3Ref.$value;
      game.line_referee_ID = element.line_referee_ID.$value;
      game.Name4Ref = element.Name4Ref.$value;
      game.line_referee_socond_ID = element.line_referee_socond_ID.$value;
      game.NumberOfWinsHome = element.NumberOfWinsHome.$value;
      game.NumberOfWinsAway = element.NumberOfWinsAway.$value;
      game.IsResultCommited = element.IsResultCommited.$value;
      game.UncompletedResultHome = element.UncompletedResultHome.$value;
      game.ResultAdvicedHome = element.ResultAdvicedHome.$value;
      */

    });
  });
  return gameList;
}

async function getRankings(groupId: string) {
  // getTable
  const args = {
    group_ID: groupId,
  };
  const gameList = < any > [];
  const client = await soap.createClientAsync(soapUrl);
  const result = await client.getTableAsync(args);

  result[0].table.item.forEach((item: any) => {
    // console.log(JSON.stringify(item));
    gameList.push({
      id: item.team_ID.$value,
      rank: item.Rank.$value,
      name: item.Caption.$value,
    });
  });
  return gameList;
}


// Top story https://api.newsroom.co/walls?token=1pdtktbc3ra5i&tag=top&channelId=484&count=9

async function getNews() {
  const data = await fetch("https://api.newsroom.co/walls?token=1pdtktbc3ra5i&count=20&tag=top,pin,!top,!pin&channelId=484");
  const newsData = await data.json();
  const newsList = < any > [];
  newsData._embedded.wallList.forEach((item: any) => {
    // console.log(item);

    let imageUrl = item.featuredImage;
    if (item.media && item.media.length >= 2) {
      imageUrl = item.media[2].url;
    } else {
      console.log(item.media);
    }

    newsList.push({
      id: item.id,
      title: item.title,
      leadText: item.leadText,
      date: item.date,
      slug: item.slug,
      image: imageUrl,
      text: convert(item.html, {
        wordwrap: 130,
      }),
      htmlText: item.text,
      tags: item.tags,
      author: item.author.realName,
      authorImage: item.author.image,
    });
  });
  return newsList;
}
