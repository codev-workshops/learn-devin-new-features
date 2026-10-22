import type { ImpactStyle, KadeHapticsNativeModule } from "./src/KadeHaptics.types";
import NativeModule from "./src/KadeHapticsModule";

export type { ImpactStyle };

/** Whether the Swift module is linked into this binary (iOS development builds only). */
export function isNativeHapticsAvailable(
  nativeModule: KadeHapticsNativeModule | null = NativeModule,
) {
  return nativeModule !== null && nativeModule.isAvailable === true;
}

/**
 * Fire an impact. Returns `true` when the native generator ran and `false` when the JS fallback
 * (a no-op) was used, so Android keeps working without the module.
 */
export async function impact(
  style: ImpactStyle = "medium",
  nativeModule: KadeHapticsNativeModule | null = NativeModule,
): Promise<boolean> {
  if (!isNativeHapticsAvailable(nativeModule) || nativeModule === null) return false;
  try {
    return await nativeModule.impact(style);
  } catch {
    return false;
  }
}
