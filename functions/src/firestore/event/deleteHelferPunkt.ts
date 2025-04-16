

/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteHelferPunkt(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  logger.info('deleteHelferPunkt');

  const {clubId, helferPunktId} = event.params;

  const helferPunktData = event.data?.data();

  const helferEvent = await db.collection('club').doc(clubId).collection('helferEvents').doc(helferPunktData?.eventRef?.id).collection('schichten').doc(helferPunktData?.schichtRef?.id).collection('attendees').doc(helferPunktData?.userId).get();
  if (helferEvent.exists && helferEvent.data().helferPunktId === helferPunktId) {
    logger.info('delete Helerpunkt');

    return db.collection('club').doc(clubId).collection('helferEvents').doc(helferPunktData?.eventRef?.id).collection('schichten').doc(helferPunktData?.schichtRef?.id).collection('attendees').doc(helferPunktData?.userId).set({
      'status': helferEvent.data()?.status,
      'confirmed': false,
    });
  } else {
    return true;
  }
}
