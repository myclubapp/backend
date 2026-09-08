/* eslint-disable @typescript-eslint/no-explicit-any */
import firebaseDAO from '../firebaseSingleton.js';
import {logger} from 'firebase-functions';

const db = firebaseDAO.instance.db;

/**
 * Aktuelles Jahr in der Zeitzone Europe/Zurich, damit der Jahreswechsel
 * nicht von der UTC-Laufzeit der Cloud Functions abhängt.
 */
export function getCurrentYear(now: Date = new Date()): number {
  const formatter = new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
  });
  return Number(formatter.format(now));
}

/**
 * Ergänzt Template-Daten um Attribute, die in jeder E-Mail-Vorlage
 * verfügbar sein sollen (z.B. `currentYear` für den Footer). Bei jedem
 * Schreibzugriff auf die `mail`-Collection mit `template.data` verwenden.
 */
export function withCommonTemplateData<T extends object>(
    templateData: T,
): T & {currentYear: number} {
  return {
    ...templateData,
    currentYear: getCurrentYear(),
  };
}

export async function sendEmailByUserId(
    userId: string,
    templateName: string,
    templateData: any,
    includeParents = true,
    alwaysSendTemplates: string[] = [
      'Welcome',

      'UserCreateWelcomeMail',
      'UserDeleteEmail',

      'ClubRequestCreated',
      'ClubRequestAdminEmail',
      'ClubRequestApproved',
      'ClubRequestEmail',
      'ClubRequestRejected',
      'ClubRequestApprovedParent',

      'TeamRequestAdminEmail',
      'TeamRequestApproved',
      'TeamRequestEmail',
      'TeamRequestRejected',

      'EventAddMemberConfirmation',
      'HelferEventAddMemberConfirmation',

      'KidInvitationEmail',
      'VerifyKidsEmail',

      'TeamRequestCreated',
      'TeamRequestApproved',
      'TeamRequestRejected',

      'Invoice',

      'ClubEventReminder',
      'ClubEventCancelled',

      'TeamTrainingReminder',
      'TeamTrainingCancelled',
    ],
): Promise<void> {
  const userProfileRef = await db.collection('userProfile').doc(userId).get();

  if (!userProfileRef.exists ||
    (!alwaysSendTemplates.includes(templateName) &&
     !userProfileRef.data().settingsEmail)) {
    // eslint-disable-next-line max-len
    logger.info(`Email not sent for ${templateName} to ${userId} because userProfileRef.exists: ${userProfileRef.exists} and settingsEmail: ${userProfileRef.data().settingsEmail} or template is in alwaysSendTemplates: ${alwaysSendTemplates.includes(templateName)}`);
    return;
  }

  const emailAddresses = [userProfileRef.data().email];

  if (includeParents) {
    const parentsRef = await db.collection('userProfile')
        .doc(userId)
        .collection('parents')
        .get();
    for (const parent of parentsRef.docs) {
      const parentProfileRef = await db.collection('userProfile')
          .doc(parent.id)
          .get();
      if (parentProfileRef.exists && parentProfileRef.data().settingsEmail) {
        emailAddresses.push(parentProfileRef.data().email);
      } else {
        // eslint-disable-next-line max-len
        console.log('parentProfileRef.exists', parentProfileRef.exists, 'settingsEmail', parentProfileRef.data().settingsEmail, 'email', parentProfileRef.data().email, 'parent', parent.id);
      }
    }
  }

  if (userProfileRef.data().language === 'de') {
    templateName = templateName + '';
  } else if (userProfileRef.data().language === 'fr') {
    templateName = templateName + 'Fr';
  } else if (userProfileRef.data().language === 'it') {
    templateName = templateName + 'It';
  } else {
    templateName = templateName + '';
  }

  await db.collection('mail').add({
    to: emailAddresses,
    template: {
      name: templateName,
      data: withCommonTemplateData(templateData),
    },
  });
}

export async function sendEmailWithAttachmentByUserId(
    userId: string,
    templateName: string,
    templateData: any,
    // eslint-disable-next-line max-len
    attachment: { filename: string; content: string; contentType: string; encoding: string },
    includeParents = true,
    alwaysSendTemplates: string[] = [
      'Welcome',
      'Invoice',
      'HelferEventAddMemberConfirmation',
      'EventAddMemberConfirmation',
      'ClubRequestCreated',
      'ClubRequestAdminEmail',
      'ClubRequestApproved',
      'ClubRequestRejected',
      'ClubRequestApprovedParent',
      'TeamRequestCreated',
      'TeamRequestApproved',
      'TeamRequestRejected',
      'ClubEventReminder',
      'ClubEventCancelled',
      'TeamTrainingReminder',
      'TeamTrainingCancelled',
    ],
): Promise<void> {
  const userProfileRef = await db.collection('userProfile').doc(userId).get();

  if (!userProfileRef.exists ||
    (!alwaysSendTemplates.includes(templateName) &&
     !userProfileRef.data().settingsEmail)) {
    logger.info(
        // eslint-disable-next-line max-len
        `Email not sent for ${templateName} to ${userId} because userProfileRef.exists: ${userProfileRef.exists} and settingsEmail: ${userProfileRef.data().settingsEmail} or template is in alwaysSendTemplates: ${alwaysSendTemplates.includes(templateName)}`,
    );
    return;
  }

  const emailAddresses = [userProfileRef.data().email];

  if (includeParents) {
    const parentsRef = await db.collection('userProfile')
        .doc(userId)
        .collection('parents')
        .get();
    for (const parent of parentsRef.docs) {
      const parentProfileRef = await db.collection('userProfile')
          .doc(parent.id)
          .get();
      if (parentProfileRef.exists && parentProfileRef.data().settingsEmail) {
        emailAddresses.push(parentProfileRef.data().email);
      } else {
        console.log(
            'parentProfileRef.exists',
            parentProfileRef.exists,
            'settingsEmail',
            parentProfileRef.data().settingsEmail,
            'email',
            parentProfileRef.data().email,
            'parent',
            parent.id,
        );
      }
    }
  }

  if (userProfileRef.data().language === 'de') {
    templateName = templateName + '';
  } else if (userProfileRef.data().language === 'fr') {
    templateName = templateName + 'Fr';
  } else if (userProfileRef.data().language === 'it') {
    templateName = templateName + 'It';
  } else {
    templateName = templateName + '';
  }

  await db.collection('mail').add({
    to: emailAddresses,
    template: {
      name: templateName,
      data: withCommonTemplateData(templateData),
    },
    attachments: [
      attachment,
    ],
  });
}
