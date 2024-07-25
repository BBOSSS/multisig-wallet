import { run } from "hardhat";
import { Address } from "hardhat-deploy/types";

export async function verify(contractAddress: Address, args: any[]) {
  console.log("Verify contract...");
  await run("verify:verify", {
    address: contractAddress,
    constructorArguments: args,
  }).catch(e => {
    console.error(e);
  });
}
