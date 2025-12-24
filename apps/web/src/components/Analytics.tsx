import { useEffect } from "react";

export default function Analytics() {
  useEffect(() => {
    if (process.env.VITE_PLAUSIBLE_DATA_DOMAIN) {
      const script = document.createElement('script');
      script.defer = true;
      script.src = 'https://plausible.paperclip.xyz/js/script.js';
      script.setAttribute('data-domain', process.env.VITE_PLAUSIBLE_DATA_DOMAIN);
      document.head.appendChild(script);

      return () => {
        // Cleanup script on unmount
        const existingScript = document.querySelector('script[src="https://plausible.paperclip.xyz/js/script.js"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, []);

  return null;
}
