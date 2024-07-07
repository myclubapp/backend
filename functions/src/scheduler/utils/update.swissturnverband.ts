/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
import firebaseDAO from "./../../firebaseSingleton";
const db = firebaseDAO.instance.db;
// const {FieldValue} = require("firebase-admin/firestore");
import resolversST from "./../../graphql/swissturnverband/resolvers";

export async function updateTeamsSwissturnverband(): Promise<any> {
  console.log("no need to update turnverband");
}

export async function updateClubsSwissturnverband(): Promise<any> {
  console.log("Update Clubs SwissTurnverband");

  /* const clubListRef = await db.collection("club").where("type", "==", "swissturnverband").get();
  for (const club of clubListRef.docs) {
    const clubContactList = await db.collection("club").doc(club.id).collection("contacts").get();
    for (const contact of clubContactList.docs) {
      await db.collection("club").doc(club.id).collection("contacts").doc(contact.id).delete();
    }
    await db.collection("club").doc(club.id).delete();
  }*/
  // const clubData = await resolversST.SwissTurnverband.clubs();
  const clubData= await resolversST.SwissTurnverband.clubs();
  for (const club of clubData) {
    console.log(club.name);
    await db.collection("club").doc(`st-${club.id}`).set({
      ...club,
      externalId: `${club.id}`,
      name: club.name,
      type: "swissturnverband",
      updated: new Date(),
      // Teams: FieldValue.delete(),
    }, {
      merge: true,
    });

    await db.collection("club").doc(`st-${club.id}`).collection("contacts").doc(`st-${club.id}`).set({
      name: club.contactName,
      phone: club.contactPhone,
      email: club.contactEmail,
      type: "swissturnverband",
      updated: new Date(),
    }, {
      merge: true,
    });
  }
}

