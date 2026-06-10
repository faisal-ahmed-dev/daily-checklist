import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { storageGet, storageSet } from '@/lib/storage';
import { todayKey } from '@/lib/date-utils';

export type Pose = 'front' | 'side';

export type PhotoEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  uri: string; // local file:// path inside the app sandbox
  pose: Pose;
};

const KEY = '@photos/entries';
const PHOTO_DIR = (FileSystem.documentDirectory ?? '') + 'progress-photos/';

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
}

export function useProgressPhotos() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    storageGet<PhotoEntry[]>(KEY).then((saved) => {
      setPhotos(saved ?? []);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((next: PhotoEntry[]) => {
    const sorted = [...next].sort((a, b) => b.date.localeCompare(a.date));
    setPhotos(sorted);
    storageSet(KEY, sorted);
  }, []);

  // Copy a picked/captured image into the app sandbox (stays on-device, never uploaded).
  const importAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset, pose: Pose) => {
      await ensureDir();
      const ext = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const id = `photo_${Date.now()}`;
      const dest = `${PHOTO_DIR}${id}.${ext}`;
      await FileSystem.copyAsync({ from: asset.uri, to: dest });
      persist([...photos, { id, date: todayKey(), uri: dest, pose }]);
    },
    [photos, persist]
  );

  const takePhoto = useCallback(
    async (pose: Pose) => {
      setBusy(true);
      try {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return false;
        const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
        if (res.canceled || !res.assets?.[0]) return false;
        await importAsset(res.assets[0], pose);
        return true;
      } finally {
        setBusy(false);
      }
    },
    [importAsset]
  );

  const pickPhoto = useCallback(
    async (pose: Pose) => {
      setBusy(true);
      try {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return false;
        const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ['images'] });
        if (res.canceled || !res.assets?.[0]) return false;
        await importAsset(res.assets[0], pose);
        return true;
      } finally {
        setBusy(false);
      }
    },
    [importAsset]
  );

  const deletePhoto = useCallback(
    async (id: string) => {
      const target = photos.find((p) => p.id === id);
      if (target) await FileSystem.deleteAsync(target.uri, { idempotent: true }).catch(() => {});
      persist(photos.filter((p) => p.id !== id));
    },
    [photos, persist]
  );

  return { photos, loaded, busy, takePhoto, pickPhoto, deletePhoto };
}
