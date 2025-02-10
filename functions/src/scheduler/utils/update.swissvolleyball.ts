/* eslint-disable max-len */

/* eslint-disable @typescript-eslint/no-explicit-any */
import firebaseDAO from './../../firebaseSingleton.js';
const db = firebaseDAO.instance.db;
import {logger} from 'firebase-functions';
import resolversSV from './../../graphql/swissvolley/resolvers.js';

export async function updateGamesSwissvolley(): Promise<any> {
  logger.info('Update Games swissvolley');

  // Get Clubs from DB where Type = SWISS UNIHOCKEY && STATUS is active
  const clubListRef = await db.collection('club').where('active', '==', true).where('type', '==', 'swissvolley').get();
  for (const clubData of clubListRef.docs) {
    // create Club Object from DB.
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};

    // TEAM GAMES
    // TODO -> GET FROM DB instead of API -> Teams should be updated with another JOB
    const teamData = await resolversSV.Club.teams({id: `${club.id}`});
    for (const team of teamData) {
      logger.info(`>> READ TEAM GAMES: ${team.id} ${team.name} ${team.liga} `);
      const gamesData = await resolversSV.Team.games({id: `${team.id}`}, {}, {}, {});
      for (const i in gamesData) {
        if (gamesData[i]) {
          const game = gamesData[i];
          logger.info(`>>> READ TEAM GAME:  ${game.id}`);

          const clubRef = await db.collection('club').doc(`sv-${club.id}`).get();
          const teamRef = await db.collection('teams').doc(`sv-${team.id}`).get();
          // logger.info("read match report for game: " + game.id);

          // await db.collection("teams").doc(`sv-${team.id}`).collection("games").doc(`sv-${game.id}`).get();
          await db.collection('teams').doc(`sv-${team.id}`).collection('games').doc(`sv-${game.id}`).set({
            externalId: `${game.id}`,
            date: game.playDate.substr(8, 2) + '.' + game.playDate.substr(5, 2) + '.' + game.playDate.substr(0, 4),
            time: game.time,
            dateTime: game.playDate,
            location: game.hall.caption,
            street: game.hall.street + ' ' + game.hall.number,
            city: game.hall.city,
            longitude: game.hall.longitude,
            latitude: game.hall.latitude,
            liga: game.league.leagueId,

            name: game.league.caption,
            description: game.phase.caption,

            teamHomeId: game.teams.home.teamId,
            teamHome: game.teams.home.caption,
            teamHomeLogo: game.teams.home.logo,
            teamHomeLogoText: game.teams.home.caption,

            teamAwayId: game.teams.away.teamId,
            teamAway: game.teams.away.caption,
            teamAwayLogo: game.teams.away.logo,
            teamAwayLogoText: game.teams.away.caption,

            referee1: '', // game.referee[0] || "",
            referee2: '', // game.referee[1] || "",
            spectators: '',

            result: '',
            type: 'swissvolley',
            updated: new Date(),
            clubRef: clubRef.ref,
            teamRef: teamRef.ref,
          }, {
            merge: true,
          });
        }
      }
    }
  }
}

export async function updateTeamsSwissvolleyball(): Promise<any> {
  logger.info('Update Teams SwissVolley');

  // GET Clubs from DB where Type = SWISSVOLLEY && STATUS is active
  const clubListRef = await db.collection('club').where('active', '==', true).where('type', '==', 'swissvolley').get();
  for (const clubData of clubListRef.docs) {
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};
    /* const associationsData = await resolversSV.SwissVolley.associations({}, {}, {}, {});
    for (const assocation of associationsData) {
      const clubData = await resolversSV.SwissVolley.clubs({}, {associationId: assocation.id}, {}, {});
      for (const club of clubData) {
        const fbClubData = await db.collection("club").doc(`sv-${club.id}`).get();
        if (fbClubData.exists && fbClubData.data().active) { */
    const teamData = await resolversSV.Club.teams({id: `${club.id}`});
    for (const team of teamData) {
      logger.info(club.name + ' / ' + team.name);
      await db.collection('teams').doc(`sv-${team.id}`).set({
        externalId: `${team.id}`,
        name: team.name,
        liga: team.liga,
        info: team.info,
        logo: team.logo,
        associationId: clubData.data().associationId,
        type: 'swissvolley',
        updated: new Date(),
        clubRef: clubData.ref,
        clubId: clubData.id,
      }, {
        merge: true,
      });
      await db.collection('club').doc(`sv-${club.id}`).collection('teams').doc(`sv-${team.id}`).set({
        teamRef: db.collection('teams').doc(`sv-${team.id}`),
      });
    }
    /* } else {
          logger.info(`${club.name} is not active`);
        }
      }*/
  }
}

export async function updateClubsSwissvolleyball(): Promise<any> {
  logger.info('Update Clubs Swissvolley');

  // const associationsData = await resolversSV.SwissVolley.associations({}, {}, {}, {});
  // for (const assocation of associationsData) {
  const clubData = await resolversSV.SwissVolley.clubs({}, {}, {}, {});
  for (const club of clubData) {
    logger.info(club.name);
    await db.collection('club').doc(`sv-${club.id}`).set({
      externalId: `${club.id}`,
      name: club.name,
      website: club.website,
      type: 'swissvolley',
      updated: new Date(),

    }, {
      merge: true,
    });
    const clubRef = await db.collection('club').doc(`sv-${club.id}`).get();
    await db.collection('club').doc(`sv-${club.id}`).collection('contacts').doc(`sv-${club.id}`).set({
      ...club.contact,
      type: 'swissvolley',
      updated: new Date(),
      clubId: clubRef.id,
      clubRef: clubRef.ref,
    }, {
      merge: true,
    });

    await db.collection('venues').doc(`sv-${club.id}`).set({
      ...club.mainHall,
      clubRef: clubRef.ref,
      clubId: clubRef.id,
      type: 'swissvolley',
      updated: new Date(),
    }, {
      merge: true,
    });
  }
  // }
}

export async function updateNewsSwissvolley(): Promise<any> {
  logger.info('Update NEWS SwissVolley');

  const newsData = await resolversSV.SwissVolley.news();
  for (const news of newsData) {
    const newsDoc = await db.collection('news').doc(`sv-${news.id}`).get();
    if (!newsDoc.exists) {
      await db.collection('news').doc(`sv-${news.id}`).set({
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
        type: 'swissvolley',
        updated: new Date(),
      }, {
        merge: true,
        ignoreUndefinedProperties: true,
      });
    }
  }
}
