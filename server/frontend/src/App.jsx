import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { motion } from 'motion/react'
import {
  Zap, LogIn, Server, Hash, Clock, Check, ChevronRight, ChevronLeft,
  ExternalLink, RefreshCw, AlertCircle, Shield, BarChart3,
  Loader2, FileText, Lock, RotateCcw, Settings, Activity,
  Swords, Pickaxe, Compass, Sparkles, Download, MessageSquare,
  Users, Globe, ArrowRight, Star, Terminal, Languages
} from 'lucide-react'
import BlurText from './BlurText'
import { translations } from './i18n'

// Language Context
const LangContext = createContext('de')
const useLang = () => useContext(LangContext)

const steps = { de: ['Anmelden', 'Konfigurieren', 'Fertig'], en: ['Login', 'Configure', 'Done'] }

function Router({ lang, setLang }) {
  const path = window.location.pathname
  const params = new URLSearchParams(window.location.search)
  const hasServerId = params.has('server_id')
  const isConfigure = path.includes('/configure')

  if (path === '/privacy') return <PrivacyPage />
  if (path === '/terms') return <TermsPage />
  if (path === '/status') return <StatusPage />
  if (path === '/' && !hasServerId && !isConfigure) return <LandingPage />
  return <SetupWizard lang={lang} setLang={setLang} />
}

export default function App() {
  const [lang, setLang] = useState('en')

  return (
    <LangContext.Provider value={lang}>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden" style={{ background: 'var(--c-bg)' }}>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px]" style={{ background: 'color-mix(in srgb, var(--c-action) 8%, transparent)' }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: 'color-mix(in srgb, var(--c-action) 6%, transparent)' }} />
        </div>
        <div className="flex-1 flex items-center justify-center w-full">
          <Router lang={lang} setLang={setLang} />
        </div>
        <Footer lang={lang} />
      </div>
    </LangContext.Provider>
  )
}

function Footer({ lang }) {
  const path = window.location.pathname
  if (path === '/privacy' || path === '/terms') return null
  const t = translations[lang]?.footer || translations.de.footer

  return (
    <footer className="relative z-10 w-full max-w-[540px] py-4 fade-in">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <a href="https://help.mcstatsbot.tech" className="text-[11px] font-medium px-3 py-1.5 rounded-full glass-btn flex items-center gap-1.5 transition-all hover:scale-[1.02]" style={{ color: 'var(--c-content-muted)' }}>
          <ExternalLink className="w-3 h-3" /> Help
        </a>
        <a href="/status" className="text-[11px] font-medium px-3 py-1.5 rounded-full glass-btn flex items-center gap-1.5 transition-all hover:scale-[1.02]" style={{ color: 'var(--c-content-muted)' }}>
          <Activity className="w-3 h-3" /> {t.status}
        </a>
        <a href="/terms" className="text-[11px] font-medium px-3 py-1.5 rounded-full glass-btn flex items-center gap-1.5 transition-all hover:scale-[1.02]" style={{ color: 'var(--c-content-muted)' }}>
          <FileText className="w-3 h-3" /> {t.terms}
        </a>
        <a href="/privacy" className="text-[11px] font-medium px-3 py-1.5 rounded-full glass-btn flex items-center gap-1.5 transition-all hover:scale-[1.02]" style={{ color: 'var(--c-content-muted)' }}>
          <Lock className="w-3 h-3" /> {t.privacy}
        </a>
      </div>
    </footer>
  )
}

