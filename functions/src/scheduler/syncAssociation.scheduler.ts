/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {EventContext} from "firebase-functions";

import {updateTeamsSwissunihockey, updateClubsSwissunihockey, updateGamesSwissunihockey, updateNewsSwissunihockey} from "./utils/update.swissunihockey";
import {updateTeamsSwissvolleyball, updateClubsSwissvolleyball, updateNewsSwissvolley, updateGamesSwissvolley} from "./utils/update.swissvolleyball";
import {updateTeamsSwisshandball, updateClubsSwisshandball, updateGamesSwisshandball} from "./utils/update.swisshandball";
import {updateClubsSwissturnverband, updateTeamsSwissturnverband} from "./utils/update.swissturnverband";

import firebaseDAO from "./../firebaseSingleton";
const db = firebaseDAO.instance.db;
const fetch = require("node-fetch");

export async function updatePersistenceJobClubs(context: EventContext) {
  try {
    await updateClubsSwissunihockey();
    await updateClubsSwisshandball();
    await updateClubsSwissvolleyball();
    await updateClubsSwissturnverband();
    // await updateClubsSwisstennis();
  } catch (err) {
    console.error(err);
  }
}

export async function updatePersistenceJobTeams(context: EventContext) {
  try {
    await updateTeamsSwissunihockey();
    await updateTeamsSwisshandball();
    await updateTeamsSwissvolleyball();
    await updateTeamsSwissturnverband();
  } catch (err) {
    console.error(err);
  }
}

export async function updatePersistenceJobGames(context: EventContext) {
  try {
    await updateGamesSwissunihockey();
    await updateGamesSwisshandball();
    await updateGamesSwissvolley();
  } catch (err) {
    console.error(err);
  }
}

export async function updatePersistenceJobNews(context: EventContext) {
  try {
    await updateNewsSwissunihockey();
    await updateNewsSwissvolley();
    await updateClubNewsFromWordpress();
    // await updateNewsSwisshandball();
  } catch (err) {
    console.error(err);
  }
}

async function updateClubNewsFromWordpress(): Promise<any> {
  console.log("updateClubNewsFromWordpress");

  const clubListRef = await db.collection("club").where("active", "==", true).get();
  for (const club of clubListRef.docs) {
    // console.log(club.id);

    if (club.data().wordpress) {
      // console.log(club.data().wordpress);
    try {
        const url = club.data().wordpress + "/wp-json/wp/v2/posts?per_page=20";
        const wpData = await fetch(url);
        const wpNews = await wpData.json();
        console.log("News URL: " + url);

        for (const news of wpNews) {
          console.log(news.link);

          const wpUserData = await fetch(news["_links"].author[0].href);
          const wpUser = await wpUserData.json();
          const authorImage = wpUser.avatar_urls[96] || wpUser.avatar_urls[48] || wpUser.avatar_urls[24] || "";

          let featuredMedia = "";
          try {
            if (news.featured_media > 0) {
              // Features Media via media fetch available
              const wpFeaturedMediaData = await fetch(news["_links"]["wp:featuredmedia"][0].href);
              const wpFeaturedMedia = await wpFeaturedMediaData.json();
              featuredMedia = wpFeaturedMedia.media_details.sizes.medium.source_url || wpFeaturedMedia.source_url || wpFeaturedMedia.guid.rendered;
            } else {
              featuredMedia = authorImage || "https://placehold.co/600x400";
            }
          } catch (e) {
            // console.log(e);
            featuredMedia = authorImage || "https://placehold.co/600x400";
          }

          await db.collection("club").doc(`${club.id}`).collection("news").doc(`${club.id}-${news.id}`).set({
            externalId: `${news["id"]}`,
            title: news["title"].rendered,
            leadText: news["excerpt"].rendered,
            clubId: club.id,
            date: news["date"],
            slug: news["slug"],
            image: featuredMedia,
            text: news["content"].rendered,
            htmlText: news["content"].rendered || " ",
            tags: "Webseite",
            author: wpUser.name,
            authorImage: authorImage,
            url: news["link"],
            type: club.type,
            updated: new Date(),
          }, {
            merge: true,
            ignoreUndefinedProperties: true,
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
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
