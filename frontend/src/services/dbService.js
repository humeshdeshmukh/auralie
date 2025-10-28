import { ref, set, get, update, remove } from "firebase/database";
import { database } from '../firebase/config';

// Write data to a specific path
export const writeData = async (path, data) => {
  try {
    await set(ref(database, path), data);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Read data from a specific path
export const readData = async (path) => {
  try {
    const snapshot = await get(ref(database, path));
    return { data: snapshot.val(), error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// Update specific fields at a path
export const updateData = async (path, updates) => {
  try {
    await update(ref(database, path), updates);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Remove data at a specific path
export const deleteData = async (path) => {
  try {
    await remove(ref(database, path));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
