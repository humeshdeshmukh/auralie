import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebase/config';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';

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
      orderBy('startDate', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json({ data: null });
    }

    const currentCycle = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };

    return NextResponse.json({ data: currentCycle });
  } catch (error) {
    console.error('Error fetching current cycle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current cycle' },
      { status: 500 }
    );
  }
}
