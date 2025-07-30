/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";


// import fetch from 'node-fetch';
import firebaseDAO from '../../firebaseSingleton.js';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;

// const {convert} = require("html-to-text");

// const jsdom = require("jsdom");

export default {

  Club: {
    teams(parent: any, args: any, context: any, info: any) {
      try {
        const seasonParam = info.operation.selectionSet.selections[0].arguments.find((element: any) => {
          return element.kind === 'Argument' && element.name.kind === 'Name' && element.name.value === 'season';
        });
        return getTeams(parent.id, seasonParam.value.value);
      } catch (e) {
        return getTeams(parent.id, '');
      }
    },
    games(parent: any, args: any, context: any, info: any) {
      try {
        const seasonParam = info.operation.selectionSet.selections[0].arguments.find((element: any) => {
          return element.kind === 'Argument' && element.name.kind === 'Name' && element.name.value === 'season';
        });
        return getClubGames(parent.id, seasonParam.value.value);
      } catch (e) {
        return getClubGames(parent.id, '');
      }
    },
  },
  Team: {
    games(parent: any, args: any, context: any, info: any) {
      try {
        const seasonParam = info.operation.selectionSet.selections[0].arguments.find((element: any) => {
          return element.kind === 'Argument' && element.name.kind === 'Name' && element.name.value === 'season';
        });
        return getGames(parent.id, seasonParam.value.value);
      } catch (e) {
        return getGames(parent.id, '');
      }
    },
    rankings(parent: any, args: any, context: any, info: any) {
      try {
        const seasonParam = info.operation.selectionSet.selections[0].arguments.find((element: any) => {
          return element.kind === 'Argument' && element.name.kind === 'Name' && element.name.value === 'season';
        });
        return getRankings(parent.id, seasonParam.value.value);
      } catch (e) {
        return getRankings(parent.id, '');
      }
    },

    statistics(parent: any, args: any, context: any, info: any) {
      return getStatistics(parent.id);
    },
    details(parent: any, args: any, context: any, info: any) {
      return getTeam(parent.id);
    },
  },

  SwissUnihockey: {
    clubs: () => {
      return getClubs();
    },
    team: (parent: any, args: {
      teamId: string
    }, context: any, info: any) => {
      return getTeam(args.teamId);
    },
    teams: (parent: any, args: {
      clubId: string; season: string;
    }, context: any, info: any) => {
      return getTeams(args.clubId, args.season);
    },
    games: (parent: any, args: {
      teamId: string; season: string;
    }, context: any, info: any) => {
      return getGames(args.teamId, args.season);
    },
    clubGames: (parent: any, args: {
      clubId: string; season: string;
    }, context: any, info: any) => {
      return getClubGames(args.clubId, args.season);
    },
    game: (parent: any, args: { gameId: string }, context: any, info: any) => {
      return getGame(args.gameId);
    },
    seasons: () => {
      return getSeasons();
    },
    rankings: (parent: any, args: {
      id: string; season: string;
    }, context: any, info: any) => {
      return getRankings(args.id, args.season);
    },
    news: () => {
      return getNews();
    },
  },

  /*
  Query: {
    swissunihockey: (parent: any, args: {
      id: string;season: string;
    }, context: any, info: any)=>{
      return getTypes();
    },
  },*/

};

/*
async function getTypes() {
  return [{
    name: "SwissUnihockey",
  }];
}
*/

