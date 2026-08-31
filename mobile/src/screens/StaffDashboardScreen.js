import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, RefreshControl, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { requestsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FAIL_REASONS } from '../theme';

export default function StaffDashboardScreen() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fail modal
  const [showFailModal, setShowFailModal] = useState(false);
  const [failRequest, setFailRequest] = useState(null);
  const [failReason, setFailReason] = useState('');
  const [failPhoto, setFailPhoto] = useState(null);
  const [showReasonPicker, setShowReasonPicker] = useState(false);

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

  const handleStart = async (id) => {
    setActionLoading(true);
    try {
      await requestsAPI.start(id);
      fetchRequests();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (id) => {
    Alert.alert('Confirm', 'Mark this cleaning as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          setActionLoading(true);
          try {
            await requestsAPI.complete(id);
            fetchRequests();
            Alert.alert('Success', 'Cleaning marked as completed!');
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to complete');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const openFailModal = (request) => {
    setFailRequest(request);
    setFailReason('');
    setFailPhoto(null);
    setShowFailModal(true);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: true,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setFailPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.5,
      base64: true,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setFailPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleFail = async () => {
    if (!failReason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }

    setActionLoading(true);
    try {
      await requestsAPI.fail(failRequest.id, {
        resolutionNote: failReason,
        resolutionPhotoUrl: failPhoto || undefined,
      });
      setShowFailModal(false);
      fetchRequests();
      Alert.alert('Done', 'Request marked as failed');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit');
    } finally {
      setActionLoading(false);
    }
  };

  const renderRequest = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.cleaningType}</Text>
          <Text style={styles.cardSub}>
            Room {item.roomNo} · {item.block?.name} · {item.student?.name}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {item.comment && <Text style={styles.comment}>{item.comment}</Text>}

      <View style={styles.cardActions}>
        {item.status === 'ASSIGNED' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.startBtn]}
            onPress={() => handleStart(item.id)}
            disabled={actionLoading}
          >
            <Text style={styles.actionBtnText}>▶ Start Cleaning</Text>
          </TouchableOpacity>
        )}

        {(item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS') && (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn]}
              onPress={() => handleComplete(item.id)}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>✓ Mark Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.failBtn]}
              onPress={() => openFailModal(item)}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>✕ Mark Failed</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Staff Dashboard</Text>
          <Text style={styles.subGreeting}>{user?.name} · {user?.blockName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accentPrimary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
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
              <Text style={styles.emptyText}>No assigned tasks</Text>
              <Text style={styles.emptySubText}>You'll see tasks here when assigned by the warden</Text>
            </View>
          }
        />
      )}

      {/* Fail Modal */}
      <Modal visible={showFailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Failure</Text>
            {failRequest && (
              <Text style={styles.modalSub}>
                {failRequest.cleaningType} · Room {failRequest.roomNo}
              </Text>
            )}

            <Text style={styles.label}>Reason</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowReasonPicker(!showReasonPicker)}
            >
              <Text style={failReason ? styles.inputText : styles.placeholderText}>
                {failReason || 'Select reason'}
              </Text>
            </TouchableOpacity>
            {showReasonPicker && (
              <View style={styles.pickerDropdown}>
                {FAIL_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.pickerItem, failReason === r && styles.pickerItemActive]}
                    onPress={() => { setFailReason(r); setShowReasonPicker(false); }}
                  >
                    <Text style={[styles.pickerItemText, failReason === r && styles.pickerItemTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Photo Proof</Text>
            <View style={styles.photoRow}>
              <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
                <Text style={styles.photoBtnText}>📷 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
                <Text style={styles.photoBtnText}>🖼 Gallery</Text>
              </TouchableOpacity>
            </View>

            {failPhoto && (
              <Image source={{ uri: failPhoto }} style={styles.photoPreview} resizeMode="cover" />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowFailModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, actionLoading && styles.btnDisabled]}
                onPress={handleFail}
                disabled={actionLoading}
              >
                {actionLoading ? (
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
  list: { padding: SPACING.md, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: SPACING.xxl },
  emptyText: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptySubText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: SPACING.xs, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  cardSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  comment: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: SPACING.sm, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, flexWrap: 'wrap' },
  actionBtn: { flex: 1, paddingVertical: SPACING.sm + 2, borderRadius: BORDER_RADIUS.md, alignItems: 'center', minWidth: 100 },
  startBtn: { backgroundColor: COLORS.statusAssigned },
  completeBtn: { backgroundColor: COLORS.success },
  failBtn: { backgroundColor: COLORS.danger },
  actionBtnText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.white },
  modalOverlay: { flex: 1, backgroundColor: COLORS.bgOverlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.bgSecondary, borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xxl,
  },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  modalSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.md },
  input: {
    backgroundColor: COLORS.bgInput, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 4,
    borderWidth: 1, borderColor: COLORS.borderLight, minHeight: 48, justifyContent: 'center',
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
  photoRow: { flexDirection: 'row', gap: SPACING.md },
  photoBtn: {
    flex: 1, paddingVertical: SPACING.sm + 4, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  photoBtnText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  photoPreview: { width: '100%', height: 180, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.md },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  cancelModalBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.danger, alignItems: 'center' },
  submitBtnText: { fontSize: FONT_SIZES.md, color: COLORS.white, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
