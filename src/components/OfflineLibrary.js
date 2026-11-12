// OfflineLibrary.js - YouTube Music Library: Downloads, Favorites & Custom Playlists
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TrackCard from './TrackCard';
import { getDownloadedTracks, deleteDownloadedTrack } from '../services/downloadManager';
import { getFavorites } from '../services/favoritesManager';
import {
  getCustomPlaylists,
  createPlaylist,
  deletePlaylist,
  removeTrackFromPlaylist
} from '../services/playlistManager';
import { usePlayer } from '../services/playerContext';
import { ALL_CATALOG_TRACKS } from '../services/musicApi';

export default function OfflineLibrary() {
  const [subTab, setSubTab] = useState('downloads'); // 'downloads' | 'favorites' | 'playlists'
  const [downloadedTracks, setDownloadedTracks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [customPlaylists, setCustomPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');

  const { playTrack } = usePlayer();

  const loadData = async () => {
    try {
      setLoading(true);
      const [downloadsList, favsList, playlistsList] = await Promise.all([
        getDownloadedTracks(),
        getFavorites(),
        getCustomPlaylists()
      ]);
      setDownloadedTracks(downloadsList);
      setFavorites(favsList);
      setCustomPlaylists(playlistsList);

      // Keep selected playlist updated if active
      if (selectedPlaylist) {
        const found = playlistsList.find(p => p.id === selectedPlaylist.id);
        setSelectedPlaylist(found || null);
      }
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab]);

  const handleDelete = (trackId) => {
    Alert.alert(
      'Şarkıyı Sil',
      'Bu şarkıyı telefonundan silmek istiyor musun?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const updated = await deleteDownloadedTrack(trackId);
            setDownloadedTracks(updated);
          }
        }
      ]
    );
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen bir çalma listesi adı yazın.');
      return;
    }
    const created = await createPlaylist(newPlaylistTitle.trim());
    if (created) {
      setNewPlaylistTitle('');
      setShowCreateInput(false);
      await loadData();
    }
  };

  const handleDeletePlaylist = (playlistId, name) => {
    Alert.alert(
      'Listeyi Sil',
      `"${name}" çalma listesini silmek istediğine emin misin?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(playlistId);
            setSelectedPlaylist(null);
            await loadData();
          }
        }
      ]
    );
  };

  const handleRemoveTrackFromPl = async (trackId) => {
    if (!selectedPlaylist) return;
    await removeTrackFromPlaylist(selectedPlaylist.id, trackId);
    await loadData();
  };

  const currentList = subTab === 'downloads' ? downloadedTracks : favorites;
  const filtered = currentList.filter(t => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q);
  });

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Kitaplık</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <Ionicons name="refresh" size={20} color="#FF0000" />
        </TouchableOpacity>
      </View>

      {/* Sub Tabs: İndirilenler, Beğenilenler & Çalma Listelerim */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'downloads' && styles.activeSubTabBtn]}
          onPress={() => {
            setSubTab('downloads');
            setSelectedPlaylist(null);
          }}
        >
          <Ionicons
            name="cloud-download"
            size={15}
            color={subTab === 'downloads' ? '#FF0000' : '#888888'}
          />
          <Text style={[styles.subTabText, subTab === 'downloads' && styles.activeSubTabText]}>
            İndirilenler ({downloadedTracks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'favorites' && styles.activeSubTabBtn]}
          onPress={() => {
            setSubTab('favorites');
            setSelectedPlaylist(null);
          }}
        >
          <Ionicons
            name="heart"
            size={15}
            color={subTab === 'favorites' ? '#FF0000' : '#888888'}
          />
          <Text style={[styles.subTabText, subTab === 'favorites' && styles.activeSubTabText]}>
            Beğenilenler ({favorites.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'playlists' && styles.activeSubTabBtn]}
          onPress={() => setSubTab('playlists')}
        >
          <Ionicons
            name="folder"
            size={15}
            color={subTab === 'playlists' ? '#FF0000' : '#888888'}
          />
          <Text style={[styles.subTabText, subTab === 'playlists' && styles.activeSubTabText]}>
            Listelerim ({customPlaylists.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* PLAYLISTS SUBTAB CONTENT */}
      {subTab === 'playlists' ? (
        selectedPlaylist ? (
          /* Single Playlist View */
          <View style={{ flex: 1 }}>
            {/* Playlist Hero Header */}
            <View style={styles.playlistDetailHeader}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setSelectedPlaylist(null)}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                <Text style={styles.backBtnText}>Tüm Listeler</Text>
              </TouchableOpacity>

              <View style={styles.playlistHeroRow}>
                <View style={[styles.heroIconBox, { backgroundColor: selectedPlaylist.color || '#E50914' }]}>
                  <Ionicons name={selectedPlaylist.icon || "musical-notes"} size={32} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.heroPlaylistName}>{selectedPlaylist.name}</Text>
                  <Text style={styles.heroPlaylistMeta}>
                    {selectedPlaylist.tracks?.length || 0} şarkı • Özel Liste
                  </Text>
                  {selectedPlaylist.tracks?.length > 0 && (
                    <TouchableOpacity
                      style={styles.playAllBtn}
                      onPress={() => playTrack(selectedPlaylist.tracks[0], selectedPlaylist.tracks)}
                    >
                      <Ionicons name="play" size={16} color="#FFFFFF" />
                      <Text style={styles.playAllBtnText}>Tümünü Çal</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleDeletePlaylist(selectedPlaylist.id, selectedPlaylist.name)}
                  style={styles.trashPlaylistBtn}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tracks in Playlist */}
            {selectedPlaylist.tracks?.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={44} color="#666666" />
                <Text style={styles.emptyTitle}>Bu Liste Henüz Boş</Text>
                <Text style={styles.emptyDesc}>
                  Şarkı çalarken veya arama sonuçlarında '+' simgesine basarak bu listeye parça ekleyebilirsin.
                </Text>
              </View>
            ) : (
              <FlatList
                data={selectedPlaylist.tracks}
                keyExtractor={(item, index) => `pl-track-${item.id}-${index}`}
                renderItem={({ item, index }) => (
                  <TrackCard
                    track={item}
                    rank={index + 1}
                    onSelect={(track) => playTrack(track, selectedPlaylist.tracks)}
                    onDelete={handleRemoveTrackFromPl}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        ) : (
          /* List of Playlists View */
          <View style={{ flex: 1 }}>
            {/* Create New Playlist Button & Input */}
            {showCreateInput ? (
              <View style={styles.createBox}>
                <TextInput
                  style={styles.createInput}
                  placeholder="Çalma listesi adı (Örn: Gece Sürüşü)..."
                  placeholderTextColor="#666666"
                  value={newPlaylistTitle}
                  onChangeText={setNewPlaylistTitle}
                  autoFocus
                />
                <View style={styles.createActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelCreateBtn}
                    onPress={() => setShowCreateInput(false)}
                  >
                    <Text style={styles.cancelCreateText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmCreateBtn}
                    onPress={handleCreatePlaylist}
                  >
                    <Text style={styles.confirmCreateText}>Oluştur</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.createPlaylistCard}
                onPress={() => setShowCreateInput(true)}
                activeOpacity={0.7}
              >
                <View style={styles.createPlusCircle}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.createPlaylistTitle}>Yeni Çalma Listesi Oluştur</Text>
                  <Text style={styles.createPlaylistSubtitle}>Kendi özel şarkı arşivini derle</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Playlists Grid / Cards */}
            <FlatList
              data={customPlaylists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playlistItemCard}
                  onPress={() => setSelectedPlaylist(item)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.plIconBox, { backgroundColor: item.color || '#E50914' }]}>
                    <Ionicons name={item.icon || "musical-notes"} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.plInfoBox}>
                    <Text style={styles.plName}>{item.name}</Text>
                    <Text style={styles.plTracksCount}>{item.tracks?.length || 0} Şarkı</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#666666" />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )
      ) : (
        /* DOWNLOADS OR FAVORITES SUBTAB CONTENT */
        <>
          {/* Filter / Search within library */}
          {currentList.length > 0 && (
            <View style={styles.searchBox}>
              <Ionicons name="search" size={17} color="#666666" style={styles.searchIcon} />
              <TextInput
                placeholder={`${subTab === 'downloads' ? 'İndirilenlerde' : 'Beğenilenlerde'} ara...`}
                placeholderTextColor="#666666"
                value={filterQuery}
                onChangeText={setFilterQuery}
                style={styles.searchInput}
              />
              {filterQuery ? (
                <TouchableOpacity onPress={() => setFilterQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#666666" />
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#FF0000" />
            </View>
          ) : currentList.length === 0 ? (
            <FlatList
              data={ALL_CATALOG_TRACKS.slice(0, 10)}
              keyExtractor={(item) => `rec-${item.id}`}
              ListHeaderComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons
                      name={subTab === 'downloads' ? 'cloud-download-outline' : 'heart-outline'}
                      size={36}
                      color="#FF0000"
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {subTab === 'downloads' ? 'İndirilen Şarkı Yok' : 'Henüz Beğenilen Şarkı Yok'}
                  </Text>
                  <Text style={styles.emptyDesc}>
                    {subTab === 'downloads'
                      ? 'Şarkıları indirerek internetsiz, uçak modunda bile dinleyebilirsin.'
                      : 'Şarkı çalarken kalp simgesine basarak favorilerine ekleyebilirsin.'}
                  </Text>

                  <View style={styles.recHeaderBox}>
                    <Ionicons name="sparkles" size={14} color="#FF0000" />
                    <Text style={styles.recHeaderText}>ÖNERİLEN POPÜLER ŞARKILAR</Text>
                  </View>
                </View>
              }
              renderItem={({ item }) => (
                <TrackCard
                  track={item}
                  onSelect={(track) => playTrack(track, ALL_CATALOG_TRACKS)}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <TrackCard
                  track={item}
                  rank={index + 1}
                  isDownloaded={subTab === 'downloads'}
                  onSelect={(track) => playTrack(track, filtered)}
                  onDelete={subTab === 'downloads' ? handleDelete : null}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  refreshBtn: {
    padding: 6,
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeSubTabBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeSubTabText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 120,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.25)',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#77777D',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  recHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  recHeaderText: {
    color: '#FF0000',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  createPlaylistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 0, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    marginBottom: 14,
  },
  createPlusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  createPlaylistTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  createPlaylistSubtitle: {
    color: '#9E9EA8',
    fontSize: 12,
    marginTop: 2,
  },
  createBox: {
    backgroundColor: '#16161B',
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  createInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  createActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelCreateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelCreateText: {
    color: '#8E8E93',
    fontWeight: '600',
  },
  confirmCreateBtn: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
  },
  confirmCreateText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  playlistItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  plIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  plInfoBox: {
    flex: 1,
  },
  plName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  plTracksCount: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  playlistDetailHeader: {
    paddingVertical: 10,
    marginBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  playlistHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaylistName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  heroPlaylistMeta: {
    color: '#8E8E93',
    fontSize: 12,
    marginVertical: 4,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF0000',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  playAllBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trashPlaylistBtn: {
    padding: 8,
  },
});
