/* eslint-disable max-len */

/* import firebaseDAO from './../firebaseSingleton.js';
const dbUA = firebaseDAO.instance.dbUA;
const db = firebaseDAO.instance.db;
import {logger} from 'firebase-functions';
export async function syncUnihockeyApp() {
  try {
    logger.info('test');

    const clubListRef = await db.collection('clubs').where('active', '==', true).where('type', '==', 'swissunihockey').get();
    for (const club of clubListRef.docs) {
      logger.info(club.data().externalId);
      const uaClub = await dbUA.collection('clubs').where('suhvClubId', '==', club.data().externalId).get();
      if (uaClub.exists) {
        logger.info('found old club with ID: ' + uaClub.id);
      }
    }
  } catch (err) {
    logger.error(err);
  }
}*/
