/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
// import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

// const db = firebaseDAO.instance.db;

export async function createNotificationClubNews(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const clubId = context.params.clubId;
  const newsId = context.params.newsId;
  console.log(clubId, newsId);
}
