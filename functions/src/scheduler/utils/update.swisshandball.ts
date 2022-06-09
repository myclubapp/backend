/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
import firebaseDAO from "./../../firebaseSingleton";
const db = firebaseDAO.instance.db;

import resolversSH from "./../../graphql/swisshandball/resolvers";


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
  console.log("Update Clubs SwissUnihockey");

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
