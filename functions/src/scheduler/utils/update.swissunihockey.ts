/* eslint-disable guard-for-in */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */

// import * as firebase from 'firebase-admin';
import {logger} from 'firebase-functions';
import firebaseDAO from './../../firebaseSingleton.js';
import resolversSU from './../../graphql/swissunihockey/resolvers.js';
// import OpenAI from "openai";
import * as fs from 'fs';
import {Timestamp} from 'firebase-admin/firestore';

const db = firebaseDAO.instance.db;

/* import {defineSecret} from 'firebase-functions/params';
const chatgptApiKey = defineSecret('API_CHATGPT'); */

/* const openai = new OpenAI({
  apiKey: chatgptApiKey.value(), // defaults to process.env["OPENAI_API_KEY"]
}); */

// Read the contents of the file
const myJson = fs.readFileSync('./src/scheduler/utils/clubArray.json', 'utf8');

export async function updateGamesSwissunihockey(): Promise<any> {
  logger.info('Update Games SwissUnihockey');

  // Get Clubs from DB where Type = SWISS UNIHOCKEY && STATUS is active
  const clubListRef = await db.collection('club').where('active', '==', true).where('type', '==', 'swissunihockey').get();
  for (const clubData of clubListRef.docs) {
    // create Club Object from DB.
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};

    // GET CLUB GAMES
    logger.info(`> GET CLUB GAMES:  ${club.id} ${club.name}`);

    // Get ALL CLUB GAMES from club based on API from SWISS UNIHOCKEY
    const clubGamesData = await resolversSU.Club.games({id: `${club.id}`}, {}, {}, {});
    for (const i in clubGamesData) {
      // Create Game Object
      const game = clubGamesData[i];
      logger.info(`>> READ CLUB GAME:  ${game.id}`);

      // Get Game Detail
      const gameDetail = await resolversSU.SwissUnihockey.game({}, {gameId: game.id}, {}, {});

      // If datefield is properly set with swiss unihockey date value in the format 31.12.2022
      if (game.date.charAt(2) !== '.') {
        if (game.date === 'Abgesagt') {
          logger.info('abgesagt -> new Date()');
          game.date = new Date().toISOString();
          game.date = game.date.substr(8, 2) + '.' + game.date.substr(5, 2) + '.' + game.date.substr(0, 4);
          // get creative :)
        } else {
          // Date & TIme can be fetched from previous import
          const previousImported = await db.collection('club').doc(`su-${club.id}`).collection('games').doc(`su-${game.id}`).get();
          game.time = previousImported.data().time;
          game.date = previousImported.data().date;
        }
      } else if (game.date === '???' || game.time === '???') {
        if (game.date === '???') {
          game.date = new Date().toISOString();
          game.date = game.date.substr(8, 2) + '.' + game.date.substr(5, 2) + '.' + game.date.substr(0, 4);
        }
        game.time = '00:00';
      } else {
        // Alles normal
        // game.date = "11.03.2023"
      }
      // logger.info(`Game Time: ${game.time} / Game Date: ${game.date}`);
      const gameDateTime: Timestamp = Timestamp.fromDate(new Date(`${game.date.substr(6, 4)}-${game.date.substr(3, 2)}-${game.date.substr(0, 2)}T${game.time}`));

      await db.collection('club').doc(`su-${club.id}`).collection('games').doc(`su-${game.id}`).set({
        externalId: `${game.id}`,
        date: game.date,
        time: game.time,
        dateTime: gameDateTime,
        venue: game.venue,
        venueCity: game.venueCity,
        location: game.venue,
        city: game.venueCity,

        longitude: game.longitude,
        latitude: game.latitude,
        liga: game.liga,
        ligaText: game.ligaText,

        name: gameDetail.name,
        description: gameDetail.description,

        teamHomeId: gameDetail.teamHomeId,
        teamHome: gameDetail.teamHome,
        teamHomeLogo: gameDetail.teamHomeLogo,
        teamHomeLogoText: gameDetail.teamHomeLogoText,

        teamAwayId: gameDetail.teamAwayId,
        teamAway: gameDetail.teamAway,
        teamAwayLogo: gameDetail.teamAwayLogo,
        teamAwayLogoText: gameDetail.teamAwayLogoText,

        referee1: gameDetail.referee1,
        referee2: gameDetail.referee2,
        spectators: gameDetail.spectators,


        result: game.result,
        type: 'swissunihockey',
        updated: new Date(),
        clubRef: clubData.ref,
        clubId: clubData.id,
      }, {
        merge: true,
      });
    }

    // TEAM GAMES
    // TODO -> GET FROM DB instead of API -> Teams should be updated with another JOB
    const teamData = await resolversSU.Club.teams({id: `${club.id}`}, {}, {}, {});
    for (const team of teamData) {
      logger.info(`>> READ TEAM GAMES: ${team.id} ${team.name} ${team.liga} `);
      const gamesData = await resolversSU.Team.games({id: `${team.id}`}, {}, {}, {});
      for (const i in gamesData) {
        const game = gamesData[i];
        logger.info(`>>> READ TEAM GAME:  ${game.id}`);

        const gameDetail = await resolversSU.SwissUnihockey.game({}, {gameId: game.id}, {}, {});

        // If datefield is properly set with swiss unihockey date value in the format 31.12.2022
        if (game.date.charAt(2) !== '.') {
          if (game.date === 'Abgesagt') {
            logger.info('abgesagt -> new Date()');
            game.date = new Date().toISOString();
            game.date = game.date.substr(8, 2) + '.' + game.date.substr(5, 2) + '.' + game.date.substr(0, 4);
            // get creative :)
          } else {
            // Date & TIme can be fetched from previous import
            const previousImported = await db.collection('club').doc(`su-${club.id}`).collection('games').doc(`su-${game.id}`).get();
            game.time = previousImported.data().time;
            game.date = previousImported.data().date;
          }
        } else if (game.date === '???' || game.time === '???') {
          if (game.date === '???') {
            game.date = new Date().toISOString();
            game.date = game.date.substr(8, 2) + '.' + game.date.substr(5, 2) + '.' + game.date.substr(0, 4);
          }
          game.time = '00:00';
        } else {
          // Alles normal
          // game.date = "11.03.2023"
        }
        // logger.info(`Game Time: ${game.time} / Game Date: ${game.date}`);
        const gameDateTime: Timestamp = Timestamp.fromDate(new Date(`${game.date.substr(6, 4)}-${game.date.substr(3, 2)}-${game.date.substr(0, 2)}T${game.time}`));

        const clubRef = await db.collection('club').doc(`su-${club.id}`).get();
        const teamRef = await db.collection('teams').doc(`su-${team.id}`).get();
        // logger.info("read match report for game: " + game.id);

        // await db.collection("teams").doc(`su-${team.id}`).collection("games").doc(`su-${game.id}`).get();
        await db.collection('teams').doc(`su-${team.id}`).collection('games').doc(`su-${game.id}`).set({
          externalId: `${game.id}`,
          date: game.date,
          time: game.time,
          dateTime: gameDateTime,
          location: game.venue,
          city: game.venueCity,
          longitude: game.longitude,
          latitude: game.latitude,
          liga: team.liga,

          name: gameDetail.name,
          description: gameDetail.description,

          teamHomeId: gameDetail.teamHomeId,
          teamHome: gameDetail.teamHome,
          teamHomeLogo: gameDetail.teamHomeLogo,
          teamHomeLogoText: gameDetail.teamHomeLogoText,

          teamAwayId: gameDetail.teamAwayId,
          teamAway: gameDetail.teamAway,
          teamAwayLogo: gameDetail.teamAwayLogo,
          teamAwayLogoText: gameDetail.teamAwayLogoText,

          referee1: gameDetail.referee1,
          referee2: gameDetail.referee2,
          spectators: gameDetail.spectators,

          result: game.result,
          type: 'swissunihockey',
          updated: new Date(),
          clubRef: clubRef.ref,
          clubId: clubRef.id,
          teamRef: teamRef.ref,
        }, {
          merge: true,
        });

        /* const matchReportRef = await db.collection("teams").doc(`su-${team.id}`).collection("reports").doc(`su-${game.id}`).get();
         if (!matchReportRef.exists) {
         const matchReport = await generateMatchReport(game.id);
          if (matchReport) {
            await db.collection("teams").doc(`su-${team.id}`).collection("reports").doc(`su-${game.id}`).set({
              externalId: `${game.id}`,
              text: matchReport,
              title: `Matchbericht ${gameDetail.name}`,
              leadText: `${game.result} - ${gameDetail.teamHome} vs. ${gameDetail.teamAway} vom ${gameRef.data().date} ${gameRef.data().time}`,
              date: gameRef.data().date,
              time: gameRef.data().time,
              clubRef: clubRef.ref,
              tags: "ChatGPT",
              gameRef: gameRef.ref,
              teamRef: teamRef.ref,
              type: "swissunihockey",
              updated: new Date(),
            }, {
              merge: true,
            });
          }
        } */
      }
      // Game still exists?
      // This is needed to identify if a game has been deleted in the swissunihockey api
      /* const gameList = await db.collection("teams").doc(`su-${team.id}`).collection("games").get();
      for (const gameDoc of gameList.docs) {
        const tempGame = await resolversSU.SwissUnihockey.game({}, {gameId: gameDoc.data().externalId}, {}, {});
        if (tempGame && tempGame.name) {
          // logger.info("game here..");
        } else {
          // Update status
          logger.info("Update status for firestore saved game: " + gameDoc.id + " reading gameDoc id: " + gameDoc.data().externalId);
          await db.collection("teams").doc(`su-${team.id}`).collection("games").doc(gameDoc.id).set({
            gameStatus: "deleted",
          }, {
            merge: true,
          });
        }
      }*/

      // Get rankings (only if there are games available from the graphql api)
      if (gamesData.length > 0) {
        const teamRankings = await resolversSU.Team.rankings({id: `${team.id}`}, {}, {}, {});
        logger.info(' >> READ TEAM RANKINGS');
        for (const item of teamRankings) {
          logger.info(JSON.stringify({
            title: item.title,
            season: item.season,
            updated: new Date(),
            type: 'swissunihockey',
          }));
          await db.collection('teams').doc(`su-${team.id}`).collection('ranking').doc(`${item.season}`).set({
            title: item.title,
            season: item.season,
            updated: new Date(),
            type: 'swissunihockey',
          }, {
            merge: true,
          });
          await db.collection('teams').doc(`su-${team.id}`).collection('ranking').doc(`${item.season}`).collection('table').doc(`${item.ranking}`).set(item);
        }
      } else {
        logger.info('No ranking update for team without games for season');
      }
    }
  }
}

