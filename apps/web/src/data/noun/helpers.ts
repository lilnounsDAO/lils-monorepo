import { getNounData } from "@/utils/nounImages/nounImage";
import { AllNounsQuery } from "../generated/gql/graphql";
import { PonderNoun } from "@/data/ponder/nouns/types";
import { Noun } from "./types";
import { getAddress } from "viem";

function extractNameFromFileName(filename: string) {
  return filename.substring(filename.indexOf("-") + 1);
}

// Transform GraphQL query result to app Noun format
export function transformQueryNounToNoun(
  queryNoun: AllNounsQuery["nouns"][0],
): Omit<Noun, "secondaryListing"> {
  if (!queryNoun.seed) {
    throw new Error("Seed not found");
  }

  const seed = {
    background: Number(queryNoun.seed.background),
    body: Number(queryNoun.seed.body),
    accessory: Number(queryNoun.seed.accessory),
    head: Number(queryNoun.seed.head),
    glasses: Number(queryNoun.seed.glasses),
  };

  const { parts, background } = getNounData(seed);
  const [bodyPart, accessoryPart, headPart, glassesPart] = parts;

  return {
    id: queryNoun.id,
    owner: getAddress(queryNoun.owner.id),
    traits: {
      background: {
        seed: seed.background,
        name: queryNoun.seed.background == "0" ? "Cool" : "Warm",
      },
      body: {
        seed: seed.body,
        name: bodyPart?.filename || `Unknown Body ${seed.body}`,
      },
      accessory: {
        seed: seed.accessory,
        name: accessoryPart?.filename ? extractNameFromFileName(accessoryPart.filename) : `Unknown Accessory ${seed.accessory}`,
      },
      head: {
        seed: seed.head,
        name: headPart?.filename ? extractNameFromFileName(headPart.filename) : `Unknown Head ${seed.head}`,
      },
      glasses: {
        seed: seed.glasses,
        name: glassesPart?.filename ? extractNameFromFileName(glassesPart.filename) : `Unknown Glasses ${seed.glasses}`,
      },
    },
  };
}

// Transform VPS noun result to app Noun format
export function transformVpsNounToNoun(
  vpsNoun: any,
): Omit<Noun, "secondaryListing"> {
  const seed = {
    background: Number(vpsNoun.background),
    body: Number(vpsNoun.body),
    accessory: Number(vpsNoun.accessory),
    head: Number(vpsNoun.head),
    glasses: Number(vpsNoun.glasses),
  };

  const { parts, background } = getNounData(seed);
  const [bodyPart, accessoryPart, headPart, glassesPart] = parts;

  return {
    id: vpsNoun.id,
    owner: getAddress(vpsNoun.owner),
    traits: {
      background: {
        seed: seed.background,
        name: seed.background == 0 ? "Cool" : "Warm",
      },
      body: {
        seed: seed.body,
        name: bodyPart?.filename || `Unknown Body ${seed.body}`,
      },
      accessory: {
        seed: seed.accessory,
        name: accessoryPart?.filename ? extractNameFromFileName(accessoryPart.filename) : `Unknown Accessory ${seed.accessory}`,
      },
      head: {
        seed: seed.head,
        name: headPart?.filename ? extractNameFromFileName(headPart.filename) : `Unknown Head ${seed.head}`,
      },
      glasses: {
        seed: seed.glasses,
        name: glassesPart?.filename ? extractNameFromFileName(glassesPart.filename) : `Unknown Glasses ${seed.glasses}`,
      },
    },
  };
}

// Transform Ponder noun result to app Noun format
export function transformPonderNounToNoun(
  ponderNoun: PonderNoun,
): Omit<Noun, "secondaryListing"> {
  const seed = {
    background: Number(ponderNoun.background),
    body: Number(ponderNoun.body),
    accessory: Number(ponderNoun.accessory),
    head: Number(ponderNoun.head),
    glasses: Number(ponderNoun.glasses),
  };

  const { parts, background } = getNounData(seed);
  const [bodyPart, accessoryPart, headPart, glassesPart] = parts;

  return {
    id: ponderNoun.id,
    owner: getAddress(ponderNoun.owner),
    traits: {
      background: {
        seed: seed.background,
        name: seed.background == 0 ? "Cool" : "Warm",
      },
      body: {
        seed: seed.body,
        name: bodyPart?.filename || `Unknown Body ${seed.body}`,
      },
      accessory: {
        seed: seed.accessory,
        name: accessoryPart?.filename ? extractNameFromFileName(accessoryPart.filename) : `Unknown Accessory ${seed.accessory}`,
      },
      head: {
        seed: seed.head,
        name: headPart?.filename ? extractNameFromFileName(headPart.filename) : `Unknown Head ${seed.head}`,
      },
      glasses: {
        seed: seed.glasses,
        name: glassesPart?.filename ? extractNameFromFileName(glassesPart.filename) : `Unknown Glasses ${seed.glasses}`,
      },
    },
  };
}
