'use client'

import { useState, useEffect, useRef } from 'react'

interface InteractiveSpeakingProps {
    questions: Array<{ id: number; question: string }>
    partName: string
    onAnswer: (key: string, answer: string) => void
    answers: { [key: string]: string }
    answerKeyPrefix: string
}

export default function InteractiveSpeaking({
    questions,
    partName,
    onAnswer,
    answers,
    answerKeyPrefix,
}: InteractiveSpeakingProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [isReadingQuestion, setIsReadingQuestion] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const [transcript, setTranscript] = useState('')
    const recognitionRef = useRef<any>(null)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const currentQuestion = questions[currentQuestionIndex]

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

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' '
                    } else {
                        interimTranscript += transcript
                    }
                }

                setTranscript((prev) => {
                    const newTranscript = prev + finalTranscript + interimTranscript
                    return newTranscript
                })
            }

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error)
                if (event.error === 'no-speech' && isRecording) {
                    // Auto restart if no speech detected
                    try {
                        recognition.start()
                    } catch (e) {
                        console.error('Error restarting recognition:', e)
                    }
                }
            }

            recognition.onend = () => {
                if (isRecording) {
                    try {
                        recognition.start()
                    } catch (e) {
                        console.error('Error restarting recognition:', e)
                        setIsRecording(false)
                    }
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
    }, [isRecording])

    // Load saved answer when question changes
    useEffect(() => {
        const answerKey = `${answerKeyPrefix}_${currentQuestion.id}`
        const savedAnswer = answers[answerKey] || ''
        setTranscript(savedAnswer)
    }, [currentQuestionIndex, answerKeyPrefix, answers, currentQuestion])

    // Auto-read question when question changes
    useEffect(() => {
        if (currentQuestion && 'speechSynthesis' in window) {
            // Stop any current speech
            speechSynthesis.cancel()

            setIsReadingQuestion(true)
            const utterance = new SpeechSynthesisUtterance(currentQuestion.question)
            utterance.lang = 'en-US'
            utterance.rate = 0.85
            utterance.pitch = 1.0

            utterance.onend = () => {
                setIsReadingQuestion(false)
                // Auto-start recording after question is read
                setTimeout(() => {
                    startRecording()
                }, 500)
            }

            utterance.onerror = () => {
                setIsReadingQuestion(false)
            }

            utteranceRef.current = utterance
            speechSynthesis.speak(utterance)
        }

        return () => {
            speechSynthesis.cancel()
        }
    }, [currentQuestionIndex])

    const startRecording = () => {
        if (recognitionRef.current && !isRecording) {
            try {
                recognitionRef.current.start()
                setIsRecording(true)
                setTranscript('') // Clear previous transcript
            } catch (e) {
                console.error('Error starting recognition:', e)
            }
        }
    }

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop()
            setIsRecording(false)

            // Save answer
            const answerKey = `${answerKeyPrefix}_${currentQuestion.id}`
            onAnswer(answerKey, transcript)
        }
    }

    const submitAnswer = () => {
        stopRecording()

        // Save answer
        const answerKey = `${answerKeyPrefix}_${currentQuestion.id}`
        onAnswer(answerKey, transcript)

        // Move to next question after a short delay
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1)
            }
        }, 1000)
    }

    const skipQuestion = () => {
        // Stop recording if active
        if (isRecording) {
            stopRecording()
        }

        // Stop any speech
        speechSynthesis.cancel()
        setIsReadingQuestion(false)

        // Save empty answer
        const answerKey = `${answerKeyPrefix}_${currentQuestion.id}`
        onAnswer(answerKey, '')

        // Move to next question
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1)
            }
        }, 500)
    }

    const replayQuestion = () => {
        if (currentQuestion && 'speechSynthesis' in window) {
            speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance(currentQuestion.question)
            utterance.lang = 'en-US'
            utterance.rate = 0.85
            speechSynthesis.speak(utterance)
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

    const isLastQuestion = currentQuestionIndex === questions.length - 1

    return (
        <div className="bg-blue-50 rounded-lg p-6">
            <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">{partName}</h4>
                <p className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {questions.length}
                </p>
            </div>

            <div className="bg-white rounded-lg p-6 mb-4 min-h-[200px] flex items-center justify-center">
                {isReadingQuestion ? (
                    <div className="text-center">
                        <div className="inline-block w-4 h-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-gray-600">AI is reading the question...</p>
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
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <p>Question will be read automatically</p>
                        <p className="text-sm mt-2">Click "Replay Question" to hear it again</p>
                    </div>
                )}
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
                {!isReadingQuestion && !isRecording && (
                    <button
                        onClick={replayQuestion}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium"
                    >
                        Replay Question
                    </button>
                )}

                {!isReadingQuestion && (
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`px-6 py-2 rounded font-semibold transition ${isRecording
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        {isRecording ? (
                            <>
                                <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                                Stop Recording
                            </>
                        ) : (
                            'Start Recording'
                        )}
                    </button>
                )}

                {isRecording && (
                    <button
                        onClick={submitAnswer}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                    >
                        Submit Answer {isLastQuestion ? '' : '& Next'}
                    </button>
                )}

                <button
                    onClick={skipQuestion}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-medium"
                >
                    Skip This Question
                </button>
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

