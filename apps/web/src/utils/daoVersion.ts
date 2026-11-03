import { getAddress, zeroAddress, type Address } from "viem";
import { CHAIN_CONFIG } from "@/config";

function isLiveAddress(addr?: string): addr is Address {
  if (!addr) return false;
  try {
    return getAddress(addr) !== zeroAddress;
  } catch {
    return false;
  }
}

function sameAddress(a?: string, b?: string): boolean {
  if (!isLiveAddress(a) || !isLiveAddress(b)) return false;
  return getAddress(a) === getAddress(b);
}

/** True when this chain is configured with a real V5 logic implementation. */
export function hasV5Logic(): boolean {
  return isLiveAddress(CHAIN_CONFIG.addresses.nounsDAOLogicV5);
}

/**
 * True when a distinct NounsDAOData proxy is configured.
 * Mainnet Lil currently points nounsDAODataProxy at the DAO proxy itself — that is not Data.
 */
export function hasDaoDataContract(): boolean {
  const data = CHAIN_CONFIG.addresses.nounsDAODataProxy;
  const dao = CHAIN_CONFIG.addresses.nounsDaoProxy;
  return isLiveAddress(data) && !sameAddress(data, dao);
}

/**
 * Candidates + topics are available when the live contracts support them.
 * Env `VITE_DAO_VERSION` is only a fallback for local work without those addresses.
 */
export function isDaoVersion5(): boolean {
  if (hasV5Logic() || hasDaoDataContract()) return true;
  const version = import.meta.env.VITE_DAO_VERSION;
  if (version) {
    const parsed = parseInt(version, 10);
    if (!isNaN(parsed)) return parsed === 5;
  }
  return false;
}

export function getDaoVersion(): number {
  return isDaoVersion5() ? 5 : 2;
}
