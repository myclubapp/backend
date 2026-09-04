
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {sendPushNotificationByUserProfileId, truncateForPush} from '../../utils/push.js';
import {logger} from 'firebase-functions';
const db = firebaseDAO.instance.db;

export async function createNotificationTeamNews(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  const {teamId, newsId} = event.params;
  logger.info(teamId, newsId);

  const teamNewsRef = await db.collection('teams').doc(teamId).collection('news').doc(newsId).get();
  const teamMembersRef = await db.collection('teams').doc(teamId).collection('members').get();
  for (const teamMember of teamMembersRef.docs) {
    const userProfileRef = await db.collection('userProfile').doc(teamMember.id).get();
    if (userProfileRef.exists && userProfileRef.data().settingsPush) {
      await sendPushNotificationByUserProfileId(
          teamMember.id,
          'Neuer News Beitrag verfügbar: ',
          teamNewsRef.data().title,
          {
            'type': 'news',
            'id': teamNewsRef.id,
            'image': teamNewsRef.data().image,
            'leadText': truncateForPush(teamNewsRef.data().leadText, 300),
            'text': truncateForPush(teamNewsRef.data().text, 1000),
            'author': teamNewsRef.data().author,
            'authorImage': teamNewsRef.data().authorImage,
            'slug': teamNewsRef.data().slug,
            'title': teamNewsRef.data().title,
            'url': teamNewsRef.data().url,
          },
      );
    }
  }
}
