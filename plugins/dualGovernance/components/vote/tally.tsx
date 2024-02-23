import { formatLargeNumber } from "@/utils/formatNumber";
import { FC, ReactNode } from "react";
import { formatUnits } from "viem";

interface VoteTallyProps {
  voteCount: bigint;
  votePercentage: number;
}

const VetoTally: FC<VoteTallyProps> = ({ voteCount, votePercentage }) => (
  <Card>
    <div className="space-between flex flex-row pb-2">
      <p className={`text-critical-700 flex-grow text-xl font-semibold`}>
        Veto
      </p>
      <p className="text-xl font-semibold">
        {formatLargeNumber(formatUnits(voteCount, 18))}
      </p>
    </div>
    <div className={`bg-critical-100 h-4 w-full rounded`}>
      <div
        className={`bg-critical-700 h-4 rounded`}
        style={{ width: `${Math.min(votePercentage, 100)}%` }}
      />
    </div>
  </Card>
);

// This should be encapsulated as soon as ODS exports this widget
const Card = function ({ children }: { children: ReactNode }) {
  return (
    <div
      className="bg-neutral-0 box-border flex w-full flex-col space-y-6
    rounded-xl border border-neutral-100
    p-4 xl:p-6"
    >
      {children}
    </div>
  );
};

export default VetoTally;
