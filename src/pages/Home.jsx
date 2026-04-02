import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import GerarDevocional from '../components/devocional/GerarDevocional'

export default function Home({ userId }) {
  const [devocionalDiario, setDevocionalDiario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [concluido, setConcluido] = useState(false)

  const hoje = new Date().toISOString().split('T')[0] // "2026-04-01"

  useEffect(() => {
    carregarOuGerarDiario()
  }, [])

  async function carregarOuGerarDiario() {
    setCarregando(true)

    // Tenta buscar o devocional de hoje no banco
    const { data } = await supabase
      .from('devocional_diario')
      .select('*')
      .eq('data', hoje)
      .single()

    if (data) {
      setDevocionalDiario(data)
      setCarregando(false)
      return
    }

    // Se não existe, gera com a IA
    await gerarDiario()
  }

  const [erro, setErro] = useState(null)

async function gerarDiario() {
  try {
    const temas = [
      'fé em tempos difíceis', 'gratidão', 'esperança', 'amor ao próximo',
      'oração', 'perdão', 'confiança em Deus', 'renovação', 'propósito de vida',
      'paz interior', 'coragem', 'humildade'
    ]
    const temaDoDia = temas[new Date().getDay() % temas.length]

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{
              text: `Crie um devocional cristão evangélico completo sobre "${temaDoDia}" para hoje.
Inclua: versículo bíblico com referência e versão, reflexão de 3 parágrafos, pergunta-chave para meditação, desafio do dia, frase inspiradora e oração.
Escreva em português brasileiro, linguagem acolhedora. Use emojis e markdown com títulos para cada seção.`
            }]
          }]
        })
      }
    )

    const dados = await resposta.json()
    console.log('Resposta Gemini:', dados)

    if (!resposta.ok || dados.error) {
      throw new Error(dados.error?.message || 'Erro na API Gemini')
    }

    const conteudo = dados.candidates?.[0]?.content?.parts?.[0]?.text
    if (!conteudo) throw new Error('Resposta vazia da IA')

    const { data: salvo, error: erroInsert } = await supabase
      .from('devocional_diario')
      .insert({ data: hoje, tema: temaDoDia, conteudo })
      .select()
      .single()

    if (erroInsert) throw new Error('Erro ao salvar no banco: ' + erroInsert.message)

    setDevocionalDiario(salvo)
  } catch (e) {
    console.error('Erro ao gerar diário:', e)
    setErro(e.message)
  } finally {
    setCarregando(false)
  }
}

  async function marcarConcluido() {
    // Atualiza streak do usuário
    const { data: perfil } = await supabase
      .from('perfis')
      .select('streak_atual, ultimo_devocional')
      .eq('id', userId)
      .single()

    if (perfil) {
      const ontem = new Date()
      ontem.setDate(ontem.getDate() - 1)
      const ontemStr = ontem.toISOString().split('T')[0]

      const novoStreak = perfil.ultimo_devocional === ontemStr
        ? perfil.streak_atual + 1
        : 1

      await supabase.from('perfis').update({
        streak_atual: novoStreak,
        ultimo_devocional: hoje
      }).eq('id', userId)
    }

    setConcluido(true)
  }

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        <p style={{ color: 'var(--cor-dourado)' }}>Preparando a palavra do dia...</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div>
        <p style={{ color: 'var(--cor-texto-suave)' }} className="text-sm">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="fonte-titulo text-3xl font-bold mt-1" style={{ color: 'var(--cor-dourado)' }}>
          Palavra do Dia
        </h1>
        {devocionalDiario?.tema && (
          <p className="text-lg mt-1 capitalize" style={{ color: 'var(--cor-texto-suave)' }}>
            Tema: {devocionalDiario.tema}
          </p>
        )}
      </div>

      {/* Conteúdo do devocional */}
      {devocionalDiario && (
        <div className="rounded-2xl p-6" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed">
            <ReactMarkdown
    components={{
      h1: ({children}) => (
        <h1 className="fonte-titulo text-xl font-bold mt-2 mb-1" style={{ color: 'var(--cor-dourado)' }}>{children}</h1>
      ),
      h2: ({children}) => (
        <h2 className="fonte-titulo text-lg font-bold mt-4 mb-2" style={{ color: 'var(--cor-dourado)' }}>{children}</h2>
      ),
      h3: ({children}) => (
        <h3 className="font-semibold mt-3 mb-1" style={{ color: 'var(--cor-dourado-claro)' }}>{children}</h3>
      ),
      p: ({children}) => (
        <p className="leading-relaxed mb-3" style={{ color: 'var(--cor-texto)' }}>{children}</p>
      ),
      strong: ({children}) => (
        <strong style={{ color: 'var(--cor-dourado-claro)' }}>{children}</strong>
      ),
      blockquote: ({children}) => (
        <blockquote className="border-l-4 pl-4 italic my-3"
          style={{ borderColor: 'var(--cor-dourado)', color: 'var(--cor-texto-suave)' }}>
          {children}
        </blockquote>
      ),
    }}
  >
    
    {devocionalDiario.conteudo}
  </ReactMarkdown>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={marcarConcluido}
              disabled={concluido}
              className="flex-1 py-3 rounded-xl font-semibold transition text-sm"
              style={{
                background: concluido ? '#2a3040' : 'var(--cor-dourado)',
                color: concluido ? 'var(--cor-texto-suave)' : '#0f1117'
              }}>
              {concluido ? '✅ Concluído hoje!' : '✔ Marcar como concluído'}
            </button>
          </div>
        </div>
      )}

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--cor-borda)' }} />
        <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>ou gere um personalizado</span>
        <div className="flex-1 h-px" style={{ background: 'var(--cor-borda)' }} />
      </div>

      {/* Gerador personalizado (componente que já existe) */}
      <GerarDevocional userId={userId} onSalvo={() => {}} />
    </div>
  )
}