function LandingPage() {
  const lang = useLang()
  const tl = translations[lang]?.landing || translations.en.landing

  const featureIcons = [
    <BarChart3 className="w-5 h-5" />,
    <Users className="w-5 h-5" />,
    <Swords className="w-5 h-5" />,
    <Pickaxe className="w-5 h-5" />,
    <Compass className="w-5 h-5" />,
    <Globe className="w-5 h-5" />,
  ]

  const platforms = [
    { name: 'Paper', version: '1.20+', color: '#4A90D9' },
    { name: 'Spigot', version: '1.20+', color: '#F7981D' },
    { name: 'Bukkit', version: '1.20+', color: '#6B8E23' },
    { name: 'Purpur', version: '1.20+', color: '#9B59B6' },
  ]

  const commands = [
    { cmd: '/stats', desc: lang === 'de' ? 'Zeigt die aktuellen Server-Statistiken' : 'Shows current server statistics' },
    { cmd: '/online', desc: lang === 'de' ? 'Zeigt alle online Spieler' : 'Shows all online players' },
    { cmd: '/playerstats [name]', desc: lang === 'de' ? 'Zeigt Statistiken für einen bestimmten Spieler' : 'Shows statistics for a specific player' },
  ]

  return (
    <div className="relative w-full max-w-[720px] z-10 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8, bounce: 0.4 }}
          className="glass-sm inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
          style={{ color: 'var(--c-action)' }}
        >
          <Zap className="w-10 h-10" />
        </motion.div>

        <BlurText
          text="MCStatsBot"
          delay={80}
          animateBy="letters"
          direction="top"
          className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] mb-3 justify-center"
          style={{ color: 'var(--c-content)' }}
        />

        <BlurText
          text={tl.subtitle1}
          delay={40}
          animateBy="words"
          direction="bottom"
          className="text-base sm:text-lg max-w-md mx-auto mb-2"
          style={{ color: 'var(--c-content-muted)' }}
        />

        <BlurText
          text={tl.subtitle2}
          delay={60}
          animateBy="words"
          direction="bottom"
          className="text-base sm:text-lg max-w-md mx-auto mb-6"
          style={{ color: 'var(--c-content-muted)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          <a href="/api/update/download"
            className="h-11 px-5 rounded-full font-semibold text-[14px] flex items-center gap-2 transition-all cursor-pointer active:scale-[0.97] text-white hover:scale-105"
            style={{ background: 'var(--c-action)' }}>
            <Download className="w-4 h-4" /> {tl.download}
          </a>
          <a href="https://github.com/panie18/MCStatsBot" target="_blank" rel="noopener noreferrer"
            className="h-11 px-5 rounded-full font-semibold text-[14px] flex items-center gap-2 transition-all cursor-pointer active:scale-[0.97] glass-btn hover:scale-105"
            style={{ color: 'var(--c-content)' }}>
            <GithubIcon /> GitHub
          </a>
          <a href="https://www.spigotmc.org/resources/mcstatsbot.134361/" target="_blank" rel="noopener noreferrer"
            className="h-11 px-5 rounded-full font-semibold text-[14px] flex items-center gap-2 transition-all cursor-pointer active:scale-[0.97] glass-btn hover:scale-105"
            style={{ color: 'var(--c-content)' }}>
            <SpigotIcon /> SpigotMC
          </a>
        </motion.div>
      </div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="glass rounded-3xl p-6 mb-6"
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--c-content)' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'var(--c-action)' }} /> {tl.features}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tl.featuresData.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="glass-sm rounded-2xl p-4 flex items-start gap-3 hover:scale-[1.02] transition-transform"
            >
              <div className="shrink-0 mt-0.5" style={{ color: 'var(--c-action)' }}>{featureIcons[i]}</div>
              <div>
                <h3 className="text-[14px] font-semibold mb-0.5" style={{ color: 'var(--c-content)' }}>{f.title}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--c-content-muted)' }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Platforms */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="glass rounded-3xl p-6 mb-6"
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--c-content)' }}>
          <Server className="w-5 h-5" style={{ color: 'var(--c-action)' }} /> {tl.platforms}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {platforms.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4, type: 'spring' }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="glass-sm rounded-2xl p-4 text-center cursor-default"
            >
              <div className="text-[15px] font-bold mb-1" style={{ color: p.color }}>{p.name}</div>
              <div className="text-[11px]" style={{ color: 'var(--c-content-muted)' }}>{p.version}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="glass rounded-3xl p-6 mb-6"
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--c-content)' }}>
          <Terminal className="w-5 h-5" style={{ color: 'var(--c-action)' }} /> {tl.howItWorks}
        </h2>
        <div className="space-y-4">
          {tl.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="flex items-start gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[14px] font-bold text-white"
                style={{ background: 'var(--c-action)' }}
              >
                {i + 1}
              </motion.div>
              <div>
                <h3 className="text-[14px] font-semibold mb-0.5" style={{ color: 'var(--c-content)' }}>{step.title}</h3>
                <p className="text-[13px]" style={{ color: 'var(--c-content-muted)' }}>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Discord Commands */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="glass rounded-3xl p-6"
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--c-content)' }}>
          <MessageSquare className="w-5 h-5" style={{ color: 'var(--c-action)' }} /> Discord Commands
        </h2>
        <div className="space-y-2">
          {commands.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.02, x: 5 }}
              className="glass-sm rounded-xl p-3 flex items-center gap-3 cursor-default"
            >
              <code className="text-[13px] font-mono px-2 py-1 rounded-lg" style={{ background: 'color-mix(in srgb, var(--c-action) 15%, transparent)', color: 'var(--c-action)' }}>{c.cmd}</code>
              <span className="text-[13px]" style={{ color: 'var(--c-content-muted)' }}>{c.desc}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function SetupWizard({ lang, setLang }) {
  const params = new URLSearchParams(window.location.search)
  const serverId = params.get('server_id')
  const isConfigure = window.location.pathname.includes('/configure')

  const [currentStep, setCurrentStep] = useState(isConfigure ? 1 : 0)
  const [guilds, setGuilds] = useState([])
  const [channels, setChannels] = useState([])
  const [selectedGuild, setSelectedGuild] = useState(null)
  const [selectedChannel, setSelectedChannel] = useState('')
  const [reportTime, setReportTime] = useState('22:00')
  const [inviteUrl, setInviteUrl] = useState('')
  const [loading, setLoading] = useState(isConfigure) // Start loading if isConfigure
  const [error, setError] = useState('')
  const [savedConfig, setSavedConfig] = useState(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [serverInfo, setServerInfo] = useState(null)
  const [checkingServer, setCheckingServer] = useState(true)
  const [selectedSections, setSelectedSections] = useState(['overview', 'combat', 'mining', 'exploration', 'funfacts'])
  const [reportLang, setReportLang] = useState(lang)
  const [authFailed, setAuthFailed] = useState(false)
  const [channelsLoading, setChannelsLoading] = useState(false)
  const t = translations[lang]?.setup || translations.de.setup

  useEffect(() => {
    if (serverId && !isConfigure) {
      fetch(`/api/server-info?server_id=${serverId}`)
        .then(r => r.json())
        .then(data => {
          if (data.setup_complete) setServerInfo(data)
          setCheckingServer(false)
        })
        .catch(() => setCheckingServer(false))
    } else {
      setCheckingServer(false)
    }
  }, [serverId, isConfigure])

  useEffect(() => {
    if (isConfigure) {
      loadGuilds()
      loadInviteUrl()
    }
  }, [isConfigure])

  async function loadInviteUrl(retries = 3) {
    try {
      const r = await fetch('/auth/invite-url')
      const d = await r.json()
      if (d.url) { setInviteUrl(d.url); return }
    } catch {}
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000))
      return loadInviteUrl(retries - 1)
    }
  }

  async function loadGuilds(retries = 3) {
    setLoading(true)
    setError('')
    setAuthFailed(false)
    try {
      const res = await fetch('/auth/guilds')
      if (res.status === 401) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1500))
          return loadGuilds(retries - 1)
        }
        setAuthFailed(true)
        setLoading(false)
        return
      }
      if (res.status === 429) {
        setError(t.tooManyRequests)
        setLoading(false)
        return
      }
      const data = await res.json()
      setGuilds(data.guilds || [])
    } catch {
      setError(t.connectionFailed)
    }
    setLoading(false)
  }

  async function selectGuild(guild) {
    setSelectedGuild(guild)
    setSelectedChannel('')
    setChannels([])
    setChannelsLoading(true)
    try {
      const res = await fetch(`/auth/channels?guild_id=${guild.id}`)
      const data = await res.json()
      setChannels(data.channels || [])
    } catch {
      setError(t.channelsLoadFailed)
    }
    setChannelsLoading(false)
  }

  async function save() {
    if (!selectedGuild || !selectedChannel || !agreedToTerms) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/auth/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guild_id: selectedGuild.id,
          channel_id: selectedChannel,
          report_time: reportTime,
          report_sections: selectedSections.join(','),
          language: reportLang
        })
      })
      const data = await res.json()
      if (data.success) {
        const channel = channels.find(c => c.id === selectedChannel)
        setSavedConfig({
          guild: selectedGuild.name,
          channel: channel?.name || selectedChannel,
          time: reportTime,
          sections: selectedSections
        })
        setCurrentStep(2)
      } else {
        setError(data.error || t.saveError)
      }
    } catch {
      setError(t.connectionError)
    }
    setLoading(false)
  }

  function reconfigure() {
    setServerInfo(null)
    setCurrentStep(0)
  }

  function toggleSection(section, checked) {
    setSelectedSections(prev =>
      checked ? [...prev, section] : prev.filter(s => s !== section)
    )
  }

  const botGuilds = guilds.filter(g => g.botPresent)
  const noBotGuilds = guilds.filter(g => !g.botPresent)

  if (checkingServer) {
    return (
      <div className="relative w-full max-w-[480px] z-10">
        <div className="text-center py-20 fade-in">
          <div className="glass-sm inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ color: 'var(--c-action)' }}>
            <Zap className="w-7 h-7" />
          </div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] mb-3" style={{ color: 'var(--c-content)' }}>MCStatsBot</h1>
          <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: 'var(--c-action)' }} />
        </div>
      </div>
    )
  }

  if (serverInfo) {
    return (
      <div className="relative w-full max-w-[480px] z-10">
        <div className="text-center mb-8 slide-down">
          <div className="glass-sm inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ color: 'var(--c-action)' }}>
            <Zap className="w-7 h-7" />
          </div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]" style={{ color: 'var(--c-content)' }}>MCStatsBot</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--c-content-muted)' }}>Server-Dashboard</p>
        </div>

        <div className="glass rounded-3xl p-6 fade-in">
          <div className="text-center mb-5">
            <div className="glass-sm inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3">
              <Check className="w-5 h-5" style={{ color: 'var(--c-success)' }} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--c-content)' }}>{t.serverSetup}</h2>
            <p className="text-[13px] mt-1" style={{ color: 'var(--c-content-muted)' }}>{t.serverLinkedShort}</p>
          </div>

          <div className="glass-sm rounded-2xl divide-y overflow-hidden mb-4" style={{ borderColor: 'color-mix(in srgb, var(--c-light) 60%, transparent)' }}>
            <SummaryRow icon={<BarChart3 className="w-4 h-4" />} label="Server" value={serverInfo.server_name || 'Minecraft Server'} />
            {serverInfo.guild_name && <SummaryRow icon={<Server className="w-4 h-4" />} label="Discord" value={serverInfo.guild_name} />}
            {serverInfo.channel_name && <SummaryRow icon={<Hash className="w-4 h-4" />} label="Channel" value={`#${serverInfo.channel_name}`} />}
            <SummaryRow icon={<Clock className="w-4 h-4" />} label="Report" value={`${serverInfo.report_time || '22:00'} Uhr`} />
            <SummaryRow icon={<Settings className="w-4 h-4" />} label="Sektionen" value={`${(serverInfo.report_sections || 'overview,combat,mining,exploration,funfacts').split(',').length} aktiv`} />
          </div>

          <button
            onClick={reconfigure}
            className="w-full h-10 rounded-full font-medium text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.97] glass-btn"
            style={{ color: 'var(--c-content-muted)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t.reconfigure}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-[480px] z-10">
      {/* Language Selector */}
      <div className="absolute top-0 right-0 z-20">
        <div className="flex items-center gap-1 glass-sm rounded-full p-1">
          <button
            onClick={() => setLang('de')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${lang === 'de' ? 'bg-[var(--c-action)] text-white' : 'text-[var(--c-content-muted)] hover:text-[var(--c-content)]'}`}
          >
            DE
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${lang === 'en' ? 'bg-[var(--c-action)] text-white' : 'text-[var(--c-content-muted)] hover:text-[var(--c-content)]'}`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="text-center mb-8 slide-down">
        <div className="glass-sm inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ color: 'var(--c-action)' }}>
          <Zap className="w-7 h-7" />
        </div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em]" style={{ color: 'var(--c-content)' }}>MCStatsBot</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--c-content-muted)' }}>
          {lang === 'de' ? 'Verknüpfe deinen Server mit Discord' : 'Connect your server to Discord'}
        </p>
      </div>

      <div className="flex items-center gap-1.5 mb-6 px-2">
        {steps[lang].map((label, i) => (
          <div key={i} className="flex-1">
            <div className="h-[3px] rounded-full transition-all duration-500" style={{
              background: i < currentStep ? 'var(--c-success)' : i === currentStep ? 'var(--c-action)' : 'color-mix(in srgb, var(--c-dark) 10%, transparent)'
            }} />
            <p className="text-[10px] mt-1.5 text-center tracking-wide uppercase font-medium transition-colors" style={{
              color: i <= currentStep ? 'var(--c-content-muted)' : 'color-mix(in srgb, var(--c-dark) 25%, transparent)'
            }}>{label}</p>
          </div>
        ))}
      </div>

      {currentStep === 0 && (
        <div className="glass rounded-3xl p-6 fade-in" key="login">
          {!serverId ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--c-action)' }} />
              <p className="text-sm" style={{ color: 'var(--c-content-muted)' }}>{t.waitingForServer}</p>
              <p className="text-xs mt-1" style={{ color: 'color-mix(in srgb, var(--c-content-muted) 70%, transparent)' }}>{t.startPlugin}</p>
            </div>
          ) : (
            <>
              <StepHeader
                icon={<LogIn className="w-5 h-5" style={{ color: '#5865f2' }} />}
                title={t.loginWithDiscord}
                desc={t.loginDesc}
              />
              <a href={`/auth/login?server_id=${serverId}`} className="block">
                <button className="w-full h-11 rounded-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-semibold text-[14px] flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.97]">
                  <DiscordIcon />
                  Mit Discord anmelden
                </button>
              </a>
              <div className="glass-sm flex items-start gap-2.5 mt-4 p-3 rounded-2xl">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--c-action)' }} />
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--c-content-muted)' }}>
                  {t.securityNote}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {currentStep === 1 && (
        <div className="glass rounded-3xl p-6 fade-in" key="configure">
          <StepHeader
            icon={<BarChart3 className="w-5 h-5" style={{ color: 'var(--c-action)' }} />}
            title={t.serverChannel}
            desc={t.serverChannelDesc}
          />
          <div className="space-y-3">
            {authFailed ? (
              <div className="glass-sm p-4 rounded-2xl text-center">
                <AlertCircle className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--c-warning)' }} />
                <p className="text-sm mb-1" style={{ color: 'var(--c-content)' }}>{t.sessionFailed}</p>
                <p className="text-[12px] mb-3" style={{ color: 'var(--c-content-muted)' }}>{t.tryAgain}</p>
                <div className="flex items-center justify-center gap-2">
                  <Btn variant="accent" size="sm" onClick={() => loadGuilds(1)}><RefreshCw className="w-3.5 h-3.5" /> {t.retry}</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => setCurrentStep(0)}><LogIn className="w-3.5 h-3.5" /> {t.reLogin}</Btn>
                </div>
              </div>
            ) : loading && guilds.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--c-action)' }} />
              </div>
            ) : (
              <>
                {guilds.length === 0 && !loading && !authFailed && (
                  <div className="glass-sm p-4 rounded-2xl text-center">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--c-warning)' }} />
                    <p className="text-sm mb-3" style={{ color: 'var(--c-content-muted)' }}>{t.botNotOnServer}</p>
                    <div className="flex items-center justify-center gap-2">
                      {inviteUrl && (
                        <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                          <Btn variant="accent" size="sm"><ExternalLink className="w-3.5 h-3.5" /> {t.inviteBot}</Btn>
                        </a>
                      )}
                      <Btn variant="ghost" size="sm" onClick={() => loadGuilds(0)}><RefreshCw className="w-3.5 h-3.5" /> {t.refresh}</Btn>
                    </div>
                  </div>
                )}

                {botGuilds.length > 0 && (
                  <div className="space-y-2">
                    <Label icon={<Server className="w-3.5 h-3.5" />}>{t.discordServer}</Label>
                    {botGuilds.map(g => (
                      <GuildCard key={g.id} guild={g} selected={selectedGuild?.id === g.id} onClick={() => selectGuild(g)} />
                    ))}
                  </div>
                )}

                {guilds.length > 0 && botGuilds.length === 0 && (
                  <div className="glass-sm p-4 rounded-2xl text-center">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--c-warning)' }} />
                    <p className="text-sm mb-3" style={{ color: 'var(--c-content-muted)' }}>{t.botNotOnServer}</p>
                    <div className="flex items-center justify-center gap-2">
                      {inviteUrl ? (
                        <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                          <Btn variant="accent" size="sm"><ExternalLink className="w-3.5 h-3.5" /> {t.inviteBot}</Btn>
                        </a>
                      ) : (
                        <Btn variant="accent" size="sm" disabled><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t.inviteBot}</Btn>
                      )}
                      <Btn variant="ghost" size="sm" onClick={() => loadGuilds(0)}><RefreshCw className="w-3.5 h-3.5" /> {t.refresh}</Btn>
                    </div>
                  </div>
                )}

                {botGuilds.length > 0 && noBotGuilds.length > 0 && (
                  <div className="glass-sm flex items-center gap-2 p-2.5 rounded-2xl">
                    <p className="text-[11px] flex-1" style={{ color: 'var(--c-content-muted)' }}>{t.botNotHere}</p>
                    {inviteUrl && (
                      <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                        <Btn variant="ghost" size="xs"><ExternalLink className="w-3 h-3" /> {t.invite}</Btn>
                      </a>
                    )}
                  </div>
                )}

                {selectedGuild && channelsLoading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--c-action)' }} />
                  </div>
                )}

                {selectedGuild && !channelsLoading && channels.length > 0 && (
                  <div className="space-y-2 fade-in">
                    <Label icon={<Hash className="w-3.5 h-3.5" />}>{t.textChannel}</Label>
                    <select
                      value={selectedChannel}
                      onChange={e => setSelectedChannel(e.target.value)}
                      className="w-full h-10 px-3 rounded-full text-sm outline-none transition-colors appearance-none cursor-pointer"
                      style={{
                        background: 'color-mix(in srgb, var(--c-glass) 20%, transparent)',
                        backdropFilter: 'blur(8px) saturate(var(--saturation))',
                        WebkitBackdropFilter: 'blur(8px) saturate(var(--saturation))',
                        boxShadow: 'var(--glass-shadow-sm)',
                        color: 'var(--c-content)',
                        border: 'none',
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23667' stroke-width='2' fill='none'/%3E%3C/svg%3E\")",
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 14px center'
                      }}
                    >
                      <option value="">{t.selectChannel}</option>
                      {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                    </select>
                  </div>
                )}

                {selectedChannel && (
                  <div className="space-y-2 fade-in">
                    <Label icon={<Clock className="w-3.5 h-3.5" />}>{t.dailyReport}</Label>
                    <input
                      type="time" value={reportTime} onChange={e => setReportTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-full text-sm outline-none transition-colors"
                      style={{
                        background: 'color-mix(in srgb, var(--c-glass) 20%, transparent)',
                        backdropFilter: 'blur(8px) saturate(var(--saturation))',
                        WebkitBackdropFilter: 'blur(8px) saturate(var(--saturation))',
                        boxShadow: 'var(--glass-shadow-sm)',
                        color: 'var(--c-content)', border: 'none',
                      }}
                    />
                  </div>
                )}

                {selectedChannel && (
                  <div className="space-y-2 fade-in">
                    <Label icon={<Settings className="w-3.5 h-3.5" />}>{t.reportSections}</Label>
                    <div className="glass-sm rounded-2xl p-3 space-y-1.5">
                      <SectionToggle
                        icon={<BarChart3 className="w-4 h-4" />}
                        label={t.overview}
                        desc={t.overviewDesc}
                        checked={true}
                        disabled={true}
                      />
                      <SectionToggle
                        icon={<Swords className="w-4 h-4" />}
                        label={t.combat}
                        desc={t.combatDesc}
                        checked={selectedSections.includes('combat')}
                        onChange={c => toggleSection('combat', c)}
                      />
                      <SectionToggle
                        icon={<Pickaxe className="w-4 h-4" />}
                        label={t.mining}
                        desc={t.miningDesc}
                        checked={selectedSections.includes('mining')}
                        onChange={c => toggleSection('mining', c)}
                      />
                      <SectionToggle
                        icon={<Compass className="w-4 h-4" />}
                        label={t.exploration}
                        desc={t.explorationDesc}
                        checked={selectedSections.includes('exploration')}
                        onChange={c => toggleSection('exploration', c)}
                      />
                      <SectionToggle
                        icon={<Sparkles className="w-4 h-4" />}
                        label={t.funFacts}
                        desc={t.funFactsDesc}
                        checked={selectedSections.includes('funfacts')}
                        onChange={c => toggleSection('funfacts', c)}
                      />
                    </div>
                  </div>
                )}

                {selectedChannel && (
                  <div className="space-y-2 fade-in">
                    <Label icon={<Languages className="w-3.5 h-3.5" />}>{lang === 'de' ? 'Report-Sprache' : 'Report Language'}</Label>
                    <div className="flex items-center gap-1 glass-sm rounded-full p-1 w-fit">
                      <button
                        onClick={() => setReportLang('en')}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${reportLang === 'en' ? 'bg-[var(--c-action)] text-white' : 'text-[var(--c-content-muted)] hover:text-[var(--c-content)]'}`}
                      >EN</button>
                      <button
                        onClick={() => setReportLang('de')}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${reportLang === 'de' ? 'bg-[var(--c-action)] text-white' : 'text-[var(--c-content-muted)] hover:text-[var(--c-content)]'}`}
                      >DE</button>
                    </div>
                  </div>
                )}

                {selectedChannel && (
                  <div className="fade-in">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded accent-[var(--c-action)] cursor-pointer" />
                      <span className="text-[12px] leading-relaxed" style={{ color: 'var(--c-content-muted)' }}>
                        {t.agreeTerms}{' '}
                        <a href="/terms" target="_blank" className="underline font-medium" style={{ color: 'var(--c-action)' }}>{t.termsLink}</a>
                        {' '}{t.and}{' '}
                        <a href="/privacy" target="_blank" className="underline font-medium" style={{ color: 'var(--c-action)' }}>{t.privacyLink}</a>
                        {' '}{t.agreeSuffix}
                      </span>
                    </label>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-2xl" style={{
                background: 'color-mix(in srgb, var(--c-danger) 8%, transparent)',
                boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--c-danger) 20%, transparent)',
              }}>
                <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--c-danger)' }} />
                <p className="text-sm" style={{ color: 'var(--c-danger)' }}>{error}</p>
              </div>
            )}

            {selectedChannel && (
              <div className="pt-1 fade-in">
                <button onClick={save} disabled={loading || !agreedToTerms}
                  className="w-full h-11 rounded-full font-semibold text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] text-white"
                  style={{ background: 'var(--c-action)' }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t.saveAndStart} <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {currentStep === 2 && savedConfig && (
        <div className="glass rounded-3xl p-6 fade-in" key="done">
          <div className="text-center pt-2 pb-4">
            <div className="glass-sm inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 pop-in">
              <Check className="w-7 h-7" style={{ color: 'var(--c-success)' }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--c-content)' }}>{t.setupComplete}</h2>
            <p className="text-[13px] mt-1" style={{ color: 'var(--c-content-muted)' }}>{t.serverLinked}</p>
          </div>
          <div className="glass-sm rounded-2xl divide-y overflow-hidden" style={{ borderColor: 'color-mix(in srgb, var(--c-light) 60%, transparent)' }}>
            <SummaryRow icon={<Server className="w-4 h-4" />} label="Server" value={savedConfig.guild} />
            <SummaryRow icon={<Hash className="w-4 h-4" />} label="Channel" value={`#${savedConfig.channel}`} />
            <SummaryRow icon={<Clock className="w-4 h-4" />} label="Report" value={`${savedConfig.time} Uhr`} />
            <SummaryRow icon={<Settings className="w-4 h-4" />} label="Sektionen" value={`${savedConfig.sections?.length || 5} aktiv`} />
          </div>
          <p className="text-[11px] text-center mt-4" style={{ color: 'color-mix(in srgb, var(--c-content-muted) 70%, transparent)' }}>
            {t.closeWindow}
          </p>
        </div>
      )}
    </div>
  )
}

