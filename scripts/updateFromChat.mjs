import fs from 'node:fs'

const dataPath = process.argv[2]
const updateText = process.argv.slice(3).join(' ').trim()

if (!dataPath || !updateText) {
  console.error('Usage: node scripts/updateFromChat.mjs <dataJsonPath> "today\'s man of the match is <name>"')
  process.exit(1)
}

const patterns = [
  /today'?s\s+man\s+of\s+the\s+match\s+is\s+(.+)$/i,
  /motm\s+is\s+(.+)$/i,
]

let name = null
for (const pattern of patterns) {
  const m = updateText.match(pattern)
  if (m?.[1]) {
    name = m[1].trim()
    break
  }
}

if (!name) {
  console.error('Could not parse winner name from update text.')
  process.exit(2)
}

name = name
  .replace(/[.!?,;:]+$/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()
  .replace(/\b\w/g, (c) => c.toUpperCase())

if (!name) {
  console.error('Winner name is empty after parsing.')
  process.exit(2)
}

const todayIso = new Date().toISOString().slice(0, 10)
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
if (!Array.isArray(data.matches)) data.matches = []

const existingIdx = data.matches.findIndex((m) => m.date === todayIso)
const entry = {
  date: todayIso,
  winner: name,
  source: 'chat-update',
  updatedAt: new Date().toISOString(),
}

if (existingIdx >= 0) {
  data.matches[existingIdx] = { ...data.matches[existingIdx], ...entry }
  console.log(`Updated existing winner for ${todayIso} -> ${name}`)
} else {
  data.matches.push(entry)
  console.log(`Added winner for ${todayIso} -> ${name}`)
}

data.matches.sort((a, b) => a.date.localeCompare(b.date))
data.totalMatches = new Set(data.matches.map((m) => m.date)).size
data.generatedAt = new Date().toISOString()

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n')
