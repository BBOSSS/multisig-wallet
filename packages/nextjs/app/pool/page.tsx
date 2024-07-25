"use client";

import { type FC, useMemo, useState, useEffect } from "react";
// import { TransactionData, getPoolServerUrl } from "../create/page";
import { Transaction } from "~~/utils/postgres/transaction";
import { TransactionItem } from "./_components";
import { useInterval } from "usehooks-ts";
import { useChainId, useAccount } from "wagmi";
import {
  useDeployedContractInfo,
  useScaffoldContract,
  useScaffoldEventHistory,
  useScaffoldReadContract,
} from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";
import { useLocalStorage } from "usehooks-ts";
import { Address as TAddress, isAddress } from "viem";

const proxyAddressStorageKey = "multisigWallet.proxyAddress";

const roleMap: Map<number, string> = new Map([
  [0, "[0]Default"],
  [1, "[1]Admin"],
  [2, "[2]Signer"],
]);

const Pool: FC = () => {
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

  const [transactions, setTransactions] = useState<Transaction[]>();
  // const [subscriptionEventsHashes, setSubscriptionEventsHashes] = useState<`0x${string}`[]>([]);
  const { targetNetwork } = useTargetNetwork();
  // const poolServerUrl = getPoolServerUrl(targetNetwork.id);
  const { data: contractInfo } = useDeployedContractInfo("MultiSigWallet");
  const chainId = useChainId();
  const { address } = useAccount();
  const { data: nonce } = useScaffoldReadContract({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    functionName: "getNonce",
  });

  const { data: role } = useScaffoldReadContract({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    functionName: "getRole",
    args: [address]
  });

  const { data: eventsHistory } = useScaffoldEventHistory({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    eventName: "ExecuteTransaction",
    fromBlock: 6366370n,
    watch: true,
  });

  const { data: metaMultiSigWallet } = useScaffoldContract({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
  });

  const historyHashes = useMemo(() => eventsHistory?.map(ev => ev.log.args._hash) || [], [eventsHistory]);

  const getRole = (role: number | undefined) => {
    const tip = "Only Admin can execute the transaction.";
    if (role === undefined || !roleMap.has(role)) {
      return `Unknown (${tip})`;
    }
    return `${roleMap.get(role)} (${tip})`;
  };

  useInterval(() => {
    const getTransactions = async () => {
      try {
        const res: { [key: string]: Transaction } = await (await fetch("api/tx/get", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: proxyAddress,
            chainId: chainId,
          }, (key, value) => (typeof value === "bigint" ? value.toString() : value)),
        })).json();
        // console.log("res:", res);

        const newTransactions: Transaction[] = [];
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const i in res) {
          const validSignatures = [];
          // eslint-disable-next-line guard-for-in, no-restricted-syntax
          for (const s in res[i].signatures) {
            const signer = (await metaMultiSigWallet?.read.recover([
              res[i].hash as `0x${string}`,
              res[i].signatures[s],
            ])) as `0x${string}`;

            const isOwner = await metaMultiSigWallet?.read.isOwner([signer as TAddress]);

            if (signer && isOwner) {
              validSignatures.push({ signer, signature: res[i].signatures[s] });
            }
          }
          const update: Transaction = { ...res[i], validSignatures };
          newTransactions.push(update);
        }
        setTransactions(newTransactions);
        console.log("newTransactions:", newTransactions);
      } catch (e) {
        notification.error("Error fetching transactions");
        console.log(e);
      }
    };

    getTransactions();
  }, 10000);

  const lastTx = useMemo(
    () =>
      transactions
        ?.filter(tx => historyHashes.includes(tx.hash))
        .sort((a, b) => (BigInt(a.nonce) < BigInt(b.nonce) ? 1 : -1))[0],
    [historyHashes, transactions],
  );

  return (
    <div className="flex flex-col flex-1 items-center my-20 gap-8">
      <div className="flex items-center flex-col flex-grow w-full max-w-2xl">
      {!hasProxy ? (
          <p className="text-3xl mt-14">No contracts found!</p>
        ) : (<>
          <div className="flex flex-col items-center bg-base-100 shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 w-full">
            <div className="text-xl font-bold">Pool</div>
  
            <div>Role: {getRole(role)}</div>
            <div>Nonce: {nonce !== undefined ? `#${nonce}` : "Loading..."}</div>
  
            <div className="flex flex-col mt-8 gap-4">
              {transactions === undefined
                ? "Loading..."
                : transactions.map(tx => {
                    return (
                      <TransactionItem
                        key={tx.hash}
                        tx={tx}
                        completed={historyHashes.includes(tx.hash as `0x${string}`)}
                        outdated={lastTx?.nonce != undefined && BigInt(tx.nonce) <= BigInt(lastTx?.nonce)}
                      />
                    );
                  })}
            </div>
          </div></>)}
      </div>
    </div>
  );
};

export default Pool;
