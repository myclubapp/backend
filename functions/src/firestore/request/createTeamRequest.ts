/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton.js';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
import {sendEmailByUserId} from '../../utils/email.js';
const db = firebaseDAO.instance.db;

type Language = 'de' | 'en' | 'fr' | 'it';

export async function createTeamRequest(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('createTeamRequest');
  const {userId, teamId} = event.params;

  if (!event.data) {
    logger.info('No data associated with the event');
    return;
  }

  const teamRef = await db.collection('teams').doc(teamId).get();
  const userProfileRef = await db.collection('userProfile').doc(userId).get();

  await db.collection('teams').doc(teamId).collection('requests').doc(userId).set({
    'userProfileRef': userProfileRef.ref,
  });

  // E-Mail an den Antragsteller
  await sendEmailByUserId(userProfileRef.id, 'TeamRequestCreated', {
    teamName: teamRef.data().liga + ' ' + teamRef.data().name,
    firstName: userProfileRef.data()?.firstName,
    lastName: userProfileRef.data()?.lastName,
  });

  // SEND REQUEST E-MAIL TO CLUB ADMIN
  const receipient = [];
  logger.info(`Get Admin from Club: ${teamRef.data().clubRef.id}`);
  const clubAdminRef = await db.collection('club').doc(teamRef.data().clubRef.id).collection('admins').get();
  for (const admin of clubAdminRef.docs) {
    logger.info(`Read Admin user for Club with id ${admin.id}`);
    const adminProfileRef = await db.collection('userProfile').doc(admin.id).get();
    const language = (adminProfileRef.data()?.language || 'de') as Language;

    const pushTitle: Record<Language, string> = {
      'de': 'Neue Beitrittsanfrage für dein Team: ' + teamRef.data().name,
      'en': 'New join request for your team: ' + teamRef.data().name,
      'fr': 'Nouvelle demande d\'adhésion pour votre équipe: ' + teamRef.data().name,
      'it': 'Nuova richiesta di adesione per la tua squadra: ' + teamRef.data().name,
    };

    const pushMessage: Record<Language, string> = {
      'de': `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Team beitreten.`,
      'en': `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) wants to join your team.`,
      'fr': `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) souhaite rejoindre votre équipe.`,
      'it': `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) vuole unirsi alla tua squadra.`,
    };

    await sendPushNotificationByUserProfileId(
        admin.id,
        pushTitle[language] || pushTitle['de'],
        pushMessage[language] || pushMessage['de'],
        {
        },
    );
  }

  // SEND REQUEST E-MAIL TO TEAM ADMIN
  const teamAdminRef = await db.collection('teams').doc(teamId).collection('admins').get();
  for (const admin of teamAdminRef.docs) {
    logger.info(`Read Admin user for Team with id ${admin.id}`);
    const userProfileAdminRef = await db.collection('userProfile').doc(admin.id).get();
    if (userProfileAdminRef.exists) {
      if (userProfileAdminRef.data().settingsEmail) {
        receipient.push(userProfileAdminRef.data().email);
      }
      if (userProfileAdminRef.data().settingsPush === true) {
        const language = (userProfileAdminRef.data()?.language || 'de') as Language;

        const pushTitle: Record<Language, string> = {
          'de': 'Neue Beitrittsanfrage für dein Team: ' + teamRef.data().name,
          'en': 'New join request for your team: ' + teamRef.data().name,
          'fr': 'Nouvelle demande d\'adhésion pour votre équipe: ' + teamRef.data().name,
          'it': 'Nuova richiesta di adesione per la tua squadra: ' + teamRef.data().name,
        };

        const pushMessage: Record<Language, string> = {
          'de': `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Team beitreten.`,
          'en': `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) wants to join your team.`,
          'fr': `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) souhaite rejoindre votre équipe.`,
          'it': `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) vuole unirsi alla tua squadra.`,
        };

        await sendPushNotificationByUserProfileId(
            admin.id,
            pushTitle[language] || pushTitle['de'],
            pushMessage[language] || pushMessage['de'],
            {
            },
        );
      }
    }
  }

  return db.collection('mail').add({
    to: receipient,
    template: {
      name: 'TeamRequestAdminEmail',
      data: {
        teamName: `${teamRef.data().name}`,
        firstName: userProfileRef.data()?.firstName,
        lastName: userProfileRef.data()?.lastName,
        email: userProfileRef.data()?.email,
      },
    },
  });

  // check if user has admin claims..
  /*
  const adminUserRef = snapshot.data().userProfileRef || false;
  if (adminUserRef) { // only provided in team Page call
    const adminUser = await adminUserRef.get();
    const user = await auth.getUser(adminUser.id);
    if (user && user.customClaims && user.customClaims[teamId]) {
      const userRef = await db.collection("userProfile").doc(userId).get();
      await db.collection("teams").doc(teamId).collection("members").doc(`${userId}`).set({
        "userProfileRef": userRef,
      });
    }
  } */
}

