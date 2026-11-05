export type Provider = "watabou" | "gozzys" | "amba-native";
export type Profile = "dungeon" | "cave" | "wilderness";

export type MapRequest = {
  title?: string;
  seed: string;
  provider: Provider;
  profile: Profile;
  width: number;
  height: number;
  density: number;
  grid: boolean;
  cellSize: number;
  scaleFeet: number;
};

export type GeneratedMap = MapRequest & {
  svg: string;
  createdAt: string;
  foundry: {
    sceneWidthPx: number;
    sceneHeightPx: number;
    gridSizePx: number;
    gridDistance: number;
    gridUnits: "ft";
  };
  capabilities: {
    preview: true;
    deterministic: true;
    provider: Provider;
    editableTopology: boolean;
  };
};
