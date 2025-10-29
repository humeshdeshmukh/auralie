import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeCycleData } from '@/lib/gemini';

export async function GET(request: Request) {
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

    return NextResponse.json(cycles);
  } catch (error) {
    console.error('Error fetching cycles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cycles' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const cycleData = {
      ...data,
      userId: session.user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'cycles'), cycleData);

    // If this is a new cycle, analyze with Gemini
    if (data.isPeriodStart) {
      try {
        const cyclesRef = collection(db, 'cycles');
        const q = query(
          cyclesRef,
          where('userId', '==', session.user.email),
          orderBy('startDate', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const userCycles = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const analysis = await analyzeCycleData(userCycles);
        
        // Save analysis to user's document
        await updateDoc(doc(db, 'users', session.user.email), {
          lastAnalysis: analysis,
          lastAnalysisDate: serverTimestamp()
        });

        return NextResponse.json({
          id: docRef.id,
          ...cycleData,
          analysis
        });
      } catch (analysisError) {
        console.error('Analysis error:', analysisError);
        // Continue even if analysis fails
      }
    }

    return NextResponse.json({ id: docRef.id, ...cycleData });
  } catch (error) {
    console.error('Error creating cycle:', error);
    return NextResponse.json(
      { error: 'Failed to create cycle' },
      { status: 500 }
    );
  }
}
