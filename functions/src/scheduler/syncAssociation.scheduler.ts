/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {EventContext} from "firebase-functions";

import {updateTeamsSwissunihockey, updateClubsSwissunihockey, updateGamesSwissunihockey, updateNewsSwissunihockey} from "./utils/update.swissunihockey";
import {updateTeamsSwissvolleyball, updateClubsSwissvolleyball} from "./utils/update.swissvolleyball";
import {updateTeamsSwisshandball, updateClubsSwisshandball} from "./utils/update.swisshandball";
import {updateTeamsSwissturnverband, updateClubsSwissturnverband} from "./utils/update.swissturnverband";
// import {updateClubsSwissvolleyball} from "./utils/update.swissvolleyball";
import {updateClubsSwisstennis} from "./utils/update.swisstennis";

import firebaseDAO from "./../firebaseSingleton";
const db = firebaseDAO.instance.db;
const fetch = require("node-fetch");

export async function updatePersistenceJobClubs(context: EventContext) {
  try {
    await updateClubsSwissunihockey();
    await updateClubsSwissvolleyball();
    await updateClubsSwisshandball();
    await updateClubsSwissturnverband();
    await updateClubsSwisstennis();
  } catch (err) {
    console.error(err);
  }
}

export async function updatePersistenceJobTeams(context: EventContext) {
  try {
    await updateTeamsSwissunihockey();
    await updateTeamsSwissvolleyball();
    await updateTeamsSwisshandball();
    await updateTeamsSwissturnverband();
  } catch (err) {
    console.error(err);
  }
}

export async function updatePersistenceJobGames(context: EventContext) {
  try {
    await updateGamesSwissunihockey();
  } catch (err) {
    console.error(err);
  }
}

export async function updatePersistenceJobNews(context: EventContext) {
  try {
    await updateNewsSwissunihockey();
    await updateClubNewsFromWordpress();
  } catch (err) {
    console.error(err);
  }
}

async function updateClubNewsFromWordpress(): Promise<any> {
  console.log("updateClubNewsFromWordpress");

  const clubListRef = await db.collection("club").where("active", "==", true).get();
  for (const club of clubListRef.docs) {
    console.log(club.id);

    if (club.data().wordpress) {
      console.log(club.data().wordpress);
      const url = club.data().wordpress + "/wp-json/wp/v2/posts/";
      const wpData = await fetch(url);
      const wpNews = await wpData.json();

      for (const news of wpNews) {
        console.log(news);

        await db.collection("club").doc(`${club.id}`).collection("news").doc(`su-${news.id}`).set({
          externalId: `${news["id"]}`,
          title: news["title"].rendered,
          leadText: news["excerpt"].rendered,
          date: news["date"],
          slug: news["slug"],
          image: " ",
          text: news["content"].rendered || " ",
          htmlText: news["content"].rendered || " ",
          tags: "Webseite",
          author: " ",
          authorImage: news.authorImage || " ",
          url: news["link"],
          type: "swissunihockey",
          updated: new Date(),
        }, {
          merge: true,
          ignoreUndefinedProperties: true,
        });
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
