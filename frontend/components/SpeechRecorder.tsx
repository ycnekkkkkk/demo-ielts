'use client'

import { useState, useEffect, useRef } from 'react'

interface SpeechRecorderProps {
    onTranscript: (text: string) => void
    value: string
    placeholder?: string
    rows?: number
    question?: string
    showTTS?: boolean
}

export default function SpeechRecorder({
    onTranscript,
    value,
    placeholder = 'Nhấn nút để bắt đầu nói...',
    rows = 3,
    question,
    showTTS = false,
}: SpeechRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isSupported, setIsSupported] = useState(false)
    const recognitionRef = useRef<any>(null)
    const [transcript, setTranscript] = useState(value || '')

    useEffect(() => {
        // Check if browser supports Speech Recognition
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

        if (SpeechRecognition) {
            setIsSupported(true)
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US' // English for IELTS

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
                    onTranscript(newTranscript.trim())
                    return newTranscript
                })
            }

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error)
                if (event.error === 'no-speech') {
                    // Auto restart if no speech detected
                    if (isRecording) {
                        recognition.start()
                    }
                }
            }

            recognition.onend = () => {
                if (isRecording) {
                    // Auto restart if still recording
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
        }
    }, [transcript, isRecording, onTranscript])

    useEffect(() => {
        // Only update from value prop if not currently recording
        if (!isRecording && value !== transcript) {
            setTranscript(value || '')
        }
    }, [value, isRecording, transcript])

    const startRecording = () => {
        if (recognitionRef.current && !isRecording) {
            try {
                recognitionRef.current.start()
                setIsRecording(true)
            } catch (e) {
                console.error('Error starting recognition:', e)
            }
        }
    }

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop()
            setIsRecording(false)
        }
    }

    const clearTranscript = () => {
        setTranscript('')
        onTranscript('')
    }

    const speakQuestion = () => {
        if (question && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(question)
            utterance.lang = 'en-US'
            utterance.rate = 0.9
            speechSynthesis.speak(utterance)
        }
    }

    if (!isSupported) {
        return (
            <div>
                {question && showTTS && (
                    <button
                        onClick={speakQuestion}
                        className="mb-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                        🔊 Nghe câu hỏi
                    </button>
                )}
                <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={rows}
                    placeholder={placeholder}
                    value={transcript}
                    onChange={(e) => {
                        setTranscript(e.target.value)
                        onTranscript(e.target.value)
                    }}
                />
                <div className="text-xs text-gray-500 mt-1">
                    Trình duyệt không hỗ trợ nhận diện giọng nói. Vui lòng nhập bằng bàn phím.
                </div>
            </div>
        )
    }

    return (
        <div>
            {question && showTTS && (
                <button
                    onClick={speakQuestion}
                    className="mb-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                >
                    🔊 Nghe câu hỏi
                </button>
            )}
            <div className="flex gap-2 mb-2">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-4 py-2 rounded font-semibold transition ${isRecording
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    {isRecording ? (
                        <>
                            <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                            Đang ghi âm...
                        </>
                    ) : (
                        '🎤 Bắt đầu nói'
                    )}
                </button>
                {transcript && (
                    <button
                        onClick={clearTranscript}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        Xóa
                    </button>
                )}
            </div>
            <textarea
                className="w-full border rounded px-3 py-2"
                rows={rows}
                placeholder={isRecording ? 'Đang nghe...' : placeholder}
                value={transcript}
                onChange={(e) => {
                    setTranscript(e.target.value)
                    onTranscript(e.target.value)
                }}
                readOnly={isRecording}
            />
            {isRecording && (
                <div className="text-sm text-red-600 mt-1">● Đang ghi âm - Hãy nói rõ ràng</div>
            )}
        </div>
    )
}

