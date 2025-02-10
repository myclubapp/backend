/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */

import firebaseDAO from '../firebaseSingleton.js';
const db = firebaseDAO.instance.db;
import {google} from 'googleapis';

import * as fs from 'fs';
const mobileSportsUnihockey = fs.readFileSync('./src/scheduler/mobilesports_data_unihockey.json', 'utf8');
import {logger} from 'firebase-functions';

// Initialize the YouTube API client
import {defineString} from 'firebase-functions/params';
const youtubeApiKey = defineString('YOUTUBE_API_KEY');

const youtube = google.youtube({
  version: 'v3',
  auth: youtubeApiKey.value(), // Replace with your API key
});

export async function exercisesScheduler() {
  try {
    logger.info('Youtube Scheduler: Trainerausbildung Breitensport Grossfeld');
    const response = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      maxResults: 150,
      playlistId: 'PL4GcRGPV7hzxG3GSoVtz7MvLhelIOOGcJ',
    });
    const playlist = response.data.items ?? [];
    if (playlist.length === 0) {
      throw new Error('Playlist not found');
    }

    for (const item of playlist) {
      let imageURL = '';
      if (!item?.snippet?.thumbnails?.standard?.url || !item?.contentDetails?.videoId || !item?.contentDetails?.videoPublishedAt) {
        logger.info('Missing required data:', {thumbnails: item.snippet?.thumbnails, contentDetails: item.contentDetails});
        continue;
      }
      imageURL = item.snippet.thumbnails.standard.url;

      await db.collection('exercises').doc('su-' + item.id).set({
        'title': item.snippet?.title ?? '',
        'category': 'Trainerausbildung Breitensport Grossfeld',
        'description': item.snippet?.description ?? '',
        'type': 'swissunihockey',
        'image': imageURL,
        'date': item.contentDetails.videoPublishedAt,
        'source': 'https://www.youtube.com/watch?v=bPfoDOmi_OA&list=PL4GcRGPV7hzxbfk1Hylmbzl4UWWeqs8l1&pp=iAQB',
        'link': 'https://www.youtube.com/watch?v=' + item.contentDetails.videoId,
        'video': 'https://www.youtube.com/watch?v=' + item.contentDetails.videoId,
      }, {
        merge: true,
      });
    }
  } catch (err) {
    logger.error(err);
  }

  try {
    logger.info('Youtube Scheduler: Trainerausbildung - Leistungssport Grossfeld');
    const response = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      maxResults: 150,
      playlistId: 'PL4GcRGPV7hzxGudjWhZGXCSeB_beYOtEy',
    });

    const playlist = response.data.items ?? [];
    if (playlist.length === 0) {
      throw new Error('Playlist not found');
    }

    for (const item of playlist) {
      let imageURL = '';
      if (!item?.snippet?.thumbnails?.standard?.url || !item?.contentDetails?.videoId || !item?.contentDetails?.videoPublishedAt) {
        logger.info('Missing required data:', {thumbnails: item.snippet?.thumbnails, contentDetails: item.contentDetails});
        continue;
      }
      imageURL = item.snippet.thumbnails.standard.url;

      await db.collection('exercises').doc('su-' + item.id).set({
        'title': item.snippet?.title ?? '',
        'category': 'Trainerausbildung - Leistungssport Grossfeld',
        'description': item.snippet?.description ?? '',
        'type': 'swissunihockey',
        'image': imageURL,
        'date': item.contentDetails.videoPublishedAt,
        'source': 'https://www.youtube.com/watch?v=bPfoDOmi_OA&list=PL4GcRGPV7hzxGudjWhZGXCSeB_beYOtEy&pp=iAQB',
        'link': 'https://www.youtube.com/watch?v=' + item.contentDetails.videoId,
        'video': 'https://www.youtube.com/watch?v=' + item.contentDetails.videoId,
      }, {
        merge: true,
      });
    }
  } catch (err) {
    logger.error(err);
  }

  try {
    logger.info('Youtube Scheduler: Trainerausbildung - Einstieg Grossfeld');
    const response = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      maxResults: 150,
      playlistId: 'PL4GcRGPV7hzx4F41YYudtYuywLLgL3ZX5',
    });

    const playlist = response.data.items ?? [];
    if (playlist.length === 0) {
      throw new Error('Playlist not found');
    }

    for (const item of playlist) {
      let imageURL = '';
      if (!item?.snippet?.thumbnails?.standard?.url || !item?.contentDetails?.videoId || !item?.contentDetails?.videoPublishedAt) {
        logger.info('Missing required data:', {thumbnails: item.snippet?.thumbnails, contentDetails: item.contentDetails});
        continue;
      }
      imageURL = item.snippet.thumbnails.standard.url;

      await db.collection('exercises').doc('su-' + item.id).set({
        'title': item.snippet?.title ?? '',
        'category': 'Trainerausbildung - Einstieg Grossfeld',
        'description': item.snippet?.description ?? '',
        'type': 'swissunihockey',
        'image': imageURL,
        'date': item.contentDetails.videoPublishedAt,
        'source': 'https://www.youtube.com/watch?v=bPfoDOmi_OA&list=PL4GcRGPV7hzx4F41YYudtYuywLLgL3ZX5&pp=iAQB',
        'link': 'https://www.youtube.com/watch?v=' + item.contentDetails.videoId,
        'video': 'https://www.youtube.com/watch?v=' + item.contentDetails.videoId,
      }, {
        merge: true,
      });
    }
  } catch (err) {
    logger.error(err);
  }

  /* try {
    logger.info("Youtube Scheduler - OLD?");
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
        logger.info(item.snippet.thumbnails);
      }

      // logger.info(item);
      // logger.info("channelId: " + item.snippet.channelId);
      // logger.info("title: " + item.snippet.title);
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
    logger.error(err);
  } */

  /*
   * MOBILESPORTS
   */
  const data: Array<any> = JSON.parse(mobileSportsUnihockey);
  logger.info('Mobilesport ');
  for (const item of data) {
    await db.collection('exercises').doc('su-' + item.id).set({
      'title': item.title,
      'category': item.category,
      'description': item.description,
      'type': 'swissunihockey',
      'image': item.image,
      'date': '',
      'source': 'https://www.mobilesport.ch',
      'link': item.link,
      'video': '',
    }, {
      merge: true,
    });
  }

  return;
}
