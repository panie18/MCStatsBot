// Frontend translations
export const translations = {
  de: {
    // Landing page
    landing: {
      subtitle1: 'Minecraft Server-Statistiken automatisch in Discord.',
      subtitle2: 'Einfach einrichten, täglich informiert.',
      download: 'Plugin herunterladen',
      features: 'Features',
      featuresData: [
        { title: 'Tägliche Reports', desc: 'Automatische Statistik-Zusammenfassungen direkt in Discord' },
        { title: 'Spieler-Tracking', desc: 'Spielzeit, Kills, Tode, Blöcke und mehr pro Spieler' },
        { title: 'Kampf-Stats', desc: 'Mob-Kills, PvP-Statistiken und Top-Jäger Rankings' },
        { title: 'Bergbau-Analyse', desc: 'Abgebaute Blöcke, seltene Funde und Platzierungen' },
        { title: 'Erkundung', desc: 'Reisedistanzen, Nether- und End-Portal-Nutzung' },
        { title: 'Mehrsprachig', desc: 'Unterstützung für Deutsch, Englisch und mehr' },
      ],
      platforms: 'Unterstützte Plattformen',
      howItWorks: "So funktioniert's",
      steps: [
        { title: 'Plugin installieren', desc: 'Lade das Plugin herunter und kopiere es in den plugins-Ordner deines Servers.' },
        { title: 'Server starten', desc: 'Beim Start generiert das Plugin eine Setup-URL in der Konsole.' },
        { title: 'Mit Discord verbinden', desc: 'Öffne die URL, melde dich mit Discord an und wähle Server & Channel.' },
        { title: 'Fertig!', desc: 'Das Plugin sendet automatisch tägliche Reports. Nutze /stats für Live-Daten.' },
      ],
    },

    // Setup wizard
    steps: ['Anmelden', 'Konfigurieren', 'Fertig'],
    setup: {
      waitingForServer: 'Warte auf Minecraft-Server...',
      startPlugin: 'Starte das MCStatsBot-Plugin auf deinem Server.',
      loginWithDiscord: 'Mit Discord anmelden',
      loginDesc: 'Melde dich an, um den Bot mit deinem Server zu verknüpfen.',
      securityNote: 'Wir fragen nur nach Server- und Profil-Infos. Kein Zugriff auf Nachrichten.',
      serverChannel: 'Server & Channel',
      serverChannelDesc: 'Wähle wo die Stats gepostet werden sollen.',
      sessionFailed: 'Sitzung konnte nicht geladen werden',
      tryAgain: 'Bitte versuche es erneut oder melde dich nochmal an.',
      retry: 'Erneut versuchen',
      reLogin: 'Neu anmelden',
      discordServer: 'Discord Server',
      botNotOnServer: 'Der Bot ist noch auf keinem deiner Server.',
      inviteBot: 'Bot einladen',
      refresh: 'Aktualisieren',
      botNotHere: 'Bot nicht auf deinem Server?',
      invite: 'Einladen',
      textChannel: 'Text Channel',
      selectChannel: 'Channel wählen...',
      dailyReport: 'Täglicher Report',
      reportSections: 'Report-Sektionen',
      overview: 'Übersicht',
      overviewDesc: 'Spieler, Spielzeit, Chat',
      combat: 'Kampf',
      combatDesc: 'Mob-Kills, Tode, PvP',
      mining: 'Bergbau',
      miningDesc: 'Abgebaute & platzierte Blöcke',
      exploration: 'Erkundung',
      explorationDesc: 'Reisedistanz, Biome',
      funFacts: 'Fun Facts',
      funFactsDesc: 'Zufällige Statistiken',
      agreeTerms: 'Ich stimme den',
      termsLink: 'Nutzungsbedingungen',
      and: 'und der',
      privacyLink: 'Datenschutzerklärung',
      agreeSuffix: 'zu.',
      saveAndStart: 'Speichern & Starten',
      setupComplete: 'Setup abgeschlossen!',
      serverLinked: 'Dein Server ist jetzt mit Discord verknüpft.',
      closeWindow: 'Du kannst dieses Fenster jetzt schließen. Die Stats werden automatisch gesendet.',
      reconfigure: 'Neu konfigurieren',
      serverSetup: 'Server eingerichtet',
      serverLinkedShort: 'Dein Server ist mit Discord verknüpft.',
      tooManyRequests: 'Zu viele Anfragen. Bitte warte kurz.',
      connectionFailed: 'Verbindung fehlgeschlagen',
      channelsLoadFailed: 'Channels konnten nicht geladen werden',
      saveError: 'Fehler beim Speichern',
      connectionError: 'Verbindungsfehler',
      sectionsActive: 'aktiv',
    },

    // Footer
    footer: {
      status: 'Status',
      terms: 'Nutzungsbedingungen',
      privacy: 'Datenschutz',
    },
  },

  en: {
    // Landing page
    landing: {
      subtitle1: 'Minecraft server statistics automatically in Discord.',
      subtitle2: 'Easy setup, daily updates.',
      download: 'Download Plugin',
      features: 'Features',
      featuresData: [
        { title: 'Daily Reports', desc: 'Automatic statistics summaries directly in Discord' },
        { title: 'Player Tracking', desc: 'Playtime, kills, deaths, blocks and more per player' },
        { title: 'Combat Stats', desc: 'Mob kills, PvP statistics and top hunter rankings' },
        { title: 'Mining Analysis', desc: 'Broken blocks, rare finds and placements' },
        { title: 'Exploration', desc: 'Travel distances, Nether and End portal usage' },
        { title: 'Multilingual', desc: 'Support for German, English and more' },
      ],
      platforms: 'Supported Platforms',
      howItWorks: 'How it works',
      steps: [
        { title: 'Install Plugin', desc: 'Download the plugin and copy it to your server\'s plugins folder.' },
        { title: 'Start Server', desc: 'On startup, the plugin generates a setup URL in the console.' },
        { title: 'Connect to Discord', desc: 'Open the URL, login with Discord and select server & channel.' },
        { title: 'Done!', desc: 'The plugin automatically sends daily reports. Use /stats for live data.' },
      ],
    },

    // Setup wizard
    steps: ['Login', 'Configure', 'Done'],
    setup: {
      waitingForServer: 'Waiting for Minecraft server...',
      startPlugin: 'Start the MCStatsBot plugin on your server.',
      loginWithDiscord: 'Login with Discord',
      loginDesc: 'Login to connect the bot with your server.',
      securityNote: 'We only request server and profile info. No access to messages.',
      serverChannel: 'Server & Channel',
      serverChannelDesc: 'Choose where stats should be posted.',
      sessionFailed: 'Session could not be loaded',
      tryAgain: 'Please try again or login again.',
      retry: 'Try again',
      reLogin: 'Login again',
      discordServer: 'Discord Server',
      botNotOnServer: 'The bot is not yet on any of your servers.',
      inviteBot: 'Invite Bot',
      refresh: 'Refresh',
      botNotHere: 'Bot not on your server?',
      invite: 'Invite',
      textChannel: 'Text Channel',
      selectChannel: 'Select channel...',
      dailyReport: 'Daily Report',
      reportSections: 'Report Sections',
      overview: 'Overview',
      overviewDesc: 'Players, playtime, chat',
      combat: 'Combat',
      combatDesc: 'Mob kills, deaths, PvP',
      mining: 'Mining',
      miningDesc: 'Broken & placed blocks',
      exploration: 'Exploration',
      explorationDesc: 'Travel distance, biomes',
      funFacts: 'Fun Facts',
      funFactsDesc: 'Random statistics',
      agreeTerms: 'I agree to the',
      termsLink: 'Terms of Service',
      and: 'and the',
      privacyLink: 'Privacy Policy',
      agreeSuffix: '.',
      saveAndStart: 'Save & Start',
      setupComplete: 'Setup complete!',
      serverLinked: 'Your server is now connected to Discord.',
      closeWindow: 'You can close this window now. Stats will be sent automatically.',
      reconfigure: 'Reconfigure',
      serverSetup: 'Server configured',
      serverLinkedShort: 'Your server is connected to Discord.',
      tooManyRequests: 'Too many requests. Please wait.',
      connectionFailed: 'Connection failed',
      channelsLoadFailed: 'Channels could not be loaded',
      saveError: 'Error saving',
      connectionError: 'Connection error',
      sectionsActive: 'active',
    },

    // Footer
    footer: {
      status: 'Status',
      terms: 'Terms of Service',
      privacy: 'Privacy',
    },
  },
}

export function useTranslation(lang = 'de') {
  const t = (key) => {
    const keys = key.split('.')
    let value = translations[lang]
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) {
        // Fallback to German
        value = translations.de
        for (const k2 of keys) {
          value = value?.[k2]
          if (value === undefined) return key
        }
        break
      }
    }
    return value
  }
  return { t, lang }
}
