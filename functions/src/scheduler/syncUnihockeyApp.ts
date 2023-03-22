/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {EventContext} from "firebase-functions";
import firebaseDAO from "./../firebaseSingleton";
const dbUA = firebaseDAO.instance.dbUA;
const db = firebaseDAO.instance.db;

export async function syncUnihockeyApp(context: EventContext) {
  try {
    console.log("test");

    const clubListRef = await db.collection("clubs").where("active", "==", true).where("type", "==", "swissunihockey").get();
    for (const club of clubListRef.docs) {
      console.log(club.data().externalId);
      const uaClub = await dbUA.collection("clubs").where("suhvClubId", "==", club.data().externalId).get();
      if (uaClub.exists) {
        console.log("found old club with ID: " + uaClub.id);
      }
    }
  } catch (err) {
    console.error(err);
  }
}
