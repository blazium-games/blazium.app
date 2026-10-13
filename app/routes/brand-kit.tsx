import type { Route } from "./+types/brand-kit";
import style from "css/brand-kit.module.css";
import { MetaTags } from "comps/metatags";
import { publicAsset } from "~/lib/publicAsset";

const PATH = publicAsset("/images/Brand Kit");

export async function markdown() {
  const content = 
`> For an index of all blazium.app content, see [/llms.txt](/llms.txt).

# Blazium Engine brand kit

## Logo

![](${PATH}/Logo/SVG/Blazium_Logo.svg)
![](${PATH}/Logo/SVG/Blazium_Logo_White_Outline.svg)
![](${PATH}/Logo/SVG/Blazium_Logo_Black_Outline.svg)

## Horizontal

![](${PATH}/Logo & Wordmark (horizontal)/SVG/Blazium_Logo_Light_Text.svg)
![](${PATH}/Logo & Wordmark (horizontal)/SVG/Blazium_Logo_Dark_Text.svg)
![](${PATH}/Logo & Wordmark (horizontal)/SVG/Blazium_Logo_White_Outline.svg)
![](${PATH}/Logo & Wordmark (horizontal)/SVG/Blazium_Logo_Black_Outline.svg)

## Vertical

![](${PATH}/Logo & Wordmark (vertical)/SVG/Blazium_Logo_Light_Text.svg)
![](${PATH}/Logo & Wordmark (vertical)/SVG/Blazium_Logo_Dark_Text.svg)
![](${PATH}/Logo & Wordmark (vertical)/SVG/Blazium_Logo_White_Outline.svg)
![](${PATH}/Logo & Wordmark (vertical)/SVG/Blazium_Logo_Black_Outline.svg)
`;
  return content;
}

export default ({ }: Route.ComponentProps) => {
  return <>
    <MetaTags />
    <main className={style["main"]}>
      <h1>Brand Kit</h1>
      <section>
        <h2>Logo</h2>
        <div>
          <img src={`${PATH}/Logo/SVG/Blazium_Logo.svg`} alt="1" className={style["light_bg"]} />
          <img src={`${PATH}/Logo/SVG/Blazium_Logo_White_Outline.svg`} alt="1" className={style["dark_bg"]} />
          <img src={`${PATH}/Logo/SVG/Blazium_Logo_Black_Outline.svg`} alt="1" className={style["light_bg"]} />
        </div>
      </section>
      <section>
        <h2>Horizontal</h2>
        <div>
          <img src={`${PATH}/Logo & Wordmark (horizontal)/SVG/Blazium_Logo_Light_Text.svg`} alt="1" className={style["dark_bg"]} />
          <img src={`${PATH}/Logo & Wordmark (horizontal)/SVG/Blazium_Logo_Dark_Text.svg`} alt="1" className={style["light_bg"]} />
          <img src={`${PATH}/Logo & Wordmark (horizontal)/SVG/Blazium_Logo_White_Outline.svg`} alt="1" className={style["dark_bg"]} />
          <img src={`${PATH}/Logo & Wordmark (horizontal)/SVG/Blazium_Logo_Black_Outline.svg`} alt="1" className={style["light_bg"]} />
        </div>
      </section>
      <section>
        <h2>Vertical</h2>
        <div>
          <img src={`${PATH}/Logo & Wordmark (vertical)/SVG/Blazium_Logo_Light_Text.svg`} alt="1" className={style["dark_bg"]} />
          <img src={`${PATH}/Logo & Wordmark (vertical)/SVG/Blazium_Logo_Dark_Text.svg`} alt="1" className={style["light_bg"]} />
          <img src={`${PATH}/Logo & Wordmark (vertical)/SVG/Blazium_Logo_White_Outline.svg`} alt="1" className={style["dark_bg"]} />
          <img src={`${PATH}/Logo & Wordmark (vertical)/SVG/Blazium_Logo_Black_Outline.svg`} alt="1" className={style["light_bg"]} />
        </div>
      </section>
    </main>
  </>
}