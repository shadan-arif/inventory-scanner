# Local HTTPS Setup for Next.js (Windows & macOS)

This guide explains how to run your Next.js app over HTTPS on your local network using `mkcert`, so that features like camera access work on mobile devices (iOS & Android) without exposing your app to the public internet.

---

# What This Setup Achieves

* HTTPS on local network (LAN)
* Works on mobile devices (same WiFi)
* Enables camera / secure APIs
* No public exposure (no ngrok, no deployment)

---

# 🖥️ WINDOWS SETUP

## 1. Install Chocolatey

Open PowerShell as Administrator:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; \
[System.Net.ServicePointManager]::SecurityProtocol = \
[System.Net.ServicePointManager]::SecurityProtocol -bor 3072; \
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Verify:

```powershell
choco -v
```

---

## 2. Install mkcert

```powershell
choco install mkcert -y
```

Install local CA:

```powershell
mkcert -install
```

---

## 3. Get Local IP

```powershell
ipconfig
```

Look for:

```
IPv4 Address: 192.168.x.x
```

---

## 4. Generate Certificates

```powershell
mkcert 192.168.x.x localhost
```

This creates:

* `192.168.x.x+1.pem`
* `192.168.x.x+1-key.pem`

---

## 5. Move Certificates

Inside your project:

```
/cert
  cert.pem
  key.pem
```

Rename:

* `.pem` → `cert.pem`
* `-key.pem` → `key.pem`

---

# macOS SETUP

## 1. Install Homebrew (if needed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## 2. Install mkcert

```bash
brew install mkcert
```

Install local CA:

```bash
mkcert -install
```

---

## 3. Get Local IP

```bash
ipconfig getifaddr en0
```

---

## 4. Generate Certificates

```bash
mkcert 192.168.x.x localhost
```

---

## 5. Move Certificates

```bash
mkdir -p cert
mv *.pem cert/
```

Rename:

```
cert.pem
key.pem
```

---

# ⚙️ Next.js Configuration

No changes needed in `next.config.mjs`.

Update `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "local": "next dev -H 0.0.0.0 -p 3000 --experimental-https --experimental-https-key cert/key.pem --experimental-https-cert cert/cert.pem"
}
```

---

# 🚀 Running the App

## Normal Dev

```bash
npm run dev
```

Runs on:

```
http://localhost:3000
```

---

## Mobile / HTTPS Dev

```bash
npm run local
```

Open on phone:

```
https://192.168.x.x:3000
```

---

# 🔐 Important Notes

## 1. 0.0.0.0 Explained

`0.0.0.0` means the server listens on all local interfaces.

It does NOT make your app public.

---

## 2. Network Access

Accessible only if:

* Same WiFi network
* No router port forwarding

---

## 3. First-time HTTPS Warning

* iOS: Tap Continue
* Android: Tap Proceed

No manual configuration required.

---

# 🛠 Troubleshooting

## Camera Not Working

* Ensure you are using `https://`
* Do NOT use `http://192.168.x.x`

---

## Cannot Access from Phone

* Check same WiFi
* Allow Node.js in firewall
* Use correct IP

---

## Certificate Errors

* Regenerate using mkcert
* Include correct IP

---

# ✅ Summary

| Feature         | Status |
| --------------- | ------ |
| HTTPS           | ✅      |
| Mobile access   | ✅      |
| Camera support  | ✅      |
| Public exposure | ❌      |

---

# 🎯 Recommended Workflow

* Use `npm run dev` for coding
* Use `npm run local` for mobile testing

---

You're now running a secure local development environment that behaves like production — without exposing anything to the internet.
