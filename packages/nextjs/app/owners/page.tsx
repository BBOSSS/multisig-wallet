"use client";

import { type FC, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsMounted, useLocalStorage } from "usehooks-ts";
import { Abi, encodeFunctionData } from "viem";
import { Address, AddressInput, IntegerInput } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldEventHistory, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { Address as TAddress, isAddress } from "viem";

export type Method = "addOwner" | "removeOwner" | "transferFunds";
export const METHODS: Method[] = ["addOwner", "removeOwner", "transferFunds"];
export const OWNERS_METHODS: Method[] = ["addOwner", "removeOwner"];
const roleOptions = [
  { value: 1, label: "Admin" },
  { value: 2, label: "Signer" },
];

export const DEFAULT_TX_DATA = {
  methodName: OWNERS_METHODS[0],
  role: 1,
  signer: "",
  newSignaturesNumber: "",
};

export type PredefinedTxData = {
  methodName: Method;
  signer: string;
  role?: number;
  newSignaturesNumber: string;
  to?: string;
  amount?: string;
  callData?: `0x${string}` | "";
};

const proxyAddressStorageKey = "multisigWallet.proxyAddress";

const Owners: FC = () => {
  const [proxyAddress, setProxyAddress] = useLocalStorage<TAddress>(
    proxyAddressStorageKey,
    "0x",
    { initializeWithValue: true },
  );
  
  const [hasProxy, setHasProxy] = useState(false);

  useEffect(() => {
    // console.log("useEffect proxyAddress", proxyAddress)
    setHasProxy(isAddress(proxyAddress));
  }, [proxyAddress, setProxyAddress]);
  
  const isMounted = useIsMounted();

  const router = useRouter();

  const [predefinedTxData, setPredefinedTxData] = useLocalStorage<PredefinedTxData>(
    "predefined-tx-data",
    DEFAULT_TX_DATA,
  );

  const { data: contractInfo } = useDeployedContractInfo("MultiSigWallet");

  const { data: signaturesRequired } = useScaffoldReadContract({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    functionName: "getSignaturesRequired",
  });

  useEffect(() => {
    if (predefinedTxData.methodName === "transferFunds") {
      setPredefinedTxData(DEFAULT_TX_DATA);
    }
  }, [predefinedTxData.methodName, setPredefinedTxData]);

  return isMounted() ? (
    <div className="flex flex-col flex-1 items-center my-20 gap-8">
      <div className="flex items-center flex-col flex-grow w-full max-w-lg">
        {!hasProxy ? (
          <p className="text-3xl mt-14">No contracts found!</p>
        ) : (<>
          <div className="flex flex-col items-center shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 w-full">
            <div className="max-w-full">Signatures required: {String(signaturesRequired)}</div>
            <div className="mt-6 flex flex-col gap-4 form-control w-full">
              <div className="w-full">
                <label className="label">
                  <span className="label-text">Select method</span>
                </label>
                <select
                  className="select select-bordered select-sm w-full bg-base-200 text-accent font-medium"
                  value={predefinedTxData.methodName}
                  onChange={e =>
                    setPredefinedTxData({ ...predefinedTxData, methodName: e.target.value as Method, callData: "" })
                  }
                >
                  {OWNERS_METHODS.map(method => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              {predefinedTxData.methodName === "addOwner" && (
                <div className="w-full">
                  <select
                    className="select select-bordered select-sm w-full bg-base-200 text-accent font-medium"
                    value={predefinedTxData.role}
                    onChange={e => {
                      const _role = Number(e.target.value);
                      setPredefinedTxData({ ...predefinedTxData, role: _role, callData: "" });
                    }}
                  >
                    {roleOptions.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
  
              <AddressInput
                placeholder="Signer address"
                value={predefinedTxData.signer}
                onChange={s => setPredefinedTxData({ ...predefinedTxData, signer: s })}
              />
  
              <IntegerInput
                placeholder="New № of signatures required"
                value={predefinedTxData.newSignaturesNumber}
                onChange={s => setPredefinedTxData({ ...predefinedTxData, newSignaturesNumber: s as string })}
                disableMultiplyBy1e18
              />
  
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const callData = encodeFunctionData({
                    abi: contractInfo?.abi as Abi,
                    functionName: predefinedTxData.methodName,
                    args: predefinedTxData.methodName === "addOwner" 
                    ? [predefinedTxData.signer, predefinedTxData.role, predefinedTxData.newSignaturesNumber]
                    : [predefinedTxData.signer, predefinedTxData.newSignaturesNumber],
                  });
  
                  setPredefinedTxData({
                    ...predefinedTxData,
                    callData,
                    amount: "0",
                    to: contractInfo?.address,
                  });
  
                  setTimeout(() => {
                    router.push("/create");
                  }, 777);
                }}
              >
                Create Tx
              </button>
            </div>
          </div></>)}
      </div>
    </div>
  ) : null;
};

export default Owners;
