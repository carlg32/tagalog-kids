'use client';

import { useState, useEffect } from 'react';
import lessonData from '@/lib/lessons/g1_l01_greetings.json';

export default function LessonPage() {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-500 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">
          {lessonData.title}
        </h1>
        <p className="text-center text-gray-600 mb-8">{lessonData.description}</p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-8">
          <div 
            className="bg-green-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${((currentActivity) / lessonData.activities.length) * 100}%` }}
          ></div>
        </div>

        {/* Activity Rendering */}
        {lessonData.activities.map((activity, index) => (
          <div key={activity.id} className={index === currentActivity ? 'block' : 'hidden'}>
            <ActivityComponent 
              activity={activity} 
              onComplete={(points) => {
                setScore(score + points);
                setTotalQuestions(totalQuestions + 1);
                if (index < lessonData.activities.length - 1) {
                  setCurrentActivity(index + 1);
                } else {
                  alert(`Lesson complete! Score: ${score}/${totalQuestions}`);
                }
              }}
            />
          </div>
        ))}

        {/* Score Display */}
        <div className="mt-8 text-center">
          <p className="text-2xl font-bold text-green-600">⭐ Score: {score}</p>
        </div>
      </div>
    </div>
  );
}

function ActivityComponent({ activity, onComplete }) {
  if (activity.type === 'vocabulary_intro') {
    return <VocabularyIntro activity={activity} onComplete={onComplete} />;
  } else if (activity.type === 'matching_game') {
    return <MatchingGame activity={activity} onComplete={onComplete} />;
  } else if (activity.type === 'multiple_choice') {
    return <MultipleChoice activity={activity} onComplete={onComplete} />;
  }
  return <div>Unknown activity type</div>;
}

function VocabularyIntro({ activity, onComplete }) {
  const [currentWord, setCurrentWord] = useState(0);

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">📚 Learn New Words</h2>
      <p className="mb-8 text-gray-600">{activity.instructions}</p>

      <div className="bg-gray-100 rounded-lg p-8 mb-8">
        <h3 className="text-3xl font-bold text-blue-600 mb-4">
          {lessonData.vocabulary[currentWord].word}
        </h3>
        <p className="text-xl text-gray-700 mb-4">
          {lessonData.vocabulary[currentWord].translation}
        </p>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg mr-4"
          onClick={() => {
            // Play audio here
            alert('🔊 Playing audio...');
          }}
        >
          🔊 Play Audio
        </button>
      </div>

      <div className="flex justify-between">
        <button 
          className="bg-gray-300 hover:bg-gray-400 font-bold py-3 px-6 rounded-lg"
          onClick={() => setCurrentWord(Math.max(0, currentWord - 1))}
          disabled={currentWord === 0}
        >
          ← Previous
        </button>
        <button 
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
          onClick={() => {
            if (currentWord < lessonData.vocabulary.length - 1) {
              setCurrentWord(currentWord + 1);
            } else {
              onComplete(10); // 10 points for completing vocab intro
            }
          }}
        >
          {currentWord < lessonData.vocabulary.length - 1 ? 'Next →' : 'Complete! ✅'}
        </button>
      </div>
    </div>
  );
}

function MatchingGame({ activity, onComplete }) {
  const [draggedWord, setDraggedWord] = useState(null);
  const [matched, setMatched] = useState([]);

  const handleDrop = (image) => {
    if (draggedWord && draggedWord.image === image) {
      setMatched([...matched, draggedWord.word]);
      alert('✅ Correct match!');
      if (matched.length + 1 === activity.pairs.length) {
        onComplete(20); // 20 points for completing matching game
      }
    } else {
      alert('❌ Try again!');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">🎯 Matching Game</h2>
      <p className="mb-8 text-gray-600 text-center">{activity.instructions}</p>

      <div className="grid grid-cols-2 gap-8">
        {/* Words to drag */}
        <div>
          <h3 className="font-bold mb-4">Words:</h3>
          {activity.pairs.map((pair) => (
            <div 
              key={pair.word}
              className={`bg-blue-100 p-4 mb-4 rounded-lg cursor-move ${matched.includes(pair.word) ? 'opacity-50' : ''}`}
              draggable
              onDragStart={() => setDraggedWord(pair)}
            >
              {pair.word}
            </div>
          ))}
        </div>

        {/* Images to drop on */}
        <div>
          <h3 className="font-bold mb-4">Images:</h3>
          {activity.pairs.map((pair) => (
            <div 
              key={pair.image}
              className="bg-gray-100 p-8 mb-4 rounded-lg text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(pair.image)}
            >
              🖼️ {pair.image.split('/').pop()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MultipleChoice({ activity, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState(null);

  const question = activity.questions[currentQuestion];

  const handleAnswer = (choice) => {
    setSelected(choice);
    if (choice === question.correct) {
      alert('✅ Correct!');
      setTimeout(() => {
        if (currentQuestion < activity.questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
          setSelected(null);
        } else {
          onComplete(30); // 30 points for completing multiple choice
        }
      }, 1000);
    } else {
      alert('❌ Incorrect. Try again!');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">🎧 Listen and Choose</h2>
      <p className="mb-8 text-gray-600 text-center">{activity.instructions}</p>

      <div className="text-center mb-8">
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
          onClick={() => alert('🔊 Playing audio...')}
        >
          🔊 Play Audio
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {question.choices.map((choice) => (
          <button
            key={choice}
            className={`p-4 rounded-lg font-bold text-lg transition-all ${
              selected === choice 
                ? (choice === question.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white') 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => handleAnswer(choice)}
            disabled={selected !== null}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
