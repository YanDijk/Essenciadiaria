import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Conexoes({ userId, sessao }) {
  const [aba, setAba] = useState('amigos') // amigos | solicitacoes | jam | versiculos
  const [amigos, setAmigos] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [emailBusca, setEmailBusca] = useState('')
  const [resultadoBusca, setResultadoBusca] = useState(null)
  const [erroBusca, setErroBusca] = useState('')
  const [jams, setJams] = useState([])
  const [novoJamNome, setNovoJamNome] = useState('')
  const [novoJamTema, setNovoJamTema] = useState('')
  const [criandoJam, setCriandoJam] = useState(false)
  const [versiculos, setVersiculos] = useState([])
  const [jamAberto, setJamAberto] = useState(null)
  const [respostaJam, setRespostaJam] = useState('')

  useEffect(() => {
    buscarAmigos()
    buscarSolicitacoes()
    buscarJams()
    buscarVersiculos()
  }, [])

  // --- AMIZADES ---

  async function buscarAmigos() {
    const { data } = await supabase
      .from('amizades')
      .select('*')
      .eq('status', 'aceita')
      .or(`solicitante_id.eq.${userId},destinatario_id.eq.${userId}`)
    setAmigos(data || [])
  }

  async function buscarSolicitacoes() {
    const { data } = await supabase
      .from('amizades')
      .select('*')
      .eq('destinatario_id', userId)
      .eq('status', 'pendente')
    setSolicitacoes(data || [])
  }

  async function buscarUsuarioPorEmail() {
    setErroBusca('')
    setResultadoBusca(null)
    if (!emailBusca.trim()) return

    // Busca o perfil pelo email — precisa de uma view ou função no Supabase
    // Aqui usamos uma abordagem simples buscando nos perfis
    const { data, error } = await supabase
      .from('perfis')
      .select('id, nome')
      .ilike('email_cache', `%${emailBusca}%`)
      .neq('id', userId)
      .limit(1)
      .single()

    if (error || !data) {
      setErroBusca('Usuário não encontrado. Verifique o email.')
      return
    }
    setResultadoBusca(data)
  }

  async function enviarSolicitacao(destinatarioId) {
    const { error } = await supabase.from('amizades').insert({
      solicitante_id: userId,
      destinatario_id: destinatarioId,
      status: 'pendente'
    })
    if (!error) {
      setResultadoBusca(null)
      setEmailBusca('')
      alert('Solicitação enviada!')
    }
  }

  async function responderSolicitacao(amizadeId, aceitar) {
    await supabase.from('amizades')
      .update({ status: aceitar ? 'aceita' : 'recusada' })
      .eq('id', amizadeId)
    buscarSolicitacoes()
    if (aceitar) buscarAmigos()
  }

  // --- JAM DE DEVOCIONAL ---

  async function buscarJams() {
    const { data } = await supabase
      .from('devocional_jam')
      .select('*')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(20)
    setJams(data || [])
  }

  async function criarJam() {
    if (!novoJamNome.trim()) return
    setCriandoJam(true)
    try {
      // Gera o devocional via Gemini
      const resposta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{
                text: `Crie um devocional cristão evangélico curto para um grupo sobre "${novoJamTema || 'fé e comunidade'}".
Inclua: versículo base, reflexão de 1 parágrafo e uma pergunta para o grupo responder juntos.
Escreva em português brasileiro. Use markdown com títulos para cada seção.`
              }]
            }]
          })
        }
      )
      const dados = await resposta.json()
      const conteudo = dados.candidates?.[0]?.content?.parts?.[0]?.text || ''

      await supabase.from('devocional_jam').insert({
        criador_id: userId,
        nome: novoJamNome,
        tema: novoJamTema,
        conteudo,
        participantes: [userId]
      })

      setNovoJamNome('')
      setNovoJamTema('')
      buscarJams()
    } catch (e) {
      console.error(e)
    }
    setCriandoJam(false)
  }

  async function entrarJam(jamId, participantes) {
    if (participantes.includes(userId)) return
    await supabase.from('devocional_jam')
      .update({ participantes: [...participantes, userId] })
      .eq('id', jamId)
    buscarJams()
    setJamAberto(jamId)
  }

  async function responderJam(jam) {
    if (!respostaJam.trim()) return
    const novasRespostas = [
      ...(jam.respostas || []),
      {
        userId,
        nome: sessao.user.email.split('@')[0],
        texto: respostaJam,
        criado_em: new Date().toISOString()
      }
    ]
    await supabase.from('devocional_jam')
      .update({ respostas: novasRespostas })
      .eq('id', jam.id)
    setRespostaJam('')
    buscarJams()
  }

  // --- VERSÍCULOS COMPARTILHADOS ---

  async function buscarVersiculos() {
    const { data } = await supabase
      .from('versiculos_compartilhados')
      .select('*')
      .or(`remetente_id.eq.${userId},destinatario_id.eq.${userId}`)
      .order('criado_em', { ascending: false })
    setVersiculos(data || [])
  }

  const nomeUsuario = sessao.user.email.split('@')[0]

  return (
    <div className="flex flex-col gap-5">
      <h1 className="fonte-titulo text-3xl font-bold" style={{ color: 'var(--cor-dourado)' }}>
        🤝 Conexões
      </h1>

      {/* Abas */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'amigos', label: `👥 Amigos (${amigos.length})` },
          { id: 'solicitacoes', label: `📨 Solicitações ${solicitacoes.length > 0 ? `(${solicitacoes.length})` : ''}` },
          { id: 'jam', label: '🎵 Devocional Jam' },
          { id: 'versiculos', label: '📖 Compartilhados' },
        ].map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className="px-3 py-2 rounded-xl text-sm font-medium transition"
            style={{
              background: aba === a.id ? 'var(--cor-dourado)' : 'var(--cor-card)',
              color: aba === a.id ? '#0f1117' : 'var(--cor-texto-suave)',
              border: '1px solid var(--cor-borda)'
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA: AMIGOS */}
      {aba === 'amigos' && (
        <div className="flex flex-col gap-4">
          {/* Buscar usuário */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--cor-texto-suave)' }}>
              Adicionar amigo por email
            </h2>
            <div className="flex gap-2">
              <input
                value={emailBusca}
                onChange={e => setEmailBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarUsuarioPorEmail()}
                placeholder="email@exemplo.com"
                className="flex-1 px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
              />
              <button onClick={buscarUsuarioPorEmail}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--cor-dourado)', color: '#0f1117' }}>
                Buscar
              </button>
            </div>
            {erroBusca && <p className="text-xs mt-2" style={{ color: '#fca5a5' }}>{erroBusca}</p>}
            {resultadoBusca && (
              <div className="mt-3 flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)' }}>
                <span className="text-sm">{resultadoBusca.nome || resultadoBusca.id.slice(0, 8)}</span>
                <button onClick={() => enviarSolicitacao(resultadoBusca.id)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: 'var(--cor-dourado)', color: '#0f1117' }}>
                  + Adicionar
                </button>
              </div>
            )}
          </div>

          {/* Lista de amigos */}
          {amigos.length === 0 ? (
            <p className="text-center py-6" style={{ color: 'var(--cor-texto-suave)' }}>
              Nenhum amigo ainda. Adicione alguém pelo email!
            </p>
          ) : amigos.map(a => {
            const amigoId = a.solicitante_id === userId ? a.destinatario_id : a.solicitante_id
            return (
              <div key={a.id} className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                  style={{ background: 'var(--cor-dourado)', color: '#0f1117' }}>
                  {amigoId.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Amigo</p>
                  <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>Conectado ✅</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ABA: SOLICITAÇÕES */}
      {aba === 'solicitacoes' && (
        <div className="flex flex-col gap-3">
          {solicitacoes.length === 0 ? (
            <p className="text-center py-6" style={{ color: 'var(--cor-texto-suave)' }}>
              Nenhuma solicitação pendente.
            </p>
          ) : solicitacoes.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
              <div>
                <p className="text-sm font-semibold">Solicitação de amizade</p>
                <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>
                  {s.solicitante_id.slice(0, 8)}...
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => responderSolicitacao(s.id, true)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: '#16a34a', color: 'white' }}>
                  Aceitar
                </button>
                <button onClick={() => responderSolicitacao(s.id, false)}
                  className="px-3 py-1 rounded-lg text-xs"
                  style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)' }}>
                  Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ABA: JAM */}
      {aba === 'jam' && (
        <div className="flex flex-col gap-4">
          {/* Criar jam */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
            <h2 className="fonte-titulo text-lg font-bold mb-3" style={{ color: 'var(--cor-dourado)' }}>
              🎵 Criar Devocional Jam
            </h2>
            <p className="text-xs mb-3" style={{ color: 'var(--cor-texto-suave)' }}>
              Um devocional gerado pela IA onde todos podem responder a pergunta juntos.
            </p>
            <input
              value={novoJamNome}
              onChange={e => setNovoJamNome(e.target.value)}
              placeholder="Nome do grupo (ex: Célula da Paz)"
              className="w-full px-3 py-2 rounded-xl text-sm mb-2"
              style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            />
            <input
              value={novoJamTema}
              onChange={e => setNovoJamTema(e.target.value)}
              placeholder="Tema (opcional — ex: esperança)"
              className="w-full px-3 py-2 rounded-xl text-sm mb-3"
              style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            />
            <button onClick={criarJam} disabled={criandoJam || !novoJamNome.trim()}
              className="w-full py-2 rounded-xl text-sm font-semibold transition"
              style={{ background: 'var(--cor-dourado)', color: '#0f1117', opacity: criandoJam ? 0.7 : 1 }}>
              {criandoJam ? '⏳ Gerando devocional...' : '✨ Criar Jam'}
            </button>
          </div>

          {/* Lista de jams */}
          {jams.map(jam => {
            const aberto = jamAberto === jam.id
            const jaParticipa = jam.participantes?.includes(userId)
            return (
              <div key={jam.id} className="rounded-2xl p-5"
                style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="fonte-titulo font-bold">{jam.nome}</h3>
                    {jam.tema && <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-suave)' }}>Tema: {jam.tema}</p>}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full"
                    style={{ background: 'var(--cor-fundo)', color: 'var(--cor-texto-suave)' }}>
                    👥 {jam.participantes?.length || 1}
                  </span>
                </div>

                {/* Devocional */}
                {aberto && jam.conteudo && (
                  <div className="text-sm leading-relaxed mb-4 p-3 rounded-xl whitespace-pre-wrap"
                    style={{ background: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}>
                    {jam.conteudo}
                  </div>
                )}

                {/* Respostas */}
                {aberto && (jam.respostas || []).length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    <p className="text-xs font-semibold" style={{ color: 'var(--cor-texto-suave)' }}>
                      Respostas do grupo:
                    </p>
                    {jam.respostas.map((r, i) => (
                      <div key={i} className="p-3 rounded-xl text-sm"
                        style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--cor-dourado)' }}>
                          {r.nome}
                        </p>
                        <p>{r.texto}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Responder */}
                {aberto && (
                  <div className="flex gap-2">
                    <input
                      value={respostaJam}
                      onChange={e => setRespostaJam(e.target.value)}
                      placeholder="Sua resposta à pergunta..."
                      className="flex-1 px-3 py-2 rounded-xl text-sm"
                      style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
                    />
                    <button onClick={() => responderJam(jam)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--cor-dourado)', color: '#0f1117' }}>
                      Enviar
                    </button>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { setJamAberto(aberto ? null : jam.id); if (!jaParticipa) entrarJam(jam.id, jam.participantes || []) }}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition"
                    style={{ background: aberto ? 'var(--cor-fundo)' : 'var(--cor-dourado)', color: aberto ? 'var(--cor-texto-suave)' : '#0f1117', border: '1px solid var(--cor-borda)' }}>
                    {aberto ? 'Fechar' : jaParticipa ? 'Abrir Jam' : 'Entrar na Jam'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ABA: VERSÍCULOS COMPARTILHADOS */}
      {aba === 'versiculos' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
            Versículos compartilhados com você aparecem aqui. Para compartilhar, vá à aba Bíblia e clique em 📤 ao lado de um versículo.
          </p>
          {versiculos.length === 0 ? (
            <p className="text-center py-6" style={{ color: 'var(--cor-texto-suave)' }}>
              Nenhum versículo compartilhado ainda.
            </p>
          ) : versiculos.map(v => (
            <div key={v.id} className="rounded-xl p-4"
              style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--cor-dourado)' }}>
                {v.referencia}
                {v.destinatario_id === userId ? ' • recebido' : ' • enviado'}
              </p>
              <p className="text-sm leading-relaxed italic mb-2">{v.texto}</p>
              {v.mensagem && <p className="text-xs" style={{ color: 'var(--cor-texto-suave)' }}>"{v.mensagem}"</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}