async function getTeams(clubId: string, season: string) {
  if (!season) {
    season = await getSeason() as unknown as string;
    logger.info(`No Season parameter provided. Used internal logic and found: ${season}`);
  }

  logger.info(`get team by club: https://api-v2.swissunihockey.ch/api/teams?mode=by_club&club_id= + ${clubId} + &season= + ${season}`);
  // eslint-disable-next-line no-undef
  const data = await fetch('https://api-v2.swissunihockey.ch/api/teams?mode=by_club&club_id=' + clubId + '&season=' + season);
  const teamData = await data.json();
  const teamList = <any>[];

  // Get Game Center Teams Data based on Firebase stored ClubID
  const clubRef = await db.collection('club').doc('su-' + clubId).get();
  // eslint-disable-next-line no-undef
  const gameCenterTeamsData = await fetch('https://unihockey.swiss/api/clubapi/initclubteams/?clubid=' + clubRef.data()?.gameCenterClubId);
  const gameCenterTeamsDataJson = await gameCenterTeamsData.json();

  const gameCenterTeamList: any[] = [];
  for (const team of gameCenterTeamsDataJson.Teams) {
    // eslint-disable-next-line no-undef
    const teamDetailData = await fetch(`https://unihockey.swiss/api/teamapi/getteamheaderinfoforteamsite/?teamid=${team.ItemID}`);
    const teamDetailDataJson = await teamDetailData.json();
    gameCenterTeamList.push(teamDetailDataJson);
  }

  // logger.info(teamData);
  for (const team of teamData.entries) {
    logger.info(`team id: ${team.set_in_context.team_id} ${team.text}`);

    const gameCenterTeamData = gameCenterTeamList.find((gameCenterTeam: any) => {
      return gameCenterTeam?.Name?.trim() === team.text?.trim();
    });
    // eslint-disable-next-line no-undef
    const teamDetailRequestData = await fetch(`https://api-v2.swissunihockey.ch/api/teams/${team.set_in_context.team_id}`);
    const teamDetailData = await teamDetailRequestData.json();

    const portrait =
      teamDetailData?.data?.regions?.[0]?.rows?.[0]?.cells?.[3]?.image?.url ||
      (gameCenterTeamData?.HasTeamBanner === true ? gameCenterTeamData?.TeamBanner?.PictureURL : '') ||
      '';

    // eslint-disable-next-line no-undef
    const gameCenterPlayersData = await fetch('https://unihockey.swiss/api/teamapi/initplayersadminvc/?teamid=' + team.TeamID);
    const gameCenterPlayersDataJson = await gameCenterPlayersData.json();
    console.log(team.TeamID, gameCenterPlayersDataJson);

    teamList.push({
      id: team.set_in_context.team_id,
      name: team.text,
      gameCenterId: gameCenterTeamData?.TeamID || '',
      gameCenterPlayers: gameCenterPlayersDataJson || [],
      info: teamDetailData?.data?.regions?.[0]?.rows?.[0]?.cells?.[0]?.text?.[0] || '',
      logo: teamDetailData?.data?.regions?.[0]?.rows?.[0]?.cells?.[1]?.image?.url || '',
      website: teamDetailData?.data?.regions?.[0]?.rows?.[0]?.cells?.[2]?.url?.href || '',
      portrait: portrait,
      liga: teamDetailData?.data?.regions?.[0]?.rows?.[0]?.cells?.[4]?.text?.[0] || '',
    });
  }
  /* teamData.entries.forEach((item: any) => {
    teamList.push({
      id: item.set_in_context.team_id,
      name: item.text,
    });
  }); */

  return teamList;
}

async function getTeam(teamId: string) {
  // eslint-disable-next-line no-undef
  const data = await fetch('https://api-v2.swissunihockey.ch/api/teams/' + teamId);
  const teamData = await data.json();
  // logger.info(teamData);

  return {
    id: teamId,
    name: teamData.data.regions[0].rows[0].cells[0].text[0],
  };
}

