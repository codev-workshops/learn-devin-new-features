# W4-13 iOS evidence — Expo mobile on the iOS Simulator

Date: 2026-10-22 (W4-13 macOS child). Branch `devin/lab-13-expo-mobile-ios`, cut from `devin/lab-13-expo-mobile`.

| Item | Value |
| --- | --- |
| macOS | 26.6.2 (25G83), Apple silicon VM (arm64) |
| Xcode | 26.6 (17F113), iOS / iOS Simulator SDK 26.5 |
| `xcode-select -p` | `/Applications/Xcode.app/Contents/Developer` |
| `DEVELOPER_DIR` | unset (so the `xcode-select` path above is used) |
| Simulator runtimes | iOS 26.5 (23F73), iOS 27.0 (24A434) |
| Simulator used | iPhone 17, iOS 26.5 (`EDD9B083-63F1-44E6-9A7B-0A6964CC2561`) |
| Node | 22.23.4 (Homebrew `node@22`; the image default is Node 20) |
| CocoaPods | 1.17.0 (Homebrew, already installed) |

Xcode choice: Expo SDK 54 / RN 0.81 needs 16.1+. Also installed: `/Applications/Xcode-27.0-RC.app` (27A266a).
GA Xcode 26.6 is the `xcode-select` default and its iOS 26.5 SDK matches an installed runtime; RC unused.

## Commands that worked (in order, from the repo root unless noted)

| # | Command | Wall clock |
| --- | --- | --- |
| 1 | `brew install node@22` then `export PATH="$(brew --prefix node@22)/bin:$PATH"` | 36 s |
| 2 | `pnpm install` | 8 s |
| 3 | `pnpm --filter @harbourline/mobile test` (35/35), `pnpm --filter @harbourline/mobile run lint`, `pnpm --filter @harbourline/mobile run build` | 5 s / 4 s / 10 s |
| 4 | `cd apps/mobile && pnpm exec expo prebuild --platform ios --no-install` | 1.2 s |
| 5 | `cd apps/mobile/ios && LANG=en_US.UTF-8 pod install` | 27 s first, 8.5 s after the podspec fix |
| 6 | `xcodebuild -workspace ios/Harbourline.xcworkspace -scheme Harbourline -sdk iphonesimulator -configuration Release -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.5' -derivedDataPath ios/build build` | 88 s first (arm64 + x86_64), 48 s incremental |
| 7 | `xcrun simctl install booted ios/build/Build/Products/Release-iphonesimulator/Harbourline.app && xcrun simctl launch booted test.harbourline.commerce` | < 5 s |
| 8 | `xcrun simctl io booted screenshot <file>.png && sips -Z 1200 <file>.png` | — |

Release embeds the JS bundle (mock API mode), so no Metro was needed. UI driven by clicks in Simulator:
Lumen Home → Add (Arc Floor Lamp) → Cart tab → Orders tab → LH-001003 `Shipped`.

## Errors hit and fixes

1. **`HarbourlineHaptics` missing from `Podfile.lock`.** `expo-modules-autolinking resolve -p apple`
   listed `harbourline-haptics` (pod `HarbourlineHaptics`, `modules/harbourline-haptics/ios`), but `use_expo_modules!`
   silently skipped it: the podspec declared `platforms = { :ios => '16.4' }` while the generated
   Podfile targets iOS 15.1, so `supports_platform?` was false. Fix: podspec `:ios => '15.1'`
   (same floor as `ExpoModulesCore`; every API used exists since iOS 13) and an explicit
   `swift_version = '5.9'`. After `pod install`: `Installing HarbourlineHaptics (0.1.0)` and
   `HarbourlineHaptics (from ../modules/harbourline-haptics/ios)` in `Podfile.lock` — **autolinked: yes**.
2. **Swift deprecation warning** `'Constants' is deprecated: Use Constant or Property instead`
   (ExpoModulesCore 3.0). Replaced with `Constant("isAvailable") { true }`; rebuild has zero
   warnings in `HarbourlineHapticsModule.swift`. JS still reads `NativeModule.isAvailable`; the Android
   fallback (`requireOptionalNativeModule` → `null` → `impact()` resolves `false`) is untouched.

## Result

`01-brand-picker.png` (brand picker), `02-cart-haptics-native.png` (Cart shows
**`Haptics: native (harbourline-haptics)`**), `03-order-status.png` (LH-001003, `Shipped` pill + timeline).

## Not exercised

- Haptic feel: the Simulator cannot vibrate; only `isAvailable` and the `impact` call path ran.
- Physical device, code signing, provisioning, TestFlight / App Store.
- `pnpm exec expo run:ios` and the Debug configuration with Metro (xcodebuild Release was used instead).
- Xcode 27.0 RC / iOS 27.0 runtime; live API mode against `services/api`.
- Installing CocoaPods from scratch (it was already present via Homebrew).
