import fs from 'node:fs'
import path from 'node:path'

const inputPath = process.argv[2]
const outputPath = process.argv[3]

if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/normalizeData.mjs <inputCsv> <outputJson>')
  process.exit(1)
}

const csvText = fs.readFileSync(inputPath, 'utf8')
const rows = csvText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)

const dateRegex = /^\d{2}-\d{2}-\d{4}$/

function normalizeName(name) {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const matches = []
for (const row of rows) {
  const cols = row.split(',').map((c) => c.trim())
  if (!dateRegex.test(cols[0])) continue

  const [dd, mm, yyyy] = cols[0].split('-')
  const isoDate = `${yyyy}-${mm}-${dd}`
  const winnerRaw = cols[1] || ''
  if (!winnerRaw) continue

  matches.push({
    date: isoDate,
    winner: normalizeName(winnerRaw),
    source: 'csv-import',
  })
}

matches.sort((a, b) => a.date.localeCompare(b.date))

const uniqueByDate = new Map()
for (const match of matches) uniqueByDate.set(match.date, match)

const normalized = {
  generatedAt: new Date().toISOString(),
  totalMatches: uniqueByDate.size,
  matches: [...uniqueByDate.values()],
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2) + '\n')

console.log(`Normalized ${normalized.totalMatches} matches -> ${outputPath}`)
