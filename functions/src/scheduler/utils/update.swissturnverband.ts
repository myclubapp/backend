/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
import firebaseDAO from './../../firebaseSingleton.js';
import {logger} from 'firebase-functions';
import {FieldValue} from 'firebase-admin/firestore';
const db = firebaseDAO.instance.db;
// const auth = firebaseDAO.instance.auth;

// const {FieldValue} = require("firebase-admin/firestore");
import resolversST from './../../graphql/swissturnverband/resolvers.js';
// import admin from 'firebase-admin';
const MAX_WRITES_PER_BATCH = 500;

export async function updateTeamsSwissturnverband(): Promise<any> {
  logger.info('Update Teams SwissTurnverband');

  const clubListRef = await db.collection('club').where('active', '==', true).where('type', '==', 'swissturnverband').get();

  for (const clubData of clubListRef.docs) {
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};

    const teamData = await resolversST.Club.teams({id: `${club.id}`}, {}, {}, {});
    for (const team of teamData) {
      logger.info(club.name + ' / ' + team.name);
      const clubRef = await db.collection('club').doc(`st-${club.id}`).get();
      let teamRef = await db.collection('teams').doc(`st-${team.id}`).get();
      const teamData = teamRef.exists ? teamRef.data() : {};
      teamRef = await db.collection('teams').doc(`st-${team.id}`).set({
        ...team,
        externalId: `${team.id}`,
        name: team.name,
        info: team.info,
        logo: team.logo,
        website: team.website,
        portrait: team.portrait,
        liga: team.liga,
        jahresbeitragWert: teamData?.jahresbeitragWert || team.jahresbeitragWert,
        jahresbeitragWaehrung: teamData?.jahresbeitragWaehrung || team.jahresbeitragWaehrung,
        trainingThreshold: teamData?.trainingThreshold || 24,
        championshipThreshold: teamData?.championshipThreshold || 48,
        clubRef: clubRef.ref,
        clubId: clubRef.id,
        type: 'swissturnverband',
        updated: new Date(),
      }, {
        merge: true,
        ignoreUndefinedProperties: true,
      });
      await db.collection('club').doc(`st-${club.id}`).collection('teams').doc(`st-${team.id}`).set({
        teamRef: teamRef.ref,
      });
    }
  }
}

export async function updateClubsSwissturnverband(): Promise<any> {
  logger.info('Update Clubs SwissTurnverband');

  const batches = [];
  let batch = db.batch();
  let batchSize = 0;

  const clubContactsData = await db.collectionGroup('contacts').get();
  for (const contact of clubContactsData.docs) {
    const contactData = contact.data();

    const clubRef = await db.collection('club').doc(`${contactData.id}`).get();
    if (!clubRef.exists && clubRef.id.startsWith('st-')) {
      batch.delete(db.collection('club').doc(`${clubRef.id}`).collection('contacts').doc(`${clubRef.id}`));
      batchSize++;

      if (batchSize >= MAX_WRITES_PER_BATCH) {
        batches.push(batch.commit());
        batch = db.batch();
        batchSize = 0;
      }
    }
  }

  /* const clubDataOld = await resolversST.SwissTurnverband.clubsOld();
  for (const club of clubDataOld) {
    batch.delete(db.collection('club').doc(`st-${club.id}`).collection('contacts').doc(`st-${club.id}`));
    batchSize++;

    if (batchSize >= MAX_WRITES_PER_BATCH) {
      batches.push(batch.commit());
      batch = db.batch();
      batchSize = 0;
    }
  } */
  if (batchSize > 0) {
    batches.push(batch.commit());
  }

  try {
    await Promise.all(batches);
    logger.info('All existing SwissTurnverband clubs deleted successfully');
  } catch (error: any) {
    logger.error('Error deleting SwissTurnverband clubs in batches:', error);
    throw error;
  }

  const clubData = await resolversST.SwissTurnverband.clubs();
  updateClubsInBatches(clubData)
      .then(() => {
        logger.info('All turnverein clubs updated successfully');
      })
      .catch((error) => {
        logger.error('Error updating turnverein clubs in batches:', error);
      });
}

// Function to batch update documents
async function updateClubsInBatches(clubData: any) {
  const batches = [];
  let batch = db.batch(); // Initialize a batch
  let batchSize = 0;

  for (const club of clubData) {
    logger.info(club.name, club.id);
    // Create a reference for the main club document
    const clubRef = db.collection('club').doc(`st-${club.id}`);

    batch.set(clubRef, {
      Teams: FieldValue.delete(), // Korrigierte Verwendung von FieldValue
    }, {merge: true});

    batchSize++;
    // If batch reaches max writes, commit it and start a new batch
    if (batchSize >= MAX_WRITES_PER_BATCH) {
      batches.push(batch.commit());
      batch = db.batch(); // Start a new batch
      batchSize = 0;
    }

    batch.set(clubRef, {
      ...club,
      externalId: `${club.id}`,
      name: club.name,
      type: 'swissturnverband',
      updated: new Date(),
    }, {merge: true});

    batchSize++;
    // If batch reaches max writes, commit it and start a new batch
    if (batchSize >= MAX_WRITES_PER_BATCH) {
      batches.push(batch.commit());
      batch = db.batch(); // Start a new batch
      batchSize = 0;
    }
    // Create a reference for the club's contacts document
    const contactRef = clubRef.collection('contacts').doc(`st-${club.id}`);
    batch.set(contactRef, {
      clubRef: clubRef.ref,
      clubId: clubRef.id,
      name: club.contactName,
      phone: club.contactPhone,
      email: club.contactEmail,
      type: 'swissturnverband',
      updated: new Date(),
    }, {merge: true});

    batchSize++;

    // If batch reaches max writes, commit it and start a new batch
    if (batchSize >= MAX_WRITES_PER_BATCH) {
      batches.push(batch.commit());
      batch = db.batch(); // Start a new batch
      batchSize = 0;
    }
  }

  // Commit any remaining writes in the last batch
  if (batchSize > 0) {
    batches.push(batch.commit());
  }

  // Wait for all batches to complete

  try {
    const results = await Promise.all(batches);
    logger.info('Batch SwissTurnverband', results);
    /* for (const result of results) {
      logger.info("Batch erfolgreich:", result);
    } */
  } catch (error: any) {
    logger.error('Batch-Fehler:', error.code, error.message);
  }
}

