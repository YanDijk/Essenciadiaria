import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import ReactMarkdown from 'react-markdown'

const perguntas = [
  {
    id: 'sentimento',
    pergunta: 'Como você está se sentindo hoje?',
    opcoes: ['😰 Ansioso', '🙏 Grato', '😴 Cansado', '🌟 Esperançoso', '😢 Triste']
  },
  {
    id: 'area',
    pergunta: 'Qual área da sua vida precisa mais atenção?',
    opcoes: ['👨‍👩‍👧 Família', '💼 Trabalho', '❤️ Saúde', '✝️ Fé', '💕 Relacionamentos']
  },
  {
    id: 'tempo',
    pergunta: 'Quanto tempo você tem disponível?',
    opcoes: ['⚡ 5 minutos', '☕ 10 minutos', '📖 20 minutos', '🕰️ 30 minutos']
  },
  {
    id: 'tipo',
    pergunta: 'Prefere uma mensagem de...',
    opcoes: ['🤗 Conforto', '🔥 Desafio', '🎉 Louvor', '💡 Sabedoria']
  }
]

export default function GerarDevocional({ userId, onSalvo }) {
  const [etapa, setEtapa] = useState('inicio') // inicio | quiz | carregando | resultado
  const [respostas, setRespostas] = useState({})
  const [perguntaAtual, setPerguntaAtual] = useState(0)
  const [intencao, setIntencao] = useState('')
  const [devocional, setDevocional] = useState('')
  const [salvo, setSalvo] = useState(false)
  const [tema, setTema] = useState('')

  function responder(opcao) {
    const novasRespostas = { ...respostas, [perguntas[perguntaAtual].id]: opcao }
    setRespostas(novasRespostas)

    if (perguntaAtual < perguntas.length - 1) {
      setPerguntaAtual(p => p + 1)
    } else {
      gerarPersonalizado(novasRespostas)
    }
  }

  async function gerarPersonalizado(r) {
    setEtapa('carregando')

    const prompt = `Crie um devocional cristão evangélico personalizado em português brasileiro.
Contexto do usuário:
- Sentimento: ${r.sentimento}
- Área que precisa atenção: ${r.area}
- Tempo disponível: ${r.tempo}
- Tipo de mensagem desejada: ${r.tipo}
${intencao ? `- No coração hoje: ${intencao}` : ''}

Inclua: versículo bíblico com referência, reflexão, pergunta-chave, desafio e oração.
Use emojis e markdown com títulos para cada seção. Seja profundo e acolhedor.`

    try {
      const resposta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          })
        }
      )
      const dados = await resposta.json()
      const texto = dados.candidates?.[0]?.content?.parts?.[0]?.text || 'Erro ao gerar.'
      const temaGerado = `${r.sentimento} · ${r.area}`
      setDevocional(texto)
      setTema(temaGerado)
      setEtapa('resultado')
    } catch (erro) {
      setDevocional('Erro: ' + erro.message)
      setEtapa('resultado')
    }
  }

  async function salvarDevocional() {
    const { error } = await supabase.from('devocionais').insert({
      user_id: userId,
      tema,
      conteudo: devocional,
      tipo: 'personalizado'
    })
    if (!error) { setSalvo(true); onSalvo() }
  }

  function reiniciar() {
    setEtapa('inicio')
    setRespostas({})
    setPerguntaAtual(0)
    setIntencao('')
    setDevocional('')
    setSalvo(false)
    setTema('')
  }

  // --- TELAS ---

  if (etapa === 'inicio') return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
      <h2 className="fonte-titulo text-xl font-bold mb-2" style={{ color: 'var(--cor-dourado)' }}>
        ✨ Devocional Personalizado
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--cor-texto-suave)' }}>
        Responda 4 perguntas rápidas e a IA vai criar uma mensagem especial para você.
      </p>
      <button onClick={() => setEtapa('quiz')}
        className="w-full py-3 rounded-xl font-semibold transition"
        style={{ background: 'var(--cor-dourado)', color: '#0f1117' }}>
        Começar →
      </button>
    </div>
  )

  if (etapa === 'quiz') {
    const p = perguntas[perguntaAtual]
    const progresso = ((perguntaAtual) / perguntas.length) * 100

    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
        {/* Barra de progresso */}
        <div className="h-1 rounded-full mb-6" style={{ background: 'var(--cor-borda)' }}>
          <div className="h-1 rounded-full transition-all" style={{ width: `${progresso}%`, background: 'var(--cor-dourado)' }} />
        </div>

        <p className="text-xs mb-2" style={{ color: 'var(--cor-texto-suave)' }}>
          {perguntaAtual + 1} de {perguntas.length}
        </p>
        <h3 className="fonte-titulo text-lg font-bold mb-5">{p.pergunta}</h3>

        <div className="flex flex-col gap-2">
          {p.opcoes.map(opcao => (
            <button key={opcao} onClick={() => responder(opcao)}
              className="text-left px-4 py-3 rounded-xl text-sm transition hover:opacity-80"
              style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)' }}>
              {opcao}
            </button>
          ))}
        </div>

        {/* Campo aberto só na última pergunta */}
        {perguntaAtual === perguntas.length - 1 && (
          <textarea
            placeholder="Há algo específico em seu coração hoje? (opcional)"
            value={intencao}
            onChange={e => setIntencao(e.target.value)}
            className="w-full mt-4 p-3 rounded-xl text-sm resize-none"
            style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            rows={2}
          />
        )}
      </div>
    )
  }

  if (etapa === 'carregando') return (
    <div className="rounded-2xl p-10 flex flex-col items-center gap-4"
      style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
      <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      <p style={{ color: 'var(--cor-dourado)' }} className="fonte-titulo">Preparando sua mensagem...</p>
      <p className="text-xs text-center" style={{ color: 'var(--cor-texto-suave)' }}>
        A IA está criando um devocional especialmente para você
      </p>
    </div>
  )

  if (etapa === 'resultado') return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
      <div className="prose prose-invert max-w-none text-sm leading-relaxed mb-6">
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
    {devocional}
  </ReactMarkdown>
      </div>
      <div className="flex gap-3">
        <button onClick={salvarDevocional} disabled={salvo}
          className="flex-1 py-3 rounded-xl font-semibold text-sm transition"
          style={{ background: salvo ? 'var(--cor-borda)' : '#16a34a', color: 'white' }}>
          {salvo ? '✅ Salvo!' : '💾 Salvar'}
        </button>
        <button onClick={reiniciar}
          className="px-4 py-3 rounded-xl text-sm transition"
          style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)' }}>
          Novo
        </button>
      </div>
    </div>
  )
}