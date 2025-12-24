import React from "react";
//
import NumberFlow from "@number-flow/react";

type TreasuryDigestCardProps = {
  className?: string;
  treasuryDeployedUsd: number;
  treasuryBalanceInUsd: number;
};

export const TreasuryDigestCard: React.FC<TreasuryDigestCardProps> = ({
  className = "",
  treasuryDeployedUsd,
  treasuryBalanceInUsd,
}) => {
  return (
    <div
      className={`w-full h-full rounded-[16px] bg-[#F1F4F9] ${className} overflow-hidden`}
    >
      <div className="px-6 pt-8 pb-0">
        {/* Header */}
        <div className="mb-4">
          <h3 className="font-bold text-[22px] leading-tight text-[#1F2937] mb-1">
            Treasury
          </h3>
          <p className="text-[16px] leading-[1.6] text-[#68778D] mt-0">
          Every single ETH from auctions goes straight into the DAO treasury, which is an immutable smart contract—no intermediaries, no gatekeepers, no one in control.
          </p>
        </div>

        <div className="rounded-[20px] border border-black bg-[#3888FD] sm:pt-3 sm:pr-3 sm:pl-3 sm:pb-0 pt-2 pr-4 pl-4 pb-0 h-[80px] flex items-center justify-center gap-4 overflow-hidden flex-1 m-0">
          <img
            src="/lilnoggles.svg"
            alt="Red Noggles"
            className="object-fill"
          />
          <div className="flex flex-row items-center justify-between bg-white h-[40px] px-6 border border-black rounded-[10px] gap-3">
            <span className="text-content-secondary text-[15px] font-extrabold">
              {"Treasury"}
            </span>
            <span className="font-bold text-[15px] text-[#111827] flex items-center">
              {"$"}
              <NumberFlow
                value={treasuryBalanceInUsd}
                format={{
                  notation:
                    treasuryBalanceInUsd > 9999 || treasuryBalanceInUsd < -9999
                      ? "compact"
                      : "standard",
                }}
              />
            </span>
          </div>
        </div>
      </div>

   
    </div>
  );
};
