import { useEffect, useState } from 'react'

export default function Timer({ totalSeconds, onTimeUp }) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp()
      return
    }
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [secondsLeft])

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  const isWarning = secondsLeft <= 60

  return (
    <div className={`font-mono text-xl font-bold px-4 py-2 rounded-xl border-2 ${
      isWarning
        ? 'text-rose-600 border-rose-300 bg-rose-50'
        : 'text-indigo-600 border-indigo-200 bg-indigo-50'
    }`}>
      {mins}:{secs}
    </div>
  )
}