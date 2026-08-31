import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { requestsAPI, usersAPI } from '../services/api';
import RequestCard from '../components/RequestCard';
import StatusBadge from '../components/StatusBadge';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

const FILTER_TABS = ['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];

export default function SupervisorDashboardScreen() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [staff, setStaff] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const fetchRequests = async () => {
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const res = await requestsAPI.getAll(params);
      setRequests(res.data);
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await usersAPI.getStaff(user.blockId);
      setStaff(res.data);
    } catch (err) {
      console.error('Fetch staff error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
      fetchStaff();
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
    }, [filter])
  );

  const handleAssign = async (staffId) => {
    if (!selectedRequest) return;
    setAssigning(true);
    try {
      await requestsAPI.assign(selectedRequest.id, staffId);
      setShowAssignModal(false);
      setSelectedRequest(null);
      fetchRequests();
      Alert.alert('Success', 'Staff assigned successfully!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to assign staff');
    } finally {
      setAssigning(false);
    }
  };

  const openAssignModal = (request) => {
    setSelectedRequest(request);
    setShowAssignModal(true);
  };

  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, {});

  const renderRequest = ({ item }) => (
    <View>
      <RequestCard request={item} onPress={() => {}} />
      {(item.status === 'PENDING' || item.status === 'ASSIGNED') && (
        <TouchableOpacity
          style={styles.assignBtn}
          onPress={() => openAssignModal(item)}
        >
          <Text style={styles.assignBtnText}>
            {item.status === 'ASSIGNED' ? '↻ Reassign Staff' : '→ Assign Staff'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Warden Dashboard</Text>
          <Text style={styles.subGreeting}>{user?.blockName} · {statusCounts.total || 0} requests</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <FlatList
        horizontal
        data={FILTER_TABS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterTab, filter === item && styles.filterTabActive]}
            onPress={() => { setFilter(item); setLoading(true); }}
          >
            <Text style={[styles.filterTabText, filter === item && styles.filterTabTextActive]}>
              {item === 'ALL' ? 'All' : item.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Request list */}
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
              <Text style={styles.emptyText}>No requests found</Text>
            </View>
          }
        />
      )}

      {/* Assign Staff Modal */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Staff</Text>
            {selectedRequest && (
              <Text style={styles.modalSub}>
                {selectedRequest.cleaningType} · Room {selectedRequest.roomNo}
              </Text>
            )}

            {staff.length === 0 ? (
              <Text style={styles.noStaff}>No staff members found for this block</Text>
            ) : (
              staff.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.staffItem}
                  onPress={() => handleAssign(s.id)}
                  disabled={assigning}
                >
                  <View>
                    <Text style={styles.staffName}>{s.name}</Text>
                    <Text style={styles.staffEmail}>{s.email}</Text>
                  </View>
                  {assigning ? (
                    <ActivityIndicator size="small" color={COLORS.accentPrimary} />
                  ) : (
                    <Text style={styles.staffAssignText}>Assign</Text>
                  )}
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setShowAssignModal(false); setSelectedRequest(null); }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
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
  filterRow: { paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md },
  filterTab: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
  },
  filterTabActive: { backgroundColor: COLORS.accentPrimary, borderColor: COLORS.accentPrimary },
  filterTabText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'capitalize' },
  filterTabTextActive: { color: COLORS.white },
  list: { padding: SPACING.md, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: SPACING.xxl },
  emptyText: { fontSize: FONT_SIZES.lg, color: COLORS.textSecondary },
  assignBtn: {
    backgroundColor: COLORS.accentGlow, borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm, alignItems: 'center', marginTop: -SPACING.sm, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.accentPrimary,
  },
  assignBtnText: { fontSize: FONT_SIZES.sm, color: COLORS.accentPrimary, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: COLORS.bgOverlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.bgSecondary, borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xxl,
  },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  modalSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.lg },
  noStaff: { fontSize: FONT_SIZES.md, color: COLORS.textMuted, textAlign: 'center', marginVertical: SPACING.lg },
  staffItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  staffName: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '600' },
  staffEmail: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  staffAssignText: { fontSize: FONT_SIZES.sm, color: COLORS.accentPrimary, fontWeight: '700' },
  cancelBtn: {
    paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', marginTop: SPACING.lg,
  },
  cancelBtnText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
});
