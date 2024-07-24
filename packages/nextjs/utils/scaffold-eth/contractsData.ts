import scaffoldConfig from "~~/scaffold.config";
import { contracts } from "~~/utils/scaffold-eth/contract";

export function getAllContracts() {
  const contractsData = contracts?.[scaffoldConfig.targetNetworks[0].id];
  // return contractsData ? contractsData : {};
  if (!contractsData) {
    return {};
  }
  // const walletContract = contractsData.MultiSigWallet;
  // const proxyContract = contractsData.WalletProxy;
  // if (walletContract && proxyContract) {
  //   contractsData.WalletProxy = {...walletContract};
  //   contractsData.WalletProxy.address = proxyContract.address;
  // }
  // return contractsData;
  const proxyContract = contractsData.WalletProxy;
  if (proxyContract) {
    delete contractsData.WalletProxy;
  }
  return contractsData;
}
