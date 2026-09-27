# LAMS Inventory Scanner — iOS Development Guide

This document explains how to develop, run, rebuild, and update the iOS application.

It is specifically written for this project, which uses:

* Expo SDK `57.0.25`
* React Native `0.86.3`
* React `19.2.3`
* iOS deployment target `16.4`
* Expo Development Build
* Xcode 27
* iOS 27
* Native `ios/` directory committed to the repository

---

# 1. Project Location

The project should be located at:

```bash
/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app
```

Always make sure you are working from this directory.

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
```

Verify:

```bash
pwd
```

Expected result:

```text
/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app
```

---

# 2. Important: How This Project Works

This project has two different layers:

## JavaScript / TypeScript layer

This includes:

```text
.js
.jsx
.ts
.tsx
```

Examples:

* React components
* Screens
* Navigation
* API calls
* Business logic
* State management
* Styling
* UI changes

These changes are handled by **Metro** and normally do NOT require rebuilding the native iOS application.

---

## Native iOS layer

This includes:

```text
ios/
```

Examples:

* `Info.plist`
* `AppDelegate.swift`
* `Podfile`
* Xcode project settings
* Native Swift/Objective-C code
* iOS permissions
* URL schemes
* iOS deployment target
* Native dependencies
* Expo native configuration

Changes here can require a native rebuild.

---

# 3. Normal Development — No Native Rebuild

Most day-to-day development falls into this category.

Examples:

* Changing React UI
* Changing styles
* Changing TypeScript/JavaScript
* Adding screens
* Changing navigation
* Changing API logic
* Changing business logic
* Changing components
* Changing hooks
* Changing state management
* Changing normal assets

You normally do NOT need:

```bash
npx expo prebuild
```

and you normally do NOT need:

```bash
npx expo run:ios
```

---

# 4. Starting the App for Normal Development

First open Terminal.

Go to the project:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
```

Start Metro:

```bash
npx expo start
```

Because this project uses a development build, make sure Expo is using the development build.

If the terminal says:

```text
Using Expo Go
```

press:

```text
s
```

until it says:

```text
Using development build
```

Then press:

```text
i
```

to open the iOS Simulator.

---

# 5. If Metro Cache Is Causing Problems

If the application behaves strangely after changing JavaScript/TypeScript code, restart Metro with a clean cache:

```bash
npx expo start --clear
```

Then press:

```text
s
```

if necessary to switch to the development build.

Then:

```text
i
```

to launch the iOS app.

You do NOT normally need to rebuild the native application for this.

---

# 6. Fast Refresh

Once the app is running through Metro:

```text
Code → Save → Metro detects change → Fast Refresh → App updates
```

For example:

```text
src/screens/Home.tsx
```

is changed.

Save the file.

The Simulator should update automatically.

No rebuild is required.

---

# 7. When Do I Need to Rebuild?

You need to rebuild the native application when you make native changes.

Common examples:

### `Info.plist`

If you modify:

```text
ios/LAMSInventoryScanner/Info.plist
```

you need to rebuild.

Run:

```bash
npx expo run:ios --device
```

---

### `AppDelegate.swift`

If you modify:

```text
ios/LAMSInventoryScanner/AppDelegate.swift
```

you need to rebuild.

Run:

```bash
npx expo run:ios --device
```

---

### Native Swift / Objective-C

Any changes to native iOS code require a rebuild.

---

### Podfile

If you change:

```text
ios/Podfile
```

you normally need to reinstall pods and rebuild.

Run:

```bash
npx pod-install
```

then:

```bash
npx expo run:ios --device
```

---

### Native dependency

If you install a package that contains native iOS code, you generally need to rebuild.

For example:

```bash
npx expo install some-native-package
```

Then:

```bash
npx pod-install
npx expo run:ios --device
```

---

### iOS permissions

Changes to native permissions generally require a native rebuild.

For example:

```text
NSCameraUsageDescription
NSLocationWhenInUseUsageDescription
NSPhotoLibraryUsageDescription
```

---

# 8. When Do I Need Expo Prebuild?

`expo prebuild` generates or updates the native `ios/` and `android/` projects based on your Expo configuration.

For this project, **do not run prebuild for every normal code change.**

Prebuild is mainly needed when Expo configuration needs to be synchronized with the native projects.

Examples include:

* Adding an Expo config plugin
* Changing an Expo config plugin's native settings
* Changing `app.json` settings that affect native projects
* Adding/removing native Expo packages
* Updating Expo SDK
* Regenerating native configuration
* Applying changes from an Expo SDK upgrade

---

# 9. Very Important: This Project Has a Committed `ios/` Directory

The `ios/` directory is part of the project and contains native configuration.

Therefore:

**Do not casually run:**

```bash
npx expo prebuild --clean
```

The `--clean` option deletes and regenerates native directories.

