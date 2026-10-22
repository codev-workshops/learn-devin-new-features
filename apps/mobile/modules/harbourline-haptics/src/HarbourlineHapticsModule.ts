import { requireOptionalNativeModule } from "expo-modules-core";

import type { HarbourlineHapticsNativeModule } from "./HarbourlineHaptics.types";

// `null` on Android, web, Expo Go and any build that did not compile the Swift module.
export default requireOptionalNativeModule<HarbourlineHapticsNativeModule>("HarbourlineHaptics");
