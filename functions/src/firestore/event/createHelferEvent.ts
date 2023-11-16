/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";


const db = firebaseDAO.instance.db;

export async function createHelferEvent(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("CREATE Helferevent");

  const userId = context.params.userId;
  const eventId = context.params.eventId;

  console.log("userId: " + userId);
  console.log("HelfereventId: " + eventId);

  const eventData = snapshot.data();
  const clubRef = await db.collection("club").doc(eventData.clubId).get();
  console.log(clubRef.id);

  const isClubAdminRef = await db.collection("club").doc(clubRef.id).collection("admins").doc(userId).get();
  const hasClubAdminRef = await db.collection("userProfile").doc(userId).collection("clubAdmin").doc(clubRef.id).get();
  if (!isClubAdminRef.data() || !hasClubAdminRef.data()) {
    console.error("NO PERMISSION");

    return;
  }

  const newHelferEventRef = await db.collection("club").doc(clubRef.id).collection("helferEvents").add({
    ...eventData,
  });

  console.log("New Helferevent created: " + newHelferEventRef.id);
  return db.collection("userProfile").doc(userId).collection("helferEvents").doc(eventId).delete();
}

export async function createNotificationHelferEvent(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const clubId = context.params.clubId;
  const eventId = context.params.eventId;
  console.log(clubId, eventId);
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
