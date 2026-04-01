import { useState } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/devocional.css'
import ReactMarkdown from 'react-markdown'

export default function GerarDevocional({ userId, onSalvo }) {
  const [tema, setTema] = useState('')
  const [devocional, setDevocional] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  async function gerarDevocional() {
  if (!tema.trim()) return
  setCarregando(true)
  setDevocional('')
  setSalvo(false)

  try {
    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Crie um devocional cristão sobre o tema: "${tema}". 
Inclua: um versículo bíblico relevante(Especifique qual versiculo e qual versão da biblia), uma reflexão de 2-3 parágrafos, 
com uma pergunta chave sobre o tema, um desafio sobre, uma frase inspiradora, e uma oração curta no final.
Escreva em português brasileiro, com linguagem acolhedora e inspiradora. Faça utilização de emojis para melhor identificação de cada seção. Formate o texto utilizando markdown, com títulos para cada seção (Versículo, Reflexão, Pergunta, Desafio, Frase inspiradora e Oração).`,
                },
              ],
            },
          ],
        }),
      }
    )

    const dados = await resposta.json()
    console.log("RESPOSTA GEMINI:", dados)

    if (!resposta.ok) {
      throw new Error(dados.error?.message || 'Erro na API')
    }

    const texto =
      dados.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Erro ao gerar conteúdo.'

    setDevocional(texto)

  } catch (erro) {
    console.error(erro)
    setDevocional('Erro ao gerar o devocional: ' + erro.message)
  } finally {
    setCarregando(false)
  }


}

  async function salvarDevocional() {
    const { error } = await supabase.from('devocionais').insert({
      user_id: userId,
      tema,
      conteudo: devocional,
    })

    if (!error) {
      setSalvo(true)
      onSalvo()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-6">
      <h2 className="text-xl font-bold text-amber-800 mb-4">📝 Gerar novo devocional</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Digite um tema (ex: fé, esperança, gratidão...)"
          value={tema}
          onChange={e => setTema(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
        />
        <button
          onClick={gerarDevocional}
          disabled={carregando || !tema.trim()}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg"
        >
          {carregando ? 'Gerando...' : 'Gerar'}
        </button>
      </div>

      {devocional && (
  <div className="mt-4">
    <div className="bg-amber-50 border rounded-xl p-5 whitespace-pre-wrap">
      <ReactMarkdown>{devocional}</ReactMarkdown> {/* <-- aqui */}
    </div>
    <button
      onClick={salvarDevocional}
      disabled={salvo}
      className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg"
    >
      {salvo ? '✅ Salvo!' : '💾 Salvar devocional'}
    </button>
  </div>
)}
    </div>
  )
}