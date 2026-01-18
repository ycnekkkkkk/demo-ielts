'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'

const phases = [
  {
    value: 'listening_speaking',
    label: 'Listening & Speaking',
    description: '30 phút - Phần nghe và nói',
    icon: '🎧',
    color: 'from-blue-500 to-cyan-500',
    features: ['4 sections nghe (20 câu)', 'Speaking 3 parts', 'Ghi âm giọng nói']
  },
  {
    value: 'reading_writing',
    label: 'Reading & Writing',
    description: '30 phút - Phần đọc và viết',
    icon: '📚',
    color: 'from-purple-500 to-pink-500',
    features: ['2 passages (10 câu)', 'Task 1 & Task 2', '50-80 & 100-120 từ']
  },
]

function PhaseSelectionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [selectedPhase, setSelectedPhase] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      router.push('/level-selection')
    }
  }, [sessionId, router])

  const handleSubmit = async () => {
    if (!selectedPhase || !sessionId) return

    setLoading(true)
    try {
      await apiClient.selectPhase(parseInt(sessionId), { phase: selectedPhase as any })
      router.push(`/test?sessionId=${sessionId}&phase=1`)
    } catch (error) {
      console.error('Error selecting phase:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  if (!sessionId) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-4 gradient-text">
          Chọn phần làm trước
        </h1>
        <p className="text-gray-600 text-lg">
          Bạn có thể chọn làm phần nào trước. Phần còn lại sẽ được tạo sau khi bạn hoàn thành phần này.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {phases.map((phase, index) => (
          <motion.label
            key={phase.value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
            className={`block cursor-pointer transition-all duration-300 ${selectedPhase === phase.value
                ? 'scale-105'
                : 'hover:scale-102'
              }`}
          >
            <input
              type="radio"
              name="phase"
              value={phase.value}
              checked={selectedPhase === phase.value}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="sr-only"
            />
            <div className={`card h-full ${selectedPhase === phase.value
                ? `bg-gradient-to-br ${phase.color} text-white border-0 shadow-2xl`
                : 'hover:shadow-xl'
              }`}>
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{phase.icon}</div>
                <div className="font-bold text-2xl mb-2">{phase.label}</div>
                <div className={`text-sm ${selectedPhase === phase.value ? 'text-white/90' : 'text-gray-600'}`}>
                  {phase.description}
                </div>
              </div>
              <div className="space-y-2">
                {phase.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${selectedPhase === phase.value ? 'bg-white' : 'bg-blue-500'}`}></div>
                    <span className={`text-sm ${selectedPhase === phase.value ? 'text-white/90' : 'text-gray-700'}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              {selectedPhase === phase.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-4 text-center"
                >
                  <div className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">
                    Đã chọn
                  </div>
                </motion.div>
              )}
            </div>
          </motion.label>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-center"
      >
        <button
          onClick={handleSubmit}
          disabled={!selectedPhase || loading}
          className={`px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-300 ${selectedPhase && !loading
              ? 'btn-primary shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </span>
          ) : (
            'Bắt đầu làm bài →'
          )}
        </button>
      </motion.div>
    </div>
  )
}

export default function PhaseSelectionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-xl text-gray-600">Đang tải...</div>
        </div>
      </div>
    }>
      <PhaseSelectionContent />
    </Suspense>
  )
}

