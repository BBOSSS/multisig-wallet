"use client";

import type { NextPage } from "next";
import { formatEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { useLocalStorage } from "usehooks-ts";
import { useState, useEffect } from "react";
import { Address as TAddress, isAddress } from "viem";

const roleMap: Map<number, string> = new Map([
  [0, "[0]Default"],
  [1, "[1]Admin"],
  [2, "[2]Signer"],
]);
const proxyAddressStorageKey = "multisigWallet.proxyAddress";

const Events: NextPage = () => {
  // const contractAddr = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
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

  const { data: DepositEvents, isLoading: isDepositEventsLoading } = useScaffoldEventHistory({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    eventName: "Deposit",
    fromBlock: 6366370n,
  });

  const { data: WithdrawEvents, isLoading: isWithdrawEventsLoading } = useScaffoldEventHistory({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    eventName: "Withdraw",
    fromBlock: 6366370n,
  });

  const { data: AddOwnerEvents, isLoading: isAddOwnerEventsLoading } = useScaffoldEventHistory({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    eventName: "AddOwner",
    fromBlock: 6366370n,
  });

  const { data: RemoveOwnerEvents, isLoading: isRemoveOwnerEventsLoading } = useScaffoldEventHistory({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    eventName: "RemoveOwner",
    fromBlock: 6366370n,
  });

  const { data: ExecuteTransactionEvents, isLoading: isExecuteTransactionEventsLoading } = useScaffoldEventHistory({
    contractAddr: proxyAddress,
    contractName: "MultiSigWallet",
    eventName: "ExecuteTransaction",
    fromBlock: 6366370n,
  });

  const getRole = (role: number | undefined) => {
    if (role == undefined || !roleMap.has(role)) {
      return "Unknown";
    }
    return roleMap.get(role);
  };

  return (
    <div className="flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
      {!hasProxy ? (
        <p className="text-3xl mt-14">No contracts found!</p>
      ) : (<>
      <div className="flex items-center flex-col flex-grow pt-10 w-full">
        {isDepositEventsLoading ? (
          <div className="flex justify-center items-center mt-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="w-2/5">
            <div className="text-center mb-4">
              <span className="block text-2xl font-bold">Deposit Events</span>
            </div>
            <div className="overflow-x-auto shadow-lg">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th className="bg-primary">Address</th>
                    <th className="bg-primary">Amount of ETH</th>
                    <th className="bg-primary">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {!DepositEvents || DepositEvents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center">
                        No events found
                      </td>
                    </tr>
                  ) : (
                    DepositEvents?.map((event, index) => {
                      return (
                        <tr key={index}>
                          <td className="text-center">
                            <Address address={event.args.sender} />
                          </td>
                          <td>{parseFloat(formatEther(event.args.amount || 0n)).toFixed(4)}</td>
                          <td>{parseFloat(formatEther(event.args.balance || 0n)).toFixed(4)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isWithdrawEventsLoading ? (
          <div className="flex justify-center items-center mt-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="mt-8 w-2/5">
            <div className="text-center mb-4">
              <span className="block text-2xl font-bold">Withdraw Events</span>
            </div>
            <div className="overflow-x-auto shadow-lg">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="bg-primary">Address</th>
                    <th className="bg-primary">Amount of ETH</th>
                    <th className="bg-primary">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {!WithdrawEvents || WithdrawEvents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center">
                        No events found
                      </td>
                    </tr>
                  ) : (
                    WithdrawEvents?.map((event, index) => {
                      return (
                        <tr key={index}>
                          <td className="text-center">
                            <Address address={event.args.to} />
                          </td>
                          <td>{parseFloat(formatEther(event.args.amount || 0n)).toFixed(4)}</td>
                          <td>{parseFloat(formatEther(event.args.balance || 0n)).toFixed(4)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isAddOwnerEventsLoading ? (
          <div className="flex justify-center items-center mt-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="mt-8 w-2/5">
            <div className="text-center mb-4">
              <span className="block text-2xl font-bold">Add Owner Events</span>
            </div>
            <div className="overflow-x-auto shadow-lg">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="bg-primary">Address</th>
                    <th className="bg-primary">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {!AddOwnerEvents || AddOwnerEvents.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center">
                        No events found
                      </td>
                    </tr>
                  ) : (
                    AddOwnerEvents?.map((event, index) => {
                      return (
                        <tr key={index}>
                          <td className="text-center">
                            <Address address={event.args.owner} />
                          </td>
                          <td>{getRole(event.args.role)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isRemoveOwnerEventsLoading ? (
          <div className="flex justify-center items-center mt-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="mt-8 mb-8 w-2/5">
            <div className="text-center mb-4">
              <span className="block text-2xl font-bold">Remove Owner Events</span>
            </div>
            <div className="overflow-x-auto shadow-lg mb-5">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="bg-primary">Address</th>
                    <th className="bg-primary">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {!RemoveOwnerEvents || RemoveOwnerEvents.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center">
                        No events found
                      </td>
                    </tr>
                  ) : (
                    RemoveOwnerEvents?.map((event, index) => {
                      return (
                        <tr key={index}>
                          <td className="text-center">
                            <Address address={event.args.owner} />
                          </td>
                          <td>{getRole(event.args.role)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isExecuteTransactionEventsLoading ? (
          <div className="flex justify-center items-center mt-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="mt-8 mb-8 w-2/5">
            <div className="text-center mb-4">
              <span className="block text-2xl font-bold">Execute Transaction Events</span>
            </div>
            <div className="overflow-x-auto shadow-lg mb-5">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="bg-primary">Operator</th>
                    <th className="bg-primary">To</th>
                    <th className="bg-primary">Value</th>
                    <th className="bg-primary">Data</th>
                    <th className="bg-primary">Nonce</th>
                    <th className="bg-primary">Hash</th>
                    <th className="bg-primary">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {!ExecuteTransactionEvents || ExecuteTransactionEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center">
                        No events found
                      </td>
                    </tr>
                  ) : (
                    ExecuteTransactionEvents?.map((event, index) => {
                      return (
                        <tr key={index}>
                          <td className="text-center">
                            <Address address={event.args.owner} />
                          </td>
                          <td className="text-center">
                            <Address address={event.args.to} />
                          </td>
                          <td>{parseFloat(formatEther(event.args.value || 0n)).toFixed(4)}</td>
                          <td>{event.args.data}</td>
                          <td>{event.args.nonce? event.args.nonce.toString() : "NaN"}</td>
                          <td>{event.args._hash}</td>
                          <td>{event.args.result}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>)}
    </div>
  );
};

export default Events;
