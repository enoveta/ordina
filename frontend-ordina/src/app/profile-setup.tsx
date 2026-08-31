import { router } from 'expo-router';
import { href } from '@/utils/href';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';

const QUESTIONS = [
  { key: 'name', title: 'What is your name?', hint: 'ORDINA will greet you personally.' },
  { key: 'age', title: 'How old are you?', hint: 'This stays private and helps plan your day.' },
  { key: 'gender', title: 'What is your gender?', hint: 'Optional — skip if you prefer not to say.' },
  { key: 'goals', title: 'What do you want to do with ORDINA?', hint: 'Pick everything that fits.' },
] as const;

const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const GOALS = [
  'Organize tasks',
  'Plan my schedule',
  'Use the AI assistant',
  'Track goals',
  'Stay on time with reminders',
  'Reduce overwhelm',
];

export default function ProfileSetupScreen() {
  const theme = useTheme();
  const { draft, setDraft, completeQuestions, skipQuestions } = useAuthStore();
  const [step, setStep] = useState(0);
  const question = QUESTIONS[step];

  async function next() {
    if (step < QUESTIONS.length - 1) {
      setStep((v) => v + 1);
      return;
    }
    await completeQuestions(draft);
    router.replace(href('/sign-up'));
  }

  async function skip() {
    await skipQuestions();
    router.replace(href('/sign-up'));
  }

  function toggleGoal(goal: string) {
    const goals = draft.goals.includes(goal)
      ? draft.goals.filter((g) => g !== goal)
      : [...draft.goals, goal];
    setDraft({ goals });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.top}>
        <BackButton
          fallback="/onboarding"
          onPress={() => {
            if (step > 0) {
              setStep((v) => v - 1);
              return;
            }
            if (router.canGoBack()) router.back();
            else router.replace(href('/onboarding'));
          }}
        />
        <Pressable onPress={() => void skip()}>
          <ThemedText style={{ color: theme.primary }}>Skip</ThemedText>
        </Pressable>
      </View>

      <ThemedText themeColor="textSecondary" style={styles.progress}>
        {step + 1} of {QUESTIONS.length}
      </ThemedText>
      <ThemedText style={styles.title}>{question.title}</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.hint}>
        {question.hint}
      </ThemedText>

      <View style={styles.body}>
        {question.key === 'name' ? (
          <TextInput
            value={draft.name}
            onChangeText={(name) => setDraft({ name })}
            placeholder="Your name"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
          />
        ) : null}
        {question.key === 'age' ? (
          <TextInput
            value={draft.age}
            onChangeText={(age) => setDraft({ age })}
            placeholder="Age"
            keyboardType="number-pad"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
          />
        ) : null}
        {question.key === 'gender' ? (
          <View style={styles.wrap}>
            {GENDERS.map((item) => {
              const active = draft.gender === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setDraft({ gender: item })}
                  style={[
                    styles.choice,
                    {
                      backgroundColor: active ? theme.primary : theme.card,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}>
                  <ThemedText style={{ color: active ? theme.onPrimary : theme.text }}>{item}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {question.key === 'goals' ? (
          <View style={styles.wrap}>
            {GOALS.map((item) => {
              const active = draft.goals.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => toggleGoal(item)}
                  style={[
                    styles.choice,
                    {
                      backgroundColor: active ? theme.primary : theme.card,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}>
                  <ThemedText style={{ color: active ? theme.onPrimary : theme.text }}>{item}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <PrimaryButton label={step === QUESTIONS.length - 1 ? 'Continue' : 'Next'} onPress={() => void next()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 24, paddingBottom: 20 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  progress: { marginTop: 20, fontSize: 13 },
  title: { fontSize: 26, fontFamily: 'Poppins_700Bold', marginTop: 8 },
  hint: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  body: { flex: 1, paddingTop: 24 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16 },
  wrap: { gap: 10 },
  choice: { borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
});
