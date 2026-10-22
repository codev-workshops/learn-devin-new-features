# Harbourline — mobile (Expo)

Shopping app for the two Harbourline brands against the frozen OpenAPI contract: pick a brand, browse
collections, add to cart (with iOS haptics when the optional native module is linked), and follow
order status through the event timeline.

## Run

```bash
nvm use 22 && pnpm install                      # from the repo root
cd apps/mobile
pnpm exec expo start                                 # Metro; press `a` with an emulator running
pnpm exec expo run:android                           # development build on the connected emulator
EXPO_PUBLIC_API_MODE=live pnpm exec expo start       # talk to services/api instead of the in-app mock
```

The default `mock` mode needs no backend: `MockStore` serves `packages/contracts/seed-spec.yaml`
(60 SKUs, Lamp Week pricing, Trailhead VAT-inclusive totals, deterministic order history) through
the same typed client the live mode uses.

## Verify

```bash
pnpm test && pnpm lint && pnpm build
```

## Android emulator (Linux, KVM)

```bash
export ANDROID_HOME=$HOME/android-sdk
$ANDROID_HOME/emulator/emulator -avd <avd> -no-window -gpu swiftshader_indirect -no-audio -no-boot-anim -accel on &
adb wait-for-device && pnpm exec expo run:android
```

## iOS (not exercised here)

`modules/harbourline-haptics` wraps `UIImpactFeedbackGenerator` behind the Expo Modules API. It only
compiles on macOS; see `docs/blueprint.proposed.mobile.yaml` (second document) for the recipe.
On Android, web, Expo Go and any build without the module, `impact()` resolves `false` and the app
keeps working.
