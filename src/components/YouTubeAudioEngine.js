// YouTubeAudioEngine.js - Clean & Official YouTube Player Fallback Engine
import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const YouTubeAudioEngine = forwardRef(function YouTubeAudioEngine(
  { onStateChange, onTimeUpdate, onError, currentVideoId, isPlaying },
  ref
) {
  const playerRef = useRef(null);
  const timeIntervalRef = useRef(null);
  const isPollingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => {
      try {
        playerRef.current?.seekTo(seconds, true);
      } catch (e) {}
    },
  }));

  // Poll playback progress while playing and ready (safe from EventEmitter memory leaks)
  useEffect(() => {
    if (isPlaying && currentVideoId && isReady) {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = setInterval(async () => {
        if (isPollingRef.current) return;
        isPollingRef.current = true;
        try {
          if (playerRef.current) {
            const cur = await playerRef.current.getCurrentTime();
            if (cur !== undefined && !isNaN(cur) && onTimeUpdate) {
              onTimeUpdate({ currentTime: cur });
            }
          }
        } catch (e) {
        } finally {
          isPollingRef.current = false;
        }
      }, 500);
    } else {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    }

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentVideoId, isReady]);

  const handleReady = () => {
    console.log('[YouTubeEngine] Player is READY for video:', currentVideoId);
    setIsReady(true);
  };

  const handleChangeState = (state) => {
    console.log('[YouTubeEngine] State change:', state);
    if (onStateChange) {
      onStateChange(state);
    }
  };

  const handleError = (error) => {
    console.warn('[YouTubeEngine] Player error:', error);
    if (onError) {
      onError(error);
    }
  };

  if (!currentVideoId) {
    return null;
  }

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <YoutubePlayer
        ref={playerRef}
        height={120}
        width={120}
        play={isPlaying}
        videoId={currentVideoId}
        onReady={handleReady}
        onChangeState={handleChangeState}
        onError={handleError}
        initialPlayerParams={{
          controls: false,
          modestbranding: true,
          rel: false,
          preventFullScreen: true,
        }}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          allowsAirPlayForMediaPlayback: true,
          scrollEnabled: false,
          bounces: false,
        }}
      />
    </View>
  );
});

export default YouTubeAudioEngine;

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 120,
    opacity: 1,
    zIndex: -9999,
  },
});
