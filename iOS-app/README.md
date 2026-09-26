# LAMS Supermarket Inventory Scanner - Mobile App

This folder contains the React Native / Expo mobile client for the existing LAMS Supermarket Inventory Scanner. It is a native iOS application today and is deliberately structured to support Android from the same codebase later.

The app does not create a new API or database. It connects to the existing Next.js server, which continues to own authentication, employee accounts, wholesale settings, inventory integrations, buyer sales aggregation, and PostgreSQL data.

## Technology

| Area | Implementation |
| --- | --- |
| Mobile framework | React Native with Expo SDK 53 |
| Navigation | React Navigation native stack |
| Camera/barcodes | `expo-camera` `CameraView` |
| Secure native storage | `expo-secure-store` (iOS Keychain / Android Keystore) |
| HTTP client | Axios |
| Icons | `lucide-react-native` |
| Feedback | `react-native-toast-message` and native alerts |
| Backend | Existing Next.js API at the configured base URL |

## Project layout

```text
iOS-app/
  App.tsx                       Expo entry point and stack navigation
  app.json                      Expo, iOS ATS/camera, and Android package configuration
  .env.example                  Editable API base URL template
  src/
    components/BarcodeScanner.tsx   Camera permission and barcode scanning UI
    screens/Screens.tsx             All application screens and mobile UI
    services/api.ts                 Axios client, API calls, session storage, data types
    state/AuthContext.tsx           Restored session, login, logout, current user state
```

## Configuring the API URL

The API URL has one central configuration point. The default is the currently running local Next.js server:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:9000
```

Create `iOS-app/.env` with the required value. `.env` is intentionally ignored by Git. The full template and device guidance are in `.env.example`.

`localhost` is correct only for the iOS Simulator running on this Mac. A physical iPhone or Android device must use the Mac's local Wi-Fi IP address instead:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.81:9000
```

Restart Expo after changing the environment value:

```bash
npm start -- --lan
```

## How the app communicates with Next.js

All calls flow directly from the app to the existing Next.js API:

```text
iOS / Android app
  -> Axios client (base URL from EXPO_PUBLIC_API_BASE_URL)
  -> Existing Next.js API routes
  -> PostgreSQL / existing external inventory provider
```

### Authentication and shared accounts

1. The login screen sends `{ code, password }` to `POST /api/auth/login`.
2. The existing server verifies the four-digit credentials using its PostgreSQL user records.
3. The server returns the authenticated user and sets the `ws_session` JWT cookie.
4. Native iOS/Android stores the JWT in SecureStore and sends both headers on subsequent calls:

   ```text
   Authorization: Bearer <token>
   Cookie: ws_session=<token>
   ```

5. `GET /api/auth/me` restores and verifies an existing session at launch.
6. `POST /api/auth/logout` clears the server cookie and local stored session.

The browser preview cannot access native SecureStore, so it uses browser cookie storage and a local session marker only. Native iOS/Android builds use SecureStore.

### Browser preview CORS support

The Expo browser preview runs on port `8081` while the Next.js server runs on port `9000`. The existing Next.js middleware has a development-only CORS policy for `http://localhost:8081`, including credentialed cookie requests. This makes browser preview login possible without changing production origins.

## Implemented functionality

### Login and modules

- Employee and admin portal visual toggle.
- Four-digit numeric code and PIN validation.
- Shared session login, logout, and startup verification.
- Role-aware modules dashboard.
- Active Wholesale, Item Manager V2, Buyer, and admin-only Admin Panel cards.
- Coming Soon cards for Purchase Order, Produce Inventory, Receive Inventory, Shelf Label, and Print Signs.

### Barcode scanner

- Camera permission request and camera launch.
- Supports `qr`, `ean13`, `ean8`, `upc_a`, `upc_e`, `code128`, and `code39`.
- Includes manual numeric item lookup in all scan workflows.
- Uses `GET /api/item-search?itemSearch=<itemId>` before opening a result or editor.

### Wholesale

- Reads global margin from `GET /api/wholesale/settings`.
- Result screen displays product, supplier, case quantity, unit cost, case cost, and unit price.
- Customer price calculation matches the existing web application:

  ```text
  caseQty       = parseFloat(defaultSupplierUnitQty || "0")
  unitCost      = parseFloat(lastCost || "0")
  caseCost      = caseQty * unitCost
  customerPrice = caseCost / (1 - margin / 100)
  ```

- Admin users can update the shared ideal margin through `PUT /api/wholesale/settings`.

