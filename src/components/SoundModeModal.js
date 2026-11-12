// SoundModeModal.js - Audio Equalizer & Sound Mode Modal with rounded pills
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SOUND_MODES = [
  { id: 'standard', name: 'Standart (Dengeli)', desc: 'Doğal stüdyo kaydı ve dengeli tonlar', icon: 'musical-notes', color: '#00E5FF' },
  { id: 'bass', name: 'Bass Boost 🔊', desc: 'Derin ve güçlü alt frekanslar (+6dB)', icon: 'volume-high', color: '#FF0055' },
  { id: 'vocal', name: 'Vokal & Akustik 🎤', desc: 'Net ve öne çıkan vokal detayları', icon: 'mic', color: '#FF9100' },
  { id: 'cinema', name: 'Sinematik 3D 🎬', desc: 'Genişletilmiş stereo sahnesi ve atmosferik derinlik', icon: 'headset', color: '#7C4DFF' },
  { id: 'night', name: 'Gece Modu 🌙', desc: 'Yumuşatılmış tizler ve rahat dinleme', icon: 'moon', color: '#00E676' },
];

export default function SoundModeModal({ visible, onClose }) {
  const [selectedMode, setSelectedMode] = useState('standard');

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="options-outline" size={20} color="#FF0000" />
              </View>
              <View>
                <Text style={styles.title}>Ses Profili & Ekolayzer</Text>
                <Text style={styles.subtitle}>Dinleme deneyimini özelleştir</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#AAAAAA" />
            </TouchableOpacity>
          </View>

          <View style={styles.modesList}>
            {SOUND_MODES.map((mode) => {
              const isSelected = selectedMode === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.modeItem, isSelected && styles.activeModeItem]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMode(mode.id)}
                >
                  <View style={[styles.modeIconCircle, { backgroundColor: mode.color + '22' }]}>
                    <Ionicons name={mode.icon} size={18} color={mode.color} />
                  </View>

                  <View style={styles.modeTextCol}>
                    <Text style={[styles.modeName, isSelected && styles.activeModeName]}>
                      {mode.name}
                    </Text>
                    <Text style={styles.modeDesc}>{mode.desc}</Text>
                  </View>

                  <View style={[styles.radioCircle, isSelected && styles.activeRadioCircle]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
            <Text style={styles.confirmBtnText}>Uygula ve Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#18181C',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 0, 0, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modesList: {
    gap: 8,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeModeItem: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: 'rgba(255, 0, 0, 0.4)',
  },
  modeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modeTextCol: {
    flex: 1,
  },
  modeName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  activeModeName: {
    color: '#FF0000',
  },
  modeDesc: {
    color: '#8E8E93',
    fontSize: 11,
    lineHeight: 15,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#555555',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  activeRadioCircle: {
    borderColor: '#FF0000',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF0000',
  },
  confirmBtn: {
    marginTop: 18,
    backgroundColor: '#FF0000',
    paddingVertical: 13,
    borderRadius: 999,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
