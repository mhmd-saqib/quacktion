import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Timer from '../components/Timer'
import LatexRenderer from '../components/LatexRenderer'

const OPTIONS = ['A', 'B', 'C', 'D']
const SECONDS_PER_QUESTION = 90 // 1.5 mins per question

export default function Test() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { mode, subject, chapter, count } = state || {}

  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: 'A'/'B'/'C'/'D' }
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [startTime] = useState(Date.now())

  // Fetch questions based on mode
  useEffect(() => {
    if (!state) {
      navigate('/home')
      return
    }
    async function fetchQuestions() {
      let query = supabase.from('questions').select('*')

      if (mode === 'chapterwise') {
        query = query.eq('subject', subject).eq('chapter', chapter)
      } else if (mode === 'subjectwise') {
        query = query.eq('subject', subject)
      }
      // full test — no filter

      const { data, error } = await query.limit(count)

      if (error) {
        console.error(error)
      } else {
        // Shuffle questions
        const shuffled = data.sort(() => Math.random() - 0.5)
        setQuestions(shuffled)
      }
      setLoading(false)
    }
    fetchQuestions()
  }, [])

  async function handleSubmit(autoSubmit = false) {
    if (submitting) return
    setSubmitting(true)

    const timeTaken = Math.floor((Date.now() - startTime) / 1000)

    // Calculate results
    let correct = 0
    let attempted = 0

    const answerRows = questions.map((q) => {
      const selected = answers[q.id] || null
      const isCorrect = selected === q.correct_option
      if (selected) {
        attempted++
        if (isCorrect) correct++
      }
      return {
        question_id: q.id,
        selected_option: selected,
        is_correct: selected ? isCorrect : false,
      }
    })

    // +4 for correct, -1 for wrong, 0 for skipped
    const score = correct * 4 - (attempted - correct) * 1

    // Save test session
    const { data: sessionData, error: sessionError } = await supabase
      .from('test_sessions')
      .insert({
        user_id: user.id,
        mode,
        subject: subject || null,
        chapter: chapter || null,
        total_questions: questions.length,
        attempted,
        correct,
        score,
        time_taken: timeTaken,
      })
      .select()
      .single()

    if (sessionError) {
      console.error(sessionError)
      setSubmitting(false)
      return
    }

    // Save individual answers
    const answersWithSession = answerRows.map((a) => ({
      ...a,
      session_id: sessionData.id,
    }))

    await supabase.from('test_answers').insert(answersWithSession)

    // Navigate to result page
    navigate('/result', {
      state: {
        session: sessionData,
        questions,
        answers,
      },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading questions...</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 text-lg">No questions found for this selection.</p>
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl"
        >
          Go Home
        </button>
      </div>
    )
  }

  const q = questions[current]
  const totalTime = questions.length * SECONDS_PER_QUESTION

  const optionKeys = {
    A: q.option_a,
    B: q.option_b,
    C: q.option_c,
    D: q.option_d,
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-600">Quacktion</h1>
        <Timer totalSeconds={totalTime} onTimeUp={() => handleSubmit(true)} />
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
        >
          {submitting ? 'Saving...' : 'Submit Test'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto w-full px-6 py-8 flex flex-col gap-6">

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            Question {current + 1} of {questions.length}
          </span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <p className="text-xs text-gray-400 mb-4 uppercase tracking-wide">
            {q.subject} — {q.chapter}
          </p>
          <p className="text-gray-800 text-lg leading-relaxed mb-8">
            <LatexRenderer text={q.question_text} />
          </p>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {OPTIONS.map((opt) => {
              const isSelected = answers[q.id] === opt
              return (
                <button
                  key={opt}
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                  }
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition
                    ${isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                    }`}
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0
                    ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {opt}
                  </span>
                  <LatexRenderer text={optionKeys[opt]} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrent((c) => c - 1)}
            disabled={current === 0}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 hover:border-indigo-300 disabled:opacity-30 transition font-medium"
          >
            ← Previous
          </button>

          {/* Question number pills */}
          <div className="flex gap-2 flex-wrap justify-center max-w-xs">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-8 h-8 rounded-full text-xs font-semibold transition
                  ${i === current
                    ? 'bg-indigo-600 text-white'
                    : answers[questions[i].id]
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-gray-100 text-gray-500'
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrent((c) => c + 1)}
            disabled={current === questions.length - 1}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 hover:border-indigo-300 disabled:opacity-30 transition font-medium"
          >
            Next →
          </button>
        </div>

      </div>
    </div>
  )
}