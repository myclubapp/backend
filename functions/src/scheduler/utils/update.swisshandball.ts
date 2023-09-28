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
        externalId: `${game.id}`,
        date: game.date,
        time: game.time,
        dateTime: game.date,

        venue: game.venue,
        venueCity: game.venueCity,

        longitude: game.longitude,
        latitude: game.latitude,

        liga: game.liga,
        ligaText: game.ligaText,

        name: game.name,
        description: game.description,

        teamHomeId: game.teamHomeId,
        teamHome: game.teamHome,
        teamHomeLogo: game.teamHomeLogo,
        teamHomeLogoText: game.teamHomeLogoText,

        teamAwayId: game.teamAwayId,
        teamAway: game.teamAway,
        teamAwayLogo: game.teamAwayLogo,
        teamAwayLogoText: game.teamAwayLogoText,

        referee1: game.referee1,
        referee2: game.referee2,
        spectators: game.spectators,

        result: game.result,

        type: "swisshandball",
        updated: new Date(),
        clubRef: clubData.ref,
      }, {
        merge: true,
      });
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

    for (const address of club.address) {
      await db.collection("club").doc(`sh-${club.id}`).collection("contacts").doc(`sh-${address.id}`).set(address, {
        merge: true,
      });
    }
  }
}

export async function updateNewsSwisshandball(): Promise<any> {
  console.log("Update NEWS swisshandball");
  const newsData = await resolversSH.SwissHandball.news();

  return new Promise(()=>{
    return true;
  });
}
