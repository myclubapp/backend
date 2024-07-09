/* eslint-disable linebreak-style */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {EventContext} from "firebase-functions";
import firebaseDAO from "../firebaseSingleton";
const db = firebaseDAO.instance.db;
const {google} = require("googleapis");
import * as functions from "firebase-functions";
import fs = require("fs");
const mobileSportsUnihockey = fs.readFileSync("./src/scheduler/mobilesports_data_unihockey.json", "utf8");


// Initialize the YouTube API client
const youtube = google.youtube({
  version: "v3",
  auth: functions.config().api.youtube, // Replace with your API key
});

export async function exercisesScheduler(context: EventContext) {
  try {
    console.log("Youtube Scheduler: Trainerausbildung Breitensport Grossfeld");
    const response = await youtube.playlistItems.list({
      part: "snippet,contentDetails",
      maxResults: 150, // Adjust if needed
      playlistId: "PL4GcRGPV7hzxG3GSoVtz7MvLhelIOOGcJ",
    });

    const playlist = response.data.items;
    if (playlist.length === 0) {
      throw new Error("Playlist not found");
    }

    for (const item of playlist) {
      let imageURL = "";
      try {
        imageURL = item.snippet.thumbnails.standard.url;
      } catch (e) {
        console.log(item.snippet.thumbnails);
      }
      await db.collection("exercises").doc("su-" + item.id).set({
        "title": item.snippet.title,
        "category": "Trainerausbildung Breitensport Grossfeld",
        "description": item.snippet.description,
        "type": "swissunihockey",
        "image": imageURL,
        "date": item.contentDetails.videoPublishedAt,
        "source": "https://www.youtube.com/watch?v=bPfoDOmi_OA&list=PL4GcRGPV7hzxbfk1Hylmbzl4UWWeqs8l1&pp=iAQB",
        "link": "https://www.youtube.com/watch?v=" + item.contentDetails.videoId,
        "video": "https://www.youtube.com/watch?v=" + item.contentDetails.videoId,
      }, {
        merge: true,
      });
    }
  } catch (err) {
    console.error(err);
  }

  try {
    console.log("Youtube Scheduler: Trainerausbildung - Leistungssport Grossfeld");
    const response = await youtube.playlistItems.list({
      part: "snippet,contentDetails",
      maxResults: 150, // Adjust if needed
      playlistId: "PL4GcRGPV7hzxGudjWhZGXCSeB_beYOtEy",
    });

    const playlist = response.data.items;
    if (playlist.length === 0) {
      throw new Error("Playlist not found");
    }

    for (const item of playlist) {
      let imageURL = "";
      try {
        imageURL = item.snippet.thumbnails.standard.url;
      } catch (e) {
        console.log(item.snippet.thumbnails);
      }
      await db.collection("exercises").doc("su-" + item.id).set({
        "title": item.snippet.title,
        "category": "Trainerausbildung - Leistungssport Grossfeld",
        "description": item.snippet.description,
        "type": "swissunihockey",
        "image": imageURL,
        "date": item.contentDetails.videoPublishedAt,
        "source": "https://www.youtube.com/watch?v=bPfoDOmi_OA&list=PL4GcRGPV7hzxGudjWhZGXCSeB_beYOtEy&pp=iAQB",
        "link": "https://www.youtube.com/watch?v=" + item.contentDetails.videoId,
        "video": "https://www.youtube.com/watch?v=" + item.contentDetails.videoId,
      }, {
        merge: true,
      });
    }
  } catch (err) {
    console.error(err);
  }

  try {
    console.log("Youtube Scheduler: Trainerausbildung - Einstieg Grossfeld");
    const response = await youtube.playlistItems.list({
      part: "snippet,contentDetails",
      maxResults: 150, // Adjust if needed
      playlistId: "PL4GcRGPV7hzx4F41YYudtYuywLLgL3ZX5",
    });

    const playlist = response.data.items;
    if (playlist.length === 0) {
      throw new Error("Playlist not found");
    }

    for (const item of playlist) {
      let imageURL = "";
      try {
        imageURL = item.snippet.thumbnails.standard.url;
      } catch (e) {
        console.log(item.snippet.thumbnails);
      }
      await db.collection("exercises").doc("su-" + item.id).set({
        "title": item.snippet.title,
        "category": "Trainerausbildung - Einstieg Grossfeld",
        "description": item.snippet.description,
        "type": "swissunihockey",
        "image": imageURL,
        "date": item.contentDetails.videoPublishedAt,
        "source": "https://www.youtube.com/watch?v=bPfoDOmi_OA&list=PL4GcRGPV7hzx4F41YYudtYuywLLgL3ZX5&pp=iAQB",
        "link": "https://www.youtube.com/watch?v=" + item.contentDetails.videoId,
        "video": "https://www.youtube.com/watch?v=" + item.contentDetails.videoId,
      }, {
        merge: true,
      });
    }
  } catch (err) {
    console.error(err);
  }

  try {
    console.log("Youtube Scheduler - OLD?");
    const response = await youtube.playlistItems.list({
      part: "snippet,contentDetails",
      maxResults: 100, // Adjust if needed
      playlistId: "PL4GcRGPV7hzzrTUCK_ua0A4rvMc7WmhH9",
    });

    const playlist = response.data.items;
    if (playlist.length === 0) {
      throw new Error("Playlist not found");
    }

    for (const item of playlist) {
      let imageURL = "";
      try {
        imageURL = item.snippet.thumbnails.standard.url;
      } catch (e) {
        console.log(item.snippet.thumbnails);
      }

      // console.log(item);
      // console.log("channelId: " + item.snippet.channelId);
      // console.log("title: " + item.snippet.title);
      await db.collection("exercises").doc("su-" + item.id).set({
        "title": item.snippet.title,
        "category": "",
        "description": item.snippet.description,
        "type": "swissunihockey",
        "image": imageURL,
        "date": item.contentDetails.videoPublishedAt,
        "source": "https://www.youtube.com",
        "link": "https://www.youtube.com/watch?v=" + item.contentDetails.videoId,
        "video": "https://www.youtube.com/watch?v=" + item.contentDetails.videoId,
      }, {
        merge: true,
      });
    }
  } catch (err) {
    console.error(err);
  }
  /*
   * MOBILESPORTS
   */
  const data: Array<any> = JSON.parse(mobileSportsUnihockey);
  for (const item of data) {
    await db.collection("exercises").doc("su-" + item.id).set({
      "title": item.title,
      "category": item.category,
      "description": item.description,
      "type": "swissunihockey",
      "image": item.image,
      "date": "",
      "source": "https://www.mobilesport.ch",
      "link": item.link,
      "video": "",
    }, {
      merge: true,
    });
  }

  return true;
}
