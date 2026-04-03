import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import GerarDevocional from '../components/devocional/GerarDevocional'

const MarkdownComponents = {
  h1: ({children}) => <h1 className="fonte-titulo text-xl font-bold mt-4 mb-2" style={{ color: 'var(--cor-dourado)' }}>{children}</h1>,
  h2: ({children}) => <h2 className="fonte-titulo text-lg font-bold mt-4 mb-2" style={{ color: 'var(--cor-dourado)' }}>{children}</h2>,
  h3: ({children}) => <h3 className="font-semibold mt-3 mb-2" style={{ color: 'var(--cor-dourado-claro)' }}>{children}</h3>,
  p:  ({children}) => <p className="leading-relaxed mb-3" style={{ color: 'var(--cor-texto)' }}>{children}</p>,
  strong: ({children}) => <strong style={{ color: 'var(--cor-dourado-claro)' }}>{children}</strong>,
  blockquote: ({children}) => (
    <blockquote className="border-l-4 pl-4 italic my-3"
      style={{ borderColor: 'var(--cor-dourado)', color: 'var(--cor-texto-suave)' }}>
      {children}
    </blockquote>
  ),
}

// Tenta extrair o versículo base do markdown gerado pela IA
function extrairVersiculo(conteudo) {
  if (!conteudo) return null
  // Procura padrões como "## 📖 Versículo" ou "## Versículo Base"
  const linhas = conteudo.split('\n')
  let capturando = false
  let versiculo = []
  for (const linha of linhas) {
    if (/vers[íi]culo/i.test(linha) && linha.startsWith('#')) {
      capturando = true
      continue
    }
    if (capturando) {
      if (linha.startsWith('#')) break // próxima seção
      if (linha.trim()) versiculo.push(linha.trim())
      if (versiculo.length >= 4) break
    }
  }
  return versiculo.length ? versiculo.join('\n') : null
}

