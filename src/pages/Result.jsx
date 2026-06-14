import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import LatexRenderer from '../components/LatexRenderer'

export default function Result() {
  const { state } = useLocation()
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If coming from test page, use state directly
    if (state?.session) {
      setSession(state.session)
      setQuestions(state.questions)
      setAnswers(state.answers)
      setLoading(false)
      return
    }

    // If coming from history, fetch from database
    async function fetchFromDB() {
      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        navigate('/home')
        return
      }

      // Fetch answers with question data
      const { data: answersData, error: answersError } = await supabase
        .from('test_answers')
        .select('*, questions(*)')
        .eq('session_id', sessionId)

      if (answersError) {
        navigate('/home')
        return
      }

      // Reconstruct questions array and answers map
      const qs = answersData.map((a) => a.questions)
      const ans = {}
      answersData.forEach((a) => {
        if (a.selected_option) {
          ans[a.question_id] = a.selected_option
        }
      })

      setSession(sessionData)
      setQuestions(qs)
      setAnswers(ans)
      setLoading(false)
    }

    fetchFromDB()
  }, [sessionId])

  const getOptionText = (q, opt) => {
    const map = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }
    return map[opt]
  }

  const getStatus = (q) => {
    const selected = answers[q.id]
    if (!selected) return 'skipped'
    if (selected === q.correct_option) return 'correct'
    return 'wrong'
  }

  const statusStyles = {
    correct: {
      card: 'border-emerald-300 bg-emerald-50',
      badge: 'bg-emerald-100 text-emerald-700',
      label: '✓ Correct',
    },
    wrong: {
      card: 'border-rose-300 bg-rose-50',
      badge: 'bg-rose-100 text-rose-700',
      label: '✗ Wrong',
    },
    skipped: {
      card: 'border-gray-200 bg-gray-50',
      badge: 'bg-gray-100 text-gray-500',
      label: '— Skipped',
    },
  }

  const optionStyle = (q, opt) => {
    if (opt === q.correct_option) return 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold'
    if (opt === answers[q.id] && opt !== q.correct_option) return 'border-rose-400 bg-rose-50 text-rose-700'
    return 'border-gray-200 text-gray-600'
  }

  const scoreColor = (score, total) => {
    const pct = (score / (total * 4)) * 100
    if (pct >= 70) return 'text-emerald-600'
    if (pct >= 40) return 'text-amber-500'
    return 'text-rose-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading result...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-indigo-600">Quacktion</h1>
        <button
          onClick={() => navigate('/home')}
          className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
        >
          Home
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Test Result</h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col items-center bg-gray-50 rounded-xl p-4">
              <span className={`text-4xl font-bold ${scoreColor(session.score, session.total_questions)}`}>
                {session.score}
              </span>
              <span className="text-xs text-gray-400 mt-1">Score</span>
            </div>
            <div className="flex flex-col items-center bg-emerald-50 rounded-xl p-4">
              <span className="text-4xl font-bold text-emerald-600">{session.correct}</span>
              <span className="text-xs text-gray-400 mt-1">Correct</span>
            </div>
            <div className="flex flex-col items-center bg-rose-50 rounded-xl p-4">
              <span className="text-4xl font-bold text-rose-500">
                {session.attempted - session.correct}
              </span>
              <span className="text-xs text-gray-400 mt-1">Wrong</span>
            </div>
            <div className="flex flex-col items-center bg-gray-50 rounded-xl p-4">
              <span className="text-4xl font-bold text-gray-400">
                {session.total_questions - session.attempted}
              </span>
              <span className="text-xs text-gray-400 mt-1">Skipped</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 text-sm text-gray-500">
            <span className="bg-gray-100 px-3 py-1 rounded-full capitalize">
              {session.mode} test
            </span>
            {session.subject && (
              <span className="bg-gray-100 px-3 py-1 rounded-full">{session.subject}</span>
            )}
            {session.chapter && (
              <span className="bg-gray-100 px-3 py-1 rounded-full">{session.chapter}</span>
            )}
            <span className="bg-gray-100 px-3 py-1 rounded-full">
              {Math.floor(session.time_taken / 60)}m {session.time_taken % 60}s
            </span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">+4 / −1 scoring</span>
          </div>
        </div>

        {/* Per question review */}
        <h3 className="text-lg font-semibold text-gray-700">Question Review</h3>

        {questions.map((q, i) => {
          const status = getStatus(q)
          const styles = statusStyles[status]

          return (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border-2 ${styles.card} p-6 flex flex-col gap-4`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    <LatexRenderer text={q.question_text} />
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${styles.badge}`}>
                  {styles.label}
                </span>
              </div>

              <div className="flex flex-col gap-2 ml-10">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div
                    key={opt}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${optionStyle(q, opt)}`}
                  >
                    <span className="text-xs font-bold w-5">{opt}</span>
                    <span className="text-sm">
                      <LatexRenderer text={getOptionText(q, opt)} />
                    </span>
                    {opt === q.correct_option && (
                      <span className="ml-auto text-xs text-emerald-600 font-medium">✓ Correct</span>
                    )}
                    {opt === answers[q.id] && opt !== q.correct_option && (
                      <span className="ml-auto text-xs text-rose-500 font-medium">Your answer</span>
                    )}
                  </div>
                ))}

                {(() => {
  const link = q.solution_link
    ? q.solution_link
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(q.question_text.slice(0, 100))}`

  return (
    <button
      onClick={() => window.open(link, '_blank')}
      className="flex items-center gap-2 mt-1 px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium transition w-fit"
    >
      <span>▶</span>
      {q.solution_link ? 'Watch Solution on YouTube' : 'Search on YouTube'}
    </button>
  )
})()}
              </div>
            </div>
          )
        })}

        <button
          onClick={() => navigate('/home')}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-lg"
        >
          Back to Home
        </button>

      </div>
    </div>
  )
}