// musicApi.js - Live YouTube Music search, instant stream resolution & curated feeds
const INVIDIOUS_INSTANCES = [
  'https://yt.chocolatemoo53.com',
  'https://inv.vern.cc',
  'https://invidious.jing.rocks'
];

export function parseDurationToSeconds(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const parts = durationStr.split(':').map(p => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] || 0;
}

export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 1. Direct Live YouTube Web Search (Real-time YouTube index, zero delays)
async function searchDirectYouTube(query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  const encoded = encodeURIComponent(query.trim());
  const url = `https://www.youtube.com/results?search_query=${encoded}`;

  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    }
  });
  clearTimeout(timeoutId);

  if (!response.ok) throw new Error(`YouTube HTTP ${response.status}`);
  const html = await response.text();

  const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
  if (!match) throw new Error('ytInitialData pattern not found');

  const json = JSON.parse(match[1]);
  const sections = json?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ||
                   json?.contents?.sectionListRenderer?.contents;
  if (!Array.isArray(sections)) throw new Error('No sectionListRenderer in search data');

  const tracks = [];
  for (const section of sections) {
    const items = section?.itemSectionRenderer?.contents;
    if (Array.isArray(items)) {
      for (const item of items) {
        const v = item?.videoRenderer;
        if (v && v.videoId) {
          const rawTitle = v.title?.runs?.[0]?.text || v.title?.simpleText || 'Şarkı';
          const author = v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || 'Sanatçı';
          const durationStr = v.lengthText?.simpleText || '3:30';
          const viewCount = v.viewCountText?.simpleText || v.shortViewCountText?.simpleText || '';

          // Clean up titles nicely
          let cleanTitle = rawTitle.replace(/(\(|\[)(Official|Audio|Video|Clip|HQ|HD|4K|Lyrics|Klip|Netd|Orijinal).+?(\)|\])/gi, '').trim();
          if (!cleanTitle) cleanTitle = rawTitle;

          tracks.push({
            id: v.videoId,
            title: cleanTitle,
            rawTitle: rawTitle,
            artist: author,
            duration: parseDurationToSeconds(durationStr),
            durationFormatted: durationStr,
            thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            viewCountText: viewCount,
          });
        }
      }
    }
  }

  if (tracks.length === 0) throw new Error('No video items found in YouTube response');
  return tracks;
}

