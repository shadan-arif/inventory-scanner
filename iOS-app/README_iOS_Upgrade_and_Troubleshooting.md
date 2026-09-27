# LAMS Inventory Scanner

## iOS / Expo Upgrade & Troubleshooting Documentation

This document records the Expo/React Native upgrade, iOS 27 compatibility work, native project changes, and build issues encountered during development.

The purpose is to make future maintenance easier and prevent the same issues from being investigated again.

---

# 1. Development Environment

The project was upgraded and tested with the following environment:

| Component             | Version                     |
| --------------------- | --------------------------- |
| macOS                 | 27.0                        |
| Xcode                 | 27.0 (`27A266a`)            |
| iOS Simulator         | iOS 27.0                    |
| Mac                   | Apple Silicon M1 Pro        |
| Expo SDK              | 57.0.25                     |
| React Native          | 0.86.3                      |
| React                 | 19.2.3                      |
| expo-build-properties | 57.0.22                     |
| Bundle ID             | `com.lams.inventoryscanner` |
| iOS Deployment Target | 16.4                        |
| JavaScript Engine     | Hermes                      |

Project location:

```text
/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app
```

---

# 2. Why the Expo / React Native Upgrade Was Required

The application was originally running on an older Expo SDK.

After upgrading macOS/Xcode and attempting to run the application on iOS 27, the application successfully built and installed but immediately crashed when launched.

The crash looked similar to:

```text
EXC_BREAKPOINT (SIGTRAP)
Triggered by Thread: 0
Dispatch Queue: com.apple.main-thread

UIKitCore
___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke

UIApplicationMain

LAMSInventoryScanner.debug.dylib
__debug_main_executable_dylib_entry_point

sourceFile: AppDelegate.swift
sourceLine: 6
```

This was not a JavaScript, React, Hermes, or application-business-logic problem.

The issue was related to Apple's newer UIKit scene lifecycle requirements introduced with the newer Xcode/iOS environment.

---

# 3. iOS 27 Scene Lifecycle Issue

Newer Xcode/iOS versions require applications to correctly adopt the UIKit scene lifecycle.

Older Expo native projects could use the older application lifecycle without the required scene configuration.

The project was therefore upgraded to Expo SDK 57, which includes support for the newer iOS scene lifecycle.

For Expo SDK 57, scene support can be enabled using:

```json
"enableSceneSupport": true
```

through `expo-build-properties`.

The relevant configuration became:

```json
[
  "expo-build-properties",
  {
    "ios": {
      "deploymentTarget": "16.4",
      "enableSceneSupport": true
    }
  }
]
```

---

# 4. Package Upgrade

The Expo project was upgraded to:

```text
Expo SDK 57.0.25
React Native 0.86.3
React 19.2.3
expo-build-properties 57.0.22
```

The package upgrade was performed using Expo's dependency compatibility mechanism:

```bash
npx expo install --fix
```

After the upgrade, Expo Doctor was run:

```bash
npx expo-doctor
```

The result was:

```text
20/21 checks passed
```

The remaining warning was related to the project being a manually maintained native project.

The project contains committed native `ios/` and `android/` directories while also having native configuration in `app.json`. This means configuration changes do not automatically modify the native project unless the appropriate Expo prebuild process is run.

This warning was therefore treated as an expected consequence of the project's native workflow rather than an application failure.

---

# 5. Important Dependency Philosophy

Do not manually downgrade individual Expo packages to arbitrary versions.

Expo packages should generally remain compatible with the Expo SDK version.

For example:

```text
Expo SDK 57
        ↓
Compatible Expo modules
        ↓
React Native 0.86
        ↓
React 19
```

When upgrading Expo in the future, use:

```bash
npx expo install --fix
```

and then:

```bash
npx expo-doctor
```

to identify incompatible dependencies.

---

# 6. Updated app.json Configuration

The important iOS configuration is:

```json
{
  "expo": {
    "name": "LAMS Inventory Scanner",
    "slug": "lams-inventory-scanner",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",

    "ios": {
      "bundleIdentifier": "com.lams.inventoryscanner",
      "supportsTablet": true,

      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": true,
          "NSAllowsLocalNetworking": true
        },
        "NSCameraUsageDescription": "Camera access is required to scan item barcodes."
      }
    },

    "android": {
      "package": "com.lams.inventoryscanner"
    },

    "plugins": [
      "expo-camera",
      "expo-secure-store",

      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "16.4",
            "enableSceneSupport": true
          }
        }
      ]
    ]
  }
}
```

