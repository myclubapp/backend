/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
import firebaseDAO from "./../../firebaseSingleton";
const db = firebaseDAO.instance.db;
import * as admin from "firebase-admin";
// const {FieldValue} = require("firebase-admin/firestore");
import resolversST from "./../../graphql/swissturnverband/resolvers";

export async function updateTeamsSwissturnverband(): Promise<any> {
  console.log("Update Teams SwissTurnverband");

  const clubListRef = await db.collection("club").where("active", "==", true).where("type", "==", "swissturnverband").get();

  for (const clubData of clubListRef.docs) {
    const club = {...{id: clubData.data().externalId}, ...clubData.data()};

    const teamData = await resolversST.Club.teams({id: `${club.id}`}, {}, {}, {});
    for (const team of teamData) {
      console.log(club.name + " / " + team.name);
      const clubRef = await db.collection("club").doc(`st-${club.id}`).get();
      const teamRef = await db.collection("teams").doc(`st-${team.id}`).get();

      await db.collection("teams").doc(`st-${team.id}`).set({
        ...team,
        externalId: `${team.id}`,
        name: team.name,
        info: team.info,
        logo: team.logo,
        website: team.website,
        portrait: team.portrait,
        liga: team.liga,
        type: "swissturnverband",
        updated: new Date(),
        clubRef: clubRef.ref,
        clubId: clubRef.id,
      }, {
        merge: true,
        ignoreUndefinedProperties: true,
      });
      await db.collection("club").doc(`st-${club.id}`).collection("teams").doc(`st-${team.id}`).set({
        teamRef: teamRef.ref,
      });
    }
  }
}

export async function updateClubsSwissturnverband(): Promise<any> {
  console.log("Update Clubs SwissTurnverband");

  const clubData = await resolversST.SwissTurnverband.clubs();
  // Constants for batch operations
  const BATCH_SIZE = 500; // Firestore's limit is 500 operations per batch
  const batches: admin.firestore.WriteBatch[] = [];
  let operationCount = 0;
  let currentBatch = admin.firestore().batch();

  console.log(`Starting bulk update for ${clubData.length} clubs`);

  for (const club of clubData) {
    // Reference to main club document
    const clubRef = db.collection("club").doc(`st-${club.id}`);

    // Reference to club's contact document
    const contactRef = clubRef.collection("contacts").doc(`st-${club.id}`);

    // Add club document to batch
    currentBatch.set(clubRef, {
      ...club,
      externalId: `${club.id}`,
      name: club.name,
      type: "swissturnverband",
      updated: new Date(),
    }, {merge: true});
    operationCount++;

    // Add contact document to batch
    currentBatch.set(contactRef, {
      name: club.contactName,
      phone: club.contactPhone,
      email: club.contactEmail,
      type: "swissturnverband",
      updated: new Date(),
    }, {merge: true});
    operationCount++;

    // If we've reached batch size limit, commit current batch and start a new one
    if (operationCount >= BATCH_SIZE) {
      batches.push(currentBatch);
      currentBatch = admin.firestore().batch();
      operationCount = 0;
    }
  }

  // Push the last batch if it has any operations
  if (operationCount > 0) {
    batches.push(currentBatch);
  }

  // Commit all batches
  console.log(`Committing ${batches.length} batches`);

  try {
    // Process batches in chunks to avoid overwhelming the system
    const CHUNK_SIZE = 5; // Number of simultaneous batch commits
    for (let i = 0; i < batches.length; i += CHUNK_SIZE) {
      const chunk = batches.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map((batch) => batch.commit()));
      console.log(`Committed batches ${i + 1} to ${Math.min(i + CHUNK_SIZE, batches.length)}`);

      // Optional: Add a small delay between chunks to prevent rate limiting
      if (i + CHUNK_SIZE < batches.length) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    console.log("Bulk update completed successfully");
    return true;
  } catch (error) {
    console.error("Error during bulk update:", error);
    throw error;
  }

/*
  for (const club of clubData) {
    console.log(club.name);
    await db.collection("club").doc(`st-${club.id}`).set({
      ...club,
      externalId: `${club.id}`,
      name: club.name,
      type: "swissturnverband",
      updated: new Date(),
    }, {
      merge: true,
    });

    await db.collection("club").doc(`st-${club.id}`).collection("contacts").doc(`st-${club.id}`).set({
      name: club.contactName,
      phone: club.contactPhone,
      email: club.contactEmail,
      type: "swissturnverband",
      updated: new Date(),
    }, {
      merge: true,
    });
  } */
}

