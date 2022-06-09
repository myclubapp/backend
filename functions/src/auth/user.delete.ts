/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import firebaseDAO from "../firebaseSingleton";

const db = firebaseDAO.instance.db;
const storage = firebaseDAO.instance.storage;

export async function authUserDeleteUserSendByEmail(user: admin.auth.UserRecord, context: functions.EventContext) {
  const userProfile: any = await db.collection("userProfile").doc(`${user.uid}`).get();
  if (!userProfile.exists) {
    console.log("no user data found");
  }
  return admin.firestore().collection("mail").add({
    to: user.email,
    template: {
      name: "UserDeleteEmail",
      data: {
        // firstName: userProfile.data().firstName,
      },
    },
  });
}

export async function authUserDeleteUserAccount(user: admin.auth.UserRecord, context: functions.EventContext) {
  console.log("delete user " + user.uid);
  // delete user from all teams
  const teamList = await db.collection("userProfile").doc(user.uid).collection("teamList").get();
  if (!teamList.empty) {
    for (const team of teamList.docs) {
      const teamRef = db.collection("team").doc(team.id).collection("memberList").doc(`${user.uid}`).delete();
    }
  }

  // delete user from all clubs
  const clubList = await db.collection("userProfile").doc(user.uid).collection("clubList").get();
  if (!clubList.empty) {
    for (const club of clubList.docs) {
      const clubRef = db.collection("club").doc(club.id).collection("memberList").doc(`${user.uid}`).delete();
    }
  }
  // Events?

  // Trainings?

  // offene Requests?

  // Delete account in database
  db.collection("userProfile").doc(user.uid).set({
    "firstName": "deleted account",
    "lastName": "deleted account",
  });

  // MEDIA
  // -> Profile picture
  storage.bucket("myclubmanagement").file("userProfile/" + user.uid + "/profilePicture").delete();

  // Send E-Mail that Account is deleted
  // wird via eigene Function gemacht..

  // Delete account in firebase
  return admin.auth().deleteUser(user.uid);
}
