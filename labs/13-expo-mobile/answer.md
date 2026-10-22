## Feature fit

One Devin session cannot run both simulators: the Android emulator needs a Linux (or any KVM-capable) VM, and the iOS Simulator only exists inside Xcode on macOS. The Devin features that close the gap are a Linux session with the Android emulator, a **macOS child session** (platform `macos`) for Xcode, and a **multi-document blueprint** where each document starts with `runs-on: linux` or `runs-on: macos`, so each platform gets its own snapshot. Expo's Continuous Native Generation keeps `android/` and `ios/` out of git, so both machines regenerate the same native projects from `app.json`.

## Worked approach

1. **Frame first (60 s).** "Customers will see packed and shipped on the order screen, on Android and iOS. The proof is the same order on both simulators, side by side."
2. **Android on the Linux session.** Check `ls -l /dev/kvm` and `emulator -list-avds`. Boot headless: `emulator -avd <avd> -no-window -gpu swiftshader_indirect -no-snapshot -accel on`, then `adb wait-for-device` and poll `getprop sys.boot_completed`.
3. `cd apps/mobile && npx expo run:android --variant release` — this runs `expo prebuild` (generates `android/`), Gradle, and installs on the emulator. Release bundles the JS, so no Metro server has to stay up.
4. Drive the flow: pick Lumen Home → add an item → Cart says `Haptics: JS fallback (no-op)` → Orders → open a `packed`/`shipped` order. `adb exec-out screencap -p > order-android.png`.
5. **iOS on a macOS child.** Start one child session with platform `macos`, hand it a self-contained brief (branch name, commands, what to screenshot) and wait with `notify_on_response`. On the Mac: `export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` (the reference Mac had GA Xcode 26.6 and a 27.0 RC; pin the GA one), `npx expo prebuild --platform ios --no-install`, `cd ios && pod install`, `grep KadeHaptics ios/Podfile.lock`, then `npx expo run:ios --configuration Release` or the equivalent `xcodebuild -workspace ios/KadCommerce.xcworkspace -scheme KadCommerce -sdk iphonesimulator -configuration Release build`, `xcrun simctl install booted …`, `xcrun simctl io booted screenshot order-ios.png`.
6. **Blueprint.** Put only the commands that worked into two documents separated by `---`: Linux (Node 22, Android SDK, AVD, `npm ci`) and macOS (Node 22, Xcode selection, CocoaPods, `npm ci`, `expo prebuild --platform ios`, `pod install`). Apply it so the next session boots from the right snapshot.
7. **Update (3 min).** Outcome → evidence per platform → risks (snapshot mismatch, prebuild drift, physical-device feel untested) → next action → one ask.

Reference run (course build, 22 Oct 2026): `labs/13-expo-mobile/evidence/README.md` and the screenshots next to it. Lumen Home order `LH-001004` is `packed` and `LH-001003` is `shipped` in the mock seed.

## The injectors

- **snapshot-mismatch** — The snapshot predates the SDK step. Installing by hand works for you once; the next engineer pays again. Fix the Linux document of the blueprint, rebuild the snapshot, and say so in the update.
- **prebuild-drift** — `android/` was generated from the old `app.json`. Recover with `npx expo prebuild --clean --platform android` (or delete `android/`), never by editing the generated project. Detect it by diffing `app.json` against the generated `applicationId`.
- **ios-only-native-dependency** — `expo-module.config.json` lists only `apple`, and `requireOptionalNativeModule("KadeHaptics")` returns `null` on Android, so `impact()` returns `false`. No `Platform.OS` branch is needed, and a missing module never throws.
- **xcode-version** — Expo SDK 54 needs Xcode 16.1+. Pin it with `DEVELOPER_DIR` in the macOS document; `xcode-select -s` needs sudo and is global. The reference Mac had GA Xcode 26.6 plus a 27.0 RC; the GA one matched an installed Simulator runtime.
- **Podspec deployment target (found in the reference run)** — `KadeHaptics` was silently missing from `Podfile.lock` because its podspec asked for iOS 16.4 while the generated Podfile targets 15.1. `expo-modules-autolinking resolve` listed it, `use_expo_modules!` skipped it. Matching the podspec to 15.1 fixed it — always grep `Podfile.lock` before claiming the native module is in.

## Pitfalls

- Starting with "I set up Gradle and CocoaPods…" — the product owner hears toolchain, not customers.
- Trying to run the iOS Simulator on Linux, or the Android emulator without `/dev/kvm` (it boots in 10+ minutes, if at all).
- Committing `android/` or `ios/` "to save time": the next prebuild silently disagrees with them.
- Calling the Simulator haptic "tested". The Simulator proves the module is linked and called; the feel needs a physical iPhone.
- One blueprint document for both platforms: the macOS commands fail on Linux and vice versa.
- Keeping the Mac session alive while writing the report.

## Recovery moves

- Emulator stuck: `adb kill-server`, restart with `-no-snapshot -wipe-data`.
- Gradle out of memory on a small VM: `org.gradle.jvmargs=-Xmx4g` via `app.json` `expo-build-properties`, not by editing `android/`.
- `pod install` fails on the Mac: `pod repo update`, then re-run prebuild with `--clean`.
- No macOS access: ship the Android half and list items 6–8 under "not exercised"; that is a complete answer.

## Model answers to the objections

- **"macOS minutes are expensive."** — "I acknowledge that; Mac time costs more than Linux time. The boundary is that only the iOS build and the screenshots need the Mac; Android, tests, lint and the report all run on Linux. The evidence: in the reference run the macOS child was busy for well under an hour and stopped as soon as it pushed. I can offer to run the iOS check only on release candidates, not on every change."
- **"Why can't one VM do both?"** — "Fair question. The boundary is the vendors: Apple only ships the iOS Simulator inside Xcode on macOS, and the Android emulator needs KVM, which a macOS VM does not give us in the same way. The evidence is the blueprint: two documents, `runs-on: linux` and `runs-on: macos`, one snapshot each. I can offer one PR and one report that covers both, even though two machines did the work."

## Debrief

- Did your first sentence name the customer outcome on both platforms?
- Did you show the same order on both screens, or two different things?
- Could the next engineer boot both machines from your blueprint without asking you?
- Did you say what the Simulator cannot prove?
- How long did the Mac run, and could it have been shorter?

## References

- Devin docs — Environment configuration: https://docs.devin.ai/onboard-devin/environment-yaml
- Expo — Continuous Native Generation: https://docs.expo.dev/workflow/continuous-native-generation/
- Expo — Modules API: https://docs.expo.dev/modules/overview/
- Android — Emulator acceleration: https://developer.android.com/studio/run/emulator-acceleration
