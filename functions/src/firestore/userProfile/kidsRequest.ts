/* eslint-disable max-len */

import {randomBytes} from 'node:crypto';
import {QueryDocumentSnapshot, DocumentSnapshot, FirestoreEvent} from 'firebase-functions/v2/firestore';
import firebaseDAO from '../../firebaseSingleton.js';
import {withCommonTemplateData} from '../../utils/email.js';
const db = firebaseDAO.instance.db;
const auth = firebaseDAO.instance.auth;
import {logger} from 'firebase-functions';
import cors from 'cors';
import * as functions from 'firebase-functions/v1';

/** Gültigkeit eines Bestätigungslinks: 7 Tage. Danach räumt die Firestore-TTL-Policy das Token weg. */
export const KIDS_VERIFICATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Maximal verknüpfte Kinder pro Elternteil. Die Rules prüfen den Claim `kids` nur bis Index 2. */
export const MAX_KIDS_PER_PARENT = 3;
const VERIFY_URL = 'https://europe-west6-myclubmanagement.cloudfunctions.net/verifyKidsEmail';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_REGEX = /^[a-f0-9]{48}$/;
const OPEN_STATES = ['invited', 'pending_verification'];
const RETRY_HINT = 'Bitte lösche die Anfrage in der myclub App unter «Profil › Kinder» und erstelle sie neu.';

type RequestData = Record<string, unknown> | undefined;

export function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function kidsRequestRef(parentId: string, requestId: string) {
  return db.collection('userProfile').doc(parentId).collection('kidsRequests').doc(requestId);
}

async function rejectRequest(parentId: string, requestId: string, reason: string): Promise<boolean> {
  logger.warn(`kid request ${requestId} of ${parentId} rejected: ${reason}`);
  await kidsRequestRef(parentId, requestId).set({
    status: 'rejected',
    reason,
    verified: false,
    updatedAt: new Date(),
  }, {merge: true});
  return true;
}

/**
 * Sucht das Profil zu einer E-Mail-Adresse: zuerst über Firebase Auth (case-insensitiv),
 * danach über das Feld `email` im Profil (für Profile, deren Auth-Adresse abweicht).
 */
export async function findProfileByEmail(rawEmail: string): Promise<DocumentSnapshot | null> {
  const email = normalizeEmail(rawEmail);
  if (!email) return null;
  try {
    const user = await auth.getUserByEmail(email);
    const profile = await db.collection('userProfile').doc(user.uid).get();
    if (profile.exists) return profile;
  } catch (e) {
    if ((e as {code?: string}).code !== 'auth/user-not-found') {
      logger.warn(`auth lookup for ${email} failed: ${e}`);
    }
  }
  const candidates = [...new Set([email, rawEmail.trim()])];
  for (const candidate of candidates) {
    const result = await db.collection('userProfile').where('email', '==', candidate).limit(1).get();
    if (!result.empty) return result.docs[0];
  }
  return null;
}

/**
 * Erzeugt ein einmaliges Token, legt es serverseitig unter `kidsVerifications/{token}` ab
 * und schickt dem Kind die Bestätigungs-Mail. Der Elternteil kann das Token nicht lesen.
 */
export async function startKidVerification(parentId: string, requestId: string, kidProfile: DocumentSnapshot): Promise<boolean> {
  const parentProfile = await db.collection('userProfile').doc(parentId).get();
  if (!parentProfile.exists) {
    logger.error(`kid request ${requestId}: parent profile ${parentId} not found`);
    return false;
  }
  const kid = kidProfile.data() || {};
  const parent = parentProfile.data() || {};

  // Frühere Tokens derselben Anfrage entwerten
  const previous = await db.collection('kidsVerifications').where('requestId', '==', requestId).get();
  for (const doc of previous.docs) {
    await doc.ref.delete();
  }

  const token = randomBytes(24).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + KIDS_VERIFICATION_TTL_MS);
  await db.collection('kidsVerifications').doc(token).set({
    parentId,
    requestId,
    kidId: kidProfile.id,
    createdAt: now,
    expiresAt,
  });
  await kidsRequestRef(parentId, requestId).set({
    status: 'pending_verification',
    kidsUserProfileRefId: kidProfile.id,
    verified: false,
    expiresAt,
    updatedAt: now,
  }, {merge: true});

  await db.collection('mail').add({
    to: kid.email,
    template: {
      name: 'VerifyKidsEmail',
      data: withCommonTemplateData({
        firstNameParent: parent.firstName,
        lastNameParent: parent.lastName,
        firstNameKid: kid.firstName,
        lastNameKid: kid.lastName,
        verificationLink: `${VERIFY_URL}?token=${token}`,
      }),
    },
  });
  logger.info(`kid request ${requestId}: verification mail sent to kid ${kidProfile.id}`);
  return true;
}

