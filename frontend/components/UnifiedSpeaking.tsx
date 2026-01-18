'use client'

import { useState, useEffect, useRef } from 'react'

interface UnifiedSpeakingProps {
    part1?: Array<{ id: number; question: string }>
    part2?: { topic: string; task_card: string }
    part3?: Array<{ id: number; question: string }>
    onAnswer: (key: string, answer: string) => void
    answers: { [key: string]: string }
    onComplete?: () => void // Callback when all speaking questions are completed
}

interface SpeakingItem {
    type: 'part1' | 'part2' | 'part3'
    id: number | string
    question: string
    topic?: string
    task_card?: string
    answerKey: string
}

export default function UnifiedSpeaking({
    part1,
    part2,
    part3,
    onAnswer,
    answers,
    onComplete,
}: UnifiedSpeakingProps) {
    // Combine all parts into a single array
    const allQuestions: SpeakingItem[] = []

    // Add Part 1 questions
    if (part1) {
        part1.forEach((q) => {
            allQuestions.push({
                type: 'part1',
                id: q.id,
                question: q.question,
                answerKey: `speaking_part1_${q.id}`,
            })
        })
    }

    // Add Part 2 as a special question
    if (part2) {
        allQuestions.push({
            type: 'part2',
            id: 'part2',
            question: `${part2.topic}. ${part2.task_card}`,
            topic: part2.topic,
            task_card: part2.task_card,
            answerKey: 'speaking_part2',
        })
    }

    // Add Part 3 questions
    if (part3) {
        part3.forEach((q) => {
            allQuestions.push({
                type: 'part3',
                id: q.id,
                question: q.question,
                answerKey: `speaking_part3_${q.id}`,
            })
        })
    }

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [isReadingQuestion, setIsReadingQuestion] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [hasStarted, setHasStarted] = useState(false) // Track if user has started
    const [errorMessage, setErrorMessage] = useState<string>('') // Error message for user
    const [isSubmitting, setIsSubmitting] = useState(false) // Track when submitting answer
    const recognitionRef = useRef<any>(null)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null)
    const lastSpeechTimeRef = useRef<number>(0)
    const transcriptRef = useRef<string>('') // Keep latest transcript in ref
    const isRecordingRef = useRef<boolean>(false) // Track recording state in ref
    const restartAttemptsRef = useRef<number>(0) // Track restart attempts to prevent infinite loops
    const isRestartingRef = useRef<boolean>(false) // Track if we're currently restarting to avoid conflicts
    const currentQuestion = allQuestions[currentQuestionIndex]

    useEffect(() => {
        // Check if browser supports Speech Recognition
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

        if (SpeechRecognition) {
            setIsSupported(true)
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US'

            recognition.onresult = (event: any) => {
                let interimTranscript = ''
                let finalTranscript = ''
                let hasAnyTranscript = false
                let hasFinalResult = false

                console.log('Speech recognition result received, results count:', event.results.length)

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript
                    if (transcript && transcript.trim().length > 0) {
                        hasAnyTranscript = true
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript + ' '
                            hasFinalResult = true
                            console.log('Final transcript:', transcript)
                        } else {
                            interimTranscript += transcript
                            console.log('Interim transcript:', transcript)
                        }
                    }
                }

                // Update last speech time when there's any meaningful speech (non-empty transcript)
                if (hasAnyTranscript) {
                    lastSpeechTimeRef.current = Date.now()
                    restartAttemptsRef.current = 0 // Reset restart attempts on successful speech
                    isRestartingRef.current = false // Reset restarting flag when we get speech

                    // Clear error message if we got speech
                    if (errorMessage) {
                        setErrorMessage('')
                    }

                    // Update transcript - only show current speech (final + interim), don't append to previous
                    // This ensures we only save one answer per question
                    const currentTranscript = finalTranscript + interimTranscript
                    setTranscript(currentTranscript)
                    transcriptRef.current = currentTranscript
                    console.log('Updated transcript (current only):', currentTranscript)

                    // Reset timeout 1 minute timer when we get speech (only skip if no transcript at all)
                    if (timeoutTimerRef.current) {
                        clearTimeout(timeoutTimerRef.current)
                        timeoutTimerRef.current = null
                    }

                    // If we have a final result (user finished speaking), auto-submit immediately
                    if (hasFinalResult && finalTranscript.trim().length > 0) {
                        console.log('Final transcript received, auto-submitting...')

                        // Set recording state to false FIRST to prevent onend from restarting
                        isRecordingRef.current = false
                        setIsRecording(false)

                        // Stop recognition immediately to prevent restart
                        if (recognitionRef.current) {
                            try {
                                recognitionRef.current.stop()
                                console.log('Stopped recognition to prevent restart')
                            } catch (e) {
                                console.error('Error stopping recognition:', e)
                            }
                        }

                        // Clear any pending timers
                        if (silenceTimerRef.current) {
                            clearTimeout(silenceTimerRef.current)
                            silenceTimerRef.current = null
                        }
                        if (timeoutTimerRef.current) {
                            clearTimeout(timeoutTimerRef.current)
                            timeoutTimerRef.current = null
                        }

                        // Submit immediately (no delay needed since we already stopped recognition)
                        const finalTranscriptToSave = transcriptRef.current.trim()
                        if (finalTranscriptToSave.length > 0) {
                            console.log('Submitting answer:', finalTranscriptToSave)

                            // Show loading state
                            setIsSubmitting(true)
                            console.log('Set isSubmitting to true for question', currentQuestionIndex + 1)

                            // Save answer
                            if (currentQuestion) {
                                onAnswer(currentQuestion.answerKey, finalTranscriptToSave)
                            }

                            // Auto move to next question after a short delay
                            const submitTimeout = setTimeout(() => {
                                console.log('Moving to next question, current index:', currentQuestionIndex, 'total:', allQuestions.length)
                                setIsSubmitting(false) // Clear loading state
                                console.log('Set isSubmitting to false')
                                setCurrentQuestionIndex((prevIndex) => {
                                    if (prevIndex < allQuestions.length - 1) {
                                        console.log('Moving from question', prevIndex + 1, 'to', prevIndex + 2)
                                        return prevIndex + 1
                                    } else {
                                        // Last question completed
                                        console.log('All speaking questions completed!')
                                        if (onComplete) {
                                            onComplete()
                                        }
                                    }
                                    return prevIndex
                                })
                            }, 1500) // Show loading for 1.5 seconds before moving to next question

                            // Fallback: ensure isSubmitting is reset after 3 seconds max
                            setTimeout(() => {
                                setIsSubmitting((prev) => {
                                    if (prev) {
                                        console.warn('Fallback: Force reset isSubmitting after 3 seconds')
                                        return false
                                    }
                                    return prev
                                })
                            }, 3000)
                        }
                    } else {
                        // For interim results, set timer: if no speech for 3 seconds, auto-submit
                        // Reset silence timer whenever we get any speech
                        if (silenceTimerRef.current) {
                            clearTimeout(silenceTimerRef.current)
                            silenceTimerRef.current = null
                        }

                        if (isRecordingRef.current) {
                            silenceTimerRef.current = setTimeout(() => {
                                // Check if still recording and we have some transcript
                                if (isRecordingRef.current && transcriptRef.current.trim().length > 0) {
                                    // Double-check: verify no new speech in the last 3 seconds
                                    const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current
                                    if (timeSinceLastSpeech >= 2900) { // Allow 100ms margin
                                        console.log('Auto-submitting after 3 seconds of silence')
                                        autoSubmitAnswer()
                                    }
                                }
                            }, 3000)
                        }
                    }
                } else {
                    console.log('No meaningful transcript in result')
                }
            }

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error, event)

                // Handle different error types
                switch (event.error) {
                    case 'not-allowed':
                        setErrorMessage('Microphone permission denied. Please allow microphone access and refresh the page.')
                        setIsRecording(false)
                        isRecordingRef.current = false
                        isRestartingRef.current = false
                        break
                    case 'no-speech':
                        // Don't restart here - let onend handle it
                        // This error is normal when user stops speaking
                        // We don't restart from onerror to avoid conflicts with onend
                        console.log('No speech detected (this is normal, onend will handle restart)')
                        break
                    case 'audio-capture':
                        setErrorMessage('No microphone found. Please check your microphone connection.')
                        setIsRecording(false)
                        isRecordingRef.current = false
                        isRestartingRef.current = false
                        break
                    case 'network':
                        setErrorMessage('Network error. Please check your internet connection.')
                        setIsRecording(false)
                        isRecordingRef.current = false
                        isRestartingRef.current = false
                        break
                    case 'aborted':
                        // This is normal when we manually stop, ignore it
                        isRestartingRef.current = false
                        break
                    default:
                        console.error('Unknown speech recognition error:', event.error)
                        // Don't show error for 'no-speech' as it's normal
                        if (event.error !== 'no-speech') {
                            setErrorMessage(`Speech recognition error: ${event.error}`)
                        }
                        // Don't stop recording for minor errors
                        if (event.error === 'service-not-allowed' || event.error === 'bad-grammar') {
                            setIsRecording(false)
                            isRecordingRef.current = false
                            isRestartingRef.current = false
                        }
                }
            }

            recognition.onend = () => {
                console.log('Recognition ended, isRecordingRef:', isRecordingRef.current, 'isRestarting:', isRestartingRef.current)

                // Don't restart if we're not supposed to be recording
                // This can happen when we manually stopped for final transcript submission
                if (!isRecordingRef.current) {
                    console.log('Skipping restart - not recording (likely submitted)')
                    isRestartingRef.current = false
                    return
                }

                // If we're already restarting, skip this call
                if (isRestartingRef.current) {
                    console.log('Skipping restart - already restarting')
                    return
                }

                // Only restart if we haven't exceeded restart attempts
                if (restartAttemptsRef.current < 10) {
                    restartAttemptsRef.current++
                    isRestartingRef.current = true
                    console.log(`Auto-restarting recognition (attempt ${restartAttemptsRef.current})`)

                    // Use longer delay to avoid rapid restarts
                    const delay = restartAttemptsRef.current === 1 ? 1000 : 2000

                    setTimeout(() => {
                        // Double-check we should still be recording
                        if (!isRecordingRef.current) {
                            console.log('Stopped recording, canceling restart')
                            isRestartingRef.current = false
                            return
                        }

                        // Double-check we're still the one restarting (not another onend call)
                        if (!isRestartingRef.current) {
                            console.log('Another restart in progress, canceling this one')
                            return
                        }

                        try {
                            recognition.start()
                            console.log('Recognition restarted successfully')
                            restartAttemptsRef.current = 0 // Reset on successful restart
                            // Don't reset isRestartingRef immediately - let it reset when we get speech or on next end
                            setTimeout(() => {
                                isRestartingRef.current = false
                            }, 100)
                        } catch (e: any) {
                            console.error('Error restarting recognition in onend:', e)

                            // If it's "already started" error, that's actually OK - it means it's running
                            if (e.name === 'InvalidStateError' && (e.message.includes('already started') || e.message.includes('started'))) {
                                console.log('Recognition already running, that\'s OK')
                                restartAttemptsRef.current = 0
                                isRestartingRef.current = false
                            } else {
                                // For other errors, just stop trying after a few attempts
                                if (restartAttemptsRef.current >= 5) {
                                    console.log('Too many restart failures, stopping')
                                    setErrorMessage('Microphone connection issue. Please try refreshing the page.')
                                    setIsRecording(false)
                                    isRecordingRef.current = false
                                    isRestartingRef.current = false
                                } else {
                                    // Reset flag and let onend be called naturally if recognition stops again
                                    isRestartingRef.current = false
                                }
                            }
                        }
                    }, delay)
                } else {
                    console.log('Stopped restarting - too many attempts')
                    setErrorMessage('Microphone stopped working. Please refresh the page.')
                    setIsRecording(false)
                    isRecordingRef.current = false
                    isRestartingRef.current = false
                }
            }

            recognitionRef.current = recognition
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
            if (utteranceRef.current) {
                speechSynthesis.cancel()
            }
        }
    }, [])

    // Load saved answer when question changes
    useEffect(() => {
        console.log('Question changed, index:', currentQuestionIndex, 'total:', allQuestions.length)
        if (currentQuestion) {
            const savedAnswer = answers[currentQuestion.answerKey] || ''
            setTranscript(savedAnswer)
            transcriptRef.current = savedAnswer
            // Clear error message and submitting state when question changes
            setErrorMessage('')
            setIsSubmitting(false)
            console.log('Question loaded:', currentQuestion.answerKey, 'saved answer:', savedAnswer, 'isSubmitting reset to false')
        }
    }, [currentQuestionIndex, answers, currentQuestion])

    // Continuous silence detection: check every 500ms if user has been silent for 3 seconds
    useEffect(() => {
        if (!isRecording) return

        const silenceCheckInterval = setInterval(() => {
            // Check if still recording using ref (always has latest value)
            if (!isRecordingRef.current) {
                clearInterval(silenceCheckInterval)
                return
            }

            const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current
            const hasTranscript = transcriptRef.current.trim().length > 0

            // Debug log
            if (hasTranscript) {
                console.log(`Silence check: ${timeSinceLastSpeech}ms since last speech, transcript length: ${transcriptRef.current.trim().length}`)
            }

            // If user has been silent for 3+ seconds and has some transcript, auto-submit
            // Only check if lastSpeechTimeRef was actually set (user has spoken at least once)
            if (lastSpeechTimeRef.current > 0 && timeSinceLastSpeech >= 3000 && hasTranscript && recognitionRef.current) {
                console.log('Auto-submitting via interval check after 3 seconds of silence')
                clearInterval(silenceCheckInterval)
                autoSubmitAnswer()
            }
        }, 500) // Check every 500ms

        return () => {
            clearInterval(silenceCheckInterval)
        }
    }, [isRecording])

    // Auto-read question when question changes (only if user has started)
    useEffect(() => {
        if (currentQuestion && hasStarted && 'speechSynthesis' in window) {
            // Stop any ongoing recording
            if (isRecording) {
                stopRecording()
            }

            // Clear any existing timers
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
                silenceTimerRef.current = null
            }
            if (timeoutTimerRef.current) {
                clearTimeout(timeoutTimerRef.current)
                timeoutTimerRef.current = null
            }

            speechSynthesis.cancel()
            setIsReadingQuestion(true)
            const utterance = new SpeechSynthesisUtterance(currentQuestion.question)
            utterance.lang = 'en-US'
            utterance.rate = 0.85
            utterance.pitch = 1.0

            utterance.onend = () => {
                setIsReadingQuestion(false)
                // Auto-start recording after AI finishes reading
                setTimeout(() => {
                    startRecording()
                }, 500)
            }

            utterance.onerror = () => {
                setIsReadingQuestion(false)
                // Even on error, start recording
                setTimeout(() => {
                    startRecording()
                }, 500)
            }

            utteranceRef.current = utterance
            speechSynthesis.speak(utterance)
        }

        return () => {
            speechSynthesis.cancel()
        }
    }, [currentQuestionIndex, hasStarted])

    const startRecording = async () => {
        if (recognitionRef.current && !isRecordingRef.current) {
            // Check microphone permission first
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                // Stop the stream immediately, we just needed permission
                stream.getTracks().forEach(track => track.stop())
                console.log('Microphone permission granted')
            } catch (err: any) {
                console.error('Microphone permission error:', err)
                setErrorMessage('Microphone permission denied. Please allow microphone access in your browser settings and refresh the page.')
                return
            }

            // Clear any previous error and reset flags
            setErrorMessage('')
            restartAttemptsRef.current = 0
            isRestartingRef.current = false

            try {
                console.log('Starting speech recognition...')
                recognitionRef.current.start()
                setIsRecording(true)
                isRecordingRef.current = true
                setTranscript('')
                transcriptRef.current = ''
                // Don't set lastSpeechTimeRef here - only set it when user actually speaks
                // This ensures silence detection works correctly
                lastSpeechTimeRef.current = 0

                // Set timeout: 1 minute without any response → auto skip
                timeoutTimerRef.current = setTimeout(() => {
                    if (isRecordingRef.current && transcriptRef.current.trim().length === 0) {
                        // No response for 1 minute, skip to next question
                        console.log('Auto-skipping after 1 minute with no response')
                        skipQuestion()
                    }
                }, 60000) // 1 minute = 60000ms
            } catch (e: any) {
                console.error('Error starting recognition:', e)
                // If it's "already started", that's actually OK
                if (e.name === 'InvalidStateError' && e.message.includes('already started')) {
                    console.log('Recognition already running, continuing...')
                    setIsRecording(true)
                    isRecordingRef.current = true
                } else {
                    setErrorMessage(`Failed to start microphone: ${e.message || 'Unknown error'}`)
                    setIsRecording(false)
                    isRecordingRef.current = false
                }
            }
        }
    }

    const autoSubmitAnswer = () => {
        if (isRecordingRef.current && recognitionRef.current) {
            const finalTranscript = transcriptRef.current.trim()
            recognitionRef.current.stop()
            setIsRecording(false)
            isRecordingRef.current = false

            // Clear timers
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
                silenceTimerRef.current = null
            }
            if (timeoutTimerRef.current) {
                clearTimeout(timeoutTimerRef.current)
                timeoutTimerRef.current = null
            }

            // Show loading state
            setIsSubmitting(true)
            console.log('Auto-submit: Set isSubmitting to true for question', currentQuestionIndex + 1)

            // Save answer
            if (currentQuestion && finalTranscript.length > 0) {
                onAnswer(currentQuestion.answerKey, finalTranscript)
            }

            // Auto move to next question after showing loading
            setTimeout(() => {
                console.log('Auto-submit: Moving to next question, current index:', currentQuestionIndex, 'total:', allQuestions.length)
                setIsSubmitting(false) // Clear loading state
                console.log('Auto-submit: Set isSubmitting to false')
                setCurrentQuestionIndex((prevIndex) => {
                    if (prevIndex < allQuestions.length - 1) {
                        console.log('Auto-submit: Moving from question', prevIndex + 1, 'to', prevIndex + 2)
                        return prevIndex + 1
                    } else {
                        // Last question completed
                        console.log('Auto-submit: All speaking questions completed!')
                        if (onComplete) {
                            onComplete()
                        }
                    }
                    return prevIndex
                })
            }, 1500) // Show loading for 1.5 seconds before moving to next question

            // Fallback: ensure isSubmitting is reset after 3 seconds max
            setTimeout(() => {
                setIsSubmitting((prev) => {
                    if (prev) {
                        console.warn('Auto-submit fallback: Force reset isSubmitting after 3 seconds')
                        return false
                    }
                    return prev
                })
            }, 3000)
        }
    }

    const stopRecording = () => {
        if (recognitionRef.current && isRecordingRef.current) {
            console.log('Stopping recording...')
            isRecordingRef.current = false // Set this first to prevent restart
            isRestartingRef.current = false
            try {
                recognitionRef.current.stop()
            } catch (e) {
                console.error('Error stopping recognition:', e)
            }
            setIsRecording(false)

            // Clear timers
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
                silenceTimerRef.current = null
            }
            if (timeoutTimerRef.current) {
                clearTimeout(timeoutTimerRef.current)
                timeoutTimerRef.current = null
            }
        }
    }

    const skipQuestion = () => {
        if (isRecording) {
            stopRecording()
        }

        speechSynthesis.cancel()
        setIsReadingQuestion(false)

        // Clear timers
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
        }
        if (timeoutTimerRef.current) {
            clearTimeout(timeoutTimerRef.current)
            timeoutTimerRef.current = null
        }

        // Reset restart flags
        restartAttemptsRef.current = 0
        isRestartingRef.current = false

        if (currentQuestion) {
            onAnswer(currentQuestion.answerKey, '')
        }

        setTimeout(() => {
            if (currentQuestionIndex < allQuestions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1)
            }
        }, 500)
    }

    const startSpeaking = () => {
        setHasStarted(true)
        // The useEffect will automatically read the question when hasStarted becomes true
        // After reading, it will auto-start recording
    }

    const getPartName = (type: string) => {
        switch (type) {
            case 'part1':
                return 'Part 1: Introduction'
            case 'part2':
                return 'Part 2: Topic Card'
            case 'part3':
                return 'Part 3: Discussion'
            default:
                return 'Speaking'
        }
    }

    if (!isSupported) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 mb-4">
                    Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.
                </p>
                <p className="text-gray-600">
                    Vui lòng sử dụng Chrome hoặc Edge để làm phần Speaking.
                </p>
            </div>
        )
    }

    if (allQuestions.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">No speaking questions available</p>
            </div>
        )
    }

    const isLastQuestion = currentQuestionIndex === allQuestions.length - 1

    return (
        <div className="bg-blue-50 rounded-lg p-6">
            <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    {getPartName(currentQuestion.type)}
                </h4>
                <p className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {allQuestions.length}
                </p>
            </div>

            {/* Show topic card for Part 2 */}
            {currentQuestion.type === 'part2' && currentQuestion.topic && (
                <div className="bg-white rounded-lg p-4 mb-4 border-2 border-blue-300">
                    <div className="font-semibold text-lg mb-2 text-blue-700">
                        {currentQuestion.topic}
                    </div>
                    <div className="text-gray-700">{currentQuestion.task_card}</div>
                </div>
            )}

            <div className="bg-white rounded-lg p-6 mb-4 min-h-[200px] flex items-center justify-center">
                {!hasStarted ? (
                    <div className="text-center">
                        <p className="text-lg text-gray-700 mb-4">Ready to start the Speaking test?</p>
                        <p className="text-sm text-gray-500 mb-4">Click "Start" to begin. The AI will read the first question.</p>
                    </div>
                ) : isReadingQuestion ? (
                    <div className="text-center">
                        <div className="inline-block w-4 h-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-gray-600">AI is reading the question...</p>
                    </div>
                ) : isSubmitting ? (
                    <div className="text-center">
                        <div className="inline-block w-4 h-4 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-lg font-semibold text-green-600">Loading the answer...</p>
                        <p className="text-sm text-gray-500 mt-2">Your answer is being saved</p>
                    </div>
                ) : isRecording ? (
                    <div className="text-center w-full">
                        <div className="mb-4">
                            <span className="inline-block w-4 h-4 bg-red-600 rounded-full mr-2 animate-pulse"></span>
                            <span className="text-lg font-semibold text-red-600">Recording your answer...</span>
                        </div>
                        <div className="bg-gray-50 rounded p-4 min-h-[100px]">
                            <p className="text-gray-700 text-sm">{transcript || 'Speak now...'}</p>
                        </div>
                        {!transcript && (
                            <p className="text-xs text-gray-500 mt-2">Make sure your microphone is working and speak clearly</p>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <p>Waiting for next question...</p>
                    </div>
                )}
            </div>

            {/* Error message display */}
            {errorMessage && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm font-medium mb-1">⚠️ Error:</p>
                    <p className="text-red-600 text-sm">{errorMessage}</p>
                </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
                {!hasStarted ? (
                    <button
                        onClick={startSpeaking}
                        className="px-8 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-semibold text-lg"
                    >
                        Start Speaking Test
                    </button>
                ) : null}

                {hasStarted && (
                    <button
                        onClick={skipQuestion}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-medium"
                    >
                        Skip This Question
                    </button>
                )}
            </div>

            {transcript && !isRecording && (
                <div className="mt-4 bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-600 mb-1">Your answer:</p>
                    <p className="text-gray-800">{transcript}</p>
                </div>
            )}
        </div>
    )
}

