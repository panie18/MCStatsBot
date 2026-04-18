# MCStatsBot

MCStatsBot is a Minecraft server plugin that tracks what your players are up to and sends a daily summary to your Discord server. Playtime, mining, combat, exploration, fun facts — all of it, formatted into a clean embed that lands in your channel every morning (or whenever you schedule it).

It works across two pieces: a lightweight plugin on your Minecraft server that collects data, and a small Node.js server that handles the Discord side. The two talk to each other over a simple API, so your MC server doesn't need to touch Discord at all.

---

## What gets tracked

- Playtime per player, with a daily ranking and session stats (earliest bird, latest owl, longest session)
- Blocks broken, placed, and crafted — with per-player leaderboards
- Combat: kills, deaths, kill streaks, PvP kills, mob breakdown, most common death causes
- Movement: total distance walked, new chunks explored, Nether and End portal usage
- Chat messages, commands used, items consumed, potions thrown
- Achievements unlocked and XP gained
- All-time records and 7-day trend comparisons
- Auto-generated fun facts based on the day's activity

---

## How it works

```
Minecraft Server (plugin)
        |
        | HTTP POST — daily stats payload
        v
Central Node.js Server (mcstatsbot-server)
        |
        | Discord.js
        v
Discord Channel
```

The plugin registers itself with your central server on first startup and gets a unique server ID and secret. After that, it sends stats automatically. Setup takes about two minutes via a web onboarding page the plugin prints to console.

---

## Requirements

**Plugin**
- Paper or Spigot 1.21.x (also works on Paper 26.1+)
- Java 21

**Central server**
- Node.js 18+
- A Discord bot token and a channel to post in
- Any server or VPS (a Raspberry Pi works fine)

---

## Installation

### 1. Set up the central server

Clone the repo and go into the `server` folder:

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and fill in your Discord bot token, the Discord channel ID where reports should go, and a random string for `JWT_SECRET`.

Start the server:

```bash
npm start
```

It listens on port 3000 by default. Put it behind a reverse proxy (nginx, Caddy) with a domain if you want HTTPS, which the plugin requires.

### 2. Install the plugin

Drop `MCStatsBot-1.0.0.jar` into your server's `plugins/` folder and restart. The plugin will print a setup URL to console:

```
[MCStatsBot] Setup required: https://your-server.example.com/setup?token=...
```

Open that URL in a browser, connect your Discord server, pick a channel, and you're done. The plugin config (`plugins/MCStatsBot/config.yml`) gets filled in automatically.

---

## Configuration

`plugins/MCStatsBot/config.yml` — most things you won't need to touch after onboarding:

```yaml
general:
  language: en          # en or de
  data-retention-days: 90
  afk-timeout-minutes: 5

tracking:
  chat-messages: true
  blocks: true
  mob-kills: true
  movement: true
  items: true
```

Report schedule and which sections appear are controlled from the central server's dashboard.

---

## Report sections

Each daily report can include any combination of these sections:

| Section | What's in it |
|---|---|
| overview | Active players, total playtime, chat count, player of the day |
| playtime | Per-player ranking, early bird, night owl, longest session |
| combat | Kills, deaths, streaks, PvP, mob kills, death causes |
| mining | Blocks broken/placed/crafted, top miners and builders |
| exploration | Distance walked, chunks explored, portal usage |
| achievements | Unlocked achievements, top XP earners |
| funfacts | Auto-generated highlights from the day's numbers |
| records | Comparison to yesterday, 7-day trends, all-time leaderboards |
| events | Notable in-game events that happened during the day |

---

## Languages

English and German are both supported. Set `language: en` or `language: de` in the plugin config. The Discord reports will follow that setting.

---

## Building from source

```bash
# Plugin
cd plugin
./gradlew shadowJar
# Output: build/libs/MCStatsBot-1.0.0.jar

# Server
cd server
npm install
npm start
```

---

## License

MIT
