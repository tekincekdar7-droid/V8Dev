// AddToPlaylistModal.js - Bottom sheet modal to add a track to custom user playlists
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCustomPlaylists, createPlaylist, addTrackToPlaylist } from '../services/playlistManager';

export default function AddToPlaylistModal({ visible, onClose, track }) {
  const [playlists, setPlaylists] = useState([]);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedMap, setAddedMap] = useState({});

  useEffect(() => {
    if (visible) {
      loadPlaylists();
      setShowCreateInput(false);
      setNewPlaylistName('');
      setAddedMap({});
    }
  }, [visible]);

  const loadPlaylists = async () => {
    const data = await getCustomPlaylists();
    setPlaylists(data);
  };

  const handleSelectPlaylist = async (playlist) => {
    if (!track) return;
    const success = await addTrackToPlaylist(playlist.id, track);
    if (success) {
      setAddedMap(prev => ({ ...prev, [playlist.id]: true }));
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleCreateNew = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen bir çalma listesi adı yazın.');
      return;
    }
    const created = await createPlaylist(newPlaylistName.trim());
    if (created) {
      if (track) {
        await addTrackToPlaylist(created.id, track);
      }
      setNewPlaylistName('');
      setShowCreateInput(false);
      await loadPlaylists();
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity style={styles.sheetContainer} activeOpacity={1}>
          {/* Header */}
          <View style={styles.dragBar} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Çalma Listesine Ekle</Text>
              {track && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {track.title}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* New Playlist Form */}
          {showCreateInput ? (
            <View style={styles.createInputRow}>
              <TextInput
                style={styles.createTextInput}
                placeholder="Çalma listesi adı..."
                placeholderTextColor="#666666"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
              />
              <TouchableOpacity onPress={handleCreateNew} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Oluştur</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.createNewBtn}
              onPress={() => setShowCreateInput(true)}
              activeOpacity={0.7}
            >
              <View style={styles.createIconCircle}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.createNewText}>Yeni Çalma Listesi Oluştur</Text>
            </TouchableOpacity>
          )}

          {/* Existing Playlists List */}
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {playlists.map((pl) => {
              const isAdded = addedMap[pl.id];
              return (
                <TouchableOpacity
                  key={pl.id}
                  style={styles.playlistRow}
                  onPress={() => handleSelectPlaylist(pl)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.playlistIconBox, { backgroundColor: pl.color || '#E50914' }]}>
                    <Ionicons name={pl.icon || "musical-notes"} size={20} color="#FFFFFF" />
                  </View>

                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName}>{pl.name}</Text>
                    <Text style={styles.playlistCount}>{pl.tracks?.length || 0} şarkı</Text>
                  </View>

                  {isAdded ? (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark-circle" size={22} color="#34C759" />
                    </View>
                  ) : (
                    <Ionicons name="add-circle-outline" size={22} color="#8E8E93" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#16161B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
    maxWidth: 240,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 0, 0, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
    marginBottom: 12,
  },
  createIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  createNewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  createInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  createTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  saveBtn: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  listContainer: {
    marginTop: 4,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  playlistIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  playlistCount: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },
  checkBadge: {
    padding: 2,
  },
});
