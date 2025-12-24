import { getNounById } from "@/data/noun/getNounById";
import { ImageResponse } from "@/types/og";
import { loadGoogleFont, localImageSrc } from "@/utils/og";
import { buildSVG } from "@nouns/sdk";
import { imageData } from "@/utils/nounImages/imageData";

// Background colors: seed 0 = cool (#d5d7e1), seed 1 = warm (#e1d7d5)
const BG_COLORS = {
  cool: "#d5d7e1",
  warm: "#e1d7d5",
};

function getNounSVG(noun: { traits: { background: { seed: number }; body: { seed: number }; accessory: { seed: number }; head: { seed: number }; glasses: { seed: number } } }): string {
  const { bgcolors } = imageData;
  const { bodies, accessories, heads, glasses } = imageData.images;
  
  const parts = [
    bodies[noun.traits.body.seed],
    accessories[noun.traits.accessory.seed],
    heads[noun.traits.head.seed],
    glasses[noun.traits.glasses.seed],
  ];
  
  const background = bgcolors[noun.traits.background.seed];
  
  return buildSVG(parts, imageData.palette, background);
}

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const noun = await getNounById(params.id);
  
  if (!noun) {
    return new Response(`Noun ${params.id} not found`, {
      status: 404,
    });
  }

  // Get background color based on seed
  const bgColor = noun.traits.background.seed === 1 ? BG_COLORS.warm : BG_COLORS.cool;
  
  // Get noun SVG and convert to data URI
  const nounSVG = getNounSVG(noun);
  const nounImageDataUri = `data:image/svg+xml;base64,${Buffer.from(nounSVG).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        tw="w-full h-full flex items-center justify-center relative"
        style={{
          backgroundColor: bgColor,
        }}
      >
        {/* Noun Image */}
        <div
          tw="flex items-center justify-center"
          style={{
            width: "600px",
            height: "600px",
          }}
        >
          <img
            src={nounImageDataUri}
            width={600}
            height={600}
            alt={`Lil Noun ${noun.id}`}
            tw="object-contain"
          />
        </div>
        
        {/* Overlay with noun ID and branding */}
        <div
          tw="absolute inset-0 flex flex-col items-center justify-end pb-16"
          style={{
            background: `linear-gradient(to top, ${bgColor}dd 0%, transparent 100%)`,
          }}
        >
          <div tw="flex items-center gap-4 mb-4">
            <img
              src={localImageSrc("/lilnouns-icon.png")}
              width={60}
              height={60}
              alt="Lil Nouns"
              tw="rounded-full"
            />
            <span tw="text-4xl font-bold" style={{ color: "#212529" }}>
              Lil Noun #{noun.id}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Londrina",
          data: await loadGoogleFont(
            "Londrina Solid",
            `Lil Noun ${noun.id}`,
          ),
          style: "normal",
        },
      ],
    },
  );
}