/**
 * Verarbeitet eine Kinder-Anfrage. Wird vom Trigger `createKid` und vom Migrationsskript verwendet.
 */
export async function processKidRequest(parentId: string, requestId: string, requestData: RequestData): Promise<boolean> {
  const parentProfile = await db.collection('userProfile').doc(parentId).get();
  if (!parentProfile.exists) {
    logger.error(`kid request ${requestId}: parent profile ${parentId} not found`);
    return false;
  }
  const rawEmail = String(requestData?.email ?? '');
  const kidEmail = normalizeEmail(rawEmail);
  const parentEmail = normalizeEmail(parentProfile.data()?.email);

  if (!EMAIL_REGEX.test(kidEmail)) {
    return rejectRequest(parentId, requestId, 'invalid_email');
  }
  if (kidEmail === parentEmail) {
    return rejectRequest(parentId, requestId, 'self');
  }

  // Limit und Duplikate serverseitig prüfen; die App prüft beides nur clientseitig
  const children = await db.collection('userProfile').doc(parentId).collection('children').get();
  const requests = await db.collection('userProfile').doc(parentId).collection('kidsRequests').get();
  const others = requests.docs.filter((doc: QueryDocumentSnapshot) => doc.id !== requestId);
  if (others.some((doc: QueryDocumentSnapshot) => doc.data().emailLower === kidEmail && doc.data().status !== 'rejected')) {
    return rejectRequest(parentId, requestId, 'duplicate');
  }
  const open = others.filter((doc: QueryDocumentSnapshot) => OPEN_STATES.includes(doc.data().status));
  if (children.size + open.length >= MAX_KIDS_PER_PARENT) {
    return rejectRequest(parentId, requestId, 'limit_reached');
  }

  await kidsRequestRef(parentId, requestId).set({emailLower: kidEmail}, {merge: true});

  const kidProfile = await findProfileByEmail(rawEmail);
  if (!kidProfile) {
    logger.info(`kid request ${requestId}: no profile for address, sending invitation`);
    const now = new Date();
    await kidsRequestRef(parentId, requestId).set({
      status: 'invited',
      invitedAt: now,
      verified: false,
      updatedAt: now,
    }, {merge: true});
    await db.collection('mail').add({
      to: kidEmail,
      template: {
        name: 'KidInvitationEmail',
        data: withCommonTemplateData({
          firstNameParent: parentProfile.data()?.firstName,
          lastNameParent: parentProfile.data()?.lastName,
          email: kidEmail,
        }),
      },
    });
    return true;
  }
  if (kidProfile.id === parentId) {
    return rejectRequest(parentId, requestId, 'self');
  }
  const alreadyLinked = await db.collection('userProfile').doc(parentId).collection('children').doc(kidProfile.id).get();
  if (alreadyLinked.exists) {
    return rejectRequest(parentId, requestId, 'already_linked');
  }
  return startKidVerification(parentId, requestId, kidProfile);
}

export async function createKid(event: FirestoreEvent<QueryDocumentSnapshot | undefined>): Promise<boolean> {
  const {userId, requestId} = event.params;
  logger.info(`Add Kid to UserProfile ${userId} with requestId ${requestId}`);
  return processKidRequest(userId, requestId, event.data?.data());
}

/**
 * Neues Profil: offene Einladungen an diese Adresse in die Verifikation überführen.
 * Firestore-Trigger statt Auth-Trigger, weil die App das Profil erst nach der Registrierung schreibt.
 */
