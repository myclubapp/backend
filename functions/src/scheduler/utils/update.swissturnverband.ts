/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
import firebaseDAO from "./../../firebaseSingleton";
const db = firebaseDAO.instance.db;

// const {FieldValue} = require("firebase-admin/firestore");
import resolversST from "./../../graphql/swissturnverband/resolvers";
const admin = require("firebase-admin");
const MAX_WRITES_PER_BATCH = 500;

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
  updateClubsInBatches(clubData)
      .then(() => {
        console.log("All turnverein clubs updated successfully");
      })
      .catch((error) => {
        console.error("Error updating turnverein clubs in batches:", error);
      });

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
  }
  */
}

// Function to batch update documents
async function updateClubsInBatches(clubData: any) {
  const batches = [];
  let batch = db.batch(); // Initialize a batch
  let batchSize = 0;

  for (const club of clubData) {
    console.log(club.name, club.id);
    // Create a reference for the main club document
    const clubRef = db.collection("club").doc(`st-${club.id}`);

    batch.set(clubRef, {
      Teams: admin.firestore.FieldValue.delete(), // Replace 'capital' with the field you want to delete
    }, {merge: true});

    batchSize++;

    batch.set(clubRef, {
      ...club,
      externalId: `${club.id}`,
      name: club.name,
      type: "swissturnverband",
      updated: new Date(),
    }, {merge: true});

    batchSize++;

    // Create a reference for the club's contacts document
    const contactRef = clubRef.collection("contacts").doc(`st-${club.id}`);
    batch.set(contactRef, {
      name: club.contactName,
      phone: club.contactPhone,
      email: club.contactEmail,
      type: "swissturnverband",
      updated: new Date(),
    }, {merge: true});

    batchSize++;

    // If batch reaches max writes, commit it and start a new batch
    if (batchSize >= MAX_WRITES_PER_BATCH - 3) {
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
    // console.log("Results:", results);
    for (const result of results) {
      console.log("Batch erfolgreich:", result);
    }
  } catch (error: any) {
    console.error("Batch-Fehler:", error.code, error.message);
  }
}