/* ───── Legal Pages ───── */

function LegalPage({ title, icon, children }) {
  return (
    <div className="relative w-full max-w-[640px] z-10 py-8">
      <div className="fade-in">
        <a href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-6 glass-btn px-3 py-1.5 rounded-full" style={{ color: 'var(--c-content-muted)' }}>
          <ChevronLeft className="w-4 h-4" /> Zurück
        </a>
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="glass-sm inline-flex items-center justify-center w-10 h-10 rounded-xl" style={{ color: 'var(--c-action)' }}>{icon}</div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--c-content)' }}>{title}</h1>
          </div>
          <div className="prose-sm space-y-4" style={{ color: 'var(--c-content-muted)' }}>{children}</div>
        </div>
        <p className="text-[11px] text-center mt-4" style={{ color: 'color-mix(in srgb, var(--c-content-muted) 50%, transparent)' }}>MCStatsBot &middot; April 2026</p>
      </div>
    </div>
  )
}

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" icon={<Lock className="w-5 h-5" />}>
      <Section title="1. Who we are">
        <p>MCStatsBot is a service that collects aggregated gameplay statistics from Minecraft servers and delivers daily summary reports to Discord channels. The service is operated privately and hosted on servers located in Austria, European Union.</p>
        <p className="mt-2">If you have any questions about this privacy policy or how your data is handled, please open an issue on <a href="https://github.com/panie18/MCStatsBot" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: 'var(--c-action)' }}>GitHub</a>.</p>
      </Section>
      <Section title="2. What data we collect">
        <p className="mb-2">We collect only what is necessary to provide the service. Here is a full breakdown:</p>
        <p className="font-medium mb-1" style={{ color: 'var(--c-content)' }}>Discord data (via OAuth2)</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Your Discord user ID and username — used to authenticate you during setup</li>
          <li>The list of Discord servers you are in — used to let you pick which server to connect</li>
          <li>We do not read, store, or access any of your Discord messages, DMs, or other personal content</li>
        </ul>
        <p className="font-medium mb-1" style={{ color: 'var(--c-content)' }}>Minecraft statistics</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Player usernames and UUIDs — to attribute stats to individual players in reports</li>
          <li>Playtime, blocks broken, blocks placed, blocks crafted</li>
          <li>Combat data: kills, deaths, kill streaks, mob kills broken down by type</li>
          <li>Movement data: total distance walked, chunks explored, portal usage</li>
          <li>The number of chat messages sent per player — not the content of any message</li>
          <li>Items used, potions thrown, food consumed — as aggregate counts only</li>
          <li>Achievements unlocked and XP earned</li>
        </ul>
        <p className="font-medium mb-1" style={{ color: 'var(--c-content)' }}>Server configuration</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Discord server ID and channel ID you chose during setup</li>
          <li>Your preferred report time, language, and which sections to include</li>
          <li>A unique server ID and API secret generated on first plugin startup</li>
        </ul>
        <p className="font-medium mb-1" style={{ color: 'var(--c-content)' }}>Technical data</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>IP addresses are used for rate limiting only and are not stored to disk</li>
          <li>A session cookie is set during the OAuth2 flow — see section 7 for details</li>
        </ul>
      </Section>
      <Section title="3. How we use your data">
        <ul className="list-disc pl-5 space-y-1">
          <li>To generate and send daily stat reports to your configured Discord channel</li>
          <li>To authenticate you via Discord OAuth2 during the setup process</li>
          <li>To protect the service against abuse via rate limiting</li>
          <li>We do not use your data for advertising, profiling, or any purpose beyond operating the service</li>
        </ul>
      </Section>
      <Section title="4. Data sharing">
        <p>We do not sell, rent, or share your data with any third party except the following:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Discord (discord.com)</strong> — reports are sent to Discord's API to post messages in your channel. This is the core function of the service. Discord's own privacy policy applies to that data.</li>
        </ul>
        <p className="mt-2">No analytics services, advertising networks, or other third-party trackers are used.</p>
      </Section>
      <Section title="5. Where your data is stored">
        <p>All data is processed and stored on privately operated servers located in Austria, within the European Union. No data is transferred outside the EU except to Discord's infrastructure (which is covered under Discord's own GDPR compliance).</p>
      </Section>
      <Section title="6. How long we keep your data">
        <ul className="list-disc pl-5 space-y-1">
          <li>Minecraft statistics are stored for 90 days by default. Server administrators can adjust this in the plugin config.</li>
          <li>Server configuration (Discord channel, report time, etc.) is kept until you remove the plugin or request deletion.</li>
          <li>Session cookies expire after 1 hour.</li>
          <li>IP addresses used for rate limiting are never written to permanent storage.</li>
        </ul>
      </Section>
      <Section title="7. Cookies">
        <p>We use a single session cookie during the Discord OAuth2 setup flow. This cookie:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Is <strong>httpOnly</strong> — not accessible to JavaScript</li>
          <li>Is <strong>secure</strong> — only sent over HTTPS</li>
          <li>Expires after <strong>1 hour</strong></li>
          <li>Is used only to maintain your login state during setup, then discarded</li>
        </ul>
        <p className="mt-2">No tracking cookies, advertising cookies, or persistent cookies are used.</p>
      </Section>
      <Section title="8. Your rights (GDPR)">
        <p>If you are located in the European Union, you have the following rights under the GDPR:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Right of access</strong> — you can request a copy of the data we hold about you</li>
          <li><strong>Right to rectification</strong> — you can ask us to correct inaccurate data</li>
          <li><strong>Right to erasure</strong> — you can request deletion of your data at any time</li>
          <li><strong>Right to restriction</strong> — you can ask us to limit how we use your data</li>
          <li><strong>Right to object</strong> — you can object to the processing of your data</li>
        </ul>
        <p className="mt-2">To exercise any of these rights, open an issue on <a href="https://github.com/panie18/MCStatsBot" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: 'var(--c-action)' }}>GitHub</a>.</p>
        <p className="mt-2">Uninstalling the plugin immediately stops all data collection. Data already stored on the central server will be deleted automatically after the configured retention period, or immediately upon request.</p>
      </Section>
      <Section title="9. Open source">
        <p>The full source code for both the plugin and the central server is publicly available on <a href="https://github.com/panie18/MCStatsBot" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: 'var(--c-action)' }}>GitHub</a>. You can inspect exactly what data is collected and how it is processed. If you prefer complete control over your data, a self-hosting option is available — see the repository for instructions.</p>
      </Section>
      <Section title="10. Changes to this policy">
        <p>If we make significant changes to this privacy policy, we will update this page. The date at the bottom of this page reflects when it was last updated.</p>
      </Section>
    </LegalPage>
  )
}

