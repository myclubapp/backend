/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";

const db = firebaseDAO.instance.db;

export async function createTeamTraining(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const userId = context.params.userId;
  const trainingId = context.params.trainingId;

  const trainingData = snapshot.data();

  // let calculatedDate: Date = new Date();
  let offSet = 0;
  switch (trainingData.repeatFrequency) {
    case "D":
      offSet = 1000 * 60 * 60 * 24 * trainingData.repeatAmount;
      break;
    case "W":
      offSet = 1000 * 60 * 60 * 24 * 7 * trainingData.repeatAmount;
      break;
    /* case "M":
      offSet = 1000 * 60 * 60 * 24 * trainingData.repeatAmount;
      break;
    case "Y":
      offSet = 1000 * 60 * 60 * 24 * trainingData.repeatAmount;
      break;*/
    default:
      console.log("calculated other date.. ");
  }

  /*
  do {
    calculatedDate
    result = result + i;
  } while (i < 5);
  */

  console.log("createTeamTraining" + trainingId);
  return db.collection("userProfile").doc(userId).collection("trainings").doc(trainingId).delete();
}
