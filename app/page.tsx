import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            🇵🇭 Tagalog Kids
          </h1>
          <p className="text-2xl text-white">
            Learn Tagalog through fun interactive lessons!
          </p>
        </div>

        {/* Grade Selection */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            📚 Select Your Grade
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((grade) => (
              <button
                key={grade}
                className="bg-blue-100 hover:bg-blue-200 p-6 rounded-lg text-center font-bold text-xl text-blue-800 transition-all"
              >
                Grade {grade}
              </button>
            ))}
          </div>
        </div>

        {/* MVP: Grade 1 Lessons */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            🎯 Grade 1 Lessons (MVP)
          </h2>
          
          <div className="space-y-4">
            <Link 
              href="/lessons/g1/l01"
              className="block bg-green-100 hover:bg-green-200 p-6 rounded-lg transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-green-800">
                    Lesson 1: Mga Pagbati (Greetings)
                  </h3>
                  <p className="text-green-700 mt-2">
                    Learn how to greet people in Tagalog!
                  </p>
                </div>
                <div className="text-4xl">🎉</div>
              </div>
            </Link>

            {/* Locked lessons */}
            {[2, 3, 4, 5].map((lessonNum) => (
              <div 
                key={lessonNum}
                className="bg-gray-100 p-6 rounded-lg opacity-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-600">
                      Lesson {lessonNum}: [Locked]
                    </h3>
                    <p className="text-gray-500 mt-2">
                      Complete Lesson 1 to unlock
                    </p>
                  </div>
                  <div className="text-4xl">🔒</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Dashboard (MVP - Simple) */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mt-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            📊 Your Progress
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-yellow-100 p-6 rounded-lg text-center">
              <div className="text-5xl mb-2">⭐</div>
              <div className="text-2xl font-bold text-yellow-800">0</div>
              <div className="text-yellow-700">Points</div>
            </div>
            
            <div className="bg-blue-100 p-6 rounded-lg text-center">
              <div className="text-5xl mb-2">📝</div>
              <div className="text-2xl font-bold text-blue-800">0/20</div>
              <div className="text-blue-700">Lessons Completed</div>
            </div>
            
            <div className="bg-green-100 p-6 rounded-lg text-center">
              <div className="text-5xl mb-2">🔥</div>
              <div className="text-2xl font-bold text-green-800">0</div>
              <div className="text-green-700">Day Streak</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
