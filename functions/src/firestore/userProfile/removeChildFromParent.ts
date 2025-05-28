/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;
const auth = firebaseDAO.instance.auth;

export const removeChildFromParent = async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
  logger.info('removeChildFromParent');
  const {parentId, childId} = event.params;

  const user = await auth.getUser(parentId);
  const customClaims = user.customClaims || {};
  const kidsList = customClaims.kids || [];

  // Entferne das Kind aus der Liste
  const updatedKidsList = kidsList.filter((kidId: string) => kidId !== childId);
  customClaims.kids = updatedKidsList;

  const childListRef = await db.collection('userProfile').doc(parentId).collection('children').doc(childId).get();
  if (childListRef.docs.length === 0) {
    // clean up claims
    customClaims.kids = [];
  }
  await auth.setCustomUserClaims(parentId, customClaims);

  return db.collection('userProfile').doc(childId).collection('parents').doc(parentId).delete();
};

