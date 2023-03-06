/* eslint-disable linebreak-style */
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
  const teamList = await db.collection("userProfile").doc(user.uid).collection("teams").get();
  if (!teamList.empty) {
    for (const team of teamList.docs) {
      await db.collection("team").doc(team.id).collection("members").doc(`${user.uid}`).delete();
    }
  }
  const teamAdminList = await db.collection("userProfile").doc(user.uid).collection("teamAdmin").get();
  if (!teamAdminList.empty) {
    for (const team of teamAdminList.docs) {
      await db.collection("team").doc(team.id).collection("admins").doc(`${user.uid}`).delete();
    }
  }

  // delete user from all clubs
  const clubList = await db.collection("userProfile").doc(user.uid).collection("clubs").get();
  if (!clubList.empty) {
    for (const club of clubList.docs) {
      await db.collection("club").doc(club.id).collection("members").doc(`${user.uid}`).delete();
    }
  }
  // delete user from all club Admins
  const clubAdminList = await db.collection("userProfile").doc(user.uid).collection("clubAdmin").get();
  if (!clubAdminList.empty) {
    for (const club of clubAdminList.docs) {
      await db.collection("club").doc(club.id).collection("admins").doc(`${user.uid}`).delete();
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
