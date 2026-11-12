// lyricsService.js - Fetches real-time song lyrics via LRCLIB open API
export async function fetchLyrics(title, artist) {
  if (!title) return null;

  try {
    // Clean up title (remove 'Official Video', feat, remix tags for higher match rate)
    const cleanTitle = title
      .replace(/(\(|\[).*?(official|video|audio|clip|hq|hd|4k|lyrics|remix|feat|ft).*?(\)|\])/gi, '')
      .replace(/[-–—].*$/, '')
      .trim();

    const cleanArtist = (artist || '')
      .replace(/VEVO|Official|Music|Channel/gi, '')
      .replace(/[-–—].*$/, '')
      .trim();

    const encodedTitle = encodeURIComponent(cleanTitle);
    const encodedArtist = encodeURIComponent(cleanArtist);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // Try exact search
    let url = `https://lrclib.net/api/get?track_name=${encodedTitle}`;
    if (cleanArtist) {
      url += `&artist_name=${encodedArtist}`;
    }

    let res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && (data.plainLyrics || data.syncedLyrics)) {
        return {
          plainLyrics: data.plainLyrics || '',
          syncedLyrics: data.syncedLyrics || '',
          source: 'LRCLIB'
        };
      }
    }

    // Fallback: search query endpoint
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
