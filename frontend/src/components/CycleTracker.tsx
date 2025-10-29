// src/components/CycleTracker.tsx
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getCycles, createCycle } from '@/services/cycleService'
import { Cycle } from '@/types/cycle'

const CycleTracker = () => {
  const { data: session } = useSession()
  const [cycles, setCycles] = useState<Cycle[]>([])

  useEffect(() => {
    if (session) {
      loadCycles()
    }
  }, [session])

  const loadCycles = async () => {
    try {
      const data = await getCycles()
      setCycles(data)
    } catch (error) {
      console.error('Error loading cycles:', error)
    }
  }

  const handleAddCycle = async () => {
    try {
      const newCycle = {
        startDate: new Date().toISOString().split('T')[0],
        flowLevel: 'medium' as const,
        symptoms: [],
        isPredicted: false
      }
      await createCycle(newCycle)
      loadCycles() // Refresh the list
    } catch (error) {
      console.error('Error creating cycle:', error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cycle Tracker</h1>
      <button
        onClick={handleAddCycle}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Add New Cycle
      </button>
      
      <div className="mt-4">
        {cycles.map(cycle => (
          <div key={cycle.id} className="p-4 border rounded mb-2">
            <p>Start Date: {cycle.startDate}</p>
            <p>Flow: {cycle.flowLevel}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CycleTracker