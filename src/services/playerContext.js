// playerContext.js - Dual-engine music player: High-performance native audio streaming + YouTube fallback
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import YouTubeAudioEngine from '../components/YouTubeAudioEngine';
import { downloadTrack, isTrackDownloaded } from './downloadManager';
import { isFavorite, toggleFavorite } from './favoritesManager';
import { recordTrackPlay } from './historyManager';
import { getAudioStreamUrl } from './musicApi';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const ytEngineRef = useRef(null);
  const localPlayerRef = useRef(null);
  const localSubRef = useRef(null);
  const sleepTimerTimeoutRef = useRef(null);
  const isUserPausedRef = useRef(false);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeEngine, setActiveEngine] = useState('local'); // 'local' | 'youtube'
  const [downloadProgress, setDownloadProgress] = useState({});
  const [isDownloadedCurrent, setIsDownloadedCurrent] = useState(false);
  const [isFavoriteCurrent, setIsFavoriteCurrent] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(null);

  // Configure iOS audio mode for background playback & silent switch bypass
  useEffect(() => {
    async function setupAudio() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMixPersistent',
          allowsRecording: false,
          shouldRouteThroughEarpiece: false,
        });
      } catch (e) {
        console.warn('[Audio] Failed to set audio mode:', e);
      }
    }
    setupAudio();

    return () => {
      cleanupLocalPlayer();
      if (sleepTimerTimeoutRef.current) {
        clearTimeout(sleepTimerTimeoutRef.current);
      }
    };
  }, []);

  // Prevent iPhone from sleeping automatically while music is playing
  useEffect(() => {
    if (isPlaying) {
      activateKeepAwakeAsync().catch(() => {});
    } else {
      deactivateKeepAwake().catch(() => {});
    }
  }, [isPlaying]);

  useEffect(() => {
    if (currentTrack) {
      isTrackDownloaded(currentTrack.id).then(setIsDownloadedCurrent);
      isFavorite(currentTrack.id).then(setIsFavoriteCurrent);
    }
  }, [currentTrack]);

  const cleanupLocalPlayer = () => {
    if (localSubRef.current) {
      try {
        localSubRef.current.remove();
      } catch (e) {}
      localSubRef.current = null;
    }
    if (localPlayerRef.current) {
      try {
        if (typeof localPlayerRef.current.setActiveForLockScreen === 'function') {
          localPlayerRef.current.setActiveForLockScreen(false);
        }
      } catch (e) {}
      try {
        localPlayerRef.current.pause();
        localPlayerRef.current.remove();
      } catch (e) {}
      localPlayerRef.current = null;
    }
  };

  const startNativePlayer = (audioUri, track) => {
    cleanupLocalPlayer();
    setActiveEngine('local');

    try {
      const player = createAudioPlayer(audioUri, {
        updateInterval: 250,
        keepAudioSessionActive: true,
      });
      localPlayerRef.current = player;

      try {
        if (typeof player.setActiveForLockScreen === 'function') {
          player.setActiveForLockScreen(true, {
            title: track.title,
            artist: track.artist,
          });
        }
      } catch (e) {
        console.warn('[Audio] setActiveForLockScreen warning:', e);
      }

      const sub = player.addListener('playbackStatusUpdate', (status) => {
        if (!status) return;
        const currentMs = (status.currentTime || 0) * 1000;
        setPlaybackPosition(currentMs);
        if (status.duration && status.duration > 1) {
          setPlaybackDuration(status.duration * 1000);
        }
        setIsPlaying(Boolean(status.playing));
        setIsLoading(Boolean(status.isBuffering));
        if (status.didJustFinish) {
          skipToNext();
        }
      });
      localSubRef.current = sub;
      player.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err) {
      console.warn('[Audio] startNativePlayer error, fallback to YouTube:', err);
      // Fallback to YouTube player if native audio init fails
      cleanupLocalPlayer();
      setActiveEngine('youtube');
      setIsPlaying(true);
      setIsLoading(false);
    }
  };

  // YouTube Engine state callback
  const handleEngineStateChange = (state) => {
    console.log('[PlayerContext] YouTube Engine state:', state, 'isUserPaused:', isUserPausedRef.current);
    if (state === 'playing') {
      setIsPlaying(true);
      setIsLoading(false);
    } else if (state === 'paused') {
      if (isUserPausedRef.current) {
        setIsPlaying(false);
        setIsLoading(false);
      } else {
        // WebKit auto-paused; resume immediately!
        console.log('[PlayerContext] Auto-pause detected, re-triggering play');
        ytEngineRef.current?.play();
      }
    } else if (state === 'buffering') {
      setIsLoading(true);
    } else if (state === 'ended') {
      skipToNext();
    }
  };

  const handleEngineTimeUpdate = ({ currentTime, duration }) => {
    if (currentTime !== undefined) {
      setPlaybackPosition(currentTime * 1000);
    }
    if (duration && duration > 0) {
      setPlaybackDuration(duration * 1000);
    }
  };

  const handleEngineError = (err) => {
    console.warn('[PlayerContext] YouTube engine error:', err);
    setIsLoading(false);
    if (
      err === 'embed_not_allowed' ||
      err === 'video_not_found' ||
      err === 100 ||
      err === 101 ||
      err === 150
    ) {
      skipToNext();
    }
  };

  const playTrack = async (track, newQueue = null) => {
    if (!track || !track.id) return;

    // 1. Record play in history for "En Çok Dinlediklerin"
    recordTrackPlay(track).catch(() => {});

    // 2. Set queue
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(t => t.id === track.id);
      setCurrentIndex(idx !== -1 ? idx : 0);
    }

    // 3. Reset states & set current track immediately
    isUserPausedRef.current = false;
    setCurrentTrack(track);
    setPlaybackPosition(0);
    const initialDurationMs = (track.duration && track.duration > 0) ? track.duration * 1000 : 180 * 1000;
    setPlaybackDuration(initialDurationMs);
    setIsLoading(true);

    try {
      if (track.localAudioUri) {
        // Play downloaded offline track via native expo-audio
        startNativePlayer(track.localAudioUri, track);
      } else {
        // Direct YouTube Engine online playback (instant, zero 403 GoogleVideo errors)
        cleanupLocalPlayer();
        setActiveEngine('youtube');
        setIsPlaying(true);
        setIsLoading(true);
      }
    } catch (err) {
      console.error('[Audio] Failed to play track:', err);
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    try {
      if (activeEngine === 'youtube') {
        if (isPlaying) {
          isUserPausedRef.current = true;
          setIsPlaying(false);
        } else {
          isUserPausedRef.current = false;
          setIsPlaying(true);
        }
      } else {
        if (!localPlayerRef.current) return;
        if (isPlaying) {
          localPlayerRef.current.pause();
          setIsPlaying(false);
        } else {
          localPlayerRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error('[Audio] Toggle error:', err);
    }
  };

  const seekTo = (positionMillis) => {
    try {
      const seconds = Math.max(0, positionMillis / 1000);
      setPlaybackPosition(positionMillis);
      if (activeEngine === 'youtube') {
        ytEngineRef.current?.seekTo(seconds);
      } else if (localPlayerRef.current) {
        localPlayerRef.current.seekTo(seconds);
      }
    } catch (err) {
      console.error('[Audio] Seek error:', err);
    }
  };

  const setPlaybackRate = (rate) => {
    setPlaybackRateState(rate);
    if (activeEngine === 'local' && localPlayerRef.current) {
      try {
        localPlayerRef.current.playbackRate = rate;
      } catch (e) {}
    }
  };

  const skipToNext = () => {
    if (queue.length === 0) return;
    const nextIdx = (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIdx);
    playTrack(queue[nextIdx]);
  };

  const skipToPrevious = () => {
    if (queue.length === 0) return;
    const prevIdx = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(prevIdx);
    playTrack(queue[prevIdx]);
  };

  const handleToggleFavorite = async () => {
    if (!currentTrack) return;
    const newState = await toggleFavorite(currentTrack);
    setIsFavoriteCurrent(newState);
  };

  const handleDownload = async (trackToDownload) => {
    const target = trackToDownload || currentTrack;
    if (!target) return;

    try {
      setDownloadProgress(prev => ({ ...prev, [target.id]: 0.05 }));
      await downloadTrack(target, (progress) => {
        setDownloadProgress(prev => ({ ...prev, [target.id]: progress }));
      });
      setDownloadProgress(prev => {
        const copy = { ...prev };
        delete copy[target.id];
        return copy;
      });
      if (currentTrack && currentTrack.id === target.id) {
        setIsDownloadedCurrent(true);
      }
      Alert.alert('İndirme Başarılı', `"${target.title}" çevrimdışı kitaplığına kaydedildi.`);
    } catch (err) {
      console.error('[Download] Error:', err);
      setDownloadProgress(prev => {
        const copy = { ...prev };
        delete copy[target.id];
        return copy;
      });
      Alert.alert('İndirme Başarısız', err.message || 'Şarkı indirilemedi.');
    }
  };

  const setSleepTimer = (minutes) => {
    if (sleepTimerTimeoutRef.current) {
      clearTimeout(sleepTimerTimeoutRef.current);
      sleepTimerTimeoutRef.current = null;
    }
    setSleepTimerMinutes(minutes);

    if (minutes && minutes > 0) {
      const ms = minutes * 60 * 1000;
      sleepTimerTimeoutRef.current = setTimeout(() => {
        if (activeEngine === 'youtube') {
          isUserPausedRef.current = true;
          setIsPlaying(false);
        } else if (localPlayerRef.current) {
          localPlayerRef.current.pause();
          setIsPlaying(false);
        }
        setSleepTimerMinutes(null);
        Alert.alert('Uyku Zamanlayıcı', 'Müzik duraklatıldı. İyi uykular!');
      }, ms);
    }
  };

  const currentOnlineVideoId = (activeEngine === 'youtube' && currentTrack && !currentTrack.localAudioUri)
    ? currentTrack.id
    : null;

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playbackPosition,
        playbackDuration,
        isLoading,
        queue,
        currentIndex,
        isDownloadedCurrent,
        isFavoriteCurrent,
        downloadProgress,
        playbackRate,
        sleepTimerMinutes,
        playTrack,
        togglePlayPause,
        seekTo,
        skipToNext,
        skipToPrevious,
        handleDownload,
        handleToggleFavorite,
        setPlaybackRate,
        setSleepTimer,
      }}
    >
      {/* Official YouTube Audio Player mounted first (safely behind dark UI) */}
      <YouTubeAudioEngine
        ref={ytEngineRef}
        currentVideoId={currentOnlineVideoId}
        isPlaying={isPlaying && activeEngine === 'youtube'}
        onStateChange={handleEngineStateChange}
        onTimeUpdate={handleEngineTimeUpdate}
        onError={handleEngineError}
      />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}
