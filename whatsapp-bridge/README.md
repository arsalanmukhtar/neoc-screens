# NEOC WhatsApp bridge

Sends station alerts over WhatsApp from an always-on machine, and records the replies.

The dashboard runs on Vercel, where nothing can stay running, so this small service lives on the
VM instead. It keeps one WhatsApp account linked through [whatsapp-web.js][wwebjs] (a real
WhatsApp Web session in Chromium) and sends the alerts the dashboard asks for.

**Phone numbers stay here.** The dashboard only says *"an alert for G-7"*; this service looks the
number up in `numbers.json`, which lives on the VM and is never committed — this repository is
public.

## Endpoints

| Route | Auth | Purpose |
| --- | --- | --- |
| `POST /send` | `Bearer BRIDGE_TOKEN` | `{ stationId, alertId, text }` → sends the message |
| `GET /status` | `Bearer BRIDGE_TOKEN` | `{ ready, state, stations }` — never returns numbers |
| `GET /qr` | `Bearer BRIDGE_TOKEN` | the pairing QR as a PNG, while it is waiting to be linked |
| `GET /health` | open | `{ ok, ready }` for nginx and monitoring |

## Install

```bash
mkdir -p ~/neoc-wa/data && cd ~/neoc-wa
# copy server.js, package.json, Dockerfile, docker-compose.yml here
cp .env.example .env            # set BRIDGE_TOKEN (same value as WA_BRIDGE_TOKEN on Vercel)
cp numbers.example.json numbers.json
chmod 600 .env numbers.json
docker compose up -d --build
docker logs -f neoc-wa          # scan the QR with the sender phone, once
```

Put it behind the machine's existing HTTPS (nginx) so Vercel can reach it:

```nginx
location /neoc-wa/ {
    proxy_pass http://127.0.0.1:47850/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 30s;
}
```

Then on Vercel: `WA_BRIDGE_URL=https://<host>/neoc-wa` and `WA_BRIDGE_TOKEN=<the same token>`.

## Numbers

`numbers.json` maps a station to a number in full international form, digits only:

```json
{ "G-7": "923001234567", "GCOP": "" }
```

It is read on every send, so adding a number needs no restart.

## Acknowledgements

The alert ends with *"Reply ACK to acknowledge this alert."* A reply of `ACK` (or `OK`,
`ACKNOWLEDGE`, `RECEIVED`) within 24 hours is posted to `api/alert-log` as
`WhatsApp · …1234`, the same permanent record as the Acknowledge button in the phone app.

## Keeping it alive

- The container restarts by itself (`restart: unless-stopped`) and reconnects after a disconnect.
- The session lives in `./data`, so restarts and rebuilds do not need a new QR scan.
- **The sender phone must open WhatsApp at least once a fortnight.** If it stays offline for 14
  days WhatsApp unlinks every linked device and the QR has to be scanned again.
- WhatsApp does not permit unofficial clients, so use a spare SIM for the sender, never an
  official number. If it is ever blocked, the dashboard's Desktop and Mobile alerts are unaffected.

[wwebjs]: https://wwebjs.dev/