async function getClubs() {
  // eslint-disable-next-line no-undef
  const data = await fetch('https://api-v2.swissunihockey.ch/api/clubs');
  const clubData = await data.json();

  // eslint-disable-next-line no-undef
  const gameCenterData = await fetch('https://unihockey.swiss/api/leagueorganizerapi/getleagueorganizerclubs/?leagueOrganizerId=1');
  const gameCenterClubData = await gameCenterData.json();

  const clubList = <any>[];
  // clubData.entries.forEach(async (item: any) => {
  for (const item of clubData.entries) {
    // logger.info(`Read Club: ${item.set_in_context.club_id} ${item.text}`);

    const contactPerson = '';
    const contactAddress = '';
    const contactPhone = '';
    const contactEmail = '';
    /* try {
      const response = await fetch("https://portal.swissunihockey.ch/clubregister/?club_id=" + item.set_in_context.club_id +"&mode=details", {
        headers: {
          "cookie": "JSESSIONID=1aocqfonb7vprte7o2urrxbga",
        },
      });
      // let contactVereinsname = "";
      const body = await response.text();
      const dom = new jsdom.JSDOM(body);
      const domList: NodeList = dom.window.document.getElementsByClassName("portrait_title");
      if (domList && domList.length > 0) {
        domList.forEach((attribute:Node, key:number, parent: NodeList) => {
          logger.info(attribute.childNodes[0].textContent );
          logger.info(parent.item(1)?.textContent as string);

          // if (attribute.childNodes[0].textContent === "Vereinsname") {
            //   contactVereinsname = parent.item(1)?.textContent as string;
          // }
          // let contactPerson = dom.window.document.getElementsByClassName("portrait_title").item(1).parentElement.children[1].innerText;
          // let contactAddress = dom.window.document.getElementsByClassName("portrait_title").item(2).parentElement.children[1].innerText;
          // let contactPhone = dom.window.document.getElementsByClassName("portrait_title").item(3).parentElement.children[1].innerText;
          // let contactEmail = dom.window.document.getElementsByClassName("portrait_title").item(4).parentElement.children[1].innerText;

          if (attribute.childNodes[0].textContent === "Kontaktperson") {
            contactPerson = parent.item(1)?.textContent as string;
          }
          if (attribute.childNodes[0].textContent=== "Adresse") {
            contactAddress = parent.item(1)?.textContent as string;
          }
          if (attribute.childNodes[0].textContent === "Telefonnr. Kontaktperson") {
            contactPhone = parent.item(1)?.textContent as string;
          }
          if (attribute.childNodes[0].textContent === "e-Mail") {
            contactEmail = parent.item(1)?.textContent as string;
          }
        });
      }
    } catch (e) {
      logger.info(">>> error read & update address swissunihockey");
    } */
    //     const gameCenterClub = gameCenterClubData.find((club: any) => club.Name === item.text);

    const gameCenterClub = gameCenterClubData.find((club: any) => club.Name && club.Name.trim() === item.text);

    /* const gameCenterPlayers: any[] = [];
    let gameCenterTeams: any = {};
    // Read all Teams for this Club from GameCenter
    if (gameCenterClub && gameCenterClub.ClubID) {
      // eslint-disable-next-line no-undef
      const gameCenterTeamsData = await fetch('https://unihockey.swiss/api/clubapi/initclubteams/?clubid=' + gameCenterClub.ClubID);
      gameCenterTeams = await gameCenterTeamsData.json();
      // Read all Players for all Teams of this Club from GameCenter

      for (const team of gameCenterTeams.Teams) {
        // eslint-disable-next-line no-undef
        const gameCenterPlayersData = await fetch('https://unihockey.swiss/api/teamapi/initplayersadminvc/?teamid=' + team.ItemID);
        const gameCenterPlayersDataJson = await gameCenterPlayersData.json();
        gameCenterPlayers.push(...gameCenterPlayersDataJson);
      }
    }*/

    clubList.push({
      id: item.set_in_context.club_id,
      name: item.text,
      gameCenter: gameCenterClub || {},
      // gameCenterTeams: gameCenterTeams.Teams || [],
      // gameCenterPlayers: gameCenterPlayers || [],
      address: [{
        id: item.set_in_context.club_id,
        firstName: contactPerson,
        lastName: contactPerson,
        street: contactAddress,
        email: contactEmail,
        phone: contactPhone,
      }],
    });
  }
  // });
  return clubList;
}

