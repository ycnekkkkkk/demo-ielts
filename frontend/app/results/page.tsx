'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'

type TabType = 'overview' | 'ielts' | 'beyond'

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!sessionId) {
      router.push('/')
      return
    }
    loadSession()
  }, [sessionId, router])

  const loadSession = async () => {
    if (!sessionId) return
    try {
      const sessionData = await apiClient.getSession(parseInt(sessionId))
      setSession(sessionData)
      setLoading(false)
    } catch (error) {
      console.error('Error loading session:', error)
      setLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-xl text-gray-600">Đang tải kết quả...</div>
        </div>
      </div>
    )
  }

  if (!session || !session.final_results) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
        >
          <div className="text-6xl mb-4">😕</div>
          <div className="text-xl text-red-600 mb-4">Không tìm thấy kết quả</div>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Về trang chủ
          </button>
        </motion.div>
      </div>
    )
  }

  const results = session.final_results

  const getBandColor = (band: number) => {
    if (band >= 7) return 'from-green-500 to-emerald-600'
    if (band >= 5.5) return 'from-yellow-500 to-orange-500'
    if (band > 0) return 'from-red-500 to-rose-600'
    return 'from-gray-400 to-gray-500'
  }

  const getBandLabel = (band: number) => {
    if (band >= 8) return 'Excellent'
    if (band >= 7) return 'Good'
    if (band >= 6) return 'Competent'
    if (band >= 5.5) return 'Modest'
    if (band > 0) return 'Limited'
    return 'No Score'
  }

  const BandCard = ({ title, band, icon }: { title: string; band: number; icon: string }) => {
    const percentage = (band / 9.0) * 100
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card text-center relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity"
          style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
        ></div>
        <div className="text-4xl mb-3">{icon}</div>
        <div className="text-gray-600 mb-2 text-sm font-medium uppercase tracking-wide">{title}</div>
        <div className={`bg-gradient-to-br ${getBandColor(band)} text-white text-5xl font-bold rounded-2xl w-24 h-24 flex items-center justify-center mx-auto shadow-xl mb-3`}>
          {band.toFixed(1)}
        </div>
        <div className="text-xs text-gray-500 mb-2">{getBandLabel(band)}</div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`h-full bg-gradient-to-r ${getBandColor(band)}`}
          />
        </div>
      </motion.div>
    )
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Tổng quan', icon: '📊' },
    { id: 'ielts' as TabType, label: 'Phân tích IELTS', icon: '📝' },
    { id: 'beyond' as TabType, label: 'Mở rộng', icon: '🚀' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold mb-4 gradient-text">Kết quả IELTS Test</h1>
        <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
          <span className="text-gray-600">Trình độ:</span>
          <span className="font-semibold capitalize text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {session.level}
          </span>
        </div>
      </motion.div>

      {/* Overall Band Score - Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-8"
      >
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="text-xl mb-4 font-semibold opacity-90">Overall Band Score</div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="text-8xl font-bold mb-3"
            >
              {results.overall?.toFixed(1) || '0.0'}
            </motion.div>
            <div className="text-blue-100 text-lg mb-4">out of 9.0</div>
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
              {getBandLabel(results.overall || 0)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Individual Bands Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <BandCard title="Listening" band={results.listening || 0} icon="🎧" />
        <BandCard title="Reading" band={results.reading || 0} icon="📖" />
        <BandCard title="Writing" band={results.writing || 0} icon="✍️" />
        <BandCard title="Speaking" band={results.speaking || 0} icon="🎤" />
      </motion.div>

      {/* Tabs Navigation */}
      {session.final_results?.detailed_analysis && (
        <div className="mb-6">
          <div className="flex space-x-2 bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && session.final_results?.detailed_analysis && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card"
          >
            <h2 className="text-2xl font-bold mb-6 gradient-text">Tổng quan kết quả</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                  <span className="mr-2">✅</span>
                  Điểm mạnh tổng thể
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  {results.overall >= 7 && (
                    <p>• Bạn đạt mức độ tốt trong kỳ thi IELTS</p>
                  )}
                  {results.listening >= 7 && (
                    <p>• Kỹ năng nghe hiểu của bạn rất tốt</p>
                  )}
                  {results.reading >= 7 && (
                    <p>• Khả năng đọc hiểu của bạn xuất sắc</p>
                  )}
                  {results.writing >= 7 && (
                    <p>• Kỹ năng viết của bạn rất tốt</p>
                  )}
                  {results.speaking >= 7 && (
                    <p>• Kỹ năng nói của bạn rất tốt</p>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-3 flex items-center">
                  <span className="mr-2">📈</span>
                  Cần cải thiện
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  {results.overall < 6 && (
                    <p>• Cần luyện tập thêm để nâng cao điểm tổng thể</p>
                  )}
                  {results.listening < 6 && (
                    <p>• Cần cải thiện kỹ năng nghe hiểu</p>
                  )}
                  {results.reading < 6 && (
                    <p>• Cần nâng cao khả năng đọc hiểu</p>
                  )}
                  {results.writing < 6 && (
                    <p>• Cần luyện tập thêm kỹ năng viết</p>
                  )}
                  {results.speaking < 6 && (
                    <p>• Cần cải thiện kỹ năng nói</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'ielts' && session.final_results?.detailed_analysis?.ielts_analysis && (
          <motion.div
            key="ielts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Reading */}
            {session.final_results.detailed_analysis.ielts_analysis.reading && (
              <CollapsibleSection
                title="📖 Reading (Đọc hiểu)"
                id="reading"
                expanded={expandedSections.has('reading')}
                onToggle={() => toggleSection('reading')}
              >
                <ReadingAnalysis data={session.final_results.detailed_analysis.ielts_analysis.reading} />
              </CollapsibleSection>
            )}

            {/* Listening */}
            {session.final_results.detailed_analysis.ielts_analysis.listening && (
              <CollapsibleSection
                title="🎧 Listening (Nghe hiểu)"
                id="listening"
                expanded={expandedSections.has('listening')}
                onToggle={() => toggleSection('listening')}
              >
                <ListeningAnalysis data={session.final_results.detailed_analysis.ielts_analysis.listening} />
              </CollapsibleSection>
            )}

            {/* Writing */}
            {session.final_results.detailed_analysis.ielts_analysis.writing && (
              <CollapsibleSection
                title="✍️ Writing (Viết)"
                id="writing"
                expanded={expandedSections.has('writing')}
                onToggle={() => toggleSection('writing')}
              >
                <WritingAnalysis data={session.final_results.detailed_analysis.ielts_analysis.writing} />
              </CollapsibleSection>
            )}

            {/* Speaking */}
            {session.final_results.detailed_analysis.ielts_analysis.speaking && (
              <CollapsibleSection
                title="🎤 Speaking (Nói)"
                id="speaking"
                expanded={expandedSections.has('speaking')}
                onToggle={() => toggleSection('speaking')}
              >
                <SpeakingAnalysis data={session.final_results.detailed_analysis.ielts_analysis.speaking} />
              </CollapsibleSection>
            )}
          </motion.div>
        )}

        {activeTab === 'beyond' && session.final_results?.detailed_analysis?.beyond_ielts && (
          <motion.div
            key="beyond"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <BeyondIELTSAnalysis data={session.final_results.detailed_analysis.beyond_ielts} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-8"
      >
        <button
          onClick={() => router.push('/')}
          className="btn-primary text-lg px-10 py-4"
        >
          Làm bài test mới
        </button>
      </motion.div>
    </div>
  )
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  id,
  expanded,
  onToggle,
  children
}: {
  title: string
  id: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl"
        >
          ▼
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Reading Analysis Component
function ReadingAnalysis({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.strengths && data.strengths.length > 0 && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <div className="font-semibold text-green-800 mb-2 flex items-center">
            <span className="mr-2">✅</span>
            Điểm mạnh
          </div>
          <ul className="space-y-1 text-gray-700">
            {data.strengths.map((s: string, i: number) => (
              <li key={i} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.weaknesses && data.weaknesses.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="font-semibold text-red-800 mb-2 flex items-center">
            <span className="mr-2">⚠️</span>
            Điểm yếu
          </div>
          <ul className="space-y-1 text-gray-700">
            {data.weaknesses.map((w: string, i: number) => (
              <li key={i} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.question_type_analysis && Object.keys(data.question_type_analysis).length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="font-semibold mb-3 text-gray-700">Phân tích theo dạng câu hỏi</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {Object.entries(data.question_type_analysis).map(([type, analysis]: [string, any]) => {
              // Handle if analysis is an object with score/correct/total/assessment
              let displayContent: React.ReactNode
              
              if (typeof analysis === 'object' && analysis !== null && !Array.isArray(analysis)) {
                // If it has score structure, render nicely
                if ('score' in analysis || 'correct' in analysis || 'total' in analysis) {
                  displayContent = (
                    <div className="mt-1 space-y-1">
                      {analysis.correct !== undefined && analysis.total !== undefined && (
                        <div className="text-gray-600">
                          Đúng: <span className="font-semibold text-green-600">{analysis.correct}</span> / {analysis.total}
                        </div>
                      )}
                      {analysis.score !== undefined && (
                        <div className="text-gray-600">
                          Điểm: <span className="font-semibold text-blue-600">{typeof analysis.score === 'number' ? analysis.score.toFixed(1) : analysis.score}</span>
                        </div>
                      )}
                      {analysis.assessment && (
                        <div className="text-gray-700 mt-2 italic">{analysis.assessment}</div>
                      )}
                    </div>
                  )
                } else {
                  // Other object, show as JSON
                  displayContent = <span className="text-gray-700 ml-2">{JSON.stringify(analysis)}</span>
                }
              } else {
                // String or other primitive
                displayContent = <span className="text-gray-700 ml-2">{String(analysis || '')}</span>
              }
              
              return (
                <div key={type} className="bg-white p-3 rounded-lg">
                  <div className="font-medium text-blue-600 capitalize mb-1">{type.replace(/_/g, ' ')}</div>
                  {displayContent}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Listening Analysis Component (similar to Reading)
function ListeningAnalysis({ data }: { data: any }) {
  return <ReadingAnalysis data={data} />
}

// Writing Analysis Component
function WritingAnalysis({ data }: { data: any }) {
  const criteria = ['task_achievement', 'coherence_cohesion', 'lexical_resource', 'grammatical_range']

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {criteria.map((criterion) => {
          const critData = data[criterion]
          if (!critData) return null
          return (
            <div key={criterion} className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200">
              <div className="font-semibold mb-2 text-gray-700 capitalize">{criterion.replace(/_/g, ' ')}</div>
              <div className="text-3xl font-bold text-blue-600 mb-3">{critData.score?.toFixed(1)}</div>
              {critData.strengths && critData.strengths.length > 0 && (
                <div className="text-xs text-green-700 mb-2">
                  <div className="font-medium mb-1">✅ Mạnh:</div>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    {critData.strengths.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {critData.weaknesses && critData.weaknesses.length > 0 && (
                <div className="text-xs text-red-700">
                  <div className="font-medium mb-1">⚠️ Yếu:</div>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    {critData.weaknesses.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {data.overall_assessment && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-l-4 border-blue-500">
          <div className="font-semibold mb-2 text-gray-700">Đánh giá tổng quan</div>
          <div className="text-gray-700">{data.overall_assessment}</div>
        </div>
      )}
    </div>
  )
}

// Speaking Analysis Component (similar to Writing)
function SpeakingAnalysis({ data }: { data: any }) {
  const criteria = ['fluency_coherence', 'lexical_resource', 'grammatical_range', 'pronunciation']

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {criteria.map((criterion) => {
          const critData = data[criterion]
          if (!critData) return null
          return (
            <div key={criterion} className="bg-gradient-to-br from-gray-50 to-purple-50 p-4 rounded-xl border border-gray-200">
              <div className="font-semibold mb-2 text-gray-700 capitalize">{criterion.replace(/_/g, ' ')}</div>
              <div className="text-3xl font-bold text-purple-600 mb-3">{critData.score?.toFixed(1)}</div>
              {critData.strengths && critData.strengths.length > 0 && (
                <div className="text-xs text-green-700 mb-2">
                  <div className="font-medium mb-1">✅ Mạnh:</div>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    {critData.strengths.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {critData.weaknesses && critData.weaknesses.length > 0 && (
                <div className="text-xs text-red-700">
                  <div className="font-medium mb-1">⚠️ Yếu:</div>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    {critData.weaknesses.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {data.overall_assessment && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-l-4 border-purple-500">
          <div className="font-semibold mb-2 text-gray-700">Đánh giá tổng quan</div>
          <div className="text-gray-700">{data.overall_assessment}</div>
        </div>
      )}
    </div>
  )
}

// Beyond IELTS Analysis Component
function BeyondIELTSAnalysis({ data }: { data: any }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['reflex']))

  const toggle = (id: string) => {
    setExpanded(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-4">
      {/* Reflex & Reception */}
      {(data.reflex_level || data.reception_ability) && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.reflex_level && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-200">
                <div className="font-semibold mb-2 text-gray-700 flex items-center">
                  <span className="mr-2">⚡</span>
                  Năng lực phản xạ
                </div>
                <div className="text-2xl font-bold text-blue-600 capitalize">{data.reflex_level}</div>
              </div>
            )}
            {data.reception_ability && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
                <div className="font-semibold mb-2 text-gray-700 flex items-center">
                  <span className="mr-2">🧠</span>
                  Khả năng tiếp thu
                </div>
                <div className="text-gray-700">{data.reception_ability}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other sections with collapsible */}
      {['mother_tongue_influence', 'grammar', 'pronunciation', 'vocabulary'].map((section) => {
        if (!data[section]) return null
        return (
          <CollapsibleSection
            key={section}
            title={getSectionTitle(section)}
            id={section}
            expanded={expanded.has(section)}
            onToggle={() => toggle(section)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(data[section]).map(([key, value]: [string, any]) => {
                // Handle if value is an object
                const displayValue = typeof value === 'object' && value !== null && !Array.isArray(value)
                  ? JSON.stringify(value, null, 2) // Show as formatted JSON
                  : String(value || '')
                
                return (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-semibold mb-2 text-gray-700 capitalize text-sm">{key.replace(/_/g, ' ')}</div>
                    <div className="text-gray-700 text-sm whitespace-pre-wrap">{displayValue}</div>
                  </div>
                )
              })}
            </div>
          </CollapsibleSection>
        )
      })}
    </div>
  )
}

function getSectionTitle(section: string): string {
  const titles: { [key: string]: string } = {
    mother_tongue_influence: '🌍 Ảnh hưởng của ngôn ngữ mẹ đẻ',
    grammar: '📚 Văn phạm',
    pronunciation: '🗣️ Phát âm',
    vocabulary: '📖 Từ vựng',
  }
  return titles[section] || section
}
