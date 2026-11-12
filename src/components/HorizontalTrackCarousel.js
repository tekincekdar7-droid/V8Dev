// HorizontalTrackCarousel.js - YouTube Music style square card carousel
import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../services/playerContext';

export default function HorizontalTrackCarousel({
  title,
  subtitle,
  tracks,
  cardWidth = 146,
  cardHeight = 146,
  showRank = false
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
          const displayRank = track.rank || (showRank ? idx + 1 : undefined);

          return (
            <TouchableOpacity
              key={`${track.id}-${idx}`}
              style={[styles.card, { width: cardWidth }]}
              activeOpacity={0.8}
              onPress={() => playTrack(track, tracks)}
            >
              {/* Square Box Cover with Glassmorphic Border */}
              <View
                style={[
                  styles.imageBox,
                  { width: cardWidth, height: cardHeight },
                  isCurrent && styles.activeImageBox
                ]}
              >
                <Image
                  source={{ uri: track.thumbnail || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg` }}
                  style={[styles.thumbnail, { width: cardWidth, height: cardHeight }]}
                />

                {/* Optional Rank Badge (#1, #2, etc.) */}
                {displayRank !== undefined && (
                  <View style={[styles.rankBadge, displayRank <= 3 && styles.topRankBadge]}>
                    <Text style={styles.rankBadgeText}>#{displayRank < 10 ? `0${displayRank}` : displayRank}</Text>
                  </View>
                )}

                {/* Optional Pill badge if present & no rank */}
                {track.badge && displayRank === undefined && (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>{track.badge}</Text>
                  </View>
                )}

                {/* YouTube Red Play Button Overlay */}
                <View style={[styles.playOverlay, isCurrent && styles.activePlayOverlay]}>
                  {isCurrent && isPlaying ? (
                    <View style={styles.equalizerRow}>
                      <View style={[styles.eqBar, styles.eqBar1]} />
                      <View style={[styles.eqBar, styles.eqBar2]} />
                      <View style={[styles.eqBar, styles.eqBar3]} />
                    </View>
                  ) : (
                    <Ionicons
                      name="play"
                      size={17}
                      color="#FFFFFF"
                      style={{ marginLeft: 2 }}
                    />
                  )}
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
  scrollContent: {
    gap: 13,
    paddingRight: 16,
  },
  card: {
    backgroundColor: 'transparent',
  },
  imageBox: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1E24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.11)',
  },
  activeImageBox: {
    borderColor: '#FF0033',
    borderWidth: 1.5,
    shadowColor: '#FF0033',
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  thumbnail: {
    borderRadius: 16,
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
  rankBadgeText: {
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
  trackArtist: {
    color: '#8E8E93',
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
});
