import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans';
import { useRouter } from 'expo-router';

import { AppColors, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useProgressPhotos, type PhotoEntry, type Pose } from '@/hooks/use-progress-photos';
import { shortDate } from '@/lib/date-utils';

export default function ProgressPhotosScreen() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, DMSans_400Regular });
  const { photos, busy, takePhoto, pickPhoto, deletePhoto } = useProgressPhotos();
  const router = useRouter();
  const [compare, setCompare] = useState<string[]>([]); // up to 2 selected ids

  if (!fontsLoaded) return null;

  function addPhoto(pose: Pose) {
    Alert.alert(`Add ${pose} photo`, 'Choose a source', [
      { text: 'Camera', onPress: () => takePhoto(pose) },
      { text: 'Gallery', onPress: () => pickPhoto(pose) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function toggleCompare(id: string) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  function confirmDelete(p: PhotoEntry) {
    Alert.alert('Delete photo?', `${p.pose} · ${shortDate(p.date)}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePhoto(p.id);
          setCompare((prev) => prev.filter((x) => x !== p.id));
        },
      },
    ]);
  }

  const comparePhotos = compare
    .map((id) => photos.find((p) => p.id === id))
    .filter((p): p is PhotoEntry => !!p);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + 24 }]}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['top']}>
          <View style={styles.head}>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.back}>← Back</Text>
            </Pressable>
            <Text style={styles.title}>Progress Photos</Text>
            <Text style={styles.sub}>
              Stored only on your phone — never uploaded. Take one weekly, same pose & light.
            </Text>
          </View>

          {/* Add buttons */}
          <View style={styles.addRow}>
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
              disabled={busy}
              onPress={() => addPhoto('front')}>
              <Text style={styles.addEmoji}>📷</Text>
              <Text style={styles.addLabel}>Front</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
              disabled={busy}
              onPress={() => addPhoto('side')}>
              <Text style={styles.addEmoji}>📷</Text>
              <Text style={styles.addLabel}>Side</Text>
            </Pressable>
          </View>

          {/* Compare view */}
          {comparePhotos.length === 2 && (
            <View style={styles.compareCard}>
              <Text style={styles.compareTitle}>Before / After</Text>
              <View style={styles.compareRow}>
                {comparePhotos
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((p) => (
                    <View key={p.id} style={styles.compareCol}>
                      <Image source={{ uri: p.uri }} style={styles.compareImg} />
                      <Text style={styles.compareDate}>{shortDate(p.date)}</Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {photos.length === 0 ? (
            <Text style={styles.empty}>No photos yet. Add your first front & side shot above.</Text>
          ) : (
            <>
              <Text style={styles.gridHint}>
                {compare.length > 0
                  ? `Selected ${compare.length}/2 to compare`
                  : 'Tap two photos to compare. Long-press to delete.'}
              </Text>
              <View style={styles.grid}>
                {photos.map((p) => {
                  const selected = compare.includes(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      style={[styles.cell, selected && styles.cellSelected]}
                      onPress={() => toggleCompare(p.id)}
                      onLongPress={() => confirmDelete(p)}>
                      <Image source={{ uri: p.uri }} style={styles.cellImg} />
                      <View style={styles.cellMeta}>
                        <Text style={styles.cellPose}>{p.pose === 'front' ? '🧍 Front' : '↪️ Side'}</Text>
                        <Text style={styles.cellDate}>{shortDate(p.date)}</Text>
                      </View>
                      {selected && <View style={styles.badge}><Text style={styles.badgeText}>✓</Text></View>}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.cream },
  content: { paddingHorizontal: 14, maxWidth: MaxContentWidth, alignSelf: 'center', width: '100%' },
  head: { marginBottom: 16, marginTop: 4, gap: 4 },
  back: { fontSize: 14, color: AppColors.green, fontWeight: '600', marginBottom: 6 },
  title: { fontFamily: 'Fraunces_600SemiBold', fontSize: 26, fontWeight: '600', color: AppColors.ink },
  sub: { fontSize: 12, color: AppColors.muted, lineHeight: 17 },

  addRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    borderRadius: 14,
    paddingVertical: 14,
  },
  addEmoji: { fontSize: 18 },
  addLabel: { fontSize: 14, fontWeight: '700', color: AppColors.greenDeep },
  pressed: { opacity: 0.7 },

  compareCard: {
    backgroundColor: AppColors.paper,
    borderWidth: 1,
    borderColor: AppColors.greenLine,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  compareTitle: { fontSize: 13, fontWeight: '700', color: AppColors.greenDeep, marginBottom: 10 },
  compareRow: { flexDirection: 'row', gap: 10 },
  compareCol: { flex: 1, alignItems: 'center' },
  compareImg: { width: '100%', aspectRatio: 0.75, borderRadius: 12, backgroundColor: AppColors.line },
  compareDate: { fontSize: 11, color: AppColors.muted, marginTop: 6, fontWeight: '600' },

  empty: { fontSize: 13, color: AppColors.muted, textAlign: 'center', marginTop: 24 },
  gridHint: { fontSize: 11, color: AppColors.muted, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: AppColors.line,
    backgroundColor: AppColors.paper,
  },
  cellSelected: { borderColor: AppColors.green },
  cellImg: { width: '100%', aspectRatio: 0.8, backgroundColor: AppColors.line },
  cellMeta: { flexDirection: 'row', justifyContent: 'space-between', padding: 8 },
  cellPose: { fontSize: 11, fontWeight: '600', color: AppColors.ink },
  cellDate: { fontSize: 11, color: AppColors.muted },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AppColors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: AppColors.white, fontSize: 12, fontWeight: '700' },
});
