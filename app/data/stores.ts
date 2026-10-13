import type { DigitalStore } from "~/types";
import { FaItchIo } from "react-icons/fa6";

export const digitalStores: DigitalStore[] = [{
  name: "itch.io",
  download_url: "https://blaziumengine.itch.io/blazium-engine",
  icon: FaItchIo,
}] as const;