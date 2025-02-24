"use client";

import { type FC, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_TX_DATA, METHODS, Method, PredefinedTxData } from "../owners/page";
import { useIsMounted, useLocalStorage } from "usehooks-ts";
import { Address, parseEther } from "viem";
import { useChainId, useWalletClient } from "wagmi";
import * as chains from "wagmi/chains";
import { AddressInput, EtherInput, InputBase } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";
import { Address as TAddress, isAddress } from "viem";
import { Transaction } from "~~/utils/postgres/transaction";

export type TransactionData = {
  chainId: number;
  address: Address;
  nonce: bigint;
  to: string;
  amount: string;
  data: `0x${string}`;
  hash: `0x${string}`;
  signatures: `0x${string}`[];
  signers: Address[];
  validSignatures?: { signer: Address; signature: Address }[];
  requiredApprovals: bigint;
};

export const getPoolServerUrl = (id: number) =>
  id === chains.hardhat.id ? "http://localhost:49832/" : "https://backend.multisig.holdings:49832/";

const proxyAddressStorageKey = "multisigWallet.proxyAddress";

const CreatePage: FC = () => {
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
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();

  const [ethValue, setEthValue] = useState("");
  // const { data: contractInfo } = useDeployedContractInfo("MultiSigWallet");

  const [predefinedTxData, setPredefinedTxData] = useLocalStorage<PredefinedTxData>("predefined-tx-data", {
    methodName: "transferFunds",
    signer: "",
    newSignaturesNumber: "",
    amount: "0",
  });

  const { data: nonce } = useScaffoldReadContract({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    functionName: "getNonce",
  });

  const { data: signaturesRequired } = useScaffoldReadContract({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    functionName: "getSignaturesRequired",
  });

  const txTo = predefinedTxData.methodName === "transferFunds" ? predefinedTxData.signer : proxyAddress;

  const { data: multiSigWallet } = useScaffoldContract({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
  });

  const domain = {
    name: "MultiSigWallet",
    version: "1",
    chainId: targetNetwork.id,
    verifyingContract: proxyAddress,
  } as const;

  const types = {
    Transaction: [
      { name: "_nonce", type: "uint256" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
  } as const;

  const handleCreate = async () => {
    try {
      if (!walletClient) {
        console.log("No wallet client!");
        return;
      }

      // const newHash = (await multiSigWallet?.read.getTransactionHash([
      //   nonce as bigint,
      //   txTo as TAddress,
      //   BigInt(predefinedTxData.amount as string),
      //   predefinedTxData.callData as `0x${string}`,
      // ])) as `0x${string}`;
      const newHash = (await multiSigWallet?.read.getTransactionStructHash([
        nonce as bigint,
        txTo as TAddress,
        BigInt(predefinedTxData.amount as string),
        predefinedTxData.callData as `0x${string}`,
      ])) as `0x${string}`;

      // const signature = await walletClient.signMessage({
      //   message: { raw: newHash },
      // });
      const msg = { 
        _nonce: nonce as bigint,
        to: txTo as TAddress,
        value: BigInt(predefinedTxData.amount as string),
        data:  predefinedTxData.callData as `0x${string}`,
      };
      const data = {
        domain,
        types,
        primaryType: "Transaction",
        message: msg,
      };
      console.log("data", data);
      const signature = await walletClient.signTypedData({
        domain,
        types,
        primaryType: "Transaction",
        message: msg,
      });
      console.log("signature", signature);
      console.log("hash", newHash);
      const recover = (await multiSigWallet?.read.recover([newHash, signature])) as Address;
      console.log("recover", recover);

      const isOwner = await multiSigWallet?.read.isOwner([recover]);

      if (isOwner) {
        if (!proxyAddress || !predefinedTxData.amount || !txTo) {
          return;
        }

        const txData: Transaction = {
          chainId: chainId,
          address: proxyAddress,
          nonce: nonce || 0n,
          txTo: txTo as `0x${string}`,
          amount: predefinedTxData.amount,
          data: predefinedTxData.callData as `0x${string}`,
          hash: newHash,
          signatures: [signature],
          signers: [recover],
          requiredApprovals: signaturesRequired || 0n,
        };

        // await fetch(poolServerUrl, {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(
        //     txData,
        //     // stringifying bigint
        //     (key, value) => (typeof value === "bigint" ? value.toString() : value),
        //   ),
        // });
        fetch("api/tx/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(txData, (key, value) => (typeof value === "bigint" ? value.toString() : value)),
        })
          .then(response => {
            setTimeout(() => {
              router.push("/pool");
            }, 777);
          })
          .catch(error => {
            console.error("Error:", error);
            notification.error(`Error: ${error}`);
          });

        setPredefinedTxData(DEFAULT_TX_DATA);

        
      } else {
        notification.info("Only owners can propose transactions");
      }
    } catch (e) {
      notification.error("Error while proposing transaction");
      console.log(e);
    }
  };

  useEffect(() => {
    if (predefinedTxData && !predefinedTxData.callData && predefinedTxData.methodName !== "transferFunds") {
      setPredefinedTxData({
        ...predefinedTxData,
        methodName: "transferFunds",
        callData: "",
      });
    }
  }, [predefinedTxData, setPredefinedTxData]);

  return isMounted() ? (
    <div className="flex flex-col flex-1 items-center my-20 gap-8">
      <div className="flex items-center flex-col flex-grow w-full max-w-lg">
      {!hasProxy ? (
          <p className="text-3xl mt-14">No contracts found!</p>
        ) : (<>
          <div className="flex flex-col bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl w-full p-6">
            <div>
              <label className="label">
                <span className="label-text">Nonce</span>
              </label>
              <InputBase
                disabled
                value={nonce !== undefined ? `# ${nonce}` : "Loading..."}
                placeholder={"Loading..."}
                onChange={() => {
                  null;
                }}
              />
            </div>
  
            <div className="flex flex-col gap-4">
              <div className="mt-6 w-full">
                <label className="label">
                  <span className="label-text">Select method</span>
                </label>
                <select
                  className="select select-bordered select-sm w-full bg-base-200 text-accent font-medium"
                  value={predefinedTxData.methodName}
                  onChange={e =>
                    setPredefinedTxData({
                      ...predefinedTxData,
                      methodName: e.target.value as Method,
                      callData: "" as `0x${string}`,
                    })
                  }
                >
                  {METHODS.map(method => (
                    <option key={method} value={method} disabled={method !== "transferFunds"}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
  
              <AddressInput
                placeholder={predefinedTxData.methodName === "transferFunds" ? "Recipient address" : "Signer address"}
                value={predefinedTxData.signer}
                onChange={signer => setPredefinedTxData({ ...predefinedTxData, signer: signer })}
              />
  
              {predefinedTxData.methodName === "transferFunds" && (
                <EtherInput
                  value={ethValue}
                  onChange={val => {
                    setPredefinedTxData({ ...predefinedTxData, amount: String(parseEther(val)) });
                    setEthValue(val);
                  }}
                />
              )}
  
              <InputBase
                value={predefinedTxData.callData || ""}
                placeholder={"Calldata"}
                onChange={() => {
                  null;
                }}
                disabled
              />
  
              <button className="btn btn-secondary btn-sm" disabled={!walletClient} onClick={handleCreate}>
                Create
              </button>
            </div>
          </div></>)}
      </div>
    </div>
  ) : null;
};

export default CreatePage;
