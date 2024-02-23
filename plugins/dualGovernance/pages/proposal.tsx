import {
  useAccount,
  useBalance,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useState, useEffect } from "react";
import { useProposal } from "@/plugins/dualGovernance/hooks/useProposal";
import { useProposalVetoes } from "@/plugins/dualGovernance/hooks/useProposalVetoes";
import { ToggleGroup, Toggle } from "@aragon/ods";
import ProposalDescription from "@/plugins/dualGovernance/components/proposal/description";
import VetoesSection from "@/plugins/dualGovernance/components/vote/vetoes-section";
import ProposalHeader from "@/plugins/dualGovernance/components/proposal/header";
import { useUserCanVeto } from "@/plugins/dualGovernance/hooks/useUserCanVeto";
import { OptimisticTokenVotingPluginAbi } from "@/plugins/dualGovernance/artifacts/OptimisticTokenVotingPlugin.sol";
import VetoTally from "@/plugins/dualGovernance/components/vote/tally";
import ProposalDetails from "@/plugins/dualGovernance/components/proposal/details";
import { useAlertContext, AlertContextProps } from "@/context/AlertContext";
import { Else, IfCase, Then } from "@/components/if";
import { PleaseWaitSpinner } from "@/components/please-wait";
import { useSkipFirstRender } from "@/hooks/useSkipFirstRender";
import { useRouter } from "next/router";
import { PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS, PUB_CHAIN } from "@/constants";
import { Address } from "viem";
import { LockToVetoPluginAbi } from "../artifacts/LockToVetoPlugin.sol";

type BottomSection = "description" | "vetoes";

export default function ProposalDetail({ id: proposalId }: { id: string }) {
  const { reload } = useRouter();
  const skipRender = useSkipFirstRender();
  const publicClient = usePublicClient({ chainId: PUB_CHAIN.id });
  const { address } = useAccount();
  const { data: votingToken } = useReadContract({
    chainId: PUB_CHAIN.id,
    address: PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS,
    abi: OptimisticTokenVotingPluginAbi,
    functionName: "getVotingToken",
  });
  const { data: userTokenBalance } = useBalance({
    address,
    token: votingToken as Address,
    chainId: PUB_CHAIN.id,
  });

  const { proposal, status: proposalFetchStatus } = useProposal(
    publicClient!,
    PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS,
    proposalId,
    true,
  );
  const vetoes = useProposalVetoes(
    publicClient!,
    PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS,
    proposalId,
    proposal,
  );
  const userCanVeto = useUserCanVeto(BigInt(proposalId));

  const [bottomSection, setBottomSection] =
    useState<BottomSection>("description");
  const { addAlert } = useAlertContext() as AlertContextProps;
  const {
    writeContract: vetoWrite,
    data: vetoTxHash,
    error,
    status,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: vetoTxHash });

  useEffect(() => {
    if (status === "idle" || status === "pending") return;
    else if (status === "error") {
      console.log("Error;", error);
      if (error?.message?.startsWith("User rejected the request")) {
        addAlert("Transaction rejected by the user", {
          timeout: 4 * 1000,
        });
      } else {
        addAlert("Could not create the veto", { type: "error" });
      }
      return;
    }

    // success
    if (!vetoTxHash) return;
    else if (isConfirming) {
      addAlert("Veto submitted", {
        description: "Waiting for the transaction to be validated",
        txHash: vetoTxHash,
      });
      return;
    } else if (!isConfirmed) return;

    addAlert("Veto registered", {
      description: "The transaction has been validated",
      type: "success",
      txHash: vetoTxHash,
    });
    reload();
  }, [status, vetoTxHash, isConfirming, isConfirmed]);

  const vetoProposal = () => {
    console.log(
      proposalId,
      userTokenBalance,
      PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS,
    );
    vetoWrite({
      abi: LockToVetoPluginAbi,
      address: PUB_DUAL_GOVERNANCE_PLUGIN_ADDRESS,
      functionName: "veto",
      args: [proposalId, userTokenBalance?.value],
    });
  };

  const showProposalLoading = getShowProposalLoading(
    proposal,
    proposalFetchStatus,
  );
  const showTransactionLoading = status === "pending" || isConfirming;

  if (skipRender || !proposal || showProposalLoading) {
    return (
      <section className="justify-left items-left flex w-screen min-w-full max-w-full">
        <PleaseWaitSpinner />
      </section>
    );
  }

  return (
    <section className="flex w-screen min-w-full max-w-full flex-col items-center">
      <div className="flex w-full justify-between py-5">
        <ProposalHeader
          proposalNumber={Number(proposalId)}
          proposal={proposal}
          transactionLoading={showTransactionLoading}
          userCanVeto={userCanVeto as boolean}
          onVetoPressed={() => vetoProposal()}
        />
      </div>

      <div className="my-10 grid w-full gap-10 lg:grid-cols-2 xl:grid-cols-3">
        <VetoTally
          voteCount={proposal?.vetoTally}
          votePercentage={
            Number(
              proposal?.vetoTally / proposal?.parameters?.minVetoVotingPower,
            ) * 100
          }
        />
        <ProposalDetails
          minVetoVotingPower={proposal?.parameters?.minVetoVotingPower}
          endDate={proposal?.parameters?.endDate}
          snapshotBlock={proposal?.parameters?.snapshotBlock}
        />
      </div>
      <div className="w-full py-12">
        <div className="space-between flex flex-row">
          <h2 className="flex-grow text-3xl font-semibold text-neutral-900">
            {bottomSection === "description" ? "Description" : "Vetoes"}
          </h2>
          <ToggleGroup
            value={bottomSection}
            isMultiSelect={false}
            onChange={(val: string | undefined) =>
              val ? setBottomSection(val as BottomSection) : ""
            }
          >
            <Toggle label="Description" value="description" />
            <Toggle label="Vetoes" value="vetoes" />
          </ToggleGroup>
        </div>

        <IfCase condition={bottomSection === "description"}>
          <Then>
            <ProposalDescription {...proposal} />
          </Then>
          <Else>
            <VetoesSection vetoes={vetoes} />
          </Else>
        </IfCase>
      </div>
    </section>
  );
}

function getShowProposalLoading(
  proposal: ReturnType<typeof useProposal>["proposal"],
  status: ReturnType<typeof useProposal>["status"],
) {
  if (!proposal && status.proposalLoading) return true;
  else if (status.metadataLoading && !status.metadataError) return true;
  else if (!proposal?.title && !status.metadataError) return true;

  return false;
}
