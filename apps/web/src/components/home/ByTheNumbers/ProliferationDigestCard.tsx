import React from "react";

type ProliferationDigestCardProps = {
  className?: string;
};

export const ProliferationDigestCard: React.FC<
  ProliferationDigestCardProps
> = ({ className = "" }) => {
  return (
    <div
      className={`w-full h-full rounded-[16px] bg-[#F1F4F9] px-6 pt-6 pb-4 ${className} overflow-hidden`}
    >
      {/* Header */}
      <div className="pb-3">
        <h3 className="font-bold text-[22px] leading-tight text-[#1F2937] mb-1">
        Unrestricted, headless brand
        </h3>
        <p className="text-[16px] leading-[1.6] text-[#68778D] mt-0">
        All this to fund the world's first truly headless, permissionless brand. We the people, for the people by the people!
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 overflow-hidden">
        <img
          src="/NounishGif-1.gif"
          alt="Nounishgif-1"
          className="rounded-[12px] border border-black object-cover w-full md:w-[572px] md:h-[328px] h-auto flex-shrink-0"
        />

        <img
          src="/NounishGif-2.gif"
          alt="Nounishgif-2"
          className="rounded-[12px] border border-black object-cover w-full mw-full md:w-[572px] md:h-[328px] h-auto flex-shrink-0"
        />
      </div>
    </div>
  );
};