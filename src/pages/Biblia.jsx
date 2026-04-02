import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const LIVROS = [
  // Antigo Testamento
  { pt: 'Gênesis',           en: 'genesis' },
  { pt: 'Êxodo',             en: 'exodus' },
  { pt: 'Levítico',          en: 'leviticus' },
  { pt: 'Números',           en: 'numbers' },
  { pt: 'Deuteronômio',      en: 'deuteronomy' },
  { pt: 'Josué',             en: 'joshua' },
  { pt: 'Juízes',            en: 'judges' },
  { pt: 'Rute',              en: 'ruth' },
  { pt: '1 Samuel',          en: '1samuel' },
  { pt: '2 Samuel',          en: '2samuel' },
  { pt: '1 Reis',            en: '1kings' },
  { pt: '2 Reis',            en: '2kings' },
  { pt: '1 Crônicas',        en: '1chronicles' },
  { pt: '2 Crônicas',        en: '2chronicles' },
  { pt: 'Esdras',            en: 'ezra' },
  { pt: 'Neemias',           en: 'nehemiah' },
  { pt: 'Ester',             en: 'esther' },
  { pt: 'Jó',                en: 'job' },
  { pt: 'Salmos',            en: 'psalms' },
  { pt: 'Provérbios',        en: 'proverbs' },
  { pt: 'Eclesiastes',       en: 'ecclesiastes' },
  { pt: 'Cantares',          en: 'songofsolomon' },
  { pt: 'Isaías',            en: 'isaiah' },
  { pt: 'Jeremias',          en: 'jeremiah' },
  { pt: 'Lamentações',       en: 'lamentations' },
  { pt: 'Ezequiel',          en: 'ezekiel' },
  { pt: 'Daniel',            en: 'daniel' },
  { pt: 'Oséias',            en: 'hosea' },
  { pt: 'Joel',              en: 'joel' },
  { pt: 'Amós',              en: 'amos' },
  { pt: 'Obadias',           en: 'obadiah' },
  { pt: 'Jonas',             en: 'jonah' },
  { pt: 'Miquéias',          en: 'micah' },
  { pt: 'Naum',              en: 'nahum' },
  { pt: 'Habacuque',         en: 'habakkuk' },
  { pt: 'Sofonias',          en: 'zephaniah' },
  { pt: 'Ageu',              en: 'haggai' },
  { pt: 'Zacarias',          en: 'zechariah' },
  { pt: 'Malaquias',         en: 'malachi' },
  // Novo Testamento
  { pt: 'Mateus',            en: 'matthew' },
  { pt: 'Marcos',            en: 'mark' },
  { pt: 'Lucas',             en: 'luke' },
  { pt: 'João',              en: 'john' },
  { pt: 'Atos',              en: 'acts' },
  { pt: 'Romanos',           en: 'romans' },
  { pt: '1 Coríntios',       en: '1corinthians' },
  { pt: '2 Coríntios',       en: '2corinthians' },
  { pt: 'Gálatas',           en: 'galatians' },
  { pt: 'Efésios',           en: 'ephesians' },
  { pt: 'Filipenses',        en: 'philippians' },
  { pt: 'Colossenses',       en: 'colossians' },
  { pt: '1 Tessalonicenses', en: '1thessalonians' },
  { pt: '2 Tessalonicenses', en: '2thessalonians' },
  { pt: '1 Timóteo',         en: '1timothy' },
  { pt: '2 Timóteo',         en: '2timothy' },
  { pt: 'Tito',              en: 'titus' },
  { pt: 'Filemom',           en: 'philemon' },
  { pt: 'Hebreus',           en: 'hebrews' },
  { pt: 'Tiago',             en: 'james' },
  { pt: '1 Pedro',           en: '1peter' },
  { pt: '2 Pedro',           en: '2peter' },
  { pt: '1 João',            en: '1john' },
  { pt: '2 João',            en: '2john' },
  { pt: '3 João',            en: '3john' },
  { pt: 'Judas',             en: 'jude' },
  { pt: 'Apocalipse',        en: 'revelation' },
]

// Converte referência em português para inglês para a API
function converterReferencia(ref) {
  let resultado = ref.trim()
  for (const livro of LIVROS) {
    if (resultado.toLowerCase().startsWith(livro.pt.toLowerCase())) {
      resultado = resultado.replace(new RegExp(livro.pt, 'i'), livro.en)
      break
    }
  }
  // Remove espaços entre livro e capítulo: "genesis 1:1" → "genesis+1:1"
  return resultado.replace(/\s+/g, '+')
}

