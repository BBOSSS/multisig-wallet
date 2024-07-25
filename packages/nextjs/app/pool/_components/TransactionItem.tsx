import { type FC, useState, useEffect } from "react";
import { Address, BlockieAvatar } from "../../../components/scaffold-eth";
import { Abi, decodeFunctionData, formatEther } from "viem";
import { DecodeFunctionDataReturnType } from "viem/_types/utils/abi/decodeFunctionData";
import { useAccount, useWalletClient } from "wagmi";
// import { TransactionData, getPoolServerUrl } from "~~/app/create/page";
import { Transaction } from "~~/utils/postgres/transaction";

import {
  useDeployedContractInfo,
  useScaffoldContract,
  useScaffoldReadContract,
  useTransactor,
} from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";
import { useLocalStorage } from "usehooks-ts";
import { Address as TAddress, isAddress } from "viem";

type TransactionItemProps = { tx: Transaction; completed: boolean; outdated: boolean };

const proxyAddressStorageKey = "multisigWallet.proxyAddress";

export const TransactionItem: FC<TransactionItemProps> = ({ tx, completed, outdated }) => {
  console.log("tx:", tx);
  console.log("tx.requiredApprovals:", tx.requiredApprovals);
  console.log("tx.txTo:", tx.txTo);
  console.log("tx.address:", tx.address);
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

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const transactor = useTransactor();
  const { targetNetwork } = useTargetNetwork();
  // const poolServerUrl = getPoolServerUrl(targetNetwork.id);

  const { data: signaturesRequired } = useScaffoldReadContract({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    functionName: "getSignaturesRequired",
  });

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

  const { data: metaMultiSigWallet } = useScaffoldContract({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    walletClient,
  });

  const { data: contractInfo } = useDeployedContractInfo("MultiSigWallet");

  const txnData =
    contractInfo?.abi && tx.data
      ? decodeFunctionData({ abi: contractInfo.abi as Abi, data: tx.data })
      : ({} as DecodeFunctionDataReturnType);
  console.log("txnData:", txnData);

  const hasSigned = tx.signers.indexOf(address as TAddress) >= 0;
  const hasEnoughSignatures = signaturesRequired ? tx.signatures.length >= Number(signaturesRequired) : false;

  const getSortedSigList = async (allSigs: `0x${string}`[], newHash: `0x${string}`) => {
    const sigList = [];
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const s in allSigs) {
      const recover = (await metaMultiSigWallet?.read.recover([newHash, allSigs[s]])) as `0x${string}`;

      sigList.push({ signature: allSigs[s], signer: recover });
    }

    sigList.sort((a, b) => {
      return BigInt(a.signer) > BigInt(b.signer) ? 1 : -1;
    });

    const finalSigList: `0x${string}`[] = [];
    const finalSigners: `0x${string}`[] = [];
    const used: Record<string, boolean> = {};
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const s in sigList) {
      if (!used[sigList[s].signature]) {
        finalSigList.push(sigList[s].signature);
        finalSigners.push(sigList[s].signer);
      }
      used[sigList[s].signature] = true;
    }

    return [finalSigList, finalSigners];
  };

  return (
    <>
      <input type="checkbox" id={`label-${tx.hash}`} className="modal-toggle" />
      <div className="modal" role="dialog">
        <div className="modal-box">
          <div className="flex flex-col">
            <div className="flex gap-2">
              <div className="font-bold">Function Signature:</div>
              {txnData.functionName || "transferFunds"}
            </div>
            <div className="flex flex-col gap-2 mt-6">
              {txnData.args ? (
                <>
                  <h4 className="font-bold">Arguments</h4>
                  <div className="flex gap-4">
                    Updated signer: <Address address={(txnData.args?.[0]) as TAddress} />
                  </div>
                  <div>Updated signatures required: {String(txnData.args?.[1])}</div>
                </>
              ) : (
                <>
                  <div className="flex gap-4">
                    Transfer to: <Address address={tx.txTo as TAddress} />
                  </div>
                  <div>Amount: {formatEther(BigInt(tx.amount))} Ξ </div>
                </>
              )}
            </div>
            <div className="mt-4">
              <div className="font-bold">Sig hash</div>{" "}
              <div className="flex gap-1 mt-2">
                <BlockieAvatar size={20} address={tx.hash} /> {tx.hash.slice(0, 7)}
              </div>
            </div>
            <div className="modal-action">
              <label htmlFor={`label-${tx.hash}`} className="btn btn-sm">
                Close!
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col pb-2 border-b border-secondary last:border-b-0">
        <div className="flex gap-4 justify-between">
          <div className="font-bold"># {String(tx.nonce)}</div>
          <div className="flex gap-1 font-bold">
            <BlockieAvatar size={20} address={tx.hash} /> {tx.hash.slice(0, 7)}
          </div>

          <Address address={tx.txTo as TAddress} />

          <div>{formatEther(BigInt(tx.amount))} Ξ</div>

          {String(signaturesRequired) && (
            <span>
              {tx.signatures.length}/{String(tx.requiredApprovals)} {hasSigned ? "✅" : ""}
            </span>
          )}

          {completed ? (
            <div className="font-bold">Completed</div>
          ) : outdated ? (
            <div className="font-bold">Outdated</div>
          ) : (
            <>
              <div title={hasSigned ? "You have already Signed this transaction" : ""}>
                <button
                  className="btn btn-xs btn-primary"
                  disabled={hasSigned}
                  title={!hasEnoughSignatures ? "Not enough signers to Execute" : ""}
                  onClick={async () => {
                    try {
                      if (!walletClient) {
                        return;
                      }

                      const newHash = (await metaMultiSigWallet?.read.getTransactionStructHash([
                        nonce as bigint,
                        tx.txTo as TAddress,
                        BigInt(tx.amount),
                        tx.data as `0x${string}`,
                      ])) as `0x${string}`;

                      const signature = await walletClient.signMessage({
                        message: { raw: newHash },
                      });

                      const signer = await metaMultiSigWallet?.read.recover([newHash, signature]);

                      const isOwner = await metaMultiSigWallet?.read.isOwner([signer as TAddress]);

                      if (isOwner) {
                        const [finalSigList, finalSigners] = await getSortedSigList(
                          [...tx.signatures, signature],
                          newHash,
                        );

                        // await fetch(poolServerUrl, {
                        //   method: "POST",
                        //   headers: { "Content-Type": "application/json" },
                        //   body: JSON.stringify(
                        //     {
                        //       ...tx,
                        //       signatures: finalSigList,
                        //       signers: finalSigners,
                        //     },
                        //     // stringifying bigint
                        //     (key, value) => (typeof value === "bigint" ? value.toString() : value),
                        //   ),
                        // });
                        fetch("api/tx/update", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            id: tx.id,
                            signatures: finalSigList,
                            signers: finalSigners,
                          }, (key, value) => (typeof value === "bigint" ? value.toString() : value)),
                        })
                          .then(response => {
                            
                          })
                          .catch(error => {
                            console.error("Error:", error);
                            notification.error(`Error: ${error}`);
                          });
                
                      } else {
                        notification.info("Only owners can sign transactions");
                      }
                    } catch (e) {
                      notification.error("Error signing transaction");
                      console.log(e);
                    }
                  }}
                >
                  Sign
                </button>
              </div>

              <div title={!hasEnoughSignatures ? "Not enough signers to Execute"
                : (role !== 1 ? "Only Admin can execute the transaction" : "")}>
                <button
                  className="btn btn-xs btn-primary"
                  disabled={!hasEnoughSignatures || role !== 1}
                  onClick={async () => {
                    try {
                      if (!contractInfo || !metaMultiSigWallet) {
                        console.log("No contract info");
                        return;
                      }
                      const newHash = (await metaMultiSigWallet.read.getTransactionStructHash([
                        nonce as bigint,
                        tx.txTo as TAddress,
                        BigInt(tx.amount),
                        tx.data as `0x${string}`,
                      ])) as `0x${string}`;

                      const [finalSigList] = await getSortedSigList(tx.signatures, newHash);

                      await transactor(() =>
                        metaMultiSigWallet.write.executeTransaction([nonce || BigInt(0), tx.txTo as TAddress, BigInt(tx.amount), tx.data as `0x${string}`, finalSigList]),
                      );
                    } catch (e) {
                      notification.error("Error executing transaction");
                      console.log(e);
                    }
                  }}
                >
                  Exec
                </button>
              </div>
            </>
          )}

          <label htmlFor={`label-${tx.hash}`} className="btn btn-primary btn-xs">
            ...
          </label>
        </div>

        <div className="flex justify-between text-xs gap-4 mt-2">
          <div>Function name: {txnData.functionName || "transferFunds"}</div>

          <div className="flex gap-1 items-center">
            Addressed to: <Address address={(txnData.args?.[0] ? String(txnData.args?.[0]) : tx.txTo) as TAddress} size="xs" />
          </div>
        </div>
      </div>
    </>
  );
};
