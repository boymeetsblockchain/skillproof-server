const hre = require("hardhat");

async function main() {
  console.log("Deploying SkillProof contract...");

  const SkillProof = await hre.ethers.getContractFactory("SkillProof");
  const skillProof = await SkillProof.deploy();

  await skillProof.waitForDeployment();

  const address = await skillProof.getAddress();
  console.log("SkillProof deployed to:", address);

  // Verify the contract on Etherscan (if not on localhost)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await skillProof.deploymentTransaction().wait(6);
    await verify(address, []);
  }
}

async function verify(contractAddress, args) {
  console.log("Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 