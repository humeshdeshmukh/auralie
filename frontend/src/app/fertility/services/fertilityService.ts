import { collection, doc, setDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FertilityEntry } from '../types/fertility';

const FERTILITY_ENTRIES = 'fertilityEntries';

// Save a fertility entry
export const saveFertilityEntry = async (userId: string, entry: Omit<FertilityEntry, 'id' | 'userId' | 'loggedAt'>) => {
  try {
    const entriesRef = collection(db, FERTILITY_ENTRIES);
    const newEntry: FertilityEntry = {
      ...entry,
      id: '',
      userId,
      loggedAt: new Date().toISOString(),
    };
    
    const docRef = doc(entriesRef);
    newEntry.id = docRef.id;
    await setDoc(docRef, newEntry);
    return newEntry;
  } catch (error) {
    console.error('Error saving fertility entry:', error);
    throw error;
  }
};

// Get fertility entries for a date range
export const getFertilityEntries = async (userId: string, startDate: Date, endDate: Date): Promise<FertilityEntry[]> => {
  try {
    const entriesRef = collection(db, FERTILITY_ENTRIES);
    const q = query(
      entriesRef,
      where('userId', '==', userId),
      where('loggedAt', '>=', Timestamp.fromDate(startDate)),
      where('loggedAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('loggedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FertilityEntry));
  } catch (error) {
    console.error('Error fetching fertility entries:', error);
    return [];
  }
};

// Calculate fertility stats
export const calculateFertilityStats = (entries: FertilityEntry[]) => {
  if (entries.length === 0) return null;
  
  // Sort entries by date
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
  );

  // Calculate average cycle length (default to 28 days if not enough data)
  const cycleLengths: number[] = [];
  for (let i = 1; i < sortedEntries.length; i++) {
    const prevDate = new Date(sortedEntries[i - 1].loggedAt);
    const currDate = new Date(sortedEntries[i].loggedAt);
    const diffDays = Math.ceil((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
    cycleLengths.push(diffDays);
  }
  
  const avgCycleLength = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : 28; // Default to 28 days if no cycle data

  // Calculate ovulation day (typically 14 days before next period)
  const ovulationDay = avgCycleLength - 14;
  
  // Calculate fertile window (5 days before and 1 day after ovulation)
  const fertileWindow = {
    start: ovulationDay - 5,
    end: ovulationDay + 1
  };

  // Predict next period and ovulation
  const lastEntry = new Date(sortedEntries[sortedEntries.length - 1].loggedAt);
  const nextPeriod = new Date(lastEntry);
  nextPeriod.setDate(lastEntry.getDate() + avgCycleLength);
  
  const nextOvulation = new Date(nextPeriod);
  nextOvulation.setDate(nextPeriod.getDate() - 14);
  
  const pregnancyTestDay = new Date(nextPeriod);
  pregnancyTestDay.setDate(nextPeriod.getDate() + 14);

  return {
    cycleLength: avgCycleLength,
    periodLength: 5, // Default to 5 days, can be calculated from entries
    ovulationDay,
    fertileWindow,
    nextPeriod: nextPeriod.toISOString().split('T')[0],
    nextOvulation: nextOvulation.toISOString().split('T')[0],
    pregnancyTestDay: pregnancyTestDay.toISOString().split('T')[0]
  };
};
