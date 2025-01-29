/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as functions from "firebase-functions";
import firebaseDAO from "../../firebaseSingleton";
import {DocumentSnapshot, QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import {Change} from "firebase-functions";
const db = firebaseDAO.instance.db;

export async function createCheckoutSession(event: DocumentSnapshot) {
  console.log("Create New Checkout Session based on Checkout Session in Club");

  const clubId = event.params.clubId;
  const sessionId = event.params.sessionId;
  console.log("clubId: " + clubId);
  console.log("sessionId: " + sessionId);

  const sessionData = event.data();
  const clubRef = await db.collection("club").doc(clubId).get();

  return db.collection("userProfile").doc(sessionData.userId).collection("checkout_sessions").doc(sessionId).set({
    ...sessionData,
    updated: new Date(),
    clubId: clubId,
    metadata: {
      "clubId": clubId,
      "subscriptionType": sessionData.subscriptionType,
      "addon": sessionData.addon,
    },
    clubRef: clubRef.ref,
  });
}

export async function updateCheckoutSession(change: Change<QueryDocumentSnapshot>, context: functions.EventContext) {
  console.log("Update Checkout Session on Club, because STRIPE does only update userProfile collection");
  const sessionId = context.params.sessionId;
  const userId = context.params.userId;

  const userProfileRef = await db.collection("userProfile").doc(userId).get();
  const sessionData = change.after.data();
  const clubId = change.before.data().clubId;

  return db.collection("club").doc(clubId).collection("checkout_sessions").doc(sessionId).set({
    ...sessionData,
    userProfileRef: userProfileRef.ref,
    updated: new Date(),
  },
  {merge: true}
  );
}
export async function updateSubscription(change: Change<DocumentSnapshot>, context: functions.EventContext) {
  console.log("CHANGE Checkout Session");
  const subscriptionId = context.params.subscriptionId;
  const userId = context.params.userId;

  const userProfileRef = await db.collection("userProfile").doc(userId).get();
  const subscriptionData = change.after.data() || {};

  let clubId = "";
  if (subscriptionData && subscriptionData.metadata && subscriptionData.metadata.clubId) {
    clubId = subscriptionData.metadata.clubId;

    await db.collection("club").doc(clubId).collection("subscriptions").doc(subscriptionId).set({
      ...change.after.data(),
      userProfileRef: userProfileRef.ref,
      updated: new Date(),
    },
    {merge: true}
    );

    console.log(">> STATUS " + subscriptionData.status);
    console.log(">> TYPE " + subscriptionData.metadata.subscriptionType);
    console.log(">> clubId " + clubId);
    if (subscriptionData.status == "active") {
      // NEW SUBSCRIPTION FOR PRODUCT OR ADDON
      // TODO SEND EMAIL!
      if (subscriptionData.metadata.subscriptionType === "free" || subscriptionData.metadata.subscriptionType === "small" || subscriptionData.metadata.subscriptionType === "medium" || subscriptionData.metadata.subscriptionType === "large") {
        // IF SUBSCRIPTION
        await db.collection("club").doc(clubId).set({
          subscriptionActive: true,
          subscriptionType: subscriptionData.metadata.subscriptionType,
        },
        {
          merge: true,
        });
      } else if (subscriptionData.metadata.subscriptionType === "module" ) {
        // IF ADDON -> ACTIVATE MODULE
        if (subscriptionData.metadata.addon === "training") {
          await db.collection("club").doc(clubId).set({
            hasFeatureTrainingExercise: true,
          },
          {
            merge: true,
          });
        } else if (subscriptionData.metadata.addon === "helfer") {
          await db.collection("club").doc(clubId).set({
            hasFeatureHelferEvent: true,
          },
          {
            merge: true,
          });
        } else if (subscriptionData.metadata.addon === "championship") {
          await db.collection("club").doc(clubId).set({
            hasFeatureChampionship: true,
          },
          {
            merge: true,
          });
        }
      } else {
        console.error("something went wrong - missing type?");
        console.error(subscriptionData);
      }
    } else if (subscriptionData.status !== "active") {
      // NOT ACTIVE anymore.. cancel subscription / abo
      const activeSubscription = await db.collection("club").doc(clubId).collection("subscriptions").where("status", "==", "active").get();
      if (activeSubscription.docs.length > 0) {
        console.log("has active subsription");
      } else {
        if (subscriptionData.metadata.subscriptionType === "free" || subscriptionData.metadata.subscriptionType === "small" || subscriptionData.metadata.subscriptionType === "medium" || subscriptionData.metadata.subscriptionType === "large") {
          // IF SUBSCRIPTION
          await db.collection("club").doc(clubId).set({
            subscriptionActive: false,
            subscriptionType: "",
          },
          {
            merge: true,
          });
        } else if (subscriptionData.metadata.subscriptionType === "module" ) {
          // IF ADDON -> ACTIVATE MODULE
          if (subscriptionData.metadata.addon === "training") {
            await db.collection("club").doc(clubId).set({
              hasFeatureTrainingExercise: false,
            },
            {
              merge: true,
            });
          } else if (subscriptionData.metadata.addon === "helfer") {
            await db.collection("club").doc(clubId).set({
              hasFeatureHelferEvent: false,
            },
            {
              merge: true,
            });
          } else if (subscriptionData.metadata.addon === "championship") {
            await db.collection("club").doc(clubId).set({
              hasFeatureChampionship: false,
            },
            {
              merge: true,
            });
          }
        }
      }
    } else { // Everything else that is not Active nor Canceled
      console.error(subscriptionData);
    }
    return true;
  } else {
    return true;
  }
}
export async function updateInvoice(change: Change<DocumentSnapshot>, context: functions.EventContext) {
  console.log("change Invoice ");
  const subscriptionId = context.params.subscriptionId;
  const invoiceId = context.params.invoiceId;
  const userId = context.params.userId;

  // GET subscription = parent object, as there is a metadata object with clubId Available
  const subscriptionRef = await db.collection("userProfile").doc(userId).collection("subscriptions").doc(subscriptionId).get();
  const subscriptionData = subscriptionRef.data();

  const userProfileRef = await db.collection("userProfile").doc(userId).get();

  let clubId = "";
  if (subscriptionData && subscriptionData.metadata && subscriptionData.metadata.clubId) {
    clubId = subscriptionData.metadata.clubId;
    return db.collection("club").doc(clubId).collection("subscriptions").doc(subscriptionId).collection("invoices").doc(invoiceId).set({
      ...change.after.data(),
      userProfileRef: userProfileRef.ref,
      updated: new Date(),
    },
    {merge: true}
    );
  } else {
    return true;
  }
}
export async function updatePayments(change: Change<DocumentSnapshot>, context: functions.EventContext) {
  console.log("change Payment - this will never succeed, as metadata is not filled - but anyway it's not urgent as we can show this only to the user.");
  const paymentId = context.params.paymentId;
  const userId = context.params.userId;

  const userProfileRef = await db.collection("userProfile").doc(userId).get();
  const paymentData = change.after.data() || {};
  let clubId = "";
  if (paymentData && paymentData.metadata && paymentData.metadata.clubId) {
    clubId = paymentData.metadata.clubId;
    console.log("payment updated for club");
    return db.collection("club").doc(clubId).collection("payments").doc(paymentId).set({
      ...change.after.data(),
      userProfileRef: userProfileRef.ref,
      updated: new Date(),
    },
    {merge: true}
    );
  } else {
    console.log("No payment updated for club because of missing metadata.");
    return true;
  }
}
