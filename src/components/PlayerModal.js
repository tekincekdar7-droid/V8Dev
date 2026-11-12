// PlayerModal.js - Ultra-modern, spacious Apple Music & Spotify premium style music player
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../services/playerContext';
import { fetchLyrics } from '../services/lyricsService';
import AudioSeekbar from './AudioSeekbar';
import SleepTimerModal from './SleepTimerModal';
import SoundModeModal from './SoundModeModal';
import CarModeModal from './CarModeModal';
import AddToPlaylistModal from './AddToPlaylistModal';

const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = Math.min(width * 0.84, height * 0.38);

export default function PlayerModal({ visible, onClose }) {
  const {
    currentTrack,
    isPlaying,
    playbackPosition,
    playbackDuration,
    isLoading,
    queue,
    isDownloadedCurrent,
    isFavoriteCurrent,
    downloadProgress,
    playbackRate,
    sleepTimerMinutes,
    togglePlayPause,
    seekTo,
    skipToNext,
    skipToPrevious,
    handleDownload,
    handleToggleFavorite,
    setPlaybackRate,
    playTrack
  } = usePlayer();

  const [activeSheet, setActiveSheet] = useState(null); // null | 'lyrics' | 'queue'
  const [lyrics, setLyrics] = useState('');
  const [parsedLyrics, setParsedLyrics] = useState([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [timerModalVisible, setTimerModalVisible] = useState(false);
  const [soundModeModalVisible, setSoundModeModalVisible] = useState(false);
  const [carModeVisible, setCarModeVisible] = useState(false);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [pocketMode, setPocketMode] = useState(false);
  const [pocketTapCount, setPocketTapCount] = useState(0);
  const pocketTapTimeoutRef = useRef(null);
  const lyricsScrollRef = useRef(null);

  const handlePocketTap = () => {
    if (pocketTapCount === 0) {
      setPocketTapCount(1);
      if (pocketTapTimeoutRef.current) clearTimeout(pocketTapTimeoutRef.current);
      pocketTapTimeoutRef.current = setTimeout(() => {
        setPocketTapCount(0);
      }, 1500);
    } else {
      if (pocketTapTimeoutRef.current) clearTimeout(pocketTapTimeoutRef.current);
      setPocketTapCount(0);
      setPocketMode(false);
    }
  };

  useEffect(() => {
    if (currentTrack && visible) {
      loadLyrics();
    }
  }, [currentTrack?.id, visible]);

  const loadLyrics = async () => {
    if (!currentTrack) return;
    setLyricsLoading(true);
    try {
      const data = await fetchLyrics(currentTrack.title, currentTrack.artist);
      if (data) {
        setLyrics(data.plainLyrics || 'Şarkı sözü bulunamadı.');
        setParsedLyrics(data.parsedLines || []);
      } else {
        setLyrics('Bu şarkı için şarkı sözü bulunamadı.');
        setParsedLyrics([]);
      }
    } catch (e) {
      setLyrics('Şarkı sözleri yüklenirken bir hata oluştu.');
      setParsedLyrics([]);
    } finally {
      setLyricsLoading(false);
    }
  };

  // Find active line in synced karaoke lyrics
  const activeLineIndex = parsedLyrics.length > 0
    ? parsedLyrics.findLastIndex(line => playbackPosition >= line.timeMs)
    : -1;

  useEffect(() => {
    if (activeSheet === 'lyrics' && activeLineIndex >= 0 && lyricsScrollRef.current) {
      lyricsScrollRef.current.scrollTo({
        y: Math.max(0, activeLineIndex * 46 - 160),
        animated: true,
      });
    }
  }, [activeLineIndex, activeSheet]);

  if (!currentTrack) return null;

  const isDownloading = downloadProgress[currentTrack.id] !== undefined;
  const downloadPct = downloadProgress[currentTrack.id] ? Math.round(downloadProgress[currentTrack.id] * 100) : 0;
  const thumbnailUri = currentTrack.localThumbnailUri || currentTrack.thumbnail;

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0, 0.8];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIdx]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.safeContainer}>
        {/* Soft Ambient Glow Aura behind artwork */}
        <View style={styles.ambientGlow} pointerEvents="none" />

        {/* 1. Sleek Modern Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerCircleBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerSub}>ŞU AN ÇALIYOR</Text>
            {currentTrack.isOffline && (
              <View style={styles.offlinePill}>
                <Ionicons name="cloud-offline" size={10} color="#00E676" />
                <Text style={styles.offlinePillText}>Çevrimdışı</Text>
              </View>
            )}
          </View>

          <View style={styles.headerRightBox}>
            <TouchableOpacity
              style={[styles.headerCircleBtn, { marginRight: 6 }]}
              onPress={() => setCarModeVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="car-sport" size={17} color="#FF0033" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pocketModeBtn}
              onPress={() => setPocketMode(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="moon" size={13} color="#00E5FF" />
              <Text style={styles.pocketBtnText}>Cep Modu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerCircleBtn}
              onPress={() => setTimerModalVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={sleepTimerMinutes ? "timer" : "timer-outline"}
                size={18}
                color={sleepTimerMinutes ? "#FF0033" : "#FFFFFF"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Elevated 3D Album Artwork */}
        <View style={styles.artworkContainer}>
          <Image source={{ uri: thumbnailUri }} style={styles.artwork} />
        </View>

        {/* 3. Title, Artist & Like Heart Row */}
        <View style={styles.metaRow}>
          <View style={styles.metaTextBox}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setPlaylistModalVisible(true)}
              style={[styles.likeCircleBtn, { marginRight: 8 }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={styles.likeCircleBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isFavoriteCurrent ? "heart" : "heart-outline"}
                size={22}
                color={isFavoriteCurrent ? "#FF0033" : "#AAAAAA"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Redesigned AudioSeekbar with Ample Time Label Breathing Room */}
        <AudioSeekbar
          currentPositionMs={playbackPosition}
          durationMs={playbackDuration}
          fallbackDurationSec={currentTrack?.duration}
          onSeek={seekTo}
        />

        {/* 5. Main Playback Controls Row (Apple Music Glass Style) */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.secCircleBtn, isShuffle && styles.activeSecBtn]}
            onPress={() => setIsShuffle(!isShuffle)}
            activeOpacity={0.7}
          >
            <Ionicons name="shuffle" size={20} color={isShuffle ? "#FF0033" : "#8E8E93"} />
          </TouchableOpacity>

          <TouchableOpacity onPress={skipToPrevious} style={styles.skipBtn} activeOpacity={0.7}>
            <Ionicons name="play-skip-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePlayPause} style={styles.mainPlayBtn} activeOpacity={0.85}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={34}
                color="#FFFFFF"
                style={{ marginLeft: isPlaying ? 0 : 3 }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={skipToNext} style={styles.skipBtn} activeOpacity={0.7}>
            <Ionicons name="play-skip-forward" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secCircleBtn, isRepeat && styles.activeSecBtn]}
            onPress={() => setIsRepeat(!isRepeat)}
            activeOpacity={0.7}
          >
            <Ionicons name="repeat" size={20} color={isRepeat ? "#FF0033" : "#8E8E93"} />
          </TouchableOpacity>
        </View>

        {/* 6. Bottom Utility Actions Dock (Frosted Capsule) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomActionBtn}
            onPress={() => handleDownload(currentTrack)}
            disabled={isDownloadedCurrent || isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#FF0033" />
            ) : (
              <Ionicons
                name={isDownloadedCurrent ? "checkmark-circle" : "arrow-down-circle-outline"}
                size={17}
                color={isDownloadedCurrent ? "#00E676" : "#8E8E93"}
              />
            )}
            <Text style={[styles.bottomActionText, isDownloadedCurrent && { color: '#00E676' }]}>
              {isDownloading ? `%${downloadPct}` : isDownloadedCurrent ? 'İndirildi' : 'İndir'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomActionBtn}
            onPress={() => setActiveSheet('lyrics')}
          >
            <Ionicons name="musical-notes-outline" size={17} color="#8E8E93" />
            <Text style={styles.bottomActionText}>Sözler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomActionBtn}
            onPress={() => setActiveSheet('queue')}
          >
            <Ionicons name="list" size={17} color="#8E8E93" />
            <Text style={styles.bottomActionText}>Sıradaki</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomActionBtn}
            onPress={cyclePlaybackRate}
          >
            <Ionicons name="speedometer-outline" size={17} color="#8E8E93" />
            <Text style={styles.bottomActionText}>{playbackRate}x</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomActionBtn}
            onPress={() => setSoundModeModalVisible(true)}
          >
            <Ionicons name="options-outline" size={17} color="#8E8E93" />
            <Text style={styles.bottomActionText}>Ses Modu</Text>
          </TouchableOpacity>
        </View>

        {/* Slide-Up Lyrics Sheet Modal */}
        <Modal visible={activeSheet === 'lyrics'} transparent animationType="slide">
          <View style={styles.sheetOverlay}>
            <View style={styles.sheetContent}>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>Şarkı Sözleri</Text>
                  <Text style={styles.sheetSubtitle}>{currentTrack.title}</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveSheet(null)} style={styles.sheetCloseBtn}>
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {lyricsLoading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#FF0033" />
                  <Text style={styles.loadingText}>Sözler yükleniyor...</Text>
                </View>
              ) : parsedLyrics.length > 0 ? (
                <ScrollView
                  ref={lyricsScrollRef}
                  style={styles.sheetScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 20 }}
                >
                  <View style={styles.karaokeHeaderBadge}>
                    <Ionicons name="sparkles" size={13} color="#FF9500" />
                    <Text style={styles.karaokeBadgeText}>CANLI KARAOKE • DOKUN VE ŞARKIYA ATLA</Text>
                  </View>
                  {parsedLyrics.map((line, idx) => {
                    const isActive = idx === activeLineIndex;
                    return (
                      <TouchableOpacity
                        key={`line-${idx}`}
                        style={[styles.karaokeLineBtn, isActive && styles.activeKaraokeLineBtn]}
                        onPress={() => seekTo(line.timeMs)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.karaokeLineText, isActive && styles.activeKaraokeLineText]}>
                          {line.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{ height: 60 }} />
                </ScrollView>
              ) : (
                <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.lyricsText}>{lyrics}</Text>
                  <View style={{ height: 40 }} />
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Slide-Up Up Next Queue Sheet Modal */}
        <Modal visible={activeSheet === 'queue'} transparent animationType="slide">
          <View style={styles.sheetOverlay}>
            <View style={styles.sheetContent}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Çalma Sırası ({queue.length})</Text>
                <TouchableOpacity onPress={() => setActiveSheet(null)} style={styles.sheetCloseBtn}>
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {queue.length === 0 ? (
                <View style={styles.centerBox}>
                  <Text style={styles.emptyText}>Çalma listesinde başka şarkı yok.</Text>
                </View>
              ) : (
                <FlatList
                  data={queue}
                  keyExtractor={(item, index) => `${item.id}-${index}`}
                  renderItem={({ item }) => {
                    const isItemCurrent = item.id === currentTrack.id;
                    return (
                      <TouchableOpacity
                        style={[styles.queueRow, isItemCurrent && styles.activeQueueRow]}
                        onPress={() => {
                          playTrack(item, queue);
                          setActiveSheet(null);
                        }}
                      >
                        <Image source={{ uri: item.thumbnail }} style={styles.queueThumb} />
                        <View style={styles.queueTextContainer}>
                          <Text style={[styles.queueTitle, isItemCurrent && styles.activeQueueTitle]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.queueArtist} numberOfLines={1}>{item.artist}</Text>
                        </View>
                        {isItemCurrent && <Ionicons name="volume-high" size={18} color="#FF0033" />}
                      </TouchableOpacity>
                    );
                  }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Sleep Timer Dialog */}
        <SleepTimerModal
          visible={timerModalVisible}
          onClose={() => setTimerModalVisible(false)}
        />

        {/* Audio Equalizer & Sound Mode Dialog */}
        <SoundModeModal
          visible={soundModeModalVisible}
          onClose={() => setSoundModeModalVisible(false)}
        />

        {/* Car Driving Mode Modal */}
        <CarModeModal
          visible={carModeVisible}
          onClose={() => setCarModeVisible(false)}
        />

        {/* Add to Playlist Modal */}
        <AddToPlaylistModal
          visible={playlistModalVisible}
          onClose={() => setPlaylistModalVisible(false)}
          track={currentTrack}
        />

        {/* OLED Pocket Mode Overlay */}
        {pocketMode && (
          <View style={styles.pocketOverlay}>
            <TouchableOpacity
              style={styles.pocketTouchArea}
              activeOpacity={1}
              onPress={handlePocketTap}
            >
              <View style={styles.pocketCenterBox}>
                <Ionicons name="moon" size={42} color="#333333" />
                <Text style={styles.pocketTitle}>CEP MODU AKTİF</Text>
                <Text style={styles.pocketTrack} numberOfLines={1}>
                  {currentTrack.title}
                </Text>
                <Text style={styles.pocketArtist} numberOfLines={1}>
                  {currentTrack.artist}
                </Text>

                <View style={styles.pocketBadge}>
                  <Text style={styles.pocketBadgeText}>OLED Siyah Ekran • 0 Pil Tüketimi</Text>
                </View>

                <View style={styles.pocketHintBox}>
                  <Text style={[styles.pocketHint, pocketTapCount > 0 && styles.pocketHintActive]}>
                    {pocketTapCount > 0 ? "Kilidi açmak için bir kez daha dokunun!" : "Kilidi açmak için ekrana çift dokunun"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#09090D',
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  ambientGlow: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 0, 51, 0.16)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerSub: {
    color: '#8E8E93',
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  offlinePillText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerRightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pocketModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
  },
  pocketBtnText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '700',
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 28,
    backgroundColor: '#18181E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#FF0033',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginVertical: 4,
  },
  metaTextBox: {
    flex: 1,
    marginRight: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  artist: {
    color: '#9E9EA8',
    fontSize: 15,
    fontWeight: '600',
  },
  likeCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginVertical: 8,
  },
  secCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeSecBtn: {
    backgroundColor: 'rgba(255, 0, 51, 0.16)',
    borderColor: 'rgba(255, 0, 51, 0.4)',
  },
  skipBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#FF0033',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF0033',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 16,
    elevation: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginTop: 4,
  },
  bottomActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 6,
  },
  bottomActionText: {
    color: '#8E8E93',
    fontSize: 9,
    fontWeight: '600',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#121218',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: height * 0.72,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 14,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    flex: 1,
  },
  lyricsText: {
    color: '#EEEEEE',
    fontSize: 17,
    lineHeight: 30,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 20,
  },
  karaokeHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  karaokeBadgeText: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  karaokeLineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  activeKaraokeLineBtn: {
    backgroundColor: 'rgba(255, 0, 51, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 51, 0.4)',
  },
  karaokeLineText: {
    color: 'rgba(255, 255, 255, 0.32)',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 28,
    textAlign: 'center',
  },
  activeKaraokeLineText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 32,
    textShadowColor: 'rgba(255, 0, 51, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  activeQueueRow: {
    backgroundColor: 'rgba(255, 0, 51, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 51, 0.4)',
  },
  queueThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#1E1E1E',
  },
  queueTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  queueTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeQueueTitle: {
    color: '#FF0033',
  },
  queueArtist: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
  },
  pocketOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pocketTouchArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  pocketCenterBox: {
    alignItems: 'center',
  },
  pocketTitle: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginTop: 16,
  },
  pocketTrack: {
    color: '#777777',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 14,
    textAlign: 'center',
  },
  pocketArtist: {
    color: '#444444',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  pocketBadge: {
    backgroundColor: '#111111',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#222222',
  },
  pocketBadgeText: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '600',
  },
  pocketHintBox: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  pocketHint: {
    color: '#444444',
    fontSize: 12,
    textAlign: 'center',
  },
  pocketHintActive: {
    color: '#00E5FF',
    fontWeight: 'bold',
  },
});
