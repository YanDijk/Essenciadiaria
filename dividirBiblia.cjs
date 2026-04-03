const fs = require('fs')
const path = require('path')

const biblia = JSON.parse(
  fs.readFileSync('./public/biblialivre.json', 'utf-8')
)

const pasta = './public/biblia'
if (!fs.existsSync(pasta)) fs.mkdirSync(pasta)

biblia.forEach((livro, index) => {
  // garante que sempre exista um nome de arquivo
  let abrev = livro.abrev

  if (!abrev || typeof abrev !== 'string') {
    abrev = livro.nome || `livro_${index + 1}`
  }

  const nomeArquivo = abrev
    .toLowerCase()
    .replace(/\s+/g, '_')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  const data = {
    name: livro.nome || `Livro ${index + 1}`,
    chapters: livro.capitulos || []
  }

  fs.writeFileSync(
    path.join(pasta, `${nomeArquivo}.json`),
    JSON.stringify(data, null, 2)
  )

  console.log('Criado:', nomeArquivo)
})

console.log('✅ Bíblia dividida com sucesso!')