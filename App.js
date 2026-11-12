// App.js - Modern, Clean & Sleek Music Experience (Spotify & Apple Music Minimalist Style)
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlayerProvider, usePlayer } from './src/services/playerContext';
import {
  searchMusic,
  getTrendingMusic,
  getSearchSuggestions,
  INSTANT_TRENDING_TRACKS,
  QUICK_PICKS_TRACKS,
  ALL_CATALOG_TRACKS,
  THEMATIC_SECTIONS
} from './src/services/musicApi';
import { getMostPlayedTracks } from './src/services/historyManager';
import TrackCard from './src/components/TrackCard';
import MiniPlayer from './src/components/MiniPlayer';
import PlayerModal from './src/components/PlayerModal';
import OfflineLibrary from './src/components/OfflineLibrary';
import ArtistsRow from './src/components/ArtistsRow';
import PlaylistsCarousel from './src/components/PlaylistsCarousel';
import TopChartRankItem from './src/components/TopChartRankItem';
import CategoriesGrid from './src/components/CategoriesGrid';
import QuickMixGrid from './src/components/QuickMixGrid';
import SoundModeModal from './src/components/SoundModeModal';

const FILTER_PILLS = [
  { id: 'all', label: '✨ Tümü' },
  { id: 'pop', label: '🇹🇷 Pop' },
  { id: 'rap', label: '🎤 Rap & Trap' },
  { id: 'lofi', label: '🌙 Lo-Fi & Gece' },
  { id: 'global', label: '🌍 Global Hit' },
];

const POPULAR_SEARCH_TAGS = [
  'Tarkan',
  'The Weeknd',
  'Semicenk',
  'Mabel Matiz',
  'Motive',
  'Billie Eilish',
  'Simge',
  'Coldplay'
];

function getDynamicGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { title: 'Günaydın ☀️', subtitle: 'Güne enerjik bir başlangıç yap' };
  if (hour >= 12 && hour < 18) return { title: 'İyi Günler 🎵', subtitle: 'Günün temposuna eşlik eden müzikler' };
  if (hour >= 18 && hour < 22) return { title: 'İyi Akşamlar 🌆', subtitle: 'Günün yorgunluğunu müzikle at' };
  return { title: 'İyi Geceler 🌙', subtitle: 'Geceye özel sakin ve derin melodiler' };
}

