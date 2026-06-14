import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function Login() {
  const { user, signInWithGoogle } = useAuth()

  if (user) return <Navigate to="/home" />

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-md flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold text-indigo-600">Quacktion</h1>
        <p className="text-gray-500 text-sm">JEE Main Practice — Chapter & Subject wise tests</p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium text-gray-700"
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>
      </div>
    </div>
  )
}