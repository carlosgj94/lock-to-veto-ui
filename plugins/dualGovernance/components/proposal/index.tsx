import Link from "next/link";
import { usePublicClient } from "wagmi";
import { Address } from "viem";
import { Proposal } from "@/plugins/dualGovernance/utils/types";
import { useProposal } from "@/plugins/dualGovernance/hooks/useProposal";
import { ITagProps } from "@aragon/ods";
import { Card, Tag } from "@aragon/ods";
import * as DOMPurify from 'dompurify';
import { PleaseWaitSpinner } from "@/components/please-wait";
import { If } from "@/components/if";
import { goerli } from "viem/chains";

const DEFAULT_PROPOSAL_METADATA_TITLE = "(No proposal title)";
const DEFAULT_PROPOSAL_METADATA_SUMMARY =
  "(The metadata of the proposal is not available)";
const PLUGIN_ADDRESS = (process.env.NEXT_PUBLIC_DUAL_GOVERNANCE_PLUGIN_ADDRESS ||
  "") as Address;

type TagVariant = ITagProps["variant"];
type ProposalInputs = {
  proposalId: bigint;
};

const getProposalVariantStatus = (proposal: Proposal) => {
  return {
    variant: (proposal?.active
      ? "primary"
      : proposal?.executed
        ? "success"
        : proposal?.vetoTally >= proposal?.parameters?.minVetoPower
          ? "critical"
          : "success") as TagVariant,
    label: proposal?.active
      ? "Active"
      : proposal?.executed
        ? "Executed"
        : proposal?.vetoTally >= proposal?.parameters?.minVetoPower
          ? "Defeated"
          : "Executable",
  };
};

export default function ProposalCard(props: ProposalInputs) {
  const publicClient = usePublicClient({chainId: goerli.id});
  const { proposal, status } = useProposal(
    publicClient,
    PLUGIN_ADDRESS,
    props.proposalId.toString()
  );

  const showLoading = getShowProposalLoading(proposal, status);

  if (!proposal || showLoading) {
    return (
      <section className="w-full mb-4">
        <Card className="p-4">
          <span className="px-4 py-5 xs:px-10 md:px-6 lg:px-7">
            <PleaseWaitSpinner fullMessage="Loading proposal..." />
          </span>
        </Card>
      </section>
    );
  } else if (status.metadataReady && !proposal?.title) {
    return (
      <Link
        href={`/proposals/${props.proposalId}`}
        className="w-full mb-4"
      >
        <Card className="p-4">
          <div className="md:w-7/12 lg:w-3/4 xl:4/5 pr-4 text-nowrap text-ellipsis overflow-hidden">
            <h4 className="mb-1 text-lg text-neutral-300 line-clamp-1">
              {Number(props.proposalId) + 1} -{" "}
              {DEFAULT_PROPOSAL_METADATA_TITLE}
            </h4>
            <p className="text-base text-neutral-300 line-clamp-3">
              {DEFAULT_PROPOSAL_METADATA_SUMMARY}
            </p>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link
      href={`/proposals/${props.proposalId}`}
      className="w-full cursor-pointer mb-4"
    >
      <Card className="p-4">
        <If condition={proposal.vetoTally}>
          <div className="flex mb-2">
            <Tag
              variant={getProposalVariantStatus(proposal as Proposal).variant}
              label={getProposalVariantStatus(proposal as Proposal).label}
            />
          </div>
        </If>

        <div className="text-ellipsis overflow-hidden">
          <h4 className=" mb-1 text-lg font-semibold text-dark line-clamp-1">
            {Number(props.proposalId) + 1} - {proposal.title}
          </h4>
          {<div className="text-ellipsis overflow-hidden box line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: proposal.summary
                ? DOMPurify.sanitize(proposal.summary)
                : DEFAULT_PROPOSAL_METADATA_SUMMARY
            }} />
          }
        </div>
      </Card>
    </Link>
  );
}

function getShowProposalLoading(
  proposal: ReturnType<typeof useProposal>["proposal"],
  status: ReturnType<typeof useProposal>["status"]
) {
  if (!proposal || status.proposalLoading) return true;
  else if (status.metadataLoading && !status.metadataError) return true;
  else if (!proposal?.title && !status.metadataError) return true;

  return false;
}
