# Mac Mini (Roundtable OpenClaw)

Cursor on the Mac Mini can work on this repo when it is registered in OpenClaw.

## One-time setup on the Mini

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/Roundtable-Design/slj.git
cd slj && pnpm i
```

## Pull latest (after push from laptop)

```bash
cd ~/Projects/slj && git pull origin main && pnpm i
```

## OpenClaw / cursor-remote

Project id: **`slj`** (path `~/Projects/slj` on the Mini).

After updating `home-assistant/openclaw/cursor-projects.json`, redeploy home-assistant to the Mini:

```bash
bash ~/Projects/home-assistant/scripts/deploy-mac-mini.sh
```

Then on the Mini (or via cursor-remote):

```bash
cursor-remote send "Pull latest slj and summarize recent commits" --chat 8690613215 --project slj
```

## Production

Vercel deploys from `main` on GitHub automatically. Live: https://slj.talksfromthewarehouse.co.uk