// 2. Invidious API Search Fallback
async function searchInvidious(query) {
  const encoded = encodeURIComponent(query.trim());
  let lastErr = null;

  for (const baseUrl of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${baseUrl}/api/v1/search?q=${encoded}&type=video`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SoundWaveMusic/1.0'
        }
      });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      return data
        .filter(item => item && item.type === 'video' && item.videoId)
        .map(item => {
          let cleanTitle = item.title || 'Bilinmeyen Şarkı';
          cleanTitle = cleanTitle.replace(/(\(|\[)(Official|Audio|Video|Clip|HQ|HD|4K|Lyrics|Klip).+?(\)|\])/gi, '').trim();
          return {
            id: item.videoId,
            title: cleanTitle || item.title,
            rawTitle: item.title,
            artist: item.author || 'Bilinmeyen Sanatçı',
            duration: item.lengthSeconds || 0,
            durationFormatted: formatDuration(item.lengthSeconds),
            thumbnail: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
            viewCountText: item.viewCountText || ''
          };
        });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All Invidious instances failed');
}

// Live YouTube Auto-complete suggestions
export async function getSearchSuggestions(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const encoded = encodeURIComponent(query.trim());
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encoded}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[1]) ? data[1].slice(0, 6) : [];
  } catch (e) {
    return [];
  }
}

// Master Search Function (Live YouTube Real-Time Racing)
export async function searchMusic(query) {
  if (!query || !query.trim()) return [];

  // Race direct YouTube & Invidious for max reliability & sub-second speed
  try {
    const results = await Promise.any([
      searchDirectYouTube(query),
      searchInvidious(query)
    ]);
    if (Array.isArray(results) && results.length > 0) {
      return results;
    }
  } catch (err) {
    console.warn('[MusicApi] Live search race warning:', err);
  }

  // Secondary single attempt if race rejected
  try {
    const directResults = await searchDirectYouTube(query);
    if (directResults && directResults.length > 0) return directResults;
  } catch (e) {}

  try {
    const invResults = await searchInvidious(query);
    if (invResults && invResults.length > 0) return invResults;
  } catch (e) {}

  // Last-resort catalog filter only if offline/network failure
  const lower = query.toLowerCase();
  const fallbackMatches = ALL_CATALOG_TRACKS.filter(t =>
    t.title.toLowerCase().includes(lower) || t.artist.toLowerCase().includes(lower)
  );
  return fallbackMatches;
}

export async function getAudioStreamUrl(videoId) {
  if (!videoId) throw new Error('Video ID is required');

  for (const baseUrl of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${baseUrl}/api/v1/videos/${videoId}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const data = await res.json();

      if (!data || !data.adaptiveFormats) continue;
      const audioFormats = data.adaptiveFormats.filter(
        f => f.type && (f.type.startsWith('audio/mp4') || f.container === 'm4a')
      );
      const selected = audioFormats.find(f => f.audioQuality === 'AUDIO_QUALITY_MEDIUM') || audioFormats[0];
      if (selected && selected.url) {
        return {
          streamUrl: selected.url,
          container: selected.container || 'm4a',
          bitrate: selected.bitrate,
          title: data.title,
          artist: data.author,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        };
      }
    } catch (e) {}
  }
  throw new Error('No playable direct stream available');
}

// 1. Popular Artists with Avatars (YouTube Music Style)
export const TOP_ARTISTS = [
  { id: 'a1', name: 'Tarkan', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop', query: 'Tarkan' },
  { id: 'a2', name: 'The Weeknd', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop', query: 'The Weeknd' },
  { id: 'a3', name: 'Simge', image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=200&h=200&fit=crop', query: 'Simge Sağın' },
  { id: 'a4', name: 'Semicenk', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop', query: 'Semicenk' },
  { id: 'a5', name: 'Mabel Matiz', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&h=200&fit=crop', query: 'Mabel Matiz' },
  { id: 'a6', name: 'Billie Eilish', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop', query: 'Billie Eilish' },
  { id: 'a7', name: 'Coldplay', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&h=200&fit=crop', query: 'Coldplay' },
  { id: 'a8', name: 'Dua Lipa', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop', query: 'Dua Lipa' },
  { id: 'a9', name: 'Eminem', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&h=200&fit=crop', query: 'Eminem' },
  { id: 'a10', name: 'Imagine Dragons', image: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=200&h=200&fit=crop', query: 'Imagine Dragons' },
  { id: 'a11', name: 'Motive', image: 'https://images.unsplash.com/photo-1520523839898-5071282543e2?w=200&h=200&fit=crop', query: 'Motive Rap' },
  { id: 'a12', name: 'Sezen Aksu', image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=200&h=200&fit=crop', query: 'Sezen Aksu' }
];

// 2. Curated Playlists / Mixes
export const CURATED_MIXES = [
  {
    id: 'm1',
    title: 'Süper Karışık',
    subtitle: 'Sana özel • 50+ Parça',
    tag: 'SANA ÖZEL',
    query: 'The Weeknd Tarkan Coldplay Hits',
    color: '#E50914',
    icon: 'shuffle'
  },
  {
    id: 'm2',
    title: 'Türkçe Pop Zirve',
    subtitle: 'Mabel Matiz, Simge, Tarkan, Semicenk...',
    tag: 'TÜRKİYE TOP',
    query: 'Türkçe Pop 2026',
    color: '#FF4500',
    icon: 'flame'
  },
  {
    id: 'm3',
    title: 'Türkçe Rap & Trap',
    subtitle: 'Motive, UZI, Lvbel C5, Blok3, Ezhel...',
    tag: 'TREND',
    query: 'Türkçe Rap 2026',
    color: '#1DB954',
    icon: 'headset'
  },
  {
    id: 'm4',
    title: 'Global Billboard Hits',
    subtitle: 'The Weeknd, Dua Lipa, Bruno Mars...',
    tag: 'GLOBAL',
    query: 'Billboard Hot 100 Hits',
    color: '#2979FF',
    icon: 'globe'
  },
  {
    id: 'm5',
    title: 'Gece Modu & Lo-Fi',
    subtitle: 'Sakin vuruşlar, gece yolculuğu, ders...',
    tag: 'RAHATLAMA',
    query: 'Lofi Chill Beats Night',
    color: '#7C4DFF',
    icon: 'moon'
  },
  {
    id: 'm6',
    title: 'Workout & Fitness Gücü',
    subtitle: 'Yüksek tempo, EDM & Bass motivasyon...',
    tag: 'ANTRENMAN',
    query: 'Gym Motivation EDM Bass Workout',
    color: '#FF1744',
    icon: 'fitness'
  },
  {
    id: 'm7',
    title: 'Akustik & Sakin Kahve',
    subtitle: 'Gitar, piyano ve duru vokaller...',
    tag: 'HUZUR',
    query: 'Akustik Türkçe Pop Slow',
    color: '#FF9100',
    icon: 'cafe'
  },
  {
    id: 'm8',
    title: '90\'lar & 2000\'ler Efsaneler',
    subtitle: 'Unutulmayan nostaljik şaheserler...',
    tag: 'NOSTALJİ',
    query: '90lar Türkçe Pop Klasikler',
    color: '#00E5FF',
    icon: 'time'
  }
];

// 3. Quick Picks (Hızlı Seçimler - 6 Parça)
export const QUICK_PICKS_TRACKS = [
  {
    id: 'cpp69ghR1IM',
    title: 'Şımarık (Kiss Kiss)',
    artist: 'Tarkan',
    duration: 191,
    durationFormatted: '3:11',
    thumbnail: 'https://i.ytimg.com/vi/cpp69ghR1IM/hqdefault.jpg',
    rank: 1,
    views: '120M dinlenme'
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    duration: 200,
    durationFormatted: '3:20',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    rank: 2,
    views: '4.2Milyar dinlenme'
  },
  {
    id: 'yKNxeF4KMsY',
    title: 'Yellow',
    artist: 'Coldplay',
    duration: 269,
    durationFormatted: '4:29',
    thumbnail: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg',
    rank: 3,
    views: '1.1Milyar dinlenme'
  },
  {
    id: '5NV6Rdv1a3I',
    title: 'Get Lucky',
    artist: 'Daft Punk ft. Pharrell',
    duration: 248,
    durationFormatted: '4:08',
    thumbnail: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
    rank: 4,
    views: '890M dinlenme'
  },
  {
    id: 'XbGs_qK2PQA',
    title: 'Lose Yourself',
    artist: 'Eminem',
    duration: 326,
    durationFormatted: '5:26',
    thumbnail: 'https://i.ytimg.com/vi/XbGs_qK2PQA/hqdefault.jpg',
    rank: 5,
    views: '1.5Milyar dinlenme'
  },
  {
    id: 'i04G45D6zoc',
    title: 'Aşkın Olayım',
    artist: 'Simge',
    duration: 254,
    durationFormatted: '4:14',
    thumbnail: 'https://i.ytimg.com/vi/i04G45D6zoc/hqdefault.jpg',
    rank: 6,
    views: '210M dinlenme'
  }
];

// 4. "Tekrar Dinle" (Listen Again Carousel)
export const LISTEN_AGAIN_TRACKS = [
  {
    id: 'NAHRpEqgcL4',
    title: 'Kuzu Kuzu',
    artist: 'Tarkan',
    duration: 234,
    durationFormatted: '3:54',
    thumbnail: 'https://i.ytimg.com/vi/NAHRpEqgcL4/hqdefault.jpg',
    badge: 'Sık Dinlenen'
  },
  {
    id: 'kXYiU_JCYtU',
    title: 'Numb',
    artist: 'Linkin Park',
    duration: 187,
    durationFormatted: '3:07',
    thumbnail: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg',
    badge: 'Rock Efsane'
  },
  {
    id: '7wtfhZwyrcc',
    title: 'Believer',
    artist: 'Imagine Dragons',
    duration: 204,
    durationFormatted: '3:24',
    thumbnail: 'https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg',
    badge: 'Enerji'
  },
  {
    id: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    duration: 233,
    durationFormatted: '3:53',
    thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    badge: 'Hit'
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    duration: 359,
    durationFormatted: '5:59',
    thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    badge: 'Klasik'
  },
  {
    id: 'hT_nvWreIhg',
    title: 'Counting Stars',
    artist: 'OneRepublic',
    duration: 257,
    durationFormatted: '4:17',
    thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
    badge: 'Pop Rock'
  }
];

// 5. "Yeni Çıkanlar & Trendler" (New & Trending Widescreen Carousel)
export const NEW_RELEASES_TRACKS = [
  {
    id: 'DkWkX3P0w-0',
    title: 'Yana Yana',
    artist: 'Semicenk & Reynmen',
    duration: 182,
    durationFormatted: '3:02',
    thumbnail: 'https://i.ytimg.com/vi/DkWkX3P0w-0/hqdefault.jpg',
    badge: '🔥 Trend #1'
  },
  {
    id: 'yJg-Y5byMMw',
    title: 'Antidepresan',
    artist: 'Mabel Matiz & Mert Demir',
    duration: 215,
    durationFormatted: '3:35',
    thumbnail: 'https://i.ytimg.com/vi/yJg-Y5byMMw/hqdefault.jpg',
    badge: '🔥 Zirvede'
  },
  {
    id: 'cfi8gBd-VaM',
    title: 'Dudu',
    artist: 'Tarkan',
    duration: 275,
    durationFormatted: '4:35',
    thumbnail: 'https://i.ytimg.com/vi/cfi8gBd-VaM/hqdefault.jpg',
    badge: 'Efsane'
  },
  {
    id: 'OPf0YbXqDm0',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    duration: 270,
    durationFormatted: '4:30',
    thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg',
    badge: 'Parti'
  },
  {
    id: 'LsoLEjrDogU',
    title: 'Chandelier',
    artist: 'Sia',
    duration: 231,
    durationFormatted: '3:51',
    thumbnail: 'https://i.ytimg.com/vi/LsoLEjrDogU/hqdefault.jpg',
    badge: 'Güçlü Vokal'
  },
  {
    id: 'RgKAFK5djSk',
    title: 'See You Again',
    artist: 'Wiz Khalifa ft. Charlie Puth',
    duration: 237,
    durationFormatted: '3:57',
    thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/hqdefault.jpg',
    badge: 'Duygusal'
  }
];

// 6. Top 10 Charts (Number Ranking List)
export const INSTANT_TRENDING_TRACKS = [
  {
    id: 'cpp69ghR1IM',
    title: 'Şımarık (Kiss Kiss)',
    artist: 'Tarkan',
    duration: 191,
    durationFormatted: '3:11',
    thumbnail: 'https://i.ytimg.com/vi/cpp69ghR1IM/hqdefault.jpg',
    rank: 1,
    views: '120M dinlenme'
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    duration: 200,
    durationFormatted: '3:20',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    rank: 2,
    views: '4.2Milyar dinlenme'
  },
  {
    id: 'i04G45D6zoc',
    title: 'Aşkın Olayım',
    artist: 'Simge',
    duration: 254,
    durationFormatted: '4:14',
    thumbnail: 'https://i.ytimg.com/vi/i04G45D6zoc/hqdefault.jpg',
    rank: 3,
    views: '210M dinlenme'
  },
  {
    id: 'yKNxeF4KMsY',
    title: 'Yellow',
    artist: 'Coldplay',
    duration: 269,
    durationFormatted: '4:29',
    thumbnail: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg',
    rank: 4,
    views: '1.1Milyar dinlenme'
  },
  {
    id: 'yJg-Y5byMMw',
    title: 'Antidepresan',
    artist: 'Mabel Matiz & Mert Demir',
    duration: 215,
    durationFormatted: '3:35',
    thumbnail: 'https://i.ytimg.com/vi/yJg-Y5byMMw/hqdefault.jpg',
    rank: 5,
    views: '180M dinlenme'
  },
  {
    id: '5NV6Rdv1a3I',
    title: 'Get Lucky',
    artist: 'Daft Punk ft. Pharrell',
    duration: 248,
    durationFormatted: '4:08',
    thumbnail: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
    rank: 6,
    views: '890M dinlenme'
  },
  {
    id: 'XbGs_qK2PQA',
    title: 'Lose Yourself',
    artist: 'Eminem',
    duration: 326,
    durationFormatted: '5:26',
    thumbnail: 'https://i.ytimg.com/vi/XbGs_qK2PQA/hqdefault.jpg',
    rank: 7,
    views: '1.5Milyar dinlenme'
  },
  {
    id: 'DkWkX3P0w-0',
    title: 'Yana Yana',
    artist: 'Semicenk & Reynmen',
    duration: 182,
    durationFormatted: '3:02',
    thumbnail: 'https://i.ytimg.com/vi/DkWkX3P0w-0/hqdefault.jpg',
    rank: 8,
    views: '165M dinlenme'
  },
  {
    id: 'kXYiU_JCYtU',
    title: 'Numb',
    artist: 'Linkin Park',
    duration: 187,
    durationFormatted: '3:07',
    thumbnail: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg',
    rank: 9,
    views: '2.4Milyar dinlenme'
  },
  {
    id: '7wtfhZwyrcc',
    title: 'Believer',
    artist: 'Imagine Dragons',
    duration: 204,
    durationFormatted: '3:24',
    thumbnail: 'https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg',
    rank: 10,
    views: '2.6Milyar dinlenme'
  }
];

// 7. Thematic Shelves for Rich Deep Feed
export const THEMATIC_SECTIONS = {
  turkishPop: {
    title: 'Türkçe Pop Zirvesi',
    subtitle: 'EN ÇOK DİNLENEN YERLİ HİTLER',
    tracks: [
      { id: 'cpp69ghR1IM', title: 'Şımarık (Kiss Kiss)', artist: 'Tarkan', duration: 191, durationFormatted: '3:11', thumbnail: 'https://i.ytimg.com/vi/cpp69ghR1IM/hqdefault.jpg', badge: 'Efsane' },
      { id: 'i04G45D6zoc', title: 'Aşkın Olayım', artist: 'Simge', duration: 254, durationFormatted: '4:14', thumbnail: 'https://i.ytimg.com/vi/i04G45D6zoc/hqdefault.jpg', badge: 'Zirvede' },
      { id: 'yJg-Y5byMMw', title: 'Antidepresan', artist: 'Mabel Matiz & Mert Demir', duration: 215, durationFormatted: '3:35', thumbnail: 'https://i.ytimg.com/vi/yJg-Y5byMMw/hqdefault.jpg', badge: 'Hit' },
      { id: 'DkWkX3P0w-0', title: 'Yana Yana', artist: 'Semicenk & Reynmen', duration: 182, durationFormatted: '3:02', thumbnail: 'https://i.ytimg.com/vi/DkWkX3P0w-0/hqdefault.jpg', badge: 'Trend #1' },
      { id: 'NAHRpEqgcL4', title: 'Kuzu Kuzu', artist: 'Tarkan', duration: 234, durationFormatted: '3:54', thumbnail: 'https://i.ytimg.com/vi/NAHRpEqgcL4/hqdefault.jpg', badge: 'Klasik' },
      { id: 'cfi8gBd-VaM', title: 'Dudu', artist: 'Tarkan', duration: 275, durationFormatted: '4:35', thumbnail: 'https://i.ytimg.com/vi/cfi8gBd-VaM/hqdefault.jpg', badge: 'Popüler' },
      { id: 'WcIcVapfqXw', title: 'Baksana Talihe', artist: 'Göksel', duration: 202, durationFormatted: '3:22', thumbnail: 'https://i.ytimg.com/vi/WcIcVapfqXw/hqdefault.jpg', badge: 'Nostalji' }
    ]
  },
  globalHits: {
    title: 'Global Billboard Hits',
    subtitle: 'DÜNYANIN EN ÇOK DİNLENENLERİ',
    tracks: [
      { id: '4NRXx6U8ABQ', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200, durationFormatted: '3:20', thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg', badge: '#1 Global' },
      { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', duration: 233, durationFormatted: '3:53', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg', badge: '6Milyar+' },
      { id: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Bruno Mars', duration: 270, durationFormatted: '4:30', thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg', badge: 'Dans' },
      { id: '5NV6Rdv1a3I', title: 'Get Lucky', artist: 'Daft Punk', duration: 248, durationFormatted: '4:08', thumbnail: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg', badge: 'Elektronik' },
      { id: '7wtfhZwyrcc', title: 'Believer', artist: 'Imagine Dragons', duration: 204, durationFormatted: '3:24', thumbnail: 'https://i.ytimg.com/vi/7wtfhZwyrcc/hqdefault.jpg', badge: 'Güç' },
      { id: 'yKNxeF4KMsY', title: 'Yellow', artist: 'Coldplay', duration: 269, durationFormatted: '4:29', thumbnail: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg', badge: 'Klasik' },
      { id: 'hT_nvWreIhg', title: 'Counting Stars', artist: 'OneRepublic', duration: 257, durationFormatted: '4:17', thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg', badge: 'Pop' }
    ]
  },
  rapTrap: {
    title: 'Türkçe Rap & Sokak',
    subtitle: 'AĞIR BASSLAR VE HIZLI FLOWLAR',
    tracks: [
      { id: 'XbGs_qK2PQA', title: 'Lose Yourself', artist: 'Eminem', duration: 326, durationFormatted: '5:26', thumbnail: 'https://i.ytimg.com/vi/XbGs_qK2PQA/hqdefault.jpg', badge: 'Efsane' },
      { id: 'uelHwf8o7_U', title: 'Love The Way You Lie', artist: 'Eminem ft. Rihanna', duration: 266, durationFormatted: '4:26', thumbnail: 'https://i.ytimg.com/vi/uelHwf8o7_U/hqdefault.jpg', badge: 'Zirve' },
      { id: 'r8w2rRz7_k8', title: '10MG', artist: 'Motive', duration: 174, durationFormatted: '2:54', thumbnail: 'https://i.ytimg.com/vi/r8w2rRz7_k8/hqdefault.jpg', badge: 'Trend' },
      { id: 'n3rP99oG5_E', title: 'Cindy', artist: 'UZI', duration: 198, durationFormatted: '3:18', thumbnail: 'https://i.ytimg.com/vi/n3rP99oG5_E/hqdefault.jpg', badge: 'Trap' },
      { id: 'RgKAFK5djSk', title: 'See You Again', artist: 'Wiz Khalifa', duration: 237, durationFormatted: '3:57', thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/hqdefault.jpg', badge: 'Hit' },
      { id: 'kXYiU_JCYtU', title: 'In The End', artist: 'Linkin Park', duration: 216, durationFormatted: '3:36', thumbnail: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg', badge: 'Kült' }
    ]
  },
  chillLofi: {
    title: 'Gece Modu & Lo-Fi Beats',
    subtitle: 'HUZUR, KAHVE VE SAKİN ÇALIŞMA',
    tracks: [
      { id: 'yKNxeF4KMsY', title: 'Yellow (Acoustic)', artist: 'Coldplay', duration: 269, durationFormatted: '4:29', thumbnail: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg', badge: 'Huzur' },
      { id: '2Vv-BfVoq4g', title: 'Perfect', artist: 'Ed Sheeran', duration: 263, durationFormatted: '4:23', thumbnail: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg', badge: 'Romantik' },
      { id: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele', duration: 295, durationFormatted: '4:55', thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg', badge: 'Slow' },
      { id: 'fLexgOxsZu0', title: 'The Lazy Song', artist: 'Bruno Mars', duration: 199, durationFormatted: '3:19', thumbnail: 'https://i.ytimg.com/vi/fLexgOxsZu0/hqdefault.jpg', badge: 'Keyifli' },
      { id: 'LsoLEjrDogU', title: 'Chandelier', artist: 'Sia', duration: 231, durationFormatted: '3:51', thumbnail: 'https://i.ytimg.com/vi/LsoLEjrDogU/hqdefault.jpg', badge: 'Akustik' }
    ]
  }
};

// Master Catalog for Search Fallback
export const ALL_CATALOG_TRACKS = [
  ...QUICK_PICKS_TRACKS,
  ...LISTEN_AGAIN_TRACKS,
  ...NEW_RELEASES_TRACKS,
  ...INSTANT_TRENDING_TRACKS,
  ...THEMATIC_SECTIONS.turkishPop.tracks,
  ...THEMATIC_SECTIONS.globalHits.tracks,
  ...THEMATIC_SECTIONS.rapTrap.tracks,
  ...THEMATIC_SECTIONS.chillLofi.tracks
].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

// 8. Explore Categories (Spotify/YouTube Music Style Visual Tiles)
export const EXPLORE_CATEGORIES = [
  { id: 'c1', title: 'Türkçe Pop', color: '#E91E63', icon: 'musical-notes', query: 'Türkçe Pop 2026' },
  { id: 'c2', title: 'Türkçe Rap & Trap', color: '#FF5722', icon: 'mic', query: 'Türkçe Rap 2026' },
  { id: 'c3', title: 'Global Billboard Hits', color: '#3F51B5', icon: 'globe', query: 'Global Billboard Hits' },
  { id: 'c4', title: 'Rock & Metal', color: '#795548', icon: 'flame', query: 'Rock Efsaneleri' },
  { id: 'c5', title: 'Elektronik & Dans', color: '#009688', icon: 'headset', query: 'EDM Dance Club Hits' },
  { id: 'c6', title: 'Lo-Fi & Çalışma', color: '#673AB7', icon: 'cafe', query: 'Lo-Fi Chill Study Beats' },
  { id: 'c7', title: 'Antrenman & Fitness', color: '#FF9800', icon: 'fitness', query: 'Gym Workout Motivation Music' },
  { id: 'c8', title: 'Gece & Rahatlama', color: '#283593', icon: 'moon', query: 'Deep Chill Relaxation Music' },
  { id: 'c9', title: '90\'lar Nostalji', color: '#D81B60', icon: 'time', query: '90lar Türkçe Pop Klasikler' },
  { id: 'c10', title: 'Akustik & Slow', color: '#8D6E63', icon: 'guitar', query: 'Akustik Şarkılar Türkçe' }
];

export async function getTrendingMusic() {
  try {
    const live = await searchMusic('Tarkan The Weeknd Daft Punk Hits');
    if (live && live.length > 5) {
      return live;
    }
    return INSTANT_TRENDING_TRACKS;
  } catch (e) {
    return INSTANT_TRENDING_TRACKS;
  }
}
