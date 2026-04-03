import { useEffect, useState } from 'react'

const LIVROS = [
  { nome: 'Gênesis', file: 'gn' }, { nome: 'Êxodo', file: 'ex' },
  { nome: 'Levítico', file: 'lv' }, { nome: 'Números', file: 'nm' },
  { nome: 'Deuteronômio', file: 'dt' }, { nome: 'Josué', file: 'js' },
  { nome: 'Juízes', file: 'jz' }, { nome: 'Rute', file: 'rt' },
  { nome: '1 Samuel', file: '1_sm' }, { nome: '2 Samuel', file: '2_sm' },
  { nome: '1 Reis', file: '1_rs' }, { nome: '2 Reis', file: '2_rs' },
  { nome: '1 Crônicas', file: '1_cr' }, { nome: '2 Crônicas', file: '2_cr' },
  { nome: 'Esdras', file: 'ed' }, { nome: 'Neemias', file: 'ne' },
  { nome: 'Ester', file: 'et' }, { nome: 'Jó', file: 'jo' },
  { nome: 'Salmos', file: 'sl' }, { nome: 'Provérbios', file: 'pv' },
  { nome: 'Eclesiastes', file: 'ec' }, { nome: 'Cantares', file: 'ct' },
  { nome: 'Isaías', file: 'is' }, { nome: 'Jeremias', file: 'jr' },
  { nome: 'Lamentações', file: 'lm' }, { nome: 'Ezequiel', file: 'ez' },
  { nome: 'Daniel', file: 'dn' }, { nome: 'Oséias', file: 'os' },
  { nome: 'Joel', file: 'jl' }, { nome: 'Amós', file: 'am' },
  { nome: 'Obadias', file: 'ob' }, { nome: 'Jonas', file: 'jn' },
  { nome: 'Miquéias', file: 'mq' }, { nome: 'Naum', file: 'na' },
  { nome: 'Habacuque', file: 'hc' }, { nome: 'Sofonias', file: 'sf' },
  { nome: 'Ageu', file: 'ag' }, { nome: 'Zacarias', file: 'zc' },
  { nome: 'Malaquias', file: 'ml' },

  { nome: 'Mateus', file: 'mt' }, { nome: 'Marcos', file: 'mc' },
  { nome: 'Lucas', file: 'lc' }, { nome: 'João', file: 'jo' },
  { nome: 'Atos', file: 'at' }, { nome: 'Romanos', file: 'rm' },
  { nome: '1 Coríntios', file: '1_co' }, { nome: '2 Coríntios', file: '2_co' },
  { nome: 'Gálatas', file: 'gl' }, { nome: 'Efésios', file: 'ef' },
  { nome: 'Filipenses', file: 'fp' }, { nome: 'Colossenses', file: 'cl' },
  { nome: '1 Tessalonicenses', file: '1_ts' }, { nome: '2 Tessalonicenses', file: '2_ts' },
  { nome: '1 Timóteo', file: '1_tm' }, { nome: '2 Timóteo', file: '2_tm' },
  { nome: 'Tito', file: 'tt' }, { nome: 'Filemom', file: 'fm' },
  { nome: 'Hebreus', file: 'hb' }, { nome: 'Tiago', file: 'tg' },
  { nome: '1 Pedro', file: '1_pe' }, { nome: '2 Pedro', file: '2_pe' },
  { nome: '1 João', file: '1_jo' }, { nome: '2 João', file: '2_jo' },
  { nome: '3 João', file: '3_jo' }, { nome: 'Judas', file: 'jd' },
  { nome: 'Apocalipse', file: 'ap' },
]

export default function Biblia() {
  const [livro, setLivro] = useState('gn')
  const [capitulo, setCapitulo] = useState(0)
  const [dados, setDados] = useState(null)
  const [busca, setBusca] = useState('')

  // carregar progresso salvo
  useEffect(() => {
    const salvo = JSON.parse(localStorage.getItem('biblia_pos'))
    if (salvo) {
      setLivro(salvo.livro)
      setCapitulo(salvo.capitulo)
    }
  }, [])

  // carregar livro
  useEffect(() => {
    fetch(`/biblia/${livro}.json`)
      .then(res => res.json())
      .then(data => setDados(data))
  }, [livro])

  // salvar progresso
  useEffect(() => {
    localStorage.setItem('biblia_pos', JSON.stringify({ livro, capitulo }))
  }, [livro, capitulo])

  if (!dados) return <p className="p-4 text-white">Carregando...</p>

  const versiculos = dados.chapters[capitulo] || []

  const filtrados = busca
    ? versiculos.filter(v =>
        v.toLowerCase().includes(busca.toLowerCase())
      )
    : versiculos

  return (
    <div className="min-h-screen pb-24 px-4 text-white">

      {/* TOPO */}
      <div className="sticky top-0 bg-black/80 backdrop-blur p-3 rounded-xl mb-4">
        <h1 className="text-xl font-bold text-yellow-400">
          {dados.name} - Cap {capitulo + 1}
        </h1>

        <div className="flex gap-2 mt-2 flex-wrap">
          <select value={livro} onChange={e => setLivro(e.target.value)}
            className="bg-zinc-800 p-2 rounded">
            {LIVROS.map(l => (
              <option key={l.file} value={l.file}>{l.nome}</option>
            ))}
          </select>

          <select value={capitulo}
            onChange={e => setCapitulo(Number(e.target.value))}
            className="bg-zinc-800 p-2 rounded">
            {dados.chapters.map((_, i) => (
              <option key={i} value={i}>Cap {i + 1}</option>
            ))}
          </select>

          <input
            placeholder="Buscar palavra..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="bg-zinc-800 p-2 rounded flex-1"
          />
        </div>
      </div>

      {/* VERSÍCULOS */}
      <div className="space-y-3">
        {filtrados.map((verso, i) => (
          <p key={i} className="leading-relaxed text-gray-200">
            <span className="text-yellow-400 font-bold mr-2">
              {i + 1}
            </span>
            {verso}
          </p>
        ))}
      </div>

      {/* BOTÕES */}
      <div className="fixed bottom-16 left-0 right-0 flex justify-between px-4">

        <button
          onClick={() => setCapitulo(c => Math.max(c - 1, 0))}
          className="bg-zinc-800 px-4 py-2 rounded-xl">
          ← Anterior
        </button>

        <button
          onClick={() =>
            setCapitulo(c =>
              Math.min(c + 1, dados.chapters.length - 1)
            )
          }
          className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-bold">
          Próximo →
        </button>

      </div>
    </div>
  )
}