function TermsPage() {
  return (
    <LegalPage title="Nutzungsbedingungen" icon={<FileText className="w-5 h-5" />}>
      <Section title="1. Geltungsbereich">
        <p>Diese Nutzungsbedingungen gelten für die Nutzung des MCStatsBot-Dienstes, bestehend aus dem Minecraft-Plugin und dem zentralen Webservice.</p>
      </Section>
      <Section title="2. Leistungsbeschreibung">
        <p>MCStatsBot sammelt Spielstatistiken auf Minecraft-Servern und sendet diese als Reports an einen konfigurierten Discord-Channel. Der Dienst wird kostenlos und ohne Gewährleistung bereitgestellt.</p>
      </Section>
      <Section title="3. Pflichten des Nutzers">
        <ul className="list-disc pl-5 space-y-1">
          <li>Der Nutzer darf den Dienst nur für Minecraft-Server verwenden, deren Administrator er ist oder für die er eine Berechtigung hat.</li>
          <li>Missbrauch des Dienstes (z.B. Spam, überlastende Anfragen, Manipulation) ist untersagt.</li>
          <li>Der Nutzer ist dafür verantwortlich, die Spieler seines Servers über die Datenerhebung zu informieren.</li>
        </ul>
      </Section>
      <Section title="4. Verfügbarkeit">
        <p>Der Dienst wird nach bestem Bemühen betrieben. Ein Anspruch auf ununterbrochene Verfügbarkeit besteht nicht. Wartungsarbeiten können jederzeit durchgeführt werden.</p>
      </Section>
      <Section title="5. Haftung">
        <p>Die Nutzung erfolgt auf eigene Gefahr. Der Betreiber haftet nicht für Datenverlust, Ausfälle oder Schäden, die durch die Nutzung des Dienstes entstehen, soweit gesetzlich zulässig.</p>
      </Section>
      <Section title="6. Kündigung">
        <p>Beide Seiten können die Nutzung jederzeit beenden. Die Deinstallation des Plugins beendet die Datenerhebung sofort. Gespeicherte Daten werden nach der konfigurierten Aufbewahrungsfrist automatisch gelöscht.</p>
      </Section>
      <Section title="7. Änderungen">
        <p>Der Betreiber behält sich vor, diese Nutzungsbedingungen jederzeit zu ändern. Die jeweils aktuelle Fassung ist unter diesem Link abrufbar.</p>
      </Section>
    </LegalPage>
  )
}

function StatusPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHealth()
    const interval = setInterval(loadHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadHealth() {
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setHealth(data)
      setError('')
    } catch {
      setError('Verbindung fehlgeschlagen')
    }
    setLoading(false)
  }

  const statusColor = (status) => {
    if (status === 'operational') return 'var(--c-success)'
    if (status === 'degraded') return 'var(--c-warning)'
    return 'var(--c-danger)'
  }

  const statusLabel = (status) => {
    if (status === 'operational') return 'Betriebsbereit'
    if (status === 'degraded') return 'Eingeschränkt'
    return 'Offline'
  }

  const allOperational = health?.services && Object.values(health.services).every(s => s.status === 'operational')

  return (
    <div className="relative w-full max-w-[540px] z-10 py-8">
      <div className="fade-in">
        <a href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-6 glass-btn px-3 py-1.5 rounded-full" style={{ color: 'var(--c-content-muted)' }}>
          <ChevronLeft className="w-4 h-4" /> Zurück
        </a>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="glass-sm inline-flex items-center justify-center w-10 h-10 rounded-xl" style={{ color: 'var(--c-action)' }}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--c-content)' }}>System Status</h1>
              <p className="text-[12px]" style={{ color: 'var(--c-content-muted)' }}>
                {health?.timestamp ? `Aktualisiert: ${new Date(health.timestamp).toLocaleTimeString('de-DE')}` : 'Wird geladen...'}
              </p>
            </div>
            <button onClick={loadHealth} className="ml-auto glass-btn p-2 rounded-xl" style={{ color: 'var(--c-content-muted)' }}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl mb-4" style={{
              background: 'color-mix(in srgb, var(--c-danger) 8%, transparent)',
              boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--c-danger) 20%, transparent)',
            }}>
              <AlertCircle className="w-4 h-4" style={{ color: 'var(--c-danger)' }} />
              <p className="text-sm" style={{ color: 'var(--c-danger)' }}>{error}</p>
            </div>
          )}

          {health && (
            <>
              <div className="glass-sm rounded-2xl p-4 mb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: allOperational ? 'var(--c-success)' : 'var(--c-warning)' }} />
                  <span className="text-base font-semibold" style={{ color: 'var(--c-content)' }}>
                    {allOperational ? 'Alle Systeme betriebsbereit' : 'Einige Systeme eingeschränkt'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label icon={<Server className="w-3.5 h-3.5" />}>Dienste</Label>
                <div className="glass-sm rounded-2xl divide-y overflow-hidden" style={{ borderColor: 'color-mix(in srgb, var(--c-dark) 6%, transparent)' }}>
                  <StatusRow
                    label="API Server"
                    status={health.services.api?.status}
                    detail={health.services.api?.latency ? `${health.services.api.latency}ms` : null}
                  />
                  <StatusRow
                    label="Discord Bot"
                    status={health.services.discord_bot?.status}
                    detail={health.services.discord_bot?.ping ? `${health.services.discord_bot.ping}ms ping` : null}
                  />
                  <StatusRow
                    label="Datenbank"
                    status={health.services.database?.status}
                  />
                </div>
              </div>
            </>
          )}

          {loading && !health && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--c-action)' }} />
            </div>
          )}
        </div>

        <p className="text-[11px] text-center mt-4" style={{ color: 'color-mix(in srgb, var(--c-content-muted) 50%, transparent)' }}>
          MCStatsBot &middot; Status wird alle 30 Sekunden aktualisiert
        </p>
      </div>
    </div>
  )
}

