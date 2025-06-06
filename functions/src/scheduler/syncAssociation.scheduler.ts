/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */

import {updateTeamsSwissunihockey, updateClubsSwissunihockey, updateGamesSwissunihockey, updateNewsSwissunihockey} from './utils/update.swissunihockey.js';
import {updateTeamsSwissvolleyball, updateClubsSwissvolleyball, updateNewsSwissvolley, updateGamesSwissvolley} from './utils/update.swissvolleyball.js';
import {updateTeamsSwisshandball, updateClubsSwisshandball, updateGamesSwisshandball, updateNewsSwisshandball} from './utils/update.swisshandball.js';
import {updateClubsSwissturnverband, updateTeamsSwissturnverband} from './utils/update.swissturnverband.js';
// import {updateTeamsSwissturnverband, updateClubsSwissturnverband} from "./utils/update.swissturnverband";
// import {updateClubsSwissvolleyball} from "./utils/update.swissvolleyball";
// import {updateClubsSwisstennis} from "./utils/update.swisstennis";

import firebaseDAO from './../firebaseSingleton.js';
const db = firebaseDAO.instance.db;
// import fetch from 'node-fetch';
import {ScheduledEvent} from 'firebase-functions/v2/scheduler';
import {logger} from 'firebase-functions';
// const jsdom = require("jsdom");
// const cheerio = require("cheerio");

export async function updatePersistenceJobClubs(event: ScheduledEvent) {
  try {
    await updateClubsSwissunihockey();
    await updateClubsSwisshandball();
    await updateClubsSwissvolleyball();
    await updateClubsSwissturnverband();
    // await updateClubsSwisstennis();
  } catch (err) {
    logger.error(err);
  }
}

export async function updatePersistenceJobTeams(event: ScheduledEvent) {
  try {
    await updateTeamsSwissunihockey();
    await updateTeamsSwisshandball();
    await updateTeamsSwissvolleyball();
    await updateTeamsSwissturnverband();
  } catch (err) {
    logger.error(err);
  }
}

export async function updatePersistenceJobGames(event: ScheduledEvent) {
  try {
    await updateGamesSwissunihockey();
    await updateGamesSwisshandball();
    await updateGamesSwissvolley();
  } catch (err) {
    logger.error(err);
  }
}

export async function updatePersistenceJobNews(event: ScheduledEvent) {
  try {
    await updateNewsSwissunihockey();
  } catch (err) {
    logger.error('Fehler bei updateNewsSwissunihockey:', err);
    await sendErrorMail('Fehler bei updateNewsSwissunihockey: ' + err);
  }
  try {
    await updateNewsSwissvolley();
  } catch (err) {
    logger.error('Fehler bei updateNewsSwissvolley:', err);
    await sendErrorMail('Fehler bei updateNewsSwissvolley: ' + err);
  }
  try {
    await updateNewsSwisshandball();
  } catch (err) {
    logger.error('Fehler bei updateNewsSwisshandball:', err);
    await sendErrorMail('Fehler bei updateNewsSwisshandball: ' + err);
  }
  try {
    await updateClubNewsFromWordpress();
  } catch (err) {
    logger.error('Fehler bei updateClubNewsFromWordpress:', err);
    await sendErrorMail('Fehler bei updateClubNewsFromWordpress: ' + err);
  }
}