async function getClubGames(clubId: string, season: string) {
  if (!season) {
    /* logger.info("NO SEASON!!!");
    const seasonList: any = getSeason();
    logger.info(JSON.stringify(seasonList)); */

    season = await getSeason() as unknown as string;
    logger.info(`No Season parameter provided. Used internal logic and found: ${season}`);
  }
  // eslint-disable-next-line no-undef
  const data = await fetch('https://api-v2.swissunihockey.ch/api/games?mode=club&season=' + season + '&club_id=' + clubId + '&games_per_page=100');
  const gameData = await data.json();

  const previousSeason = Number(season) - 1;
  // eslint-disable-next-line no-undef
  const dataPreviousSeason = await fetch('https://api-v2.swissunihockey.ch/api/games?mode=club&season=' + previousSeason + '&club_id=' + clubId + '&games_per_page=100');
  const gameDataPreviousSeason = await dataPreviousSeason.json();

  gameData.data.regions[0].rows.push(...gameDataPreviousSeason.data.regions[0].rows);
  const gameList = [];
  if (gameData && gameData.data && gameData.data.regions && gameData.data.regions.length > 0) {
    for (const item of gameData.data.regions[0].rows) {
      let latitude = '-';
      let longitude = '-';
      try {
        latitude = item.cells[1].link.y || '-';
        longitude = item.cells[1].link.x || '-';
      } catch (e) {
        logger.info('>> Error: Longitude/Latitude missing');
        // logger.info(e);
      }
      gameList.push({
        id: item.link.ids[0],
        date: item.cells[0].text[0],
        time: item.cells[0].text[1] || '00:00',
        venue: item.cells[1].text[0],
        venueCity: item.cells[1].text[1] || '-',
        longitude: longitude,
        latitude: latitude,
        liga: item.cells[2].text[0],
        ligaText: '',
        result: item.cells[5].text[0],
      });
    }
    // gameData.data.regions[0].rows.forEach((item: any) => {
    // });
  } else {
    logger.info(`>>> No Games found for Club ${clubId} and season ${season}`);
  }
  return gameList;
}

async function getGames(teamId: string, season: string) {
  if (!season) {
    season = await getSeason() as unknown as string;
    logger.info(`No Season parameter provided. Used internal logic and found: ${season}`);
  }
  // eslint-disable-next-line no-undef
  const data = await fetch('https://api-v2.swissunihockey.ch/api/games?mode=team&season=' + season + '&team_id=' + teamId + '&games_per_page=100');
  logger.info('https://api-v2.swissunihockey.ch/api/games?mode=team&season=' + season + '&team_id=' + teamId + '&games_per_page=100');
  const gameData = await data.json();
  const gameList = <any>[];
  if (gameData && gameData.data && gameData.data.regions && gameData.data.regions.length > 0) {
    // gameData.data.regions[0].rows.forEach((item: any) => {
    for (const item of gameData.data.regions[0].rows) {
      let latitude = '-';
      let longitude = '-';
      try {
        latitude = item.cells[1].link.y || '-';
        longitude = item.cells[1].link.x || '-';
      } catch (e) {
        logger.info('>> Error: Longitude/Latitude missing');
        logger.info({
          id: item.link.ids[0],
          date: item.cells[0].text[0],
          time: item.cells[0].text[1] || '00:00',
          venue: item.cells[1].text[0],
          venueCity: item.cells[1].text[1] || '-',
          longitude: longitude,
          latitude: latitude,
          result: item.cells[4].text[0],
        });
        // logger.info(e);
      }

      gameList.push({
        id: item.link.ids[0],
        date: item.cells[0].text[0],
        time: item.cells[0].text[1] || '00:00',
        venue: item.cells[1].text[0],
        venueCity: item.cells[1].text[1] || '-',
        longitude: longitude,
        latitude: latitude,
        result: item.cells[4].text[0],
      });
    }
    // });
  } else {
    logger.info(`>>> No Games found for Team ${teamId} and season ${season}`);
  }
  return gameList;
}

