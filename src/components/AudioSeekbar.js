// AudioSeekbar.js - Compact, ultra-sleek minimalist music seekbar (Apple Music & Spotify style)
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function AudioSeekbar({
  currentPositionMs = 0,
  durationMs = 0,
  fallbackDurationSec = 0,
  onSeek
}) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPositionMs, setScrubPositionMs] = useState(0);

  const trackRef = useRef(null);
  const trackWidthRef = useRef(SCREEN_WIDTH - 60);
  const trackPageXRef = useRef(30);

  // Measure exact track bounds on screen
  const onTrackLayout = () => {
    trackRef.current?.measure((x, y, w, h, pageX) => {
      if (w > 0) trackWidthRef.current = w;
      if (pageX !== undefined && pageX > 0) trackPageXRef.current = pageX;
    });
  };

  // 1. Resolve reliable duration
  let effectiveDurationMs = 0;
  if (durationMs && durationMs > 1000) {
    effectiveDurationMs = durationMs;
  } else if (fallbackDurationSec && fallbackDurationSec > 0) {
    effectiveDurationMs = fallbackDurationSec * 1000;
  } else {
    effectiveDurationMs = 180 * 1000; // 3:00 default fallback
  }

  // 2. Resolve active playback position
  const activePositionMs = isScrubbing
    ? scrubPositionMs
    : Math.min(Math.max(0, currentPositionMs), effectiveDurationMs);

  const progressRatio = Math.max(0, Math.min(1, activePositionMs / effectiveDurationMs));
  const progressPercent = progressRatio * 100;

  const currentSec = Math.floor(activePositionMs / 1000);
  const totalSec = Math.floor(effectiveDurationMs / 1000);

  const getPositionFromPageX = (pageX) => {
    const width = trackWidthRef.current || (SCREEN_WIDTH - 60);
    const startX = trackPageXRef.current || 30;
    const relX = pageX - startX;
    const ratio = Math.max(0, Math.min(1, relX / width));
    return ratio * effectiveDurationMs;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsScrubbing(true);
        const target = getPositionFromPageX(evt.nativeEvent.pageX);
        setScrubPositionMs(target);
      },
      onPanResponderMove: (evt) => {
        const target = getPositionFromPageX(evt.nativeEvent.pageX);
        setScrubPositionMs(target);
      },
      onPanResponderRelease: (evt) => {
        setIsScrubbing(false);
        const target = getPositionFromPageX(evt.nativeEvent.pageX);
        if (onSeek) onSeek(target);
      },
      onPanResponderTerminate: () => {
        setIsScrubbing(false);
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Interactive touch area with measurement */}
      <View
        ref={trackRef}
        style={styles.touchArea}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.trackBackground}>
          <View style={[styles.trackFill, { width: `${progressPercent}%` }]} />
          <View
            style={[
              styles.knob,
              { left: `${progressPercent}%` },
              isScrubbing && styles.knobActive,
            ]}
          />
        </View>
      </View>

      {/* Clean, minimalist time row */}
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, isScrubbing && styles.timeTextActive]}>
          {formatDuration(currentSec)}
        </Text>
        <Text style={styles.timeTextTotal}>
          {formatDuration(totalSec)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  touchArea: {
    height: 24,
    justifyContent: 'center',
    width: '100%',
  },
  trackBackground: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    position: 'relative',
    width: '100%',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#FF0033',
    borderRadius: 2,
  },
  knob: {
    position: 'absolute',
    top: -3.5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginLeft: -5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 2,
  },
  knobActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    top: -5.5,
    marginLeft: -7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF0033',
    shadowColor: '#FF0033',
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  timeTextActive: {
    color: '#FF0033',
    fontWeight: '700',
  },
  timeTextTotal: {
    color: 'rgba(255, 255, 255, 0.38)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
