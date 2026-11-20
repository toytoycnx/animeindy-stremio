function cleanText(s = "") {
  return String(s).replace(/\s+/g, " ").replace(/[\u00a0\u200b]/g, " ").trim();
}
function encodeId(url) { return "indy:" + Buffer.from(url).toString("base64url"); }
function decodeId(id) {
  if (!String(id).startsWith("indy:")) throw new Error("Invalid item ID");
  const url = Buffer.from(String(id).slice(5), "base64url").toString();
  const parsed = new URL(url);
  if (parsed.hostname !== "indy-anime.net" && parsed.hostname !== "www.indy-anime.net")
    throw new Error("Untrusted URL");
  return url;
}
module.exports = { cleanText, encodeId, decodeId };
