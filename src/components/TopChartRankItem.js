// TopChartRankItem.js - Oval & Rounded YouTube Music Top Charts item
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../services/playerContext';

export default function TopChartRankItem({ track, rank, onSelect }) {
  const { currentTrack, isPlaying } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;

  return (
    <TouchableOpacity
      style={[styles.container, isCurrent && styles.activeContainer]}
      activeOpacity={0.75}
      onPress={() => onSelect(track)}
    >
      <View style={[styles.rankBox, rank <= 3 && styles.topRankBox]}>
        <Text style={[styles.rankNumber, rank <= 3 && styles.topRankNumber]}>
          {rank}
        </Text>
      </View>

      <Image source={{ uri: track.thumbnail }} style={styles.thumb} />

      <View style={styles.info}>
        <Text style={[styles.title, isCurrent && styles.activeTitle]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist} {track.views ? `• ${track.views}` : ''}
        </Text>
      </View>

      <View style={styles.rightCircle}>
        {isCurrent ? (
          <Ionicons name={isPlaying ? "volume-high" : "pause"} size={16} color="#FF0000" />
        ) : (
          <Ionicons name="flame" size={15} color={rank <= 3 ? "#FF0000" : "#666666"} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.12)',
    borderColor: 'rgba(255, 0, 0, 0.4)',
  },
  rankBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topRankBox: {
    backgroundColor: 'rgba(255, 0, 0, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.4)',
  },
  rankNumber: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '800',
  },
  topRankNumber: {
    color: '#FF0000',
  },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#202024',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activeTitle: {
    color: '#FF0000',
    fontWeight: '700',
  },
  artist: {
    color: '#8E8E93',
    fontSize: 12,
  },
  rightCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});
