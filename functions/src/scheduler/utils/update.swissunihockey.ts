/* eslint-disable guard-for-in */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */

// import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";
import * as firebase from "firebase-admin";
import firebaseDAO from "./../../firebaseSingleton";

const db = firebaseDAO.instance.db;

import resolversSU from "./../../graphql/swissunihockey/resolvers";


export async function updateGamesSwissunihockey(): Promise<any> {
  console.log("Update Games SwissUnihockey");

  const clubData = await resolversSU.SwissUnihockey.clubs();
  for (const club of clubData) {
    const fbClubData = await db.collection("club").doc(`su-${club.id}`).get();
    if (fbClubData.exists && fbClubData.data().active) {
      // GET CLUB GAMES
      console.log(`>> Club ${club.id} ${club.name}`);
      const clubGamesData = await resolversSU.Club.games({id: `${club.id}`}, {}, {}, {});
      for (const i in clubGamesData) {
        const game = clubGamesData[i];
        // console.log(JSON.stringify(game));
        const gameDetail = await resolversSU.SwissUnihockey.game({}, {gameId: game.id}, {}, {});

        let gameDateTime: firebase.firestore.Timestamp;
        if (game.time.charAt(2) !== ":") {
          game.time = "23:59";
        }
        if (game.date.charAt(2) !== ".") {
          console.log(`No Date: ${game.date}`);
          const dummyGame = getNextGame(Number(i)-1, clubGamesData);
          console.log(`Use other Game with ${dummyGame.date} and ${dummyGame.time}`);
          // gameDateTime = firebase.firestore.Timestamp.now();
          gameDateTime = firebase.firestore.Timestamp.fromDate(new Date(`${dummyGame.date.substr(6, 4)}-${dummyGame.date.substr(3, 2)}-${dummyGame.date.substr(0, 2)}T${dummyGame.time}`)); // --> Damit abgesagte nicht irgendwo angezeigt werden
        } else {
          gameDateTime = firebase.firestore.Timestamp.fromDate(new Date(`${game.date.substr(6, 4)}-${game.date.substr(3, 2)}-${game.date.substr(0, 2)}T${game.time}`));
        }


        await db.collection("club").doc(`su-${club.id}`).collection("games").doc(`su-${game.id}`).set({
          externalId: `${game.id}`,
          date: game.date,
          time: game.time,
          dateTime: gameDateTime,
          location: game.location,
          city: game.city,
          longitude: game.longitude,
          latitude: game.latitude,
          liga: game.liga,

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


          resut: game.result,
          type: "swissunihockey",
          updated: new Date(),
          clubRef: db.collection("club").doc(`su-${club.id}`),
        }, {
          merge: true,
        });
      }

      // TEAM GAMES
      const teamData = await resolversSU.Club.teams({id: `${club.id}`}, {}, {}, {});
      for (const team of teamData) {
        console.log(`>> Team: ${team.id} ${team.name}`);
        const gamesData = await resolversSU.Team.games({id: `${team.id}`}, {}, {}, {});
        for (const i in gamesData) {
          const game = gamesData[i];
          // console.log(JSON.stringify(game));
          const gameDetail = await resolversSU.SwissUnihockey.game({}, {gameId: game.id}, {}, {});

          let gameDateTime: firebase.firestore.Timestamp;
          if (game.time.charAt(2) !== ":") {
            game.time = "23:59";
          }
          if (game.date.charAt(2) !== ".") {
            console.log(`No Date: ${game.date}`);
            const dummyGame = getNextGame(Number(i)-1, gamesData);
            console.log(`Use other Game with ${dummyGame.date} and ${dummyGame.time}`);
            // gameDateTime = firebase.firestore.Timestamp.now();
            gameDateTime = firebase.firestore.Timestamp.fromDate(new Date(`${dummyGame.date.substr(6, 4)}-${dummyGame.date.substr(3, 2)}-${dummyGame.date.substr(0, 2)}T${dummyGame.time}`)); // --> Damit abgesagte nicht irgendwo angezeigt werden
          } else {
            gameDateTime = firebase.firestore.Timestamp.fromDate(new Date(`${game.date.substr(6, 4)}-${game.date.substr(3, 2)}-${game.date.substr(0, 2)}T${game.time}`));
          }

          await db.collection("teams").doc(`su-${team.id}`).collection("games").doc(`su-${game.id}`).set({
            externalId: `${game.id}`,
            date: game.date,
            time: game.time,
            dateTime: gameDateTime,
            location: game.location,
            city: game.city,
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

            resut: game.result,
            type: "swissunihockey",
            updated: new Date(),
            clubRef: db.collection("club").doc(`su-${club.id}`),
            teamRef: db.collection("club").doc(`su-${team.id}`),
          }, {
            merge: true,
          });
        }
      }
    } else {
      console.log(`${club.name} is not active`);
    }
  }
}

export async function updateTeamsSwissunihockey(): Promise<any> {
  console.log("Update Teams SwissUnihockey");

  const clubData = await resolversSU.SwissUnihockey.clubs();
  for (const club of clubData) {
    const fbClubData = await db.collection("club").doc(`su-${club.id}`).get();
    if (fbClubData.exists && fbClubData.data().active) {
      const teamData = await resolversSU.Club.teams({id: `${club.id}`}, {}, {}, {});
      for (const team of teamData) {
        console.log(club.name + " / " + team.name);
        await db.collection("teams").doc(`su-${team.id}`).set({
          externalId: `${team.id}`,
          name: team.name,
          logo: team.logo,
          website: team.website,
          portrait: team.portrait,
          liga: team.liga,
          type: "swissunihockey",
          updated: new Date(),
          clubRef: db.collection("club").doc(`su-${club.id}`),
        }, {
          merge: true,
        });
        await db.collection("club").doc(`su-${club.id}`).collection("teams").doc(`su-${team.id}`).set({
          teamRef: db.collection("teams").doc(`su-${team.id}`),
        });
      }
    } else {
      console.log(`${club.name} is not active`);
    }
  }
}

export async function updateClubsSwissunihockey(): Promise<any> {
  console.log("Update Clubs SwissUnihockey");

  const clubData = await resolversSU.SwissUnihockey.clubs();
  for (const club of clubData) {
    console.log(club.name);
    await db.collection("club").doc(`su-${club.id}`).set({
      externalId: `${club.id}`,
      name: club.name,
      type: "swissunihockey",
      updated: new Date(),
    }, {
      merge: true,
    });
  }
}


export async function updateNewsSwissunihockey(): Promise<any> {
  console.log("Update NEWS SwissUnihockey");

  const newsData = await resolversSU.SwissUnihockey.news();
  for (const news of newsData) {
    await db.collection("news").doc(`su-${news.id}`).set({
      externalId: `${news.id}`,
      title: news.title,
      leadText: news.leadText,
      date: firebase.firestore.Timestamp.fromDate(news.date),
      slug: news.slug,
      image: news.image,
      text: news.text,
      htmlText: news.htmlText,
      tags: news.tags,
      author: news.author,
      authorImage: news.authorImage,
      url: news.url,
      type: "swissunihockey",
      updated: new Date(),
    }, {
      merge: true,
    });
  }
}

// Internal Methods

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
}
