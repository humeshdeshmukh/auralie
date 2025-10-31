import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cyclesRef = collection(db, 'cycles');
    const q = query(
      cyclesRef,
      where('userId', '==', session.user.email),
      orderBy('startDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const cycles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (cycles.length === 0) {
      return NextResponse.json({
        averageCycleLength: 0,
        averagePeriodLength: 0,
        lastPeriodDate: null,
        cycleCount: 0,
        periodDates: []
      });
    }

    // Calculate statistics
    const cycleLengths: number[] = [];
    const periodLengths: number[] = [];
    const periodDates: string[] = [];

    for (let i = 0; i < cycles.length - 1; i++) {
      const current = cycles[i];
      const next = cycles[i + 1];
      
      if (current.startDate && next.startDate) {
        const diffTime = Math.abs(
          current.startDate.toDate().getTime() - next.startDate.toDate().getTime()
        );
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        cycleLengths.push(diffDays);
      }

      if (current.periodLength) {
        periodLengths.push(Number(current.periodLength));
      }

      if (current.startDate) {
        periodDates.push(current.startDate.toDate().toISOString().split('T')[0]);
      }
    }

    // Add the last period date
    const lastCycle = cycles[0];
    if (lastCycle.startDate) {
      periodDates.unshift(lastCycle.startDate.toDate().toISOString().split('T')[0]);
    }

    const averageCycleLength = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) 
      : 28; // Default to 28 days if no data

    const averagePeriodLength = periodLengths.length > 0
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : 5; // Default to 5 days if no data

    return NextResponse.json({
      averageCycleLength,
      averagePeriodLength,
      lastPeriodDate: lastCycle.startDate ? lastCycle.startDate.toDate().toISOString().split('T')[0] : null,
      cycleCount: cycles.length,
      periodDates
    });
  } catch (error) {
    console.error('Error calculating cycle stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate cycle statistics' },
      { status: 500 }
    );
  }
}
