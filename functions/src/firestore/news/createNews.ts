
/* eslint-disable max-len */
import firebaseDAO from '../../firebaseSingleton.js';
import {FirestoreEvent, QueryDocumentSnapshot} from 'firebase-functions/v2/firestore';
import {sendPushNotificationByUserProfileId} from '../../utils/push.js';

const db = firebaseDAO.instance.db;

export async function createNotificationNews(event: FirestoreEvent<QueryDocumentSnapshot | undefined>) {
  const newsId = event.params.newsId;
  const newsRef = await db.collection('news').doc(newsId).get();

  const associationClubs = await db.collection('club').where('type', '==', newsRef.data().type).where('active', '==', true).get();
  for (const club of associationClubs.docs) {
    const clubMembersRef = await db.collection('club').doc(club.id).collection('members').get();
    for (const clubMember of clubMembersRef.docs) {
      const userProfileRef = await db.collection('userProfile').doc(clubMember.id).get();
      if (userProfileRef.exists && userProfileRef.data().settingsPush && userProfileRef.data().settingsPushNewsVerband) {
        await sendPushNotificationByUserProfileId(
            clubMember.id,
            'Neuer News Beitrag verfügbar: ',
            newsRef.data().title,
            {
              'type': 'news',
              'id': newsRef.id,
              'image': newsRef.data().image,
              'leadText': newsRef.data().image,
              'text': newsRef.data().image,
              'author': newsRef.data().author,
              'authorImage': newsRef.data().authorImage,
              'slug': newsRef.data().slug,
              'title': newsRef.data().title,
              'url': newsRef.data().url,
            },
        );
      }
    }
  }
}

