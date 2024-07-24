"use client";

import { QRCodeSVG } from "qrcode.react";
import { Address, Balance } from "~~/components/scaffold-eth";
import { Address as TAddress } from "viem";

type WalletInfoProps = {
  address: TAddress;
  onDisconnect?: () => void;
};

/**
 * Display (ETH & USD) balance of an ETH address.
 */
export const WalletInfo = ({address, onDisconnect}: WalletInfoProps) => {
  return (
    <div className="flex flex-col gap-4 items-center shadow-lg shadow-secondary border-8 border-secondary rounded-xl p-6 w-full max-w-lg">
      <Balance address={address} />
      <QRCodeSVG value={address || ""} size={256} />
      <Address address={address} />
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => {
          if (onDisconnect) {
            onDisconnect();
          }
        }}
      >
        Disconnect
      </button>
    </div>
  );
};
