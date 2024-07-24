"use client";

import type { NextPage } from "next";
import { AddressInput } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { Address as TAddress, isAddress } from "viem";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { 
  useDeployedContractInfo,
  useTargetNetwork 
} from "~~/hooks/scaffold-eth";
import { usePublicClient } from "wagmi";
import interfaceAbi from "~~/contracts/InterfaceAbi";
import { WalletInfo } from "~~/components/WalletInfo";
import { CreateWalletForm } from "~~/components/CreateWalletForm";

const proxyAddressStorageKey = "multisigWallet.proxyAddress";

const Home: NextPage = () => {
  const { targetNetwork } = useTargetNetwork();
  const { data: multiSigWalletContractInfo } = useDeployedContractInfo("MultiSigWallet");
  const [inputAddress, setInputAddress] = useState<TAddress>();

  const [proxyAddress, setProxyAddress] = useLocalStorage<TAddress>(
    proxyAddressStorageKey,
    "0x",
    { initializeWithValue: true },
  );

  const publicClient = usePublicClient({ chainId: targetNetwork.id });

  const isWalletProxyAddress = async (addr: TAddress) => {
    if (!isAddress(addr)) {
      return false;
    }
    try {
      const data = await publicClient?.readContract({
        address: addr,
        abi: interfaceAbi.IProxy,
        functionName: 'masterCopy',
      })
      return data && data == multiSigWalletContractInfo?.address;
    } catch (e) {
      console.error("readContract failed:", e);
      return false;
    }
  }

  const handleConnectClick = async () => {
    if (inputAddress != undefined && (await isWalletProxyAddress(inputAddress))) {
      setProxyAddress(inputAddress);
    } else {
      notification.error(
        <p>Invalid input address</p>
      );
      console.error("invalid multisig wallet address");
    }
    setInputAddress(undefined);
  }

  return (
    <div className="flex items-center flex-col flex-grow w-full my-20 gap-8">
      {!isAddress(proxyAddress) ? (
        <div className="flex flex-col items-start shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 w-full max-w-lg">
          <p className="italic text-gray-500">Already have a multisig wallet address?</p>
          <div className="flex flex-row justify-between	items-center gap-4 w-full">
            <div className="basis-96">
              <AddressInput
                  placeholder="MultiSig Wallet Address"
                  value={inputAddress ?? ""}
                  onChange={value => setInputAddress(value as TAddress)}
              />
            </div>
            <div className="">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleConnectClick}
              >
                Connect
              </button>
            </div>
          </div>
          <p className="italic text-gray-500 pt-5">Create a multisig wallet.</p>
          <CreateWalletForm />
        </div>
      ) : (
        <WalletInfo
         address={proxyAddress as TAddress}
         onDisconnect={() => setProxyAddress("0x")}
        />
      )}
    </div>
  );
};

export default Home;
