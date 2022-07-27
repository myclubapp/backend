/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
// import firebaseDAO from "./../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

// const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function createTeamAdmin(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
// let userId = context.params.userId;
// let teamId = context.params.teamId;
  console.log("createTeamAdmin");
}

export async function createClubAdmin(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
// let userId = context.params.userId;
// let clubId = context.params.clubId;
  console.log("createClubAdmin");
}