The most important addition for the iOS 27 issue was:

```json
"enableSceneSupport": true
```

---

# 7. Expo Prebuild

Because the project contains native iOS code, the Expo configuration needed to be synchronized with the native project.

The following command was used:

```bash
npx expo prebuild --platform ios --no-install
```

This regenerated the relevant native configuration.

The command completed successfully:

```text
✔ Cleared ios code
✔ Created native directory
✔ Updated package.json
✔ Finished prebuild
```

## Important: Do Not Run `--clean` Casually

Do not use:

```bash
npx expo prebuild --clean
```

unless you intentionally want to regenerate the native project from scratch.

This project maintains a committed native `ios/` directory, so native changes should be reviewed carefully before committing regenerated files.

Before and after running prebuild, check:

```bash
git status
```

and:

```bash
git diff
```

This makes it possible to see exactly what Expo changed.

---

# 8. AppDelegate.swift Change

The regenerated Expo SDK 57 AppDelegate uses the newer Expo React Native factory architecture.

The generated AppDelegate contains:

```swift
internal import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)

    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    return super.application(
      application,
      didFinishLaunchingWithOptions: launchOptions
    )
  }
}
```

This replaced the older manually managed React Native startup approach.

The important lesson is:

**Do not restore the old AppDelegate implementation just because it looks familiar.**

The new Expo SDK 57 architecture is required for compatibility with the updated Expo/RN stack and scene lifecycle support.

---

# 9. iOS Scene Configuration

The generated `Info.plist` now contains:

```xml
<key>UIApplicationSceneManifest</key>
<dict>
  <key>UIApplicationSupportsMultipleScenes</key>
  <false/>

  <key>UISceneConfigurations</key>
  <dict>
    <key>UIWindowSceneSessionRoleApplication</key>
    <array>
      <dict>
        <key>UISceneConfigurationName</key>
        <string>Default Configuration</string>

        <key>UISceneDelegateClassName</key>
        <string>EXExpoAppSceneDelegate</string>
      </dict>
    </array>
  </dict>
</dict>
```

This allows the application to use the required UIKit scene lifecycle.

---

# 10. iOS Deployment Target

The project uses:

```text
iOS 16.4
```

The deployment target was configured through:

```json
"deploymentTarget": "16.4"
```

The native Xcode project was also verified to contain:

```text
IPHONEOS_DEPLOYMENT_TARGET = 16.4
```

The deployment target appeared consistently in the Xcode project settings.

---

# 11. CocoaPods Installation

After updating the native project, CocoaPods was reinstalled:

```bash
npx pod-install
```

The installation completed successfully.

The project reported approximately:

```text
94 dependencies from the Podfile
93 total pods installed
```

Expo precompiled modules such as the following were installed:

```text
ExpoCamera
ExpoCameraBarcodeScanning
ExpoFileSystem
ExpoFont
ExpoModulesCore
ExpoModulesWorklets
```

A Ruby warning appeared:

```text
Ignoring clocale-0.0.4 because its extensions are not built.
```

This did not prevent CocoaPods from installing and was not the cause of the application build failure.

---

# 12. React Native / Podfile Changes

The project originally contained some older Podfile workarounds.

Some of those workarounds were related to:

* ReactCodegen
* paths containing spaces
* older React Native/Folly/fmt dependencies

The project directory was subsequently moved from:

```text
/Users/shadanarif/Desktop/Github Repo/inventory-scanner/iOS-app
```

to:

```text
/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app
```

The space in `Github Repo` was therefore removed.

This made old path-space workarounds unnecessary.

The new Expo SDK 57 Podfile should therefore be kept close to the generated Expo configuration.

Do not reintroduce old Podfile hacks unless a current build error specifically requires them.

---

# 13. Preserving the Privacy Manifest

During prebuild, the following native files were regenerated/deleted:

```text
PrivacyInfo.xcprivacy
SplashScreenBackground.colorset/Contents.json
```

The project's existing:

```text
PrivacyInfo.xcprivacy
```

