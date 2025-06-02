/* eslint-disable @typescript-eslint/no-explicit-any */
import firebaseDAO from '../firebaseSingleton.js';

const db = firebaseDAO.instance.db;

export async function sendEmailByUserId(
    userId: string,
    templateName: string,
    templateData: any,
    includeParents = true,
): Promise<void> {
  const userProfileRef = await db.collection('userProfile').doc(userId).get();

  if (!userProfileRef.exists || !userProfileRef.data().settingsEmail) {
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

  if (userProfileRef.language === 'de') {
    templateName = templateName + '';
  } else if (userProfileRef.language === 'fr') {
    templateName = templateName + 'Fr';
  } else if (userProfileRef.language === 'it') {
    templateName = templateName + 'It';
  } else {
    templateName = templateName + 'En';
  }

  await db.collection('mail').add({
    to: emailAddresses,
    template: {
      name: templateName,
      data: templateData,
    },
  });
}
