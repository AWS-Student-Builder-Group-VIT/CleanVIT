import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { requestsAPI } from '../services/api';
import RequestCard from '../components/RequestCard';
import StatusBadge from '../components/StatusBadge';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, CLEANING_TYPES } from '../theme';

export default function StudentDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cleaningType, setCleaningType] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await requestsAPI.getAll();
      setRequests(res.data);
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
    }, [])
  );

  const handleRaise = async () => {
    if (!cleaningType) {
      Alert.alert('Error', 'Please select a cleaning type');
      return;
    }

    setSubmitting(true);
    try {
      await requestsAPI.create({ cleaningType, comment: comment || undefined });
      setShowModal(false);
      setCleaningType('');
      setComment('');
      fetchRequests();
      Alert.alert('Success', 'Cleaning request raised successfully!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to raise request');
    } finally {
      setSubmitting(false);
    }
  };

  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>Room {user?.roomNo} · {user?.blockName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Status counters */}
      <View style={styles.counters}>
        {['PENDING', 'ASSIGNED', 'COMPLETED', 'FAILED'].map((s) => (
          <View key={s} style={styles.counterItem}>
            <Text style={styles.counterNum}>{statusCounts[s] || 0}</Text>
            <StatusBadge status={s} />
          </View>
        ))}
      </View>

      {/* Request List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accentPrimary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              showRoom={false}
              onPress={() => navigation.navigate('RequestDetail', { requestId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchRequests(); }}
              tintColor={COLORS.accentPrimary}
              colors={[COLORS.accentPrimary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No requests yet</Text>
              <Text style={styles.emptySubText}>Tap the button below to raise one!</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+ Raise Request</Text>
      </TouchableOpacity>

      {/* New Request Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Cleaning Request</Text>
            <Text style={styles.modalSub}>Room {user?.roomNo} · {user?.blockName}</Text>

            <Text style={styles.label}>Cleaning Type</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTypePicker(!showTypePicker)}
            >
              <Text style={cleaningType ? styles.inputText : styles.placeholderText}>
                {cleaningType || 'Select type'}
              </Text>
            </TouchableOpacity>
            {showTypePicker && (
              <View style={styles.pickerDropdown}>
                {CLEANING_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pickerItem, cleaningType === t && styles.pickerItemActive]}
                    onPress={() => { setCleaningType(t); setShowTypePicker(false); }}
                  >
                    <Text style={[styles.pickerItemText, cleaningType === t && styles.pickerItemTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Comment (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Any extra details..."
              placeholderTextColor={COLORS.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowModal(false); setCleaningType(''); setComment(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.buttonDisabled]}
                onPress={handleRaise}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, paddingTop: SPACING.xxl + 10,
  },
  greeting: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  subGreeting: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  logoutBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.danger,
  },
  logoutText: { fontSize: FONT_SIZES.sm, color: COLORS.danger, fontWeight: '600' },
  counters: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: SPACING.md, marginBottom: SPACING.md,
  },
  counterItem: { alignItems: 'center', gap: SPACING.xs },
  counterNum: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  list: { padding: SPACING.md, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: SPACING.xxl },
  emptyText: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptySubText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
  fab: {
    position: 'absolute', bottom: SPACING.lg, left: SPACING.lg, right: SPACING.lg,
    backgroundColor: COLORS.accentPrimary, borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md, alignItems: 'center',
    shadowColor: COLORS.accentPrimary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.white },
  modalOverlay: {
    flex: 1, backgroundColor: COLORS.bgOverlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.bgSecondary, borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  modalSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.md },
  label: {
    fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary,
    marginBottom: SPACING.xs, marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.bgInput, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 4,
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.borderLight, minHeight: 48,
    justifyContent: 'center',
  },
  inputText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  placeholderText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted },
  pickerDropdown: {
    backgroundColor: COLORS.bgCard, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.xs, overflow: 'hidden',
  },
  pickerItem: {
    paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  pickerItemActive: { backgroundColor: COLORS.accentGlow },
  pickerItemText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  pickerItemTextActive: { color: COLORS.accentPrimary, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  cancelBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  submitBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accentPrimary, alignItems: 'center',
  },
  submitBtnText: { fontSize: FONT_SIZES.md, color: COLORS.white, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
});
