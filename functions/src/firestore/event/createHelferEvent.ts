/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import firebaseDAO from "../../firebaseSingleton";
import {DocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import {sendPushNotificationByUserProfileId} from "../../utils/push";

const db = firebaseDAO.instance.db;
export async function createHelferEvent(event: DocumentSnapshot) {
  console.log("CREATE Helferevent");

  const userId = event.params.userId;
  const eventId = event.params.eventId;

  console.log("userId: " + userId);
  console.log("HelfereventId: " + eventId);

  const eventData = event.data();
  const clubRef = await db.collection("club").doc(eventData.clubId).get();
  console.log(clubRef.id);

  const schichten = eventData.schichten;
  delete eventData.schichten;

  // create helferevent
  const newHelferEventRef = await db.collection("club").doc(clubRef.id).collection("helferEvents").add({
    ...eventData,
  });

  // if schichten, create them as well
  for (const schicht of schichten) {
    const newHelferSchicht = await db.collection("club").doc(clubRef.id).collection("helferEvents").doc(newHelferEventRef.id).collection("schichten").add({
      ...schicht,
    });
    console.log("new schicht added: " + newHelferSchicht.id);
  }

  console.log("New Helferevent created: " + newHelferEventRef.id);
  return db.collection("userProfile").doc(userId).collection("helferEvents").doc(eventId).delete();
}

export async function createNotificationHelferEvent(event: DocumentSnapshot) {
  const clubId = event.params.clubId;
  const eventId = event.params.eventId;
  console.log(clubId, eventId);

  const helferEvent = await db.collection("club").doc(clubId).collection("helferEvents").doc(eventId).get();
  const clubMembersRef = await db.collection("club").doc(clubId).collection("members").get();
  for (const clubMember of clubMembersRef.docs) {
    const userProfileRef = await db.collection("userProfile").doc(clubMember.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushHelfer) {
      await sendPushNotificationByUserProfileId(
          clubMember.id,
          "Neuer Helferevent verfügbar: ",
          helferEvent.data().name + " - " + helferEvent.data().description,
          {
            "type": "helferEvent",
            "clubId": clubId,
            "id": helferEvent.id,
          },
      );
    }
  }
}