That can overwrite or remove manually maintained native files and settings.

Before using `--clean`, make sure native changes are committed or backed up.

---

# 10. Normal Prebuild

If you need to synchronize Expo configuration with the existing native project, use:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"

npx expo prebuild --platform ios --no-install
```

The `--platform ios` option limits the operation to iOS.

The `--no-install` option prevents Expo from automatically installing dependencies.

After prebuild, inspect the changes:

```bash
git status
```

Then inspect the differences:

```bash
git diff
```

Pay particular attention to:

```text
ios/
app.json
package.json
Podfile.properties.json
```

---

# 11. After Prebuild

If prebuild changed native files, reinstall CocoaPods:

```bash
npx pod-install
```

Then build the iOS app:

```bash
npx expo run:ios --device
```

Select the desired Simulator/device.

---

# 12. Recommended Prebuild Workflow

When you genuinely need prebuild:

### Step 1

Go to the project:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
```

### Step 2

Check Git status:

```bash
git status
```

### Step 3

Commit or save important native changes before prebuild.

For example:

```bash
git add .
git commit -m "Save native iOS changes before Expo prebuild"
```

### Step 4

Run:

```bash
npx expo prebuild --platform ios --no-install
```

### Step 5

Review:

```bash
git status
```

and:

```bash
git diff
```

### Step 6

Install pods:

```bash
npx pod-install
```

### Step 7

Build:

```bash
npx expo run:ios --device
```

---

# 13. When NOT to Run Prebuild

Do NOT run prebuild simply because you changed:

```text
.js
.jsx
.ts
.tsx
```

Do NOT run prebuild just to see a UI change.

Do NOT run prebuild every time you start development.

Do NOT run prebuild after every Git pull unless the pulled changes specifically require native synchronization.

---

# 14. Quick Decision Guide

Use this table before running commands.

| Change                    | Metro Restart | Native Rebuild |  Prebuild |
| ------------------------- | ------------: | -------------: | --------: |
| `.js`                     |    Usually no |             No |        No |
| `.jsx`                    |    Usually no |             No |        No |
| `.ts`                     |    Usually no |             No |        No |
| `.tsx`                    |    Usually no |             No |        No |
| React UI                  |            No |             No |        No |
| Styling                   |            No |             No |        No |
| Navigation                |            No |             No |        No |
| API/business logic        |            No |             No |        No |
| `.env` value              |   Usually yes |     Usually no |        No |
| `.env.example`            |            No |             No |        No |
| `Info.plist`              |            No |            Yes |       No* |
| `AppDelegate.swift`       |            No |            Yes |       No* |
| Native Swift code         |            No |            Yes |       No* |
| `Podfile`                 |            No |            Yes |        No |
| Native package added      |            No |            Yes | Sometimes |
| `app.json` native setting |            No |            Yes |   Usually |
| Expo config plugin        |            No |            Yes |   Usually |
| Expo SDK upgrade          |            No |            Yes |   Usually |
| Deployment target         |            No |            Yes |   Usually |
| iOS scene configuration   |            No |            Yes |   Usually |

`*` If you manually edit a native file directly, you generally do not need prebuild just to compile that change. Rebuild is sufficient.

---

# 15. `.env` vs `.env.example`

These files have different purposes.

## `.env`

Contains actual development environment values.

Example:

```text
API_URL=https://example.com
```

## `.env.example`

Contains a template for developers.

Example:

```text
API_URL=
```

Changing `.env.example` does not normally change the running application.

If you change the actual `.env` file and the application reads environment variables through Metro, restart Metro:

```bash
Ctrl + C
npx expo start --clear
```

A native rebuild is generally not required unless the environment value is being embedded into native configuration.

---

# 16. Rebuilding After an Info.plist Change

If you manually change:

```text
ios/LAMSInventoryScanner/Info.plist
```

you do NOT need prebuild.

Stop the current Metro process:

```bash
Ctrl + C
```

Then:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
```

Build again:

```bash
npx expo run:ios --device
```

This recompiles the native application using the updated `Info.plist`.

---

# 17. Rebuilding After Podfile Changes

If you modify:

```text
ios/Podfile
```

run:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"

npx pod-install

npx expo run:ios --device
```

---

# 18. Clean Native Build

If a native build becomes corrupted or Xcode starts producing strange build errors, first try:

```bash
rm -rf ios/build
```

Then:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/LAMSInventoryScanner-*
```

Then:

```bash
npx expo run:ios --device
```

Do not immediately use `expo prebuild --clean`.

---

# 19. If Metro Is Using an Old Project Path

If you see an error such as:

```text
ConfigError: The expected package.json path:
.../Github Repo/.../package.json does not exist
```

first stop Metro:

```bash
Ctrl + C
```

Then kill anything still using port 8081:

```bash
lsof -ti :8081 | xargs kill -9 2>/dev/null
```

Verify:

```bash
lsof -i :8081
```

Then go to the correct directory:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
```

