# MCStatsBot

MCStatsBot is a Minecraft server plugin that tracks what your players are up to and sends a daily summary to your Discord server. Playtime, mining, combat, exploration, fun facts — all of it, formatted into a clean embed that lands in your channel every morning (or whenever you schedule it).

The central server that handles Discord integration is already hosted at [mcstatsbot.tech](https://mcstatsbot.tech) — you just install the plugin and follow a two-minute setup. No server, no Node.js, no config files to dig through.

Also available on [SpigotMC](https://www.spigotmc.org/resources/mcstatsbot.134361/).

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
mcstatsbot.tech (already hosted)
        |
        | Discord.js
        v
Discord Channel
```

The plugin registers itself on first startup and prints a setup URL to console. You open it, connect your Discord server, pick a channel, and that's it. No self-hosting required.

---

## Installation

1. Download `MCStatsBot-1.0.0.jar` from the [releases page](https://github.com/panie18/MCStatsBot/releases) or from [SpigotMC](https://www.spigotmc.org/resources/mcstatsbot.123456/)
2. Drop it into your server's `plugins/` folder
3. Restart your server
4. Open the setup URL that appears in console
5. Connect your Discord server and pick a channel — done

**Requirements:** Paper or Spigot 1.21.x (also works on Paper 26.1+), Java 21

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

English and German are both supported. Switch between them in the web dashboard after setup.

---

## Building from source

```bash
cd plugin
./gradlew shadowJar
# Output: build/libs/MCStatsBot-1.0.0.jar
```

---

## Self-hosting

Want to run your own instance instead of using mcstatsbot.tech? See [SELF_HOSTING.md](SELF_HOSTING.md) for the full setup guide.

---

## License

MIT
