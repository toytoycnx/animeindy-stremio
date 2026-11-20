const cheerio = require("cheerio");
const BASE = "https://indy-anime.net";
const headers = {
  "user-agent": "Mozilla/5.0 (compatible; ANIMEiNDY-Stremio/0.1; +https://www.stremio.com/)",
  "accept": "text/html,application/xhtml+xml"
};
async function getHtml(url) {
  const u = new URL(url);
  if (!["indy-anime.net", "www.indy-anime.net"].includes(u.hostname)) throw new Error("Blocked host");
  const r = await fetch(u, { headers, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`Source HTTP ${r.status}`);
  return await r.text();
}
function abs(href) { try { return new URL(href, BASE).href; } catch { return ""; } }
function parseCards(html) {
  const $ = cheerio.load(html);
  const seen = new Set(), out = [];
  $("a[href]").each((_, a) => {
    const href = abs($(a).attr("href"));
    if (!href.startsWith(BASE + "/") || href === BASE + "/" || /\/(category|tag|page)\//.test(href)) return;
    const title = $(a).attr("title") || $(a).text();
    const img = $(a).find("img").first();
    const image = img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "";
    const poster = abs(image);
    const text = `${title} ${img.attr("alt") || ""}`.replace(/\s+/g, " ").trim();
    if (!text || text.length < 4 || seen.has(href)) return;
    // Prefer links that look like anime cards (image plus title).
    if (!image && !$(a).closest("article").length) return;
    seen.add(href);
    out.push({ url: href, title: text.slice(0, 180), poster: poster || undefined });
  });
  return out;
}
async function getHome(catalogId) {
  const html = await getHtml(BASE + "/");
  const $ = cheerio.load(html);
  let selector = "article a[href], .post a[href], .item a[href], .anime a[href]";
  let cards = [];
  $(selector).each((_, a) => {
    const href = abs($(a).attr("href"));
    const img = $(a).find("img").first();
    const title = ($(a).attr("title") || img.attr("alt") || $(a).text()).replace(/\s+/g," ").trim();
    const poster = abs(img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "");
    if (href.startsWith(BASE + "/") && title && !cards.some(x => x.url === href))
      cards.push({ url: href, title, poster });
  });
  if (catalogId === "animeindy_popular") {
    const popular = $("h2,h3,h4").filter((_,e)=>/ดูมากที่สุด|ยอดนิยม|กำลังมาแรง/.test($(e).text()))
      .first().parent().find("a[href]");
    const p = [];
    popular.each((_,a)=> {
      const href=abs($(a).attr("href")), img=$(a).find("img").first();
      const title=($(a).attr("title")||img.attr("alt")||$(a).text()).replace(/\s+/g," ").trim();
      if(href.startsWith(BASE+"/") && title && !p.some(x=>x.url===href))
        p.push({url:href,title,poster:abs(img.attr("src")||img.attr("data-src")||"")});
    });
    if(p.length) cards=p;
  }
  if (!cards.length) cards = parseCards(html);
  return cards.slice(0, 80);
}
async function searchAnime(query) {
  const url = `${BASE}/?s=${encodeURIComponent(query)}`;
  return parseCards(await getHtml(url)).slice(0, 50);
}
async function getAnime(url) {
  const html = await getHtml(url), $ = cheerio.load(html);
  const title = $("h1").first().text().trim() || $("title").text().trim();
  const posterEl = $("article img, .entry-content img, img").filter((_,e)=>!!($(e).attr("src")||$(e).attr("data-src"))).first();
  const poster = abs(posterEl.attr("data-src") || posterEl.attr("data-lazy-src") || posterEl.attr("src") || "");
  const description = $(".entry-content p, article p").map((_,e)=>$(e).text().trim()).get().filter(Boolean).slice(0,5).join("\n\n");
  const episodes = [];
  $("a[href]").each((_,a)=>{
    const href=abs($(a).attr("href")), text=$(a).text().replace(/\s+/g," ").trim();
    if(href.startsWith(BASE+"/") && href!==url && /ตอนที่|episode|ep\.?\s*\d+/i.test(text) &&
       !episodes.some(x=>x.url===href)) episodes.push({url:href,title:text});
  });
  const genres = $("a[rel='tag']").map((_,e)=>$(e).text().trim()).get().filter(Boolean);
  return {url,title,poster,description,episodes,genres};
}
async function getEpisodePage(url) {
  const $ = cheerio.load(await getHtml(url));
  return $("h1").first().text().trim() || $("title").text().trim();
}
async function getEpisodeStream(url) {
  const html = await getHtml(url);

  const embed = html.match(/"embedUrl"\s*:\s*"([^"]+)"/);
  if (!embed) throw new Error("Embed not found");

  const embedUrl = embed[1].replace(/\\\//g, "/");
  const u = new URL(embedUrl);

  if (u.hostname !== "indy.team-indy.net")
    throw new Error("Invalid embed");

  const r = await fetch(u, {
    headers,
    signal: AbortSignal.timeout(15000)
  });

  if (!r.ok) throw new Error("Embed unavailable");

  const source = await r.text();
  const match = source.match(/var\s+playerlink\s*=\s*"([^"]+)"/);

  if (!match) throw new Error("Stream not found");

  const stream = new URL(match[1]);

  if (stream.hostname !== "hls.animeindy.com" ||
      !stream.pathname.endsWith(".m3u8"))
    throw new Error("Invalid stream");

  return stream.href;
}
module.exports = {
  getHome,
  getAnime,
  getEpisodePage,
  searchAnime,
  getEpisodeStream
};
