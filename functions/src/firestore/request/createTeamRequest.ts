
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton';
import {sendPushNotificationByUserProfileId} from '../../utils/push';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;

export async function createTeamRequest(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('createTeamRequest');
  const userId = event.params.userId;
  const teamId = event.params.teamId;

  if (!event.data) {
    logger.info('No data associated with the event');
    return;
  }

  const teamRef = await db.collection('teams').doc(teamId).get();
  const userProfileRef = await db.collection('userProfile').doc(userId).get();

  await db.collection('teams').doc(teamId).collection('requests').doc(userId).set({
    'userProfileRef': userProfileRef.ref,
  });

  // SEND REQUEST CONFIRMATION E-MAIL TO USER
  await db.collection('mail').add({
    to: userProfileRef.data()?.email,
    template: {
      name: 'TeamRequestEmail',
      data: {
        teamName: teamRef.data().liga + ' ' + teamRef.data().name,
        firstName: userProfileRef.data()?.firstName,
        lastName: userProfileRef.data()?.lastName,
      },
    },
  });

  // SEND REQUEST E-MAIL TO CLUB ADMIN
  const receipient = [];
  logger.info(`Get Admin from Club: ${teamRef.data().clubRef.id}`);
  const clubAdminRef = await db.collection('club').doc(teamRef.data().clubRef.id).collection('admins').get();
  for (const admin of clubAdminRef.docs) {
    logger.info(`Read Admin user for Club with id ${admin.id}`);

    await sendPushNotificationByUserProfileId(
        admin.id,
        'Neue Beitrittsanfrage für dein Team: ' + teamRef.data().name,
        `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Team beitreten.`,
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
        await sendPushNotificationByUserProfileId(
            admin.id,
            'Neue Beitrittsanfrage für dein Team: ' + teamRef.data().name,
            `${userProfileRef.data()?.firstName} ${userProfileRef.data()?.lastName} (${userProfileRef.data()?.email}) möchte deinem Team beitreten.`,
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

