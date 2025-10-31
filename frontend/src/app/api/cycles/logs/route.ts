import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

interface LogEntry {
  id: string;
  date: Date;
  symptoms: string[];
  mood?: number;
  notes?: string;
  temperature?: number;
  [key: string]: any;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    
    let startDate: Date;
    
    try {
      startDate = startDateParam ? new Date(startDateParam) : new Date();
      // If the date is invalid, default to current date
      if (isNaN(startDate.getTime())) {
        startDate = new Date();
      }
    } catch (e) {
      startDate = new Date();
    }

    // Set to beginning of the month
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);

    const logsRef = collection(db, 'logs');
    const q = query(
      logsRef,
      where('userId', '==', session.user.email),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    const logs: LogEntry[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        date: data.date.toDate(),
        symptoms: data.symptoms || [],
        mood: data.mood,
        notes: data.notes,
        temperature: data.temperature,
        ...data
      });
    });

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
