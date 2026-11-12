// ArtistsRow.js - YouTube Music Top Artists Circular Row
import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { TOP_ARTISTS } from '../services/musicApi';

export default function ArtistsRow({ onSelectArtist }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>En Çok Dinlenen Sanatçılar</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {TOP_ARTISTS.map((artist) => (
          <TouchableOpacity
            key={artist.id}
            style={styles.artistItem}
            activeOpacity={0.7}
            onPress={() => onSelectArtist(artist.query)}
          >
            <View style={styles.avatarBorder}>
              <Image source={{ uri: artist.image }} style={styles.avatar} />
            </View>
            <Text style={styles.artistName} numberOfLines={1}>{artist.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scroll: {
    gap: 14,
    paddingRight: 16,
  },
  artistItem: {
    alignItems: 'center',
    width: 74,
  },
  avatarBorder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    borderWidth: 2,
    borderColor: '#333333',
    backgroundColor: '#1E1E1E',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  artistName: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
});