was restored because it contained the application's existing privacy declarations.

It included declarations for APIs such as:

```text
NSPrivacyAccessedAPICategoryFileTimestamp
NSPrivacyAccessedAPICategoryUserDefaults
NSPrivacyAccessedAPICategorySystemBootTime
```

These should not be removed simply because Expo prebuild regenerated other native files.

Always review native-file changes after prebuild.

---

# 14. Metro Path Issue

After moving the project directory, Metro temporarily reported:

```text
ConfigError:
The expected package.json path:

/Users/shadanarif/Desktop/Github Repo/inventory-scanner/iOS-app/package.json

does not exist
```

The actual project location was:

```text
/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app
```

The old path was searched throughout the project.

The only remaining occurrence was in:

```text
README.md
```

and was therefore documentation rather than application configuration.

Metro was subsequently started from the correct directory:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
npx expo start
```

The correct Metro URL was then generated from the new project path.

If this issue occurs again after moving the project, completely stop Metro and restart it from the correct project directory.

---

# 15. Expo Go vs Development Build

The project should be tested using a development build rather than assuming Expo Go represents the exact native application.

Metro initially reported:

```text
Using Expo Go
```

Pressing:

```text
s
```

switched the project to:

```text
Using development build
```

For native testing, use:

```bash
npx expo run:ios --device
```

This builds and installs the actual native development application.

---

# 16. App Icon Build Failure

After resolving the scene lifecycle issue, another completely separate build failure occurred.

The build reported:

```text
** BUILD FAILED **
```

with:

```text
CompileAssetCatalogVariant thinned
```

At first, this message was not specific enough to identify the cause.

The actual Xcode log was inspected using:

```bash
grep -n -B 15 -A 30 \
"CompileAssetCatalogVariant\|error:" \
.expo/xcodebuild.log | tail -100
```

The actual error was:

```text
The stickers icon set, app icon set, or icon stack named "AppIcon"
did not have any applicable content.
```

The log also showed:

```text
App-Icon-1024x1024@1x.png is 1023x1054 but should be 1024x1024.
```

Therefore, this build failure was unrelated to:

* Expo
* React Native
* Metro
* Hermes
* JavaScript
* `Info.plist`
* scene lifecycle
* CocoaPods

It was an **Xcode asset catalog problem**.

---

# 17. App Icon Dimension Requirement

The problematic file was:

```text
ios/LAMSInventoryScanner/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

Its original dimensions were:

```text
1023 × 1054
```

However, the filename indicates that it is the 1024 × 1024 AppIcon asset.

Xcode requires it to actually be:

```text
1024 × 1024
```

The first online resizing attempt produced:

```text
1024 × 989
```

which was still invalid.

The dimensions were verified using:

```bash
file ios/LAMSInventoryScanner/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

The result showed:

```text
PNG image data, 1024 x 989
```

Therefore, the image still needs to be corrected to exactly:

```text
1024 × 1024
```

---

# 18. Correct Way to Verify the App Icon

Always verify the actual file rather than trusting the filename.

Run:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"

file ios/LAMSInventoryScanner/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

The output must contain:

```text
1024 x 1024
```

It should NOT be:

```text
1024 x 989
```

or:

```text
1023 x 1054
```

or any other dimensions.

---

# 19. Fixing the App Icon with macOS

If the image can safely be resized to a square, macOS includes the `sips` utility.

Run:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"

sips -z 1024 1024 \
ios/LAMSInventoryScanner/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

Then verify:

```bash
file ios/LAMSInventoryScanner/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

The expected result is:

```text
PNG image data, 1024 x 1024
```

---

# 20. Check All App Icon Assets

If Xcode continues to report an AppIcon error, inspect every image in the AppIcon asset catalog:

```bash
find ios/LAMSInventoryScanner/Images.xcassets/AppIcon.appiconset \
-type f \
\( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) \
-exec file {} \;
```

This is important because correcting one icon does not guarantee that another AppIcon asset is valid.

Also inspect:

```text
ios/LAMSInventoryScanner/Images.xcassets/AppIcon.appiconset/Contents.json
```

The filenames referenced by `Contents.json` must actually exist in the directory.

---

# 21. Do Not Run Prebuild for an Asset-Only Fix

