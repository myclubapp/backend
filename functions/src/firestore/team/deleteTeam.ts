/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "./../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteTeam(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("deleteTeamData");
  const teamId = context.params.teamId;

  // delete user from all CLUBS
  const adminList = await db.collection("teams").doc(teamId).collection("admins").get();
  if (!adminList.empty) {
    console.log("Delete Admin from Team ");
    for (const admin of adminList.docs) {
      await db.collection("teams").doc(teamId).collection("admins").doc(`${admin.id}`).delete();
      await db.collection("userProfile").doc(admin.uid).collection("teamAdmin").doc(`${teamId}`).delete(); // needed to avoid emtpy collections
    }
  } else {
    console.log("Noting to delete");
  }
  // MEMBERS
  const memberList = await db.collection("teams").doc(teamId).collection("members").get();
  if (!memberList.empty) {
    console.log("Delete Member from Team ");
    for (const member of memberList.docs) {
      await db.collection("teams").doc(teamId).collection("members").doc(`${member.id}`).delete();
      await db.collection("userProfile").doc(member.uid).collection("teams").doc(`${teamId}`).delete(); // needed to avoid emtpy collections
    }
  } else {
    console.log("Noting to delete");
  }
  // TRAININGS
  const trainingList = await db.collection("teams").doc(teamId).collection("trainings").get();
  if (!trainingList.empty) {
    console.log("Delete Training from Team ");
    for (const training of trainingList.docs) {
      // Attendee List
      const trainingAttendeeList = await db.collection("teams").doc(teamId).collection("trainings").doc(training.id).collection("attendees").get();
      if (!trainingAttendeeList.empty) {
        console.log("Delete attendee from training ");
        for (const attendee of trainingAttendeeList.docs) {
          await db.collection("teams").doc(teamId).collection("trainings").doc(training.id).collection("attendees").doc(attendee.id).delete();
        }
      } else {
        console.log("Noting to delete");
      }
      // Delete Training after attendees are deleted
      await db.collection("teams").doc(teamId).collection("trainings").doc(`${training.id}`).delete();
    }
  } else {
    console.log("Noting to delete");
  }


  // GAMES
  const gameList = await db.collection("teams").doc(teamId).collection("games").get();
  if (!gameList.empty) {
    console.log("Delete Games from Team ");
    for (const game of gameList.docs) {
      // Attendee List
      const gameAttendeeList = await db.collection("teams")
          .doc(teamId)
          .collection("games")
          .doc(game.id)
          .collection("attendees")
          .get();

      if (!gameAttendeeList.empty) {
        console.log("Delete attendee from game ");
        for (const attendee of gameAttendeeList.docs) {
          await db.collection("teams")
              .doc(teamId)
              .collection("games")
              .doc(game.id)
              .collection("attendees")
              .doc(attendee.id)
              .delete();
        }
      } else {
        console.log("Nothing to delete");
      }

      // Delete Game after attendees are deleted
      await db.collection("teams")
          .doc(teamId)
          .collection("games")
          .doc(`${game.id}`)
          .delete();
    }
  } else {
    console.log("Nothing to delete");
  }

  return db.collection("teams").doc(teamId).delete();
}
