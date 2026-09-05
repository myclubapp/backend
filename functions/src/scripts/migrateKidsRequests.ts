/* eslint-disable max-len */
/**
 * Einmalig nach dem Deploy von Aufgabe C und D: verarbeitet alle offenen kidsRequests ohne `status` neu.
 * Alte Bestätigungslinks (requestId/parentId) sind nach dem Deploy ungültig. Anfragen mit bestehendem
 * Profil erhalten ein Token und die Bestätigungs-Mail wird erneut verschickt; Anfragen ohne Profil
 * werden auf `invited` gesetzt und erhalten die Einladungs-Mail.
 *
 * Aufruf im Ordner functions nach `npm run build`, mit Application Default Credentials:
 *   GOOGLE_CLOUD_PROJECT=myclubmanagement node lib/scripts/migrateKidsRequests.js [--apply]
 * Ohne --apply werden die betroffenen Anfragen nur aufgelistet.
 */
import {QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import firebaseDAO from '../firebaseSingleton.js';
import {processKidRequest} from '../firestore/userProfile/kidsRequest.js';

const db = firebaseDAO.instance.db;
const apply = process.argv.includes('--apply');

async function main() {
  const requests = await db.collectionGroup('kidsRequests').get();
  const open = requests.docs.filter((doc: QueryDocumentSnapshot) => !doc.data().status);
  console.log(`${requests.size} kid request(s), ${open.length} without status`);
  for (const request of open) {
    const parentId = request.ref.parent.parent?.id;
    console.log(`${request.ref.path} -> ${request.data().email} (parent ${parentId})`);
    if (!apply || !parentId) continue;
    await processKidRequest(parentId, request.id, request.data());
  }
  if (!apply) {
    console.log('dry run, nothing written (use --apply)');
  }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
