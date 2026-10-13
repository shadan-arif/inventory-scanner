# Setting Up HTTPS Access to the Local Next.js App on iPhone (mkcert)

Oct 13, 2026 · @Shadan-Arif

## Overview

To open https://192.168.0.81:9000/v2 on an iPhone without a "This Connection Is Not Private" warning, the app needs a certificate that lists 192.168.0.81, and the iPhone must trust the authority that signed it. Both steps use mkcert and keep the app on the local network only.

The warning appears for two separate reasons, and both must be fixed:

- The server certificate does not include the IP address 192.168.0.81 (for example, it was issued only for `localhost`).
- The iPhone does not trust the mkcert root CA that signed the certificate.

Nothing here exposes the app to the public internet. The server listens only on the local network, and the root CA is trusted only on devices where you install it.

## Prerequisites

This guide is for a Windows PC that runs the Next.js app. You need:

- An iPhone on the same Wi-Fi network as the PC.
- The PC's local IP address, `192.168.0.81` in this guide. Check it by running `ipconfig` in PowerShell and reading the "IPv4 Address" of the Wi-Fi adapter. If it differs, use your own IP everywhere below.
- mkcert installed. Open PowerShell **as Administrator** and run one of these (Scoop needs a normal, non-Administrator window instead; see the install notes below): `choco install mkcert` (Chocolatey) or `scoop install mkcert` (Scoop). Without a package manager, download `mkcert-v*-windows-amd64.exe` from the mkcert releases page on GitHub and rename it to `mkcert.exe`.
- Windows Firewall allowing inbound connections on port 9000. Run this once in an Administrator PowerShell:

  ```powershell
  netsh advfirewall firewall add rule name="Next.js 9000" dir=in action=allow protocol=TCP localport=9000
  ```

The IP address can change when the router reassigns it. Reserve a fixed IP for the PC in the router's DHCP settings, or you will need to repeat Part 1 each time it changes.

### Installing Chocolatey or Scoop (only if neither is installed)

Check first: run `choco --version` or `scoop --version` in PowerShell. If a version number appears, skip this step. Otherwise install one of the two (you only need one).

**Option A: Chocolatey.** Open PowerShell **as Administrator** (right-click the Start menu, choose Terminal (Admin) or Windows PowerShell (Admin)) and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Close PowerShell, open a new Administrator window, and check with `choco --version`. Then run `choco install mkcert`.

**Option B: Scoop.** Open a normal (non-Administrator) PowerShell window and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

Check with `scoop --version`, then run `scoop install mkcert` in the same normal window. Scoop does not work from an Administrator window by default, so use a normal one for all Scoop commands.

Both installers download a script from the internet, so the PC needs internet access. If the installer is blocked on a company-managed PC, ask the IT team or use the manual download of `mkcert.exe` described above.

## Part 1: Generate the server certificate (on the Windows PC)

Create a certificate that lists the IP address the app is served from. Run these commands in PowerShell, in the project folder.

1. Install mkcert's local CA on the PC (one time). Windows may show a security prompt asking to install the certificate; choose **Yes**.

   ```powershell
   mkcert -install
   ```
2. Generate the certificate and key:

   ```powershell
   mkcert localhost 127.0.0.1 ::1 192.168.0.81
   ```
3. This creates two files: `localhost+3.pem` (certificate) and `localhost+3-key.pem` (private key). Keep the key private and do not commit it to git.
4. Confirm the IP is inside the certificate:

   ```powershell
   certutil -dump localhost+3.pem
   ```

   In the output, find the "Subject Alternative Name" section. It must include `IP Address=192.168.0.81`. If it does not, the certificate cannot be used for this address.

## Part 2: Run the Next.js app with the certificate

Add or update the script in `package.json`:

```json
"local2": "next dev -H 0.0.0.0 -p 9000 --experimental-https --experimental-https-key ./localhost+3-key.pem --experimental-https-cert ./localhost+3.pem"
```

`-H 0.0.0.0` makes the app reachable from other devices on the network, and `-p 9000` sets the port.

First check that nothing is already using port 9000:

```powershell
netstat -ano | findstr :9000
```

If a line is listed, the last number is the process ID (PID) of an old instance. Stop it with `taskkill /PID <PID> /F`, or the old certificate may still be served. Then start the app:

```powershell
npm run local2
```

To confirm the app is reachable on the network, open `https://192.168.0.81:9000/v2` in a browser on the PC itself. The page should load with a padlock and no warning, because `mkcert -install` already made the PC trust the certificate. If it does not load, check the firewall rule in Prerequisites.

## Part 3: Install and trust the root CA (on the iPhone)

The iPhone needs the mkcert **root CA**, not the server certificate. Installing `localhost+3.pem` on the phone does not fix the warning.

1. On the PC, find and open the folder that holds the root CA:

   ```powershell
   mkcert -CAROOT
   explorer (mkcert -CAROOT)
   ```
2. Send `rootCA.pem` from that folder to the iPhone. AirDrop is not available on Windows, so email it to yourself, or save it to iCloud Drive, OneDrive or Google Drive and open it in the Files app on the iPhone. Never send `rootCA-key.pem`: anyone holding it can create certificates your devices will trust.
3. On the iPhone, tap the file. A message says "Profile Downloaded". If the file only opens as text, save it to Files, then tap it from there.
4. Open **Settings → General → VPN & Device Management**, tap the downloaded mkcert profile, and tap **Install**.
5. Open **Settings → General → About → Certificate Trust Settings** (at the bottom of the About screen). Under "Enable full trust for root certificates", switch on the toggle for the mkcert root. This step is required, and it is the one most often missed.

To confirm the right file was installed, compare fingerprints. On the PC:

```powershell
certutil -dump "$(mkcert -CAROOT)\rootCA.pem"
```

Find the line "Cert Hash(sha256)" in the output. On the iPhone, open the installed profile, tap **More Details**, and check that the SHA-256 value is the same (the iPhone shows it with colons between pairs; the PC may show it with spaces).

## Part 4: Verify in Safari and the iOS app

1. Force-quit Safari, or at least close the old tab, so it drops the earlier warning.
2. Open `https://192.168.0.81:9000/v2` in Safari. The page should load with no warning.
3. In the iOS app, log in again. Apps using `URLSession` or `WKWebView` use the system trust store, so the same trust setting applies. Do not disable certificate validation in the app.

When Safari shows the certificate details, the subject says `localhost` and the issuer says "mkcert". This is normal, because the IP address is listed in the certificate's Subject Alternative Names. Its fingerprint also differs from the root CA's fingerprint from Part 3, because Safari shows the server certificate, not the root.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Page does not load at all on the iPhone | Windows Firewall blocks port 9000, or the PC and iPhone are on different networks | Add the firewall rule from Prerequisites; set the Wi-Fi network profile to Private; join the same Wi-Fi |
| Warning persists, trust toggle is missing | Profile downloaded but not installed | Settings → General → VPN & Device Management → open the profile → Install |
| Warning persists, toggle exists | Full trust is off | Turn on the mkcert toggle in Certificate Trust Settings |
| Fingerprint on phone differs from the PC's root CA | Wrong file installed (the server certificate, or an old root CA) | Remove the profile, then install `rootCA.pem` from the `mkcert -CAROOT` folder |
| Server certificate lacks the IP | Old certificate still served | Redo Part 1, stop the old process with `taskkill`, restart |
| Worked before, fails now | PC's IP address changed | Regenerate the certificate for the new IP; no change needed on the iPhone |
| iOS app is blocked, Safari works | Local Network permission off | Settings → the app → turn on Local Network |
