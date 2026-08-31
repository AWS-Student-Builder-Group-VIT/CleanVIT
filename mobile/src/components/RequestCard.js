import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import StatusBadge from './StatusBadge';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

export default function RequestCard({ request, onPress, showRoom = true }) {
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.type}>{request.cleaningType}</Text>
        <StatusBadge status={request.status} />
      </View>

      <View style={styles.details}>
        {showRoom && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Room</Text>
            <Text style={styles.detailValue}>{request.roomNo}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Block</Text>
          <Text style={styles.detailValue}>{request.block?.name || '—'}</Text>
        </View>
        {request.student && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Student</Text>
            <Text style={styles.detailValue}>{request.student.name}</Text>
          </View>
        )}
        {request.assignedStaff && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Staff</Text>
            <Text style={styles.detailValue}>{request.assignedStaff.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.time}>{timeAgo(request.createdAt)}</Text>
        {request.comment && (
          <Text style={styles.comment} numberOfLines={1}>
            {request.comment}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  type: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  details: {
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
  },
  time: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  comment: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    flex: 1,
    textAlign: 'right',
    marginLeft: SPACING.sm,
  },
});
