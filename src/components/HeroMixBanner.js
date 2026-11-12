// HeroMixBanner.js - Sleek rounded YouTube Music "My Supermix" Hero Banner
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HeroMixBanner({ onPlaySupermix }) {
  return (
    <View style={styles.container}>
      <View style={styles.gradientCard}>
        <View style={styles.glowCircle} />

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={12} color="#FF2222" />
            <Text style={styles.badgeText}>SANA ÖZEL SÜPER KARIŞIK</Text>
          </View>
        </View>

        <Text style={styles.title}>Senin Müzik Dünyan</Text>
        <Text style={styles.subtitle}>En çok dinlediğin türler, sanatçılar ve keşiflerin tek bir sonsuz akışta.</Text>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.playBtn} activeOpacity={0.82} onPress={onPlaySupermix}>
            <Ionicons name="play" size={17} color="#FFFFFF" style={{ marginLeft: 2 }} />
            <Text style={styles.playBtnText}>Karışık Çal</Text>
          </TouchableOpacity>

          <View style={styles.statsPill}>
            <Ionicons name="infinite" size={14} color="#AAAAAA" />
            <Text style={styles.statsText}>Kesintisiz • Reklamsız</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  gradientCard: {
    backgroundColor: '#1C1414',
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 40, 40, 0.25)',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  glowCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 0, 0, 0.16)',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 0, 0, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  badgeText: {
    color: '#FF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#9E9EA4',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: '90%',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF0000',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 999,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statsText: {
    color: '#9E9EA4',
    fontSize: 11,
    fontWeight: '600',
  },
});