async function getGame(gameId: string) {
  // eslint-disable-next-line no-undef
  const data = await fetch('https://api-v2.swissunihockey.ch/api/games/' + gameId);
  try {
    const gameData = await data.json();
    const gameDetailData = gameData.data.regions[0].rows[0];
    // logger.info(gameDetailData);
    return {
      name: gameData.data.title,
      description: gameData.data.subtitle,

      teamHomeId: 'su-' + gameDetailData.cells[0].link.ids[0],
      teamHome: gameDetailData.cells[1].text[0],
      teamHomeLogo: gameDetailData.cells[0].image.url,
      teamHomeLogoText: gameDetailData.cells[0].image.alt,

      teamAwayId: 'su-' + gameDetailData.cells[2].link.ids[0],
      teamAway: gameDetailData.cells[3].text[0],
      teamAwayLogo: gameDetailData.cells[2].image.url,
      teamAwayLogoText: gameDetailData.cells[2].image.alt,

      referee1: gameDetailData.cells[8].text[0],
      referee2: gameDetailData.cells[9].text[0],
      spectators: gameDetailData.cells[10].text[0],
    };
  } catch (e) {
    // logger.info(e);
    return {};
  }
}

async function getSeason(): Promise<string | null> {
  try {
    // eslint-disable-next-line no-undef
    const res = await fetch('https://api-v2.swissunihockey.ch/api/seasons');
    const seasonData = await res.json();

    const currentSeason = seasonData.entries.find(
        (entry: any) => entry.highlight === true,
    );

    return currentSeason?.set_in_context.season.toString() ?? null;
  } catch (error) {
    console.error('Failed to fetch season data:', error);
    return null;
  }
}

/* async function getPastSeason() {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/seasons");
  const seasonData = await data.json();
  const currentSeason = seasonData.entries.filter((element: any, index: any) => {
    // return element.highlight === true && index === 0; // 2023
    return element.highlight === false && index === 1; // 2022
  });
  return currentSeason[0].set_in_context.season as string;
} */

async function getSeasons() {
  // eslint-disable-next-line no-undef
  const data = await fetch('https://api-v2.swissunihockey.ch/api/seasons');
  const seasonData = await data.json();
  // logger.info(seasonData.entries);
  const seasonList = <any>[];
  // seasonData.entries.forEach((item: any) => {
  for (const item of seasonData.entries) {
    seasonList.push({
      id: item.set_in_context.season,
      name: item.text,
      season: item.set_in_context.season,
      highlight: item.highlight,
    });
  }
  // });
  return seasonList;
}

async function getRankings(teamId: string, season: string) {
  if (!season) {
    season = await getSeason() as unknown as string;
    logger.info(`No Season parameter provided for Ranking. Used internal logic and found: ${season}`);
  }
  // eslint-disable-next-line no-undef
  const data = await fetch('https://api-v2.swissunihockey.ch/api/rankings?season=' + season + '&team_id=' + teamId);
  // logger.info("https://api-v2.swissunihockey.ch/api/rankings?season=" + season + "&team_id=" + teamId);
  const rankingData = await data.json();
  const rankingList = <any>[];
  // rankingData.data.regions[0].rows.forEach((item: any) => {

  if (rankingData && rankingData.data && rankingData.data.regions && rankingData.data.regions.length > 0 && rankingData.data.regions[0].rows) {
    const headers = rankingData.data.headers;
    for (const item of rankingData.data.regions[0].rows) {
      /* let url = "";
      if (item.cells[1] && item.cells[1].image && item.cells[1].image.url) {
        url = item.cells[1].image.url;
      }*/
      // logger.info(item);
      rankingList.push({
        id: item.data.team.id,
        name: item.data.team.name,

        image: getCellImageUrl(item, headers, ''), // Assuming the headerText for the image column is an empty string

        // image: item.cells[headers.findIndex((head: { text: string; }) => head.text == "")]?.image.url || "",
        games: getCellText(item, headers, 'Sp'), // Spiele
        gamesSoW: getCellText(item, headers, 'SoW'), // Spiele ohne Wertung
        wins: getCellText(item, headers, 'S'), // Siege
        loss: getCellText(item, headers, 'N'), // Niederlagen
        draw: getCellText(item, headers, 'U'), // Unentschieden (returns empty string if header not found)
        goals: getCellText(item, headers, 'T'), // Tore
        goalDifference: getCellText(item, headers, 'TD'), // Tordifferenz
        pointQuotient: getCellText(item, headers, 'PQ'),
        points: getCellText(item, headers, 'P'),
        ranking: item.data.rank,
        season: season,
        title: rankingData.data.title,
      });
    }
  }
  // });
  return rankingList;
}