export default function Biblia({ userId }) {
  const [livroIdx, setLivroIdx] = useState(18) // Salmos
  const [capitulo, setCapitulo] = useState(23)
  const [texto, setTexto] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [busca, setBusca] = useState('')
  const [favoritos, setFavoritos] = useState([])
  const [aba, setAba] = useState('leitura')

  useEffect(() => { buscarCapitulo() }, [livroIdx, capitulo])
  useEffect(() => { buscarFavoritos() }, [])

  async function buscarCapitulo() {
    setCarregando(true)
    setTexto(null)
    try {
      const livroEN = LIVROS[livroIdx].en
      const url = `https://bible-api.com/${livroEN}+${capitulo}?translation=almeida`
      const res = await fetch(url)
      const dados = await res.json()
      if (dados.error) throw new Error(dados.error)
      setTexto(dados)
    } catch (e) {
      setTexto({ error: 'Não foi possível carregar. Tente novamente.' })
    }
    setCarregando(false)
  }

  async function buscarReferencia() {
    if (!busca.trim()) return
    setCarregando(true)
    setTexto(null)
    try {
      const refEN = converterReferencia(busca)
      const url = `https://bible-api.com/${refEN}?translation=almeida`
      const res = await fetch(url)
      const dados = await res.json()
      if (dados.error) throw new Error(dados.error)
      setTexto(dados)
      setAba('leitura')
    } catch (e) {
      setTexto({ error: `Referência não encontrada: "${busca}". Tente no formato "João 3:16" ou "Salmos 23"` })
    }
    setCarregando(false)
  }

  async function buscarFavoritos() {
    const { data } = await supabase.from('biblia_favoritos')
      .select('*').eq('user_id', userId).order('criado_em', { ascending: false })
    setFavoritos(data || [])
  }

  async function favoritarVersiculo(versiculo) {
    const referencia = `${LIVROS[livroIdx].pt} ${capitulo}:${versiculo.verse}`
    const { error } = await supabase.from('biblia_favoritos').insert({
      user_id: userId,
      referencia,
      texto: versiculo.text
    })
    if (!error) buscarFavoritos()
  }

  async function removerFavorito(id) {
    await supabase.from('biblia_favoritos').delete().eq('id', id)
    buscarFavoritos()
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="fonte-titulo text-3xl font-bold" style={{ color: 'var(--cor-dourado)' }}>
        📖 Bíblia
      </h1>

      {/* Busca */}
      <div className="flex gap-2">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscarReferencia()}
          placeholder="Ex: João 3:16 ou Salmos 23"
          className="flex-1 px-4 py-2 rounded-xl text-sm"
          style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
        />
        <button onClick={buscarReferencia}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--cor-dourado)', color: '#0f1117' }}>
          Buscar
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        {[
          { id: 'leitura', label: '📖 Leitura' },
          { id: 'favoritos', label: `⭐ Favoritos (${favoritos.length})` }
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

      {aba === 'leitura' && (
        <>
          {/* Seletor */}
          <div className="flex gap-2">
            <select value={livroIdx} onChange={e => { setLivroIdx(+e.target.value); setCapitulo(1) }}
              className="flex-1 px-3 py-2 rounded-xl text-sm"
              style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}>
              {LIVROS.map((l, i) => <option key={i} value={i}>{l.pt}</option>)}
            </select>
            <input type="number" min={1} value={capitulo}
              onChange={e => setCapitulo(Math.max(1, +e.target.value))}
              className="w-20 px-3 py-2 rounded-xl text-sm text-center"
              style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)' }}
            />
          </div>

          {/* Texto */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
            {carregando ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando...</p>
              </div>
            ) : texto?.verses ? (
              <>
                <h2 className="fonte-titulo text-lg font-bold mb-4" style={{ color: 'var(--cor-dourado)' }}>
                  {texto.reference || `${LIVROS[livroIdx].pt} ${capitulo}`}
                </h2>
                <div className="flex flex-col gap-3">
                  {texto.verses.map(v => (
                    <div key={v.verse} className="flex gap-2 group items-start">
                      <span className="text-xs mt-1 min-w-[20px] font-bold" style={{ color: 'var(--cor-dourado)' }}>
                        {v.verse}
                      </span>
                      <p className="text-sm leading-relaxed flex-1">{v.text.trim()}</p>
                      <button onClick={() => favoritarVersiculo(v)}
                        title="Favoritar versículo"
                        className="opacity-0 group-hover:opacity-100 transition text-base flex-shrink-0">
                        ⭐
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : texto?.error ? (
              <p className="text-sm" style={{ color: '#fca5a5' }}>{texto.error}</p>
            ) : null}
          </div>

          {/* Navegação */}
          <div className="flex justify-between">
            <button onClick={() => setCapitulo(c => Math.max(1, c - 1))}
              className="px-4 py-2 rounded-xl text-sm transition"
              style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)' }}>
              ← Anterior
            </button>
            <button onClick={() => setCapitulo(c => c + 1)}
              className="px-4 py-2 rounded-xl text-sm transition"
              style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto-suave)' }}>
              Próximo →
            </button>
          </div>
        </>
      )}

      {aba === 'favoritos' && (
        <div className="flex flex-col gap-3">
          {favoritos.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--cor-texto-suave)' }}>
              Nenhum favorito ainda.<br />
              Passe o mouse sobre um versículo e clique em ⭐
            </p>
          ) : favoritos.map(f => (
            <div key={f.id} className="rounded-xl p-4 group relative"
              style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--cor-dourado)' }}>{f.referencia}</p>
              <p className="text-sm leading-relaxed">{f.texto}</p>
              <button onClick={() => removerFavorito(f.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition text-xs"
                style={{ color: '#dc2626' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}