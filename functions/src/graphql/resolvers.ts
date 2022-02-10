/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require("node-fetch");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {convert} = require("html-to-text");

export default {
  Query: {
    clubs: () => {
      return getClubs();
    },

    team: (parent: any, args: { teamId: string}, context: any, info: any) => {
      return getTeam(args.teamId);
    },

    teams: (parent: any, args: { clubId: string; season: string; }, context: any, info: any) => {
      return getTeams(args.clubId, args.season);
    },

    games: (parent: any, args: { teamId: string; season: string; }, context: any, info: any) => {
      return getGames(args.teamId, args.season);
    },
    clubGames: (parent: any, args: { clubId: string; season: string; }, context: any, info: any) => {
      return getClubGames(args.clubId, args.season);
    },
    seasons: () => {
      return getSeason();
    },
    rankings: (parent: any, args: { id: string; season: string; }, context: any, info: any) => {
      return getRankings(args.id, args.season);
    },
    news: () => {
      return getNews();
    },
  },
  Club: {
    teams(parent: any, args: any, context: any, info: any) {
      return getTeams(parent.id, "2021");
    },
  },
  Team: {
    games(parent: any, args: any, context: any, info: any) {
      try {
        const seasonParam = info.operation.selectionSet.selections[0].arguments.find((element:any)=>{
          return element.kind === "Argument" && element.name.kind === "Name" && element.name.value === "season";
        });
        return getGames(parent.id, seasonParam.value.value);
      } catch (e) {
        return getGames(parent.id, "");
      }
    },
    rankings(parent: any, args: any, context: any, info: any) {
      try {
        const seasonParam = info.operation.selectionSet.selections[0].arguments.find((element:any)=>{
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
};

async function getTeams(clubId: string, season: string) {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/teams?mode=by_club&club_id=" + clubId + "&season=" + season);
  const teamData = await data.json();
  const teamList = < any > [];
  // console.log(teamData);
  teamData.entries.forEach((item: any) => {
    teamList.push({
      id: item.set_in_context.team_id,
      name: item.text,
    });
  });
  return teamList;
}

async function getTeam(teamId: string) {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/teams/" + teamId );
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
  const clubList = < any > [];
  clubData.entries.forEach((item: any) => {
    clubList.push({
      id: item.set_in_context.club_id,
      name: item.text,
    });
  });
  return clubList;
}

async function getClubGames(clubId: string, season: string) {
  if (!season) {
    console.log("NO SEASON!!!");
    const seasonList:any = getSeason();
    console.log(JSON.stringify(seasonList));
  }
  const data = await fetch("https://api-v2.swissunihockey.ch/api/games?mode=club&season=" + season + "&club_id=" + clubId);
  const gameData = await data.json();
  const gameList = < any > [];
  gameData.data.regions[0].rows.forEach((item: any) => {
    gameList.push({
      id: item.link.ids[0],
    });
  });
  return gameList;
}

async function getGames(teamId: string, season: string) {
  if (!season) {
    season = await getCurrentSeason() as unknown as string;
    console.log("NO SEASON!!!", season);
  }
  const data = await fetch("https://api-v2.swissunihockey.ch/api/games?mode=team&season=" + season + "&team_id=" + teamId);
  const gameData = await data.json();
  const gameList = < any > [];
  gameData.data.regions[0].rows.forEach((item: any) => {
    gameList.push({
      id: item.link.ids[0],
    });
  });
  return gameList;
}

async function getCurrentSeason() {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/seasons");
  const seasonData = await data.json();
  const currentSeason = seasonData.entries.filter((element:any, index:any)=> {
    return element.highlight === false && index === 1;
  });
  return currentSeason[0].set_in_context.season as string;
}

async function getSeason() {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/seasons");
  const seasonData = await data.json();
  // console.log(seasonData.entries);
  const seasonList = < any > [];
  seasonData.entries.forEach((item: any) => {
    seasonList.push({
      id: item.set_in_context.season,
      name: item.text,
      season: item.set_in_context.season,
      highlight: item.highlight,
    });
  });
  return seasonList;
}

async function getRankings(teamId: string, season: string) {
  if (!season) {
    season = await getCurrentSeason() as unknown as string;
    console.log("NO SEASON!!!", season);
  }
  const data = await fetch("https://api-v2.swissunihockey.ch/api/rankings?season=" + season + "&team_id=" + teamId);
  const rankingData = await data.json();
  console.log(JSON.stringify(rankingData));
  const rankingList = < any > [];
  rankingData.data.regions[0].rows.forEach((item: any) => {
    rankingList.push({
      id: item.data.team.id,
      name: item.data.team.name,
      ranking: item.data.rank,
    });
  });
  return rankingList;
}

async function getStatistics(teamId: string) {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/teams/" + teamId + "/statistics");
  const statisticsData = await data.json();

  const statisticsList = < any > [];
  statisticsData.data.regions[0].rows.forEach((item:any)=> {
    console.log(JSON.stringify(item.cells[1]), JSON.stringify(item.cells[3]));
  });
  return statisticsList;
}


async function getNews() {
  const data = await fetch("https://api.newsroom.co/walls?token=xgoo9jkoc2ee&count=30&channelId=663&tag=top,pin,!top,!pin");
  const newsData = await data.json();
  const newsList = < any > [];
  newsData._embedded.wallList.forEach((item: any) => {
    console.log(item);
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
  });
  return newsList;
}
