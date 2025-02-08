/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton';
import {QueryDocumentSnapshot, FirestoreEvent} from 'firebase-functions/v2/firestore';

const db = firebaseDAO.instance.db;

export async function createNotificationTeamEvent(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  const teamId = event.params.teamId;
  const eventId = event.params.eventId;
  console.log(teamId, eventId);
}


export async function createTeamEvent(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  const userId = event.params.userId;
  const userProfileRef = await db.collection('userProfile').doc(userId).get();

  console.log('createTeamEvent' + userProfileRef.id);

  /*
  const trainingId = context.params.trainingId;


  await db.collection("club").doc(clubId).collection("requests").doc(userId).set({
    "userProfileRef": userProfileRef.ref,
  });

  // SEND REQUEST CONFIRMATION E-MAIL TO USER
  await db.collection("mail").add({
    to: userProfileRef.data()?.email,
    template: {
      name: "ClubRequestAdminEmail",
      data: {
        clubName: clubRef.data().name,
        firstName: userProfileRef.data()?.firstName,
      },
    },
  });

  // SEND REQUEST E-MAIL TO CLUB ADMIN
  const receipient = [];
  const clubAdminRef = await db.collection("club").doc(clubId).collection("admins").get();
  for (const admin of clubAdminRef.docs) {
    const userProfileAdminRef = await db.collection("userProfile").doc(admin.id).get();
    if (userProfileAdminRef.exists) {
      receipient.push(userProfileAdminRef.data().email);
    }
  }

  return db.collection("mail").add({
    to: receipient,
    template: {
      name: "ClubRequestAdminEmail",
      data: {
        clubName: clubRef.data().name,
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
