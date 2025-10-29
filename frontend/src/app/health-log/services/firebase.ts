import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  getDoc, 
  DocumentData,
  QueryDocumentSnapshot,
  CollectionReference
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  HealthEntry, 
  HealthEntryFormData, 
  SymptomEntry, 
  MedicationEntry, 
  MoodLevel, 
  EnergyLevel,
  HealthMetrics
} from '../types';
import { v4 as uuidv4 } from 'uuid';

const HEALTH_ENTRIES_COLLECTION = 'healthEntries';
const SYMPTOMS_COLLECTION = 'symptoms';
const MEDICATIONS_COLLECTION = 'medications';

// Type for Firestore document data
interface HealthEntryDocument extends Omit<HealthEntry, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper function to convert Firestore data to HealthEntry
const mapToHealthEntry = (doc: QueryDocumentSnapshot<DocumentData>): HealthEntry => {
  const data = doc.data() as HealthEntryDocument;
  return {
    id: doc.id,
    userId: data.userId,
    date: data.date,
    metrics: data.metrics || {},
    symptoms: data.symptoms || [],
    medications: data.medications || [],
    mood: data.mood as MoodLevel,
    energyLevel: data.energyLevel as EnergyLevel,
    notes: data.notes || '',
    aiInsights: data.aiInsights,
    createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
  };
};

// Collection references
const getHealthEntriesCollection = (): CollectionReference<DocumentData> => 
  collection(db, HEALTH_ENTRIES_COLLECTION);

const getSymptomsCollection = (): CollectionReference<DocumentData> =>
  collection(db, SYMPTOMS_COLLECTION);

const getMedicationsCollection = (): CollectionReference<DocumentData> =>
  collection(db, MEDICATIONS_COLLECTION);

export const createHealthEntry = async (userId: string, data: HealthEntryFormData): Promise<HealthEntry> => {
  const entryId = uuidv4();
  const now = Timestamp.now();
  
  // Build metrics object with proper typing
  const metrics: Partial<HealthMetrics> = {};
  
  if (data.metrics.weight) metrics.weight = parseFloat(data.metrics.weight);
  if (data.metrics.heartRate) metrics.heartRate = parseInt(data.metrics.heartRate, 10);
  if (data.metrics.temperature) metrics.temperature = parseFloat(data.metrics.temperature);
  
  if (data.metrics.bloodPressureSystolic && data.metrics.bloodPressureDiastolic) {
    metrics.bloodPressure = {
      systolic: parseInt(data.metrics.bloodPressureSystolic, 10),
      diastolic: parseInt(data.metrics.bloodPressureDiastolic, 10)
    };
  }
  
  const entryData: Omit<HealthEntryDocument, 'id'> = {
    userId,
    date: data.date,
    metrics,
    symptoms: data.symptoms.map(symptom => ({
      id: uuidv4(),
      name: symptom.name.trim(),
      severity: parseInt(symptom.severity, 10),
      notes: symptom.notes || '',
      createdAt: now
    })),
    medications: data.medications.map(med => ({
      id: uuidv4(),
      name: med.name.trim(),
      dosage: med.dosage.trim(),
      time: med.time,
      taken: med.taken || false,
      createdAt: now
    })),
    mood: data.mood as MoodLevel,
    energyLevel: data.energyLevel as EnergyLevel,
    notes: data.notes || '',
    aiInsights: null,
    createdAt: now,
    updatedAt: now
  };

  const docRef = doc(getHealthEntriesCollection(), entryId);
  await setDoc(docRef, entryData);

  return {
    id: entryId,
    userId,
    date: entryData.date,
    metrics: entryData.metrics,
    symptoms: entryData.symptoms,
    medications: entryData.medications,
    mood: entryData.mood,
    energyLevel: entryData.energyLevel,
    notes: entryData.notes,
    aiInsights: entryData.aiInsights,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString()
  };
};

