/* eslint-disable guard-for-in */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
import firebaseDAO from "./../../firebaseSingleton";
import resolversSH from "./../../graphql/swisshandball/resolvers";

const db = firebaseDAO.instance.db;

import fs = require("fs");
const handballHallenJSON = fs.readFileSync("./src/scheduler/utils/handball_hallen.json", "utf8");

export async function updateGamesSwisshandball(): Promise<any> {
  console.log("Update Games swisshandball");

  // Get Clubs from DB where Type = SWISS HANDBALL && STATUS is active
  const clubListRef = await db.collection("club").where("active", "==", true).where("type", "==", "swisshandball").get();
  for (const clubData of clubListRef.docs) {
    // create Club Object from DB.
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};

    // GET CLUB GAMES
    console.log(`> GET CLUB GAMES:  ${club.id} ${club.name}`);

    // Get ALL CLUB GAMES from club based on API from SWISS HANDBALL
    const clubGamesData = await resolversSH.Club.games({id: `${club.id}`}, {}, {}, {});
    for (const i in clubGamesData) {
      // Create Game Object
      const game = clubGamesData[i];
      console.log(`>> READ CLUB GAME::  ${game.id}`);

      // Get Game Detail --> Does not edxist for handball
      // const gameDetail = await resolversSH.SwissHandball.game({}, {gameId: game.id}, {}, {});

      await db.collection("club").doc(`sh-${club.id}`).collection("games").doc(`sh-${game.id}`).set({
        ...game,
        location: game.venue,
        city: game.venueCity,
        externalId: `${game.id}`,
        type: "swisshandball",
        updated: new Date(),
        clubRef: clubData.ref,
        clubId: clubData.id,
      }, {
        merge: true,
      });
    }
    // TEAM GAMES
    // TODO -> GET FROM DB instead of API -> Teams should be updated with another JOB
    const teamData = await resolversSH.Club.teams({id: `${club.id}`}, {}, {}, {});
    for (const team of teamData) {
      console.log(`>> Team: ${team.id} ${team.name} ${team.liga} `);
      const gamesData = await resolversSH.Team.games({id: `${team.id}`, clubId: `${club.id}`}, {}, {}, {});
      for (const i in gamesData) {
        const game = gamesData[i];
        console.log(`>>> Read Team Game:  ${game.id}`);

        const clubRef = await db.collection("club").doc(`sh-${club.id}`).get();
        const teamRef = await db.collection("teams").doc(`sh-${team.id}`).get();
        // console.log("read match report for game: " + game.id);

        // await db.collection("teams").doc(`sh-${team.id}`).collection("games").doc(`sh-${game.id}`).get();
        await db.collection("teams").doc(`sh-${team.id}`).collection("games").doc(`sh-${game.id}`).set({
          ...game,
          externalId: `${game.id}`,
          location: game.venue,
          city: game.venueCity,
          type: "swisshandball",
          updated: new Date(),
          clubRef: clubRef.ref,
          teamRef: teamRef.ref,
        }, {
          merge: true,
        });
      }
      // Get rankings
      const teamRankings = await resolversSH.Team.rankings({id: `${team.id}`, clubId: `${club.id}`}, {}, {}, {});
      console.log(" >> READ TEAM RANKINGS");
      for (const item of teamRankings) {
        console.log(JSON.stringify({
          title: item.title,
          season: item.season,
          updated: new Date(),
          type: "swisshandball",
        }));
        await db.collection("teams").doc(`sh-${team.id}`).collection("ranking").doc(`${item.season}`).set({
          title: item.title,
          season: item.season,
          updated: new Date(),
          type: "swisshandball",
        }, {
          merge: true,
        });
        await db.collection("teams").doc(`sh-${team.id}`).collection("ranking").doc(`${item.season}`).collection("table").doc(`${item.ranking}`).set(item);
      }
    }
  }
}
export async function updateTeamsSwisshandball(): Promise<any> {
  console.log("Update Teams SwissHandball");

  const clubListRef = await db.collection("club").where("active", "==", true).where("type", "==", "swisshandball").get();
  for (const clubData of clubListRef.docs) {
    // create Club Object from DB.
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};
    const teamData = await resolversSH.Club.teams({id: `${club.id}`}, {}, {}, {});
    for (const team of teamData) {
      console.log(club.name + " / " + team.name);
      await db.collection("teams").doc(`sh-${team.id}`).set({
        ...team,
        externalId: `${team.id}`,
        name: team.name,
        type: "swisshandball",
        logo: team.logo,
        liga: team.liga,
        updated: new Date(),
        clubId: `sh-${club.id}`,
        clubRef: db.collection("club").doc(`sh-${club.id}`),
      }, {
        merge: true,
      });
      await db.collection("club").doc(`sh-${club.id}`).collection("teams").doc(`sh-${team.id}`).set({
        teamRef: db.collection("teams").doc(`sh-${team.id}`),
      });
    }
  }
}