Changing an AppIcon image does not require:

```bash
npx expo prebuild
```

and does not require:

```bash
npx expo prebuild --clean
```

The correct process is simply:

```bash
Fix image
    ↓
Verify image dimensions
    ↓
Build again
```

For example:

```bash
file ios/LAMSInventoryScanner/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

then:

```bash
npx expo run:ios --device
```

---

# 22. General Troubleshooting Process

When an Xcode build reports:

```text
** BUILD FAILED **
```

do not rely only on the final summary.

Always inspect the actual error:

```bash
grep -n -B 15 -A 30 \
"CompileAssetCatalogVariant\|error:" \
.expo/xcodebuild.log | tail -100
```

The final:

```text
BUILD FAILED
```

only tells us that something failed.

The lines containing:

```text
error:
```

usually identify the actual problem.

---

# 23. Native vs JavaScript Changes

Use the following rule when deciding whether a rebuild is necessary.

## JavaScript / TypeScript Changes

For changes such as:

```text
.ts
.tsx
.js
.jsx
```

normally run:

```bash
npx expo start
```

Fast Refresh should update the application.

A native rebuild is generally not required.

---

## Environment Variable Changes

For JavaScript environment variables, normally restart Metro:

```bash
npx expo start --clear
```

The `.env.example` file itself is only a template/documentation file.

Changing `.env.example` does not normally require an iOS native rebuild.

Actual environment configuration should remain outside source control where appropriate.

---

## Native Configuration Changes

A native rebuild is required for changes involving things such as:

```text
Info.plist
AppDelegate.swift
Podfile
Podfile.properties.json
native iOS dependencies
native modules
iOS permissions
iOS deployment target
native Expo plugins
```

Use:

```bash
npx expo run:ios --device
```

---

## Expo Configuration Plugin Changes

If an `app.json` change is supposed to modify native iOS configuration, prebuild may be required:

```bash
npx expo prebuild --platform ios --no-install
```

Then:

```bash
npx pod-install
```

Then:

```bash
npx expo run:ios --device
```

Always review:

```bash
git status
git diff
```

after prebuild.

---

# 24. Recommended Development Workflow

### Normal daily development

Start Metro:

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"

npx expo start
```

Then use the development build.

---

### After JavaScript changes

Normally:

```text
Save file
    ↓
Fast Refresh
    ↓
Test
```

No native rebuild required.

---

### After native changes

Run:

```bash
npx expo run:ios --device
```

---

### After changing Expo native configuration

Run:

```bash
npx expo prebuild --platform ios --no-install
npx pod-install
npx expo run:ios --device
```

Then inspect:

```bash
git status
git diff
```

---

# 25. If Metro Gets Stuck

If Metro is still running with an old project path or stale process, find the process using port 8081:

```bash
lsof -i :8081
```

Then terminate the relevant process:

```bash
kill -9 <PID>
```

Start Metro again:

```bash
npx expo start
```

If necessary, clear Metro's cache:

```bash
npx expo start --clear
```

---

# 26. If Xcode Derived Data Becomes Stale

If the native project has been changed substantially and Xcode appears to be using stale build artifacts, derived data can be removed.

Using Xcode:

```text
Xcode
→ Settings
→ Locations
→ Derived Data
→ Open in Finder
```

The specific project's derived-data folder can then be removed.

Alternatively, the command-line build can be cleaned using Xcode's build tools.

Do this only when needed. Do not delete build artifacts as the first troubleshooting step for every error.

---

# 27. Git Safety Before Native Changes

Before running prebuild or making native changes:

```bash
git status
```

Then after the change:

```bash
git status
git diff
```

This is especially important because prebuild can modify multiple files.

Potentially modified files include:

```text
ios/
package.json
package-lock.json
app.json
Podfile
Podfile.lock
Info.plist
AppDelegate.swift
Expo.plist
SplashScreen.storyboard
Xcode project files
```

Review these changes before committing.

---

# 28. Important Lessons From This Upgrade

## Issue 1 — iOS 27 startup crash

### Symptom

```text
EXC_BREAKPOINT
UIKitCore
UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption
```

### Cause

The application was not correctly adopting the UIKit scene lifecycle required by the newer iOS/Xcode environment.

### Solution