function MainScreen() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'explore' | 'library'
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(ALL_CATALOG_TRACKS);
  const [quickPicks, setQuickPicks] = useState(QUICK_PICKS_TRACKS.slice(0, 4));
  const [topCharts, setTopCharts] = useState(INSTANT_TRENDING_TRACKS.slice(0, 5));
  const [mostPlayed, setMostPlayed] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [exploreFilter, setExploreFilter] = useState('all'); // 'all' | 'most_played'
  const [homeTopFilter, setHomeTopFilter] = useState('user'); // 'user' | 'global'
  const [loading, setLoading] = useState(false);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [soundModeModalOpen, setSoundModeModalOpen] = useState(false);

  const { playTrack, currentTrack } = usePlayer();
  const greeting = getDynamicGreeting();

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    getMostPlayedTracks(10).then(data => {
      if (data && data.length > 0) {
        setMostPlayed(data);
      }
    });
  }, [activeTab, currentTrack]);

  const loadHomeData = async () => {
    try {
      const trending = await getTrendingMusic();
      if (trending && trending.length > 0) {
        setQuickPicks(trending.slice(0, 4));
        setTopCharts(trending.slice(0, 5));
        setResults(trending);
      }
    } catch (e) {
      console.warn('Initial load error:', e);
    }
  };

  const handleFilterChange = (filterId) => {
    setSelectedFilter(filterId);
    if (filterId === 'pop') {
      setQuickPicks(THEMATIC_SECTIONS.turkishPop.tracks.slice(0, 4));
    } else if (filterId === 'rap') {
      setQuickPicks(THEMATIC_SECTIONS.rapTrap.tracks.slice(0, 4));
    } else if (filterId === 'lofi') {
      setQuickPicks(THEMATIC_SECTIONS.chillLofi.tracks.slice(0, 4));
    } else if (filterId === 'global') {
      setQuickPicks(THEMATIC_SECTIONS.globalHits.tracks.slice(0, 4));
    } else {
      setQuickPicks(QUICK_PICKS_TRACKS.slice(0, 4));
    }
  };

  const handleQueryChange = (text) => {
    setQuery(text);
    if (text.trim().length >= 2) {
      getSearchSuggestions(text).then(data => {
        if (Array.isArray(data)) setSuggestions(data);
      });
    } else {
      setSuggestions([]);
    }
  };

  const handleSearch = async (searchTerm) => {
    const term = searchTerm !== undefined ? searchTerm : query;
    setSuggestions([]);
    if (!term.trim()) {
      setResults(ALL_CATALOG_TRACKS);
      return;
    }
    setLoading(true);
    Keyboard.dismiss();
    try {
      const data = await searchMusic(term);
      setResults(data && data.length > 0 ? data : []);
    } catch (e) {
      console.warn('Search failed:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (s) => {
    setQuery(s);
    setSuggestions([]);
    handleSearch(s);
  };

  const handleArtistSelect = (artistQuery) => {
    setActiveTab('explore');
    setQuery(artistQuery);
    handleSearch(artistQuery);
  };

  const handleMixSelect = (mix) => {
    setActiveTab('explore');
    setQuery(mix.title);
    handleSearch(mix.query);
  };

  const handleCategorySelect = (categoryQuery) => {
    setActiveTab('explore');
    setQuery(categoryQuery);
    handleSearch(categoryQuery);
  };

  const displayedTopTracks = (homeTopFilter === 'user' && mostPlayed.length > 0)
    ? mostPlayed.slice(0, 6)
    : topCharts.slice(0, 6);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {/* Main Content View based on Tab */}
      <View style={styles.content}>
        {activeTab === 'home' ? (
          /* ==================== HOME TAB (CLEAN & MINIMALIST) ==================== */
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* 1. Sleek Minimal Header */}
            <View style={styles.headerBar}>
              <View style={styles.logoRow}>
                <View style={styles.logoIcon}>
                  <Ionicons name="musical-notes" size={15} color="#FFFFFF" />
                </View>
                <Text style={styles.brandTitle}>SoundWave</Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.actionCircleBtn}
                  onPress={() => setSoundModeModalOpen(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="options-outline" size={18} color="#CCCCCC" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCircleBtn}
                  onPress={() => setActiveTab('explore')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="search" size={18} color="#CCCCCC" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Dynamic Greeting */}
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingTitle}>{greeting.title}</Text>
              <Text style={styles.greetingSubtitle}>{greeting.subtitle}</Text>
            </View>

            {/* 3. Streamlined Category Filter Pills */}
            <View style={styles.filterPillsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {FILTER_PILLS.map((pill) => {
                  const isSelected = selectedFilter === pill.id;
                  return (
                    <TouchableOpacity
                      key={pill.id}
                      style={[styles.filterPill, isSelected && styles.activeFilterPill]}
                      onPress={() => handleFilterChange(pill.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterPillText, isSelected && styles.activeFilterPillText]}>
                        {pill.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 4. 6-Pack Quick Shortcuts Grid (1-Tap Play) */}
            <QuickMixGrid />

            {/* 5. 🔥 EN ÇOK DİNLENENLER DERLEMESİ (ANA SAYFA ÖZEL) */}
            <View style={styles.topPlayedCompiledSection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionSubtitle}>ZİRVEDEKİLER & TREND</Text>
                  <Text style={styles.sectionTitle}>🔥 En Çok Dinlenenler</Text>
                </View>

                {/* Switch between user's most played & global top */}
                <View style={styles.miniPillToggle}>
                  <TouchableOpacity
                    style={[styles.miniToggleBtn, homeTopFilter === 'user' && styles.activeMiniToggleBtn]}
                    onPress={() => setHomeTopFilter('user')}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.miniToggleText, homeTopFilter === 'user' && styles.activeMiniToggleText]}>
                      Senin ({mostPlayed.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.miniToggleBtn, homeTopFilter === 'global' && styles.activeMiniToggleBtn]}
                    onPress={() => setHomeTopFilter('global')}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.miniToggleText, homeTopFilter === 'global' && styles.activeMiniToggleText]}>
                      Top Liste
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {displayedTopTracks.length > 0 ? (
                <View style={styles.trackList}>
                  {displayedTopTracks.map((track, idx) => (
                    <TrackCard
                      key={`home-top-${track.id}-${idx}`}
                      rank={idx + 1}
                      track={track}
                      onSelect={(t) => playTrack(t, displayedTopTracks)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyTopPlayedCard}>
                  <Ionicons name="flame-outline" size={26} color="#FF9500" />
                  <Text style={styles.emptyTopPlayedTitle}>Henüz Şarkı Çalmadın</Text>
                  <Text style={styles.emptyTopPlayedSubtitle}>
                    Müzik dinledikçe en çok dinlediğin şarkılar otomatik burada derlenecek!
                  </Text>
                </View>
              )}
            </View>

            {/* 6. Günün Parçaları (Hızlı Seçimler) */}
            <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
              <View>
                <Text style={styles.sectionSubtitle}>SENİN İÇİN SEÇİLDİ</Text>
                <Text style={styles.sectionTitle}>Günün Parçaları</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveTab('explore')}
                style={styles.seeAllBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.seeAllText}>Tümü</Text>
                <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.trackList}>
              {quickPicks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onSelect={(t) => playTrack(t, quickPicks)}
                />
              ))}
            </View>

            {/* 7. Öne Çıkan Listeler & Mixler */}
            <PlaylistsCarousel onSelectMix={handleMixSelect} />

            {/* 8. Popüler Sanatçılar */}
            <ArtistsRow onSelectArtist={handleArtistSelect} />

            <View style={{ height: 130 }} />
          </ScrollView>
        ) : activeTab === 'explore' ? (
          /* ==================== EXPLORE TAB (RICH SEARCH & MOST PLAYED) ==================== */
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Search Input Bar with Neon Border */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={19} color="#FF0000" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="YouTube'da şarkı, sanatçı veya tür ara..."
                placeholderTextColor="#666666"
                value={query}
                onChangeText={handleQueryChange}
                onSubmitEditing={() => handleSearch()}
                returnKeyType="search"
              />
              {query ? (
                <TouchableOpacity
                  onPress={() => {
                    setQuery('');
                    setSuggestions([]);
                    setResults(ALL_CATALOG_TRACKS);
                  }}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={18} color="#8E8E93" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Live Auto-complete Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((item, idx) => (
                  <TouchableOpacity
                    key={`sug-${idx}`}
                    style={styles.suggestionRow}
                    onPress={() => handleSelectSuggestion(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="search-outline" size={14} color="#8E8E93" style={{ marginRight: 10 }} />
                    <Text style={styles.suggestionText} numberOfLines={1}>{item}</Text>
                    <Ionicons name="arrow-forward" size={13} color="#444444" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Filter Pills (All, Sık Dinlediklerin & Popular Search Tags) */}
            <View style={styles.filterPillsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                <TouchableOpacity
                  style={[styles.filterPill, exploreFilter === 'all' && styles.activeFilterPill]}
                  onPress={() => setExploreFilter('all')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterPillText, exploreFilter === 'all' && styles.activeFilterPillText]}>
                    ✨ Keşfet
                  </Text>
                </TouchableOpacity>

                {mostPlayed.length > 0 && (
                  <TouchableOpacity
                    style={[styles.filterPill, exploreFilter === 'most_played' && styles.activeFilterPill]}
                    onPress={() => {
                      setExploreFilter('most_played');
                      setQuery('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterPillText, exploreFilter === 'most_played' && styles.activeFilterPillText]}>
                      🔥 Sık Dinlediklerin ({mostPlayed.length})
                    </Text>
                  </TouchableOpacity>
                )}

                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.searchTagChip}
                    onPress={() => {
                      setExploreFilter('all');
                      setQuery(tag);
                      handleSearch(tag);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="flame" size={12} color="#FF0000" style={{ marginRight: 4 }} />
                    <Text style={styles.searchTagText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Filtered View: Sık Dinlediklerin Tab */}
            {exploreFilter === 'most_played' && !query.trim() ? (
              <View style={{ marginTop: 10 }}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionSubtitle}>SENİN ÇALMA GEÇMİŞİN</Text>
                    <Text style={styles.sectionTitle}>🔥 En Çok Dinlediğin Şarkılar</Text>
                  </View>
                </View>

                {mostPlayed.map((item, index) => (
                  <TrackCard
                    key={`mp-${item.id}-${index}`}
                    track={item}
                    rank={index + 1}
                    onSelect={(t) => playTrack(t, mostPlayed)}
                  />
                ))}
              </View>
            ) : loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF0000" />
                <Text style={styles.loadingText}>YouTube'dan canlı müzikler çekiliyor...</Text>
              </View>
            ) : query.trim() ? (
              /* Active Search Results */
              <View style={{ marginTop: 10 }}>
                <View style={styles.resultsHeaderRow}>
                  <Text style={styles.resultsHeader}>
                    "{query}" Sonuçları ({results.length})
                  </Text>
                  <Text style={styles.liveBadge}>CANLI YOUTUBE</Text>
                </View>

                {results.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <Ionicons name="musical-note-outline" size={40} color="#444444" />
                    <Text style={[styles.loadingText, { marginTop: 8 }]}>Sonuç bulunamadı</Text>
                  </View>
                ) : (
                  results.map((item, index) => (
                    <TrackCard
                      key={`${item.id}-${index}`}
                      track={item}
                      rank={index + 1}
                      onSelect={(t) => playTrack(t, results)}
                    />
                  ))
                )}
              </View>
            ) : (
              /* Default Explore View with User's Top Played + Discover */
              <View style={{ marginTop: 6 }}>
                {/* 1. Sık Dinlediklerin Preview (If user has history) */}
                {mostPlayed.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <View style={styles.sectionHeaderRow}>
                      <View>
                        <Text style={styles.sectionSubtitle}>SENİN POPÜLERLERİN</Text>
                        <Text style={styles.sectionTitle}>🔥 En Çok Dinlediklerin</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setExploreFilter('most_played')}
                        style={styles.seeAllBtn}
                      >
                        <Text style={styles.seeAllText}>Tümü ({mostPlayed.length})</Text>
                        <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
                      </TouchableOpacity>
                    </View>

                    {mostPlayed.slice(0, 4).map((item, index) => (
                      <TrackCard
                        key={`home-mp-${item.id}-${index}`}
                        track={item}
                        rank={index + 1}
                        onSelect={(t) => playTrack(t, mostPlayed)}
                      />
                    ))}
                  </View>
                )}

                <CategoriesGrid onSelectCategory={handleCategorySelect} />

                <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
                  <View>
                    <Text style={styles.sectionSubtitle}>KEŞFET</Text>
                    <Text style={styles.sectionTitle}>Trend Öneriler</Text>
                  </View>
                </View>

                {ALL_CATALOG_TRACKS.slice(0, 8).map((item, index) => (
                  <TrackCard
                    key={`${item.id}-${index}`}
                    track={item}
                    rank={index + 1}
                    onSelect={(t) => playTrack(t, ALL_CATALOG_TRACKS)}
                  />
                ))}
              </View>
            )}

            <View style={{ height: 130 }} />
          </ScrollView>
        ) : (
          /* ==================== LIBRARY TAB ==================== */
          <OfflineLibrary />
        )}
      </View>

      {/* Floating Mini Player (Smooth Oval Capsule) */}
      <MiniPlayer onOpenModal={() => setPlayerModalOpen(true)} />

      {/* Floating Bottom Navigation Bar Dock */}
      <View style={styles.bottomNavDock}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'home' && styles.activeNavItem]}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.75}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={19}
            color={activeTab === 'home' ? '#FF0000' : '#8E8E93'}
          />
          <Text style={[styles.navLabel, activeTab === 'home' && styles.activeNavLabel]}>
            Ana Sayfa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'explore' && styles.activeNavItem]}
          onPress={() => setActiveTab('explore')}
          activeOpacity={0.75}
        >
          <Ionicons
            name={activeTab === 'explore' ? 'search' : 'search-outline'}
            size={19}
            color={activeTab === 'explore' ? '#FF0000' : '#8E8E93'}
          />
          <Text style={[styles.navLabel, activeTab === 'explore' && styles.activeNavLabel]}>
            Keşfet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'library' && styles.activeNavItem]}
          onPress={() => setActiveTab('library')}
          activeOpacity={0.75}
        >
          <Ionicons
            name={activeTab === 'library' ? 'library' : 'library-outline'}
            size={19}
            color={activeTab === 'library' ? '#FF0000' : '#8E8E93'}
          />
          <Text style={[styles.navLabel, activeTab === 'library' && styles.activeNavLabel]}>
            Kitaplık
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full-Screen Music Player Modal */}
      <PlayerModal
        visible={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
      />

      {/* Audio Equalizer & Sound Mode Dialog */}
      <SoundModeModal
        visible={soundModeModalOpen}
        onClose={() => setSoundModeModalOpen(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <MainScreen />
    </PlayerProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#070709',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  greetingContainer: {
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  greetingTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    color: '#77777D',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  filterPillsWrapper: {
    marginVertical: 10,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 16,
  },
  filterPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeFilterPill: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterPillText: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '600',
  },
  activeFilterPillText: {
    color: '#000000',
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionSubtitle: {
    color: '#77777D',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  seeAllText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  trackList: {
    width: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearBtn: {
    padding: 4,
  },
  searchTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchTagText: {
    color: '#DDDDDD',
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 10,
  },
  resultsHeader: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  liveBadge: {
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    color: '#FF0000',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  suggestionsContainer: {
    backgroundColor: '#16161B',
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  suggestionText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  topPlayedCompiledSection: {
    marginTop: 14,
    marginBottom: 6,
  },
  miniPillToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  miniToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
  },
  activeMiniToggleBtn: {
    backgroundColor: '#FF0000',
  },
  miniToggleText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
  },
  activeMiniToggleText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyTopPlayedCard: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  emptyTopPlayedTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyTopPlayedSubtitle: {
    color: '#77777D',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  bottomNavDock: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18, 18, 22, 0.95)',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  activeNavItem: {
    backgroundColor: 'rgba(255, 0, 0, 0.12)',
  },
  navLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  activeNavLabel: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
});
