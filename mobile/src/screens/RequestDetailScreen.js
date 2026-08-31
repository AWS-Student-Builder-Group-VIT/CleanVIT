import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { requestsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

export default function RequestDetailScreen({ route, navigation }) {
  const { requestId } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequest = async () => {
    try {
      const res = await requestsAPI.getById(requestId);
      setRequest(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load request details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
    const interval = setInterval(fetchRequest, 15000);
    return () => clearInterval(interval);
  }, [requestId]);

  const handleClose = async () => {
    Alert.alert('Confirm', 'Mark this cleaning as done?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Done',
        onPress: async () => {
          setActionLoading(true);
          try {
            await requestsAPI.close(requestId);
            fetchRequest();
            Alert.alert('Success', 'Request marked as done!');
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to close request');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleReraise = async () => {
    Alert.alert('Re-raise Request', 'Create a new request for the same room?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Re-raise',
        onPress: async () => {
          setActionLoading(true);
          try {
            await requestsAPI.reraise(requestId, {});
            Alert.alert('Success', 'Request re-raised!');
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to re-raise');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accentPrimary} />
      </View>
    );
  }

  if (!request) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header card */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{request.cleaningType}</Text>
          <StatusBadge status={request.status} />
        </View>

        <View style={styles.infoGrid}>
          <InfoRow label="Room" value={request.roomNo} />
          <InfoRow label="Block" value={request.block?.name} />
          <InfoRow label="Student" value={request.student?.name} />
          <InfoRow label="Reg No" value={request.student?.regNo} />
          {request.assignedStaff && (
            <InfoRow label="Assigned Staff" value={request.assignedStaff.name} />
          )}
          {request.comment && <InfoRow label="Comment" value={request.comment} />}
        </View>
      </View>

      {/* Timeline card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <TimelineItem label="Created" date={formatDate(request.createdAt)} active />
        {request.assignedAt && (
          <TimelineItem label="Assigned" date={formatDate(request.assignedAt)} active />
        )}
        {request.resolvedAt && (
          <TimelineItem
            label={request.resolutionType === 'COMPLETED' ? 'Completed' : 'Failed'}
            date={formatDate(request.resolvedAt)}
            active
            color={request.resolutionType === 'COMPLETED' ? COLORS.success : COLORS.danger}
          />
        )}
        {request.studentConfirmedAt && (
          <TimelineItem label="Confirmed Done" date={formatDate(request.studentConfirmedAt)} active color={COLORS.success} />
        )}
      </View>

      {/* Failure details */}
      {request.status === 'FAILED' && (
        <View style={[styles.card, { borderColor: COLORS.danger }]}>
          <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>Failure Details</Text>
          {request.resolutionNote && (
            <Text style={styles.failReason}>Reason: {request.resolutionNote}</Text>
          )}
          {request.resolutionPhotoUrl && (
            <Image
              source={{ uri: request.resolutionPhotoUrl }}
              style={styles.failPhoto}
              resizeMode="cover"
            />
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {request.status === 'COMPLETED' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.successBtn, actionLoading && styles.btnDisabled]}
            onPress={handleClose}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.actionBtnText}>✓ Mark as Done</Text>
            )}
          </TouchableOpacity>
        )}

        {request.status === 'FAILED' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.warningBtn, actionLoading && styles.btnDisabled]}
            onPress={handleReraise}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.actionBtnText}>↻ Re-raise Request</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

function TimelineItem({ label, date, active, color }) {
  return (
    <View style={styles.timelineItem}>
      <View style={[styles.timelineDot, active && { backgroundColor: color || COLORS.accentPrimary }]} />
      <View style={styles.timelineContent}>
        <Text style={styles.timelineLabel}>{label}</Text>
        <Text style={styles.timelineDate}>{date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgPrimary },
  content: { padding: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgPrimary },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
  },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginRight: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  infoGrid: {},
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  infoLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '600' },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.textMuted, marginTop: 4, marginRight: SPACING.md,
  },
  timelineContent: {},
  timelineLabel: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '600' },
  timelineDate: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  failReason: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, marginBottom: SPACING.md },
  failPhoto: { width: '100%', height: 200, borderRadius: BORDER_RADIUS.md },
  actions: { marginTop: SPACING.sm },
  actionBtn: {
    borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md,
    alignItems: 'center', marginBottom: SPACING.md,
  },
  successBtn: { backgroundColor: COLORS.success },
  warningBtn: { backgroundColor: COLORS.statusPending },
  btnDisabled: { opacity: 0.6 },
  actionBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.white },
});