export const updateHealthEntry = async (entryId: string, data: Partial<HealthEntryFormData>): Promise<HealthEntry | null> => {
  const entryRef = doc(db, HEALTH_ENTRIES_COLLECTION, entryId);
  const updateData: Partial<HealthEntryDocument> = {
    updatedAt: Timestamp.now()
  };

  if (data.metrics) {
    updateData.metrics = {
      ...(data.metrics.weight !== undefined && { 
        weight: typeof data.metrics.weight === 'string' 
          ? parseFloat(data.metrics.weight) 
          : data.metrics.weight 
      }),
      ...(data.metrics.bloodPressureSystolic !== undefined && data.metrics.bloodPressureDiastolic !== undefined && {
        bloodPressure: {
          systolic: parseInt(data.metrics.bloodPressureSystolic),
          diastolic: parseInt(data.metrics.bloodPressureDiastolic)
        }
      }),
      ...(data.metrics.heartRate !== undefined && { heartRate: parseInt(data.metrics.heartRate) }),
      ...(data.metrics.temperature !== undefined && { temperature: parseFloat(data.metrics.temperature) })
    };
  }

  if (data.symptoms) {
    updateData.symptoms = data.symptoms.map(symptom => {
      const now = Timestamp.now();
      const symptomEntry: Omit<SymptomEntry, 'id' | 'createdAt'> & { id: string; createdAt: Timestamp } = {
        id: 'id' in symptom ? String(symptom.id) : uuidv4(),
        name: symptom.name.trim(),
        severity: typeof symptom.severity === 'string' 
          ? parseInt(symptom.severity, 10) 
          : symptom.severity,
        notes: 'notes' in symptom ? String(symptom.notes || '') : '',
        createdAt: 'createdAt' in symptom && symptom.createdAt 
          ? Timestamp.fromDate(new Date(String(symptom.createdAt)))
          : now
      };
      
      // Convert to the expected SymptomEntry type with string dates
      return {
        ...symptomEntry,
        createdAt: symptomEntry.createdAt.toDate().toISOString()
      };
    });
  }

  if (data.medications) {
    updateData.medications = data.medications.map(med => {
      const now = Timestamp.now();
      
      // Create the medication entry with all required fields
      const entry: MedicationEntry = {
        id: 'id' in med ? String(med.id) : uuidv4(),
        name: med.name.trim(),
        dosage: med.dosage.trim(),
        time: med.time,
        taken: 'taken' in med ? Boolean(med.taken) : false,
        createdAt: 'createdAt' in med && med.createdAt 
          ? new Date(String(med.createdAt)).toISOString()
          : now.toDate().toISOString()
      };
      
      return entry;
    });
  }

  if (data.mood !== undefined) {
    updateData.mood = typeof data.mood === 'string' 
      ? (parseInt(data.mood, 10) as MoodLevel) 
      : (data.mood as MoodLevel);
  }
  if (data.energyLevel !== undefined) {
    updateData.energyLevel = typeof data.energyLevel === 'string' 
      ? (parseInt(data.energyLevel, 10) as EnergyLevel) 
      : (data.energyLevel as EnergyLevel);
  }
  if (data.notes !== undefined) updateData.notes = data.notes?.trim();

  await updateDoc(entryRef, updateData);
  
  // Fetch the updated entry
  const updatedDoc = await getDoc(entryRef);
  if (!updatedDoc.exists()) return null;
  
  return mapToHealthEntry(updatedDoc);
};

export const deleteHealthEntry = async (entryId: string): Promise<void> => {
  await deleteDoc(doc(getHealthEntriesCollection(), entryId));
};

export const getHealthEntry = async (entryId: string): Promise<HealthEntry | null> => {
  const docRef = doc(getHealthEntriesCollection(), entryId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return mapToHealthEntry(docSnap);
};

export const getUserHealthEntries = async (userId: string, limitCount: number = 30): Promise<HealthEntry[]> => {
  const q = query(
    getHealthEntriesCollection(),
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => mapToHealthEntry(doc));
};

export const getHealthEntriesByDateRange = async (
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<HealthEntry[]> => {
  const q = query(
    getHealthEntriesCollection(),
    where('userId', '==', userId),
    where('date', '>=', startDate.toISOString().split('T')[0]),
    where('date', '<=', endDate.toISOString().split('T')[0]),
    orderBy('date', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => mapToHealthEntry(doc));
};

// Symptoms
export const getUserSymptoms = async (userId: string): Promise<SymptomEntry[]> => {
  const q = query(
    getSymptomsCollection(),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      severity: data.severity,
      notes: data.notes || '',
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString()
    };
  });
};

// Medications
export const getUserMedications = async (userId: string): Promise<MedicationEntry[]> => {
  const q = query(
    getMedicationsCollection(),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      dosage: data.dosage,
      time: data.time,
      taken: data.taken || false,
      notes: data.notes || '',
      createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString()
    };
  });
};
