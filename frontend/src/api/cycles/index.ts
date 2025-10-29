// src/pages/api/cycles/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Cycle } from '@/types/cycle'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req })
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const userId = session.user.id
  const cyclesRef = collection(db, 'cycles')

  try {
    if (req.method === 'GET') {
      const q = query(
        cyclesRef,
        where('userId', '==', userId),
        orderBy('startDate', 'desc')
      )
      const snapshot = await getDocs(q)
      const cycles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      return res.status(200).json(cycles)
    }

    if (req.method === 'POST') {
      const cycleData: Omit<Cycle, 'id' | 'userId'> = req.body
      const newCycle = {
        ...cycleData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      const docRef = await addDoc(cyclesRef, newCycle)
      return res.status(201).json({ id: docRef.id, ...newCycle })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}