function StatusRow({ label, status, detail }) {
  const statusColor = (s) => {
    if (s === 'operational') return 'var(--c-success)'
    if (s === 'degraded') return 'var(--c-warning)'
    return 'var(--c-danger)'
  }
  const statusLabel = (s) => {
    if (s === 'operational') return 'OK'
    if (s === 'degraded') return 'Langsam'
    return 'Offline'
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderColor: 'color-mix(in srgb, var(--c-dark) 6%, transparent)' }}>
      <span className="w-2 h-2 rounded-full" style={{ background: statusColor(status) }} />
      <span className="text-[13px] flex-1" style={{ color: 'var(--c-content)' }}>{label}</span>
      {detail && <span className="text-[11px]" style={{ color: 'var(--c-content-muted)' }}>{detail}</span>}
      <span className="text-[11px] font-medium" style={{ color: statusColor(status) }}>{statusLabel(status)}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-semibold text-[14px] mb-1.5" style={{ color: 'var(--c-content)' }}>{title}</h3>
      <div className="text-[13px] leading-relaxed">{children}</div>
    </div>
  )
}

/* ───── Components ───── */

function StepHeader({ icon, title, desc }) {
  return (
    <div className="text-center mb-5">
      <div className="glass-sm inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3">{icon}</div>
      <h2 className="text-base font-semibold" style={{ color: 'var(--c-content)' }}>{title}</h2>
      <p className="text-[13px] mt-1" style={{ color: 'var(--c-content-muted)' }}>{desc}</p>
    </div>
  )
}

