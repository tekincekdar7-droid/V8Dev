// historyManager.js - Tracks play counts and user's most listened tracks
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_STORAGE_KEY = '@soundwave_play_history_v1';

export async function recordTrackPlay(track) {
  if (!track || !track.id) return;
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    let history = raw ? JSON.parse(raw) : {};

    const existing = history[track.id] || {
      id: track.id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      duration: track.duration,
      durationFormatted: track.durationFormatted,
      playCount: 0,
      lastPlayed: 0
    };

    existing.playCount = (existing.playCount || 0) + 1;
    existing.lastPlayed = Date.now();
    // Keep updated title/thumbnail if changed
    existing.title = track.title || existing.title;
    existing.artist = track.artist || existing.artist;
    existing.thumbnail = track.thumbnail || existing.thumbnail;

    history[track.id] = existing;
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn('[HistoryManager] Failed to record play:', err);
  }
}

export async function getMostPlayedTracks(limit = 10) {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const history = JSON.parse(raw);
    const list = Object.values(history);
    // Sort by play count descending, then by lastPlayed
    list.sort((a, b) => (b.playCount - a.playCount) || (b.lastPlayed - a.lastPlayed));
    return list.slice(0, limit);
  } catch (err) {
    console.warn('[HistoryManager] Failed to get most played:', err);
    return [];
  }
}

export async function getRecentlyPlayedTracks(limit = 10) {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const history = JSON.parse(raw);
    const list = Object.values(history);
    list.sort((a, b) => b.lastPlayed - a.lastPlayed);
    return list.slice(0, limit);
  } catch (err) {
    console.warn('[HistoryManager] Failed to get recently played:', err);
    return [];
  }
}
