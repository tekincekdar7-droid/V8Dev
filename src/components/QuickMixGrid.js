// QuickMixGrid.js - Spotify & Apple Music style 6-pack rounded quick shortcuts grid
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../services/playerContext';
import { THEMATIC_SECTIONS, ALL_CATALOG_TRACKS } from '../services/musicApi';

const SHORTCUTS = [
  {
    id: 's1',
    title: 'Türkçe Pop Zirve',
    thumbnail: 'https://i.ytimg.com/vi/cpp69ghR1IM/hqdefault.jpg',
    color: '#FF0055',
    getTracks: () => THEMATIC_SECTIONS.turkishPop.tracks,
  },
  {
    id: 's2',
    title: 'Global Billboard',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    color: '#2979FF',
    getTracks: () => THEMATIC_SECTIONS.globalHits.tracks,
  },
  {
    id: 's3',
    title: 'Gece Lo-Fi Beats',
    thumbnail: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg',
    color: '#7C4DFF',
    getTracks: () => THEMATIC_SECTIONS.chillLofi.tracks,
  },
  {
    id: 's4',
    title: 'Türkçe Rap & Trap',
    thumbnail: 'https://i.ytimg.com/vi/XbGs_qK2PQA/hqdefault.jpg',
    color: '#00E676',
    getTracks: () => THEMATIC_SECTIONS.rapTrap.tracks,
  },
  {
    id: 's5',
    title: 'Süper Karışık',
    thumbnail: 'https://i.ytimg.com/vi/5glDAaCaazc/hqdefault.jpg',
    color: '#FF9100',
    getTracks: () => ALL_CATALOG_TRACKS.slice(0, 10),
  },
  {
    id: 's6',
    title: 'Aşkın Olayım Mix',
    thumbnail: 'https://i.ytimg.com/vi/VREnTCTeS4k/hqdefault.jpg',
    color: '#E040FB',
    getTracks: () => THEMATIC_SECTIONS.turkishPop.tracks,
  },
];

export default function QuickMixGrid() {
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const handleShortcutPress = (item) => {
    const list = item.getTracks();
    if (list && list.length > 0) {
      playTrack(list[0], list);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.subtitle}>TEK DOKUNUŞLA ÇAL</Text>
        <Text style={styles.title}>Hızlı Karışımlar</Text>
      </View>
      <View style={styles.grid}>
        {SHORTCUTS.map((item) => {
          const list = item.getTracks();
          const isThisPlaying = isPlaying && list.some(t => t.id === currentTrack?.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.tile, isThisPlaying && styles.activeTile]}
              activeOpacity={0.8}
              onPress={() => handleShortcutPress(item)}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
              <Text style={styles.tileText} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={[styles.playBadge, isThisPlaying && styles.activePlayBadge]}>
                <Ionicons
                  name={isThisPlaying ? "pause" : "play"}
                  size={12}
                  color={isThisPlaying ? "#FFFFFF" : "#AAAAAA"}
                  style={{ marginLeft: isThisPlaying ? 0 : 1 }}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerBox: {
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  tile: {
    width: '48.5%',
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.11)',
    paddingRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  activeTile: {
    backgroundColor: 'rgba(255, 0, 50, 0.14)',
    borderColor: 'rgba(255, 50, 80, 0.5)',
    shadowColor: '#FF0033',
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  thumb: {
    width: 54,
    height: 54,
    backgroundColor: '#202024',
  },
  tileText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
    marginRight: 4,
    lineHeight: 16,
  },
  playBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePlayBadge: {
    backgroundColor: '#FF0000',
  },
});
