import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import ReactMarkdown from 'react-markdown'
import LoginForm from './components/LoginForm'
import GerarDevocional from './components/GerarDevocional'
import ListaDevocionais from './components/ListaDevocionais'

export default function App() {
  const [sessao, setSessao] = useState(null)
  const [contador, setContador] = useState(0)

  useEffect(() => {
    // Pega a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session)
    })

    // Escuta mudanças de login/logout
    const { data: listener } = supabase.auth.onAuthStateChange((_evento, session) => {
      setSessao(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
  }

  if (!sessao) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-white flex justify-center">
      <div className="w-full max-w-xl p-4">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-amber-800">✝️ Meus Devocionais</h1>
          <button
            onClick={sair}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            Sair
          </button>
        </div>

        {/* Gerar novo devocional */}
        <GerarDevocional
          userId={sessao.user.id}
          onSalvo={() => setContador(c => c + 1)}
        />

        {/* Lista de devocionais salvos */}
        <ListaDevocionais
          userId={sessao.user.id}
          atualizar={contador}
        />
      </div>
    </div>
  )
}