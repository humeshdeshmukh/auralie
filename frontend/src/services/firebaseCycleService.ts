import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { Cycle, HealthLog, CycleStats } from '@/types/health';

export const CYCLE_COLLECTION = 'cycles';
export const HEALTH_LOGS_COLLECTION = 'healthLogs';

// Helper to convert Firestore timestamps to date strings
const formatFirestoreDate = (date: any): string => {
  if (!date) return '';
  if (date instanceof Timestamp) {
    return date.toDate().toISOString().split('T')[0];
  }
  return date;
};

// Helper to convert date strings to Firestore timestamps
const toFirestoreDate = (dateStr: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateStr));
};

export const getCurrentCycle = async (userId: string): Promise<Cycle | null> => {
  try {
    const cyclesRef = collection(db, CYCLE_COLLECTION);
    const q = query(
      cyclesRef,
      where('userId', '==', userId),
      where('endDate', '==', null),
      orderBy('startDate', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const cycleDoc = querySnapshot.docs[0];
    const cycleData = cycleDoc.data();
    
    return {
      id: cycleDoc.id,
      ...cycleData,
      startDate: formatFirestoreDate(cycleData.startDate),
      endDate: formatFirestoreDate(cycleData.endDate),
      createdAt: formatFirestoreDate(cycleData.createdAt),
      updatedAt: formatFirestoreDate(cycleData.updatedAt)
    } as Cycle;
  } catch (error) {
    console.error('Error getting current cycle:', error);
    throw new Error('Failed to fetch current cycle');
  }
};

export const getHealthLogs = async (userId: string, startDate?: Date | string, endDate?: Date | string): Promise<HealthLog[]> => {
  try {
    const logsRef = collection(db, HEALTH_LOGS_COLLECTION);
    const conditions = [
      where('userId', '==', userId)
    ];

    if (startDate) {
      const start = startDate instanceof Date ? startDate : new Date(startDate);
      conditions.push(where('date', '>=', Timestamp.fromDate(start)));
    }
    
    if (endDate) {
      const end = endDate instanceof Date ? endDate : new Date(endDate);
      // Set to end of day
      end.setHours(23, 59, 59, 999);
      conditions.push(where('date', '<=', Timestamp.fromDate(end)));
    }

    const q = query(
      logsRef,
      ...conditions,
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: formatFirestoreDate(doc.data().date),
      createdAt: formatFirestoreDate(doc.data().createdAt),
      updatedAt: formatFirestoreDate(doc.data().updatedAt)
    })) as HealthLog[];
  } catch (error) {
    console.error('Error getting health logs:', error);
    throw new Error('Failed to fetch health logs');
  }
};

