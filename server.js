const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const { getHome, getAnime, getEpisodePage, searchAnime, getEpisodeStream } = require("./site");
const { decodeId, encodeId, cleanText } = require("./util");

const PORT = process.env.PORT || 7000;
const BASE = "https://indy-anime.net";
const manifest = {
  id: "community.animeindy.catalog",
  version: "0.1.0",
  name: "ANIMEiNDY",
  description: "แคตตาล็อกอนิเมะจาก ANIMEiNDY พร้อมลิงก์เปิดหน้าต้นทาง",
  logo: "https://indy-anime.net/wp-content/uploads/",
  resources: ["catalog", "meta", "stream", "subtitles"],
  types: ["series", "movie"],
  catalogs: [
    { type: "series", id: "animeindy_latest", name: "ANIMEiNDY • ตอนล่าสุด" },
    { type: "series", id: "animeindy_popular", name: "ANIMEiNDY • ยอดนิยม" },
    { type: "series", id: "animeindy_all", name: "ANIMEiNDY • อนิเมะทั้งหมด" }
  ],
  idPrefixes: ["indy:"]
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra = {} }) => {
  try {
    const q = (extra.search || "").trim();
    const items = q ? await searchAnime(q) : await getHome(id);
    return { metas: items.map(item => ({
      id: encodeId(item.url),
      type: "series",
      name: cleanText(item.title),
      poster: item.poster || undefined,
      description: item.description || "ข้อมูลจาก ANIMEiNDY",
      website: item.url
    })) };
  } catch (e) {
    console.error("catalog:", e.message);
    return { metas: [] };
  }
});

builder.defineMetaHandler(async ({ type, id }) => {
  try {
    const url = decodeId(id);
    const anime = await getAnime(url);
    if (!anime) return { meta: null };
    return { meta: {
      id, type: "series", name: anime.title,
      poster: anime.poster || undefined,
      background: anime.poster || undefined,
      description: anime.description,
      genres: anime.genres || [],
      videos: anime.episodes.map((ep, i) => ({
        id: encodeId(ep.url),
        title: ep.title || `ตอนที่ ${i + 1}`,
        season: 1,
        episode: i + 1,
        released: ep.released
      })),
      links: [{ name: "เปิดหน้า ANIMEiNDY", category: "แหล่งข้อมูล", url: anime.url }]
    }};
  } catch (e) {
    console.error("meta:", e.message);
    return { meta: null };
  }
});

// ให้ Stremio แสดงทางเลือกเปิดหน้าเว็บต้นทางเท่านั้น.
// ไม่แกะ/ข้าม DRM, paywall, token หรือระบบป้องกันของผู้ให้บริการวิดีโอ.
builder.defineStreamHandler(async ({ id }) => {
  try {
    const episodeUrl = decodeId(id);

    if (!episodeUrl.startsWith(BASE + "/"))
      return { streams: [] };

    const title = await getEpisodePage(episodeUrl);
    const streamUrl = await getEpisodeStream(episodeUrl);

    return {
      streams: [{
        name: "ANIMEiNDY",
        title: title || "เปิดตอนนี้",
        description: "Direct HLS • 1080p",
        url: streamUrl
      }]
    };
  } catch (e) {catch (e) {
    console.error("stream:", e.message);
    return { streams: [] };
  }
});

// ยังไม่ส่งไฟล์ซับที่ไม่ได้รับอนุญาต/ยังไม่มีแหล่งซับที่ตรวจสอบได้
builder.defineSubtitlesHandler(async () => ({ subtitles: [] }));

serveHTTP(builder.getInterface(), { port: PORT });
console.log(`ANIMEiNDY Stremio Add-on listening on ${PORT}`);
