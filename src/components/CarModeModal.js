// CarModeModal.js - Distraction-free, massive-touch CarPlay style driving mode
import React, { useRef, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../services/playerContext';
import AudioSeekbar from './AudioSeekbar';

const { width, height } = Dimensions.get('window');
const CAR_ARTWORK_SIZE = Math.min(width * 0.75, 260);

export default function CarModeModal({ visible, onClose }) {
  const {
    currentTrack,
    isPlaying,
    playbackPosition,
    playbackDuration,
    togglePlayPause,
    seekTo,
    skipToNext,
    skipToPrevious,
    isFavoriteCurrent,
    handleToggleFavorite
  } = usePlayer();

  const [currentTimeStr, setCurrentTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${h}:${m}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // PanResponder for effortless swipe gestures while driving
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 30,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -60) {
          // Swiped left: Next track
          skipToNext();
        } else if (gesture.dx > 60) {
          // Swiped right: Previous track
          skipToPrevious();
        }
      },
    })
  ).current;

  if (!currentTrack || !visible) return null;

  const thumbnailUri = currentTrack.localThumbnailUri || currentTrack.thumbnail || `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeContainer} {...panResponder.panHandlers}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Top Car Dashboard Header */}
        <View style={styles.topBar}>
          <View style={styles.clockRow}>
            <Ionicons name="car-sport" size={20} color="#FF0000" style={{ marginRight: 8 }} />
            <Text style={styles.carModeTitle}>SÜRÜŞ MODU</Text>
          </View>

          <Text style={styles.clockText}>{currentTimeStr}</Text>

          <TouchableOpacity onPress={onClose} style={styles.exitBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close-circle" size={32} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Center Content: Artwork & Song Info */}
        <View style={styles.mainContent}>
          <TouchableOpacity
            style={styles.artworkContainer}
            onPress={togglePlayPause}
            activeOpacity={0.9}
          >
            <Image source={{ uri: thumbnailUri }} style={styles.artwork} />
            <View style={styles.tapToPlayOverlay}>
              <Ionicons
                name={isPlaying ? "volume-high" : "play"}
                size={28}
                color="rgba(255, 255, 255, 0.7)"
              />
            </View>
          </TouchableOpacity>

          {/* Large Glanceable Song Title */}
          <View style={styles.textContainer}>
            <Text style={styles.trackTitle} numberOfLines={2}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          {/* Minimal High-Contrast Seekbar */}
          <View style={styles.seekbarWrapper}>
            <AudioSeekbar
              positionMillis={playbackPosition}
              durationMillis={playbackDuration}
              onSeek={seekTo}
            />
          </View>

          {/* Swipe Hint */}
          <Text style={styles.swipeHint}>
            👈 Şarkı değiştirmek için sağa / sola kaydır 👉
          </Text>
        </View>

        {/* Giant Driving Controls */}
        <View style={styles.giantControlsRow}>
          <TouchableOpacity
            style={styles.giantHeartBtn}
            onPress={handleToggleFavorite}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Ionicons
              name={isFavoriteCurrent ? "heart" : "heart-outline"}
              size={34}
              color={isFavoriteCurrent ? "#FF0000" : "#8E8E93"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.giantSkipBtn}
            onPress={skipToPrevious}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Ionicons name="play-skip-back" size={42} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.giantPlayPauseBtn}
            onPress={togglePlayPause}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={48}
              color="#FFFFFF"
              style={!isPlaying ? { marginLeft: 4 } : null}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.giantSkipBtn}
            onPress={skipToNext}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Ionicons name="play-skip-forward" size={42} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ width: 34 }} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carModeTitle: {
    color: '#FF0000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  clockText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  exitBtn: {
    padding: 2,
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  artworkContainer: {
    width: CAR_ARTWORK_SIZE,
    height: CAR_ARTWORK_SIZE,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  tapToPlayOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 6,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
  },
  trackArtist: {
    color: '#A0A0A5',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  seekbarWrapper: {
    width: '100%',
    marginVertical: 4,
  },
  swipeHint: {
    color: '#55555A',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
  },
  giantControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 10,
  },
  giantHeartBtn: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giantSkipBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giantPlayPauseBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
