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
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const jsdom = require("jsdom");

export default {

  Club: {
    teams(parent: any, args: any, context: any, info: any) {
      try {
        const seasonParam = info.operation.selectionSet.selections[0].arguments.find((element: any) => {
          return element.kind === "Argument" && element.name.kind === "Name" && element.name.value === "season";
        });
        return getTeams(parent.id, seasonParam.value.value);
      } catch (e) {
        return getTeams(parent.id, "");
      }
    },
    games(parent: any, args: any, context: any, info: any) {
      try {
        const seasonParam = info.operation.selectionSet.selections[0].arguments.find((element: any) => {
          return element.kind === "Argument" && element.name.kind === "Name" && element.name.value === "season";
        });
        return getClubGames(parent.id, seasonParam.value.value);
      } catch (e) {
        return getClubGames(parent.id, "");
      }
    },
  },
  Team: {
    games(parent: any, args: any, context: any, info: any) {
      try {
        const seasonParam = info.operation.selectionSet.selections[0].arguments.find((element: any) => {
          return element.kind === "Argument" && element.name.kind === "Name" && element.name.value === "season";
        });
        return getGames(parent.id, seasonParam.value.value);
      } catch (e) {
        return getGames(parent.id, "");
      }
    },
    rankings(parent: any, args: any, context: any, info: any) {
      try {
        const seasonParam = info.operation.selectionSet.selections[0].arguments.find((element: any) => {
          return element.kind === "Argument" && element.name.kind === "Name" && element.name.value === "season";
        });
        return getRankings(parent.id, seasonParam.value.value);
      } catch (e) {
        return getRankings(parent.id, "");
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
    console.log(`No Season parameter provided. Used internal logic and found: ${season}`);
  }

  console.log(`get team by club: https://api-v2.swissunihockey.ch/api/teams?mode=by_club&club_id= + ${clubId} + &season= + ${season}`);
  const data = await fetch("https://api-v2.swissunihockey.ch/api/teams?mode=by_club&club_id=" + clubId + "&season=" + season);
  const teamData = await data.json();
  const teamList = <any>[];
  // console.log(teamData);
  for (const team of teamData.entries) {
    console.log(`team id: ${team.set_in_context.team_id} ${team.text}`);

    const teamDetaoöRequestData = await fetch(`https://api-v2.swissunihockey.ch/api/teams/${team.set_in_context.team_id}`);
    const teamDetailData = await teamDetaoöRequestData.json();

    teamList.push({
      id: team.set_in_context.team_id,
      name: team.text,
      info: teamDetailData.data.regions[0].rows[0].cells[0].text[0],
      logo: teamDetailData.data.regions[0].rows[0].cells[1].image.url || "",
      website: teamDetailData.data.regions[0].rows[0].cells[2].url.href || "",
      portrait: teamDetailData.data.regions[0].rows[0].cells[3].image.url || "",
      liga: teamDetailData.data.regions[0].rows[0].cells[4].text[0] || "",
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
  const data = await fetch("https://api-v2.swissunihockey.ch/api/teams/" + teamId);
  const teamData = await data.json();
  // console.log(teamData);

  return {
    id: teamId,
    name: teamData.data.regions[0].rows[0].cells[0].text[0],
  };
}

async function getClubs() {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/clubs");
  const clubData = await data.json();
  const clubList = <any>[];
  // clubData.entries.forEach(async (item: any) => {
  for (const item of clubData.entries) {
    // console.log(`Read Club: ${item.set_in_context.club_id} ${item.text}`);

    const contactPerson = "";
    const contactAddress = "";
    const contactPhone = "";
    const contactEmail = "";
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
          console.log(attribute.childNodes[0].textContent );
          console.log(parent.item(1)?.textContent as string);

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
      console.log(">>> error read & update address swissunihockey");
    } */
    clubList.push({
      id: item.set_in_context.club_id,
      name: item.text,
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
    /* console.log("NO SEASON!!!");
    const seasonList: any = getSeason();
    console.log(JSON.stringify(seasonList)); */

    season = await getSeason() as unknown as string;
    console.log(`No Season parameter provided. Used internal logic and found: ${season}`);
  }
  const data = await fetch("https://api-v2.swissunihockey.ch/api/games?mode=club&season=" + season + "&club_id=" + clubId + "&games_per_page=100");
  const gameData = await data.json();
  const gameList = [];
  if (gameData && gameData.data && gameData.data.regions && gameData.data.regions.length > 0) {
    for (const item of gameData.data.regions[0].rows) {
      let latitude = "-";
      let longitude = "-";
      try {
        latitude = item.cells[1].link.y || "-";
        longitude = item.cells[1].link.x || "-";
      } catch (e) {
        console.log(">> Error: Longitude/Latitude missing");
        // console.log(e);
      }
      gameList.push({
        id: item.link.ids[0],
        date: item.cells[0].text[0],
        time: item.cells[0].text[1] || "00:00",
        venue: item.cells[1].text[0],
        venueCity: item.cells[1].text[1] || "-",
        longitude: longitude,
        latitude: latitude,
        liga: item.cells[2].text[0],
        ligaText: "",
        result: item.cells[5].text[0],
      });
    }
    // gameData.data.regions[0].rows.forEach((item: any) => {
    // });
  } else {
    console.log(`>>> No Games found for Club ${clubId} and season ${season}`);
  }
  return gameList;
}

async function getGames(teamId: string, season: string) {
  if (!season) {
    season = await getSeason() as unknown as string;
    console.log(`No Season parameter provided. Used internal logic and found: ${season}`);
  }
  const data = await fetch("https://api-v2.swissunihockey.ch/api/games?mode=team&season=" + season + "&team_id=" + teamId + "&games_per_page=100");
  console.log("https://api-v2.swissunihockey.ch/api/games?mode=team&season=" + season + "&team_id=" + teamId + "&games_per_page=100");
  const gameData = await data.json();
  const gameList = <any>[];
  if (gameData && gameData.data && gameData.data.regions && gameData.data.regions.length > 0) {
    // gameData.data.regions[0].rows.forEach((item: any) => {
    for (const item of gameData.data.regions[0].rows) {
      let latitude = "-";
      let longitude = "-";
      try {
        latitude = item.cells[1].link.y || "-";
        longitude = item.cells[1].link.x || "-";
      } catch (e) {
        console.log(">> Error: Longitude/Latitude missing");
        console.log({
          id: item.link.ids[0],
          date: item.cells[0].text[0],
          time: item.cells[0].text[1] || "00:00",
          venue: item.cells[1].text[0],
          venueCity: item.cells[1].text[1] || "-",
          longitude: longitude,
          latitude: latitude,
          result: item.cells[4].text[0],
        });
        // console.log(e);
      }
      gameList.push({
        id: item.link.ids[0],
        date: item.cells[0].text[0],
        time: item.cells[0].text[1] || "00:00",
        venue: item.cells[1].text[0],
        venueCity: item.cells[1].text[1] || "-",
        longitude: longitude,
        latitude: latitude,
        result: item.cells[4].text[0],
      });
    }
    // });
  } else {
    console.log(`>>> No Games found for Team ${teamId} and season ${season}`);
  }
  return gameList;
}

async function getGame(gameId: string) {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/games/" + gameId);
  try {
    const gameData = await data.json();
    const gameDetailData = gameData.data.regions[0].rows[0];
    // console.log(gameDetailData);
    return {
      name: gameData.data.title,
      description: gameData.data.subtitle,

      teamHomeId: "su-" + gameDetailData.cells[0].link.ids[0],
      teamHome: gameDetailData.cells[1].text[0],
      teamHomeLogo: gameDetailData.cells[0].image.url,
      teamHomeLogoText: gameDetailData.cells[0].image.alt,

      teamAwayId: "su-" + gameDetailData.cells[2].link.ids[0],
      teamAway: gameDetailData.cells[3].text[0],
      teamAwayLogo: gameDetailData.cells[2].image.url,
      teamAwayLogoText: gameDetailData.cells[2].image.alt,

      referee1: gameDetailData.cells[8].text[0],
      referee2: gameDetailData.cells[9].text[0],
      spectators: gameDetailData.cells[10].text[0],
    };
  } catch (e) {
    console.log(e);
    return {};
  }
}

async function getSeason() {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/seasons");
  const seasonData = await data.json();
  const currentSeason = seasonData.entries.filter((element: any, index: any) => {
    return element.highlight === true; // && index === 0; // 2024 / 25
    // return element.highlight === true && index === 0; // 2024 / 25
    // return element.highlight === false && index === 0; // 2023 / 24
  });
  return currentSeason[0].set_in_context.season as string;
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
  const data = await fetch("https://api-v2.swissunihockey.ch/api/seasons");
  const seasonData = await data.json();
  // console.log(seasonData.entries);
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
    console.log(`No Season parameter provided. Used internal logic and found: ${season}`);
  }
  const data = await fetch("https://api-v2.swissunihockey.ch/api/rankings?season=" + season + "&team_id=" + teamId);
  const rankingData = await data.json();
  // console.log(JSON.stringify(rankingData));
  const rankingList = <any>[];
  // rankingData.data.regions[0].rows.forEach((item: any) => {

  const headers = rankingData.data.headers;

  if (rankingData && rankingData.data && rankingData.data.regions && rankingData.data.regions.length > 0 && rankingData.data.regions[0].rows) {
    for (const item of rankingData.data.regions[0].rows) {
      /* let url = "";
      if (item.cells[1] && item.cells[1].image && item.cells[1].image.url) {
        url = item.cells[1].image.url;
      }*/

      rankingList.push({
        id: item.data.team.id,
        name: item.data.team.name, // 2 teamname // headers.findIndex(head=>head.text="Rg.")
        image: item.cells[headers.findIndex((head: { text: string; }) => head.text == "")].image.url || "",
        games: item.cells[headers.findIndex((head: { text: string; }) => head.text == "Sp")].text[0] || "", // Sp Spiele 3
        gamesSoW: item.cells[headers.findIndex((head: { text: string; }) => head.text == "SoW")].text[0] || "", // SoW Spiele ohne Wertung 4
        wins: item.cells[headers.findIndex((head: { text: string; }) => head.text == "S")].text[0] || "", // S Siege 5
        loss: item.cells[headers.findIndex((head: { text: string; }) => head.text == "N")].text[0] || "", // N Niederlage 7
        draw: item.cells[headers.findIndex((head: { text: string; }) => head.text == "U")].text[0] || "", // U Unentschieden 6
        goals: item.cells[headers.findIndex((head: { text: string; }) => head.text == "T")].text[0] || "", // T Tore 8
        goalDifference: item.cells[headers.findIndex((head: { text: string; }) => head.text == "TD")].text[0] || "", // TD Tordifferenz 9
        pointQuotient: item.cells[headers.findIndex((head: { text: string; }) => head.text == "PQ")].text[0] || "", // PQ 10
        points: item.cells[headers.findIndex((head: { text: string; }) => head.text == "P")].text[0] || "", // P 11
        ranking: item.data.rank, // 0
        season: season,
        title: rankingData.data.title,
      });
    }
  }
  // });
  return rankingList;
}

async function getStatistics(teamId: string) {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/teams/" + teamId + "/statistics");
  const statisticsData = await data.json();

  const statisticsList = <any>[];
  // statisticsData.data.regions[0].rows.forEach((item: any) => {
  for (const item of statisticsData.data.regions[0].rows) {
    console.log(JSON.stringify(item.cells[1]), JSON.stringify(item.cells[3]));
  }
  // });
  return statisticsList;
}


async function getNews() {
  const data = await fetch("https://api.newsroom.co/walls?token=xgoo9jkoc2ee&count=30&channelId=663&tag=top,pin,!top,!pin");
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
