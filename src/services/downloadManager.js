// downloadManager.js - Manages offline music storage & metadata
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAudioStreamUrl } from './musicApi';

const STORAGE_KEY = '@soundwave_downloads_v1';
const MUSIC_DIR = `${FileSystem.documentDirectory}soundwave_music/`;

let isInitialized = false;

async function ensureDirExists() {
  if (isInitialized) return;
  const dirInfo = await FileSystem.getInfoAsync(MUSIC_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(MUSIC_DIR, { intermediates: true });
  }
  isInitialized = true;
}

export async function getDownloadedTracks() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DownloadManager] Error reading downloads:', err);
    return [];
  }
}

export async function isTrackDownloaded(trackId) {
  const tracks = await getDownloadedTracks();
  return tracks.some(t => t.id === trackId);
}

export async function downloadTrack(track, onProgressCallback) {
  try {
    await ensureDirExists();

    // 1. Get direct audio stream
    const streamInfo = await getAudioStreamUrl(track.id);
    const audioUrl = streamInfo.streamUrl;

    const fileExt = streamInfo.container || 'm4a';
    const localAudioPath = `${MUSIC_DIR}${track.id}.${fileExt}`;
    const localThumbPath = `${MUSIC_DIR}${track.id}_thumb.jpg`;

    // 2. Download Audio with progress
    const downloadResumable = FileSystem.createDownloadResumable(
      audioUrl,
      localAudioPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        if (onProgressCallback) {
          onProgressCallback(Math.min(1, Math.max(0, progress)));
        }
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result || !result.uri) {
      throw new Error('İndirme tamamlanamadı.');
    }

    // 3. Cache thumbnail locally for offline display
    let localThumbUri = track.thumbnail;
    try {
      if (track.thumbnail && track.thumbnail.startsWith('http')) {
        const thumbResult = await FileSystem.downloadAsync(track.thumbnail, localThumbPath);
        localThumbUri = thumbResult.uri;
      }
    } catch (e) {
      console.warn('[DownloadManager] Thumbnail download failed, using remote:', e.message);
    }

    // 4. Save metadata to AsyncStorage
    const currentTracks = await getDownloadedTracks();
    const newEntry = {
      ...track,
      localAudioUri: result.uri,
      localThumbnailUri: localThumbUri,
      downloadedAt: Date.now(),
      isOffline: true
    };

    const updated = [newEntry, ...currentTracks.filter(t => t.id !== track.id)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return newEntry;
  } catch (err) {
    console.error('[DownloadManager] Download failed:', err);
    throw err;
  }
}

export async function deleteDownloadedTrack(trackId) {
  try {
    await ensureDirExists();
    const tracks = await getDownloadedTracks();
    const target = tracks.find(t => t.id === trackId);

    if (target) {
      if (target.localAudioUri) {
        await FileSystem.deleteAsync(target.localAudioUri, { idempotent: true });
      }
      if (target.localThumbnailUri && target.localThumbnailUri.startsWith('file://')) {
        await FileSystem.deleteAsync(target.localThumbnailUri, { idempotent: true });
      }
    }

    const remaining = tracks.filter(t => t.id !== trackId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    return remaining;
  } catch (err) {
    console.error('[DownloadManager] Delete failed:', err);
    throw err;
  }
}
