import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CycleEntry } from '../types';

const CYCLE_ENTRIES_COLLECTION = 'cycleEntries';

// Save a new cycle entry
export const saveCycleEntry = async (userId: string, entry: Omit<CycleEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
  try {
    const entriesRef = collection(db, CYCLE_ENTRIES_COLLECTION);
    const newEntry: CycleEntry = {
      ...entry,
      id: '', // Will be set by Firestore
      userId,
      createdAt: Timestamp.now().toDate().toISOString(),
      updatedAt: Timestamp.now().toDate().toISOString(),
    };
    
    const docRef = doc(entriesRef);
    newEntry.id = docRef.id;
    await setDoc(docRef, newEntry);
    return newEntry;
  } catch (error) {
    console.error('Error saving cycle entry:', error);
    throw error;
  }
};

// Get all cycle entries for a user
export const getCycleEntries = async (userId: string): Promise<CycleEntry[]> => {
  try {
    const entriesRef = collection(db, CYCLE_ENTRIES_COLLECTION);
    const q = query(
      entriesRef,
      where('userId', '==', userId),
      orderBy('startDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CycleEntry));
  } catch (error) {
    console.error('Error fetching cycle entries:', error);
    throw error;
  }
};

// Update an existing cycle entry
export const updateCycleEntry = async (entryId: string, updates: Partial<CycleEntry>) => {
  try {
    const entryRef = doc(db, CYCLE_ENTRIES_COLLECTION, entryId);
    await updateDoc(entryRef, {
      ...updates,
      updatedAt: Timestamp.now().toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error updating cycle entry:', error);
    throw error;
  }
};

// Delete a cycle entry
export const deleteCycleEntry = async (entryId: string) => {
  try {
    const entryRef = doc(db, CYCLE_ENTRIES_COLLECTION, entryId);
    await deleteDoc(entryRef);
  } catch (error) {
    console.error('Error deleting cycle entry:', error);
    throw error;
  }
};
