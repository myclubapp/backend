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

// SEND BYE EMAIL
export async function authUserDeleteUserSendByEmail(user: admin.auth.UserRecord, context: functions.EventContext) {
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
  console.log("delete user cleanup functions to delete user media, revoke refresh token for: " + user.uid);

  // force logout in app
  await admin.auth().revokeRefreshTokens(user.uid).catch((error)=>{
    console.log(`error revokeRefreshTokens -> most likely already done by deleting user, ${error}`);
  });

  // MEDIA
  // -> Profile picture
  await storage.bucket("myclubmanagement").file("userProfile/" + user.uid + "/profilePicture").delete().catch((error:any)=>{
    console.log(`error deleting bucket for user -> most likely no user data stored, ${error}`);
  });

  // Send E-Mail that Account is deleted
  // wird via eigener Function gemacht..

// DELETE USER DATA
  const userId = context.params.userId;
  console.log("delete user from DB (teams, clubs, teamAdmin, clubAdmin" + userId);

  const teamList = await db.collection("userProfile").doc(user.uid).collection("teams").get();
  if (!teamList.empty) {
    console.log("Delete Member in Teams ");
    for (const team of teamList.docs) {
      await db.collection("team").doc(team.id).collection("members").doc(`${userId}`).delete();
    }
  }
  // delete admin from all TEAMS
  const teamAdminList = await db.collection("userProfile").doc(user.uid).collection("teamAdmin").get();
  if (!teamAdminList.empty) {
    console.log("Delete Admin in Teams ");
    for (const team of teamAdminList.docs) {
      await db.collection("team").doc(team.id).collection("admins").doc(`${userId}`).delete();
    }
  }

  // delete user from all CLUBS
  const clubList = await db.collection("userProfile").doc(user.uid).collection("clubs").get();
  if (!clubList.empty) {
    console.log("Delete Member in Clubs ");
    for (const club of clubList.docs) {
      await db.collection("club").doc(club.id).collection("members").doc(`${userId}`).delete();
    }
  }
  // delete admin from all club Admins
  const clubAdminList = await db.collection("userProfile").doc(user.uid).collection("clubAdmin").get();
  if (!clubAdminList.empty) {
    console.log("Delete Admin in Clubs ");
    for (const club of clubAdminList.docs) {
      await db.collection("club").doc(club.id).collection("admins").doc(`${userId}`).delete();
    }
  }
  // Events?
  /*
  // Trainings?
  const querySnapshotTrainings = await db.collectionGroup("attendees", userId).get();
  querySnapshotTrainings.forEach(async (doc:QueryDocumentSnapshot ) => {
    const gameId: string = doc.ref.parent.parent?.id || "";
    const teamId: string = doc.ref.parent.parent?.parent?.id || "";
    await db.collection("teams").doc(teamId).collection("games").doc(gameId).collection("attendees").delete();
  });

  // GAMES / Trainings / Events
  console.log("delete attendee data");
  const querySnapshot = await db.collectionGroup("attendees").where("id", "==", userId).get();
  for (const doc of querySnapshot.docs) {
    console.log(`Document Ref: ${doc.ref.path}`);

    if (doc.ref.parent.parent?.parent?.id === "games") {
      const gameId: string = doc.ref.parent.parent?.id || "";
      const teamId: string = doc.ref.parent.parent?.parent?.parent?.id || "";

      console.log(`GameId: ${gameId}`);
      console.log(`Team Id: ${teamId}`);
      await db.collection("teams").doc(teamId).collection("games").doc(gameId).collection("attendees").doc(userId).delete();
    }
  }

  // offene Requests?
  --> clubRequests
  --> teamRequests
*/

  // Delete User Data
  await db.collection("userProfile").doc(user.uid).delete();

  // Delete account in firebase --> Should be done already
  return admin.auth().deleteUser(user.uid).catch((error)=> {
    console.log(`error deleting user -> most likely already done, ${error}`);
  });
}
