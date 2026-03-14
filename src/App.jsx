import { useEffect, useMemo, useState } from 'react'
import matchesData from './data/matches.json'
import avatarMap from './data/avatarMap.json'
import './App.css'

const THEME_KEY = 'motm-theme'
const WHATSAPP_INVITE_LINK =
  'https://chat.whatsapp.com/KVHbjabM7dJ8KJ5DyQARHg?mode=gi_t'
const COVER_IMAGE_PATH = '/cover/tiger5-cover.jpg'

const PRESETS = [
  { id: 'all', label: 'All Time' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'last3Months', label: 'Last 3 Months' },
  { id: 'thisYear', label: 'This Year' },
]

function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('')
}

function normalizeName(name) {
  return name.trim().toLowerCase()
}

function getAvatarPath(match) {
  if (!match) return null

  const byDate = avatarMap.byDate?.[match.date]
  if (byDate) return `/avatars/${byDate}`

  const fallbackName = Object.entries(avatarMap.byWinner ?? {}).find(
    ([winner]) => normalizeName(winner) === normalizeName(match.winner),
  )

  return fallbackName ? `/avatars/${fallbackName[1]}` : null
}

function computeLeaderboard(matches) {
  const winsByPlayer = new Map()
  for (const match of matches) {
    winsByPlayer.set(match.winner, (winsByPlayer.get(match.winner) ?? 0) + 1)
  }

  return [...winsByPlayer.entries()]
    .map(([name, wins]) => ({ name, wins }))
    .sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name))
}

function computeLongestStreak(matches) {
  if (!matches.length) return { player: '—', count: 0 }

  let best = { player: matches[0].winner, count: 1 }
  let current = { player: matches[0].winner, count: 1 }

  for (let i = 1; i < matches.length; i += 1) {
    if (matches[i].winner === current.player) {
      current.count += 1
    } else {
      current = { player: matches[i].winner, count: 1 }
    }

    if (current.count > best.count) best = { ...current }
  }

  return best
}

function isInPreset(dateStr, preset) {
  if (preset === 'all') return true

  const date = new Date(`${dateStr}T00:00:00Z`)
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()

  if (preset === 'thisMonth') {
    return date.getUTCFullYear() === year && date.getUTCMonth() === month
  }

  if (preset === 'thisYear') {
    return date.getUTCFullYear() === year
  }

  if (preset === 'last3Months') {
    const start = new Date(Date.UTC(year, month - 2, 1))
    return date >= start
  }

  return true
}

