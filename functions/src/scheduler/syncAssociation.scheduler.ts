/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {EventContext} from "firebase-functions";

import {updateTeamsSwissunihockey, updateClubsSwissunihockey, updateGamesSwissunihockey, updateNewsSwissunihockey} from "./utils/update.swissunihockey";
import {updateTeamsSwissvolleyball, updateClubsSwissvolleyball} from "./utils/update.swissvolleyball";
import {updateTeamsSwisshandball, updateClubsSwisshandball, updateGamesSwisshandball, updateNewsSwisshandball} from "./utils/update.swisshandball";
import {updateTeamsSwissturnverband, updateClubsSwissturnverband} from "./utils/update.swissturnverband";
// import {updateClubsSwissvolleyball} from "./utils/update.swissvolleyball";
import {updateClubsSwisstennis} from "./utils/update.swisstennis";

import firebaseDAO from "./../firebaseSingleton";
const db = firebaseDAO.instance.db;
const fetch = require("node-fetch");
// const jsdom = require("jsdom");
// const cheerio = require("cheerio");

export async function updatePersistenceJobClubs(context: EventContext) {
  try {
    await updateClubsSwissunihockey();
    await updateClubsSwisshandball();
    await updateClubsSwissvolleyball();
    await updateClubsSwissturnverband();
    await updateClubsSwisstennis();
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
  } catch (err) {
    console.error(err);
  }
}

export async function updatePersistenceJobNews(context: EventContext) {
  try {
    await updateClubNewsFromWordpress();
    await updateNewsSwissunihockey();
    await updateNewsSwisshandball();
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
      const url = club.data().wordpress + "/wp-json/wp/v2/posts?per_page=20";
      const wpData = await fetch(url);
      const wpNews = await wpData.json();
      console.log("News URL: " + url);

      for (const news of wpNews) {
        console.log(news.link);

        /* let text = String(news["content"].rendered).replaceAll("<p>", "");
        text = String(text).replaceAll("</p><p>", "/n");
        text = String(text).replaceAll("</p>", ""); */

        /* const dom = new jsdom.JSDOM(news["content"].rendered);
        const element = dom.window.document.createElement("div");
        element.innerHTML = news["content"].rendered;
        // const newsText = element.innerText;

        // element.innerHTML = news["excerpt"].rendered;
        // const leadText = element.innerText;
        */


        // Load the HTML content using Cheerio
        /* const $ = cheerio.load(news["content"].rendered);

        // Create an array to hold the transformed content
        const ionicContent: string[] = [];

        // Process paragraphs and strong text
        $("p").each((index: any, element: any) => {
          const strongText = $(element).find("strong").text();
          const text = $(element).text().replace(strongText, "");
          ionicContent.push(`<p><strong>${strongText}</strong>${text}</p>`);
        });

        // Process images
        $("img").each((index: any, element: any) => {
          const src = $(element).attr("src");
          const alt = $(element).attr("alt") || "Image";
          if (src) {
            ionicContent.push(`<ion-img src="${src}" alt="${alt}"></ion-img>`);
          }
        });

        // Process ordered lists
        $("ol").each((index: any, element: any) => {
          const items = $(element).find("li").map((i: any, li: any) => `<ion-item>${$(li).text()}</ion-item>`).get().join("");
          ionicContent.push(`<ion-list>${items}</ion-list>`);
        });

        // Combine everything into an <ion-card-content> wrapper
        const textResult = `<ion-text>${ionicContent.join("")}</ion-text>`;
        */

        // LEAD TEXT
        // Load the HTML content using Cheerio
        /* const $lead = cheerio.load(news["excerpt"].rendered);

        // Create an array to hold the transformed content
        const ionicLead: string[] = [];

        // Process paragraphs and strong text
        $lead("p").each((index: any, element: any) => {
          const strongText = $lead(element).find("strong").text();
          const text = $lead(element).text().replace(strongText, "");
          ionicLead.push(`<p><strong>${strongText}</strong>${text}</p>`);
        });

        // Process images
        $lead("img").each((index: any, element: any) => {
          const src = $lead(element).attr("src");
          const alt = $lead(element).attr("alt") || "Image";
          if (src) {
            ionicLead.push(`<ion-img src="${src}" alt="${alt}"></ion-img>`);
          }
        });

        // Process ordered lists
        $lead("ol").each((index: any, element: any) => {
          const items = $lead(element).find("li").map((i: any, li: any) => `<ion-item>${$lead(li).text()}</ion-item>`).get().join("");
          ionicLead.push(`<ion-list>${items}</ion-list>`);
        });

        // Combine everything into an <ion-card-content> wrapper
        const leadResult = `<ion-text>${ionicLead.join("")}</ion-text>`;
        */

        const wpUserData = await fetch(news["_links"].author[0].href);
        const wpUser = await wpUserData.json();
        const authorImage = wpUser.avatar_urls[96] || wpUser.avatar_urls[48] || wpUser.avatar_urls[24] || "";

        const wpFeaturedMediaData = await fetch(news["_links"]["wp:featuredmedia"][0].href);
        const wpFeaturedMedia = await wpFeaturedMediaData.json();
        const featuredMedia = wpFeaturedMedia.media_details.sizes.medium.source_url || wpFeaturedMedia.guid.rendered || wpFeaturedMedia.source_url;

        await db.collection("club").doc(`${club.id}`).collection("news").doc(`${club.id}-${news.id}`).set({
          externalId: `${news["id"]}`,
          title: news["title"].rendered,
          leadText: news["excerpt"].rendered,
          date: news["date"],
          slug: news["slug"],
          image: featuredMedia || authorImage || "https://placehold.co/600x400",
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