Start Metro with a clean cache:

```bash
npx expo start --clear
```

Switch to development build:

```text
s
```

Then launch iOS:

```text
i
```

---

# 20. Development Build vs Expo Go

This project uses an **Expo development build**.

The terminal should say:

```text
Using development build
```

If it says:

```text
Using Expo Go
```

press:

```text
s
```

to switch.

Do not assume Expo Go is equivalent to the project's development build because native dependencies and native configuration can differ.

---

# 21. Recommended Daily Development Workflow

For normal development, use this:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"

npx expo start
```

If necessary:

```text
s
```

Then:

```text
i
```

Make changes to:

```text
.js
.jsx
.ts
.tsx
```

Save the files.

Fast Refresh should update the application.

---

# 22. Recommended Workflow After a Native Change

If you changed:

```text
Info.plist
AppDelegate.swift
native Swift code
Podfile
native dependencies
```

stop Metro:

```text
Ctrl + C
```

Then:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
```

For `Info.plist`, `AppDelegate.swift`, or other native source changes:

```bash
npx expo run:ios --device
```

For Podfile/native dependency changes:

```bash
npx pod-install
npx expo run:ios --device
```

---

# 23. Recommended Workflow After `app.json` Changes

If you changed an Expo configuration that affects native iOS configuration:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"

npx expo prebuild --platform ios --no-install

npx pod-install

npx expo run:ios --device
```

Always inspect the resulting Git changes:

```bash
git status
git diff
```

---

# 24. Before Running Prebuild

Because this project contains manually maintained native iOS files, always check:

```bash
git status
```

If you have uncommitted native changes, strongly consider committing them first.

Example:

```bash
git add ios app.json package.json package-lock.json

git commit -m "Save native changes before Expo prebuild"
```

Then run prebuild.

This gives you a safe point to compare against if Expo changes native files.

---

# 25. Git Workflow

After making changes:

```bash
git status
```

Review:

```bash
git diff
```

Then stage:

```bash
git add .
```

Commit:

```bash
git commit -m "Your commit message"
```

---

# 26. Most Important Rules

### Rule 1

**Normal React/TypeScript change → do not rebuild.**

Use:

```bash
npx expo start
```

and Fast Refresh.

---

### Rule 2

**Native iOS change → rebuild.**

Use:

```bash
npx expo run:ios --device
```

---

### Rule 3

**Expo configuration/native generation change → consider prebuild.**

Use:

```bash
npx expo prebuild --platform ios --no-install
```

Then:

```bash
npx pod-install
npx expo run:ios --device
```

---

### Rule 4

**Do not routinely use `--clean`.**

Avoid:

```bash
npx expo prebuild --clean
```

unless you specifically intend to regenerate the native project and have protected/committed your native changes.

---

### Rule 5

**Do not run prebuild just to see JavaScript changes.**

For normal development:

```bash
npx expo start
```

is enough.

---

# 27. Quick Command Cheat Sheet

## Start normal development

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
npx expo start
```

Then:

```text
s
i
```

---

## Start with clean Metro cache

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
npx expo start --clear
```

Then:

```text
s
i
```

---

## Rebuild after native code/config change

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
npx expo run:ios --device
```

---

## Rebuild after Podfile/native dependency change

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
npx pod-install
npx expo run:ios --device
```

---

## Run Expo prebuild

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
npx expo prebuild --platform ios --no-install
```

Then:

```bash
npx pod-install
npx expo run:ios --device
```

---

## Check Git changes after prebuild

```bash
git status
git diff
```

---

# 28. Current Project Configuration

At the time this guide was created, the project uses:

```text
Expo SDK:              57.0.25
React Native:          0.86.3
React:                 19.2.3
expo-build-properties: 57.0.22
iOS Deployment Target: 16.4
Xcode:                 27
iOS Simulator:         iOS 27
JavaScript Engine:     Hermes
Development Build:     Yes
Bundle ID:             com.lams.inventoryscanner
```

The project also has iOS scene lifecycle support enabled for iOS 27 compatibility.

---

# 29. The Simplest Rule to Remember

When you are unsure, ask:

**"Did I change native iOS code/configuration, or only my React/TypeScript code?"**

### React/TypeScript:

```text
.js / .jsx / .ts / .tsx
        ↓
npx expo start
        ↓
Fast Refresh
```

### Native iOS:

```text
Info.plist / Swift / Podfile / native package
        ↓
npx expo run:ios --device
```

### Expo native configuration:

```text
app.json / config plugin / Expo SDK
        ↓
npx expo prebuild --platform ios --no-install
        ↓
npx pod-install
        ↓
npx expo run:ios --device
```

This distinction prevents unnecessary native rebuilds and reduces the risk of accidentally overwriting manually maintained iOS configuration.
