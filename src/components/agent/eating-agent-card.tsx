import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/theme';
import type { EatingSuggestion } from '@/hooks/use-eating-agent';
import type { ZoneName, Zones } from '@/lib/location-zones';

type Props = {
  zone: ZoneName;
  zones: Zones;
  hasZones: boolean;
  suggestion: EatingSuggestion | null;
  busy: boolean;
  onCapture: (name: 'home' | 'office') => void;
};

const ZONE_LABEL: Record<ZoneName, string> = { home: 'At home', office: 'At the office', other: 'Out & about' };

export function EatingAgentCard({ zone, zones, hasZones, suggestion, busy, onCapture }: Props) {
  // First-run: prompt to save zones so the agent can localize advice.
  if (!hasZones) {
    return (
      <View style={styles.card}>
        <Text style={styles.setupTitle}>📍 Location food coach</Text>
        <Text style={styles.setupSub}>
          Save your home & office once — then I’ll nudge you with the right food at the right place
          (e.g. “catering time: take the fish, skip the rice”). Locations stay on your device.
        </Text>
        <View style={styles.setupRow}>
          <CaptureBtn label="Set home" sub="🏠" onPress={() => onCapture('home')} busy={busy} />
          <CaptureBtn label="Set office" sub="🏢" onPress={() => onCapture('office')} busy={busy} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, suggestion && styles.cardActive]}>
      <View style={styles.head}>
        <Text style={styles.zoneChip}>📍 {ZONE_LABEL[zone]}</Text>
        <View style={styles.setRow}>
          {!zones.home && <MiniSet label="+ home" onPress={() => onCapture('home')} />}
          {!zones.office && <MiniSet label="+ office" onPress={() => onCapture('office')} />}
        </View>
      </View>

      {suggestion ? (
        <View style={styles.suggestion}>
          <Text style={styles.sugEmoji}>{suggestion.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.sugTitle}>{suggestion.title}</Text>
            <Text style={styles.sugBody}>{suggestion.body}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.idle}>
          {zone === 'other'
            ? 'Not at a saved place — I’ll chime in at home or the office.'
            : 'You’re on track here — nothing to flag right now.'}
        </Text>
      )}
    </View>
  );
}

function CaptureBtn({ label, sub, onPress, busy }: { label: string; sub: string; onPress: () => void; busy: boolean }) {
  return (
    <Pressable style={({ pressed }) => [styles.captureBtn, pressed && styles.pressed]} onPress={onPress} disabled={busy}>
      {busy ? (
        <ActivityIndicator size="small" color={AppColors.green} />
      ) : (
        <>
          <Text style={styles.captureSub}>{sub}</Text>
          <Text style={styles.captureLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function MiniSet({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.miniSet, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.miniSetText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.line,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardActive: { backgroundColor: AppColors.greenSoft, borderColor: AppColors.greenLine },
  setupTitle: { fontSize: 14, fontWeight: '700', color: AppColors.ink },
  setupSub: { fontSize: 12, color: AppColors.muted, marginTop: 4, lineHeight: 17 },
  setupRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  captureBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    backgroundColor: AppColors.cream,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  captureSub: { fontSize: 16 },
  captureLabel: { fontSize: 12, fontWeight: '700', color: AppColors.greenDeep, marginTop: 2 },
  pressed: { opacity: 0.7 },

  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  zoneChip: { fontSize: 12, fontWeight: '700', color: AppColors.greenDeep },
  setRow: { flexDirection: 'row', gap: 6 },
  miniSet: {
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  miniSetText: { fontSize: 10, fontWeight: '700', color: AppColors.green },

  suggestion: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  sugEmoji: { fontSize: 22 },
  sugTitle: { fontSize: 14, fontWeight: '700', color: AppColors.ink },
  sugBody: { fontSize: 13, color: AppColors.ink, marginTop: 2, lineHeight: 18 },
  idle: { fontSize: 12, color: AppColors.muted },
});