export async function linkInvitedKidOnSignup(event: FirestoreEvent<QueryDocumentSnapshot | undefined>): Promise<boolean> {
  const {userId} = event.params;
  const profile = event.data;
  const email = normalizeEmail(profile?.data()?.email);
  if (!profile || !email) return false;
  const invited = await db.collectionGroup('kidsRequests')
      .where('emailLower', '==', email)
      .where('status', '==', 'invited')
      .get();
  if (invited.empty) return false;
  logger.info(`new profile ${userId}: ${invited.size} open kid invitation(s) for ${email}`);
  for (const request of invited.docs) {
    const parentId = request.ref.parent.parent?.id;
    if (!parentId || parentId === userId) continue;
    await startKidVerification(parentId, request.id, profile);
  }
  return true;
}

function renderPage(title: string, paragraphs: string[]): string {
  const content = paragraphs.map((text) => `<p>${text}</p>`).join('\n');
  return `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <title>${title}</title>
            <link rel="preconnect" href="https://fonts.gstatic.com">
            <link href="https://fonts.googleapis.com/css2?family=Maven+Pro&family=Titillium+Web:wght@900&display=swap" rel="stylesheet">
            <style>
                body, table, td, a {
                    -webkit-text-size-adjust: 100%;
                    -ms-text-size-adjust: 100%;
                }
                table, td {
                    mso-table-lspace: 0pt;
                    mso-table-rspace: 0pt;
                }
                img {
                    -ms-interpolation-mode: bicubic;
                    border: 0;
                    height: auto;
                    line-height: 100%;
                    outline: none;
                    text-decoration: none;
                }
                table {
                    border-collapse: collapse !important;
                }
                body {
                    height: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    background-color: #f4f4f4;
                    font-family: 'Maven Pro', Helvetica, Arial, sans-serif;
                }
                a[x-apple-data-detectors] {
                    color: inherit !important;
                    text-decoration: none !important;
                    font-size: inherit !important;
                    font-family: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                }
                @media screen and (max-width:600px) {
                    h1 {
                        font-size: 32px !important;
                        line-height: 32px !important;
                    }
                }
                div[style*="margin: 16px 0;"] {
                    margin: 0 !important;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                }
                .header {
                    background-color: #000000;
                    padding: 40px 20px 20px 20px;
                    text-align: center;
                }
                .content {
                    background-color: #ffffff;
                    padding: 20px 30px 40px 30px;
                    color: #666666;
                    font-size: 18px;
                    line-height: 25px;
                }
                .logo {
                    text-align: center;
                    padding: 40px 10px 40px 10px;
                    background-color: #000000;
                }
                .logo img {
                    width: 200px;
                    max-width: 200px;
                    min-width: 40px;
                }
                .footer {
                    text-align: left;
                    padding: 0px 30px 30px 30px;
                    color: #666666;
                    font-size: 14px;
                    font-weight: 400;
                    line-height: 18px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <a href="https://my-club.app" target="_blank">
                        <img alt="Logo" src="https://my-club.app/icons/icon-512x512.png" width="40" height="40">
                    </a>
                </div>
                <div class="header">
                    <h1 style="color: #ffffff; font-size: 48px; font-weight: 400; margin: 0; font-family: 'Titillium Web', Arial, sans-serif;">${title}</h1>
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    <p style="margin: 0; color: #666666; font-family: 'Maven Pro', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 18px;">&reg; myclub | the next generation 2025</p>
                </div>
            </div>
        </body>
        </html>
      `;
}

function sendPage(response: functions.Response, status: number, title: string, paragraphs: string[]) {
  return response
      .status(status)
      .set('Content-Type', 'text/html')
      .send(renderPage(title, paragraphs));
}

/**
 * HTTP-Endpunkt hinter dem Link in der Bestätigungs-Mail. Der Link enthält nur das Token;
 * Elternteil, Anfrage und Kind werden serverseitig aus `kidsVerifications/{token}` aufgelöst.
 */
