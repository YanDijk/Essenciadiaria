import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Perfil({ userId, sessao }) {
  const [perfil, setPerfil] = useState(null)
  const [historico, setHistorico] = useState([])
  const [editandoNome, setEditandoNome] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [salvandoNome, setSalvandoNome] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const inputFotoRef = useRef(null)

  useEffect(() => {
    buscarPerfil()
    buscarHistorico()
  }, [])

  async function buscarPerfil() {
    const { data } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', userId)
      .single()

    // Se não existe perfil ainda, cria
    if (!data) {
      await supabase.from('perfis').insert({ id: userId })
      setPerfil({ streak_atual: 0 })
      setNovoNome('')
    } else {
      setPerfil(data)
      setNovoNome(data.nome || '')
    }
  }

  async function buscarHistorico() {
    const { data } = await supabase
      .from('devocionais')
      .select('criado_em')
      .eq('user_id', userId)
      .order('criado_em', { ascending: false })
      .limit(30)
    setHistorico(data || [])
  }

  async function salvarNome() {
    if (!novoNome.trim()) return
    setSalvandoNome(true)

    const { error } = await supabase
      .from('perfis')
      .upsert({ id: userId, nome: novoNome.trim() })

    if (!error) {
      setPerfil(p => ({ ...p, nome: novoNome.trim() }))
      setEditandoNome(false)
    } else {
      console.error('Erro ao salvar nome:', error)
    }
    setSalvandoNome(false)
  }

  async function uploadFoto(e) {
    const arquivo = e.target.files[0]
    if (!arquivo) return

    setUploadingFoto(true)
    const extensao = arquivo.name.split('.').pop()
    const caminho = `${userId}/avatar.${extensao}`

    const { error: erroUpload } = await supabase.storage
      .from('avatars')
      .upload(caminho, arquivo, { upsert: true })

    if (erroUpload) {
      console.error('Erro no upload:', erroUpload)
      setUploadingFoto(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(caminho)

    const novaUrl = urlData.publicUrl + '?t=' + Date.now() // cache-busting

    await supabase.from('perfis').upsert({ id: userId, foto_url: novaUrl })
    setPerfil(p => ({ ...p, foto_url: novaUrl }))
    setUploadingFoto(false)
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  const nomeExibido = perfil?.nome || sessao.user.email.split('@')[0]
  const streakAtual = perfil?.streak_atual || 0

  const ultimos28Dias = Array.from({ length: 28 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (27 - i))
    return d.toISOString().split('T')[0]
  })

  const diasComDevocional = new Set(
    historico.map(h => h.criado_em?.split('T')[0])
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="fonte-titulo text-3xl font-bold" style={{ color: 'var(--cor-dourado)' }}>
        👤 Perfil
      </h1>

      {/* Card do perfil */}
      <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>

        {/* Foto de perfil */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          {perfil?.foto_url ? (
            <img src={perfil.foto_url} alt="avatar"
              className="w-20 h-20 rounded-full object-cover"
              style={{ border: '2px solid var(--cor-dourado)' }} />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ background: 'var(--cor-dourado)', color: '#0f1117' }}>
              {nomeExibido[0]?.toUpperCase()}
            </div>
          )}

          {/* Botão de editar foto */}
          <button
            onClick={() => inputFotoRef.current?.click()}
            disabled={uploadingFoto}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-xs transition"
            style={{ background: 'var(--cor-dourado)', color: '#0f1117' }}
            title="Alterar foto">
            {uploadingFoto ? '⏳' : '📷'}
          </button>

          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            onChange={uploadFoto}
            className="hidden"
          />
        </div>

        {/* Nome editável */}
        {editandoNome ? (
          <div className="flex gap-2 justify-center mb-2">
            <input
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && salvarNome()}
              autoFocus
              placeholder="Seu nome"
              className="px-3 py-1 rounded-lg text-sm text-center"
              style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            />
            <button onClick={salvarNome} disabled={salvandoNome}
              className="px-3 py-1 rounded-lg text-sm font-semibold"
              style={{ background: 'var(--cor-dourado)', color: '#0f1117' }}>
              {salvandoNome ? '...' : 'Salvar'}
            </button>
            <button onClick={() => { setEditandoNome(false); setNovoNome(perfil?.nome || '') }}
              className="px-3 py-1 rounded-lg text-sm"
              style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)' }}>
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="fonte-titulo text-xl font-bold">{nomeExibido}</h2>
            <button onClick={() => setEditandoNome(true)}
              className="text-sm opacity-40 hover:opacity-100 transition"
              title="Editar nome">
              ✏️
            </button>
          </div>
        )}

        <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>{sessao.user.email}</p>
      </div>

      {/* Streak */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--cor-texto-suave)' }}>🔥 Sequência</h3>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="fonte-titulo text-5xl font-bold" style={{ color: 'var(--cor-dourado)' }}>
              {streakAtual}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-suave)' }}>dias seguidos</p>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            {streakAtual === 0 && (
              <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
                Complete um devocional hoje para iniciar sua sequência!
              </p>
            )}
            {streakAtual >= 7 && <div className="text-sm">🏅 7 dias — Dedicado!</div>}
            {streakAtual >= 30 && <div className="text-sm">🏆 30 dias — Comprometido!</div>}
            {streakAtual >= 100 && <div className="text-sm">💎 100 dias — Extraordinário!</div>}
          </div>
        </div>
      </div>

      {/* Gráfico de atividade */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--cor-texto-suave)' }}>
          📊 Atividade — últimas 4 semanas
        </h3>
        <div className="grid grid-cols-7 gap-1">
          {['D','S','T','Q','Q','S','S'].map((d, i) => (
            <div key={i} className="text-center text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>{d}</div>
          ))}
          {ultimos28Dias.map(dia => (
            <div key={dia}
              className="aspect-square rounded-sm"
              title={dia}
              style={{
                background: diasComDevocional.has(dia) ? 'var(--cor-dourado)' : 'var(--cor-fundo)',
                border: '1px solid var(--cor-borda)'
              }}
            />
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--cor-texto-suave)' }}>
          {diasComDevocional.size} devocionais nos últimos 28 dias
        </p>
      </div>

      {/* Sair */}
      <button onClick={sair}
        className="w-full py-3 rounded-xl text-sm font-semibold transition"
        style={{ background: 'var(--cor-fundo)', border: '1px solid #dc2626', color: '#dc2626' }}>
        Sair da conta
      </button>
    </div>
  )
}