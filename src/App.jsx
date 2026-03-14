import { useMemo, useState } from 'react'
import matchesData from './data/matches.json'
import './App.css'

function computeLeaderboard(matches) {
  const counts = new Map()
  for (const match of matches) {
    counts.set(match.winner, (counts.get(match.winner) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([name, wins]) => ({ name, wins }))
    .sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name))
}

const matches = matchesData.matches ?? []

function App() {
  const [query, setQuery] = useState('')

  const sortedDesc = useMemo(
    () => [...matches].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  )
  const leaderboard = useMemo(() => computeLeaderboard(matches), [])

  const filteredHistory = sortedDesc.filter((m) =>
    m.winner.toLowerCase().includes(query.toLowerCase()),
  )

  const topWinner = leaderboard[0]
  const uniqueWinners = leaderboard.length

  return (
    <main className="app-shell">
      <header className="header">
        <h1>Tiger5 MOTM Tracker</h1>
        <p>Man of the Match leaderboard and history</p>
      </header>

      <section className="stats-grid">
        <article className="card stat">
          <span>Total Matches</span>
          <strong>{matchesData.totalMatches}</strong>
        </article>
        <article className="card stat">
          <span>Unique Winners</span>
          <strong>{uniqueWinners}</strong>
        </article>
        <article className="card stat">
          <span>Top Winner</span>
          <strong>
            {topWinner ? `${topWinner.name} (${topWinner.wins})` : '—'}
          </strong>
        </article>
      </section>

      <section className="grid-two">
        <article className="card">
          <h2>Leaderboard</h2>
          <ol className="leaderboard">
            {leaderboard.map((row) => (
              <li key={row.name}>
                <span>{row.name}</span>
                <strong>{row.wins}</strong>
              </li>
            ))}
          </ol>
        </article>

        <article className="card">
          <div className="history-head">
            <h2>Recent Winners</h2>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name"
              aria-label="Filter history by winner"
            />
          </div>
          <ul className="history">
            {filteredHistory.map((m) => (
              <li key={m.date}>
                <div>
                  <span>{m.winner}</span>
                  <small>{m.date}</small>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  )
}

export default App
