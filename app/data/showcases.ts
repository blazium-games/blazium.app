import { publicAsset } from "~/lib/publicAsset";
import type { ShowcaseInfo } from "~/types";

export const showcases: ShowcaseInfo[] = [{
  video: publicAsset("/videos/demonlord_clicker.webm"),
  name: "Demon Lord: Clicker",
  credits: [
    "Blazium Games",
    "Divine Games, Inc.",
    "Pogr, Inc.",
  ],
  link: {
    label: "Steam",
    url: "https://store.steampowered.com/app/1742110/Demon_Lord_Clicker",
  },
}, {
  video: publicAsset("/videos/penguin_kart_racer.webm"),
  name: "Penguin Kart Racer",
  credits: [
    "Scott Johnson",
  ],
  link: {
    label: "itch.io",
    url: "https://penguin-night.itch.io/penguin-kart-racer",
  },
}] as const;