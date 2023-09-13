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
  const teamRef = await db.collection("teams").doc(trainingData.teamId).get();

  const calculatedDate: Date = new Date();
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

  calculatedDate.setTime(new Date(trainingData.startDate).getTime());
  do {
    calculatedDate.setTime(calculatedDate.getTime() + offSet);

    // Add Training Entry
    db.collection("teams").doc(trainingData.teamId).collection("trainings").add({
      ...trainingData,
      date: calculatedDate,
      teamName: teamRef.data().teamName,
      liga: teamRef.data().liga,
    });
  } while (calculatedDate.getTime() < new Date(trainingData.endDate).getTime());

  console.log("createTeamTraining" + trainingId);
  return db.collection("userProfile").doc(userId).collection("trainings").doc(trainingId).delete();
}
