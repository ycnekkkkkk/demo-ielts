'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/api'
import SpeechRecorder from '@/components/SpeechRecorder'
import InteractiveSpeaking from '@/components/InteractiveSpeaking'
import UnifiedSpeaking from '@/components/UnifiedSpeaking'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Function to get audio playback rate based on level
function getAudioRate(level: string): number {
  const rateMap: { [key: string]: number } = {
    'beginner': 0.7,           // Chậm nhất cho người mới bắt đầu
    'elementary': 0.75,        // Chậm cho trình độ cơ bản
    'intermediate': 0.8,       // Trung bình
    'upper_intermediate': 0.85, // Hơi nhanh
    'advanced': 0.9,           // Gần tốc độ tự nhiên
  }
  return rateMap[level] || 0.8 // Default to intermediate if level not found
}

// Component for Listening Section with audio playback
function ListeningSection({ section, handleAnswerChange, level, answers }: { section: any, handleAnswerChange: (key: string, value: string) => void, level: string, answers: any }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)

  const playAudio = () => {
    if (!section.audio_transcript) {
      alert('No audio transcript for this section')
      return
    }

    // Chỉ cho phép nghe 1 lần
    if (hasPlayed) {
      return
    }

    if ('speechSynthesis' in window) {
      // Stop any current playback
      if (currentUtterance) {
        speechSynthesis.cancel()
      }

      const text = section.audio_transcript
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = getAudioRate(level) // Tốc độ phụ thuộc vào level
      utterance.pitch = 1.0

      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => {
        setIsPlaying(false)
        setCurrentUtterance(null)
        setHasPlayed(true) // Đánh dấu đã nghe xong
      }
      utterance.onerror = () => {
        setIsPlaying(false)
        setCurrentUtterance(null)
        setHasPlayed(true) // Đánh dấu đã nghe (kể cả khi lỗi)
      }

      setCurrentUtterance(utterance)
      speechSynthesis.speak(utterance)
    } else {
      alert('Your browser does not support text-to-speech')
    }
  }

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      setIsPlaying(false)
      setCurrentUtterance(null)
      setHasPlayed(true) // Đánh dấu đã nghe (dù đã dừng)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentUtterance) {
        speechSynthesis.cancel()
      }
    }
  }, [currentUtterance])

  return (
    <div className="mb-6 border-b pb-6 last:border-b-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold">{section.title}</h3>
        {section.audio_transcript && (
          <button
            onClick={isPlaying ? stopAudio : playAudio}
            disabled={hasPlayed && !isPlaying}
            className={`px-4 py-2 rounded font-semibold transition ${hasPlayed && !isPlaying
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : isPlaying
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
              }`}
          >
            {isPlaying ? (
              <>
                <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                Stop
              </>
            ) : hasPlayed ? (
              <>Already Played</>
            ) : (
              <>Listen to Section {section.id}</>
            )}
          </button>
        )}
      </div>
      <p className="text-gray-600 mb-4">{section.instructions}</p>
      {section.audio_transcript && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Click the "Listen to Section {section.id}" button above to play the audio. <strong>You can only listen once.</strong>
          </p>
        </div>
      )}
      <div className="space-y-4">
        {section.questions?.map((q: any) => (
          <div key={q.id} className="border-b pb-4">
            <div className="font-semibold mb-2">Câu {q.id}: {q.question}</div>
            {q.type === 'multiple_choice' && q.options ? (
              <div className="space-y-2">
                {q.options.map((opt: string, idx: number) => (
                  <label key={idx} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name={`listening_s${section.id}_q${q.id}`}
                      value={opt.split('.')[0].trim()}
                      onChange={(e) => handleAnswerChange(`listening_s${section.id}_q${q.id}`, e.target.value)}
                      className="mr-2"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            ) : q.type === 'tf_ng' || q.type === 'true_false' ? (
              <div className="mt-2">
                <div className="space-y-2">
                  {['True', 'False', 'Not Given'].map((option) => (
                    <label key={option} className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name={`listening_s${section.id}_q${q.id}`}
                        value={option}
                        checked={answers[`listening_s${section.id}_q${q.id}`] === option}
                        onChange={(e) => handleAnswerChange(`listening_s${section.id}_q${q.id}`, e.target.value)}
                        className="mr-3 w-4 h-4"
                      />
                      <span className="font-medium">{option}</span>
                    </label>
                  ))}
                </div>
                {/* <p className="text-xs text-gray-500 mt-2">
                  <strong>Lưu ý:</strong> True = thông tin đúng, False = thông tin sai, Not Given = không có thông tin trong bài
                </p> */}
              </div>
            ) : (
              <input
                type="text"
                className="w-full border rounded px-3 py-2 mt-2"
                placeholder="Enter your answer..."
                value={answers[`listening_s${section.id}_q${q.id}`] || ''}
                onChange={(e) => handleAnswerChange(`listening_s${section.id}_q${q.id}`, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const phaseParam = searchParams.get('phase')

  const [session, setSession] = useState<any>(null)
  const phase = phaseParam ? parseInt(phaseParam) : 1
  const [content, setContent] = useState<any>(null)
  const [answers, setAnswers] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [waitingForResults, setWaitingForResults] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      router.push('/level-selection')
      return
    }

    const loadSession = async () => {
      if (!sessionId) return
      const currentPhase = phaseParam ? parseInt(phaseParam) : 1
      try {
        console.log(`Loading session ${sessionId} for phase ${currentPhase}`)
        const sessionData = await apiClient.getSession(parseInt(sessionId))
        setSession(sessionData)

        // Generate content if not exists
        if (currentPhase === 1 && !sessionData.phase1_content) {
          console.log('Generating phase 1 content...')
          await apiClient.generatePhase(parseInt(sessionId))
          const updated = await apiClient.getSession(parseInt(sessionId))
          setSession(updated)
          setContent(updated.phase1_content)
        } else if (currentPhase === 1 && sessionData.phase1_content) {
          console.log('Phase 1 content already exists, loading...')
          setContent(sessionData.phase1_content)
        } else if (currentPhase === 2 && !sessionData.phase2_content) {
          console.log('Generating phase 2 content...')
          await apiClient.generatePhase2(parseInt(sessionId))
          const updated = await apiClient.getSession(parseInt(sessionId))
          setSession(updated)
          setContent(updated.phase2_content)
        } else if (currentPhase === 2 && sessionData.phase2_content) {
          console.log('Phase 2 content already exists, loading...')
          setContent(sessionData.phase2_content)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading session:', error)
        setLoading(false)
      }
    }

    // Reset state when phase changes
    setLoading(true)
    setContent(null)
    setAnswers({})
    setSubmitting(false)  // Reset submitting state when phase changes
    loadSession()
  }, [sessionId, phaseParam, router])

  const handleAnswerChange = (key: string, value: string) => {
    setAnswers({ ...answers, [key]: value })
  }

  // Function to count words
  const countWords = (text: string): number => {
    if (!text || !text.trim()) return 0
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Function to get word count status (for color coding)
  const getWordCountStatus = (current: number, min: number, max: number): { color: string; message: string } => {
    if (current === 0) {
      return { color: 'text-gray-500', message: 'Not written' }
    }
    if (current < min) {
      return { color: 'text-red-600', message: `Missing ${min - current} words` }
    }
    if (current > max) {
      return { color: 'text-orange-600', message: `Exceeded ${current - max} words` }
    }
    return { color: 'text-green-600', message: 'Met target' }
  }

  // Component to render chart from structured data
  const ChartRenderer = ({ chartData }: { chartData: any }) => {
    if (!chartData || !chartData.type) {
      return null
    }

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']
    
    // Prepare data for charts
    const chartDataArray = chartData.labels?.map((label: string, idx: number) => ({
      name: label,
      value: chartData.data?.[idx] || 0
    })) || []

    if (chartData.type === 'pie' || (chartData.type === 'bar' && chartDataArray.length <= 6)) {
      return (
        <div className="w-full">
          <h4 className="text-lg font-semibold mb-3 text-center">{chartData.title || 'Chart'}</h4>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartDataArray}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartDataArray.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )
    }

    if (chartData.type === 'line') {
      return (
        <div className="w-full">
          <h4 className="text-lg font-semibold mb-3 text-center">{chartData.title || 'Chart'}</h4>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartDataArray}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: chartData.xAxis || '', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: chartData.yAxis || '', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    }

    // Default to bar chart
    return (
      <div className="w-full">
        <h4 className="text-lg font-semibold mb-3 text-center">{chartData.title || 'Chart'}</h4>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartDataArray}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" label={{ value: chartData.xAxis || '', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: chartData.yAxis || '', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!sessionId) return
    setSubmitting(true)

    try {
      if (phase === 1) {
        console.log('Submitting phase 1...')
        const result = await apiClient.submitPhase1(parseInt(sessionId), answers)
        console.log('Phase 1 submitted successfully:', result)
        // Reset submitting before navigation
        setSubmitting(false)
        // Move to phase 2
        router.push(`/test?sessionId=${sessionId}&phase=2`)
      } else {
        console.log('Submitting phase 2...')
        setSubmitting(true)
        await apiClient.submitPhase2(parseInt(sessionId), answers)
        console.log('Phase 2 submitted, aggregating results...')
        // Show waiting screen while aggregating
        setSubmitting(false)
        setWaitingForResults(true)
        // Aggregate and show results
        await apiClient.aggregateResults(parseInt(sessionId))
        router.push(`/results?sessionId=${sessionId}`)
      }
    } catch (error: any) {
      console.error('Error submitting:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
      alert(errorMessage)
      setSubmitting(false)
    }
  }

  // Loading screen when generating test content
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
              <span className="text-4xl">📝</span>
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-blue-200 rounded-2xl animate-spin border-t-transparent"></div>
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Creating test
          </h2>
          <p className="text-gray-600 mb-6">
            The system is using AI to create a test suitable for your level...
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  // Waiting for results screen after submitting phase 2
  if (waitingForResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-12 h-12 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Processing results
          </h2>
          <p className="text-gray-600 mb-2">
            The system is grading and analyzing your answers...
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Please wait for a moment
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <div className="text-xl text-red-600">No test content found</div>
      </div>
    )
  }

  const isListeningSpeaking = session?.selected_phase === 'listening_speaking'
  const isPhase1 = phase === 1
  const showListening = (isListeningSpeaking && isPhase1) || (!isListeningSpeaking && !isPhase1)
  const showSpeaking = (isListeningSpeaking && isPhase1) || (!isListeningSpeaking && !isPhase1)
  const showReading = (!isListeningSpeaking && isPhase1) || (isListeningSpeaking && !isPhase1)
  const showWriting = (!isListeningSpeaking && isPhase1) || (isListeningSpeaking && !isPhase1)

  // Determine time and question count based on phase type
  const getTimeLimit = () => {
    return '30 minutes'  // Both phases are 30 minutes
  }

  const getQuestionInfo = () => {
    if (showListening) {
      return '4 sections, 20 questions'
    } else if (showReading) {
      return '2 passages, 10 questions'
    }
    return ''
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl mb-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">
          Phase {phase}: {isPhase1 ? (showListening ? 'Listening & Speaking' : 'Reading & Writing') : (showListening ? 'Listening & Speaking' : 'Reading & Writing')}
        </h1>
        <div className="flex items-center space-x-4 text-blue-100">
          <span className="flex items-center">
            <span className="mr-2">⏱️</span>
            Time: <span className="font-semibold ml-1">{getTimeLimit()}</span>
          </span>
          {(showListening || showReading) && (
            <span className="text-sm">
              {getQuestionInfo()}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Listening Section */}
        {showListening && content.listening && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="mr-2">🎧</span>
                Listening
              </h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                4 sections, 20 questions
              </span>
            </div>
            {content.listening.sections?.map((section: any) => (
              <ListeningSection
                key={section.id}
                section={section}
                handleAnswerChange={handleAnswerChange}
                level={session?.level || 'intermediate'}
                answers={answers}
              />
            ))}
          </div>
        )}

        {/* Reading Section */}
        {showReading && content.reading && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="mr-2">📖</span>
                Reading
              </h2>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                2 passages, 10 questions
              </span>
            </div>
            {content.reading.passages?.map((passage: any) => (
              <div key={passage.id} className="mb-6">
                <h3 className="text-xl font-semibold mb-3">{passage.title}</h3>
                <div className="bg-gray-50 p-4 rounded mb-4 whitespace-pre-wrap">{passage.content}</div>
                <div className="space-y-4">
                  {passage.questions?.map((q: any) => (
                    <div key={q.id} className="border-b pb-4">
                      <div className="font-semibold mb-2">Câu {q.id}: {q.question}</div>
                      {q.type === 'multiple_choice' && q.options ? (
                        <div className="space-y-2">
                          {q.options.map((opt: string, idx: number) => (
                            <label key={idx} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name={`reading_p${passage.id}_q${q.id}`}
                                value={opt.split('.')[0].trim()}
                                checked={answers[`reading_p${passage.id}_q${q.id}`] === opt.split('.')[0].trim()}
                                onChange={(e) => handleAnswerChange(`reading_p${passage.id}_q${q.id}`, e.target.value)}
                                className="mr-2"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : q.type === 'tf_ng' || q.type === 'true_false' ? (
                        <div className="mt-2">
                          <div className="space-y-2">
                            {['True', 'False', 'Not Given'].map((option) => (
                              <label key={option} className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                                <input
                                  type="radio"
                                  name={`reading_p${passage.id}_q${q.id}`}
                                  value={option}
                                  checked={answers[`reading_p${passage.id}_q${q.id}`] === option}
                                  onChange={(e) => handleAnswerChange(`reading_p${passage.id}_q${q.id}`, e.target.value)}
                                  className="mr-3 w-4 h-4"
                                />
                                <span className="font-medium">{option}</span>
                              </label>
                            ))}
                          </div>
                          {/* <p className="text-xs text-gray-500 mt-2">
                            <strong>Lưu ý:</strong> True = thông tin đúng, False = thông tin sai, Not Given = không có thông tin trong bài
                          </p> */}
                        </div>
                      ) : (q.type === 'matching' || q.type === 'matching_headings') && q.options ? (
                        <div className="mt-2">
                          {/* Check if this is multi-item matching (has items array or question mentions multiple paragraphs) */}
                          {q.items && q.items.length > 0 ? (
                            <div className="space-y-3">
                              <p className="text-sm text-gray-700 mb-3 font-medium">{q.question}</p>
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="space-y-3">
                                  {q.items.map((item: string, itemIdx: number) => {
                                    const answerKey = `reading_p${passage.id}_q${q.id}_${item}`
                                    return (
                                      <div key={itemIdx} className="flex items-center gap-3">
                                        <div className="font-semibold text-gray-700 min-w-[40px]">
                                          Paragraph {item}:
                                        </div>
                                        <select
                                          className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                          value={answers[answerKey] || ''}
                                          onChange={(e) => handleAnswerChange(answerKey, e.target.value)}
                                        >
                                          <option value="">-- Choose heading --</option>
                                          {q.options.map((opt: string, optIdx: number) => {
                                            const value = opt.includes('.') ? opt.split('.')[0].trim() : opt.trim()
                                            const label = opt.includes('.') ? opt : opt
                                            return (
                                              <option key={optIdx} value={value}>
                                                {label}
                                              </option>
                                            )
                                          })}
                                        </select>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Match each paragraph with the most suitable heading from the list above.
                              </p>
                            </div>
                          ) : (
                            <div>
                              <select
                                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                value={answers[`reading_p${passage.id}_q${q.id}`] || ''}
                                onChange={(e) => handleAnswerChange(`reading_p${passage.id}_q${q.id}`, e.target.value)}
                              >
                                <option value="">-- Choose the answer --</option>
                                {q.options.map((opt: string, idx: number) => {
                                  // Handle both "A. Option text" and just "A" formats
                                  const value = opt.includes('.') ? opt.split('.')[0].trim() : opt.trim()
                                  const label = opt.includes('.') ? opt : opt
                                  return (
                                    <option key={idx} value={value}>
                                      {label}
                                    </option>
                                  )
                                })}
                              </select>
                              <p className="text-xs text-gray-500 mt-1">
                                {q.type === 'matching_headings'
                                  ? 'Choose the heading that matches the paragraph'
                                  : 'Match the question with the appropriate answer'}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2 mt-2"
                          placeholder="Enter your answer..."
                          value={answers[`reading_p${passage.id}_q${q.id}`] || ''}
                          onChange={(e) => handleAnswerChange(`reading_p${passage.id}_q${q.id}`, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Speaking Section - Unified */}
        {showSpeaking && content.speaking && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="mr-2">🎤</span>
                Speaking
              </h2>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                3 parts (3-4 Part 1, 1 Part 2, 3-4 Part 3)
              </span>
            </div>
            <UnifiedSpeaking
              part1={content.speaking.part1}
              part2={content.speaking.part2}
              part3={content.speaking.part3}
              onAnswer={(key, answer) => handleAnswerChange(key, answer)}
              answers={answers}
            />
          </div>
        )}

        {/* Writing Section */}
        {showWriting && content.writing && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center">
                <span className="mr-2">✍️</span>
                Writing
              </h2>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                Task 1 & Task 2
              </span>
            </div>

            {/* Task 1 */}
            {content.writing.task1 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold">Task 1: Describe Chart/Graph</h3>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    50-80 words
                  </span>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg mb-4 border border-blue-200">
                  <div className="font-semibold mb-2 text-gray-800">Instructions:</div>
                  <div className="text-gray-700 mb-2">{content.writing.task1.instructions || "Summarise the information by selecting and reporting the main features, and make comparisons where relevant."}</div>
                </div>
                {(content.writing.task1.chart_data || content.writing.task1.chart_description) && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <div className="font-semibold text-blue-800 mb-3 flex items-center">
                      <span className="mr-2">📊</span>
                      Chart Data
                    </div>
                    {content.writing.task1.chart_data ? (
                      <div className="bg-white p-4 rounded border border-blue-100">
                        <ChartRenderer chartData={content.writing.task1.chart_data} />
                      </div>
                    ) : content.writing.task1.chart_description ? (
                      <div className="bg-white p-3 rounded border border-blue-100">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {content.writing.task1.chart_description}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 italic">
                          Note: Chart data is provided as text. Analyze and describe the main features and trends.
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
                <textarea
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  rows={6}
                  placeholder={`Write ${content.writing.task1.min_words || 50}-${content.writing.task1.max_words || 80} words...`}
                  value={answers.writing_task1 || ''}
                  onChange={(e) => handleAnswerChange('writing_task1', e.target.value)}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">
                      Target: <span className="font-semibold">{content.writing.task1.min_words || 50}-{content.writing.task1.max_words || 80} words</span>
                    </div>
                    <div className="text-sm font-semibold">
                      | You have written: <span className={getWordCountStatus(
                        countWords(answers.writing_task1 || ''),
                        content.writing.task1.min_words || 50,
                        content.writing.task1.max_words || 80
                      ).color}>
                        {countWords(answers.writing_task1 || '')} words
                      </span>
                    </div>
                    <div className={`text-xs font-medium ${getWordCountStatus(
                      countWords(answers.writing_task1 || ''),
                      content.writing.task1.min_words || 50,
                      content.writing.task1.max_words || 80
                    ).color}`}>
                      {getWordCountStatus(
                        countWords(answers.writing_task1 || ''),
                        content.writing.task1.min_words || 50,
                        content.writing.task1.max_words || 80
                      ).message}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Tip: Describe the trend and compare the data
                  </div>
                </div>
              </div>
            )}

            {/* Task 2 */}
            {content.writing.task2 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold">Task 2: Essay</h3>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    100-120 words
                  </span>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg mb-4 border border-purple-200">
                  <div className="font-semibold mb-2 text-gray-800">Question:</div>
                  <div className="text-gray-700 leading-relaxed">{content.writing.task2.question}</div>
                </div>
                <textarea
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                  rows={10}
                  placeholder={`Write a essay ${content.writing.task2.min_words || 100}-${content.writing.task2.max_words || 120} words...`}
                  value={answers.writing_task2 || ''}
                  onChange={(e) => handleAnswerChange('writing_task2', e.target.value)}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">
                      Target: <span className="font-semibold">{content.writing.task2.min_words || 100}-{content.writing.task2.max_words || 120} words</span>
                    </div>
                    <div className="text-sm font-semibold">
                      | You have written: <span className={getWordCountStatus(
                        countWords(answers.writing_task2 || ''),
                        content.writing.task2.min_words || 100,
                        content.writing.task2.max_words || 120
                      ).color}>
                        {countWords(answers.writing_task2 || '')} words
                      </span>
                    </div>
                    <div className={`text-xs font-medium ${getWordCountStatus(
                      countWords(answers.writing_task2 || ''),
                      content.writing.task2.min_words || 100,
                      content.writing.task2.max_words || 120
                    ).color}`}>
                      {getWordCountStatus(
                        countWords(answers.writing_task2 || ''),
                        content.writing.task2.min_words || 100,
                        content.writing.task2.max_words || 120
                      ).message}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Tip: Write clearly, structurally and enough words
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="text-center py-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-8 py-3 rounded-lg text-lg font-semibold transition ${submitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
              }`}
          >
            {submitting ? 'Processing...' : phase === 1 ? 'Submit and continue →' : 'Submit and view results →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-xl text-gray-600">Loading test...</div>
        </div>
      </div>
    }>
      <TestContent />
    </Suspense>
  )
}

