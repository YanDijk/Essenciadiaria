import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ isAdmin }) {
  const { pathname } = useLocation()

  const itens = [
    { caminho: '/',          icone: '🏠', label: 'Início' },
    { caminho: '/biblia',    icone: '📖', label: 'Bíblia' },
    { caminho: '/conexoes',  icone: '🤝', label: 'Conexões' }, 
    { caminho: '/comunidade',icone: '👥', label: 'Comunidade' },
    { caminho: '/planos',    icone: '📅', label: 'Planos' },
    { caminho: '/perfil',    icone: '👤', label: 'Perfil' },

    ...(isAdmin ? [
      { caminho: '/admin', icone: '⚙️', label: 'Admin' }
    ] : [])
  ]

  return (
    <>
      {/* Navbar inferior — mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{ background: 'var(--cor-card)', borderTop: '1px solid var(--cor-borda)' }}>
        <div className="flex justify-around py-2">
          {itens.map(item => (
            <Link key={item.caminho} to={item.caminho}
              className={`flex flex-col items-center px-3 py-1 text-xs transition
                ${pathname === item.caminho
                  ? 'text-yellow-400'
                  : 'text-gray-500 hover:text-gray-300'}`}>
              <span className="text-xl">{item.icone}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Navbar lateral — desktop */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col py-8 px-4 z-50"
        style={{ background: 'var(--cor-card)', borderRight: '1px solid var(--cor-borda)' }}>
        <div className="mb-10 px-2">
          <h1 className="fonte-titulo text-2xl font-bold" style={{ color: 'var(--cor-dourado)' }}>
            ✝ Devocionais
          </h1>
        </div>
        <div className="flex flex-col gap-1">
          {itens.map(item => (
            <Link key={item.caminho} to={item.caminho}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition
                ${pathname === item.caminho
                  ? 'bg-yellow-400/10 text-yellow-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
              <span className="text-lg">{item.icone}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}