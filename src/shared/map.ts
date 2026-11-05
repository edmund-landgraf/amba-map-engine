export type Provider = "watabou" | "gozzys" | "amba-native";
export type Profile = "dungeon" | "cave" | "glade";

export type MapRequest = {
  title?: string;
  seed: string;
  provider: Provider;
  profile: Profile;
  width: number;
  height: number;
  density: number;
  grid: boolean;
};

export type GeneratedMap = MapRequest & {
  svg: string;
  createdAt: string;
  capabilities: {
    preview: true;
    deterministic: true;
    provider: Provider;
    editableTopology: boolean;
  };
};