async function safeFetch(
    url: string,
    timeout = 10000,
    // eslint-disable-next-line no-undef
    options: RequestInit = {},
// eslint-disable-next-line no-undef
): Promise<Response> {
  // eslint-disable-next-line no-undef
  const controller = new AbortController();
  // eslint-disable-next-line no-undef
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    // eslint-disable-next-line no-undef
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    // eslint-disable-next-line no-undef
    clearTimeout(id);
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateClubNewsFromWordpress(): Promise<any> {
  logger.info('updateClubNewsFromWordpress');

  const clubListRef = await db.collection('club').where('active', '==', true).get();
  for (const club of clubListRef.docs) {
    // logger.info(club.id);

    if (club.data().wordpress) {
      logger.info(club.data().wordpress);
      try {
        const url = club.data().wordpress + '/wp-json/wp/v2/posts?per_page=20';

        const wpData = await safeFetch(url, 10000, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Host': 'kadettensh.ch',
            'Priority': 'u=0, i',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Sec-GPC': '1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0',
          },
        });
        const wpNews = await wpData.json();
        logger.info('News URL: ' + url);

        for (const news of wpNews) {
          logger.info(news.link);

          let authorImage = '';
          let wpUser;
          try {
            // eslint-disable-next-line no-undef
            const wpUserData = await fetch(news['_links'].author[0].href);
            wpUser = await wpUserData.json();
            authorImage = wpUser.avatar_urls[96] || wpUser.avatar_urls[48] || wpUser.avatar_urls[24] || '';
          } catch (e) {
            logger.error(`Failed to fetch user data for club ${club.id}:`, e);
          }


          let featuredMedia = '';
          try {
            if (news.featured_media > 0) {
              // Features Media via media fetch available
              // eslint-disable-next-line no-undef
              const wpFeaturedMediaData = await fetch(news['_links']['wp:featuredmedia'][0].href);
              const wpFeaturedMedia = await wpFeaturedMediaData.json();
              featuredMedia = wpFeaturedMedia.media_details.sizes.medium.source_url || wpFeaturedMedia.source_url || wpFeaturedMedia.guid.rendered;
            } else {
              featuredMedia = authorImage || 'https://placehold.co/600x400';
            }
          } catch (e) {
            // logger.info(e);
            logger.error(`Failed to fetch featured media for club ${club.id}:`, e);
            featuredMedia = authorImage || 'https://placehold.co/600x400';
          }

          await db.collection('club').doc(`${club.id}`).collection('news').doc(`${club.id}-${news.id}`).set({
            externalId: `${news['id']}`,
            title: news['title'].rendered,
            leadText: news['excerpt'].rendered,
            clubId: club.id,
            date: news['date'],
            slug: news['slug'],
            image: featuredMedia,
            text: news['content'].rendered,
            htmlText: news['content'].rendered || ' ',
            tags: 'Webseite',
            author: wpUser.name,
            authorImage: authorImage,
            url: news['link'],
            type: club.type,
            updated: new Date(),
          }, {
            merge: true,
            ignoreUndefinedProperties: true,
          });
        }
      } catch (e) {
        console.error(`Failed to fetch posts for club ${club.id} (${club.data().wordpress}):`, e);
      }
    }
  }
}

async function sendErrorMail(error: string) {
  await db.collection('mail').add({
    to: 'info@my-club.app',
    subject: 'Fehler: ' + error,
    text: 'Fehler: ' + error,
  });
}

/* const newsDoc = await db.collection("news").doc(`su-${news.id}`).get();
    if (!newsDoc.exists) {
      await db.collection("news").doc(`su-${news.id}`).set({
        externalId: `${news.id}`,
        title: news.title,
        leadText: news.leadText || " ",
        date: news.date,
        slug: news.slug || " ",
        image: news.image || " ",
        text: news.text || " ",
        htmlText: news.htmlText || " ",
        tags: news.tags || " ",
        author: news.author || " ",
        authorImage: news.authorImage || " ",
        url: news.url || " ",
        type: "swissunihockey",
        updated: new Date(),
      }, {
        merge: true,
        ignoreUndefinedProperties: true,
      });
    }*/


/*
async function updateSwissunihockey() {
  await updateClubsSwissunihockey();
  // await updateTeamsSwissunihockey();
}

async function updateSwissVolleyball() {
  await updateClubsSwissvolleyball();
  // await updateTeamsSwissvolleyball();
}


async function updateSwissHandball() {
  await updateClubsSwisshandball();
  // await updateTeamsSwisshandball();
}


async function updateSwissTurnverband() {
  await updateClubsSwissturnverband();
  // await updateTeamsSwissturnverband();
}
*/
