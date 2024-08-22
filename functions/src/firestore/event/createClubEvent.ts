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

export async function createClubEvent(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  console.log("CREATE ClubEvent");

  const userId = context.params.userId;
  const eventId = context.params.eventId;

  console.log("userId: " + userId);
  console.log("EventId: " + eventId);

  const eventData = snapshot.data();
  const clubRef = await db.collection("club").doc(eventData.clubId).get();
  console.log(clubRef.id);

  const newClubEventRef = await db.collection("club").doc(clubRef.id).collection("events").add({
    ...eventData,
  });

  console.log("New Club Event created: " + newClubEventRef.id);
  return db.collection("userProfile").doc(userId).collection("clubEvents").doc(eventId).delete();
}

export async function createNotificationClubEvent(snapshot: QueryDocumentSnapshot, context: functions.EventContext) {
  const clubId = context.params.clubId;
  const eventId = context.params.eventId;
  console.log(clubId, eventId);

  const clubEventRef = await db.collection("club").doc(clubId).collection("events").doc(eventId).get();
  const clubMembersRef = await db.collection("club").doc(clubId).collection("members").get();
  for (const clubMember of clubMembersRef.docs) {
    const userProfileRef = await db.collection("userProfile").doc(clubMember.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
      if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushEvent) {
        await sendPushNotificationByUserProfileId(
            clubMember.id,
            "Neue Veranstaltung verfügbar: ",
            clubEventRef.data().name + " - " + clubEventRef.data().description,
            {
              "type": "clubEvent",
              "clubId": clubId,
              "id": clubEventRef.id,
            }
        );
      }
    }
  }
}
