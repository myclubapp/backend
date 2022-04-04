/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */

// import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";
import firebaseDAO from "./../../firebaseSingleton";
const db = firebaseDAO.instance.db;

import resolversSU from "./../../graphql/swissunihockey/resolvers";

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
