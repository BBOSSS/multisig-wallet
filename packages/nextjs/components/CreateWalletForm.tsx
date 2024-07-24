"use client";

import { type FC, useState } from "react";
import { Address, Balance, AddressInput, InputBase } from "~~/components/scaffold-eth";
import { Address as TAddress, isAddress } from "viem";
import Select from "react-select";
import { TrashIcon } from "@heroicons/react/24/outline";
import { 
  useDeployedContractInfo, 
  useScaffoldWriteContract, 
  useScaffoldReadContract, 
  useTargetNetwork 
} from "~~/hooks/scaffold-eth";
import { useLocalStorage } from "usehooks-ts";
import { usePublicClient } from "wagmi";
import interfaceAbi from "~~/contracts/InterfaceAbi";
import { notification } from "~~/utils/scaffold-eth";

type InputRowProps = {
  addr: TAddress,
  role: number,
  onAddrChange: (val: TAddress | undefined) => void,
  onRoleChange: (val: number | undefined) => void,
  onRemove: () => void,
}

const roleOptions = [
  { value: 1, label: "Admin" },
  { value: 2, label: "Signer" },
];

const InputRow = ({addr, role, onAddrChange, onRoleChange, onRemove}: InputRowProps) => {
  return (
    <div className="flex flex-row justify-between items-center gap-2 w-full">
      <div className="basis-32">
        <Select
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              "border": "2px solid #dfdfdf",
              "border-radius": "9999px",
            }),
          }}
          defaultValue={roleOptions[0]}
          options={roleOptions}
          onChange={(selectedOption) => {
            onRoleChange(selectedOption?.value);
          }}
        />
      </div>
      <div className="basis-96">
        <AddressInput
            placeholder="Signer Address"
            value={addr ?? ""}
            onChange={value => onAddrChange(value as TAddress)}
        />
      </div>
      <div className="basis-5">
        <button onClick={() => onRemove()}>
          <TrashIcon className="stroke-gray-700 h-6 w-6" />
        </button>
      </div>
    </div>
  )
}

type RowData = {
  owner: TAddress,
  role: number,
  key: number,
}

const proxyAddressStorageKey = "multisigWallet.proxyAddress";

export const CreateWalletForm: FC = () => {
  const [rows, setRows] = useState([{ key: 0, role: 1 } as RowData]);
  const [signaturesRequired, setSignaturesRequired] = useState(1);

  
  const { targetNetwork } = useTargetNetwork();
  const { data: walletFactoryContractInfo } = useDeployedContractInfo("WalletFactory");
  const { writeContractAsync: writeWalletFactoryContractAsync } = useScaffoldWriteContract("WalletFactory");
  const { data: multiSigWalletContractInfo } = useDeployedContractInfo("MultiSigWallet");

  const [proxyAddress, setProxyAddress] = useLocalStorage<TAddress>(
    proxyAddressStorageKey,
    "0x",
    { initializeWithValue: true },
  );

  const { data: walletProxyAddr } = useScaffoldReadContract({
    contractName: "WalletFactory",
    functionName: "calculateAddress",
    args: [
      multiSigWalletContractInfo?.address, 
      BigInt(targetNetwork.id),
      rows.map(item => item.owner),
      rows.map(item => item.role),
      BigInt(signaturesRequired),
    ],
  });
  const publicClient = usePublicClient({ chainId: targetNetwork.id });

  const handleRowChange = (index: number, row: RowData) => {
    const values = [...rows];
    values[index] = { ...row };
    setRows(values);
  };

  const addRow = () => {
    const newKey = rows.length > 0 ? rows[rows.length - 1].key + 1 : 0;
    setRows([...rows, { key: newKey, role: 1 } as RowData]);
  };
 
  const removeRow = (key: number) => {
    console.log("removeRow rows", rows);
    const values = rows.filter((item) => item.key !== key);
    console.log("removeRow values", values);
    if (values.length === 0) {
      setRows([{ key: 0, role: 1 } as RowData]);
    } else {
      setRows(values);
    }
  };
 
  const handleCreateClick = async () => {
    try {
      await writeWalletFactoryContractAsync({
        functionName: "createWallet",
        args: [
          multiSigWalletContractInfo?.address, 
          BigInt(targetNetwork.id),
          rows.map(item => item.owner),
          rows.map(item => item.role),
          BigInt(signaturesRequired),
        ],
      });
      if (walletProxyAddr && await isWalletProxyAddress(walletProxyAddr)) {
        setProxyAddress(walletProxyAddr);
        notification.success(
          <p>CreateWallet successfully</p>
        );
      } else {
        notification.error(
          <p>CreateWallet failed</p>
        );
      }
    } catch (err) {
      console.error("Error createWallet:", err);
      notification.error(
        <p>Error createWallet</p>
      );
    }
  }

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

  return (
    <div className="space-y-4 w-full">
      <div>
        {rows.map((item, index) => (
          <div className="pt-1.5">
            <InputRow
             addr={item.owner}
             role={item.role}
             onAddrChange={(val) => {
              item.owner = val || "0x";
              handleRowChange(index, item);
             }}
             onRoleChange={(val) => {
              item.role = val || 1;
              handleRowChange(index, item);
             }}
             onRemove={() => removeRow(item.key)}
            />
          </div>
        ))}
      </div>
      <button onClick={addRow}>➕ Add Signer</button>
      <div className="flex flex-row justify-between	items-center gap-4 w-full">
        <div className="basis-5/6">
          <InputBase
            value={signaturesRequired}
            placeholder="signaturesRequired"
            onChange={(value) => {
              setSignaturesRequired(value);
            }}
          />
        </div>
        <div className="basic-1/6">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCreateClick}
          >
            Create$
          </button>
        </div>
      </div>
    </div>
  );
};
