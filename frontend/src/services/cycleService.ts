// src/services/cycleService.ts
import { Cycle } from '@/types/cycle'

const API_BASE = '/api/cycles'

export const getCycles = async (): Promise<Cycle[]> => {
  const response = await fetch(API_BASE)
  if (!response.ok) throw new Error('Failed to fetch cycles')
  return response.json()
}

export const createCycle = async (cycle: Omit<Cycle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Cycle> => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cycle)
  })
  if (!response.ok) throw new Error('Failed to create cycle')
  return response.json()
}