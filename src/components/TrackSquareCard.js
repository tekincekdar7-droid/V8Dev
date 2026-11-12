// TrackSquareCard.js - YouTube Music style square box card for grids and shelves
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../services/playerContext';

export default function TrackSquareCard({
  track,
  onSelect,
  rank,
  cardWidth,
  showEqualizer = true
}) {
  const { currentTrack, isPlaying } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;

  const thumbnailUri = track.localThumbnailUri || track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;

  return (
    <TouchableOpacity
      style={[styles.container, cardWidth ? { width: cardWidth } : styles.gridWidth]}
      activeOpacity={0.8}
      onPress={() => onSelect(track)}
    >
      {/* Square Cover Container with Frosted Glass Border */}
      <View style={[styles.imageBox, isCurrent && styles.activeImageBox]}>
        <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />

        {/* Rank Badge (#1, #2, etc.) */}
        {rank !== undefined && (
          <View style={[styles.rankBadge, rank <= 3 && styles.topRankBadge]}>
            <Text style={styles.rankText}>#{rank < 10 ? `0${rank}` : rank}</Text>
          </View>
        )}

        {/* Pill Badge (Trend, Hit, etc.) */}
        {track.badge && !rank && (
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{track.badge}</Text>
          </View>
        )}

        {/* YouTube Red Play Button Overlay */}
        <View style={[styles.playOverlay, isCurrent && styles.activePlayOverlay]}>
          {isCurrent && isPlaying ? (
            showEqualizer ? (
              <View style={styles.equalizerRow}>
                <View style={[styles.eqBar, styles.eqBar1]} />
                <View style={[styles.eqBar, styles.eqBar2]} />
                <View style={[styles.eqBar, styles.eqBar3]} />
              </View>
            ) : (
              <Ionicons name="pause" size={16} color="#FFFFFF" />
            )
          ) : (
            <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
          )}
        </View>
      </View>

      {/* Song Details */}
      <Text style={[styles.trackTitle, isCurrent && styles.activeTrackTitle]} numberOfLines={1}>
        {track.title}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {track.artist}
        </Text>
        {track.durationFormatted ? (
          <Text style={styles.metaDot}> • {track.durationFormatted}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  gridWidth: {
    width: '48.5%',
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1E24',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.11)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  activeImageBox: {
    borderColor: '#FF0033',
    borderWidth: 1.5,
    shadowColor: '#FF0033',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#18181C',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topRankBadge: {
    backgroundColor: 'rgba(255, 0, 50, 0.85)',
    borderColor: '#FF0033',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  playOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  activePlayOverlay: {
    backgroundColor: '#FF0033',
    borderColor: '#FF0033',
    shadowColor: '#FF0033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 14,
    gap: 2.5,
  },
  eqBar: {
    width: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  eqBar1: {
    height: 9,
  },
  eqBar2: {
    height: 14,
  },
  eqBar3: {
    height: 7,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.2,
  },
  activeTrackTitle: {
    color: '#FF2A4D',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trackArtist: {
    color: '#99999F',
    fontSize: 11.5,
    fontWeight: '500',
    flexShrink: 1,
  },
  metaDot: {
    color: '#66666E',
    fontSize: 11,
  },
});
