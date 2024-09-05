import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat/";
import { MultiSigWallet, WalletFactory, WalletProxy } from "../typechain-types";
import { verify } from "../utils/verify";

const verifyContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const localNetworkList = ["hardhat", "localhost"];
  if (localNetworkList.includes(hre.network.name) || !process.env.ETHERSCAN_API_KEY) {
    return;
  }
  // const { deployer } = await hre.getNamedAccounts();

  const multiSigWallet: MultiSigWallet = await ethers.getContract("MultiSigWallet");
  const multiSigWalletAddress = await multiSigWallet.getAddress();
  await verify(multiSigWalletAddress, []);

  const walletFactory: WalletFactory = await ethers.getContract("WalletFactory");
  const walletFactoryAddress = await walletFactory.getAddress();
  await verify(walletFactoryAddress, []);

  const walletProxy: WalletProxy = await ethers.getContract("WalletProxy");
  const walletProxyAddress = await walletProxy.getAddress();
  await verify(walletProxyAddress, [multiSigWalletAddress]);
};

export default verifyContract;

verifyContract.tags = ["verify"];
