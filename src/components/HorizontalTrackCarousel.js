// HorizontalTrackCarousel.js - Oval & Rounded album card carousel
import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../services/playerContext';

export default function HorizontalTrackCarousel({
  title,
  subtitle,
  tracks,
  cardWidth = 145,
  cardHeight = 145
}) {
  const { currentTrack, isPlaying, playTrack } = usePlayer();

  if (!tracks || tracks.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        {subtitle && <Text style={styles.subtitle}>{subtitle.toUpperCase()}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tracks.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <TouchableOpacity
              key={`${track.id}-${idx}`}
              style={[styles.card, { width: cardWidth }]}
              activeOpacity={0.8}
              onPress={() => playTrack(track, tracks)}
            >
              <View style={[styles.imageBox, { width: cardWidth, height: cardHeight }]}>
                <Image
                  source={{ uri: track.thumbnail }}
                  style={[styles.thumbnail, { width: cardWidth, height: cardHeight }]}
                />

                {/* Pill badge if present */}
                {track.badge && (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>{track.badge}</Text>
                  </View>
                )}

                {/* Floating Play Button Overlay */}
                <View style={[styles.playOverlay, isCurrent && styles.activePlayOverlay]}>
                  <Ionicons
                    name={isCurrent && isPlaying ? "pause" : "play"}
                    size={18}
                    color="#FFFFFF"
                    style={{ marginLeft: isCurrent && isPlaying ? 0 : 2 }}
                  />
                </View>
              </View>

              <Text style={[styles.trackTitle, isCurrent && styles.activeTrackTitle]} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {track.artist}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerBox: {
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 2,
  },
  scrollContent: {
    gap: 14,
    paddingRight: 16,
  },
  card: {
    backgroundColor: 'transparent',
  },
  imageBox: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1E22',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  thumbnail: {
    borderRadius: 20,
  },
  badgePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0.5,
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  activePlayOverlay: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  activeTrackTitle: {
    color: '#FF0000',
  },
  trackArtist: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
});
