import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Admin() {
  // --- DEVOCIONAL DIÁRIO ---
  const [aba, setAba] = useState('devocional')
  const [temaCustom, setTemaCustom] = useState('')
  const [conteudoCustom, setConteudoCustom] = useState('')
  const [gerando, setGerando] = useState(false)
  const [salvandoDev, setSalvandoDev] = useState(false)
  const [msgDev, setMsgDev] = useState('')
  const hoje = new Date().toISOString().split('T')[0]

  // --- PLANOS ---
  const [planos, setPlanos] = useState([])
  const [novoPlanoNome, setNovoPlanoNome] = useState('')
  const [novoPlanoDesc, setNovoPlanoDesc] = useState('')
  const [novoPlanoTema, setNovoPlanoTema] = useState('')
  const [novoPlanoQtd, setNovoPlanoQtd] = useState(7)
  const [gerindoPlano, setGerindoPlano] = useState(false)
  const [msgPlano, setMsgPlano] = useState('')

  useEffect(() => { buscarPlanos() }, [])

  async function gerarRascunho() {
    if (!temaCustom.trim()) return
    setGerando(true)
    try {
      const resposta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: `Crie um devocional cristão evangélico completo sobre "${temaCustom}".
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
      setConteudoCustom(dados.candidates?.[0]?.content?.parts?.[0]?.text || '')
    } catch (e) { console.error(e) }
    setGerando(false)
  }

  async function publicarDevocional() {
    if (!conteudoCustom.trim()) return
    setSalvandoDev(true)
    setMsgDev('')

    // Remove devocional de hoje se existir
    await supabase.from('devocional_diario').delete().eq('data', hoje)

    const { error } = await supabase.from('devocional_diario').insert({
      data: hoje,
      tema: temaCustom,
      conteudo: conteudoCustom
    })

    setMsgDev(error ? '❌ Erro: ' + error.message : '✅ Devocional publicado com sucesso!')
    setSalvandoDev(false)
  }

  // --- PLANOS ---
  async function buscarPlanos() {
    const { data } = await supabase.from('planos').select('id, nome, duracao_dias')
    setPlanos(data || [])
  }

  async function gerarPlano() {
    if (!novoPlanoNome.trim() || !novoPlanoTema.trim()) return
    setGerindoPlano(true)
    setMsgPlano('')
    try {
      const resposta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: `Crie um plano de leitura bíblica de ${novoPlanoQtd} dias sobre "${novoPlanoTema}".
Retorne APENAS um JSON válido, sem markdown, com este formato exato:
[
  {"dia": 0, "titulo": "Título do dia", "livro": "genesis", "capitulo": 1},
  {"dia": 1, "titulo": "Título do dia", "livro": "psalms", "capitulo": 23}
]
Use nomes dos livros em inglês minúsculo sem espaço (ex: genesis, psalms, matthew, 1corinthians).
Gere exatamente ${novoPlanoQtd} itens, com dias de 0 a ${novoPlanoQtd - 1}.`
              }]
            }]
          })
        }
      )
      const dados = await resposta.json()
      let texto = dados.candidates?.[0]?.content?.parts?.[0]?.text || ''
      texto = texto.replace(/```json|```/g, '').trim()
      const leituras = JSON.parse(texto)

      const { error } = await supabase.from('planos').insert({
        nome: novoPlanoNome,
        descricao: novoPlanoDesc || `Plano de ${novoPlanoQtd} dias sobre ${novoPlanoTema}`,
        duracao_dias: novoPlanoQtd,
        leituras
      })

      setMsgPlano(error ? '❌ Erro: ' + error.message : '✅ Plano criado com sucesso!')
      if (!error) { setNovoPlanoNome(''); setNovoPlanoDesc(''); setNovoPlanoTema(''); buscarPlanos() }
    } catch (e) {
      setMsgPlano('❌ Erro ao parsear JSON da IA: ' + e.message)
    }
    setGerindoPlano(false)
  }

  async function excluirPlano(id) {
    if (!confirm('Excluir este plano?')) return
    await supabase.from('planos').delete().eq('id', id)
    buscarPlanos()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <h1 className="fonte-titulo text-3xl font-bold" style={{ color: 'var(--cor-dourado)' }}>
          ⚙️ Painel Admin
        </h1>
        <span className="text-xs px-2 py-1 rounded-full"
          style={{ background: '#2a1f0a', border: '1px solid var(--cor-dourado)', color: 'var(--cor-dourado)' }}>
          Admin
        </span>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        {[
          { id: 'devocional', label: '📖 Devocional do Dia' },
          { id: 'planos', label: '📅 Planos Bíblicos' },
        ].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition"
            style={{
              background: aba === a.id ? 'var(--cor-dourado)' : 'var(--cor-card)',
              color: aba === a.id ? '#0f1117' : 'var(--cor-texto-suave)',
              border: '1px solid var(--cor-borda)'
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA: DEVOCIONAL */}
      {aba === 'devocional' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
            <h2 className="font-semibold mb-1">Devocional de hoje — {hoje}</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--cor-texto-suave)' }}>
              Defina o tema e a IA gera o rascunho. Você pode editar antes de publicar.
            </p>

            <input
              value={temaCustom}
              onChange={e => setTemaCustom(e.target.value)}
              placeholder="Tema do devocional (ex: perseverança na fé)"
              className="w-full px-3 py-2 rounded-xl text-sm mb-3"
              style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            />

            <button onClick={gerarRascunho} disabled={gerando || !temaCustom.trim()}
              className="w-full py-2 rounded-xl text-sm font-semibold mb-4 transition"
              style={{ background: 'var(--cor-dourado)', color: '#0f1117', opacity: gerando ? 0.7 : 1 }}>
              {gerando ? '⏳ Gerando rascunho...' : '🤖 Gerar rascunho com IA'}
            </button>

            <textarea
              value={conteudoCustom}
              onChange={e => setConteudoCustom(e.target.value)}
              placeholder="O rascunho gerado aparece aqui. Você pode editar antes de publicar..."
              rows={16}
              className="w-full px-3 py-2 rounded-xl text-sm font-mono resize-y mb-3"
              style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            />

            <button onClick={publicarDevocional} disabled={salvandoDev || !conteudoCustom.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold transition"
              style={{ background: '#16a34a', color: 'white', opacity: salvandoDev ? 0.7 : 1 }}>
              {salvandoDev ? '⏳ Publicando...' : '✅ Publicar como devocional de hoje'}
            </button>

            {msgDev && (
              <p className="mt-3 text-sm text-center" style={{ color: msgDev.startsWith('✅') ? '#4ade80' : '#fca5a5' }}>
                {msgDev}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ABA: PLANOS */}
      {aba === 'planos' && (
        <div className="flex flex-col gap-4">
          {/* Criar plano */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
            <h2 className="font-semibold mb-4">Criar novo plano com IA</h2>
            <input
              value={novoPlanoNome}
              onChange={e => setNovoPlanoNome(e.target.value)}
              placeholder="Nome do plano (ex: Salmos em 30 dias)"
              className="w-full px-3 py-2 rounded-xl text-sm mb-2"
              style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            />
            <input
              value={novoPlanoDesc}
              onChange={e => setNovoPlanoDesc(e.target.value)}
              placeholder="Descrição (opcional)"
              className="w-full px-3 py-2 rounded-xl text-sm mb-2"
              style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            />
            <input
              value={novoPlanoTema}
              onChange={e => setNovoPlanoTema(e.target.value)}
              placeholder="Tema/foco (ex: fé e coragem)"
              className="w-full px-3 py-2 rounded-xl text-sm mb-2"
              style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            />
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>Duração:</label>
              <input
                type="number" min={3} max={365}
                value={novoPlanoQtd}
                onChange={e => setNovoPlanoQtd(+e.target.value)}
                className="w-20 px-3 py-2 rounded-xl text-sm text-center"
                style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
              />
              <span className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>dias</span>
            </div>
            <button onClick={gerarPlano} disabled={gerindoPlano || !novoPlanoNome.trim() || !novoPlanoTema.trim()}
              className="w-full py-2 rounded-xl text-sm font-semibold transition"
              style={{ background: 'var(--cor-dourado)', color: '#0f1117', opacity: gerindoPlano ? 0.7 : 1 }}>
              {gerindoPlano ? '⏳ Gerando plano com IA...' : '✨ Gerar e publicar plano'}
            </button>
            {msgPlano && (
              <p className="mt-3 text-sm text-center" style={{ color: msgPlano.startsWith('✅') ? '#4ade80' : '#fca5a5' }}>
                {msgPlano}
              </p>
            )}
          </div>

          {/* Lista de planos existentes */}
          <h3 className="font-semibold text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
            Planos existentes ({planos.length})
          </h3>
          {planos.map(p => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
              <div>
                <p className="text-sm font-semibold">{p.nome}</p>
                <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>{p.duracao_dias} dias</p>
              </div>
              <button onClick={() => excluirPlano(p.id)}
                className="text-xs px-3 py-1 rounded-lg transition"
                style={{ background: 'var(--cor-fundo)', border: '1px solid #dc2626', color: '#dc2626' }}>
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}