export async function verifyKidsEmailService(request: functions.Request, response: functions.Response) {
  const corsHandler = cors({
    origin: true,
  });

  corsHandler(request, response, async () => {
    const token = typeof request.query.token === 'string' ? request.query.token : '';
    if (!TOKEN_REGEX.test(token)) {
      // Alte Links mit requestId/parentId oder manipulierte Links
      logger.warn('verifyKidsEmail called without a valid token');
      return sendPage(response, 400, 'Link ungültig', ['Dieser Bestätigungslink ist nicht gültig.', RETRY_HINT]);
    }
    const tokenRef = await db.collection('kidsVerifications').doc(token).get();
    if (!tokenRef.exists) {
      return sendPage(response, 404, 'Link ungültig', ['Dieser Bestätigungslink ist nicht oder nicht mehr gültig.', RETRY_HINT]);
    }
    const {parentId, requestId, kidId, expiresAt, usedAt} = tokenRef.data();
    logger.info(`Verify kid ${kidId} for parent ${parentId} with requestId ${requestId}`);

    if (usedAt) {
      // Bereits benutzt, zum Beispiel durch einen Link-Scanner des Mailprogramms: Ergebnis ist dasselbe
      return sendPage(response, 200, 'Bereits bestätigt', ['Diese Verknüpfung wurde bereits bestätigt.', 'Du kannst diese Seite schliessen und zu myclub zurückkehren.']);
    }
    const expires: Date = typeof expiresAt?.toDate === 'function' ? expiresAt.toDate() : new Date(expiresAt);
    if (expires < new Date()) {
      await kidsRequestRef(parentId, requestId).set({status: 'expired', updatedAt: new Date()}, {merge: true});
      await tokenRef.ref.delete();
      return sendPage(response, 410, 'Link abgelaufen', ['Dieser Bestätigungslink ist abgelaufen.', RETRY_HINT]);
    }
    if (kidId === parentId) {
      // Letzte Verteidigung gegen Selbstverknüpfung
      await tokenRef.ref.delete();
      await kidsRequestRef(parentId, requestId).delete();
      return sendPage(response, 403, 'Nicht erlaubt', ['Ein Profil kann nicht mit sich selbst verknüpft werden.']);
    }

    const kidProfileRef = await db.collection('userProfile').doc(kidId).get();
    const parentRef = await db.collection('userProfile').doc(parentId).get();
    if (!kidProfileRef.exists || !parentRef.exists) {
      return sendPage(response, 404, 'Profil nicht gefunden', ['Eines der beteiligten Profile existiert nicht mehr.', RETRY_HINT]);
    }

    // Custom Claim `kids` beim Elternteil ergänzen
    const user = await auth.getUser(parentId);
    const customClaims = user.customClaims || {};
    const kidsList: string[] = customClaims.kids || [];
    if (!kidsList.includes(kidProfileRef.id)) {
      kidsList.push(kidProfileRef.id);
    }
    customClaims.kids = kidsList;
    await auth.setCustomUserClaims(parentId, customClaims);
    logger.info(`User ${user.email} verified kid ${kidProfileRef.id}`);

    // Add Child to Parent
    await db.collection('userProfile').doc(parentId).collection('children').doc(kidProfileRef.id).set({
      email: kidProfileRef.data()?.email,
      firstName: kidProfileRef.data()?.firstName,
      lastName: kidProfileRef.data()?.lastName,
      verified: true,
      verifiedAt: new Date(),
    });

    // Set Parent to Kid
    await db.collection('userProfile').doc(kidProfileRef.id).collection('parents').doc(parentRef.id).set({
      email: parentRef.data()?.email,
      firstName: parentRef.data()?.firstName,
      lastName: parentRef.data()?.lastName,
      verified: true,
      verifiedAt: new Date(),
    });

    // Anfrage löschen, Token als benutzt markieren (die TTL-Policy löscht es nach Ablauf)
    await kidsRequestRef(parentId, requestId).delete();
    await tokenRef.ref.set({usedAt: new Date()}, {merge: true});

    const parentName = `${parentRef.data()?.firstName ?? ''} ${parentRef.data()?.lastName ?? ''}`.trim();
    return sendPage(response, 200, 'Erfolgreich verifiziert!', [
      `Vielen Dank für deine Bestätigung. Dein Profil wurde erfolgreich mit dem Konto von ${parentName} verknüpft.`,
      'Du kannst diese Seite jetzt schliessen und zu myclub zurückkehren.',
    ]);
  });
}
