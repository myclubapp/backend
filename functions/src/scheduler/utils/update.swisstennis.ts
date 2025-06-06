/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
import firebaseDAO from '../../firebaseSingleton.js';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;

import resolversSE from '../../graphql/swisstennis/resolvers.js';

export async function updateClubsSwisstennis(): Promise<any> {
  logger.info('Update Clubs Swiss Tennis');

  const clubData = await resolversSE.SwissTennis.clubs();
  for (const club of clubData) {
    logger.info(club.name);

    await db.collection('club').doc(`se-${club.id}`).set({
      externalId: `${club.id}`,
      name: club.name,
      type: 'swisstennis',
      logo: club.logo,
      website: club.website,
      latitude: club.latitude,
      longitude: club.longitude,
      foundingYear: club.foundingYear,
      updated: new Date(),
    }, {
      merge: true,
    });
    const clubRef = await db.collection('club').doc(`se-${club.id}`).get();

    for (const address of club.address) {
      await db.collection('club').doc(`se-${club.id}`).collection('contacts').doc(`se-${address.id}`).set({
        ...address,
        clubRef: clubRef.ref,
        clubId: clubRef.id,
      }, {
        merge: true,
      });
    }
  }
}
