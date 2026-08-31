import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { blocksAPI } from '../services/api';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [blockId, setBlockId] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const { signup } = useAuth();

  useEffect(() => {
    blocksAPI.getAll()
      .then((res) => setBlocks(res.data))
      .catch((err) => console.error('Failed to load blocks:', err));
  }, []);

  const selectedBlock = blocks.find(b => b.id === blockId);

  const handleSignup = async () => {
    if (!name || !regNo || !password || !confirmPassword || !blockId || !roomNo) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup({ name, regNo, password, blockId, roomNo });
    } catch (err) {
      Alert.alert('Signup Failed', err.response?.data?.error || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>CleanTrack</Text>
          <Text style={styles.logoSub}>Create your student account</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Abhishek Kumar"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Registration Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 22BCE1234"
            placeholderTextColor={COLORS.textMuted}
            value={regNo}
            onChangeText={setRegNo}
            autoCapitalize="characters"
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 6 chars"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Confirm</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter"
                placeholderTextColor={COLORS.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Block picker */}
          <Text style={styles.label}>Block</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowBlockPicker(!showBlockPicker)}
          >
            <Text style={selectedBlock ? styles.inputText : styles.placeholderText}>
              {selectedBlock ? `${selectedBlock.name} (${selectedBlock.type.toLowerCase()})` : 'Select block'}
            </Text>
          </TouchableOpacity>
          {showBlockPicker && (
            <View style={styles.pickerDropdown}>
              {blocks.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.pickerItem, blockId === b.id && styles.pickerItemActive]}
                  onPress={() => { setBlockId(b.id); setShowBlockPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, blockId === b.id && styles.pickerItemTextActive]}>
                    {b.name} ({b.type.toLowerCase()})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Room Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 223"
            placeholderTextColor={COLORS.textMuted}
            value={roomNo}
            onChangeText={setRoomNo}
            keyboardType="default"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.link}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkHighlight}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  logo: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoText: {
    fontSize: FONT_SIZES.hero,
    fontWeight: '800',
    color: COLORS.accentPrimary,
    letterSpacing: 1,
  },
  logoSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfCol: {
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    minHeight: 48,
  },
  inputText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  placeholderText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  pickerDropdown: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pickerItemActive: {
    backgroundColor: COLORS.accentGlow,
  },
  pickerItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  pickerItemTextActive: {
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
  button: {
    backgroundColor: COLORS.accentPrimary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  link: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  linkText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  linkHighlight: {
    color: COLORS.accentPrimary,
    fontWeight: '700',
  },
});
