/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {sendEmailByUserId} from '../../utils/email.js';
import {FirestoreEvent, Change, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
import {Timestamp} from 'firebase-admin/firestore';
const db = firebaseDAO.instance.db;


export async function changeTeamTraining(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('changeTeamTraining');
  const {teamId, trainingId} = event.params;
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();
  // console.log(afterData);

  // Behandlung von Training-Absagen
  if (afterData?.cancelled === true && (beforeData?.cancelled === false || beforeData?.cancelled === undefined)) {
    logger.info('Training cancelled');
    if (afterData) {
      await handleTrainingCancellation(teamId, trainingId, afterData);
    }
  }

  // Behandlung von Training-Remindern
  if (afterData?.lastReminderSent instanceof Timestamp && (beforeData?.lastReminderSent < afterData?.lastReminderSent || beforeData?.lastReminderSent === undefined)) {
    logger.info('Training reminder sent');
    if (afterData) {
      await handleTrainingReminder(teamId, trainingId, afterData);
    }
  }

  // Behandlung von Training-Änderungen
  /* if (hasTrainingDetailsChanged(beforeData, afterData)) {
    logger.info('Training details changed');
    if (afterData) {
      await handleTrainingChanges(teamId, trainingId, beforeData, afterData);
    }
  }*/

  return true;
}

async function handleTrainingCancellation(teamId: string, trainingId: string, trainingData: any) {
  const membersRef = await db.collection('teams').doc(teamId).collection('members').get();
  const attendeesRef = await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).collection('attendees').get();
  const teamRef = await db.collection('teams').doc(teamId).get();

  for (const member of membersRef.docs) {
    const attendee = attendeesRef.docs.find((a: QueryDocumentSnapshot) => a.id === member.id);
    const hasRespondedNo = attendee && attendee.data().status === false;

    if (!hasRespondedNo) {
      // Get user profile
      const userProfileRef = await db.collection('userProfile').doc(member.id).get();
      if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushTraining) {
        await sendPushNotificationByUserProfileId(member.id,
            'Das Training ' + trainingData.name + ' vom ' + trainingData.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}) + ' wurde abgesagt.',
            'Begründung: ' + trainingData.cancelledReason,
            {
              'type': 'training',
              'teamId': teamRef.id,
              'id': trainingId,
            });
      }
      if (userProfileRef.exists && userProfileRef.data().settingsEmail) {
        await sendEmailByUserId(member.id, 'TeamTrainingCancelled', {
          teamName: teamRef.data().name,
          firstName: userProfileRef.data()?.firstName,
          lastName: userProfileRef.data()?.lastName,
          trainingName: trainingData.name,
          trainerName: trainingData.trainerName,
          trainingDatum: trainingData.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}),
          trainingZeit: trainingData.startDate.toDate().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}),
          absageGrund: trainingData.cancelledReason,
        });
      }
    }
  }
}

async function handleTrainingReminder(teamId: string, trainingId: string, trainingData: any) {
  const attendeesRef = await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).collection('attendees').get();
  const membersRef = await db.collection('teams').doc(teamId).collection('members').get();
  const teamRef = await db.collection('teams').doc(teamId).get();

  const trainingDatum = trainingData?.startDate.toDate();
  const teamData = teamRef.data();
  const trainingThreshold = teamData?.trainingThreshold ?? 0;
  const trainingDatumPlusThreshold = new Date(trainingDatum.getTime() - trainingThreshold * 60 * 60 * 1000);
  const trainingDatumPlusThresholdString = trainingThreshold > 0 ?
    trainingDatumPlusThreshold.toLocaleString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}) :
    'nicht festgelegt';

  console.log(trainingDatum, trainingThreshold, trainingDatumPlusThreshold, trainingDatumPlusThresholdString);

  for (const member of membersRef.docs) {
    const hasResponded = attendeesRef.docs.some((attendee: QueryDocumentSnapshot) =>
      attendee.id === member.id && ( attendee.data().status === false || attendee.data().status == true ),
    );
    if (!hasResponded) {
      const userProfileRef = await db.collection('userProfile').doc(member.id).get();
      if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushTraining) {
        await sendPushNotificationByUserProfileId(member.id,
            'Erinnerung: Training ' + trainingData.name + ' am ' + trainingData.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}) + ' um ' + trainingData.startDate.toDate().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}),
            'Das Training findet bald statt. Bitte melde dich an/ab.',
            {
              'type': 'training',
              'teamId': teamRef.id,
              'id': trainingId,
            });
      }
      if (userProfileRef.exists && userProfileRef.data().settingsEmail) {
        const trainingDatum = trainingData.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});
        const trainingZeit = trainingData.startDate.toDate().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});
        console.log(trainingDatum, trainingZeit);
        await sendEmailByUserId(member.id, 'TeamTrainingReminder', {
          teamName: teamRef.data().name,
          trainingName: trainingData.name,
          firstName: userProfileRef.data()?.firstName,
          lastName: userProfileRef.data()?.lastName,
          trainerName: trainingData.trainerName,
          trainingOrt: trainingData.location,
          trainingDatum: trainingData.startDate.toDate().toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'}),
          trainingZeit: trainingData.startDate.toDate().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}),
          abmeldefrist: trainingDatumPlusThresholdString ? trainingDatumPlusThresholdString : 'nicht festgelegt',
        });
      }
    }
  }
}

/* async function handleTrainingChanges(teamId: string, trainingId: string, beforeData: TrainingData | undefined, afterData: TrainingData) {
  const attendeesRef = await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).collection('attendees').get();
  const teamRef = await db.collection('teams').doc(teamId).get();
  const trainingRef = await db.collection('teams').doc(teamId).collection('trainings').doc(trainingId).get();

  for (const attendee of attendeesRef.docs) {
    if (attendee.data().status !== false) {
      const userProfileRef = await db.collection('userProfile').doc(attendee.id).get();
      if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushTraining) {
        await sendPushNotificationByUserProfileId(attendee.id,
            'Training ' + afterData.name + ' wurde aktualisiert',
            'Es gab Änderungen am Training. Bitte überprüfe die Details.',
            {
              'type': 'training',
              'teamId': teamRef.id,
              'id': trainingRef.id,
            });
      }
      if (userProfileRef.exists && userProfileRef.data().settingsEmail) {
        await db.collection('mail').add({
          to: userProfileRef.data().email,
          template: {
            name: 'TeamTrainingUpdated',
            data: {
              teamName: teamRef.data().name,
              trainingName: afterData.name,
              firstName: userProfileRef.data()?.firstName,
              lastName: userProfileRef.data()?.lastName,
            },
          },
        });
      }
    }
  }
}

function hasTrainingDetailsChanged(beforeData: TrainingData | undefined, afterData: TrainingData | undefined): boolean {
  if (!beforeData || !afterData) return false;
  const relevantFields = ['name', 'description', 'startDate', 'endDate', 'location'];
  return relevantFields.some((field) => beforeData[field as keyof TrainingData] !== afterData[field as keyof TrainingData]);
}*/
