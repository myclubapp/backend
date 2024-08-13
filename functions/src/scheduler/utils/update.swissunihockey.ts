/* eslint-disable linebreak-style */
/* eslint-disable guard-for-in */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */

import * as firebase from "firebase-admin";

import firebaseDAO from "./../../firebaseSingleton";
import resolversSU from "./../../graphql/swissunihockey/resolvers";
// import OpenAI from "openai";
import fs = require("fs");

const db = firebaseDAO.instance.db;

/* const openai = new OpenAI({
  apiKey: functions.config().api.chatgpt, // defaults to process.env["OPENAI_API_KEY"]
}); */

// Read the contents of the file
const myJson = fs.readFileSync("./src/scheduler/utils/clubArray.json", "utf8");

export async function updateGamesSwissunihockey(): Promise<any> {
  console.log("Update Games SwissUnihockey");

  // Get Clubs from DB where Type = SWISS UNIHOCKEY && STATUS is active
  const clubListRef = await db.collection("club").where("active", "==", true).where("type", "==", "swissunihockey").get();
  for (const clubData of clubListRef.docs) {
    // create Club Object from DB.
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};

    // GET CLUB GAMES
    console.log(`> GET CLUB GAMES:  ${club.id} ${club.name}`);

    // Get ALL CLUB GAMES from club based on API from SWISS UNIHOCKEY
    const clubGamesData = await resolversSU.Club.games({id: `${club.id}`}, {}, {}, {});
    for (const i in clubGamesData) {
      // Create Game Object
      const game = clubGamesData[i];
      console.log(`>> READ CLUB GAME:  ${game.id}`);

      // Get Game Detail
      const gameDetail = await resolversSU.SwissUnihockey.game({}, {gameId: game.id}, {}, {});

      // If datefield is properly set with swiss unihockey date value in the format 31.12.2022
      if (game.date.charAt(2) !== ".") {
        if (game.date === "Abgesagt") {
          console.log("abgesagt -> new Date()");
          game.date = new Date().toISOString();
          game.date = game.date.substr(8, 2) + "." + game.date.substr(5, 2) + "." + game.date.substr(0, 4);
          // get creative :)
        } else {
          // Date & TIme can be fetched from previous import
          const previousImported = await db.collection("club").doc(`su-${club.id}`).collection("games").doc(`su-${game.id}`).get();
          game.time = previousImported.data().time;
          game.date = previousImported.data().date;
        }
      } else if (game.date === "???" || game.time === "???") {
        if (game.date === "???") {
          game.date = new Date().toISOString();
          game.date = game.date.substr(8, 2) + "." + game.date.substr(5, 2) + "." + game.date.substr(0, 4);
        }
        game.time = "00:00";
      } else {
        // Alles normal
        // game.date = "11.03.2023"
      }
      // console.log(`Game Time: ${game.time} / Game Date: ${game.date}`);
      const gameDateTime: firebase.firestore.Timestamp = firebase.firestore.Timestamp.fromDate(new Date(`${game.date.substr(6, 4)}-${game.date.substr(3, 2)}-${game.date.substr(0, 2)}T${game.time}`));

      await db.collection("club").doc(`su-${club.id}`).collection("games").doc(`su-${game.id}`).set({
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
        type: "swissunihockey",
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
      console.log(`>> READ TEAM GAMES: ${team.id} ${team.name} ${team.liga} `);
      const gamesData = await resolversSU.Team.games({id: `${team.id}`}, {}, {}, {});
      for (const i in gamesData) {
        const game = gamesData[i];
        console.log(`>>> READ TEAM GAME:  ${game.id}`);

        const gameDetail = await resolversSU.SwissUnihockey.game({}, {gameId: game.id}, {}, {});

        // If datefield is properly set with swiss unihockey date value in the format 31.12.2022
        if (game.date.charAt(2) !== ".") {
          if (game.date === "Abgesagt") {
            console.log("abgesagt -> new Date()");
            game.date = new Date().toISOString();
            game.date = game.date.substr(8, 2) + "." + game.date.substr(5, 2) + "." + game.date.substr(0, 4);
            // get creative :)
          } else {
            // Date & TIme can be fetched from previous import
            const previousImported = await db.collection("club").doc(`su-${club.id}`).collection("games").doc(`su-${game.id}`).get();
            game.time = previousImported.data().time;
            game.date = previousImported.data().date;
          }
        } else if (game.date === "???" || game.time === "???") {
          if (game.date === "???") {
            game.date = new Date().toISOString();
            game.date = game.date.substr(8, 2) + "." + game.date.substr(5, 2) + "." + game.date.substr(0, 4);
          }
          game.time = "00:00";
        } else {
          // Alles normal
          // game.date = "11.03.2023"
        }
        // console.log(`Game Time: ${game.time} / Game Date: ${game.date}`);
        const gameDateTime: firebase.firestore.Timestamp = firebase.firestore.Timestamp.fromDate(new Date(`${game.date.substr(6, 4)}-${game.date.substr(3, 2)}-${game.date.substr(0, 2)}T${game.time}`));

        const clubRef = await db.collection("club").doc(`su-${club.id}`).get();
        const teamRef = await db.collection("teams").doc(`su-${team.id}`).get();
        // console.log("read match report for game: " + game.id);

        // await db.collection("teams").doc(`su-${team.id}`).collection("games").doc(`su-${game.id}`).get();
        await db.collection("teams").doc(`su-${team.id}`).collection("games").doc(`su-${game.id}`).set({
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
          type: "swissunihockey",
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
      const gameList = await db.collection("teams").doc(`su-${team.id}`).collection("games").get();
      for (const gameDoc of gameList.docs) {
        const tempGame = await resolversSU.SwissUnihockey.game({}, {gameId: gameDoc.externalId}, {}, {});
        if (tempGame && tempGame.name) {
          // console.log("game here..");
        } else {
          // Update status
          console.log("Update status for firestore saved game: " + gameDoc.id + " reading gameDoc id: " + gameDoc.externalId);
          /* await db.collection("teams").doc(`su-${team.id}`).collection("games").doc(game.id).set({
            status: "deleted",
          }, {
            merge: true,
          }); */
        }
      }

      // Get rankings
      const teamRankings = await resolversSU.Team.rankings({id: `${team.id}`}, {}, {}, {});
      console.log(" >> READ TEAM RANKINGS");
      for (const item of teamRankings) {
        console.log(JSON.stringify({
          title: item.title,
          season: item.season,
          updated: new Date(),
          type: "swissunihockey",
        }));
        await db.collection("teams").doc(`su-${team.id}`).collection("ranking").doc(`${item.season}`).set({
          title: item.title,
          season: item.season,
          updated: new Date(),
          type: "swissunihockey",
        }, {
          merge: true,
        });
        await db.collection("teams").doc(`su-${team.id}`).collection("ranking").doc(`${item.season}`).collection("table").doc(`${item.ranking}`).set(item);
      }
    }
  }
}

export async function updateTeamsSwissunihockey(): Promise<any> {
  console.log("Update Teams SwissUnihockey");
  // Teams von Swiss Unihockey aktualisieren, welche einen aktiven Club haben. Clubs werden via andere Funktion aktualisiert.
  const clubListRef = await db.collection("club").where("active", "==", true).where("type", "==", "swissunihockey").get();
  for (const clubData of clubListRef.docs) {
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};

    const teamData = await resolversSU.Club.teams({id: `${club.id}`}, {}, {}, {});
    for (const team of teamData) {
      console.log(club.name + " / " + team.name);
      const clubRef = await db.collection("club").doc(`su-${club.id}`).get();
      const teamRef = await db.collection("teams").doc(`su-${team.id}`).get();

      await db.collection("teams").doc(`su-${team.id}`).set({
        externalId: `${team.id}`,
        name: team.name,
        info: team.info,
        logo: team.logo,
        website: team.website,
        portrait: team.portrait,
        liga: team.liga,
        type: "swissunihockey",
        updated: new Date(),
        clubRef: clubRef.ref,
        clubId: clubRef.id,
      }, {
        merge: true,
      });
      await db.collection("club").doc(`su-${club.id}`).collection("teams").doc(`su-${team.id}`).set({
        teamRef: teamRef.ref,
      });
    }
  }
}

export async function updateClubsSwissunihockey(): Promise<any> {
  console.log("Update Clubs SwissUnihockey");

  const clubData = await resolversSU.SwissUnihockey.clubs();
  for (const club of clubData) {
    console.log(club.name + " " + club.id);
    await db.collection("club").doc(`su-${club.id}`).set({
      externalId: `${club.id}`,
      name: club.name,
      type: "swissunihockey",
      updated: new Date(),
    }, {
      merge: true,
    });
    // address
    for (const address of club.address) {
      address.externalId = address.id;
      address.type = "swissunihockey";
      address.updated = new Date();
      await db.collection("club").doc(`su-${club.id}`).collection("contacts").doc(`su-${address.id}`).set(address, {
        merge: true,
      });
    }
  }

  // JSON Upload
  // console.log(myJson);
  const data: Array<any> = JSON.parse(myJson);

  for (const clubData of data) {
    // console.log("clubdata > " + clubData);
    const address = {
      externalId: clubData.admin,
      type: "swissunihockey",
      updated: new Date(),
      lastName: clubData.lastName,
      firstName: clubData.firstName,
      email: clubData.email,
    };

    await db.collection("club").doc(`su-${clubData.id}`).collection("contacts").doc(`su-${clubData.admin}`).set(address, {
      merge: true,
    });
  }
  return true;
}


export async function updateNewsSwissunihockey(): Promise<any> {
  console.log("Update NEWS SwissUnihockey");

  const newsData = await resolversSU.SwissUnihockey.news();
  for (const news of newsData) {
    const newsDoc = await db.collection("news").doc(`su-${news.id}`).get();
    if (!newsDoc.exists) {
      await db.collection("news").doc(`su-${news.id}`).set({
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
        type: "swissunihockey",
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

    console.log(">>> MAGIC " + prompt);

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4', // model: 'gpt-3.5-turbo',
    });

    console.log(completion.choices);


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
    console.log("RESPONSE length " + chatGPT.choices.length);
    console.log("RESPONSE " + chatGPT.choices[0].text);
    return chatGPT.choices[0].text.replaceAll("\n", "");
  } else {
    return "";
  }
}*/

/*
function getNextGame(index: number, gamesList: []): any {
  const nextGame: any = gamesList[index];
  console.log(">>> " + index);
  if (nextGame) {
    console.log(`Get Next Game with id ${nextGame.id} and date: ${nextGame.date} ${nextGame.time}`);
  }
  if (nextGame && nextGame.date.charAt(2) === ".") {
    console.log(`>>>Found GAME: ${JSON.stringify(nextGame)}`);
    return nextGame;
  } else {
    if (index === gamesList.length) {
      console.log("END OF ARRAY");
      console.log(JSON.stringify(gamesList));
      return {};
    } else {
      return getNextGame(index + 1, gamesList);
    }
  }
}*/
