// favoritesManager.js - Manages Liked / Favorited songs
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@yt_music_favorites_v1';

export async function getFavorites() {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[Favorites] Get error:', e);
    return [];
  }
}

export async function isFavorite(trackId) {
  const list = await getFavorites();
  return list.some(item => item.id === trackId);
}

export async function toggleFavorite(track) {
  if (!track || !track.id) return false;
  try {
    const current = await getFavorites();
    const exists = current.some(item => item.id === track.id);
    let updated = [];

    if (exists) {
      updated = current.filter(item => item.id !== track.id);
    } else {
      updated = [{ ...track, favoritedAt: Date.now() }, ...current];
    }

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return !exists;
  } catch (e) {
    console.error('[Favorites] Toggle error:', e);
    return false;
  }
}
