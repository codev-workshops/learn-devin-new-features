# Kadé Commerce — mobile (Expo)

Shopping app for the two Kadé brands against the frozen OpenAPI contract: pick a brand, browse
collections, add to cart (with iOS haptics when the optional native module is linked), and follow
order status through the event timeline.

## Run

```bash
nvm use 22 && npm install                      # from the repo root
cd apps/mobile
npx expo start                                 # Metro; press `a` with an emulator running
npx expo run:android                           # development build on the connected emulator
EXPO_PUBLIC_API_MODE=live npx expo start       # talk to services/api instead of the in-app mock
```

The default `mock` mode needs no backend: `MockStore` serves `packages/contracts/seed-spec.yaml`
(60 SKUs, Lamp Week pricing, Trailhead VAT-inclusive totals, deterministic order history) through
the same typed client the live mode uses.

## Verify

```bash
npm test && npm run lint && npm run build
```

## Android emulator (Linux, KVM)

```bash
export ANDROID_HOME=$HOME/android-sdk
$ANDROID_HOME/emulator/emulator -avd <avd> -no-window -gpu swiftshader_indirect -no-audio -no-boot-anim -accel on &
adb wait-for-device && npx expo run:android
```

## iOS (not exercised here)

`modules/kade-haptics` wraps `UIImpactFeedbackGenerator` behind the Expo Modules API. It only
compiles on macOS; see `docs/blueprint.proposed.mobile.yaml` (second document) for the recipe.
On Android, web, Expo Go and any build without the module, `impact()` resolves `false` and the app
keeps working.