export async function updateClubsSwisshandball(): Promise<any> {
  console.log("Update Clubs swisshandball");

  const clubData = await resolversSH.SwissHandball.clubs();
  for (const club of clubData) {
    console.log(club.name);

    const hallen = club.halls;

    const tempData = club;
    delete tempData.contact_person;
    delete tempData.halls;
    delete tempData.teams;


    await db.collection("club").doc(`sh-${club.id}`).set({
      ...tempData,
      externalId: `${club.id}`,
      name: club.name,
      type: "swisshandball",
      logo: club.logo,
      website: club.website,
      latitude: club.latitude,
      longitude: club.longitude,
      foundingYear: club.foundingYear,
      updated: new Date(),
    }, {
      merge: true,
    });
    const clubRef = await db.collection("club").doc(`sh-${club.id}`).get();
    // Update contacts
    await db.collection("club").doc(`sh-${club.id}`).collection("contacts").doc(`sh-${club.id}`).set({
      ...club.contact_person,
      clubRef: clubRef.ref,
      clubId: clubRef.id,
      type: "swisshandball",
      updated: new Date(),
    }, {
      merge: true,
    });
    // Update venues
    // console.log(JSON.stringify(club.halls));
    // if (club && club.halls && club.halls.length > 0) {
    try {
      for (const venue of hallen) {
        const parts = venue.link.split("/");
        const number = parts[parts.length - 1];
        await db.collection("venues").doc(`sh-${number}`).set({
          ...venue,
          clubRef: clubRef.ref,
          clubId: clubRef.id,
          type: "swisshandball",
          updated: new Date(),
        }, {
          merge: true,
        });
      }
    } catch (e) {
      console.log(hallen);
    }
  }
  // HALLEN / NOT NEEDED TO frequently update this..
  const data: Array<any> = JSON.parse(handballHallenJSON);

  for (const halle of data) {
    await db.collection("venues").doc(`sh-${halle.id}`).set({
      ...halle,
      type: "swisshandball",
      updated: new Date(),
    }, {
      merge: true,
    });
  }
}

export async function updateNewsSwisshandball(): Promise<any> {
  console.log("Update NEWS swisshandball");

  const newsData = await resolversSH.SwissHandball.news();
  for (const news of newsData) {
    const newsDoc = await db.collection("news").doc(`sh-${news.id}`).get();
    if (!newsDoc.exists) {
      await db.collection("news").doc(`sh-${news.id}`).set({
        externalId: `${news.id}`,
        title: news.title,
        leadText: news.leadText + " ..." || " ",
        date: news.date,
        slug: news.slug || " ",
        image: news.image || " ",
        text: news.text || " ",
        htmlText: news.htmlText || " ",
        tags: news.tags || " ",
        author: news.author || " ",
        authorImage: news.authorImage || " ",
        url: news.url || " ",
        type: "swisshandball",
        updated: new Date(),
      }, {
        merge: true,
        ignoreUndefinedProperties: true,
      });
    }
  }
}
