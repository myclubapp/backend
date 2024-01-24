/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
import firebaseDAO from "./../../firebaseSingleton";
const db = firebaseDAO.instance.db;

import resolversSV from "./../../graphql/swissvolley/resolvers";

export async function updateTeamsSwissvolleyball(): Promise<any> {
  console.log("Update Teams SwissVolley");

  const associationsData = await resolversSV.SwissVolley.associations({}, {}, {}, {});
  for (const assocation of associationsData) {
    const clubData = await resolversSV.SwissVolley.clubs({}, {associationId: assocation.id}, {}, {});
    for (const club of clubData) {
      const fbClubData = await db.collection("club").doc(`sv-${club.id}`).get();
      if (fbClubData.exists && fbClubData.data().active) {
        const teamData = await resolversSV.Club.teams({id: `${club.id}`});
        for (const team of teamData) {
          console.log(club.name + " / " + team.name);
          await db.collection("teams").doc(`sv-${team.id}`).set({
            externalId: `${team.id}`,
            name: team.name,
            type: "swissvolley",
            liga: team.liga,
            info: team.info,
            updated: new Date(),
            associationId: assocation.id,
            clubRef: fbClubData.ref,
            clubId: fbClubData.id,
          }, {
            merge: true,
          });
          await db.collection("club").doc(`sv-${club.id}`).collection("teams").doc(`sv-${team.id}`).set({
            teamRef: db.collection("teams").doc(`sv-${team.id}`),
          });
        }
      } else {
        console.log(`${club.name} is not active`);
      }
    }
  }
}

export async function updateClubsSwissvolleyball(): Promise<any> {
  console.log("Update Clubs Swissvolley");

  // const associationsData = await resolversSV.SwissVolley.associations({}, {}, {}, {});
  // for (const assocation of associationsData) {
  const clubData = await resolversSV.SwissVolley.clubs({}, {}, {}, {});
  for (const club of clubData) {
    console.log(club.name);
    await db.collection("club").doc(`sv-${club.id}`).set({
      externalId: `${club.id}`,
      name: club.name,
      website: club.website,
      type: "swissvolley",
      updated: new Date(),
      // associationId: assocation.id,
      // address: club.address,
    }, {
      merge: true,
    });
    // address: club.address,
    for (const address of club.address) {
      await db.collection("club").doc(`sv-${club.id}`).collection("contacts").doc(`sv-${address.id}`).set(address, {
        merge: true,
      });
    }
  }
// }
}
