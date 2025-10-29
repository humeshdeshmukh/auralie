// src/types/cycle.ts
export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy'

export interface Cycle {
  id?: string
  userId: string
  startDate: string
  endDate?: string
  flowLevel: FlowLevel
  symptoms: string[]
  notes?: string
  mood?: string
  temperature?: number
  weight?: number
  isPredicted: boolean
  createdAt?: string
  updatedAt?: string
}