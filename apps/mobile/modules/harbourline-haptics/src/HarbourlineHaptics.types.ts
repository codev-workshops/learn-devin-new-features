export type ImpactStyle = "light" | "medium" | "heavy" | "soft" | "rigid";

export interface HarbourlineHapticsNativeModule {
  isAvailable: boolean;
  impact(style: ImpactStyle): Promise<boolean>;
}
