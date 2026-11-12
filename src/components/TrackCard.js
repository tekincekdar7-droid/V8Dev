// TrackCard.js - Rich Apple Music & Spotify aesthetic track card
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../services/playerContext';

export default function TrackCard({ track, onSelect, rank, isDownloaded, onDelete }) {
  const { currentTrack, isPlaying, downloadProgress, handleDownload } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;
  const progress = downloadProgress[track.id];
  const isDownloading = progress !== undefined;

  const thumbnailUri = track.localThumbnailUri || track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;

  return (
    <TouchableOpacity
      style={[styles.container, isCurrent && styles.activeContainer]}
      onPress={() => onSelect(track)}
      activeOpacity={0.75}
    >
      {/* Optional Rank Badge for Search Results */}
      {rank !== undefined && (
        <View style={styles.rankWrapper}>
          <Text style={[styles.rankText, rank <= 3 && styles.topRankText]}>
            {rank < 10 ? `0${rank}` : rank}
          </Text>
        </View>
      )}

      {/* Album Artwork Squircle */}
      <View style={[styles.imageWrapper, isCurrent && styles.activeImageWrapper]}>
        <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
        {isCurrent && (
          <View style={styles.playingOverlay}>
            {isPlaying ? (
              <View style={styles.equalizerRow}>
                <View style={[styles.eqBar, styles.eqBar1]} />
                <View style={[styles.eqBar, styles.eqBar2]} />
                <View style={[styles.eqBar, styles.eqBar3]} />
              </View>
            ) : (
              <Ionicons name="pause" size={16} color="#FFFFFF" />
            )}
          </View>
        )}
      </View>

      {/* Song Details */}
      <View style={styles.infoWrapper}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isCurrent && styles.activeTitle]} numberOfLines={1}>
            {track.title}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
          {track.durationFormatted ? (
            <Text style={styles.durationText}> • {track.durationFormatted}</Text>
          ) : null}

          {/* User Play Count Badge if present */}
          {track.playCount && track.playCount > 1 ? (
            <View style={styles.playCountBadge}>
              <Ionicons name="flame" size={11} color="#FF9500" />
              <Text style={styles.playCountText}>{track.playCount}x</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Actions (Download / Trash) */}
      <View style={styles.actions}>
        {isDownloading ? (
          <View style={styles.downloadProgressBadge}>
            <ActivityIndicator size="small" color="#FF0000" />
            <Text style={styles.progressText}>%{Math.round(progress * 100)}</Text>
          </View>
        ) : isDownloaded ? (
          onDelete ? (
            <TouchableOpacity onPress={() => onDelete(track.id)} style={styles.iconCircleBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={16} color="#FF4444" />
            </TouchableOpacity>
          ) : (
            <View style={styles.downloadedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            </View>
          )
        ) : (
          <TouchableOpacity onPress={() => handleDownload(track)} style={styles.iconCircleBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-down-circle-outline" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: 'rgba(255, 0, 0, 0.35)',
  },
  rankWrapper: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  rankText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  topRankText: {
    color: '#FF0000',
    fontWeight: '800',
  },
  imageWrapper: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  activeImageWrapper: {
    borderWidth: 1.5,
    borderColor: '#FF0000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 14,
    gap: 2.5,
  },
  eqBar: {
    width: 3,
    backgroundColor: '#FF0000',
    borderRadius: 1.5,
  },
  eqBar1: { height: 12 },
  eqBar2: { height: 7 },
  eqBar3: { height: 14 },
  infoWrapper: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  activeTitle: {
    color: '#FF0000',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  artist: {
    color: '#8E8E93',
    fontSize: 12,
    maxWidth: '65%',
  },
  durationText: {
    color: '#666666',
    fontSize: 11,
  },
  playCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
    gap: 2,
  },
  playCountText: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadedBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 0, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    color: '#FF0000',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
