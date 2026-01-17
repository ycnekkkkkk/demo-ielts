'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'

const levels = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Mới bắt đầu học tiếng Anh',
    color: 'from-green-400 to-emerald-500',
    icon: '🌱'
  },
  {
    value: 'elementary',
    label: 'Elementary',
    description: 'Cơ bản',
    color: 'from-blue-400 to-cyan-500',
    icon: '📚'
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Trung bình',
    color: 'from-yellow-400 to-orange-500',
    icon: '📖'
  },
  {
    value: 'upper_intermediate',
    label: 'Upper Intermediate',
    description: 'Khá',
    color: 'from-purple-400 to-pink-500',
    icon: '🎓'
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Cao cấp',
    color: 'from-red-400 to-rose-500',
    icon: '🏆'
  },
]

export default function LevelSelectionPage() {
  const router = useRouter()
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!selectedLevel) return

    setLoading(true)
    try {
      const session = await apiClient.createSession({ level: selectedLevel as any })
      router.push(`/phase-selection?sessionId=${session.id}`)
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Chọn trình độ hiện tại của bạn
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 mx-auto mb-4 rounded-full"></div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Chọn mức độ phù hợp nhất với khả năng tiếng Anh của bạn để có trải nghiệm tốt nhất
        </p>
      </motion.div>

      {/* Level Selection Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {levels.map((level, index) => (
            <motion.label
              key={level.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative block p-6 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${selectedLevel === level.value
                ? `bg-gradient-to-br ${level.color} text-white shadow-2xl ring-4 ring-offset-2 ring-blue-300`
                : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl'
                }`}
            >
              <input
                type="radio"
                name="level"
                value={level.value}
                checked={selectedLevel === level.value}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="sr-only"
              />

              {/* Background decoration */}
              <div className={`absolute inset-0 opacity-10 ${selectedLevel === level.value ? 'bg-white' : 'bg-gradient-to-br ' + level.color}`}></div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`text-5xl transform transition-transform ${selectedLevel === level.value ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {level.icon}
                  </div>
                  {selectedLevel === level.value && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>

                <div className="font-bold text-xl mb-2">{level.label}</div>
                <div className={`text-sm leading-relaxed ${selectedLevel === level.value ? 'text-white/90' : 'text-gray-600'}`}>
                  {level.description}
                </div>

                {/* Band score indicator */}
                <div className={`mt-4 pt-4 border-t ${selectedLevel === level.value ? 'border-white/20' : 'border-gray-200'}`}>
                  <div className={`text-xs font-medium ${selectedLevel === level.value ? 'text-white/80' : 'text-gray-500'}`}>
                    {level.value === 'beginner' && 'Band 3.0-4.0'}
                    {level.value === 'elementary' && 'Band 4.0-4.5'}
                    {level.value === 'intermediate' && 'Band 5.0-5.5'}
                    {level.value === 'upper_intermediate' && 'Band 6.0-6.5'}
                    {level.value === 'advanced' && 'Band 7.0-8.0'}
                  </div>
                </div>
              </div>
            </motion.label>
          ))}
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-center"
      >
        <motion.button
          whileHover={selectedLevel && !loading ? { scale: 1.05 } : {}}
          whileTap={selectedLevel && !loading ? { scale: 0.95 } : {}}
          onClick={handleSubmit}
          disabled={!selectedLevel || loading}
          className={`relative inline-flex items-center justify-center px-12 py-5 rounded-xl text-lg font-bold transition-all duration-300 overflow-hidden ${selectedLevel && !loading
            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl hover:shadow-3xl'
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
            <>
              <span className="relative z-10 flex items-center">
                Tiếp tục
                <motion.span
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                  className="ml-2 text-xl"
                >
                  →
                </motion.span>
              </span>
              {selectedLevel && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              )}
            </>
          )}
        </motion.button>
        {!selectedLevel && (
          <p className="text-sm text-gray-500 mt-4">Vui lòng chọn trình độ để tiếp tục</p>
        )}
      </motion.div>
    </div>
  )
}

