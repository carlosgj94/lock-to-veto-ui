import { FC } from "react";
import { formatUnits } from "viem";
import { Card } from '@aragon/ods'
import { formatLargeNumber } from "@/utils/formatNumber";

interface VoteTallyProps {
  voteType: string;
  voteCount: bigint;
  votePercentage: number;
  color: string;
}

const VoteTally: FC<VoteTallyProps> = ({ voteType, voteCount, votePercentage, color }) => (
  <Card className="p-4 xl:p-6 w-full flex flex-col space-y-6">
    <div className="flex flex-row space-between pb-2">
      <p className={`flex-grow text-xl text-${color}-700 font-semibold`}>{voteType}</p>
      <p className="text-xl font-semibold">{formatLargeNumber(formatUnits(voteCount || BigInt(0), 18))}</p>
    </div>
    <div className={`h-4 w-full bg-${color}-100 rounded`}>
      {/* Please don't delete or the bundler won't add these colors to the build */}
      {/* The reason is because the are being added in js at rendering time */}
      {/** bg-critical-700 bg-critical-100 bg-success-100 bg-success-700 bg-neutral-100 bg-neutral-700 */}
      <div className={`h-4 bg-${color}-700 rounded`} style={{ width: `${votePercentage}%` }}/>
    </div>
  </Card>
);

export default VoteTally