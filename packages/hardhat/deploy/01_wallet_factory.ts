import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";
import { WalletFactory } from "../typechain-types";

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployWalletFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("WalletFactory", {
    from: deployer,
    // Contract constructor arguments
    args: [],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const walletFactory = await hre.ethers.getContract<WalletFactory>("WalletFactory", deployer) as WalletFactory;
  const walletFactoryAddress = await walletFactory.getAddress();
  console.log("👋 WalletFactory address:", walletFactoryAddress);
  // const multiSigWallet = await hre.ethers.getContract<Contract>("MultiSigWallet", deployer);
  // const multiSigWalletAddress = await multiSigWallet.getAddress();
  // console.log("👋 MultiSigWallet address:", multiSigWalletAddress);

  // console.log("Creaate wallet proxy...");
  // const owners = [
  //   "0x28D15b147497aa5B891DB7287525443cd148F318", 
  //   "0x1cC6164C851945D7Ea266f90dc2C89117faD7379"
  // ];
  // await walletFactory.createWallet(multiSigWalletAddress, owners, [1, 2], 2);
  // const proxyAddr = await walletFactory.calculateAddress(multiSigWalletAddress, owners, [1, 2], 2);
  // console.log("👋 Wallet proxyAddr:", proxyAddr);
};

export default deployWalletFactory;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags WalletFactory
deployWalletFactory.tags = ["WalletFactory"];
