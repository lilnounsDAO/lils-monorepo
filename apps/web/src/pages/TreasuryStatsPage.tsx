import { Helmet } from 'react-helmet-async'
import TreasuryStats from '@/components/stats/TreasuryStats'
import { Link } from 'react-router-dom';
import { CHAIN_CONFIG } from '@/config';
import IndexerIssues from '@/components/IndexerIssues';
import CurrencySelector from '@/components/selectors/CurrencySelector';
import TimeSelector from '@/components/selectors/TimeSelector';
import { Skeleton } from '@/components/ui/skeleton';
import { getDailyFinancialSnapshots } from '@/data/ponder/financial/getDailyFinancialSnapshots';
import { Suspense, useEffect, useState } from 'react';
// import { Metadata } from 'sharp';

// export const metadata: Metadata = {
//   alternates: {
//     canonical: "./",
//   },
// };

export default function TreasuryStatsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDailyFinancialSnapshots>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getDailyFinancialSnapshots();
        if (!cancelled) {
          setData(res);
          setErrored(!res || res.length === 0);
        }
      } catch (e) {
        if (!cancelled) {
          setErrored(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const skeleton = (
    <>
      <div className="flex h-[97px] flex-col gap-4 md:flex-row">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton className="h-full flex-1 rounded-2xl" key={i} />
          ))}
      </div>
      {Array(3)
        .fill(0)
        .map((_, i) => (
          <Skeleton className="h-[341px] rounded-2xl" key={i} />
        ))}
    </>
  );

  return (
    <>
      <div className="flex flex-col justify-between md:flex-row">
        <div>
          <h4>Treasury Stats</h4>
          <span>
            Data and insights for the{" "}
            <Link
              to={
                CHAIN_CONFIG.chain.blockExplorers?.default.url +
                `/tokenholdings?a=${CHAIN_CONFIG.addresses.nounsTreasury}`
              }
              className="underline"
            >
              Nouns treasury
            </Link>
            .
          </span>
        </div>
        <div className="flex w-full justify-start gap-2 bg-white py-2 md:w-fit md:justify-end md:self-end md:py-0">
          <CurrencySelector />
          <TimeSelector />
        </div>
      </div>

      {loading && skeleton}
      {!loading && errored && <IndexerIssues />}
      {!loading && !errored && data && <TreasuryStats data={data} />}
    </>
  );
}