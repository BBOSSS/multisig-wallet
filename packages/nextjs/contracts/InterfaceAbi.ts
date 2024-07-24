import { GenericContract } from "~~/utils/scaffold-eth/contract";
import { Abi } from "abitype";

const interfaceAbi = {
    IProxy: [
        {
          "inputs": [],
          "name": "masterCopy",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ]
} as const;

export default interfaceAbi satisfies {
    [interfaceName: string]: Abi;
};