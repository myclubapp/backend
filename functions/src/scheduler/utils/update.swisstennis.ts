/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
import firebaseDAO from "../../firebaseSingleton";
const db = firebaseDAO.instance.db;

import resolversSE from "../../graphql/swisstennis/resolvers";

export async function updateClubsSwisstennis(): Promise<any> {
  console.log("Update Clubs Swiss Tennis");

  const clubData = await resolversSE.SwissTennis.clubs();
  for (const club of clubData) {
    console.log(club.name);

    await db.collection("club").doc(`se-${club.id}`).set({
      externalId: `${club.id}`,
      name: club.name,
      type: "swisstennis",
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
      await db.collection("club").doc(`se-${club.id}`).collection("contacts").doc(`se-${address.id}`).set(address, {
        merge: true,
      });
    }
  }
}
