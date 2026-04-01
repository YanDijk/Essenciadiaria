import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modo, setModo] = useState('login') // 'login' ou 'cadastro'
  const [mensagem, setMensagem] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMensagem('')

    if (modo === 'cadastro') {
      const { error } = await supabase.auth.signUp({ email, password: senha })
      if (error) setMensagem('Erro: ' + error.message)
      else setMensagem('Verifique seu email para confirmar o cadastro!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) setMensagem('Email ou senha incorretos.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-amber-800 mb-2 text-center">✝️ Devocionais</h1>
        <p className="text-center text-gray-500 mb-6">Palavra diária gerada com IA</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 rounded-lg transition"
          >
            {modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {mensagem && <p className="mt-4 text-center text-sm text-amber-700">{mensagem}</p>}

        <p className="mt-4 text-center text-sm text-gray-500">
          {modo === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button
            onClick={() => setModo(modo === 'login' ? 'cadastro' : 'login')}
            className="text-amber-600 font-semibold hover:underline"
          >
            {modo === 'login' ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>
      </div>
    </div>
  )
}