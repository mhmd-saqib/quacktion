import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const QUESTION_OPTIONS = [10, 20, 30, 40, 50, 60]

export default function Configure() {
  const { mode } = useParams()
  const navigate = useNavigate()

  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedChapter, setSelectedChapter] = useState('')
  const [selectedCount, setSelectedCount] = useState(10)
  const [loading, setLoading] = useState(false)

  // Fetch distinct subjects on mount
  useEffect(() => {
    async function fetchSubjects() {
      const { data, error } = await supabase
        .from('questions')
        .select('subject')

      if (!error) {
        const unique = [...new Set(data.map((q) => q.subject))]
        setSubjects(unique)
      }
    }
    fetchSubjects()
  }, [])

  // Fetch chapters when subject changes (only for chapterwise)
  useEffect(() => {
    if (mode !== 'chapterwise' || !selectedSubject) return

    async function fetchChapters() {
      const { data, error } = await supabase
        .from('questions')
        .select('chapter')
        .eq('subject', selectedSubject)

      if (!error) {
        const unique = [...new Set(data.map((q) => q.chapter))]
        setChapters(unique)
        setSelectedChapter('')
      }
    }
    fetchChapters()
  }, [selectedSubject, mode])

  function canStart() {
    if (mode === 'chapterwise') return selectedSubject && selectedChapter
    if (mode === 'subjectwise') return selectedSubject
    if (mode === 'full') return true
    return false
  }

  function handleStart() {
    setLoading(true)
    navigate('/test', {
      state: {
        mode,
        subject: selectedSubject || null,
        chapter: selectedChapter || null,
        count: selectedCount,
      },
    })
  }

  const modeLabels = {
    chapterwise: 'Chapter Wise Test',
    subjectwise: 'Subject Wise Test',
    full: 'Full Test',
  }

  const modeColors = {
    chapterwise: 'text-indigo-600',
    subjectwise: 'text-emerald-600',
    full: 'text-rose-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/home')}
          className="text-gray-400 hover:text-gray-600 text-xl transition"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-indigo-600">Quacktion</h1>
      </div>

      <div className="max-w-xl mx-auto px-6 py-16">
        <h2 className={`text-3xl font-bold mb-2 ${modeColors[mode]}`}>
          {modeLabels[mode]}
        </h2>
        <p className="text-gray-400 mb-10">Configure your test settings below</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col gap-6">

          {/* Subject selector — chapterwise and subjectwise */}
          {(mode === 'chapterwise' || mode === 'subjectwise') && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">
                Select Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">-- Choose a subject --</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Chapter selector — chapterwise only */}
          {mode === 'chapterwise' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">
                Select Chapter
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                disabled={!selectedSubject}
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-40"
              >
                <option value="">-- Choose a chapter --</option>
                {chapters.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {!selectedSubject && (
                <p className="text-xs text-gray-400">Select a subject first</p>
              )}
            </div>
          )}

          {/* Number of questions */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">
              Number of Questions
            </label>
            <div className="grid grid-cols-3 gap-3">
              {QUESTION_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setSelectedCount(n)}
                  className={`py-3 rounded-xl border-2 font-semibold transition text-sm
                    ${selectedCount === n
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                      : 'border-gray-200 text-gray-500 hover:border-indigo-300'
                    }`}
                >
                  {n} Qs
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              If fewer questions exist in this category, all available ones will be used.
            </p>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            disabled={!canStart() || loading}
            className="mt-2 w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-lg"
          >
            {loading ? 'Starting...' : 'Start Test →'}
          </button>

        </div>
      </div>
    </div>
  )
}