// YouTubeAudioEngine.js - Clean & Official YouTube Player Fallback Engine
import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const YouTubeAudioEngine = forwardRef(function YouTubeAudioEngine(
  { onStateChange, onTimeUpdate, onError, currentVideoId, isPlaying },
  ref
) {
  const playerRef = useRef(null);
  const timeIntervalRef = useRef(null);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => {
      try {
        playerRef.current?.seekTo(seconds, true);
      } catch (e) {}
    },
  }));

  // Poll playback progress while playing
  useEffect(() => {
    if (isPlaying && currentVideoId) {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = setInterval(async () => {
        try {
          if (playerRef.current) {
            const [cur, dur] = await Promise.all([
              playerRef.current.getCurrentTime(),
              playerRef.current.getDuration()
            ]);
            if (cur !== undefined && !isNaN(cur) && onTimeUpdate) {
              onTimeUpdate({ currentTime: cur, duration: dur || 0 });
            }
          }
        } catch (e) {}
      }, 400);
    } else {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
    }

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [isPlaying, currentVideoId]);

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
        key={currentVideoId}
        ref={playerRef}
        height={50}
        width={50}
        play={isPlaying}
        videoId={currentVideoId}
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
          androidLayerType: 'hardware',
        }}
      />
    </View>
  );
});

export default YouTubeAudioEngine;

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 50,
    height: 50,
    opacity: 0.8,
  },
});
