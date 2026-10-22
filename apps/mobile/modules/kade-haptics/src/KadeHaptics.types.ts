export type ImpactStyle = "light" | "medium" | "heavy" | "soft" | "rigid";

export interface KadeHapticsNativeModule {
  isAvailable: boolean;
  impact(style: ImpactStyle): Promise<boolean>;
}