Upgrade to Expo SDK 57 and enable:

```json
"enableSceneSupport": true
```

Then regenerate/synchronize the native iOS configuration.

---

## Issue 2 — Old project path

### Symptom

Metro looked for:

```text
/Users/shadanarif/Desktop/Github Repo/...
```

### Cause

The project had previously been located inside a directory containing a space, and stale development configuration/processes referenced the previous path.

### Solution

The project was moved to:

```text
/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app
```

Metro was restarted from the correct directory.

---

## Issue 3 — Native configuration after Expo upgrade

### Symptom

Expo Doctor warned about native folders and app configuration.

### Cause

This is a manually maintained native project with both:

```text
ios/
android/
```

and Expo configuration in:

```text
app.json
```

### Solution

Use Expo prebuild selectively and review native changes rather than blindly regenerating the project.

---

## Issue 4 — AppIcon build failure

### Symptom

```text
CompileAssetCatalogVariant thinned
```

### Actual cause

The AppIcon image was incorrectly sized.

Original:

```text
1023 × 1054
```

Later online resize:

```text
1024 × 989
```

Required:

```text
1024 × 1024
```

### Solution

Correct the actual PNG dimensions and verify them with:

```bash
file <icon-path>
```

before rebuilding.

---

# 29. Current State

The major iOS compatibility work has been completed:

* Expo upgraded to SDK 57.
* React Native upgraded to 0.86.3.
* React upgraded to 19.2.3.
* Expo build properties updated.
* iOS scene support enabled.
* iOS deployment target set to 16.4.
* Native AppDelegate regenerated for the Expo SDK 57 architecture.
* Scene configuration added to `Info.plist`.
* CocoaPods successfully installed.
* Project path moved to remove the old path containing a space.
* Existing privacy manifest preserved.
* Existing splash configuration preserved.
* Metro verified against the new project path.

The remaining build issue being addressed is the iOS AppIcon asset.

The problematic file is:

```text
ios/LAMSInventoryScanner/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

It must be exactly:

```text
1024 × 1024
```

After correcting and verifying the icon, rebuild using:

```bash
npx expo run:ios --device
```

---

# 30. Quick Reference Commands

### Start development

```bash
cd "/Users/shadanarif/Desktop/Github/inventory-scanner/iOS-app"
npx expo start
```

### Clear Metro cache

```bash
npx expo start --clear
```

### Install/update Expo-compatible packages

```bash
npx expo install --fix
```

### Check project health

```bash
npx expo-doctor
```

### Synchronize native iOS configuration

```bash
npx expo prebuild --platform ios --no-install
```

### Install CocoaPods

```bash
npx pod-install
```

### Build/install iOS development app

```bash
npx expo run:ios --device
```

### Check Git changes

```bash
git status
git diff
```

### Check AppIcon dimensions

```bash
file ios/LAMSInventoryScanner/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

### Check every AppIcon image

```bash
find ios/LAMSInventoryScanner/Images.xcassets/AppIcon.appiconset \
-type f \
\( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) \
-exec file {} \;
```

### Inspect Xcode build errors

```bash
grep -n -B 15 -A 30 \
"CompileAssetCatalogVariant\|error:" \
.expo/xcodebuild.log | tail -100
```

---

# 31. Rule of Thumb for Future Upgrades

When upgrading Expo or React Native:

```text
1. Check current Expo SDK
        ↓
2. Check Expo's supported React Native version
        ↓
3. Run expo install --fix
        ↓
4. Run expo-doctor
        ↓
5. Review native project changes
        ↓
6. Run pod-install if required
        ↓
7. Build with Xcode / expo run:ios
        ↓
8. Read the actual Xcode error
        ↓
9. Fix the specific native issue
        ↓
10. Rebuild
```

Do not assume that every `BUILD FAILED` message is an Expo or React Native problem.

In this upgrade, the problems were independent:

```text
iOS 27
   ↓
Scene lifecycle incompatibility
   ↓
Expo SDK 57 + scene support
   ↓
Resolved

Then:

AppIcon asset
   ↓
Invalid PNG dimensions
   ↓
Correct to 1024 × 1024
   ↓
Rebuild
```

Keeping these issues separate makes troubleshooting much faster and avoids unnecessary changes to the React Native application.