// Extrai seções do markdown por título
function extrairSecoes(conteudo) {
  if (!conteudo) return {}
  const secoes = {}
  const partes = conteudo.split(/(?=^#{1,3} )/m)
  for (const parte of partes) {
    const linhas = parte.trim().split('\n')
    const titulo = linhas[0]?.replace(/^#+\s*/, '').toLowerCase()
    const corpo = linhas.slice(1).join('\n').trim()
    if (!titulo) continue
    if (/vers[íi]culo/i.test(titulo)) secoes.versiculo = corpo
    else if (/reflex[ãa]o/i.test(titulo)) secoes.reflexao = corpo
    else if (/pergunta/i.test(titulo)) secoes.pergunta = corpo
    else if (/desafio/i.test(titulo)) secoes.desafio = corpo
    else if (/frase/i.test(titulo) || /inspira/i.test(titulo)) secoes.frase = corpo
    else if (/ora[çc][ãa]o/i.test(titulo)) secoes.oracao = corpo
  }
  return secoes
}

function SecaoColapsavel({ titulo, emoji, children, defaultAberto = false }) {
  const [aberto, setAberto] = useState(defaultAberto)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--cor-borda)' }}>
      <button
        onClick={() => setAberto(a => !a)}
        className="w-full flex justify-between items-center px-4 py-3 text-left transition hover:opacity-80"
        style={{ background: 'var(--cor-fundo)' }}>
        <span className="font-semibold text-sm">{emoji} {titulo}</span>
        <span style={{ color: 'var(--cor-dourado)' }}>{aberto ? '▲' : '▼'}</span>
      </button>
      {aberto && (
        <div className="px-4 py-4" style={{ background: 'var(--cor-card)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function Home({ userId }) {
  const [devocionalDiario, setDevocionalDiario] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [concluido, setConcluido] = useState(false)
  const [erro, setErro] = useState(null)

  const hoje = new Date().toISOString().split('T')[0]

  useEffect(() => { carregarOuGerarDiario() }, [])

  async function carregarOuGerarDiario() {
    setCarregando(true)
    setErro(null)
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
    await gerarDiario()
  }

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
Use EXATAMENTE estes títulos de seção em markdown:
## 📖 Versículo Base
## 💭 Reflexão
## ❓ Pergunta-Chave
## 🎯 Desafio do Dia
## ✨ Frase Inspiradora
## 🙏 Oração

Escreva em português brasileiro, linguagem acolhedora e profunda.`
              }]
            }]
          })
        }
      )

      const dados = await resposta.json()
      if (!resposta.ok || dados.error) throw new Error(dados.error?.message || 'Erro na API Gemini')
      const conteudo = dados.candidates?.[0]?.content?.parts?.[0]?.text
      if (!conteudo) throw new Error('Resposta vazia da IA')

      const { data: salvo, error: erroInsert } = await supabase
        .from('devocional_diario')
        .insert({ data: hoje, tema: temaDoDia, conteudo })
        .select()
        .single()

      if (erroInsert) throw new Error('Erro ao salvar: ' + erroInsert.message)
      setDevocionalDiario(salvo)
    } catch (e) {
      console.error('Erro ao gerar diário:', e)
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  async function marcarConcluido() {
    const { data: perfil } = await supabase
      .from('perfis')
      .select('streak_atual, ultimo_devocional')
      .eq('id', userId)
      .single()

    if (perfil) {
      const ontem = new Date()
      ontem.setDate(ontem.getDate() - 1)
      const ontemStr = ontem.toISOString().split('T')[0]
      const novoStreak = perfil.ultimo_devocional === ontemStr ? perfil.streak_atual + 1 : 1
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

  const secoes = extrairSecoes(devocionalDiario?.conteudo || '')

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho */}
      <div>
        <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="fonte-titulo text-3xl font-bold mt-1" style={{ color: 'var(--cor-dourado)' }}>
          Palavra do Dia
        </h1>
        {devocionalDiario?.tema && (
          <p className="text-base mt-1 capitalize" style={{ color: 'var(--cor-texto-suave)' }}>
            Tema: {devocionalDiario.tema}
          </p>
        )}
      </div>

      {/* Erro */}
      {erro && (
        <div className="rounded-xl p-4 text-sm" style={{ background: '#2a1515', border: '1px solid #dc2626', color: '#fca5a5' }}>
          ⚠️ Erro ao gerar devocional: {erro}
          <button onClick={gerarDiario} className="ml-3 underline">Tentar novamente</button>
        </div>
      )}

      {devocionalDiario && (
        <>
          {/* Card do versículo — destaque visual com fundo */}
          <div className="relative rounded-2xl overflow-hidden min-h-[180px] flex items-end"
            style={{
              background: 'linear-gradient(135deg, #1a2a1a 0%, #0f1117 50%, #2a1f0a 100%)',
              border: '1px solid var(--cor-dourado)'
            }}>
            {/* Decoração de fundo */}
            <div className="absolute inset-0 opacity-10 flex items-center justify-center text-[120px] select-none pointer-events-none">
              ✝
            </div>
            <div className="relative z-10 p-6 w-full">
              <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
                style={{ color: 'var(--cor-dourado)' }}>
                📖 Versículo do Dia
              </p>
              {secoes.versiculo ? (
                <div className="text-base leading-relaxed fonte-titulo italic"
                  style={{ color: 'var(--cor-texto)' }}>
                  <ReactMarkdown components={MarkdownComponents}>{secoes.versiculo}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-base leading-relaxed fonte-titulo italic"
                  style={{ color: 'var(--cor-texto)' }}>
                  <ReactMarkdown components={MarkdownComponents}>
                    {devocionalDiario.conteudo.split('\n').slice(0, 6).join('\n')}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* Seções colapsáveis */}
          <div className="flex flex-col gap-2">
            {secoes.reflexao && (
              <SecaoColapsavel titulo="Reflexão" emoji="💭" defaultAberto={true}>
                <ReactMarkdown components={MarkdownComponents}>{secoes.reflexao}</ReactMarkdown>
              </SecaoColapsavel>
            )}
            {secoes.pergunta && (
              <SecaoColapsavel titulo="Pergunta-Chave" emoji="❓">
                <ReactMarkdown components={MarkdownComponents}>{secoes.pergunta}</ReactMarkdown>
              </SecaoColapsavel>
            )}
            {secoes.desafio && (
              <SecaoColapsavel titulo="Desafio do Dia" emoji="🎯">
                <ReactMarkdown components={MarkdownComponents}>{secoes.desafio}</ReactMarkdown>
              </SecaoColapsavel>
            )}
            {secoes.frase && (
              <SecaoColapsavel titulo="Frase Inspiradora" emoji="✨">
                <div className="text-center fonte-titulo text-lg italic py-2"
                  style={{ color: 'var(--cor-dourado)' }}>
                  <ReactMarkdown components={MarkdownComponents}>{secoes.frase}</ReactMarkdown>
                </div>
              </SecaoColapsavel>
            )}
            {secoes.oracao && (
              <SecaoColapsavel titulo="Oração do Dia" emoji="🙏">
                <ReactMarkdown components={MarkdownComponents}>{secoes.oracao}</ReactMarkdown>
              </SecaoColapsavel>
            )}

            {/* Fallback: se não conseguiu separar as seções, mostra tudo */}
            {!secoes.reflexao && !secoes.versiculo && (
              <div className="rounded-xl p-5" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
                <ReactMarkdown components={MarkdownComponents}>{devocionalDiario.conteudo}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Botão concluído */}
          <button
            onClick={marcarConcluido}
            disabled={concluido}
            className="w-full py-3 rounded-xl font-semibold transition text-sm"
            style={{
              background: concluido ? '#2a3040' : 'var(--cor-dourado)',
              color: concluido ? 'var(--cor-texto-suave)' : '#0f1117'
            }}>
            {concluido ? '✅ Concluído hoje!' : '✔ Marcar como concluído'}
          </button>
        </>
      )}

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--cor-borda)' }} />
        <span className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>ou gere um personalizado</span>
        <div className="flex-1 h-px" style={{ background: 'var(--cor-borda)' }} />
      </div>

      <GerarDevocional userId={userId} onSalvo={() => {}} />
    </div>
  )
}