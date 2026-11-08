import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Address, getAddress } from "viem";
import { Button } from "@/components/ui/button";
import { RefundBalanceNotice } from "@/components/RefundBalanceNotice";
import { LinkExternal } from "@/components/ui/link";
import { CHAIN_SPECIFIC_CONFIGS } from "@/config";
import { detectChainFromHostname } from "@/utils/networkDetection";
import {
  CONTRACT_GROUPS,
  ContractNetwork,
  explorerUrl,
  getCatalogAddress,
  isDeployed,
  networkLabel,
} from "@/data/contracts/catalog";

const ERC1967_IMPL_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc" as const;

const IMPLEMENTATION_ABI = [
  {
    name: "implementation",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;

const PROXY_ADMIN_ABI = [
  {
    name: "getProxyImplementation",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "proxy", type: "address" }],
    outputs: [{ type: "address" }],
  },
] as const;

function shortAddr(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const NETWORKS: ContractNetwork[] = ["1", "11155111"];

export default function ContractsPage() {
  const defaultNetwork: ContractNetwork =
    detectChainFromHostname() === 11155111 ? "11155111" : "1";
  const [network, setNetwork] = useState<ContractNetwork>(defaultNetwork);
  const [copied, setCopied] = useState<string | null>(null);
  const [proxyImpls, setProxyImpls] = useState<Record<string, string>>({});

  const groups = useMemo(() => {
    return CONTRACT_GROUPS.map((group) => {
      const seen = new Set<string>();
      const entries = group.entries
        .map((entry) => {
          const address = getCatalogAddress(network, entry.key);
          const note = typeof entry.note === "string" ? entry.note : entry.note?.[network];
          return { ...entry, address, note };
        })
        .filter((entry) => {
          if (!entry.address) return false;
          const id = entry.address.toLowerCase() + entry.name;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      return { ...group, entries };
    }).filter((group) => group.entries.length > 0);
  }, [network]);

  useEffect(() => {
    let cancelled = false;
    const client = CHAIN_SPECIFIC_CONFIGS[Number(network)]?.publicClient;
    if (!client) return;

    const load = async () => {
      const next: Record<string, string> = {};
      const readSlot = async (proxy: Address) => {
        const slot = await client.getStorageAt({ address: proxy, slot: ERC1967_IMPL_SLOT });
        if (!slot || slot === "0x" || /^0x0+$/.test(slot)) return undefined;
        return getAddress(`0x${slot.slice(-40)}`);
      };

      const dao = getCatalogAddress(network, "nounsDAOProxy");
      if (isDeployed(dao)) {
        try {
          next.nounsDAOProxy = await client.readContract({
            address: dao as Address,
            abi: IMPLEMENTATION_ABI,
            functionName: "implementation",
          });
        } catch {
          const impl = await readSlot(dao as Address).catch(() => undefined);
          if (impl) next.nounsDAOProxy = impl;
        }
      }

      const ah = getCatalogAddress(network, "nounsAuctionHouseProxy");
      const ahAdmin = getCatalogAddress(network, "nounsAuctionHouseProxyAdmin");
      if (isDeployed(ah) && isDeployed(ahAdmin)) {
        try {
          next.nounsAuctionHouseProxy = await client.readContract({
            address: ahAdmin as Address,
            abi: PROXY_ADMIN_ABI,
            functionName: "getProxyImplementation",
            args: [ah as Address],
          });
        } catch {
          const impl = await readSlot(ah as Address).catch(() => undefined);
          if (impl) next.nounsAuctionHouseProxy = impl;
        }
      }

      for (const key of ["lilVRGDAProxy", "nounsDAODataProxy"] as const) {
        const proxy = getCatalogAddress(network, key);
        if (!isDeployed(proxy)) continue;
        const impl = await readSlot(proxy as Address).catch(() => undefined);
        if (impl) next[key] = impl;
      }

      if (!cancelled) setProxyImpls(next);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [network]);

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(address);
    window.setTimeout(() => setCopied((current) => (current === address ? null : current)), 1500);
  };

  return (
    <>
      <Helmet>
        <title>Contracts | Lil Nouns DAO</title>
        <meta
          name="description"
          content="Lil Nouns DAO contract addresses on Ethereum mainnet and Sepolia."
        />
      </Helmet>

      <div className="flex w-full max-w-[1400px] mx-auto flex-col gap-8 p-6 pb-20 md:gap-10 md:p-10 md:pb-20">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3>Contracts</h3>
            <p className="text-content-secondary">
              Live addresses for Lil Nouns on mainnet and the Sepolia rehearsal suite. Click through to Etherscan.
            </p>
          </div>

          <RefundBalanceNotice showWhenHealthy />

          <div className="flex flex-wrap gap-3">
            {NETWORKS.map((id) => (
              <Button
                key={id}
                variant={network === id ? "primary" : "secondary"}
                size="default"
                onClick={() => setNetwork(id)}
              >
                {networkLabel(id)}
              </Button>
            ))}
          </div>
        </div>

        {groups.map((group) => (
          <div key={group.title} className="flex w-full flex-col gap-3">
            <h4 className="text-xl font-bold text-content-primary">{group.title}</h4>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {group.entries.map((entry, index) => {
                const deployed = isDeployed(entry.address);
                return (
                  <div
                    key={`${group.title}-${entry.key}`}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      index > 0 ? "border-t border-gray-200" : ""
                    }`}
                  >
                    <div className="w-36 shrink-0 sm:w-52">
                      <p className="truncate text-sm font-bold text-gray-900">{entry.name}</p>
                      {(entry.note || proxyImpls[entry.key]) && (
                        <p className="truncate text-xs text-content-secondary">
                          {entry.note}
                          {proxyImpls[entry.key] &&
                            `${entry.note ? " · " : ""}impl ${shortAddr(proxyImpls[entry.key])}`}
                        </p>
                      )}
                    </div>

                    <p
                      title={deployed ? entry.address : undefined}
                      className="min-w-0 flex-1 truncate font-mono text-xs text-gray-700 md:text-sm"
                    >
                      {deployed ? entry.address : "Not deployed"}
                    </p>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-slim"
                        disabled={!deployed}
                        onClick={() => deployed && copyAddress(entry.address!)}
                        aria-label={copied === entry.address ? "Copied" : "Copy address"}
                      >
                        {copied === entry.address ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                      {deployed ? (
                        <LinkExternal
                          href={explorerUrl(network, entry.address!)}
                          aria-label={`Open ${entry.name} on Etherscan`}
                          className="inline-flex items-center justify-center rounded-xl p-1 text-content-primary hover:bg-background-secondary hover:brightness-100"
                        >
                          <ExternalLink size={16} />
                        </LinkExternal>
                      ) : (
                        <Button variant="ghost" size="icon-slim" disabled aria-label="Etherscan">
                          <ExternalLink size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
