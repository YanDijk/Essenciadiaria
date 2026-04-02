import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ReactMarkdown from 'react-markdown'

export default function ListaDevocionais({ userId, atualizar }) {
  const [devocionais, setDevocionais] = useState([])
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    async function buscar() {
      const { data } = await supabase
        .from('devocionais')
        .select('*')
        .eq('user_id', userId)
        .order('criado_em', { ascending: false })

      setDevocionais(data || [])
    }
    buscar()
  }, [userId, atualizar])

  if (devocionais.length === 0) {
    return <p className="text-center text-gray-400 mt-8">Nenhum devocional salvo ainda.</p>
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-amber-800 mb-4">📚 Meus devocionais</h2>
      <div className="flex flex-col gap-3">
        {devocionais.map(dev => (
          <div key={dev.id} className="bg-white rounded-xl shadow p-4">
            <button
              onClick={() => setAberto(aberto === dev.id ? null : dev.id)}
              className="w-full text-left flex justify-between items-center"
            >
              <span className="font-semibold text-amber-700 capitalize">{dev.tema}</span>
              <span className="text-gray-400 text-sm">
                {new Date(dev.criado_em).toLocaleDateString('pt-BR')} {aberto === dev.id ? '▲' : '▼'}
              </span>
            </button>
            {aberto === dev.id && (
              <div className="mt-3 text-gray-700 whitespace-pre-wrap leading-relaxed border-t pt-3">
                <ReactMarkdown>{dev.conteudo}</ReactMarkdown>  {/* <-- aqui */}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}