export const getCycleStats = async (userId: string): Promise<CycleStats> => {
  try {
    if (!userId) {
      console.error('User ID is required');
      throw new Error('User ID is required');
    }

    // Get all completed cycles for this user
    const cyclesRef = collection(db, CYCLE_COLLECTION);
    let querySnapshot;
    
    try {
      const q = query(
        cyclesRef,
        where('userId', '==', userId),
        where('endDate', '!=', null),
        orderBy('endDate', 'desc'),
        limit(12) // Limit to last 12 cycles for performance
      );
      
      querySnapshot = await getDocs(q);
    } catch (queryError) {
      console.error('Firestore query error:', queryError);
      // Return default values if there's an error with the query
      return getDefaultCycleStats();
    }
    
    if (!querySnapshot || querySnapshot.empty) {
      console.log('No cycle data found for user:', userId);
      return getDefaultCycleStats();
    }

    // Process cycles with error handling
    const cycles: Cycle[] = [];
    const cycleLengths: number[] = [];
    let totalPeriodLength = 0;
    let periodCount = 0;
    const periodHistory: Array<{startDate: string, endDate: string, length: number, symptoms: string[]}> = [];

    querySnapshot.docs.forEach(doc => {
      try {
        const data = doc.data();
        if (!data.startDate) return; // Skip invalid entries
        
        const cycle: Cycle = {
          id: doc.id,
          userId: data.userId,
          startDate: data.startDate.toDate ? data.startDate.toDate().toISOString().split('T')[0] : data.startDate,
          endDate: data.endDate ? (data.endDate.toDate ? data.endDate.toDate().toISOString().split('T')[0] : data.endDate) : '',
          flowLevel: data.flowLevel || 'medium',
          symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
          notes: data.notes || '',
          isPredicted: data.isPredicted || false,
          mood: data.mood || 0,
          energy: data.energy || 0,
          temperature: data.temperature,
          weight: data.weight,
          cycleLength: data.cycleLength
        };

        cycles.push(cycle);

        // Only process cycles with valid start and end dates
        if (cycle.startDate && cycle.endDate) {
          const startDate = new Date(cycle.startDate);
          const endDate = new Date(cycle.endDate);
          
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const cycleLength = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            if (cycleLength > 0) {
              cycleLengths.push(cycleLength);
            }
          }
        }

        // Calculate period length (simplified)
        const periodLength = cycle.cycleLength || 5; // Default to 5 days if not specified
        totalPeriodLength += periodLength;
        periodCount++;

        // Add to period history
        periodHistory.push({
          startDate: cycle.startDate,
          endDate: cycle.endDate || '',
          length: periodLength,
          symptoms: Array.isArray(cycle.symptoms) ? cycle.symptoms : []
        });
      } catch (processError) {
        console.error('Error processing cycle:', doc.id, processError);
      }
    });

    // Initialize stats with proper typing to match CycleStats interface
    const stats: CycleStats = {
      averageCycleLength: 28, // Default value
      averagePeriodLength: 5,  // Default value
      lastPeriodStart: periodHistory[0]?.startDate || '',
      lastPeriodEnd: periodHistory[0]?.endDate || '',
      cycleVariability: 0,
      symptoms: {}, // Initialize empty symptoms object
      moodAverage: 0,
      energyAverage: 0,
      cycleHistory: periodHistory.map(p => ({
        startDate: p.startDate,
        endDate: p.endDate,
        length: p.length
      }))
    };

    try {
      // Calculate average cycle length if we have valid cycles
      if (cycleLengths.length > 0) {
        const sum = cycleLengths.reduce((a, b) => a + b, 0);
        stats.averageCycleLength = Math.round(sum / cycleLengths.length);
      }

      // Calculate average period length
      if (periodCount > 0) {
        stats.averagePeriodLength = Math.round(totalPeriodLength / periodCount);
      }

      // Calculate cycle variability (standard deviation)
      if (cycleLengths.length > 1) {
        const mean = stats.averageCycleLength;
        const squaredDiffs = cycleLengths.map(len => Math.pow(len - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / cycleLengths.length;
        stats.cycleVariability = Math.round(Math.sqrt(variance));
      }

      // Calculate mood and energy averages
      const validCycles = cycles.filter(c => c.mood !== undefined && c.energy !== undefined);
      if (validCycles.length > 0) {
        const totalMood = validCycles.reduce((sum, cycle) => sum + (cycle.mood || 0), 0);
        const totalEnergy = validCycles.reduce((sum, cycle) => sum + (cycle.energy || 0), 0);
        stats.moodAverage = Math.round((totalMood / validCycles.length) * 10) / 10; // 1 decimal place
        stats.energyAverage = Math.round((totalEnergy / validCycles.length) * 10) / 10; // 1 decimal place
      }

      // Calculate symptom frequencies
      const symptomCounts: Record<string, number> = {};
      cycles.forEach(cycle => {
        if (Array.isArray(cycle.symptoms)) {
          cycle.symptoms.forEach(symptom => {
            symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
          });
        }
      });
      
      // Convert to percentage of cycles with each symptom
      stats.symptoms = Object.fromEntries(
        Object.entries(symptomCounts).map(([symptom, count]) => [
          symptom, 
          Math.round((count / cycles.length) * 100)
        ])
      );

      // Calculate next period prediction if we have a last period start date
      if (stats.lastPeriodStart) {
        try {
          const lastPeriodDate = new Date(stats.lastPeriodStart);
          if (!isNaN(lastPeriodDate.getTime())) {
            // Calculate next period start date (last period start + average cycle length)
            const nextPeriodStart = new Date(lastPeriodDate);
            nextPeriodStart.setDate(lastPeriodDate.getDate() + stats.averageCycleLength);
            
            // Calculate next period end date (start date + average period length)
            const nextPeriodEnd = new Date(nextPeriodStart);
            nextPeriodEnd.setDate(nextPeriodStart.getDate() + stats.averagePeriodLength);
            
            // Calculate ovulation date (14 days before next period start)
            const ovulationDate = new Date(nextPeriodStart);
            ovulationDate.setDate(nextPeriodStart.getDate() - 14);
            
            // Calculate fertile window (5 days before ovulation to 1 day after)
            const fertileWindowStart = new Date(ovulationDate);
            fertileWindowStart.setDate(ovulationDate.getDate() - 5);
            
            const fertileWindowEnd = new Date(ovulationDate);
            fertileWindowEnd.setDate(ovulationDate.getDate() + 1);
            
            // Format dates to YYYY-MM-DD
            const formatDate = (date: Date) => date.toISOString().split('T')[0];
            
            // Add prediction to stats - handle both new and legacy formats
            const nextStart = formatDate(nextPeriodStart);
            const nextEnd = formatDate(nextPeriodEnd);
            
            // Set both the new format (nextPeriodPrediction) and legacy format (nextPeriodStart/End)
            stats.nextPeriodPrediction = {
              start: nextStart,
              end: nextEnd
            };
            stats.nextPeriodStart = nextStart;
            stats.nextPeriodEnd = nextEnd;
            
            // Add fertile window info
            stats.fertileWindow = {
              start: formatDate(fertileWindowStart),
              end: formatDate(fertileWindowEnd),
              ovulationDay: formatDate(ovulationDate)
            };
            
            console.log('Next period prediction:', {
              start: nextStart,
              end: nextEnd,
              fertileWindow: stats.fertileWindow
            });
          }
        } catch (error) {
          console.error('Error calculating next period prediction:', error);
        }
      }

      return stats;
    } catch (error) {
      console.error('Error in getCycleStats:', error);
      // Return default stats instead of throwing to prevent UI crashes
      return getDefaultCycleStats();
    }
  } catch (error) {
    console.error('Unexpected error in getCycleStats:', error);
    return getDefaultCycleStats();
  }
};

// Helper function to get default cycle stats
function getDefaultCycleStats(): CycleStats {
  return {
    averageCycleLength: 28,
    averagePeriodLength: 5,
    lastPeriodStart: '',
    lastPeriodEnd: '',
    nextPeriodPrediction: { start: '', end: '' },
    cycleVariability: 0,
    symptoms: {},
    moodAverage: 0,
    energyAverage: 0,
    cycleHistory: []
  };
}

// Add more Firebase-specific cycle operations as needed
export const createCycle = async (cycle: Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cycle> => {
  try {
    const cyclesRef = collection(db, CYCLE_COLLECTION);
    const now = Timestamp.now();
    
    const newCycle = {
      ...cycle,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(cyclesRef, newCycle);
    
    return {
      id: docRef.id,
      ...cycle,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString()
    };
  } catch (error) {
    console.error('Error creating cycle:', error);
    throw new Error('Failed to create cycle');
  }
};

export const updateCycle = async (id: string, updates: Partial<Cycle>): Promise<void> => {
  try {
    const cycleRef = doc(db, CYCLE_COLLECTION, id);
    
    await updateDoc(cycleRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating cycle:', error);
    throw new Error('Failed to update cycle');
  }
};

export const endCurrentCycle = async (userId: string, endDate: string): Promise<Cycle> => {
  try {
    // Get the current active cycle
    const currentCycle = await getCurrentCycle(userId);
    
    if (!currentCycle || !currentCycle.id) {
      throw new Error('No active cycle found to end');
    }
    
    // Update the end date of the current cycle
    await updateCycle(currentCycle.id, {
      endDate: endDate
    });
    
    // Return the updated cycle
    return {
      ...currentCycle,
      endDate: endDate,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error ending current cycle:', error);
    throw new Error('Failed to end current cycle');
  }
};

export const createHealthLog = async (log: Omit<HealthLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthLog> => {
  try {
    const logsRef = collection(db, HEALTH_LOGS_COLLECTION);
    const now = Timestamp.now();
    
    const newLog = {
      ...log,
      date: toFirestoreDate(log.date),
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(logsRef, newLog);
    
    return {
      id: docRef.id,
      ...log,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString()
    };
  } catch (error) {
    console.error('Error creating health log:', error);
    throw new Error('Failed to create health log');
  }
};

export const updateHealthLog = async (id: string, updates: Partial<HealthLog>): Promise<void> => {
  try {
    const logRef = doc(db, HEALTH_LOGS_COLLECTION, id);
    
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    
    if (updates.date) {
      updateData.date = toFirestoreDate(updates.date);
    }
    
    await updateDoc(logRef, updateData);
  } catch (error) {
    console.error('Error updating health log:', error);
    throw new Error('Failed to update health log');
  }
};
