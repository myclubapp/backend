/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import firebaseDAO from '../firebaseSingleton.js';
import webpush from 'web-push';

import {logger} from 'firebase-functions/v2';

const db = firebaseDAO.instance.db;
const messaging = firebaseDAO.instance.messaging;
import {defineSecret} from 'firebase-functions/params';
import {onInit} from 'firebase-functions/v2/core';
import {SecretParam} from 'firebase-functions/lib/params/types.js';

let gcmAPIKey: SecretParam | undefined;
let publicKey: SecretParam | undefined;
let privateKey: SecretParam | undefined;

onInit(() => {
  gcmAPIKey = defineSecret('WEBPUSH_GCMAPIKEY');
  publicKey = defineSecret('WEBPUSH_PUBLICKEY');
  privateKey = defineSecret('WEBPUSH_PRIVATEKEY');
});

// Verschieben der Initialisierung in eine separate Funktion
function initializeWebPush() {
  webpush.setGCMAPIKey(gcmAPIKey?.value() || null);
  webpush.setVapidDetails(
      'mailto:info@my-club.app',
      publicKey?.value() || '',
      privateKey?.value() || '',
  );
}

export async function sendPushNotificationByUserProfileId(userProfileId: string, title: string, message: string, data: any) {
  try {
    // Initialisiere WebPush bei der ersten Verwendung
    initializeWebPush();

    const userProfilePushRef = await db.collection('userProfile').doc(userProfileId).collection('push').get();

    // SAVE Notification to user profile
    await db.collection('userProfile').doc(userProfileId).collection('notification').add({
      title: title,
      message: message,
      data: data,
      date: new Date(),
      opened: false,
    });

    const notificationsRef = await db.collection('userProfile').doc(userProfileId).collection('notification').where('opened', '==', false).get();
    const badgeCount = notificationsRef.docs.length || 1;

    // SEND PUSH NOTIFICATIONs
    for (const push of userProfilePushRef.docs) {
      const pushData = push.data();
      logger.info('>> PUSH DEVICE: ', pushData);

      if (pushData.platform === 'web') {
        // Send WebPush
        const {statusCode, headers, body} = await webpush.sendNotification(
            JSON.parse(pushData.pushObject),
            JSON.stringify({
              title: title,
              message: message,
            }),
        );
        logger.info('>> SEND WEB PUSH EVENT: ', statusCode, headers, body);
      } else {
        // Send native Push
        try {
          /* const nativePush = await messaging.sendToDevice(pushData.token, {
            notification: <NotificationMessagePayload>{
              title: title,
              body: message,
              sound: "default",
              badge: badgeCount as string,
            },
            data: <DataMessagePayload>{
              ...data,
            },
          });*/
          const nativePush = messaging.send({
            token: pushData.token,
            notification: {
              title: title,
              body: message,
              // imageUrl: "",
            },
            data: {
              ...data,
            },
            apns: {
              payload: {
                aps: {
                  badge: badgeCount,
                  sound: 'default',
                },
              },
            },
          });
          logger.info('>> SEND NATIVE PUSH EVENT: ', nativePush);
        } catch (e) {
          logger.info('Error Sending Native Push to Device:  ' + push.id + ' / Identifier: ' + pushData.identifier + ' with Error ' + e);
        }
      }
    }
  } catch (e) {
    logger.error('Error sending push notification: ', e);
  }
}
