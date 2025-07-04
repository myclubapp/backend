
/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;

export async function createTeamTraining(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('CREATE Training');

  const {userId, trainingId} = event.params;

  logger.info('userId: ' + userId);
  logger.info('trainingId: ' + trainingId);

  const trainingData = event.data?.data();
  delete trainingData?.children;
  delete trainingData?.countAttendees;
  delete trainingData?.attendees;
  delete trainingData?.exercises;
  delete trainingData?.cancelled;
  delete trainingData?.cancelledReason;
  delete trainingData?.status;
  delete trainingData?.team;


  const teamRef = await db.collection('teams').doc(trainingData?.teamId).get();
  logger.info('teamId' + trainingData?.teamId);

  // const calculatedDate: Date = new Date();
  let offSet = 0; // in milliseconds
  switch (trainingData?.repeatFrequency) {
    case 'D':
      offSet = 1000 * 60 * 60 * 24 * trainingData?.repeatAmount;
      break;
    case 'W':
      offSet = 1000 * 60 * 60 * 24 * 7 * trainingData?.repeatAmount;
      break;
    /* case "M":
      offSet = 1000 * 60 * 60 * 24 * trainingData.repeatAmount;
      break;
    case "Y":
      offSet = 1000 * 60 * 60 * 24 * trainingData?.repeatAmount;
      break;*/
    default:
      logger.info('calculated other date.. ');
  }

  logger.info('Create Trainings for TeamId: ' + teamRef.id);
  logger.info(`Start Date used: ${trainingData?.startDate}`);
  logger.info(`End Date used: ${trainingData?.endDate}`);

  // Set Date based on first Training and Start Hours/minutes
  /* calculatedDate.setTime(new Date(trainingData.startDate).getTime());
  calculatedDate.setHours(new Date(trainingData.timeFrom).getHours());
  calculatedDate.setMinutes(new Date(trainingData.timeFrom).getMinutes());
  calculatedDate.setSeconds(0);
  calculatedDate.setMilliseconds(0); */

  // Initialisierung des ersten Datums

  /*
  const calculatedDate = new Date(new Date(trainingData?.startDate).getTime());
  calculatedDate.setHours(new Date(trainingData?.timeFrom).getHours());
  calculatedDate.setMinutes(new Date(trainingData?.timeFrom).getMinutes());
  calculatedDate.setSeconds(0);
  calculatedDate.setMilliseconds(0);

  const calculatedDate = new Date(new Date(trainingData?.startDate).getTime());
  calculatedDate.setHours(new Date(trainingData?.timeFrom).getHours());
  calculatedDate.setMinutes(new Date(trainingData?.timeFrom).getMinutes());
  calculatedDate.setSeconds(0);
  calculatedDate.setMilliseconds(0);

  // Set EndDate
  const calculatedEndDate = calculatedDate;
  calculatedEndDate.setHours(new Date(trainingData?.timeTo).getHours());
  calculatedEndDate.setMinutes(new Date(trainingData?.timeTo).getMinutes());
  calculatedEndDate.setSeconds(0);
  calculatedEndDate.setMilliseconds(0);

  // Add Training Entry
  const newTrainingRef = await db.collection('teams').doc(trainingData?.teamId).collection('trainings').add({
    ...trainingData,
    clubId: teamRef.data()?.clubId,
    date: calculatedDate,
    startDate: calculatedDate,
    endDate: calculatedEndDate,
    teamName: teamRef.data()?.name,
    liga: teamRef.data()?.liga,
  });
  logger.info('New Training: ' + newTrainingRef.id + ' ' + calculatedDate.toISOString());
  logger.info(`Calculated Start Date used: ${calculatedDate}`);
  logger.info(`Calculated End Date used: ${calculatedEndDate}`);
  */
  // Schleife für alle Trainings
  const calculatedDate = new Date(new Date(trainingData?.startDate).getTime());
  do {
    // Erstelle eine neue Kopie für das Enddatum
    const calculatedEndDate = new Date(calculatedDate.getTime());
    calculatedEndDate.setHours(new Date(trainingData?.timeTo).getHours());
    calculatedEndDate.setMinutes(new Date(trainingData?.timeTo).getMinutes());
    calculatedEndDate.setSeconds(0);
    calculatedEndDate.setMilliseconds(0);

    // Erstelle Training
    const newTrainingRef = await db.collection('teams')
        .doc(trainingData?.teamId)
        .collection('trainings')
        .add({
          ...trainingData,
          cancelled: false,
          clubId: teamRef.data()?.clubId,
          date: calculatedDate,
          startDate: calculatedDate,
          endDate: calculatedEndDate,
          teamName: teamRef.data()?.name,
          liga: teamRef.data()?.liga,
        });

    logger.info('New Training: ' + newTrainingRef.id + ' ' + calculatedDate.toISOString());
    logger.info(`Calculated Start Date used: ${calculatedDate}`);
    logger.info(`Calculated End Date used: ${calculatedEndDate}`);

    // Berechne nächstes Datum
    calculatedDate.setTime(calculatedDate.getTime() + offSet);
  } while (calculatedDate.getTime() <= new Date(trainingData?.endDate).getTime());

  return db.collection('userProfile')
      .doc(userId)
      .collection('trainings')
      .doc(trainingId)
      .delete();
}

export async function createNotificationTeamTraining(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  const trainingData = event.data?.data();
  const teamRef = await db.collection('teams').doc(trainingData?.teamId).get();
  logger.info('teamId' + trainingData?.teamId);
  logger.info('Create Trainings for TeamId: ' + teamRef.id);
  logger.info(`Start Date used: ${trainingData?.startDate}`);
  logger.info(`End Date used: ${trainingData?.endDate}`);

  const teamMembersRef = await db.collection('teams').doc(teamRef.id).collection('members').get();
  for (const teamMember of teamMembersRef.docs) {
    const userProfileRef = await db.collection('userProfile').doc(teamMember.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushTraining) {
      await sendPushNotificationByUserProfileId(teamMember.id, 'Neues Training verfügbar: ', trainingData?.name + ' - ' + trainingData?.description, {
        'type': 'training',
        'teamId': teamRef.id,
        'id': trainingData?.id,
      });
    }
  }
}
