/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import {sendPushNotificationByUserProfileId} from "../../utils/push";

const db = firebaseDAO.instance.db;

export async function createTeamTraining(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("CREATE Training");

  const userId = context.params.userId;
  const trainingId = context.params.trainingId;

  console.log("userId: " + userId);
  console.log("trainingId: " + trainingId);

  const trainingData = snapshot.data();
  const teamRef = await db.collection("teams").doc(trainingData.teamId).get();
  console.log("teamId" + trainingData.teamId);

  const calculatedDate: Date = new Date();
  let offSet = 0; // in milliseconds
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

  console.log("Create Trainings for TeamId: " + teamRef.id);
  console.log(`Start Date used: ${trainingData.startDate}`);
  console.log(`End Date used: ${trainingData.endDate}`);

  // Set Date based on first Training and Start Hours/minutes
  calculatedDate.setTime(new Date(trainingData.startDate).getTime());

  calculatedDate.setHours(new Date(trainingData.timeFrom).getHours());
  calculatedDate.setMinutes(new Date(trainingData.timeFrom).getMinutes());
  calculatedDate.setSeconds(0);
  calculatedDate.setMilliseconds(0);

  // Set EndDate
  const calculatedEndDate = calculatedDate;
  calculatedEndDate.setHours(new Date(trainingData.timeTo).getHours());
  calculatedEndDate.setMinutes(new Date(trainingData.timeTo).getMinutes());
  calculatedEndDate.setSeconds(0);
  calculatedEndDate.setMilliseconds(0);


  // Add Training Entry
  const newTrainingRef = await db.collection("teams").doc(trainingData.teamId).collection("trainings").add({
    ...trainingData,
    clubId: teamRef.data().clubId,
    date: calculatedDate,
    startDate: calculatedDate,
    endDate: calculatedEndDate,
    teamName: teamRef.data().name,
    liga: teamRef.data().liga,
  });
  console.log("New Training: " + newTrainingRef.id + " " + calculatedDate.toISOString());
  console.log(`Calculated Start Date used: ${calculatedDate}`);
  console.log(`Calculated End Date used: ${calculatedEndDate}`);

  do {
    calculatedDate.setTime(calculatedDate.getTime() + offSet);

    // Set EndDate
    const calculatedEndDate = calculatedDate;
    calculatedEndDate.setHours(new Date(trainingData.timeTo).getHours());
    calculatedEndDate.setMinutes(new Date(trainingData.timeTo).getMinutes());
    calculatedEndDate.setSeconds(0);
    calculatedEndDate.setMilliseconds(0);


    // Add Training Entry
    const newTrainingRef = await db.collection("teams").doc(trainingData.teamId).collection("trainings").add({
      ...trainingData,
      clubId: teamRef.data().clubId,
      date: calculatedDate,
      startDate: calculatedDate,
      endDate: calculatedEndDate,
      teamName: teamRef.data().name,
      liga: teamRef.data().liga,
    });
    console.log("New Training: " + newTrainingRef.id + " " + calculatedDate.toISOString());
    console.log(`Calculated Start Date used: ${calculatedDate}`);
    console.log(`Calculated End Date used: ${calculatedEndDate}`);
  } while (calculatedDate.getTime() <= new Date(trainingData.endDate).getTime());


  return db.collection("userProfile").doc(userId).collection("trainings").doc(trainingId).delete();
}

export async function createNotificationTeamTraining(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const teamId = context.params.teamId;
  const trainingId = context.params.trainingId;
  console.log(teamId, trainingId);

  const teamTrainingRef = await db.collection("teams").doc(teamId).collection("trainings").doc(trainingId).get();
  const teamMembersRef = await db.collection("teams").doc(teamId).collection("members").get();
  for (const teamMember of teamMembersRef.docs) {
    const userProfileRef = await db.collection("userProfile").doc(teamMember.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushTraining) {
      await sendPushNotificationByUserProfileId(teamMember.id, "Neues Training verfügbar: ", teamTrainingRef.data().name + " - " + teamTrainingRef.data().description, {
        "type": "trainings",
        "teamId": teamId,
        "id": teamTrainingRef.id,
      });
    }
  }
}
