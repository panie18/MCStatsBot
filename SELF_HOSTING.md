# Self-Hosting MCStatsBot

This guide covers running your own instance of the MCStatsBot central server instead of using mcstatsbot.tech. You would do this if you want full control over your data, or if you want to modify the server code.

---

## What you need

- A server or VPS with a public IP (a Raspberry Pi works fine for small setups)
- Node.js 18 or newer
- A domain with HTTPS — the plugin requires a valid SSL certificate
- A Discord application with a bot token

---

## Discord setup

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) and create a new application
2. Under **Bot**, create a bot and copy the token
3. Under **OAuth2 > General**, add your server URL as a redirect URI: `https://your-domain.example.com/auth/discord/callback`
4. Copy the **Client ID** and **Client Secret**

---

## Server setup

Clone the repo and go into the server folder:

```bash
git clone https://github.com/panie18/MCStatsBot.git
cd MCStatsBot/server
npm install
cp .env.example .env
```

Edit `.env`:

```
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_BOT_TOKEN=your_bot_token
PORT=3000
BASE_URL=https://your-domain.example.com
SESSION_SECRET=any_long_random_string
```

Start the server:

```bash
npm start
```

---

## Reverse proxy (nginx example)

The plugin sends HTTPS requests, so you need a proper SSL certificate in front of the Node.js server. Example nginx config:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.example.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Use [Certbot](https://certbot.eff.org) to get a free Let's Encrypt certificate.

---

## Running as a service (systemd)

```ini
# /etc/systemd/system/mcstatsbot.service
[Unit]
Description=MCStatsBot Central Server
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/mcstatsbot-server/src/index.js
WorkingDirectory=/opt/mcstatsbot-server
Restart=always
User=your-user
EnvironmentFile=/opt/mcstatsbot-server/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable mcstatsbot
sudo systemctl start mcstatsbot
```

---

## Pointing the plugin at your server

In `plugins/MCStatsBot/config.yml` on your Minecraft server, change:

```yaml
central:
  url: "https://your-domain.example.com"
```

Then run `/mcstats reload` or restart the server. A new setup URL will be printed to console pointing at your instance.

---

## Keeping it up to date

```bash
cd MCStatsBot
git pull
cd server
npm install
sudo systemctl restart mcstatsbot
```
