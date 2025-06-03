/* eslint-disable guard-for-in */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
import firebaseDAO from './../../firebaseSingleton.js';
import resolversSH from './../../graphql/swisshandball/resolvers.js';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
// const admin = require("firebase-admin");
const MAX_WRITES_PER_BATCH = 500;

// import fs = require("fs");
// const handballHallenJSON = fs.readFileSync("./src/scheduler/utils/handball_hallen.json", "utf8");

export async function updateGamesSwisshandball(): Promise<any> {
  logger.info('Update Games swisshandball');

  // Get Clubs from DB where Type = SWISS HANDBALL && STATUS is active
  const clubListRef = await db.collection('club').where('active', '==', true).where('type', '==', 'swisshandball').get();
  for (const clubData of clubListRef.docs) {
    // create Club Object from DB.
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};

    // GET CLUB GAMES
    logger.info(`> GET CLUB GAMES:  ${club.id} ${club.name}`);

    // Get ALL CLUB GAMES from club based on API from SWISS HANDBALL
    const clubGamesData = await resolversSH.Club.games({id: `${club.id}`}, {}, {}, {});
    for (const i in clubGamesData) {
      // Create Game Object
      const game = clubGamesData[i];
      logger.info(`>> READ CLUB GAME::  ${game.id}`);

      // Get Game Detail --> Does not edxist for handball
      // const gameDetail = await resolversSH.SwissHandball.game({}, {gameId: game.id}, {}, {});

      await db.collection('club').doc(`sh-${club.id}`).collection('games').doc(`sh-${game.id}`).set({
        ...game,
        location: game.venue,
        city: game.venueCity,
        externalId: `${game.id}`,
        type: 'swisshandball',
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
      logger.info(`>> Team: ${team.id} ${team.name} ${team.liga} `);
      const gamesData = await resolversSH.Team.games({id: `${team.id}`, clubId: `${club.id}`}, {}, {}, {});
      for (const i in gamesData) {
        const game = gamesData[i];
        logger.info(`>>> Read Team Game:  ${game.id}`);

        const clubRef = await db.collection('club').doc(`sh-${club.id}`).get();
        const teamRef = await db.collection('teams').doc(`sh-${team.id}`).get();
        // logger.info("read match report for game: " + game.id);

        // await db.collection("teams").doc(`sh-${team.id}`).collection("games").doc(`sh-${game.id}`).get();
        await db.collection('teams').doc(`sh-${team.id}`).collection('games').doc(`sh-${game.id}`).set({
          ...game,
          externalId: `${game.id}`,
          location: game.venue,
          city: game.venueCity,
          type: 'swisshandball',
          updated: new Date(),
          clubRef: clubRef.ref,
          teamRef: teamRef.ref,
        }, {
          merge: true,
        });
      }
      // Get rankings
      const teamRankings = await resolversSH.Team.rankings({id: `${team.id}`, clubId: `${club.id}`}, {}, {}, {});
      logger.info(' >> READ TEAM RANKINGS');
      for (const item of teamRankings) {
        logger.info(JSON.stringify({
          title: item.title,
          season: item.season,
          updated: new Date(),
          type: 'swisshandball',
        }));
        await db.collection('teams').doc(`sh-${team.id}`).collection('ranking').doc(`${item.season}`).set({
          title: item.title,
          season: item.season,
          updated: new Date(),
          type: 'swisshandball',
        }, {
          merge: true,
        });
        await db.collection('teams').doc(`sh-${team.id}`).collection('ranking').doc(`${item.season}`).collection('table').doc(`${item.ranking}`).set(item);
      }
    }
  }
}
export async function updateTeamsSwisshandball(): Promise<any> {
  logger.info('Update Teams SwissHandball');

  const clubListRef = await db.collection('club').where('active', '==', true).where('type', '==', 'swisshandball').get();
  for (const clubData of clubListRef.docs) {
    // create Club Object from DB.
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};
    const teamData = await resolversSH.Club.teams({id: `${club.id}`}, {}, {}, {});
    for (const team of teamData) {
      logger.info(club.name + ' / ' + team.name);
      await db.collection('teams').doc(`sh-${team.id}`).set({
        ...team,
        externalId: `${team.id}`,
        name: team.name,
        type: 'swisshandball',
        logo: team.logo,
        liga: team.liga,
        updated: new Date(),
        clubId: `sh-${club.id}`,
        clubRef: db.collection('club').doc(`sh-${club.id}`),
      }, {
        merge: true,
      });
      await db.collection('club').doc(`sh-${club.id}`).collection('teams').doc(`sh-${team.id}`).set({
        teamRef: db.collection('teams').doc(`sh-${team.id}`),
      });
    }
  }
}