const allMatches = (matchesData.matches ?? []).slice()

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? 'light')
  const [selectedPlayer, setSelectedPlayer] = useState('all')
  const [preset, setPreset] = useState('all')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const sortedAsc = useMemo(
    () => [...allMatches].sort((a, b) => a.date.localeCompare(b.date)),
    [],
  )

  const playerOptions = useMemo(
    () => [...new Set(allMatches.map((match) => match.winner))].sort(),
    [],
  )

  const filteredMatches = useMemo(
    () =>
      sortedAsc.filter((match) => {
        const byPlayer = selectedPlayer === 'all' || match.winner === selectedPlayer
        const byPreset = isInPreset(match.date, preset)
        return byPlayer && byPreset
      }),
    [preset, selectedPlayer, sortedAsc],
  )

  const filteredDesc = useMemo(
    () => [...filteredMatches].sort((a, b) => b.date.localeCompare(a.date)),
    [filteredMatches],
  )

  const leaderboard = useMemo(() => computeLeaderboard(filteredMatches), [filteredMatches])

  const totalMatches = filteredMatches.length
  const uniqueWinners = leaderboard.length
  const topWinner = leaderboard[0]
  const latestWinner = filteredDesc[0]
  const longestStreak = useMemo(() => computeLongestStreak(filteredMatches), [filteredMatches])

  const resetFilters = () => {
    setSelectedPlayer('all')
    setPreset('all')
  }

  return (
    <main className="app-shell">
      <header className="topbar card">
        <div>
          <p className="eyebrow">Tiger5</p>
          <h1>MOTM Dashboard v2</h1>
        </div>
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        >
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      <section className="hero-grid">
        <article
          className="hero-card"
          style={{
            backgroundImage: `linear-gradient(120deg, rgba(9,12,20,.75), rgba(91,124,255,.45)), url(${COVER_IMAGE_PATH})`,
          }}
        >
          <span className="hero-badge">Tiger5 Football Community</span>
          <h2>Man of the Match Tracker</h2>
          <p>Live leaderboard, recent winners, and streak insights in one clean view.</p>
        </article>

        <article className="card whatsapp-card">
          <h3>Join Match Chat</h3>
          <p>Get schedule updates, MOTM announcements, and match-day banter on WhatsApp.</p>
          <a href={WHATSAPP_INVITE_LINK} target="_blank" rel="noreferrer" className="cta-btn">
            Join WhatsApp Group
          </a>
        </article>
      </section>

      <section className="kpi-strip">
        <article className="card stat-card">
          <span>Total Matches</span>
          <strong>{totalMatches}</strong>
        </article>
        <article className="card stat-card">
          <span>Unique Winners</span>
          <strong>{uniqueWinners}</strong>
        </article>
        <article className="card stat-card">
          <span>Top Winner</span>
          <strong>{topWinner ? `${topWinner.name} (${topWinner.wins})` : '—'}</strong>
        </article>
        <article className="card stat-card">
          <span>Best Streak</span>
          <strong>{longestStreak.count > 0 ? `${longestStreak.player} (${longestStreak.count})` : '—'}</strong>
        </article>
      </section>

      <section className="card filters-bar" aria-label="Filters">
        <div className="filter-group">
          <label htmlFor="player-filter">Player</label>
          <select
            id="player-filter"
            value={selectedPlayer}
            onChange={(event) => setSelectedPlayer(event.target.value)}
          >
            <option value="all">All Players</option>
            {playerOptions.map((player) => (
              <option key={player} value={player}>
                {player}
              </option>
            ))}
          </select>
        </div>

        <div className="preset-wrap" role="group" aria-label="Date presets">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`chip ${preset === item.id ? 'chip-active' : ''}`}
              onClick={() => setPreset(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button type="button" className="reset-btn" onClick={resetFilters}>
          Reset
        </button>
      </section>

      <section className="content-grid">
        <article className="card">
          <h3>Leaderboard</h3>
          {leaderboard.length === 0 ? (
            <p className="empty">No data for selected filters.</p>
          ) : (
            <ol className="leaderboard-list">
              {leaderboard.map((row, index) => (
                <li key={row.name}>
                  <div className="rank-pill">#{index + 1}</div>
                  <span className="name">{row.name}</span>
                  <strong className="wins">{row.wins} wins</strong>
                </li>
              ))}
            </ol>
          )}
        </article>

        <article className="card">
          <h3>Recent Winners Timeline</h3>
          {latestWinner ? (
            <p className="latest-winner">
              Latest: <strong>{latestWinner.winner}</strong> on {formatDate(latestWinner.date)}
            </p>
          ) : null}

          {filteredDesc.length === 0 ? (
            <p className="empty">No match history in this range.</p>
          ) : (
            <ul className="history-list">
              {filteredDesc.map((match) => {
                const avatar = getAvatarPath(match)
                return (
                  <li key={`${match.date}-${match.winner}`}>
                    {avatar ? (
                      <img src={avatar} alt={match.winner} className="avatar" loading="lazy" />
                    ) : (
                      <div className="avatar placeholder">{getInitials(match.winner)}</div>
                    )}
                    <div>
                      <p>{match.winner}</p>
                      <small>{formatDate(match.date)}</small>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </article>
      </section>
    </main>
  )
}

export default App
