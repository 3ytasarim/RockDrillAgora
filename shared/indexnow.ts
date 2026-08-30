// IndexNow — instant URL submission to Bing, Yandex, Seznam, Naver (and shared
// with Google's discovery pipeline). Keyless auth: hosting <KEY>.txt at the site
// root proves ownership. https://www.indexnow.org/

export const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || "1c89b6b87e75df8031f02f2c487f4dd9";

const SITE = "https://agorarockdrill.shop";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_PER_REQUEST = 10000;

export function keyFileBody(): string {
  return INDEXNOW_KEY;
}

// Submit one or more absolute URLs. Returns per-batch HTTP status.
// 200/202 = accepted, 422 = invalid URL/key mismatch, 429 = rate limited.
export async function submitToIndexNow(urls: string[]): Promise<{ batch: number; status: number }[]> {
  const clean = Array.from(
    new Set(urls.filter((u) => typeof u === "string" && u.startsWith(SITE)))
  );
  const results: { batch: number; status: number }[] = [];
  for (let i = 0; i < clean.length; i += MAX_PER_REQUEST) {
    const urlList = clean.slice(i, i + MAX_PER_REQUEST);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: "agorarockdrill.shop",
          key: INDEXNOW_KEY,
          keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
          urlList,
        }),
      });
      results.push({ batch: i / MAX_PER_REQUEST, status: res.status });
    } catch (err) {
      console.error("IndexNow submit failed:", err);
      results.push({ batch: i / MAX_PER_REQUEST, status: 0 });
    }
  }
  return results;
}

// Fire-and-forget single URL ping (safe to call from create/update handlers).
export function pingIndexNow(url: string): void {
  submitToIndexNow([url]).catch(() => {});
}
