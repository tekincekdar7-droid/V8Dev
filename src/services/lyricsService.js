// lyricsService.js - LRCLIB synced & plain lyrics parser with intelligent matching
export function parseLrcLyrics(lrcText) {
  if (!lrcText || typeof lrcText !== 'string') return [];
  const lines = lrcText.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
    if (!text) continue;

    let match;
    timeRegex.lastIndex = 0;
    while ((match = timeRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
      const timeMs = (minutes * 60 + seconds) * 1000 + ms;
      result.push({ timeMs, text });
    }
  }

  result.sort((a, b) => a.timeMs - b.timeMs);
  return result;
}

export async function fetchLyrics(title, artist) {
  if (!title) return null;

  try {
    // Clean up title (remove 'Official Video', feat, remix tags for higher match rate)
    const cleanTitle = title
      .replace(/(\(|\[).*?(official|video|audio|clip|hq|hd|4k|lyrics|remix|feat|ft|klip|netd).*?(\)|\])/gi, '')
      .replace(/[-–—].*$/, '')
      .trim();

    const cleanArtist = (artist || '')
      .replace(/VEVO|Official|Music|Channel|Kanal|Netd/gi, '')
      .replace(/[-–—].*$/, '')
      .trim();

    const encodedTitle = encodeURIComponent(cleanTitle);
    const encodedArtist = encodeURIComponent(cleanArtist);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // 1. Try exact search on LRCLIB
    let url = `https://lrclib.net/api/get?track_name=${encodedTitle}`;
    if (cleanArtist) {
      url += `&artist_name=${encodedArtist}`;
    }

    let res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && (data.syncedLyrics || data.plainLyrics)) {
        return {
          plainLyrics: data.plainLyrics || '',
          syncedLyrics: data.syncedLyrics || '',
          parsedLines: data.syncedLyrics ? parseLrcLyrics(data.syncedLyrics) : [],
          source: 'LRCLIB'
        };
      }
    }

    // 2. Fallback: search query endpoint
    const searchRes = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`)}`
    );
    if (searchRes.ok) {
      const list = await searchRes.json();
      if (Array.isArray(list) && list.length > 0) {
        const best = list[0];
        return {
          plainLyrics: best.plainLyrics || '',
          syncedLyrics: best.syncedLyrics || '',
          parsedLines: best.syncedLyrics ? parseLrcLyrics(best.syncedLyrics) : [],
          source: 'LRCLIB'
        };
      }
    }

    return null;
  } catch (err) {
    console.warn('[Lyrics] Fetch error:', err.message);
    return null;
  }
}
