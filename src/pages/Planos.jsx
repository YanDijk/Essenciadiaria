import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Planos({ userId }) {
  const [planos, setPlanos] = useState([])
  const [meuProgresso, setMeuProgresso] = useState([])
  const [expandido, setExpandido] = useState(null)

  useEffect(() => {
    buscarPlanos()
    buscarProgresso()
  }, [])

  async function buscarPlanos() {
    const { data } = await supabase.from('planos').select('*')
    setPlanos(data || [])
  }

  async function buscarProgresso() {
    const { data } = await supabase.from('progresso_planos')
      .select('*').eq('user_id', userId)
    setMeuProgresso(data || [])
  }

  async function iniciarPlano(planoId) {
    await supabase.from('progresso_planos').insert({
      user_id: userId,
      plano_id: planoId,
      dia_atual: 0
    })
    buscarProgresso()
  }

  async function avancarDia(progressoId, diaAtual, totalDias) {
    const novoDia = Math.min(diaAtual + 1, totalDias)
    await supabase.from('progresso_planos')
      .update({ dia_atual: novoDia, concluido: novoDia >= totalDias })
      .eq('id', progressoId)
    buscarProgresso()
  }

  function progressoDoPlano(planoId) {
    return meuProgresso.find(p => p.plano_id === planoId)
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="fonte-titulo text-3xl font-bold" style={{ color: 'var(--cor-dourado)' }}>
        📅 Planos de Leitura
      </h1>

      {planos.map(plano => {
        const prog = progressoDoPlano(plano.id)
        const leituras = plano.leituras || []
        const porcentagem = prog ? Math.round((prog.dia_atual / plano.duracao_dias) * 100) : 0
        const leituraHoje = leituras[prog?.dia_atual] || null

        return (
          <div key={plano.id} className="rounded-2xl p-5" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
            <div className="flex justify-between items-start mb-2">
              <h2 className="fonte-titulo text-lg font-bold">{plano.nome}</h2>
              {prog?.concluido && <span className="text-green-400 text-sm">✅ Concluído!</span>}
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--cor-texto-suave)' }}>{plano.descricao}</p>

            {/* Barra de progresso */}
            {prog && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--cor-texto-suave)' }}>
                  <span>Dia {prog.dia_atual} de {plano.duracao_dias}</span>
                  <span>{porcentagem}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'var(--cor-fundo)' }}>
                  <div className="h-2 rounded-full transition-all"
                    style={{ width: `${porcentagem}%`, background: 'var(--cor-dourado)' }} />
                </div>
              </div>
            )}

           {prog && !prog.concluido && (
  <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--cor-fundo)' }}>
    <p className="text-xs mb-1" style={{ color: 'var(--cor-dourado)' }}>Leitura de hoje — Dia {prog.dia_atual + 1}</p>
    {leituraHoje ? (
      <>
        <p className="text-sm font-semibold">{leituraHoje.titulo}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-suave)' }}>
          {leituraHoje.livro} — Capítulo {leituraHoje.capitulo}
        </p>
      </>
    ) : (
      <p className="text-sm" style={{ color: 'var(--cor-texto-suave)' }}>
        Continue sua leitura pessoal conforme o plano.
      </p>
    )}
  </div>
)}

            {/* Botões */}
            {!prog ? (
              <button onClick={() => iniciarPlano(plano.id)}
                className="w-full py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--cor-dourado)', color: '#0f1117' }}>
                Começar plano
              </button>
            ) : !prog.concluido ? (
              <button onClick={() => avancarDia(prog.id, prog.dia_atual, plano.duracao_dias)}
                className="w-full py-2 rounded-xl text-sm font-semibold"
                style={{ background: '#16a34a', color: 'white' }}>
                ✔ Marcar leitura de hoje como concluída
              </button>
            ) : null}
          </div>
        )
      })}

      {planos.length === 0 && (
        <p className="text-center py-8" style={{ color: 'var(--cor-texto-suave)' }}>
          Nenhum plano disponível ainda.
        </p>
      )}
    </div>
  )
}