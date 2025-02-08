

/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';

const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

export async function deleteHelferPunkt(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  console.log('deleteHelferPunkt');

  const clubId = event.params.clubId;
  const helferPunktId = event.params.helferPunktId;

  const helferPunktData = event.data?.data();

  const helferEvent = await db.collection('club').doc(clubId).collection('helferEvents').doc(helferPunktData?.eventRef?.id).collection('schichten').doc(helferPunktData?.schichtRef?.id).collection('attendees').doc(helferPunktData?.userId).get();
  if (helferEvent.data().helferPunktId === helferPunktId) {
    console.log('delete Helerpunkt');

    return db.collection('club').doc(clubId).collection('helferEvents').doc(helferPunktData?.eventRef?.id).collection('schichten').doc(helferPunktData?.schichtRef?.id).collection('attendees').doc(helferPunktData?.userId).set({
      'status': helferEvent.data()?.status,
    });
  } else {
    return true;
  }
}
