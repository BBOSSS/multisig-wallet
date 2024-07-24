//
// This script executes when you run 'yarn test'
//
import hre from "hardhat";
import { ethers } from "hardhat";
import { MultiSigWallet } from "../typechain-types/MultiSigWallet";
import { MultiSigWallet__factory } from "../typechain-types/factories";
import { expect } from "chai";

describe("🚩 MultiSigWallet Test", function () {
  // Change to name and type of your contract
  let multiSigWallet: MultiSigWallet;

  async function deployContracts() {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    // Don't change contractArtifact creation
    let contractArtifact: string;
    if (contractAddress) {
      // For the autograder.
      contractArtifact = `contracts/download-${contractAddress}.sol:MultiSigWallet`;
    } else {
      contractArtifact = "contracts/MultiSigWallet.sol:MultiSigWallet";
    }
    const multiSigWalletFactory = await ethers.getContractFactory(contractArtifact) as MultiSigWallet__factory;
    multiSigWallet = (await multiSigWalletFactory.deploy()) as MultiSigWallet;
  }

  describe("⚙  Setup contracts", function () {
    it("Should deploy the contract", async function () {
      await deployContracts();
      console.log("\t", " 🛰  Contract deployed on",);
    });
    it("Should init successfuly", async function () {
      const signers = await ethers.getSigners();
      const chainId = await hre.getChainId();
      const owners = [signers[0].address, signers[1].address];
      await multiSigWallet.init(chainId, owners, [1, 2], 2);
    });
  });
});
