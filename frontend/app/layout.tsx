import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'IELTS Test - Enhanced',
    description: 'AI-powered IELTS assessment test with modern interface',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="vi">
            <body className={inter.className}>
                <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">I</span>
                                </div>
                                <h1 className="text-xl font-bold gradient-text">IELTS Test</h1>
                            </div>
                            {/* <div className="text-sm text-gray-600">
                                Enhanced Version 2.0
                            </div> */}
                        </div>
                    </div>
                </nav>
                <main className="container mx-auto px-4 py-8 min-h-screen">
                    {children}
                </main>
                {/* <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 mt-12 py-6">
                    <div className="container mx-auto px-4 text-center">
                        <p className="text-gray-600">
                            &copy; 2024 IELTS Test - Enhanced. All rights reserved.
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Powered by Gemini AI
                        </p>
                    </div>
                </footer> */}
            </body>
        </html>
    )
}