function getCellText(item: { cells: { [x: string]: { text: any[]; }; }; }, headers: any[], headerText: string) {
  const index = headers.findIndex((head) => head.text == headerText);
  if (index !== -1 && item.cells[index]) {
    return item.cells[index].text[0] || '';
  } else {
    return ''; // Fallback to empty string if header not found or cell is undefined
  }
}

function getCellImageUrl(item: { cells: { [x: string]: { image: { url: any; }; }; }; }, headers: any[], headerText: any) {
  const index = headers.findIndex((head) => head.text == headerText);
  if (index !== -1 && item.cells[index] && item.cells[index].image) {
    return item.cells[index].image.url || '';
  } else {
    return ''; // Fallback to empty string if header not found or image is undefined
  }
}

async function getStatistics(teamId: string) {
  // eslint-disable-next-line no-undef
  const data = await fetch('https://api-v2.swissunihockey.ch/api/teams/' + teamId + '/statistics');
  const statisticsData = await data.json();

  const statisticsList = <any>[];
  // statisticsData.data.regions[0].rows.forEach((item: any) => {
  for (const item of statisticsData.data.regions[0].rows) {
    logger.info(JSON.stringify(item.cells[1]), JSON.stringify(item.cells[3]));
  }
  // });
  return statisticsList;
}

