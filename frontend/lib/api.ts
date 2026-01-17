import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface SessionCreate {
  level: 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced'
}

export interface PhaseSelection {
  phase: 'listening_speaking' | 'reading_writing'
}

export interface SessionResponse {
  id: number
  level: string
  selected_phase: string | null
  status: string
  phase1_content: any
  phase2_content: any
  phase1_scores: any
  phase2_scores: any
  final_results: any
  created_at: string
  updated_at: string | null
}

export const apiClient = {
  // Create session
  createSession: async (data: SessionCreate): Promise<SessionResponse> => {
    const response = await api.post('/api/sessions', data)
    return response.data
  },

  // Select phase
  selectPhase: async (sessionId: number, phase: PhaseSelection): Promise<SessionResponse> => {
    const response = await api.post(`/api/sessions/${sessionId}/select-phase`, phase)
    return response.data
  },

  // Generate phase content
  generatePhase: async (sessionId: number): Promise<SessionResponse> => {
    const response = await api.post(`/api/sessions/${sessionId}/generate`)
    return response.data
  },

  // Get session
  getSession: async (sessionId: number): Promise<SessionResponse> => {
    const response = await api.get(`/api/sessions/${sessionId}`)
    return response.data
  },

  // Start phase 1
  startPhase1: async (sessionId: number) => {
    const response = await api.post(`/api/sessions/${sessionId}/start-phase1`)
    return response.data
  },

  // Submit phase 1
  submitPhase1: async (sessionId: number, answers: any): Promise<SessionResponse> => {
    const response = await api.post(`/api/sessions/${sessionId}/submit-phase1`, { answers })
    return response.data
  },

  // Generate phase 2
  generatePhase2: async (sessionId: number): Promise<SessionResponse> => {
    const response = await api.post(`/api/sessions/${sessionId}/generate-phase2`)
    return response.data
  },

  // Start phase 2
  startPhase2: async (sessionId: number) => {
    const response = await api.post(`/api/sessions/${sessionId}/start-phase2`)
    return response.data
  },

  // Submit phase 2
  submitPhase2: async (sessionId: number, answers: any): Promise<SessionResponse> => {
    const response = await api.post(`/api/sessions/${sessionId}/submit-phase2`, { answers })
    return response.data
  },

  // Aggregate results
  aggregateResults: async (sessionId: number): Promise<SessionResponse> => {
    const response = await api.post(`/api/sessions/${sessionId}/aggregate`)
    return response.data
  },

  // Generate detailed analysis (optional, now included in aggregate)
  generateAnalysis: async (sessionId: number): Promise<SessionResponse> => {
    const response = await api.post(`/api/sessions/${sessionId}/generate-analysis`)
    return response.data
  },
}

export default apiClient

