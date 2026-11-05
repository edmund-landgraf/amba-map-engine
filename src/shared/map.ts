export type Provider = "watabou" | "gozzys" | "amba-native";
export type Profile = "dungeon" | "cave" | "wilderness";
export type LabelMode = "off" | "numbers" | "names";
export type MapStyle = "tactical" | "old-school" | "stone" | "wilderness";

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
  labelMode: LabelMode;
  showTitle: boolean;
  showProps: boolean;
  waterLevel: number;
  style: MapStyle;
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
    doors: Array<{ x: number; y: number; orientation: "vertical" | "horizontal"; state: "closed" }>;
    roomAnchors: Array<{ id: string; number: number; x: number; y: number }>;
  };
  capabilities: {
    preview: true;
    deterministic: true;
    provider: Provider;
    editableTopology: boolean;
  };
};