async function getNews() {
  logger.info('Hole News von Publishr API');

  // eslint-disable-next-line no-undef
  const response1 = await fetch('https://app.publishr.ch/api/v2/contenthub-story/list?orderBy=timestamp&fkMediahouse=41&limit=15&tags=top&tags=pin&social=false', {
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJtIjoic2VydmljZSIsInN1YiI6IjQ4Iiwib3JnSWQiOiI2IiwiaWF0IjoxNzQzNTkwMzY5LCJleHAiOjIwNTkxNjYzNjl9.PjFTTaMCcfenqJycDq0qee0r3krInVYfoq4uCiRjOB8',
      'Content-Type': 'application/json',
    },
  });

  // MEDIENMITTEILUNGEN
  // eslint-disable-next-line no-undef
  const response2 = await fetch('https://app.publishr.ch/api/v2/contenthub-story/list?orderBy=timestamp&fkMediahouse=58&limit=15&social=false&tags=!top&tags=!pin', {
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJtIjoic2VydmljZSIsInN1YiI6IjQyIiwib3JnSWQiOiI2IiwiaWF0IjoxNzQxMDEyNTk0LCJleHAiOjIwNTY1ODg1OTR9.s0ceshLdB6GMzlVsU1LEYjbT1GeM33TRPbd62VGg7_I',
      'Content-Type': 'application/json',
    },
  });

  const newsData1 = await response1.json();
  const newsData2 = await response2.json();
  const newsList: any[] = [];

  if (newsData1.status === 'success' && newsData1.data) {
    for (const item of newsData1.data) {
      let imagePath = '';
      let title = '';
      let leadText = '';
      let htmlText = '';

      if (item.storyItem) {
        // 1. Image
        const imageItem = item.storyItem.find(
            (si: any) =>
              si.fkElement === 13 && si.contentA && si.contentA.includes('cdn.publishr.ch'),
        );
        if (imageItem) {
          imagePath = imageItem.contentA;
        }

        // 2. Title
        const titleItem = item.storyItem.find(
            (si: any) => si.fkElement === 1 && si.contentA,
        );
        if (titleItem) {
          title = titleItem.contentA;
        }

        // 3. Lead text
        const leadItem = item.storyItem.find(
            (si: any) => si.fkElement === 6 && si.contentA,
        );
        if (leadItem) {
          leadText = leadItem.contentA;
        }

        // 4. Full HTML content
        const htmlItem = item.storyItem.find(
            (si: any) => si.fkElement === 61 && si.contentA,
        );
        if (htmlItem) {
          htmlText = htmlItem.contentA;
        }
      }

      const author =
        (item.storyAuthor?.[0]?.contact?.firstName || '') +
        (item.storyAuthor?.[0]?.contact?.lastName ? ' ' + item.storyAuthor?.[0]?.contact?.lastName : '') || 'swiss unihockey';

      const newsObject = {
        id: `${item.id}`,
        externalId: `${item.id}`,
        title: title || item.title || '',
        leadText: leadText.substring(0, 200) + '...',
        date: item.creationTimestamp,
        slug: item.contenthubStory?.slug || '',
        image: imagePath,
        text: leadText,
        htmlText: htmlText,
        tags: item.storyTag?.map((tag: any) => tag.tag.tagLanguage[0].label).join(', ') || '',
        author: author,
        authorImage:
          'https://portal.swissunihockey.ch/weblounge-sites/portal/media/header_logo.png',
        url: item.contenthubStory?.canonicalUrl || '',
        type: 'swissunihockey',
        updated: new Date(),
      };

      newsList.push(newsObject);
    }
  }
  if (newsData2.status === 'success' && newsData2.data) {
    for (const item of newsData2.data) {
      let imagePath = '';
      let title = '';
      let leadText = '';
      let htmlText = '';

      if (item.storyItem) {
        // 1. Image
        const imageItem = item.storyItem.find(
            (si: any) =>
              si.fkElement === 13 && si.contentA && si.contentA.includes('cdn.publishr.ch'),
        );
        if (imageItem) {
          imagePath = imageItem.contentA;
        }

        // 2. Title
        const titleItem = item.storyItem.find(
            (si: any) => si.fkElement === 1 && si.contentA,
        );
        if (titleItem) {
          title = titleItem.contentA;
        }

        // 3. Lead text
        const leadItem = item.storyItem.find(
            (si: any) => si.fkElement === 6 && si.contentA,
        );
        if (leadItem) {
          leadText = leadItem.contentA;
        }

        // 4. Full HTML content
        const htmlItem = item.storyItem.find(
            (si: any) => si.fkElement === 61 && si.contentA,
        );
        if (htmlItem) {
          htmlText = htmlItem.contentA;
        }
      }

      const author =
        (item.storyAuthor?.[0]?.contact?.firstName || '') +
        (item.storyAuthor?.[0]?.contact?.lastName ? ' ' + item.storyAuthor?.[0]?.contact?.lastName : '') || 'swiss unihockey';

      const newsObject = {
        id: `${item.id}`,
        externalId: `${item.id}`,
        title: title || item.title || '',
        leadText: leadText.substring(0, 200) + '...',
        date: item.creationTimestamp,
        slug: item.contenthubStory?.slug || '',
        image: imagePath,
        text: leadText,
        htmlText: htmlText,
        tags: item.storyTag?.map((tag: any) => tag.tag.tagLanguage[0].label).join(', ') || '',
        author: author,
        authorImage:
          'https://portal.swissunihockey.ch/weblounge-sites/portal/media/header_logo.png',
        url: item.contenthubStory?.canonicalUrl || '',
        type: 'swissunihockey',
        updated: new Date(),
      };

      newsList.push(newsObject);
    }
  }
  return newsList;
}
