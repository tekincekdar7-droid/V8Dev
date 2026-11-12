// CategoriesGrid.js - Spotify & YouTube Music style 2-column colorful rounded cards
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXPLORE_CATEGORIES } from '../services/musicApi';

export default function CategoriesGrid({ onSelectCategory }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>TÜRLER VE RUH HALLERİ</Text>
        <Text style={styles.title}>Hepsine Göz At</Text>
      </View>

      <View style={styles.grid}>
        {EXPLORE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.tile, { backgroundColor: cat.color }]}
            activeOpacity={0.8}
            onPress={() => onSelectCategory(cat.query)}
          >
            <Text style={styles.tileTitle}>{cat.title}</Text>
            <View style={styles.iconCircle}>
              <Ionicons name={cat.icon || 'musical-notes'} size={24} color="rgba(255, 255, 255, 0.9)" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 20,
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  tile: {
    width: '48.5%',
    height: 86,
    borderRadius: 22,
    padding: 14,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  tileTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    width: '75%',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  iconCircle: {
    position: 'absolute',
    bottom: -6,
    right: -4,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '15deg' }],
    opacity: 0.85,
  },
});
