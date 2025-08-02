/* eslint-disable max-len */

import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot, DocumentSnapshot, Change} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;

export async function createCheckoutSession(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('Create New Checkout Session based on Checkout Session in Club');

  const {clubId, sessionId} = event.params;
  logger.info('clubId: ' + clubId);
  logger.info('sessionId: ' + sessionId);

  const sessionData = event.data?.data() || {};
  const clubRef = await db.collection('club').doc(clubId).get();

  sessionData.payment_method_collection = 'if_required';

  // get products
  const productListRef = await db.collection('stripeProducts').where('active', '==', true).get();
  // active products
  for (const product of productListRef.docs) {
    const priceListRef = await db.collection('stripeProducts').doc(product.id).collection('prices').where('active', '==', true).get();
    // active prices
    for (const price of priceListRef.docs) {
      if (price.data().unit_amount === 0) {
        // TRIAL für free products --> KEINE KK notwendig
        sessionData.trial_period_days = 30;
      }
    }
  }

  return db.collection('userProfile').doc(sessionData?.userId).collection('checkout_sessions').doc(sessionId).set({
    ...sessionData,
    // payment_method_types: ['card'], // twint no possible for subscription
    updated: new Date(),
    clubId: clubId,
    metadata: {
      'clubId': clubId,
      'subscriptionType': sessionData?.subscriptionType,
      'addon': sessionData?.addon,
    },
    clubRef: clubRef.ref,
  });
}

