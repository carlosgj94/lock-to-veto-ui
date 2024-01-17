import { create } from 'ipfs-http-client';
import { Button, IconType, Icon } from '@aragon/ods'
import React, { useEffect, useState } from 'react'
import { uploadToIPFS } from '@/utils/ipfs'
import { useContractWrite } from 'wagmi';
import { Address, toHex } from 'viem'
import { TokenVotingAbi } from '@/artifacts/TokenVoting.sol';
import { useAlertContext } from '../../context/AlertContext';
import WithdrawalInput from '@/components/input/withdrawal'
import CustomActionInput from '@/components/input/custom-action'
import { Action } from '@/utils/types'

const ipfsEndpoint = process.env.NEXT_PUBLIC_IPFS_ENDPOINT || "";
const ipfsKey = process.env.NEXT_PUBLIC_IPFS_API_KEY || "";
const pluginAddress = (process.env.NEXT_PUBLIC_PLUGIN_ADDRESS || "") as Address

const auth = ipfsKey; // Replace YOUR_API_KEY with your actual API key

enum ActionType {
    Signaling,
    Withdrawal,
    Custom
}

export default function Create() {
    const [ipfsPin, setIpfsPin] = useState<string>('');
    const [title, setTitle] = useState<string>();
    const [summary, setSummary] = useState<string>();
    const [action, setAction] = useState<Action[]>([]);
    const { addAlert } = useAlertContext()
    const { write: createProposalWrite } = useContractWrite({
        abi: TokenVotingAbi,
        address: pluginAddress,
        functionName: 'createProposal',
        args: [toHex(ipfsPin), action, 0, 0, 0, 0, 0],
        onSuccess(data) {
            addAlert("We got your proposal!", data.hash)
        },
    });
    const [actionType, setActionType] = useState<ActionType>(ActionType.Signaling)

    const changeActionType = (actionType: ActionType) => {
        setAction([])
        setActionType(actionType)
    }

    const client = create({
        url: ipfsEndpoint,
        headers: { 'X-API-KEY': auth, 'Accept': 'application/json' }
    });

    const submitProposal = async () => {
        const proposalMetadataJsonObject = { title, summary };
        const blob = new Blob([JSON.stringify(proposalMetadataJsonObject)], { type: 'application/json' });

        const ipfsPin = await uploadToIPFS(client, blob);
        setIpfsPin(ipfsPin!)
        if (ipfsPin !== '') createProposalWrite?.()
    }

    const handleTitleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(event?.target?.value);
    };
    const handleSummaryInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSummary(event?.target?.value);
    };


    return (
    <section className="flex flex-col items-center w-screen max-w-full min-w-full">
      <div className="justify-between py-5 w-full">
                <h1 className="font-semibold text-neutral-900 text-3xl mb-10">Create Proposal</h1>
                <div className="mb-6 pb-6">
                    <label className="block mb-2 text-lg font-medium text-neutral-900">Title</label>
                    <input
                        type="text"
                        id="base-input"
                        className="bg-white border border-neutral-100 text-neutral-900 text-sm rounded-lg focus:ring-primary-200 focus:border-primary-300 block w-full p-2.5"
                        placeholder="A short title that descrives the main purpose"
                        value={title}
                        onChange={handleTitleInput}
                    />
                </div>
                <div className="mb-6">
                    <label className="block mb-2 text-lg text-neutral-900">Summary</label>
                    <textarea
                        id="message"
                        rows={6}
                        className="block p-2.5 w-full text-sm text-neutral-900 bg-white rounded-lg border border-neutral-100 focus:ring-primary-300 focus:border-primary-300"
                        placeholder="A detailed description for what the proposal is all about"
                        value={summary}
                        onChange={handleSummaryInput}
                    ></textarea>
                </div>
                <div className="mb-6">
                    <span className="block mb-2 text-lg text-neutral-900 ">Select proposal action</span>
                    <div className="grid grid-cols-3 gap-5 h-48 mt-2">
                        <div
                            onClick={() => {changeActionType(ActionType.Signaling)}}
                            className={`rounded-xl bg-white border border-dashed border-2 flex flex-col items-center ${actionType === ActionType.Signaling ? 'border-primary-300' : 'border-neutral-100'}`}>
                            <Icon
                                className="p-2 rounded-full bg-primary-100 text-primary-600 !h-16 !w-16 my-8"
                                icon={IconType.INFO}
                                size="lg"
                            />
                            <h3 className="font-semibold text-lg">Signaling proposal</h3>
                        </div>
                        <div
                            onClick={() => changeActionType(ActionType.Withdrawal)}
                            className={`rounded-xl bg-white border border-dashed border-2 flex flex-col items-center ${actionType === ActionType.Withdrawal ? 'border-primary-300' : 'border-neutral-100'}`}>
                            <Icon
                                className="p-2 rounded-full bg-primary-100 text-primary-600 !h-16 !w-16 my-8"
                                icon={IconType.TX_WITHDRAW}
                                size="lg"
                            />
                            <h3 className="font-semibold text-lg">DAO Payment</h3>
                        </div>
                        <div
                            onClick={() => changeActionType(ActionType.Custom)}
                            className={`rounded-xl bg-white border border-dashed border-2 flex flex-col items-center ${actionType === ActionType.Custom ? 'border-primary-300' : 'border-neutral-100'}`}>
                            <Icon
                                className="p-2 rounded-full bg-primary-100 text-primary-600 !h-16 !w-16 my-8"
                                icon={IconType.BLOCKCHAIN}
                                size="lg"
                            />
                            <h3 className="font-semibold text-lg">Custom action</h3>
                        </div>
                    </div>
                    <div className="mb-6">
                        {actionType === ActionType.Withdrawal && (<WithdrawalInput setAction={setAction} />)}
                        {actionType === ActionType.Custom && (<CustomActionInput setAction={setAction} />)}
                    </div>
                </div>

                <Button
                    className='mt-14 mb-6'
                    size="lg"
                    variant='primary'
                    onClick={() => submitProposal()}
                >
                    Submit
                </Button>
            </div>
        </section>
    )
}

