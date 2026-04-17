// lib/fridge-store.ts
// Device-local fridge storage. AsyncStorage keyed per user.
// Future work: sync to a `user_fridge` table.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FridgeItem = {
  name: string;
  addedAt: string; // ISO
};

type FridgePayload = {
  items: FridgeItem[];
};

function keyFor(userId: string): string {
  return `becipe.fridge.${userId}`;
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export async function getFridge(userId: string): Promise<FridgeItem[]> {
  if (!userId) return [];
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FridgePayload;
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

async function writeFridge(userId: string, items: FridgeItem[]): Promise<void> {
  const payload: FridgePayload = { items };
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(payload));
}

export async function addToFridge(userId: string, name: string): Promise<FridgeItem[]> {
  if (!userId) return [];
  const cleaned = normalize(name);
  if (!cleaned) return getFridge(userId);
  const current = await getFridge(userId);
  if (current.some((it) => normalize(it.name) === cleaned)) return current;
  const next = [
    { name: cleaned, addedAt: new Date().toISOString() },
    ...current,
  ];
  await writeFridge(userId, next);
  return next;
}

export async function removeFromFridge(userId: string, name: string): Promise<FridgeItem[]> {
  if (!userId) return [];
  const cleaned = normalize(name);
  const current = await getFridge(userId);
  const next = current.filter((it) => normalize(it.name) !== cleaned);
  await writeFridge(userId, next);
  return next;
}

export async function clearFridge(userId: string): Promise<void> {
  if (!userId) return;
  await AsyncStorage.removeItem(keyFor(userId));
}
