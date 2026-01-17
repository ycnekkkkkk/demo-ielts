'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Home() {
  const router = useRouter()

  const steps = [
    { num: 1, text: 'Chọn trình độ' },
    { num: 2, text: 'Chọn phần test' },
    { num: 3, text: 'Hệ thống tạo đề' },
    { num: 4, text: 'Làm bài phần 1' },
    { num: 5, text: 'Tạo đề phần 2' },
    { num: 6, text: 'Làm bài phần 2' },
    { num: 7, text: 'Xem kết quả' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section - Liên kết và kết nối */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-12 mb-12 shadow-2xl"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-center text-white">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <span className="text-4xl">📝</span>
            </div>
          </motion.div>
          <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">
            IELTS Test
          </h1>
          <div className="w-24 h-1 bg-white/80 mx-auto mb-6 rounded-full"></div>
          <p className="text-2xl font-medium mb-3 text-blue-100">
            Đánh giá toàn diện 4 kỹ năng với AI
          </p>
          {/* <p className="text-base text-blue-50/90 max-w-2xl mx-auto">
            Phiên bản nâng cấp với giao diện hiện đại • Powered by Gemini AI
          </p> */}
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
      </motion.div>

      {/* Quy trình làm bài - Cải thiện liên kết */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg p-7 mb-8 border border-gray-100"
      >
        <div className="flex items-center mb-6 pb-3 border-b border-gray-200">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3 shadow-md">
            <span className="text-2xl">📋</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Quy trình làm bài</h2>
            <p className="text-sm text-gray-500 mt-0.5">7 bước đơn giản để hoàn thành bài test</p>
          </div>
        </div>
        <div className="relative overflow-x-auto pb-2">
          <div className="flex items-center justify-center gap-4 min-w-max px-3">
            {steps.map((step, index) => (
              <div key={step.num} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="flex flex-col items-center group"
                >
                  {/* Step number */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-lg flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform border-2 border-white mb-1.5 text-sm">
                      {step.num}
                    </div>
                  </div>
                  {/* Step content */}
                  <div className="text-center min-w-[90px]">
                    <p className="text-gray-800 text-sm font-medium group-hover:text-blue-600 transition-colors leading-tight">
                      {step.text}
                    </p>
                  </div>
                </motion.div>
                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className="flex items-center justify-center mx-2"
                  >
                    <div className="relative">
                      <div className="w-7 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2">
                        <svg
                          className="w-4 h-4 text-indigo-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Button - Kết nối với hero section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-center mb-12"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/level-selection')}
          className="relative inline-flex items-center justify-center px-12 py-5 text-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden group"
        >
          <span className="relative z-10 flex items-center">
            Bắt đầu Test
            <motion.span
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              className="ml-2 text-2xl"
            >
              →
            </motion.span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </motion.button>
        <p className="text-sm text-gray-500 mt-4">Miễn phí • Không cần đăng ký • Kết quả tức thì</p>
      </motion.div>

      {/* Features - Liên kết với nhau */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        {/* {[
          { icon: '🎯', title: 'Chính xác', desc: 'Đánh giá theo chuẩn IELTS', color: 'from-blue-500 to-cyan-500' },
          { icon: '🤖', title: 'AI-Powered', desc: 'Sử dụng Gemini AI tiên tiến', color: 'from-purple-500 to-pink-500' },
          { icon: '⚡', title: 'Nhanh chóng', desc: 'Kết quả tức thì', color: 'from-orange-500 to-red-500' }
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
            whileHover={{ y: -5 }}
            className="relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity`}></div>
            <div className="relative text-center">
              <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-lg">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          </motion.div>
        ))} */}
      </motion.div>
    </div>
  )
}

