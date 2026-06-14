import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import Configure from './pages/Configure'
import Test from './pages/Test'
import Result from './pages/Result'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          } />
          <Route path="/configure/:mode" element={
            <ProtectedRoute><Configure /></ProtectedRoute>
          } />
          <Route path="/test" element={
            <ProtectedRoute><Test /></ProtectedRoute>
          } />
          <Route path="/result" element={
            <ProtectedRoute><Result /></ProtectedRoute>
          } />
          <Route path="/result/:sessionId" element={
            <ProtectedRoute><Result /></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App