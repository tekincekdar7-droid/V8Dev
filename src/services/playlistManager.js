// playlistManager.js - Persistent custom user playlists with AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYLISTS_STORAGE_KEY = '@soundwave_custom_playlists_v1';

const DEFAULT_PLAYLISTS = [
  {
    id: 'pl_favorites',
    name: 'Favori Parçalarım',
    description: 'En sevdiğin müzikler',
    color: '#FF0000',
    icon: 'heart',
    tracks: [],
    createdAt: Date.now()
  },
  {
    id: 'pl_drive',
    name: 'Gece Sürüşü',
    description: 'Yolda dinlemek için özel seçimler',
    color: '#3F51B5',
    icon: 'car-sport',
    tracks: [],
    createdAt: Date.now()
  }
];

export async function getCustomPlaylists() {
  try {
    const raw = await AsyncStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(DEFAULT_PLAYLISTS));
      return DEFAULT_PLAYLISTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[PlaylistManager] Failed to get playlists:', err);
    return DEFAULT_PLAYLISTS;
  }
}

export async function createPlaylist(name, description = '', icon = 'musical-notes') {
  if (!name || !name.trim()) return null;
  try {
    const playlists = await getCustomPlaylists();
    const newPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      description: description.trim(),
      icon: icon || 'musical-notes',
      color: getRandomPlaylistColor(),
      tracks: [],
      createdAt: Date.now()
    };

    playlists.unshift(newPlaylist);
    await AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    return newPlaylist;
  } catch (err) {
    console.warn('[PlaylistManager] Failed to create playlist:', err);
    return null;
  }
}

export async function addTrackToPlaylist(playlistId, track) {
  if (!playlistId || !track || !track.id) return false;
  try {
    const playlists = await getCustomPlaylists();
    const idx = playlists.findIndex(p => p.id === playlistId);
    if (idx === -1) return false;

    // Check if already in playlist
    const exists = playlists[idx].tracks.some(t => t.id === track.id);
    if (!exists) {
      playlists[idx].tracks.push({
        id: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        duration: track.duration,
        durationFormatted: track.durationFormatted
      });
      await AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    }
    return true;
  } catch (err) {
    console.warn('[PlaylistManager] Failed to add track:', err);
    return false;
  }
}

export async function removeTrackFromPlaylist(playlistId, trackId) {
  if (!playlistId || !trackId) return false;
  try {
    const playlists = await getCustomPlaylists();
    const idx = playlists.findIndex(p => p.id === playlistId);
    if (idx === -1) return false;

    playlists[idx].tracks = playlists[idx].tracks.filter(t => t.id !== trackId);
    await AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
    return true;
  } catch (err) {
    console.warn('[PlaylistManager] Failed to remove track:', err);
    return false;
  }
}

export async function deletePlaylist(playlistId) {
  if (!playlistId) return false;
  try {
    const playlists = await getCustomPlaylists();
    const filtered = playlists.filter(p => p.id !== playlistId);
    await AsyncStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.warn('[PlaylistManager] Failed to delete playlist:', err);
    return false;
  }
}

function getRandomPlaylistColor() {
  const colors = ['#E50914', '#FF5722', '#9C27B0', '#2196F3', '#009688', '#4CAF50', '#FF9800', '#673AB7'];
  return colors[Math.floor(Math.random() * colors.length)];
}
