const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkillProof", function () {
  let SkillProof;
  let skillProof;
  let owner;
  let client;
  let verifier;
  let user;
  let addrs;

  beforeEach(async function () {
    [owner, client, verifier, user, ...addrs] = await ethers.getSigners();
    
    SkillProof = await ethers.getContractFactory("SkillProof");
    skillProof = await SkillProof.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await skillProof.owner()).to.equal(owner.address);
    });

    it("Should register the owner as the first verifier", async function () {
      const verifierInfo = await skillProof.getVerifier(owner.address);
      expect(verifierInfo.isActive).to.be.true;
      expect(verifierInfo.name).to.equal("Contract Owner");
    });

    it("Should have correct initial fees", async function () {
      expect(await skillProof.verificationFee()).to.equal(ethers.parseEther("0.01"));
      expect(await skillProof.mintingFee()).to.equal(ethers.parseEther("0.005"));
    });
  });

  describe("Client Registration", function () {
    it("Should allow a user to register as a client", async function () {
      await skillProof.connect(client).registerClient("Test Client");
      
      const clientInfo = await skillProof.getClient(client.address);
      expect(clientInfo.isActive).to.be.true;
      expect(clientInfo.name).to.equal("Test Client");
    });

    it("Should not allow duplicate client registration", async function () {
      await skillProof.connect(client).registerClient("Test Client");
      
      await expect(
        skillProof.connect(client).registerClient("Another Name")
      ).to.be.revertedWith("Client already registered");
    });

    it("Should not allow empty name", async function () {
      await expect(
        skillProof.connect(client).registerClient("")
      ).to.be.revertedWith("Name cannot be empty");
    });
  });

  describe("Verifier Registration", function () {
    it("Should allow owner to register a verifier", async function () {
      await skillProof.registerVerifier(verifier.address, "Test Verifier");
      
      const verifierInfo = await skillProof.getVerifier(verifier.address);
      expect(verifierInfo.isActive).to.be.true;
      expect(verifierInfo.name).to.equal("Test Verifier");
    });

    it("Should not allow non-owner to register verifiers", async function () {
      await expect(
        skillProof.connect(client).registerVerifier(verifier.address, "Test Verifier")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow duplicate verifier registration", async function () {
      await skillProof.registerVerifier(verifier.address, "Test Verifier");
      
      await expect(
        skillProof.registerVerifier(verifier.address, "Another Name")
      ).to.be.revertedWith("Verifier already registered");
    });
  });

  describe("Verification Submission", function () {
    beforeEach(async function () {
      await skillProof.connect(client).registerClient("Test Client");
    });

    it("Should allow client to submit verification", async function () {
      const skills = ["JavaScript", "React", "Node.js"];
      
      await expect(
        skillProof.connect(client).submitVerification(
          user.address,
          "Web Development Project",
          "A full-stack web application",
          Math.floor(Date.now() / 1000),
          skills
        )
      ).to.emit(skillProof, "VerificationSubmitted");

      const verification = await skillProof.getVerification(1);
      expect(verification.user).to.equal(user.address);
      expect(verification.client).to.equal(client.address);
      expect(verification.name).to.equal("Web Development Project");
      expect(verification.status).to.equal(0); // PENDING
    });

    it("Should not allow non-client to submit verification", async function () {
      await expect(
        skillProof.connect(user).submitVerification(
          user.address,
          "Test Project",
          "Test Description",
          Math.floor(Date.now() / 1000),
          ["JavaScript"]
        )
      ).to.be.revertedWith("Only registered clients can call this");
    });

    it("Should not allow submission with empty name", async function () {
      await expect(
        skillProof.connect(client).submitVerification(
          user.address,
          "",
          "Test Description",
          Math.floor(Date.now() / 1000),
          ["JavaScript"]
        )
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should not allow submission with empty description", async function () {
      await expect(
        skillProof.connect(client).submitVerification(
          user.address,
          "Test Project",
          "",
          Math.floor(Date.now() / 1000),
          ["JavaScript"]
        )
      ).to.be.revertedWith("Description cannot be empty");
    });

    it("Should not allow submission with future completion date", async function () {
      const futureTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      
      await expect(
        skillProof.connect(client).submitVerification(
          user.address,
          "Test Project",
          "Test Description",
          futureTime,
          ["JavaScript"]
        )
      ).to.be.revertedWith("Completion date cannot be in the future");
    });

    it("Should not allow submission without skills", async function () {
      await expect(
        skillProof.connect(client).submitVerification(
          user.address,
          "Test Project",
          "Test Description",
          Math.floor(Date.now() / 1000),
          []
        )
      ).to.be.revertedWith("At least one skill must be specified");
    });
  });

  describe("Verification Approval/Rejection", function () {
    beforeEach(async function () {
      await skillProof.connect(client).registerClient("Test Client");
      await skillProof.registerVerifier(verifier.address, "Test Verifier");
      
      await skillProof.connect(client).submitVerification(
        user.address,
        "Test Project",
        "Test Description",
        Math.floor(Date.now() / 1000),
        ["JavaScript"]
      );
    });

    it("Should allow verifier to approve verification", async function () {
      await expect(
        skillProof.connect(verifier).approveVerification(1)
      ).to.emit(skillProof, "VerificationApproved");

      const verification = await skillProof.getVerification(1);
      expect(verification.status).to.equal(1); // APPROVED
    });

    it("Should allow verifier to reject verification", async function () {
      await expect(
        skillProof.connect(verifier).rejectVerification(1, "Insufficient evidence")
      ).to.emit(skillProof, "VerificationRejected");

      const verification = await skillProof.getVerification(1);
      expect(verification.status).to.equal(2); // REJECTED
    });

    it("Should not allow non-verifier to approve verification", async function () {
      await expect(
        skillProof.connect(user).approveVerification(1)
      ).to.be.revertedWith("Only registered verifiers can call this");
    });

    it("Should not allow approval of already processed verification", async function () {
      await skillProof.connect(verifier).approveVerification(1);
      
      await expect(
        skillProof.connect(verifier).approveVerification(1)
      ).to.be.revertedWith("Verification not pending");
    });
  });

  describe("NFT Minting", function () {
    beforeEach(async function () {
      await skillProof.connect(client).registerClient("Test Client");
      await skillProof.registerVerifier(verifier.address, "Test Verifier");
      
      await skillProof.connect(client).submitVerification(
        user.address,
        "Test Project",
        "Test Description",
        Math.floor(Date.now() / 1000),
        ["JavaScript"]
      );
      
      await skillProof.connect(verifier).approveVerification(1);
    });

    it("Should allow user to mint NFT for approved verification", async function () {
      const mintingFee = await skillProof.mintingFee();
      const metadataURI = "ipfs://QmTestMetadata";
      
      await expect(
        skillProof.connect(user).mintNFT(1, metadataURI, { value: mintingFee })
      ).to.emit(skillProof, "NFTMinted");

      expect(await skillProof.ownerOf(1)).to.equal(user.address);
      expect(await skillProof.tokenURI(1)).to.equal(metadataURI);
      
      const verification = await skillProof.getVerification(1);
      expect(verification.status).to.equal(3); // NFT_MINTED
    });

    it("Should not allow minting without sufficient fee", async function () {
      const insufficientFee = ethers.parseEther("0.001");
      
      await expect(
        skillProof.connect(user).mintNFT(1, "ipfs://QmTest", { value: insufficientFee })
      ).to.be.revertedWith("Insufficient minting fee");
    });

    it("Should not allow minting for non-approved verification", async function () {
      const mintingFee = await skillProof.mintingFee();
      
      await expect(
        skillProof.connect(user).mintNFT(1, "ipfs://QmTest", { value: mintingFee })
      ).to.be.revertedWith("Verification not approved");
    });

    it("Should not allow double minting", async function () {
      const mintingFee = await skillProof.mintingFee();
      
      await skillProof.connect(user).mintNFT(1, "ipfs://QmTest", { value: mintingFee });
      
      await expect(
        skillProof.connect(user).mintNFT(1, "ipfs://QmTest2", { value: mintingFee })
      ).to.be.revertedWith("NFT already minted");
    });

    it("Should not allow non-owner to mint", async function () {
      const mintingFee = await skillProof.mintingFee();
      
      await expect(
        skillProof.connect(client).mintNFT(1, "ipfs://QmTest", { value: mintingFee })
      ).to.be.revertedWith("Not the verification owner");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await skillProof.connect(client).registerClient("Test Client");
      await skillProof.registerVerifier(verifier.address, "Test Verifier");
    });

    it("Should return user verifications", async function () {
      await skillProof.connect(client).submitVerification(
        user.address,
        "Project 1",
        "Description 1",
        Math.floor(Date.now() / 1000),
        ["JavaScript"]
      );
      
      await skillProof.connect(client).submitVerification(
        user.address,
        "Project 2",
        "Description 2",
        Math.floor(Date.now() / 1000),
        ["Python"]
      );

      const userVerifications = await skillProof.getUserVerifications(user.address);
      expect(userVerifications.length).to.equal(2);
      expect(userVerifications[0]).to.equal(1);
      expect(userVerifications[1]).to.equal(2);
    });

    it("Should return client verifications", async function () {
      await skillProof.connect(client).submitVerification(
        user.address,
        "Project 1",
        "Description 1",
        Math.floor(Date.now() / 1000),
        ["JavaScript"]
      );

      const clientVerifications = await skillProof.getClientVerifications(client.address);
      expect(clientVerifications.length).to.equal(1);
      expect(clientVerifications[0]).to.equal(1);
    });

    it("Should return verification skills", async function () {
      const skills = ["JavaScript", "React", "Node.js"];
      
      await skillProof.connect(client).submitVerification(
        user.address,
        "Test Project",
        "Test Description",
        Math.floor(Date.now() / 1000),
        skills
      );

      const returnedSkills = await skillProof.getVerificationSkills(1);
      expect(returnedSkills).to.deep.equal(skills);
    });

    it("Should return total counts", async function () {
      expect(await skillProof.getTotalVerifications()).to.equal(0);
      expect(await skillProof.getTotalNFTs()).to.equal(0);

      await skillProof.connect(client).submitVerification(
        user.address,
        "Test Project",
        "Test Description",
        Math.floor(Date.now() / 1000),
        ["JavaScript"]
      );

      expect(await skillProof.getTotalVerifications()).to.equal(1);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set fees", async function () {
      const newVerificationFee = ethers.parseEther("0.02");
      const newMintingFee = ethers.parseEther("0.01");

      await skillProof.setVerificationFee(newVerificationFee);
      await skillProof.setMintingFee(newMintingFee);

      expect(await skillProof.verificationFee()).to.equal(newVerificationFee);
      expect(await skillProof.mintingFee()).to.equal(newMintingFee);
    });

    it("Should not allow non-owner to set fees", async function () {
      await expect(
        skillProof.connect(client).setVerificationFee(ethers.parseEther("0.02"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to deactivate clients", async function () {
      await skillProof.connect(client).registerClient("Test Client");
      
      await skillProof.deactivateClient(client.address);
      
      const clientInfo = await skillProof.getClient(client.address);
      expect(clientInfo.isActive).to.be.false;
    });

    it("Should allow owner to deactivate verifiers", async function () {
      await skillProof.registerVerifier(verifier.address, "Test Verifier");
      
      await skillProof.deactivateVerifier(verifier.address);
      
      const verifierInfo = await skillProof.getVerifier(verifier.address);
      expect(verifierInfo.isActive).to.be.false;
    });
  });
}); 