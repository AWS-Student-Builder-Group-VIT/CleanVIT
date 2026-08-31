import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { blocksAPI } from '../services/api';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

export default function LoginScreen({ navigation }) {
  const [mode, setMode] = useState('student');
  const [regNo, setRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [blockId, setBlockId] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    blocksAPI.getAll()
      .then((res) => setBlocks(res.data))
      .catch((err) => console.error('Failed to load blocks:', err));
  }, []);

  const selectedBlock = blocks.find(b => b.id === blockId);

  const handleLogin = async () => {
    if (mode === 'student' && (!regNo || !password)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (mode === 'staff' && (!email || !password || !blockId)) {
      Alert.alert('Error', 'Please fill in all fields including block selection');
      return;
    }

    setLoading(true);
    try {
      const credentials = mode === 'student'
        ? { regNo, password }
        : { email, password, blockId };
      await login(credentials);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Please check your credentials');
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
        {/* Logo */}
        <View style={styles.logo}>
          <Text style={styles.logoText}>CleanTrack</Text>
          <Text style={styles.logoSub}>Room Cleaning Request System</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Mode toggle */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'student' && styles.modeBtnActive]}
              onPress={() => setMode('student')}
            >
              <Text style={[styles.modeBtnText, mode === 'student' && styles.modeBtnTextActive]}>
                Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'staff' && styles.modeBtnActive]}
              onPress={() => setMode('staff')}
            >
              <Text style={[styles.modeBtnText, mode === 'staff' && styles.modeBtnTextActive]}>
                Staff / Warden
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'student' ? (
            <>
              <Text style={styles.label}>Registration Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 22BCE1234"
                placeholderTextColor={COLORS.textMuted}
                value={regNo}
                onChangeText={setRegNo}
                autoCapitalize="characters"
              />
            </>
          ) : (
            <>
              {/* Block picker */}
              <Text style={styles.label}>Block</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowBlockPicker(!showBlockPicker)}
              >
                <Text style={selectedBlock ? styles.inputText : styles.placeholderText}>
                  {selectedBlock ? `${selectedBlock.name} (${selectedBlock.type.toLowerCase()})` : 'Select your block'}
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

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. supervisor.a@cleantrack.app"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </>
          )}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {mode === 'student' && (
            <TouchableOpacity
              style={styles.link}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkHighlight}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          )}
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
  modeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: COLORS.accentPrimary,
    borderColor: COLORS.accentPrimary,
  },
  modeBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeBtnTextActive: {
    color: COLORS.white,
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
