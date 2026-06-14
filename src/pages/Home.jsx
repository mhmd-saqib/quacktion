import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const modes = [
  {
    id: 'chapterwise',
    title: 'Chapter Wise',
    description: 'Practice questions from a specific chapter',
    icon: '📖',
    color: 'border-indigo-400 hover:bg-indigo-50',
    titleColor: 'text-indigo-600',
  },
  {
    id: 'subjectwise',
    title: 'Subject Wise',
    description: 'Practice questions from an entire subject',
    icon: '📚',
    color: 'border-emerald-400 hover:bg-emerald-50',
    titleColor: 'text-emerald-600',
  },
  {
    id: 'full',
    title: 'Full Test',
    description: 'Practice questions from all subjects',
    icon: '🎯',
    color: 'border-rose-400 hover:bg-rose-50',
    titleColor: 'text-rose-600',
  },
]

export default function Home() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      const { data, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        

      if (!error) setHistory(data)
      setHistoryLoading(false)
    }
    fetchHistory()
  }, [])

  function scoreColor(score, total) {
    const pct = (score / (total * 4)) * 100
    if (pct >= 70) return 'text-emerald-600'
    if (pct >= 40) return 'text-amber-500'
    return 'text-rose-500'
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function modeIcon(mode) {
    if (mode === 'chapterwise') return '📖'
    if (mode === 'subjectwise') return '📚'
    return '🎯'
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-600">Quacktion</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500 hidden sm:block">{user?.email}</p>
          <button
            onClick={signOut}
            className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-12">

        {/* Test mode selection */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Select Test Mode</h2>
            <p className="text-gray-400 mt-2">Choose how you want to practice today</p>
          </div>

          <div className="flex flex-col gap-4">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => navigate(`/configure/${mode.id}`)}
                className={`bg-white border-2 ${mode.color} rounded-2xl p-6 flex items-center gap-6 transition text-left w-full`}
              >
                <span className="text-4xl">{mode.icon}</span>
                <div>
                  <h3 className={`text-xl font-semibold ${mode.titleColor}`}>
                    {mode.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">{mode.description}</p>
                </div>
                <span className="ml-auto text-gray-300 text-2xl">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* History section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Tests</h2>

          {historyLoading ? (
            <p className="text-gray-400 text-center py-8">Loading history...</p>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-gray-500">No tests taken yet.</p>
              <p className="text-gray-400 text-sm mt-1">
                Start a test above to see your history here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((session) => (
  <div
    key={session.id}
    onClick={() => navigate(`/result/${session.id}`)}
    className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition"
  >
                  <span className="text-2xl">{modeIcon(session.mode)}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-700 capitalize">
                        {session.mode} test
                      </span>
                      {session.subject && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                          {session.subject}
                        </span>
                      )}
                      {session.chapter && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full truncate max-w-xs">
                          {session.chapter}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(session.created_at)} ·{' '}
                      {session.total_questions} questions ·{' '}
                      {Math.floor(session.time_taken / 60)}m {session.time_taken % 60}s
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-2xl font-bold ${scoreColor(session.score, session.total_questions)}`}>
                      {session.score}
                    </p>
                    <p className="text-xs text-gray-400">
                      {session.correct}/{session.total_questions} correct
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}