export async function updateClubsSwisshandball(): Promise<any> {
  logger.info('Update Clubs swisshandball');
  const clubData = await resolversSH.SwissHandball.clubs();
  updateClubsInBatches(clubData)
      .then(() => {
        logger.info('All handball clubs updated successfully');
      })
      .catch((error) => {
        logger.error('Error updating handball clubs in batches:', error);
      });

  // HALLEN / NOT NEEDED TO frequently update this..
  /* const data: Array<any> = JSON.parse(handballHallenJSON);

  for (const halle of data) {
    await db.collection("venues").doc(`sh-${halle.id}`).set({
      ...halle,
      type: "swisshandball",
      updated: new Date(),
    }, {
      merge: true,
    });
  } */
}

export async function updateNewsSwisshandball(): Promise<any> {
  logger.info('Update NEWS swisshandball');

  const newsData = await resolversSH.SwissHandball.news();
  for (const news of newsData) {
    console.log(news);
    const newsDoc = await db.collection('news').doc(`sh-${news.id}`).get();
    if (!newsDoc.exists) {
      await db.collection('news').doc(`sh-${news.id}`).set({
        externalId: `${news.id}`,
        title: news.title,
        leadText: news.leadText + ' ...' || ' ',
        date: news.date,
        slug: news.slug || ' ',
        image: news.image || ' ',
        text: news.text || ' ',
        htmlText: news.htmlText || ' ',
        tags: news.tags || ' ',
        author: news.author || ' ',
        authorImage: news.authorImage || ' ',
        url: news.url || ' ',
        type: 'swisshandball',
        updated: new Date(),
      }, {
        merge: true,
        ignoreUndefinedProperties: true,
      });
    }
  }
}

// Function to batch update documents
async function updateClubsInBatches(clubData: any) {
  const batches = [];
  let batch = db.batch(); // Initialize a batch
  let batchSize = 0;

  for (const club of clubData) {
    logger.info(club.name, club.id);

    // const hallen = club.halls;

    const tempData = club;
    delete tempData.contact_person;
    delete tempData.halls;
    delete tempData.teams;

    const clubRefHandball = db.collection('club').doc(`sh-${club.id}`);
    batch.set(clubRefHandball, {
      ...tempData,
      externalId: `${club.id}`,
      name: club.name,
      type: 'swisshandball',
      logo: club.logo,
      website: club.website,
      latitude: club.latitude,
      longitude: club.longitude,
      foundingYear: club.foundingYear,
      updated: new Date(),
    }, {
      merge: true,
    });
    batchSize++;
    // If batch reaches max writes, commit it and start a new batch
    if (batchSize >= MAX_WRITES_PER_BATCH ) {
      batches.push(batch.commit());
      batch = db.batch(); // Start a new batch
      batchSize = 0;
    }

    const clubRef = await db.collection('club').doc(`sh-${club.id}`).get();
    // Create a reference for the club's contacts document
    const contactRef = db.collection('club').doc(`sh-${club.id}`).collection('contacts').doc(`sh-${club.id}`);
    batch.set(contactRef, {
      ...club.contact_person,
      clubRef: clubRef.ref,
      clubId: clubRef.id,
      type: 'swisshandball',
      updated: new Date(),
    }, {
      merge: true,
    });

    batchSize++;

    // Update venues
    // logger.info(JSON.stringify(club.halls));
    // if (club && club.halls && club.halls.length > 0) {
    /* try {
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
      logger.info(hallen);
    } */

    // If batch reaches max writes, commit it and start a new batch
    if (batchSize >= MAX_WRITES_PER_BATCH ) {
      batches.push(batch.commit());
      batch = db.batch(); // Start a new batch
      batchSize = 0;
    }
  }

  // Commit any remaining writes in the last batch
  if (batchSize > 0) {
    batches.push(batch.commit());
  }

  // Wait for all batches to complete

  try {
    const results = await Promise.all(batches);
    logger.info('Batch SwissHandball', results);
    /* for (const result of results) {
      logger.info("Batch erfolgreich:", result);
    } */
  } catch (error: any) {
    logger.error('Batch-Fehler:', error.code, error.message);
  }
}