export async function updateTeamsSwissunihockey(): Promise<any> {
  logger.info('Update Teams SwissUnihockey');
  // Teams von Swiss Unihockey aktualisieren, welche einen aktiven Club haben. Clubs werden via andere Funktion aktualisiert.
  const clubListRef = await db.collection('club').where('active', '==', true).where('type', '==', 'swissunihockey').get();
  for (const clubData of clubListRef.docs) {
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};
    let clubLogo = '';
    const teamData = await resolversSU.Club.teams({id: `${club.id}`}, {}, {}, {});
    for (const team of teamData) {
      logger.info(club.name + ' / ' + team.name);
      const clubRef = await db.collection('club').doc(`su-${club.id}`).get();
      const teamRef = await db.collection('teams').doc(`su-${team.id}`).get();
      clubLogo = team.logo;
      await db.collection('teams').doc(`su-${team.id}`).set({
        externalId: `${team.id}`,
        name: team.name,
        liga: team.liga,
        logo: team.logo,
        info: team.info,
        website: team.website,
        portrait: team.portrait,
        jahresbeitragWert: teamRef.data().jahresbeitragWert || 0.0,
        jahresbeitragWaehrung: teamRef.data().jahresbeitragWaehrung || 'CHF',
        trainingThreshold: teamRef.data().trainingThreshold || 24,
        championshipThreshold: teamRef.data().championshipThreshold || 48,
        // associationId: clubData.data().associationId, gibt es für unihockey nicht
        clubRef: clubRef.ref,
        clubId: clubRef.id,
        type: 'swissunihockey',
        updated: new Date(),
      }, {
        merge: true,
      });
      if (teamRef.ref) {
        await db.collection('club').doc(`su-${club.id}`).collection('teams').doc(`su-${team.id}`).set({
          teamRef: teamRef.ref,
        });
      }
    }

    if (clubLogo) {
      const clubRef = await db.collection('club').doc(`su-${club.id}`).get();
      logger.info(JSON.stringify(clubRef.data()));
      logger.info('set clublogo');
      await db.collection('club').doc(`su-${club.id}`).update({
        logo: clubLogo,
        updated: new Date(),
      }, {
        merge: true,
      });
    }
  }
}

