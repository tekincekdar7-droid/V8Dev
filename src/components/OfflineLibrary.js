// OfflineLibrary.js - YouTube Music Library: Downloads & Favorites
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
import { usePlayer } from '../services/playerContext';
import { ALL_CATALOG_TRACKS } from '../services/musicApi';

export default function OfflineLibrary() {
  const [subTab, setSubTab] = useState('downloads'); // 'downloads' | 'favorites'
  const [downloadedTracks, setDownloadedTracks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const { playTrack } = usePlayer();

  const loadData = async () => {
    try {
      setLoading(true);
      const [downloadsList, favsList] = await Promise.all([
        getDownloadedTracks(),
        getFavorites()
      ]);
      setDownloadedTracks(downloadsList);
      setFavorites(favsList);
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

      {/* Sub Tabs: İndirilenler & Beğenilenler */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'downloads' && styles.activeSubTabBtn]}
          onPress={() => setSubTab('downloads')}
        >
          <Ionicons
            name="cloud-download"
            size={16}
            color={subTab === 'downloads' ? '#FF0000' : '#888888'}
          />
          <Text style={[styles.subTabText, subTab === 'downloads' && styles.activeSubTabText]}>
            İndirilenler ({downloadedTracks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'favorites' && styles.activeSubTabBtn]}
          onPress={() => setSubTab('favorites')}
        >
          <Ionicons
            name="heart"
            size={16}
            color={subTab === 'favorites' ? '#FF0000' : '#888888'}
          />
          <Text style={[styles.subTabText, subTab === 'favorites' && styles.activeSubTabText]}>
            Beğenilenler ({favorites.length})
          </Text>
        </TouchableOpacity>
      </View>

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
          renderItem={({ item }) => (
            <TrackCard
              track={item}
              isDownloaded={subTab === 'downloads'}
              onSelect={(track) => playTrack(track, filtered)}
              onDelete={subTab === 'downloads' ? handleDelete : null}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030303',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1C1C1C',
  },
  subTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  subTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161616',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#262626',
  },
  activeSubTabBtn: {
    backgroundColor: '#261212',
    borderColor: '#FF0000',
  },
  subTabText: {
    color: '#888888',
    fontSize: 13,
    fontWeight: '600',
  },
  activeSubTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262626',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyDesc: {
    color: '#777777',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  recHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222222',
    width: '100%',
  },
  recHeaderText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
