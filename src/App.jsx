import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import LoginForm from './components/LoginForm'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Biblia from './pages/Biblia'
import Comunidade from './pages/Comunidade'
import Planos from './pages/Planos'
import Perfil from './pages/Perfil'
import Conexoes from './pages/Conexoes'
import Admin from './pages/Admin'

export default function App() {
  const [sessao, setSessao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

useEffect(() => {
  async function carregarSessao() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSessao(session)

      if (session) {
        const { data, error } = await supabase
          .from('perfis')
          .select('is_admin')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Erro ao buscar perfil:', error)
        }

        setIsAdmin(data?.is_admin || false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  // ✅ A função existe aqui dentro
  carregarSessao()

  const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
    setSessao(session)
  })

  return () => listener.subscription.unsubscribe()
}, [])




  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--cor-fundo)' }}>
        <p style={{ color: 'var(--cor-dourado)' }} className="fonte-titulo text-xl">
          ✝ Carregando...
        </p>
      </div>
    )
  }

  if (!sessao) return <LoginForm />

  return (
    <BrowserRouter>
      <div className="min-h-screen pb-20 md:pl-56" style={{ background: 'var(--cor-fundo)' }}>
        <Navbar isAdmin={isAdmin} />
        <main className="max-w-2xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/"           element={<Home userId={sessao.user.id} />} />
            <Route path="/biblia"     element={<Biblia userId={sessao.user.id} />} />
            <Route path="/comunidade" element={<Comunidade userId={sessao.user.id} sessao={sessao} />} />
            <Route path="/conexoes" element={<Conexoes userId={sessao.user.id} sessao={sessao} />} />
            <Route path="/planos"     element={<Planos userId={sessao.user.id} />} />
            <Route path="/perfil"     element={<Perfil userId={sessao.user.id} sessao={sessao} />} />
            <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" />} />
            <Route path="*"           element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}