### Item Manager V2

- Barcode/manual item lookup.
- Editable item ID lookup, description, retail price, and unit cost.
- Live `Will update to:` feedback for changed values.
- Read-only supplier, supplier ID, case quantity, and recalculated case cost.
- Save behavior matches the web app:
  - Description changes: `POST /api/updateName` with the required maintenance array.
  - Price/cost changes: `POST /api/updatePriceV2` with `Primary Zone` and local `YYYY-MM-DD HH:mm:ss` start date.
- Success overlay returns to the scanner after 2.5 seconds.

### Buyer

- Same item editing and save behavior as Item Manager V2.
- Fetches `GET /api/buyer-sales?itemId=<itemId>`.
- Displays rounded units sold for 7, 14, and 30 days. The server excludes today from these ranges.
- Includes a sales refresh action.

### Admin

- Admin-only employee list with code, name, role, and created date.
- Add employee with name, four-digit code, four-digit PIN, and role.
- Update an employee PIN.
- Delete an employee, with client-side protection for the logged-in administrator and matching server-side enforcement.

### Error feedback

- Login errors are shown as persistent, specific toasts, including backend HTTP status and error message.
- Connection errors name the configured API URL to make configuration failures clear.
- Other workflows use native alerts with the API's returned error detail.

## iOS network and privacy configuration

`app.json` configures the generated iOS `Info.plist` with:

```xml
NSAppTransportSecurity
  NSAllowsArbitraryLoads = true
  NSAllowsLocalNetworking = true

NSCameraUsageDescription
  Camera access is required to scan item barcodes.
```

These settings are necessary because the local API currently uses plain HTTP. Do not remove them until the backend has a valid HTTPS endpoint.

## Install dependencies

Requirements:

- Node.js 18 or later
- npm
- For simulator/native iPhone builds: current Xcode from the Mac App Store

Install packages:

```bash
cd "/Users/shadanarif/Desktop/Github Repo/inventory-scanner/iOS-app"
npm install
```

Validate TypeScript:

```bash
npm run typecheck
```

## Run the live app

### Browser preview

Use this for quick layout and workflow checks:

```bash
npm start -- --lan
```

Open `http://localhost:8081` in a browser. The browser preview supports login through the development CORS configuration, but the native app is the authoritative environment for camera, SecureStore, and HTTP network behavior.

### iOS Simulator

1. Install and open Xcode once, then accept its license.
2. Start an iPhone Simulator from Xcode, or let Expo choose one.
3. Run:

   ```bash
   npx expo run:ios
   ```

Expo generates the native iOS project from `app.json`, compiles it, starts Metro, and opens the app in the simulator. Manual lookup works in the simulator. Use a physical device for reliable camera barcode tests.

### Physical iPhone development build

1. Ensure the iPhone and Mac use the same Wi-Fi network.
2. Set `EXPO_PUBLIC_API_BASE_URL` in `.env` to this Mac's LAN address, not `localhost`.
3. Connect the iPhone by cable, unlock it, trust the Mac, and enable Developer Mode in iPhone Settings.
4. In the project folder, run:

   ```bash
   npx expo run:ios --device
   ```

5. Select the connected iPhone when prompted. Xcode will use the configured signing team and install the app.
6. Accept the camera permission prompt and test barcode scanning against the live Next.js API.

Apple signing is required for installing a development build on a real iPhone. A free Apple ID can be used for local development; a paid Apple Developer account is required for distribution through TestFlight or the App Store.

### Expo Go option

For an early device preview, install Expo Go from the App Store, start `npm start -- --lan`, and open the LAN URL/QR code on the phone. This is convenient for interface iteration. Use `npx expo run:ios --device` for the closest representation of the final app because it uses this project's generated iOS privacy and network settings.

## Android readiness

The application uses one shared JavaScript/TypeScript codebase for both platforms. `app.json` already includes Android package ID `com.lams.inventoryscanner`; Expo Camera generates the Android camera permission. When Android work begins:

```bash
npx expo run:android
```

Use the same `.env` API setting, changing from `localhost` to the reachable LAN IP when running on a physical Android device.

## Important operational notes

- The Next.js server must remain running. It is the only backend and owns the shared accounts and database.
- The current iOS ATS allowances are intended for trusted local Wi-Fi development. Prefer HTTPS before deployment outside the local network.
- Do not commit `.env` files, real credentials, or generated `node_modules` / `.expo` content.