export async function updateCheckoutSession(event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  logger.info('Update Checkout Session on Club, because STRIPE does only update userProfile collection');
  const {sessionId, userId} = event.params;

  const userProfileRef = await db.collection('userProfile').doc(userId).get();
  const sessionData = event.data?.after.data();
  const clubId = event.data?.before.data()?.clubId;

  return db.collection('club').doc(clubId).collection('checkout_sessions').doc(sessionId).set({
    ...sessionData,
    userProfileRef: userProfileRef.ref,
    updated: new Date(),
  },
  {merge: true},
  );
}
export async function updateSubscription(event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) {
  logger.info('CHANGE Checkout Session');
  const {subscriptionId, userId} = event.params;

  const userProfileRef = await db.collection('userProfile').doc(userId).get();
  const subscriptionData = event.data?.after.data() || {};

  let clubId = '';
  if (subscriptionData && subscriptionData.metadata && subscriptionData.metadata.clubId) {
    clubId = subscriptionData.metadata.clubId;

    await db.collection('club').doc(clubId).collection('subscriptions').doc(subscriptionId).set({
      ...event.data?.after.data(),
      userProfileRef: userProfileRef.ref,
      updated: new Date(),
    },
    {merge: true},
    );

    logger.info('>> STATUS ' + subscriptionData.status);
    logger.info('>> TYPE ' + subscriptionData.metadata.subscriptionType);
    logger.info('>> clubId ' + clubId);
    if (subscriptionData.status == 'active' || subscriptionData.status == 'trialing') {
      // NEW SUBSCRIPTION FOR PRODUCT OR ADDON
      // TODO SEND EMAIL!
      if (subscriptionData.metadata.subscriptionType === 'free' || subscriptionData.metadata.subscriptionType === 'small' || subscriptionData.metadata.subscriptionType === 'medium' || subscriptionData.metadata.subscriptionType === 'large') {
        // IF SUBSCRIPTION
        await db.collection('club').doc(clubId).set({
          subscriptionActive: true,
          subscriptionType: subscriptionData.metadata.subscriptionType,
        },
        {
          merge: true,
        });
      } else if (subscriptionData.metadata.subscriptionType === 'module' ) {
        // IF ADDON -> ACTIVATE MODULE
        if (subscriptionData.metadata.addon === 'training') { // gibt es nicht mehr
          await db.collection('club').doc(clubId).set({
            hasFeatureTrainingExercise: true,
          },
          {
            merge: true,
          });
        } else if (subscriptionData.metadata.addon === 'helfer') {
          await db.collection('club').doc(clubId).set({
            hasFeatureHelferEvent: true,
          },
          {
            merge: true,
          });
        } else if (subscriptionData.metadata.addon === 'championship') {
          await db.collection('club').doc(clubId).set({
            hasFeatureChampionship: true,
          },
          {
            merge: true,
          });
        } else if (subscriptionData.metadata.addon === 'myclubpro') {
          await db.collection('club').doc(clubId).set({
            hasFeatureMyClubPro: true,
          },
          {
            merge: true,
          });
        }
      } else {
        logger.error('something went wrong - missing type?');
        logger.error(subscriptionData);
      }
    } else if (subscriptionData.status !== 'active') {
      // NOT ACTIVE anymore.. cancel subscription / abo
      const activeSubscription = await db.collection('club').doc(clubId).collection('subscriptions').where('status', '==', 'active').get();
      if (activeSubscription.docs.length > 0) {
        logger.info('has active subsription');
      } else {
        if (subscriptionData.metadata.subscriptionType === 'free' || subscriptionData.metadata.subscriptionType === 'small' || subscriptionData.metadata.subscriptionType === 'medium' || subscriptionData.metadata.subscriptionType === 'large') {
          // IF SUBSCRIPTION
          await db.collection('club').doc(clubId).set({
            subscriptionActive: false,
            subscriptionType: '',
          },
          {
            merge: true,
          });
        } else if (subscriptionData.metadata.subscriptionType === 'module' ) {
          // IF ADDON -> ACTIVATE MODULE
          if (subscriptionData.metadata.addon === 'training') {
            await db.collection('club').doc(clubId).set({
              hasFeatureTrainingExercise: false,
            },
            {
              merge: true,
            });
          } else if (subscriptionData.metadata.addon === 'helfer') {
            await db.collection('club').doc(clubId).set({
              hasFeatureHelferEvent: false,
            },
            {
              merge: true,
            });
          } else if (subscriptionData.metadata.addon === 'championship') {
            await db.collection('club').doc(clubId).set({
              hasFeatureChampionship: false,
            },
            {
              merge: true,
            });
          }
        }
      }
    } else { // Everything else that is not Active nor Canceled
      logger.error(subscriptionData);
    }
    return true;
  } else {
    return true;
  }
}
// Invoice Update Handler (V2)
export async function updateInvoice(event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) {
  logger.info('change Invoice ');

  const {subscriptionId, invoiceId, userId} = event.params;

  // GET subscription (parent object)
  const subscriptionRef = db.collection('userProfile').doc(userId).collection('subscriptions').doc(subscriptionId);
  const subscriptionSnap = await subscriptionRef.get();
  const subscriptionData = subscriptionSnap.data();

  // GET user profile
  const userProfileRef = db.collection('userProfile').doc(userId);
  // const userProfileSnap = await userProfileRef.get();

  let clubId = '';
  if (subscriptionData?.metadata?.clubId) {
    clubId = subscriptionData.metadata.clubId;

    // Update invoice in club collection
    return db
        .collection('club')
        .doc(clubId)
        .collection('subscriptions')
        .doc(subscriptionId)
        .collection('invoices')
        .doc(invoiceId)
        .set(
            {
              ...event.data?.after?.data(),
              userProfileRef: userProfileRef.ref,
              updated: new Date(),
            },
            {merge: true},
        );
  }

  return true;
}

export async function updatePayments(event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) {
  logger.info('change Payment - this will never succeed, as metadata is not filled - but anyway it\'s not urgent as we can show this only to the user.');
  const {userId, paymentId} = event.params;

  const userProfileRef = await db.collection('userProfile').doc(userId).get();
  const paymentData = event.data?.after.data() || {};
  let clubId = '';
  if (paymentData && paymentData.metadata && paymentData.metadata.clubId) {
    clubId = paymentData.metadata.clubId;
    logger.info('payment updated for club');
    return db.collection('club').doc(clubId).collection('payments').doc(paymentId).set({
      ...event.data?.after.data(),
      userProfileRef: userProfileRef.ref,
      updated: new Date(),
    },
    {merge: true},
    );
  } else {
    logger.info('No payment updated for club because of missing metadata.');
    return true;
  }
}
