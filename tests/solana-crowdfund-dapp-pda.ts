import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaCrowdfundDappPda } from "../target/types/solana_crowdfund_dapp_pda";


function shortKey(key: anchor.web3.PublicKey) {
  return key.toString().substring(0, 8);
}


describe("solana-crowdfund-dapp-pda", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolanaCrowdfundDappPda as Program<SolanaCrowdfundDappPda>;

  // create new keypair and airdrop 2 sol
  async function generateKeypair() {
    let keypair = anchor.web3.Keypair.generate();
    await provider.connection.requestAirdrop(
      keypair.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 3 * 1000)); // Sleep 3s
    return keypair;
  }


  //generate PDA keypair
  async function derivePda(name: string, pubkey: anchor.web3.PublicKey) {
    let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
      [pubkey.toBuffer(), Buffer.from("_"), Buffer.from(name)],
      program.programId
    );
    return pda;
  }


  const campaignName = "1st campain";
  async function createCampaignAccount(name: string, pda: anchor.web3.PublicKey, wallet: anchor.web3.Keypair){
    const tx = await program.methods.initialize(name, "1st campain describe")
    .accounts({
      campaign: pda,
      user: wallet.publicKey,
    })
    .signers([wallet])
    .rpc();
    console.log("Your transaction signature", tx);
  }


  
async function donateToCampain(pda: anchor.web3.PublicKey, wallet: anchor.web3.Keypair){
    const tx = await program.methods.donate(new anchor.BN(1* anchor.web3.LAMPORTS_PER_SOL))
    .accounts({
      campaign: pda,
      user: wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([wallet])
    .rpc();
    console.log("Your transaction signature", tx);
}



  it("Is initialized!", async () => {
    console.log("\n\n----------------------Start Test Script------------------");
    const testKeypair = await generateKeypair();
    const pda = await derivePda(campaignName, testKeypair.publicKey);
    await createCampaignAccount(campaignName, pda, testKeypair);
    console.log("Create campain transaction completed. campain address: " + pda.toBase58(), "\n");


    // const wallet_donate = await generateKeypair();
    // const tx = await program.methods.donate(new anchor.BN(1* anchor.web3.LAMPORTS_PER_SOL))
    // .accounts({
    //   campaign: pda,
    //   user: wallet_donate.publicKey,
    //   systemProgram: anchor.web3.SystemProgram.programId,
    // })
    // .signers([wallet_donate])
    // .rpc();
    // console.log("Your transaction signature", tx);

    const donateKeypair = await generateKeypair();
    await donateToCampain(pda, donateKeypair)
    console.log("Donate 1 sol.");
    });
    

});
