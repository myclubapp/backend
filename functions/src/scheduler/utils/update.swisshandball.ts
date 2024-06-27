/* eslint-disable guard-for-in */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
import firebaseDAO from "./../../firebaseSingleton";
import resolversSH from "./../../graphql/swisshandball/resolvers";

const db = firebaseDAO.instance.db;

export async function updateGamesSwisshandball(): Promise<any> {
  console.log("Update Games swisshandball");

  // Get Clubs from DB where Type = SWISS HANDBALL && STATUS is active
  const clubListRef = await db.collection("club").where("active", "==", true).where("type", "==", "swisshandball").get();
  for (const clubData of clubListRef.docs) {
    // create Club Object from DB.
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};

    // GET CLUB GAMES
    console.log(`>:  ${club.id} ${club.name}`);

    // Get ALL CLUB GAMES from club based on API from SWISS HANDBALL
    const clubGamesData = await resolversSH.Club.games({id: `${club.id}`}, {}, {}, {});
    for (const i in clubGamesData) {
      // Create Game Object
      const game = clubGamesData[i];
      console.log(`>> Read Club Game:  ${game.id}`);

      // Get Game Detail --> Does not edxist for handball
      // const gameDetail = await resolversSH.SwissHandball.game({}, {gameId: game.id}, {}, {});

      await db.collection("club").doc(`sh-${club.id}`).collection("games").doc(`sh-${game.id}`).set({
        ...game,
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
      const gamesData = await resolversSH.Team.games({id: `${team.id}`}, {}, {}, {});
      for (const i in gamesData) {
        const game = gamesData[i];
        console.log(`>>> Read Team Game:  ${game.id}`);

        const clubRef = await db.collection("club").doc(`sh-${club.id}`).get();
        const teamRef = await db.collection("teams").doc(`sh-${team.id}`).get();
        console.log("read match report for game: " + game.id);

        // await db.collection("teams").doc(`su-${team.id}`).collection("games").doc(`su-${game.id}`).get();
        await db.collection("teams").doc(`sh-${team.id}`).collection("games").doc(`sh-${game.id}`).set({
          ...game,
          externalId: `${game.id}`,

          type: "swisshandball",
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
export async function updateTeamsSwisshandball(): Promise<any> {
  console.log("Update Teams SwissHandball");
  const clubData = await resolversSH.SwissHandball.clubs();
  for (const club of clubData) {
    const fbClubData = await db.collection("club").doc(`sh-${club.id}`).get();
    if (fbClubData.exists && fbClubData.data().active) {
      const teamData = await resolversSH.Club.teams({id: `${club.id}`}, {}, {}, {});
      for (const team of teamData) {
        console.log(club.name + " / " + team.name);
        await db.collection("teams").doc(`sh-${team.id}`).set({
          externalId: `${team.id}`,
          name: team.name,
          type: "swisshandball",
          logo: team.logo,
          liga: team.liga,
          updated: new Date(),
          clubRef: db.collection("club").doc(`sh-${club.id}`),
        }, {
          merge: true,
        });
        await db.collection("club").doc(`sh-${club.id}`).collection("teams").doc(`sh-${team.id}`).set({
          teamRef: db.collection("teams").doc(`sh-${team.id}`),
        });
      }
    } else {
      console.log(`${club.name} is not active`);
    }
  }
}

export async function updateClubsSwisshandball(): Promise<any> {
  console.log("Update Clubs swisshandball");

  const clubData = await resolversSH.SwissHandball.clubs();
  for (const club of clubData) {
    console.log(club.name);

    await db.collection("club").doc(`sh-${club.id}`).set({
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
    /* for (const address of club.address) {
      await db.collection("club").doc(`sh-${club.id}`).collection("contacts").doc(`sh-${address.id}`).set(address, {
        merge: true,
      });
    } */
  }
}

export async function updateNewsSwisshandball(): Promise<any> {
  console.log("Update NEWS swisshandball");
  // const newsData = await resolversSH.SwissHandball.news();

  return new Promise(() => {
    return true;
  });
}
