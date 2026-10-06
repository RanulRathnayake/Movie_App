import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "thought_history_v1";
const MAX_ITEMS = 20;

export interface SavedThought {
  id: string;
  text: string;
  createdAt: number;
}

export const getThoughts = async (): Promise<SavedThought[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedThought[]) : [];
  } catch (error) {
    console.error("Error reading thoughts:", error);
    return [];
  }
};

/** Saves a thought (newest first, no duplicates) and returns the new list. */
export const saveThought = async (text: string): Promise<SavedThought[]> => {
  const clean = text.trim();
  if (!clean) return getThoughts();

  const existing = await getThoughts();
  const withoutDuplicate = existing.filter(
    (t) => t.text.toLowerCase() !== clean.toLowerCase()
  );

  const updated = [
    { id: Date.now().toString(), text: clean, createdAt: Date.now() },
    ...withoutDuplicate,
  ].slice(0, MAX_ITEMS);

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving thought:", error);
  }
  return updated;
};

export const deleteThought = async (id: string): Promise<SavedThought[]> => {
  const updated = (await getThoughts()).filter((t) => t.id !== id);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error deleting thought:", error);
  }
  return updated;
};

export const clearThoughts = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing thoughts:", error);
  }
};
