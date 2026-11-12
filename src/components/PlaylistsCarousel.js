// PlaylistsCarousel.js - Oval & Rounded YouTube Music Mixes & Playlists
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CURATED_MIXES } from '../services/musicApi';

export default function PlaylistsCarousel({ onSelectMix }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.subtitle}>GÖZ AT</Text>
        <Text style={styles.title}>Öne Çıkan Çalma Listeleri</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {CURATED_MIXES.map((mix) => (
          <TouchableOpacity
            key={mix.id}
            style={[styles.card, { borderColor: mix.color + '35' }]}
            activeOpacity={0.8}
            onPress={() => onSelectMix(mix)}
          >
            <View style={[styles.cardTop, { backgroundColor: mix.color + '22' }]}>
              <View style={[styles.iconCircle, { backgroundColor: mix.color }]}>
                <Ionicons name={mix.icon} size={20} color="#FFFFFF" />
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{mix.tag}</Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <Text style={styles.cardTitle} numberOfLines={1}>{mix.title}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>{mix.subtitle}</Text>
            </View>
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
  subtitle: {
    color: '#8E8E93',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 2,
  },
  scroll: {
    gap: 12,
    paddingRight: 16,
  },
  card: {
    width: 155,
    backgroundColor: '#16161A',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTop: {
    height: 95,
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBottom: {
    padding: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardSubtitle: {
    color: '#8E8E93',
    fontSize: 11,
    lineHeight: 15,
  },
});
