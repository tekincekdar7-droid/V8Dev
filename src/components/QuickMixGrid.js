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
    thumbnail: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
    color: '#FF9100',
    getTracks: () => ALL_CATALOG_TRACKS.slice(0, 10),
  },
  {
    id: 's6',
    title: 'Aşkın Olayım Mix',
    thumbnail: 'https://i.ytimg.com/vi/i04G45D6zoc/hqdefault.jpg',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  tile: {
    width: '48.5%',
    height: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingRight: 8,
  },
  activeTile: {
    backgroundColor: 'rgba(255, 0, 0, 0.12)',
    borderColor: 'rgba(255, 0, 0, 0.4)',
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
