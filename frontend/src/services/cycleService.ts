import { CycleData } from '@/app/cycle-tracking/page';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';

const CYCLE_COLLECTION = 'cycles';

export const createCycleEntry = async (cycleData: Omit<CycleData, 'id'>) => {
  try {
    const cycleRef = doc(collection(db, CYCLE_COLLECTION));
    const now = new Date().toISOString();
    const newCycle = {
      ...cycleData,
      id: cycleRef.id,
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(cycleRef, newCycle);
    return { ...newCycle, id: cycleRef.id };
  } catch (error) {
    console.error('Error creating cycle entry:', error);
    throw error;
  }
};

export const updateCycleEntry = async (id: string, updates: Partial<CycleData>) => {
  try {
    const cycleRef = doc(db, CYCLE_COLLECTION, id);
    await setDoc(
      cycleRef,
      { 
        ...updates, 
        updatedAt: new Date().toISOString() 
      },
      { merge: true }
    );
    return { id, ...updates };
  } catch (error) {
    console.error('Error updating cycle entry:', error);
    throw error;
  }
};

export const getCycleById = async (id: string): Promise<CycleData | null> => {
  try {
    const cycleRef = doc(db, CYCLE_COLLECTION, id);
    const cycleSnap = await getDoc(cycleRef);
    
    if (cycleSnap.exists()) {
      return { id: cycleSnap.id, ...cycleSnap.data() } as CycleData;
    }
    return null;
  } catch (error) {
    console.error('Error getting cycle by ID:', error);
    throw error;
  }
};

export const getUserCycles = async (userId: string, limitCount = 30): Promise<CycleData[]> => {
  try {
    const cyclesRef = collection(db, CYCLE_COLLECTION);
    const q = query(
      cyclesRef,
      where('userId', '==', userId),
      orderBy('startDate', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CycleData));
  } catch (error) {
    console.error('Error getting user cycles:', error);
    throw error;
  }
};

export const getCurrentCycle = async (userId: string): Promise<CycleData | null> => {
  try {
    const cyclesRef = collection(db, CYCLE_COLLECTION);
    const now = new Date();
    const q = query(
      cyclesRef,
      where('userId', '==', userId),
      where('startDate', '<=', now.toISOString()),
      orderBy('startDate', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as CycleData;
    }
    return null;
  } catch (error) {
    console.error('Error getting current cycle:', error);
    throw error;
  }
};
