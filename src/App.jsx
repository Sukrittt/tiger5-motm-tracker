import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import matchesData from './data/matches.json'
import avatarMap from './data/avatarMap.json'
import './App.css'

const COLORS = ['#5b7cff', '#ff6b6b', '#51cf66', '#fcc419', '#cc5de8', '#20c997', '#ff922b', '#845ef7']

const THEME_KEY = 'motm-theme'
const WHATSAPP_INVITE_LINK =
  'https://chat.whatsapp.com/KVHbjabM7dJ8KJ5DyQARHg?mode=gi_t'
const COVER_IMAGE_PATH = '/cover/tiger5-cover.jpg'
const VENUE_MAP_LINK = 'https://maps.app.goo.gl/qcWArjBy2LhrnYZb7'

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

  return getAvatarPathByName(match.winner)
}

function getAvatarPathByName(name) {
  if (!name) return null

  const fallbackName = Object.entries(avatarMap.byWinner ?? {}).find(
    ([winner]) => normalizeName(winner) === normalizeName(name),
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

function computeStatLeaderboard(matches, field) {
  const totals = new Map()
  for (const match of matches) {
    for (const entry of match[field] ?? []) {
      totals.set(entry.player, (totals.get(entry.player) ?? 0) + entry.count)
    }
  }
  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
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

function computeRisingStar(matches) {
  if (!matches.length) return null
  const seen = new Set()
  let lastNewWinner = null
  for (const match of matches) {
    if (!seen.has(match.winner)) {
      lastNewWinner = { name: match.winner, date: match.date }
      seen.add(match.winner)
    }
  }
  return lastNewWinner
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

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
)

function CumulativeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const sorted = [...payload].filter((p) => p.value > 0).sort((a, b) => b.value - a.value)
  return (
    <div className="cumulative-tooltip">
      <p className="cumulative-tooltip-date">{formatDate(label)}</p>
      <ul className="cumulative-tooltip-list">
        {sorted.map((entry) => (
          <li key={entry.dataKey}>
            <span className="cumulative-tooltip-dot" style={{ background: entry.color }} />
            <span className="cumulative-tooltip-name">{entry.dataKey}</span>
            <span className="cumulative-tooltip-value">{entry.value} {entry.value === 1 ? 'win' : 'wins'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const allMatches = (matchesData.matches ?? []).slice()

function AvatarButton({ src, name, initials, className, onClick }) {
  return (
    <button type="button" className="avatar-btn" onClick={onClick} aria-label={`View ${name}`}>
      {src ? (
        <img src={src} alt={name} className={className} loading="lazy" />
      ) : (
        <div className={`${className} placeholder`}>{initials}</div>
      )}
    </button>
  )
}

function InfoModal({ onClose }) {
  return (
    <div className="avatar-modal-backdrop" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal-header">
          <h3>Tiger5 Community Rules</h3>
          <button type="button" className="avatar-modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="info-modal-body">
        <div className="info-section">
          <h4>📋 Slot Booking</h4>
          <p>{`Slots open every week on Monday evening.\nEach session has a max of 14 players (7v7).\nBook your slot by confirming in the WhatsApp group.\nFirst come, first served — no reservations.\nIf you book and can't make it, cancel ASAP so someone else can join.`}</p>
        </div>

        <div className="info-section">
          <h4>❌ Slot Cancellations</h4>
          <p>{`Cancel at least 4 hours before the game.\nRepeated last-minute cancellations (less than 1 hour) may result in a temporary booking ban.\nIf you no-show without notice twice, you'll be deprioritised for future slots.`}</p>
        </div>

        <div className="info-section">
          <h4>⏳ Waitlist</h4>
          <p>{`If 14 slots are full, you can join the waitlist.\nWaitlisted players get priority if someone cancels.\nWaitlist order is based on when you messaged the group.`}</p>
        </div>

        <div className="info-section">
          <h4>🌧️ Weather</h4>
          <p>{`Games are ON unless there's heavy rain or a thunderstorm warning.\nThe admin will post a weather update 2 hours before the game.\nIf cancelled due to weather, everyone's slot carries over to the next session.`}</p>
        </div>

        <div className="info-section">
          <h4>📍 Reaching the Venue</h4>
          <p>{`The venue is at Tiger5 Football Arena.\nParking is available on-site — arrive 10–15 mins early.\nUse the Google Maps link below for directions.`}</p>
        </div>

        <div className="info-section">
          <h4>⚽ Game Rules</h4>
          <p>{`7-a-side format, 2 halves of 25 minutes each.\nNo slide tackles.\nGoalkeeper rotation every half unless agreed otherwise.\nMan of the Match (MOTM) is voted by players after the game.\nRespect the ref's call — even if there's no ref, play fair.`}</p>
        </div>
        </div>

        <div className="info-actions">
          <a href={WHATSAPP_INVITE_LINK} target="_blank" rel="noreferrer" className="cta-btn">
            <WhatsAppIcon />
            Join WhatsApp Group
          </a>
          <a href={VENUE_MAP_LINK} target="_blank" rel="noreferrer" className="cta-btn info-map-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            View Location
          </a>
        </div>
      </div>
    </div>
  )
}

function AvatarModal({ player, onClose }) {
  if (!player) return null
  return (
    <div className="avatar-modal-backdrop" onClick={onClose}>
      <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="avatar-modal-close" onClick={onClose} aria-label="Close">&times;</button>
        {player.avatarSrc ? (
          <img src={player.avatarSrc} alt={player.name} />
        ) : (
          <div className="placeholder-lg">{getInitials(player.name)}</div>
        )}
        <p>{player.name}</p>
      </div>
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? 'dark')
  const [selectedPlayer, setSelectedPlayer] = useState('all')
  const [preset, setPreset] = useState('all')
  const [viewingPlayer, setViewingPlayer] = useState(null)
  const [showInfo, setShowInfo] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('motm')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const sortedAsc = useMemo(
    () => [...allMatches].sort((a, b) => a.date.localeCompare(b.date)),
    [],
  )

  const playerOptions = useMemo(() => {
    const names = new Set()
    for (const match of allMatches) {
      names.add(match.winner)
      for (const g of match.goals ?? []) names.add(g.player)
      for (const a of match.assists ?? []) names.add(a.player)
    }
    return [...names].sort()
  }, [])

  const filteredMatches = useMemo(
    () =>
      sortedAsc.filter((match) => {
        const byPlayer = selectedPlayer === 'all' || match.winner === selectedPlayer
        const byPreset = isInPreset(match.date, preset)
        return byPlayer && byPreset
      }),
    [preset, selectedPlayer, sortedAsc],
  )

  const filteredMatchesForStats = useMemo(
    () =>
      sortedAsc.filter((match) => {
        const byPreset = isInPreset(match.date, preset)
        if (!byPreset) return false
        if (selectedPlayer === 'all') return true
        const inGoals = (match.goals ?? []).some((g) => g.player === selectedPlayer)
        const inAssists = (match.assists ?? []).some((a) => a.player === selectedPlayer)
        return inGoals || inAssists
      }),
    [preset, selectedPlayer, sortedAsc],
  )

  const filteredDesc = useMemo(
    () => [...filteredMatches].sort((a, b) => b.date.localeCompare(a.date)),
    [filteredMatches],
  )

  const leaderboard = useMemo(() => computeLeaderboard(filteredMatches), [filteredMatches])
  const goalLeaderboard = useMemo(() => computeStatLeaderboard(filteredMatchesForStats, 'goals'), [filteredMatchesForStats])
  const assistLeaderboard = useMemo(() => computeStatLeaderboard(filteredMatchesForStats, 'assists'), [filteredMatchesForStats])

  const contributionLeaderboard = useMemo(() => {
    const totals = new Map()
    for (const match of filteredMatchesForStats) {
      for (const entry of match.goals ?? []) {
        const prev = totals.get(entry.player) ?? { goals: 0, assists: 0 }
        prev.goals += entry.count
        totals.set(entry.player, prev)
      }
      for (const entry of match.assists ?? []) {
        const prev = totals.get(entry.player) ?? { goals: 0, assists: 0 }
        prev.assists += entry.count
        totals.set(entry.player, prev)
      }
    }
    return [...totals.entries()]
      .map(([name, { goals, assists }]) => ({ name, goals, assists, total: goals + assists }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  }, [filteredMatchesForStats])

  const topScorer = goalLeaderboard[0] ?? null
  const topAssister = assistLeaderboard[0] ?? null
  const mostVersatile = contributionLeaderboard[0] ?? null

  const totalMatches = filteredMatches.length
  const uniqueWinners = leaderboard.length
  const topWinner = leaderboard[0]
  const latestWinner = filteredDesc[0]
  const longestStreak = useMemo(() => computeLongestStreak(filteredMatches), [filteredMatches])
  const risingStar = useMemo(() => computeRisingStar(filteredMatches), [filteredMatches])
  const maxWins = topWinner?.wins ?? 1
  const playerNames = leaderboard.map((r) => r.name)

  const cumulativeData = useMemo(() => {
    const totals = {}
    return filteredMatches.map((m) => {
      totals[m.winner] = (totals[m.winner] ?? 0) + 1
      return { date: m.date, ...totals }
    })
  }, [filteredMatches])

  const resetFilters = () => {
    setSelectedPlayer('all')
    setPreset('all')
  }

  const openAvatar = (name, avatarSrc) => setViewingPlayer({ name, avatarSrc })

  return (
    <main className="app-shell">
      <AvatarModal player={viewingPlayer} onClose={() => setViewingPlayer(null)} />
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}

      <header className="topbar card">
        <div>
          <p className="eyebrow">Tiger5</p>
          <h1>MOTM Dashboard v2</h1>
          <span className="last-updated last-updated-mobile">
            Updated {new Date(matchesData.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="topbar-right">
          <span className="last-updated last-updated-desktop">
            Updated {new Date(matchesData.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <section className="hero-grid">
        <article
          className="hero-card"
          style={{
            backgroundImage: `linear-gradient(120deg, rgba(9,12,20,.75), rgba(91,124,255,.45)), url(${COVER_IMAGE_PATH})`,
          }}
        >
          <button type="button" className="info-btn" onClick={() => setShowInfo(true)} aria-label="Community rules & info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
          <span className="hero-badge">Tiger5 Football Community</span>
          <h2>Man of the Match Tracker</h2>
          <p>Live leaderboard, recent winners, and streak insights in one clean view.</p>
        </article>

        <article className="card whatsapp-card">
          <h3>Join Match Chat</h3>
          <p>Get schedule updates, MOTM announcements, and match-day banter on WhatsApp.</p>
          <a href={WHATSAPP_INVITE_LINK} target="_blank" rel="noreferrer" className="cta-btn">
            <WhatsAppIcon />
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
          <span>Most Recent Winner</span>
          <strong>{latestWinner?.winner ?? '—'}</strong>
        </article>
        <article className="card stat-card">
          <span>Longest Streak</span>
          <strong>{longestStreak.count > 0 ? `${longestStreak.player} (${longestStreak.count})` : '—'}</strong>
        </article>
        <article className="card stat-card">
          <span>Rising Star</span>
          <strong>{risingStar?.name ?? '—'}</strong>
        </article>
      </section>

      <section className={`card filters-bar ${showFilters ? 'filters-open' : ''}`} aria-label="Filters">
        <button type="button" className="filters-toggle" onClick={() => setShowFilters((v) => !v)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
          {(selectedPlayer !== 'all' || preset !== 'all') && <span className="filters-badge" />}
          <svg className="filters-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div className="filters-content">
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
        </div>
      </section>

      <div className="section-tabs">
        <button type="button" className={`tab ${activeTab === 'motm' ? 'tab-active' : ''}`} onClick={() => setActiveTab('motm')}>MOTM</button>
        <button type="button" className={`tab ${activeTab === 'goals' ? 'tab-active' : ''}`} onClick={() => setActiveTab('goals')}>Goals</button>
        <button type="button" className={`tab ${activeTab === 'assists' ? 'tab-active' : ''}`} onClick={() => setActiveTab('assists')}>Assists</button>
        <button type="button" className={`tab ${activeTab === 'ga' ? 'tab-active' : ''}`} onClick={() => setActiveTab('ga')}>G/A</button>
      </div>

      {activeTab === 'motm' && (
      <section className="content-grid">
        <article className="card">
          <h3>Leaderboard</h3>
          {leaderboard.length === 0 ? (
            <p className="empty">No data for selected filters.</p>
          ) : (
            <ol className="leaderboard-list">
              {leaderboard.map((row, index) => {
                const avatar = getAvatarPathByName(row.name)
                const isMotm =
                  latestWinner &&
                  normalizeName(latestWinner.winner) === normalizeName(row.name)
                const avatarClass = `avatar leaderboard-avatar${isMotm ? ' motm-avatar' : ''}`

                return (
                  <li key={row.name}>
                    <div className="rank-pill">#{index + 1}</div>
                    <AvatarButton
                      src={avatar}
                      name={row.name}
                      initials={getInitials(row.name)}
                      className={avatarClass}
                      onClick={() => openAvatar(row.name, avatar)}
                    />
                    <span className="name">{row.name}</span>
                    <strong className="wins">{row.wins} wins</strong>
                  </li>
                )
              })}
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
                    <AvatarButton
                      src={avatar}
                      name={match.winner}
                      initials={getInitials(match.winner)}
                      className="avatar"
                      onClick={() => openAvatar(match.winner, avatar)}
                    />
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
      )}

      {activeTab === 'goals' && (
      <section className="content-grid">
        <article className="card">
          <h3>Goals Leaderboard</h3>
          {goalLeaderboard.length === 0 ? (
            <p className="empty">No goals data for selected filters.</p>
          ) : (
            <ol className="leaderboard-list">
              {goalLeaderboard.map((row, index) => {
                const avatar = getAvatarPathByName(row.name)
                return (
                  <li key={row.name}>
                    <div className="rank-pill">#{index + 1}</div>
                    <AvatarButton
                      src={avatar}
                      name={row.name}
                      initials={getInitials(row.name)}
                      className="avatar leaderboard-avatar"
                      onClick={() => openAvatar(row.name, avatar)}
                    />
                    <span className="name">{row.name}</span>
                    <strong className="wins">{row.total} {row.total === 1 ? 'goal' : 'goals'}</strong>
                  </li>
                )
              })}
            </ol>
          )}
        </article>

        <div className="right-stack">
          <article className="card">
            <h3>Goals Distribution</h3>
            {goalLeaderboard.length === 0 ? (
              <p className="empty">No data.</p>
            ) : (
              <ul className="bar-chart">
                {goalLeaderboard.map((row) => (
                  <li key={row.name}>
                    <span className="bar-label">{row.name}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(row.total / goalLeaderboard[0].total) * 100}%` }}
                      />
                    </div>
                    <span className="bar-count">{row.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="card top-performers">
            <h3>Top Performers</h3>
            <div className="top-performers-grid">
              <div className="top-performer-item">
                <span className="top-performer-label">Top Scorer</span>
                {topScorer ? <>
                  <AvatarButton
                    src={getAvatarPathByName(topScorer.name)}
                    name={topScorer.name}
                    initials={getInitials(topScorer.name)}
                    className="avatar top-performer-avatar"
                    onClick={() => openAvatar(topScorer.name, getAvatarPathByName(topScorer.name))}
                  />
                  <strong>{topScorer.name}</strong>
                  <span className="top-performer-stat">{topScorer.total} {topScorer.total === 1 ? 'goal' : 'goals'}</span>
                </> : <strong>—</strong>}
              </div>
              <div className="top-performer-item">
                <span className="top-performer-label">Top Assister</span>
                {topAssister ? <>
                  <AvatarButton
                    src={getAvatarPathByName(topAssister.name)}
                    name={topAssister.name}
                    initials={getInitials(topAssister.name)}
                    className="avatar top-performer-avatar"
                    onClick={() => openAvatar(topAssister.name, getAvatarPathByName(topAssister.name))}
                  />
                  <strong>{topAssister.name}</strong>
                  <span className="top-performer-stat">{topAssister.total} {topAssister.total === 1 ? 'assist' : 'assists'}</span>
                </> : <strong>—</strong>}
              </div>
              <div className="top-performer-item">
                <span className="top-performer-label">Most Versatile</span>
                {mostVersatile ? <>
                  <AvatarButton
                    src={getAvatarPathByName(mostVersatile.name)}
                    name={mostVersatile.name}
                    initials={getInitials(mostVersatile.name)}
                    className="avatar top-performer-avatar"
                    onClick={() => openAvatar(mostVersatile.name, getAvatarPathByName(mostVersatile.name))}
                  />
                  <strong>{mostVersatile.name}</strong>
                  <span className="top-performer-stat">{mostVersatile.total} G/A</span>
                </> : <strong>—</strong>}
              </div>
            </div>
          </article>
        </div>
      </section>
      )}

      {activeTab === 'assists' && (
      <section className="content-grid">
        <article className="card">
          <h3>Assists Leaderboard</h3>
          {assistLeaderboard.length === 0 ? (
            <p className="empty">No assists data for selected filters.</p>
          ) : (
            <ol className="leaderboard-list">
              {assistLeaderboard.map((row, index) => {
                const avatar = getAvatarPathByName(row.name)
                return (
                  <li key={row.name}>
                    <div className="rank-pill">#{index + 1}</div>
                    <AvatarButton
                      src={avatar}
                      name={row.name}
                      initials={getInitials(row.name)}
                      className="avatar leaderboard-avatar"
                      onClick={() => openAvatar(row.name, avatar)}
                    />
                    <span className="name">{row.name}</span>
                    <strong className="wins">{row.total} {row.total === 1 ? 'assist' : 'assists'}</strong>
                  </li>
                )
              })}
            </ol>
          )}
        </article>

        <div className="right-stack">
          <article className="card">
            <h3>Assists Distribution</h3>
            {assistLeaderboard.length === 0 ? (
              <p className="empty">No data.</p>
            ) : (
              <ul className="bar-chart">
                {assistLeaderboard.map((row) => (
                  <li key={row.name}>
                    <span className="bar-label">{row.name}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(row.total / assistLeaderboard[0].total) * 100}%` }}
                      />
                    </div>
                    <span className="bar-count">{row.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="card top-performers">
            <h3>Top Performers</h3>
            <div className="top-performers-grid">
              <div className="top-performer-item">
                <span className="top-performer-label">Top Scorer</span>
                {topScorer ? <>
                  <AvatarButton
                    src={getAvatarPathByName(topScorer.name)}
                    name={topScorer.name}
                    initials={getInitials(topScorer.name)}
                    className="avatar top-performer-avatar"
                    onClick={() => openAvatar(topScorer.name, getAvatarPathByName(topScorer.name))}
                  />
                  <strong>{topScorer.name}</strong>
                  <span className="top-performer-stat">{topScorer.total} {topScorer.total === 1 ? 'goal' : 'goals'}</span>
                </> : <strong>—</strong>}
              </div>
              <div className="top-performer-item">
                <span className="top-performer-label">Top Assister</span>
                {topAssister ? <>
                  <AvatarButton
                    src={getAvatarPathByName(topAssister.name)}
                    name={topAssister.name}
                    initials={getInitials(topAssister.name)}
                    className="avatar top-performer-avatar"
                    onClick={() => openAvatar(topAssister.name, getAvatarPathByName(topAssister.name))}
                  />
                  <strong>{topAssister.name}</strong>
                  <span className="top-performer-stat">{topAssister.total} {topAssister.total === 1 ? 'assist' : 'assists'}</span>
                </> : <strong>—</strong>}
              </div>
              <div className="top-performer-item">
                <span className="top-performer-label">Most Versatile</span>
                {mostVersatile ? <>
                  <AvatarButton
                    src={getAvatarPathByName(mostVersatile.name)}
                    name={mostVersatile.name}
                    initials={getInitials(mostVersatile.name)}
                    className="avatar top-performer-avatar"
                    onClick={() => openAvatar(mostVersatile.name, getAvatarPathByName(mostVersatile.name))}
                  />
                  <strong>{mostVersatile.name}</strong>
                  <span className="top-performer-stat">{mostVersatile.total} G/A</span>
                </> : <strong>—</strong>}
              </div>
            </div>
          </article>
        </div>
      </section>
      )}

      {activeTab === 'ga' && (
      <section className="content-grid">
        <article className="card">
          <h3>G/A Leaderboard</h3>
          {contributionLeaderboard.length === 0 ? (
            <p className="empty">No data for selected filters.</p>
          ) : (
            <ol className="leaderboard-list">
              {contributionLeaderboard.map((row, index) => {
                const avatar = getAvatarPathByName(row.name)
                return (
                  <li key={row.name}>
                    <div className="rank-pill">#{index + 1}</div>
                    <AvatarButton
                      src={avatar}
                      name={row.name}
                      initials={getInitials(row.name)}
                      className="avatar leaderboard-avatar"
                      onClick={() => openAvatar(row.name, avatar)}
                    />
                    <span className="name">{row.name}</span>
                    <strong className="wins">{row.total} G/A</strong>
                  </li>
                )
              })}
            </ol>
          )}
        </article>

        <div className="right-stack">
          <article className="card">
            <h3>G/A Distribution</h3>
            {contributionLeaderboard.length === 0 ? (
              <p className="empty">No data.</p>
            ) : (
              <ul className="bar-chart">
                {contributionLeaderboard.map((row) => (
                  <li key={row.name}>
                    <span className="bar-label">{row.name}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(row.total / contributionLeaderboard[0].total) * 100}%` }}
                      />
                    </div>
                    <span className="bar-count">{row.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="card">
            <h3>Goals vs Assists Breakdown</h3>
            <div className="bar-legend">
              <span className="legend-item"><span className="legend-dot legend-dot-goals" /> Goals</span>
              <span className="legend-item"><span className="legend-dot legend-dot-assists" /> Assists</span>
            </div>
            {contributionLeaderboard.length === 0 ? (
              <p className="empty">No data.</p>
            ) : (
              <ul className="stacked-bar-chart">
                {contributionLeaderboard.map((row) => (
                  <li key={row.name}>
                    <span className="bar-label">{row.name}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill-goals"
                        style={{ width: `${(row.goals / contributionLeaderboard[0].total) * 100}%` }}
                      />
                      <div
                        className="bar-fill-assists"
                        style={{ width: `${(row.assists / contributionLeaderboard[0].total) * 100}%` }}
                      />
                    </div>
                    <span className="bar-count">{row.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </section>
      )}

      <p className="section-label" id="insights">Insights</p>
      <section className="insights-grid">
        <article className="card chart-card cumulative-card">
          <h3>Cumulative Wins</h3>
          <p className="chart-subtitle">Win progression over time</p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={cumulativeData} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--line)" strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--muted)' }}
                axisLine={{ stroke: 'var(--line)' }}
                tickLine={false}
                tickFormatter={(d) => { const p = d.split('-'); return `${p[2]}/${p[1]}` }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CumulativeTooltip />} cursor={{ stroke: 'var(--muted)', strokeDasharray: '4 4', strokeOpacity: 0.4 }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
              />
              {playerNames.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={COLORS[i % COLORS.length]}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--surface)' }}
                  strokeWidth={2.5}
                  animationDuration={800}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="card">
          <h3>Win Distribution</h3>
          {leaderboard.length === 0 ? (
            <p className="empty">No data.</p>
          ) : (
            <ul className="bar-chart">
              {leaderboard.map((row) => (
                <li key={row.name}>
                  <span className="bar-label">{row.name}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(row.wins / maxWins) * 100}%` }}
                    />
                  </div>
                  <span className="bar-count">{row.wins}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <button
        type="button"
        className="insights-fab"
        onClick={() => document.getElementById('insights')?.scrollIntoView({ behavior: 'smooth' })}
        aria-label="View Insights"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span>Insights</span>
      </button>
    </main>
  )
}

export default App
