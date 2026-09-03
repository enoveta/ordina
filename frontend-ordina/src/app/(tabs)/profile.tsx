/**
 * ORDINA Profile & Settings Screen
 * Matches the dark-mode mockup (light mode default).
 * Shows: user avatar, name, email, preferences, AI settings, notifications.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { href } from '@/utils/href';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import type { ThemePreference } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppTheme } from '@/providers/theme-provider';
import { useAuthStore } from '@/store/auth-store';

interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

function SettingRow({ label, value, onPress, showChevron = true }: SettingRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: theme.border }]}
    >
      <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      <View style={styles.settingRight}>
        {value && (
          <ThemedText themeColor="textSecondary" style={styles.settingValue}>
            {value}
          </ThemedText>
        )}
        {showChevron && (
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        )}
      </View>
    </Pressable>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}

function ToggleRow({ label, value, onToggle }: ToggleRowProps) {
  const theme = useTheme();
  return (
    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
      <ThemedText style={styles.settingLabel}>{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <ThemedText
      style={[styles.sectionLabel, { color: theme.textSecondary }]}
      themeColor="textSecondary"
    >
      {title}
    </ThemedText>
  );
}

const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export default function ProfileScreen() {
  const theme = useTheme();
  const { preference, setPreference } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Top right settings icon */}
      <View style={styles.topBar}>
        <ThemedText style={styles.screenTitle}>Profile & Settings</ThemedText>
        <Pressable hitSlop={8}>
          <Ionicons name="settings-outline" size={22} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}
      >
        {/* User card */}
        <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.avatarText}>S</ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.userName}>{user?.name ?? 'Sarah Mitchell'}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.userEmail}>
              {user?.email ?? 'sarah.m@ordina-ai.com'}
            </ThemedText>
            <Pressable>
              <ThemedText style={[styles.editProfile, { color: theme.primary }]}>
                Edit Profile
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Preferences */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SectionLabel title="PREFERENCES" />
          <View style={styles.themeRow}>
            <ThemedText style={styles.settingLabel}>Theme</ThemedText>
            <View style={[styles.themeOptions, { backgroundColor: theme.backgroundElement }]}>
              {(['light', 'dark', 'system'] as ThemePreference[]).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setPreference(option)}
                  style={[styles.themeOption, preference === option && { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={{ color: preference === option ? theme.onPrimary : theme.textSecondary, fontSize: 12 }}>
                    {THEME_LABELS[option]}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
          <SettingRow label="Default View" value="Calendar" />
          <SettingRow label="Start of Week" value="Monday" showChevron />
        </View>

        {/* AI Settings */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SectionLabel title="AI SETTINGS" />
          <ToggleRow label="AI Suggestions" value={true} onToggle={() => {}} />
          <SettingRow label="Voice Input Language" value="English (US)" />
          <ToggleRow label="Auto-schedule Tasks" value={false} onToggle={() => {}} />
        </View>

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SectionLabel title="NOTIFICATIONS" />
          <ToggleRow label="Task Reminders" value={true} onToggle={() => {}} />
          <ToggleRow label="Deadline Alerts" value={true} onToggle={() => {}} />
          <ToggleRow label="AI Scheduling Suggestions" value={true} onToggle={() => {}} />
          <SettingRow label="Notification Sound" value="Default" />
        </View>

        {/* Account */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SectionLabel title="ACCOUNT" />
          <SettingRow label="Privacy & Data" />
          <SettingRow label="Export Data" />
          <Pressable
            onPress={() => {
              void signOut().then(() => router.replace(href('/sign-in')));
            }}
            style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <ThemedText style={[styles.settingLabel, { color: theme.danger }]}>Sign Out</ThemedText>
          </Pressable>
        </View>

        {/* Notifications link */}
        <Pressable
          onPress={() => router.push(href('/notifications'))}
          style={[styles.notifLink, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="notifications-outline" size={20} color={theme.primary} />
          <ThemedText style={styles.notifLinkText}>View Notifications</ThemedText>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        </Pressable>
        <Pressable onPress={() => router.push(href('/goals'))} style={[styles.notifLink, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="flag-outline" size={20} color={theme.primary} />
          <ThemedText style={styles.notifLinkText}>Manage Goals</ThemedText>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        </Pressable>
        <Pressable onPress={() => router.push(href('/reminders'))} style={[styles.notifLink, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="alarm-outline" size={20} color={theme.primary} />
          <ThemedText style={styles.notifLinkText}>Manage Reminders</ThemedText>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        </Pressable>

        <ThemedText themeColor="textSecondary" style={styles.version}>
          ORDINA v1.0.0 • Put order in your day
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: 20, fontFamily: 'Poppins_600SemiBold' },
  scroll: { paddingHorizontal: 16, gap: 16, paddingTop: 8 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
  },
  userName: { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  userEmail: { fontSize: 13, marginTop: 1 },
  editProfile: { fontSize: 13, marginTop: 4, fontFamily: 'Poppins_500Medium' },
  section: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    paddingTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: 'Poppins_600SemiBold',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLabel: { fontSize: 15, fontFamily: 'Poppins_400Regular' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 14 },
  notifLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  notifLinkText: { flex: 1, fontSize: 15, fontFamily: 'Poppins_500Medium' },
  version: { fontSize: 12, textAlign: 'center', paddingBottom: 8 },
  themeRow: { gap: 10, paddingVertical: 12 },
  themeOptions: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 3 },
  themeOption: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
});
