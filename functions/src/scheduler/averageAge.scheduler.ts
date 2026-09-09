/* eslint-disable max-len */

import {logger} from 'firebase-functions';
import {QueryDocumentSnapshot, Timestamp} from 'firebase-admin/firestore';
import firebaseDAO from './../firebaseSingleton.js';

const db = firebaseDAO.instance.db;

// Firestore erlaubt 500 Schreiboperationen pro Batch.
const BATCH_LIMIT = 500;

// So viele Mitgliederlisten gleichzeitig lesen.
const READ_CONCURRENCY = 25;

/**
 * `dateOfBirth` liegt je nach Herkunft des Dokuments als Firestore-Timestamp,
 * als rohes `{seconds, nanoseconds}`-Objekt oder als ISO-String vor. Alles
 * andere (leerer String, null) zaehlt als "kein Geburtsdatum".
 */
function toDate(dateOfBirth: unknown): Date | null {
  if (!dateOfBirth) {
    return null;
  }
  if (dateOfBirth instanceof Timestamp) {
    return dateOfBirth.toDate();
  }
  if (typeof dateOfBirth === 'object' && typeof (dateOfBirth as {seconds?: unknown}).seconds === 'number') {
    return new Date((dateOfBirth as {seconds: number}).seconds * 1000);
  }
  if (typeof dateOfBirth === 'string') {
    const parsed = new Date(dateOfBirth);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Alter in vollen Jahren am Stichtag `now`. Gibt `null` zurueck, wenn das
 * Geburtsdatum fehlt, unlesbar ist oder ausserhalb eines plausiblen Bereichs
 * liegt (Tippfehler wie das Jahr 1900 oder ein Datum in der Zukunft sollen den
 * Durchschnitt nicht verziehen).
 */
export function calculateAge(dateOfBirth: unknown, now: Date): number | null {
  const birthday = toDate(dateOfBirth);
  if (!birthday) {
    return null;
  }

  let age = now.getFullYear() - birthday.getFullYear();
  const monthDiff = now.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthday.getDate())) {
    age--;
  }

  if (age < 0 || age > 120) {
    return null;
  }
  return age;
}

/**
 * Alle Profile einmal lesen und als `userId -> Alter` vorhalten. Ein Mitglied
 * gehoert in der Regel mehreren Clubs und Teams an; ohne diese Map wuerde sein
 * Profil pro Zugehoerigkeit erneut gelesen.
 */
async function loadAgeByUserId(now: Date): Promise<Map<string, number>> {
  const ageByUserId = new Map<string, number>();
  const userProfiles = await db.collection('userProfile').select('dateOfBirth').get();

  for (const userProfile of userProfiles.docs) {
    const age = calculateAge(userProfile.data().dateOfBirth, now);
    if (age !== null) {
      ageByUserId.set(userProfile.id, age);
    }
  }

  logger.info(`Durchschnittsalter: ${ageByUserId.size} von ${userProfiles.size} Profilen haben ein verwertbares Geburtsdatum`);
  return ageByUserId;
}

/**
 * Durchschnittsalter fuer jedes Dokument der Sammlung aus dessen
 * `members`-Unterkollektion berechnen und auf das Dokument schreiben.
 * `averageAge` ist `null`, wenn kein Mitglied ein Geburtsdatum hinterlegt hat -
 * das unterscheidet "berechnet, aber keine Daten" von "noch nie berechnet".
 *
 * Die Verbandssynchronisation legt fuer jeden Verein und jedes Team eines
 * Verbands ein Dokument an, auch wenn dort niemand die App nutzt. Solche
 * Dokumente ohne Mitglieder werden uebersprungen, statt sie Monat fuer Monat
 * mit einem leeren Wert zu beschreiben - ausser sie tragen noch ein
 * `averageAge` aus einer Zeit, als sie Mitglieder hatten.
 */
async function updateAverageAge(collection: 'club' | 'teams', ageByUserId: Map<string, number>, now: Date): Promise<void> {
  const documents = await db.collection(collection).select('averageAge').get();
  logger.info(`Durchschnittsalter: ${documents.size} Dokumente in '${collection}'`);

  let batch = db.batch();
  let pending = 0;
  let written = 0;

  // Die Mitgliederlisten in Gruppen parallel lesen: sequenziell braucht ein
  // Verband mit einigen tausend Teams mehr als die 540 Sekunden Timeout.
  for (let index = 0; index < documents.docs.length; index += READ_CONCURRENCY) {
    const chunk: QueryDocumentSnapshot[] = documents.docs.slice(index, index + READ_CONCURRENCY);

    const results = await Promise.all(chunk.map(async (document) => {
      const members = await document.ref.collection('members').select().get();
      const ages: number[] = [];
      for (const member of members.docs) {
        const age = ageByUserId.get(member.id);
        if (age !== undefined) {
          ages.push(age);
        }
      }
      return {document, memberCount: members.size, ages};
    }));

    for (const {document, memberCount, ages} of results) {
      if (memberCount === 0 && document.data().averageAge === undefined) {
        continue;
      }

      batch.set(document.ref, {
        averageAge: ages.length > 0 ?
          Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 :
          null,
        averageAgeMembers: ages.length,
        averageAgeUpdated: Timestamp.fromDate(now),
      }, {merge: true});
      pending++;
      written++;

      if (pending === BATCH_LIMIT) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
  }

  if (pending > 0) {
    await batch.commit();
  }

  logger.info(`Durchschnittsalter: ${written} von ${documents.size} Dokumenten in '${collection}' geschrieben`);
}

/**
 * Monatlicher Job: schreibt `averageAge` auf jeden Club und jedes Team. Die App
 * liest den Wert nur noch aus der Datenbank, statt ihn bei jedem Seitenaufruf
 * aus allen Mitgliederprofilen zu berechnen.
 */
export async function averageAgeScheduler() {
  try {
    logger.info('>> START Durchschnittsalter');
    const now = new Date();

    const ageByUserId = await loadAgeByUserId(now);
    await updateAverageAge('club', ageByUserId, now);
    await updateAverageAge('teams', ageByUserId, now);

    logger.info('<< ENDE Durchschnittsalter');
  } catch (err) {
    logger.error(err);
  }
}
