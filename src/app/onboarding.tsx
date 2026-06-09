import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';

import { AppColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useWeightLog } from '@/hooks/use-weight-log';
import { useOnboarding } from '@/hooks/use-onboarding';
import { storageGet, storageSet } from '@/lib/storage';

const NAME_KEY = '@user/name';

type Step = 'name' | 'weight' | 'goal' | 'height' | 'age' | 'gender' | 'activity' | 'done';

export default function OnboardingScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const { profile, updateProfile } = useUserProfile();
  const { addEntry } = useWeightLog();
  const { markComplete } = useOnboarding();

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');

  if (!fontsLoaded) return null;

  const STEPS: Step[] = ['name', 'weight', 'goal', 'height', 'age', 'gender', 'activity', 'done'];
  const stepIndex = STEPS.indexOf(step);
  const progressPct = stepIndex / (STEPS.length - 1);

  async function finish() {
    const w = parseFloat(weight);
    const g = parseFloat(goal);
    const h = parseFloat(height);
    const a = parseInt(age, 10);
    if (!isNaN(w)) await addEntry(w);
    updateProfile({
      weightKg: isNaN(w) ? 80 : w,
      heightCm: isNaN(h) ? 170 : h,
      ageYears: isNaN(a) ? 30 : a,
    });
    await storageSet(NAME_KEY, name.trim() || 'Friend');
    await markComplete();
  }

  function next() {
    const current = STEPS.indexOf(step);
    if (current < STEPS.length - 1) setStep(STEPS[current + 1]);
  }

  function back() {
    const current = STEPS.indexOf(step);
    if (current > 0) setStep(STEPS[current - 1]);
  }

  const canContinue = () => {
    if (step === 'name') return name.trim().length > 0;
    if (step === 'weight') return !isNaN(parseFloat(weight)) && parseFloat(weight) > 0;
    if (step === 'goal') return !isNaN(parseFloat(goal)) && parseFloat(goal) > 0;
    if (step === 'height') return !isNaN(parseFloat(height)) && parseFloat(height) > 0;
    if (step === 'age') return !isNaN(parseInt(age, 10));
    return true;
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
          </View>

          <View style={styles.body}>
            {step === 'name' && (
              <StepCard
                title="What's your name?"
                sub="Your coach will use this to personalize your experience.">
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={AppColors.muted}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => canContinue() && next()}
                />
              </StepCard>
            )}

            {step === 'weight' && (
              <StepCard title={`Hi ${name}! What's your current weight?`} sub="In kilograms.">
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g. 85"
                  placeholderTextColor={AppColors.muted}
                  keyboardType="decimal-pad"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => canContinue() && next()}
                />
                <Text style={styles.unit}>kg</Text>
              </StepCard>
            )}

            {step === 'goal' && (
              <StepCard title="What's your goal weight?" sub="The weight you want to reach.">
                <TextInput
                  style={styles.input}
                  value={goal}
                  onChangeText={setGoal}
                  placeholder="e.g. 70"
                  placeholderTextColor={AppColors.muted}
                  keyboardType="decimal-pad"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => canContinue() && next()}
                />
                <Text style={styles.unit}>kg</Text>
                {parseFloat(weight) > 0 && parseFloat(goal) > 0 && (
                  <Text style={styles.hint}>
                    That's {(parseFloat(weight) - parseFloat(goal)).toFixed(1)} kg to lose.
                  </Text>
                )}
              </StepCard>
            )}

            {step === 'height' && (
              <StepCard title="Your height?" sub="Used to calculate BMI and calorie targets.">
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="e.g. 170"
                  placeholderTextColor={AppColors.muted}
                  keyboardType="decimal-pad"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => canContinue() && next()}
                />
                <Text style={styles.unit}>cm</Text>
              </StepCard>
            )}

            {step === 'age' && (
              <StepCard title="How old are you?" sub="For accurate BMR calculation.">
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="e.g. 30"
                  placeholderTextColor={AppColors.muted}
                  keyboardType="number-pad"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => canContinue() && next()}
                />
                <Text style={styles.unit}>years</Text>
              </StepCard>
            )}

            {step === 'gender' && (
              <StepCard title="Gender?" sub="Affects BMR calculation.">
                <View style={styles.segmented}>
                  {(['male', 'female'] as const).map((g) => (
                    <Pressable
                      key={g}
                      style={[styles.segment, profile.gender === g && styles.segmentActive]}
                      onPress={() => updateProfile({ gender: g })}>
                      <Text style={[styles.segmentText, profile.gender === g && styles.segmentTextActive]}>
                        {g === 'male' ? '♂ Male' : '♀ Female'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </StepCard>
            )}

            {step === 'activity' && (
              <StepCard title="Activity level?" sub="Your typical daily activity.">
                <View style={styles.activityList}>
                  {(
                    [
                      ['sedentary', 'Desk job / mostly sitting'],
                      ['light', 'Light activity (1–2 days exercise)'],
                      ['moderate', 'Moderate (3–4 days exercise)'],
                      ['active', 'Very active (5+ days exercise)'],
                    ] as const
                  ).map(([val, label]) => (
                    <Pressable
                      key={val}
                      style={[styles.activityOption, profile.activityLevel === val && styles.activityOptionActive]}
                      onPress={() => updateProfile({ activityLevel: val })}>
                      <Text style={[styles.activityText, profile.activityLevel === val && styles.activityTextActive]}>
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </StepCard>
            )}

            {step === 'done' && (
              <StepCard title={`You're all set, ${name}!`} sub="Your personalized weight loss tracker is ready.">
                <View style={styles.doneIcons}>
                  <Text style={styles.doneIcon}>📋</Text>
                  <Text style={styles.doneIcon}>📊</Text>
                  <Text style={styles.doneIcon}>⚖️</Text>
                  <Text style={styles.doneIcon}>🤖</Text>
                </View>
                <Text style={styles.doneText}>
                  Daily checklist, health monitor, weight tracking, and AI coaching — all in one place.
                </Text>
              </StepCard>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.nav}>
        {stepIndex > 0 && step !== 'done' && (
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={back}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.continueBtn,
            (!canContinue() && step !== 'done') && styles.continueBtnDisabled,
            pressed && styles.pressed,
          ]}
          onPress={step === 'done' ? finish : next}
          disabled={!canContinue() && step !== 'done'}>
          <Text style={styles.continueText}>
            {step === 'done' ? 'Start my journey' : 'Continue →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function StepCard({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.stepCard}>
      <Text style={styles.stepTitle}>{title}</Text>
      {sub && <Text style={styles.stepSub}>{sub}</Text>}
      {children && <View style={styles.stepChildren}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.cream },
  content: {
    paddingHorizontal: 20,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    minHeight: '100%',
  },
  progressTrack: {
    height: 4,
    backgroundColor: AppColors.line,
    borderRadius: 99,
    marginTop: 12,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.green,
    borderRadius: 99,
  },
  body: { flex: 1, justifyContent: 'center', paddingTop: 20 },

  stepCard: { gap: 8 },
  stepTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 26,
    fontWeight: '600',
    color: AppColors.ink,
    lineHeight: 34,
  },
  stepSub: {
    fontSize: 15,
    color: AppColors.muted,
    marginBottom: 8,
  },
  stepChildren: { marginTop: 16, gap: 10 },

  input: {
    borderWidth: 1.5,
    borderColor: AppColors.greenLine,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: AppColors.ink,
    backgroundColor: AppColors.paper,
  },
  unit: {
    fontSize: 14,
    color: AppColors.muted,
    marginLeft: 4,
  },
  hint: {
    fontSize: 14,
    color: AppColors.green,
    fontWeight: '500',
  },

  segmented: { flexDirection: 'row', gap: 12 },
  segment: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: AppColors.line,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: AppColors.paper,
  },
  segmentActive: { borderColor: AppColors.green, backgroundColor: AppColors.greenSoft },
  segmentText: { fontSize: 16, color: AppColors.muted, fontWeight: '500' },
  segmentTextActive: { color: AppColors.green, fontWeight: '700' },

  activityList: { gap: 10 },
  activityOption: {
    borderWidth: 1.5,
    borderColor: AppColors.line,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: AppColors.paper,
  },
  activityOptionActive: { borderColor: AppColors.green, backgroundColor: AppColors.greenSoft },
  activityText: { fontSize: 15, color: AppColors.ink },
  activityTextActive: { color: AppColors.green, fontWeight: '600' },

  doneIcons: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginVertical: 16 },
  doneIcon: { fontSize: 40 },
  doneText: { fontSize: 15, color: AppColors.muted, textAlign: 'center', lineHeight: 22 },

  nav: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 32,
    backgroundColor: AppColors.cream,
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.line,
    backgroundColor: AppColors.paper,
  },
  backText: { fontSize: 15, color: AppColors.muted, fontWeight: '500' },
  continueBtn: {
    flex: 1,
    backgroundColor: AppColors.green,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueBtnDisabled: { backgroundColor: AppColors.greenLine },
  continueText: { color: AppColors.white, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.8 },
});
