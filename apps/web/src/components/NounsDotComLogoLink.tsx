import { Link } from "react-router-dom";
import clsx from "clsx";
import Image from "@/components/OptimizedImage";

export function NounsDotComLogoLink({ darkMode }: { darkMode?: boolean }) {
  return (
    <Link
      to="/"
      className="flex shrink-0 grow-0 flex-row items-center gap-1.5"
    >
      <Image
        src="/lilnoggles.png" // was nouns-icon.png
        width={60}
        height={24}
        // className="transition-all ease-linear"
        alt="Lil Nouns"
        className="h-6 w-auto max-w-none shrink-0"
      />
      {/* <div
        className={clsx(
          "hidden heading-4 md:flex",
          darkMode ? "text-white" : "text-content-primary",
        )}
      >
        Lil Nouns
      </div> */}
    </Link>
  );
}
