You are done when all of the following are observable by someone who was not on the call. Items 1–5 and 9–11 can be met on Linux with zero credentials; items 6–8 need a macOS machine and are optional.

1. **Android build.** A Release (or development) build of `apps/mobile` is installed on an Android emulator started with KVM acceleration. The emulator command line and `adb devices` output are in `labs/13-expo-mobile/MOBILE-REPORT.md`.
2. **Android order status.** A screenshot of the order-detail screen for a `packed` or `shipped` order (status pill and timeline visible), taken with `adb exec-out screencap -p`.
3. **Android fallback.** A screenshot of the Cart tab showing `Haptics: JS fallback (no-op)` after adding an item, so the native module's absence is visible and harmless.
4. **Generated native folders stay generated.** `git status` shows no `apps/mobile/android/` or `apps/mobile/ios/` files, and the report says how you would detect and recover from prebuild drift.
5. **Gates.** `pnpm test`, `pnpm lint` and `pnpm build` in the `apps/mobile` workspace pass; paste the summary lines.
6. **iOS build (optional).** The same app built for the iOS Simulator on a macOS machine. The report names the Xcode version and how it was selected (`DEVELOPER_DIR` or `xcode-select`).
7. **iOS order status (optional).** A Simulator screenshot of the same order in the same status as item 2.
8. **Native module (optional).** A Simulator screenshot of the Cart tab showing `Haptics: native (harbourline-haptics)`, and the line in `ios/Podfile.lock` that proves `HarbourlineHaptics` was autolinked.
9. **Reproducible setup.** A blueprint (or a proposed one in the report) with one document per platform, each starting with its `runs-on:` line, containing only commands you actually ran. Say which document a future Android session and a future iOS session would boot from.
10. **Credential and platform honesty.** A short "not exercised" list: at least physical-device haptics and store signing, plus anything else you skipped.
11. **Articulation drill completed** with the voice coach (section 8) or against a timer, and the gap report (or your self-score) saved as `labs/13-expo-mobile/MOBILE-REPORT.coach.md`. Do not commit it.
