// TrackCard.js - Modern rounded YouTube Music track card
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../services/playerContext';

export default function TrackCard({ track, onSelect, isDownloaded, onDelete }) {
  const { currentTrack, isPlaying, downloadProgress, handleDownload } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;
  const progress = downloadProgress[track.id];
  const isDownloading = progress !== undefined;

  const thumbnailUri = track.localThumbnailUri || track.thumbnail;

  return (
    <TouchableOpacity
      style={[styles.container, isCurrent && styles.activeContainer]}
      onPress={() => onSelect(track)}
      activeOpacity={0.75}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
        {isCurrent && (
          <View style={styles.playingOverlay}>
            <Ionicons name={isPlaying ? "volume-high" : "pause"} size={16} color="#FF0000" />
          </View>
        )}
      </View>

      <View style={styles.infoWrapper}>
        <Text style={[styles.title, isCurrent && styles.activeText]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist} {track.durationFormatted ? `• ${track.durationFormatted}` : ''}
        </Text>
      </View>

      <View style={styles.actions}>
        {isDownloading ? (
          <View style={styles.downloadProgressBadge}>
            <ActivityIndicator size="small" color="#FF0000" />
            <Text style={styles.progressText}>%{Math.round(progress * 100)}</Text>
          </View>
        ) : isDownloaded ? (
          onDelete ? (
            <TouchableOpacity onPress={() => onDelete(track.id)} style={styles.iconCircleBtn}>
              <Ionicons name="trash-outline" size={16} color="#FF4444" />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconCircleBtn}>
              <Ionicons name="cloud-offline" size={16} color="#FF0000" />
            </View>
          )
        ) : (
          <TouchableOpacity onPress={() => handleDownload(track)} style={styles.iconCircleBtn}>
            <Ionicons name="arrow-down-circle-outline" size={18} color="#999999" />
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
    borderRadius: 18,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.12)',
    borderColor: 'rgba(255, 0, 0, 0.4)',
  },
  imageWrapper: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  infoWrapper: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  activeText: {
    color: '#FF0000',
    fontWeight: '700',
  },
  artist: {
    color: '#8E8E93',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
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
