/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import fetch from "node-fetch";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require("node-fetch");
// eslint-disable-next-line @typescript-eslint/no-var-requires

export default {
  Query: {
    clubs: (parent: any, args: any, context: any, info: any) => {
      return getClubs();
    },
    news: (parent: any, args: any, context: any, info: any) => {
      return getNews();
    },
  },
};

async function getNews() {
  const newsData = await fetch("https://swiss.basketball/!/eloquent-entries/entries?locale=de&collection=posts|game-recaps|team-presentations&page=1&category=&tag=&query=",
      {
        "credentials": "include",
        "headers": {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
          "X-XSRF-TOKEN": "eyJpdiI6IkM0MW4wR09BMEgrM2J3STlYdDUyNWc9PSIsInZhbHVlIjoiNVV4QnQ1WXZRbGJYYnZHTEc3ejlqd3JRQnkxM0hOT2lsNXVudURiZ05lcE13TzFaKzloVEZ1VUZCMVFMN3F4WG90MjQ1K0pKdmZNcm92d3h5bHBQdXc9PSIsIm1hYyI6ImY1ZTUwYzFiYzMzMjE5OTg5MjhkNTMyYTVlNDVhOTQwMmYyM2Q1MTYzZGE5MDhmNDJiMGRmOTdhY2QyYjgwYWYifQ==",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "Sec-GPC": "1",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
        },
        "referrer": "https://swiss.basketball/de/news-center",
        "method": "GET",
        "mode": "cors",
      });
  const newsList = <any>[];
  console.log(JSON.stringify(newsData));
  newsData.data.forEach((element:any)=> {
    newsList.push({
      id: element.id,
      title: element.data.title,
    });
  });
}

async function getClubs() {
  const clubList = await fetch("https://api.swish.nbn23.com/competitions", {
    "credentials": "include",
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0",
      "Accept": "*/*",
      "Accept-Language": "de,en-US;q=0.7,en;q=0.3",
      "Authorization": "j28Jnvds200SJ",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
      "Sec-GPC": "1",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache",
    },
    "referrer": "https://swiss.basketball/",
    "method": "GET",
    "mode": "cors",
  });
  console.log(JSON.stringify(clubList));
  return clubList;
}