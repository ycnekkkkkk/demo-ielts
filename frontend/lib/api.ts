import axios, { AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Log API URL for debugging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API URL:', API_URL)
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout for long operations
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      console.error('[API Error]', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        data: error.response.data,
      })
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API Error] No response received', {
        url: error.config?.url,
        message: error.message,
      })
    } else {
      // Something else happened
      console.error('[API Error]', error.message)
    }
    return Promise.reject(error)
  }
)

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
    try {
      const response = await api.post('/api/sessions', data)
      return response.data
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  },

  // Select phase
  selectPhase: async (sessionId: number, phase: PhaseSelection): Promise<SessionResponse> => {
    try {
      const response = await api.post(`/api/sessions/${sessionId}/select-phase`, phase)
      return response.data
    } catch (error) {
      console.error(`Error selecting phase for session ${sessionId}:`, error)
      throw error
    }
  },

  // Generate phase content
  generatePhase: async (sessionId: number): Promise<SessionResponse> => {
    try {
      const response = await api.post(`/api/sessions/${sessionId}/generate`)
      return response.data
    } catch (error) {
      console.error(`Error generating phase for session ${sessionId}:`, error)
      throw error
    }
  },

  // Get session
  getSession: async (sessionId: number): Promise<SessionResponse> => {
    try {
      const response = await api.get(`/api/sessions/${sessionId}`)
      return response.data
    } catch (error) {
      console.error(`Error getting session ${sessionId}:`, error)
      throw error
    }
  },

  // Start phase 1
  startPhase1: async (sessionId: number) => {
    try {
      const response = await api.post(`/api/sessions/${sessionId}/start-phase1`)
      return response.data
    } catch (error) {
      console.error(`Error starting phase 1 for session ${sessionId}:`, error)
      throw error
    }
  },

  // Submit phase 1
  submitPhase1: async (sessionId: number, answers: any): Promise<SessionResponse> => {
    try {
      const response = await api.post(`/api/sessions/${sessionId}/submit-phase1`, { answers })
      return response.data
    } catch (error) {
      console.error(`Error submitting phase 1 for session ${sessionId}:`, error)
      throw error
    }
  },

  // Generate phase 2
  generatePhase2: async (sessionId: number): Promise<SessionResponse> => {
    try {
      const response = await api.post(`/api/sessions/${sessionId}/generate-phase2`)
      return response.data
    } catch (error) {
      console.error(`Error generating phase 2 for session ${sessionId}:`, error)
      throw error
    }
  },

  // Start phase 2
  startPhase2: async (sessionId: number) => {
    try {
      const response = await api.post(`/api/sessions/${sessionId}/start-phase2`)
      return response.data
    } catch (error) {
      console.error(`Error starting phase 2 for session ${sessionId}:`, error)
      throw error
    }
  },

  // Submit phase 2
  submitPhase2: async (sessionId: number, answers: any): Promise<SessionResponse> => {
    try {
      const response = await api.post(`/api/sessions/${sessionId}/submit-phase2`, { answers })
      return response.data
    } catch (error) {
      console.error(`Error submitting phase 2 for session ${sessionId}:`, error)
      throw error
    }
  },

  // Aggregate results
  aggregateResults: async (sessionId: number): Promise<SessionResponse> => {
    try {
      const response = await api.post(`/api/sessions/${sessionId}/aggregate`)
      return response.data
    } catch (error) {
      console.error(`Error aggregating results for session ${sessionId}:`, error)
      throw error
    }
  },

  // Generate detailed analysis (optional, now included in aggregate)
  generateAnalysis: async (sessionId: number): Promise<SessionResponse> => {
    try {
      const response = await api.post(`/api/sessions/${sessionId}/generate-analysis`)
      return response.data
    } catch (error) {
      console.error(`Error generating analysis for session ${sessionId}:`, error)
      throw error
    }
  },
}

export default apiClient

