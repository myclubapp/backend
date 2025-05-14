/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {FirestoreEvent, Change, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
import * as firebase from 'firebase-admin';
const db = firebaseDAO.instance.db;

export async function changeTeamTrainingCancelled(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('changeTeamTrainingCancelled');
  const {teamId, trainingId} = event.params;

  const trainingRef = await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).get();
  const trainingData = trainingRef.data();

  // Attribut aus dem Objekt löschen
  if (trainingData) {
    delete trainingData.childId; // oder welches Attribut auch immer Sie löschen möchten
  }

  await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).update({
    childId: firebase.firestore.FieldValue.delete(),
  });

  if (event.data?.after.data()?.cancelled === true &&
    (event.data?.before.data()?.cancelled === false || event.data?.before.data()?.cancelled === undefined)) {
    logger.info('Training cancelled');

    const attendeesRef = await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).collection('attendees').get();

    const teamRef = await db.collection('teams').doc(teamId).get();
    const trainingRef = await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).get();
    const trainingData = trainingRef.data();

    for (const attendee of attendeesRef.docs) {
      if (attendee.data().status !== false) {
        const userProfileRef = await db.collection('userProfile').doc(attendee.id).get();
        if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushTraining) {
          await sendPushNotificationByUserProfileId(attendee.id,
              'Training ' + trainingData?.name + ' vom ' + trainingData?.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}) + ' wurde abgesagt.',
              'Begründung: ' + trainingData?.cancelledReason,
              {
                'type': 'training',
                'teamId': teamRef.id,
                'id': trainingData?.id,
              });
        }
      }
    }
  } else {
    logger.info('Training not cancelled - maybe other change triggered this function');
  }
}
