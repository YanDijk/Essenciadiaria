import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TIPOS = [
  { id: 'reflexao',   emoji: '💭', label: 'Reflexão' },
  { id: 'versiculo',  emoji: '📖', label: 'Versículo' },
  { id: 'testemunho', emoji: '🙌', label: 'Testemunho' },
  { id: 'oracao',     emoji: '🙏', label: 'Oração' },
]

export default function Comunidade({ userId, sessao }) {
  const [posts, setPosts] = useState([])
  const [conteudo, setConteudo] = useState('')
  const [tipo, setTipo] = useState('reflexao')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => { buscarPosts() }, [])

  async function buscarPosts() {
    const { data } = await supabase
      .from('comunidade_posts')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(30)
    setPosts(data || [])
  }

  async function publicar() {
    if (!conteudo.trim()) return
    setEnviando(true)
    const nomeUsuario = sessao.user.email.split('@')[0]
    await supabase.from('comunidade_posts').insert({
      user_id: userId,
      nome_usuario: nomeUsuario,
      tipo,
      conteudo
    })
    setConteudo('')
    await buscarPosts()
    setEnviando(false)
  }

  async function curtir(postId, curtidasAtuais) {
  const { error } = await supabase
    .from('comunidade_posts')
    .update({ curtidas: curtidasAtuais + 1 })
    .eq('id', postId)

  if (error) {
    console.error('Erro ao curtir:', error)
    return
  }
  // Atualiza localmente sem buscar do banco (mais rápido)
  setPosts(posts.map(p =>
    p.id === postId ? { ...p, curtidas: curtidasAtuais + 1 } : p
  ))
}

  const tipoInfo = (t) => TIPOS.find(x => x.id === t) || TIPOS[0]

  return (
    <div className="flex flex-col gap-5">
      <h1 className="fonte-titulo text-3xl font-bold" style={{ color: 'var(--cor-dourado)' }}>
        👥 Comunidade
      </h1>

      {/* Novo post */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--cor-texto-suave)' }}>
          Compartilhar com a comunidade
        </h2>

        {/* Tipo */}
        <div className="flex gap-2 flex-wrap mb-3">
          {TIPOS.map(t => (
            <button key={t.id} onClick={() => setTipo(t.id)}
              className="px-3 py-1 rounded-full text-xs font-medium transition"
              style={{
                background: tipo === t.id ? 'var(--cor-dourado)' : 'var(--cor-fundo)',
                color: tipo === t.id ? '#0f1117' : 'var(--cor-texto-suave)',
                border: '1px solid var(--cor-borda)'
              }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        <textarea
          value={conteudo}
          onChange={e => setConteudo(e.target.value)}
          placeholder={
            tipo === 'oracao' ? 'Compartilhe seu pedido de oração...' :
            tipo === 'versiculo' ? 'Qual versículo te tocou hoje?' :
            tipo === 'testemunho' ? 'Compartilhe o que Deus fez na sua vida...' :
            'O que você está meditando?'
          }
          rows={3}
          className="w-full p-3 rounded-xl text-sm resize-none mb-3"
          style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
        />

        <button onClick={publicar} disabled={enviando || !conteudo.trim()}
          className="w-full py-2 rounded-xl text-sm font-semibold transition"
          style={{ background: 'var(--cor-dourado)', color: '#0f1117', opacity: enviando ? 0.7 : 1 }}>
          {enviando ? 'Publicando...' : 'Publicar'}
        </button>
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-3">
        {posts.map(post => {
          const info = tipoInfo(post.tipo)
          return (
            <div key={post.id} className="rounded-xl p-4" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{info.emoji}</span>
                <div>
                  <span className="text-sm font-semibold">{post.nome_usuario}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--cor-texto-suave)' }}>
                    {info.label} · {new Date(post.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3">{post.conteudo}</p>
              <button onClick={() => curtir(post.id, post.curtidas)}
  className="text-xs flex items-center gap-1 px-3 py-1 rounded-full transition hover:opacity-80"
  style={{ background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)' }}>
  {post.tipo === 'oracao' ? '🙏' : '❤️'} {post.curtidas}
  <span className="ml-1">{post.tipo === 'oracao' ? 'orando' : 'curtir'}</span>
</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}