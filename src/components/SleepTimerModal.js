// SleepTimerModal.js - Modern dialog to set a sleep timer
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../services/playerContext';

const OPTIONS = [
  { label: '15 Dakika', minutes: 15 },
  { label: '30 Dakika', minutes: 30 },
  { label: '45 Dakika', minutes: 45 },
  { label: '60 Dakika (1 Saat)', minutes: 60 },
  { label: 'Zamanlayıcıyı Kapat', minutes: null },
];

export default function SleepTimerModal({ visible, onClose }) {
  const { sleepTimerMinutes, setSleepTimer } = usePlayer();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="moon" size={22} color="#FF0000" />
            <Text style={styles.title}>Uyku Zamanlayıcısı</Text>
          </View>

          {OPTIONS.map((opt, idx) => {
            const isSelected = opt.minutes === sleepTimerMinutes;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.optionRow, isSelected && styles.activeOptionRow]}
                onPress={() => {
                  setSleepTimer(opt.minutes);
                  onClose();
                }}
              >
                <Text style={[styles.optionText, isSelected && styles.activeOptionText]}>
                  {opt.label}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={18} color="#FF0000" />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Vazgeç</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  activeOptionRow: {
    backgroundColor: 'rgba(255, 0, 0, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  optionText: {
    color: '#E0E0E0',
    fontSize: 15,
  },
  activeOptionText: {
    color: '#FF0000',
    fontWeight: 'bold',
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#9E9E9E',
    fontSize: 14,
    fontWeight: '600',
  },
});
