/* eslint-disable max-len */

import {QueryDocumentSnapshot, FirestoreEvent} from 'firebase-functions/v2/firestore';
import firebaseDAO from '../../firebaseSingleton.js';
const db = firebaseDAO.instance.db;
const auth = firebaseDAO.instance.auth;
import {logger} from 'firebase-functions';
import cors from 'cors';
import * as functions from 'firebase-functions/v1';

export async function createKid(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  const {userId, requestId} = event.params;
  logger.info(`Add Kid to UserProfile ${userId} with requestId ${requestId}`);

  const kidData = event.data?.data();
  const parentProfileRef = await db.collection('userProfile').doc(userId).get();

  // search for kid with email
  const kidsUserProfileRefCollection = await db.collection('userProfile').where('email', '==', kidData?.email).get();
  if (kidsUserProfileRefCollection.docs.length > 0) {
    logger.info('kidsUserProfile exists');
    // assume there is only one kid with the same email as profile
    const tempKidsUserProfileRef = kidsUserProfileRefCollection.docs[0];
    const kidsUserProfileRef = await db.collection('userProfile').doc(tempKidsUserProfileRef.id).get();
    // logger.info('kidsUserProfile: ' + kidsUserProfileRef.data());

    // Update Request Data
    await db.collection('userProfile').doc(userId).collection('kidsRequests').doc(requestId).set({
      kidsUserProfileRefId: kidsUserProfileRef.id,
    }, {merge: true});

    // send verification email
    return db.collection('mail').add({
      to: kidsUserProfileRef.data()?.email,
      template: {
        name: 'VerifyKidsEmail',
        data: {
          firstNameParent: parentProfileRef.data()?.firstName,
          lastNameParent: parentProfileRef.data()?.lastName,
          firstNameKid: kidsUserProfileRef.data()?.firstName,
          lastNameKid: kidsUserProfileRef.data()?.lastName,
          verificationLink: 'https://europe-west6-myclubmanagement.cloudfunctions.net/verifyKidsEmail' + '?requestId=' + requestId + '&parentId=' + userId,
        },
      },
    });
  } else {
    logger.info('kidsUserProfile does not exist');
  }
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyKidsEmailService(request: functions.Request, response: functions.Response<any>) {
  const corsHandler = cors({
    origin: true,
  });

  corsHandler(request, response, async () => {
    const {requestId, parentId} = request.query;
    logger.info(`Verify Kids with requestId ${requestId}`);
    const kidRef = await db.collection('userProfile').doc(parentId).collection('kidsRequests').doc(requestId).get();
    if (!kidRef.exists) {
      return response.status(404).send('Kid request not found');
    }
    const kidProfileRef = await db.collection('userProfile').doc(kidRef.data()?.kidsUserProfileRefId).get();
    // update custom claims for parent
    const user = await auth.getUser(parentId);
    const customClaims = user.customClaims || {};
    // Hole existierende Liste oder initialisiere sie
    const kidsList = customClaims.kids || [];

    // Füge das Kind nur hinzu, wenn es noch nicht enthalten ist
    if (!kidsList.includes(kidProfileRef.id)) {
      kidsList.push(kidProfileRef.id);
    }
    customClaims.kids = kidsList;
    console.log('customClaims: ' + JSON.stringify(customClaims));
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
    const parentRef = await db.collection('userProfile').doc(parentId).get();
    await db.collection('userProfile').doc(kidProfileRef.id).collection('parents').doc(parentRef.id).set({
      email: parentRef.data()?.email,
      firstName: parentRef.data()?.firstName,
      lastName: parentRef.data()?.lastName,
      verified: true,
      verifiedAt: new Date(),
    });

    // Delete Request
    await db.collection('userProfile').doc(parentId).collection('kidsRequests').doc(requestId).delete();

    return response
        .status(200)
        .set('Content-Type', 'text/html')
        .send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <title>Kind verifiziert</title>
            <link rel="preconnect" href="https://fonts.gstatic.com">
            <link href="https://fonts.googleapis.com/css2?family=Maven+Pro&family=Titillium+Web:wght@900&display=swap" rel="stylesheet">
            <style>
                /* FONTS */
                /* CLIENT-SPECIFIC STYLES */
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
                /* iOS BLUE LINKS */
                a[x-apple-data-detectors] {
                    color: inherit !important;
                    text-decoration: none !important;
                    font-size: inherit !important;
                    font-family: inherit !important;
                    font-weight: inherit !important;
                    line-height: inherit !important;
                }
                /* MOBILE STYLES */
                @media screen and (max-width:600px) {
                    h1 {
                        font-size: 32px !important;
                        line-height: 32px !important;
                    }
                }
                /* ANDROID CENTER FIX */
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
                    <a href="http://my-club.app" target="_blank">
                        <img alt="Logo" src="https://my-club.app/icons/icon-512x512.png" width="40" height="40">
                    </a>
                </div>
                <div class="header">
                    <h1 style="color: #ffffff; font-size: 48px; font-weight: 400; margin: 0; font-family: 'Titillium Web', Arial, sans-serif;">Erfolgreich verifiziert!</h1>
                </div>
                <div class="content">
                    <p>Vielen Dank für deine Bestätigung. Dein Kind wurde erfolgreich mit deinem Account verknüpft.</p>
                    <p>Du kannst diese Seite jetzt schliessen und zu myclub zurückkehren.</p>
                </div>
                <div class="footer">
                    <p style="margin: 0; color: #666666; font-family: 'Maven Pro', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 18px;">&reg; myclub | the next generation 2025</p>
                </div>
            </div>
        </body>
        </html>
      `);
  });
}