export async function updateClubsSwissunihockey(): Promise<any> {
  logger.info('Update Clubs SwissUnihockey');

  const clubData = await resolversSU.SwissUnihockey.clubs();
  for (const club of clubData) {
    logger.info(club.name + ' ' + club.id);
    await db.collection('club').doc(`su-${club.id}`).set({
      externalId: `${club.id}`,
      name: club.name,
      type: 'swissunihockey',
      // website: ' ',
      // logo: '',
      updated: new Date(),
    }, {
      merge: true,
    });
    const clubRef = await db.collection('club').doc(`su-${club.id}`).get();
    // address
    for (const address of club.address) {
      address.externalId = address.id;
      address.type = 'swissunihockey';
      address.updated = new Date();
      await db.collection('club').doc(`su-${club.id}`).collection('contacts').doc(`su-${address.id}`).set({
        ...address,
        clubRef: clubRef.ref,
        clubId: clubRef.id,
      }, {
        merge: true,
      });
    }
  }

  // JSON Upload MIGRATION
  // logger.info(myJson);
  const data: Array<any> = JSON.parse(myJson);

  for (const clubData of data) {
    const clubRef = await db.collection('club').doc(`su-${clubData.id}`).get();
    // logger.info("clubdata > " + clubData);
    const address = {
      externalId: clubData.admin,
      type: 'swissunihockey',
      updated: new Date(),
      lastName: clubData.lastName,
      firstName: clubData.firstName,
      email: clubData.email,
    };

    await db.collection('club').doc(`su-${clubData.id}`).collection('contacts').doc(`su-${clubData.admin}`).set({
      ...address,
      clubRef: clubRef.ref,
      clubId: clubRef.id,
    }, {
      merge: true,
    });
  }
  return true;
}