function Label({ icon, children }) {
  return (
    <label className="text-[10px] font-semibold uppercase tracking-[0.08em] flex items-center gap-1.5" style={{ color: 'var(--c-content-muted)' }}>
      {icon} {children}
    </label>
  )
}

function GuildCard({ guild, selected, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left cursor-pointer ${selected ? 'glass' : 'glass-sm hover:scale-[1.01]'}`}
      style={selected ? { boxShadow: `var(--glass-shadow-sm), inset 0 0 0 2px color-mix(in srgb, var(--c-action) 30%, transparent)` } : {}}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: 'color-mix(in srgb, var(--c-glass) 30%, transparent)' }}>
        {guild.icon
          ? <img src={`${guild.icon}?size=64`} alt="" className="w-full h-full object-cover rounded-xl" />
          : <span className="text-xs font-bold" style={{ color: 'var(--c-content-muted)' }}>{guild.name.charAt(0).toUpperCase()}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ color: 'var(--c-content)' }}>{guild.name}</p>
        <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--c-success)' }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--c-success)' }} />Bot aktiv
        </p>
      </div>
      {selected && <Check className="w-4 h-4" style={{ color: 'var(--c-action)' }} />}
    </button>
  )
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderColor: 'color-mix(in srgb, var(--c-dark) 6%, transparent)' }}>
      <span style={{ color: 'var(--c-content-muted)' }}>{icon}</span>
      <span className="text-[13px] flex-1" style={{ color: 'var(--c-content-muted)' }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: 'var(--c-content)' }}>{value}</span>
    </div>
  )
}

function Btn({ variant = 'accent', size = 'md', onClick, children }) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-full transition-all cursor-pointer active:scale-[0.97]'
  const sizes = { xs: 'text-[11px] px-2.5 py-1', sm: 'text-xs px-3.5 py-1.5', md: 'text-sm px-4 py-2' }
  const style = variant === 'accent' ? { background: 'var(--c-action)', color: '#fff' } : {}
  return <button onClick={onClick} className={`${base} ${sizes[size]} ${variant === 'ghost' ? 'glass-btn' : ''}`} style={style}>{children}</button>
}

function SectionToggle({ icon, label, desc, checked, onChange, disabled }) {
  return (
    <label className={`flex items-center gap-3 p-2 rounded-xl transition-all ${disabled ? 'opacity-60' : 'cursor-pointer hover:bg-[color-mix(in_srgb,var(--c-glass)_10%,transparent)]'}`}>
      <span style={{ color: checked ? 'var(--c-action)' : 'var(--c-content-muted)' }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium" style={{ color: 'var(--c-content)' }}>{label}</p>
        <p className="text-[11px]" style={{ color: 'var(--c-content-muted)' }}>{desc}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange?.(e.target.checked)}
        className="w-4 h-4 rounded accent-[var(--c-action)] cursor-pointer disabled:cursor-not-allowed"
      />
    </label>
  )
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  )
}

function SpigotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm-1 3v2H7v2h4v2H7v2h4v2h2v-2h4v-2h-4v-2h4V9h-4V7h-2z"/>
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}
