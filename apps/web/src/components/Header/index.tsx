import WalletDropdown from "../WalletDropdown";
import HidingHeader from "./HidingHeader";
import DesktopNav from "../Nav/DesktopNav";
import { NounsDotComLogoLink } from "../NounsDotComLogoLink";
const HEADER_HEIGHT = 64;

export function Header() {
  return (
    <HidingHeader>
      <div
        className="flex w-full flex-row justify-between overflow-hidden bg-white px-4 py-2 shadow-bottom-only md:px-8"
        style={{ height: HEADER_HEIGHT }}
      >
        <div className="flex items-center gap-6 md:flex-1">
          <NounsDotComLogoLink />
          <DesktopNav />
        </div>
        <div className="flex flex-1 items-center justify-end gap-4 text-gray-600">
          <WalletDropdown />
        </div>
      </div>
    </HidingHeader>
  );
}