export async function updateNewsSwissunihockey(): Promise<any> {
  logger.info('Update NEWS SwissUnihockey');

  const newsData = await resolversSU.SwissUnihockey.news();
  for (const news of newsData) {
    logger.info(news.title);
    const newsDoc = await db.collection('news').doc(`su-${news.id}`).get();
    if (!newsDoc.exists) {
      await db.collection('news').doc(`su-${news.id}`).set({
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
        type: 'swissunihockey',
        updated: new Date(),
      }, {
        merge: true,
        ignoreUndefinedProperties: true,
      });
    }
  }
}


// Internal Methods

/*
async function generateMatchReport(gameId: string): Promise<string> {
  const data = await fetch("https://api-v2.swissunihockey.ch/api/games/" + gameId + "/summary");
  const gameSummary = await data.json();

  if (gameSummary && gameSummary.data &&
    gameSummary.data.regions.length > 0 &&
    gameSummary.data.regions[0].rows.length > 0 &&
    gameSummary.data.regions[0].rows[0].cells.length > 0) {
    const prompt = gameSummary.data.regions[0].rows[0].cells[0].text[0] + ". " + gameSummary.data.regions[0].rows[0].cells[1].text[0] + ". " + gameSummary.data.regions[0].rows[0].cells[2].text[0] + ". " + gameSummary.data.regions[0].rows[0].cells[2].text[1];

    logger.info(">>> MAGIC " + prompt);

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4', // model: 'gpt-3.5-turbo',
    });

    logger.info(completion.choices);


    const matchReportData = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + functions.config().api.chatgpt,
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        max_tokens: 400,
        n: 1,
        prompt: "Schreibe einen Spielbericht für folgendes Unihockey Spiel: " + prompt,
      }),
    });
    const chatGPT:any = await matchReportData.json();
    logger.info("RESPONSE length " + chatGPT.choices.length);
    logger.info("RESPONSE " + chatGPT.choices[0].text);
    return chatGPT.choices[0].text.replaceAll("\n", "");
  } else {
    return "";
  }
}*/

/*
function getNextGame(index: number, gamesList: []): any {
  const nextGame: any = gamesList[index];
  logger.info(">>> " + index);
  if (nextGame) {
    logger.info(`Get Next Game with id ${nextGame.id} and date: ${nextGame.date} ${nextGame.time}`);
  }
  if (nextGame && nextGame.date.charAt(2) === ".") {
    logger.info(`>>>Found GAME: ${JSON.stringify(nextGame)}`);
    return nextGame;
  } else {
    if (index === gamesList.length) {
      logger.info("END OF ARRAY");
      logger.info(JSON.stringify(gamesList));
      return {};
    } else {
      return getNextGame(index + 1, gamesList);
    }
  }
}*/
