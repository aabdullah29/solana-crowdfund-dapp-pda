import idl from './idl.json'
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Program, AnchorProvider, web3, utils, BN } from '@project-serum/anchor'
import './App.css';
import { useEffect, useState } from 'react';
import { Buffer } from 'buffer'
window.Buffer = Buffer

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  const [campaignName, setCampaignName] = useState([])
  const [campaignDescription, setCampaignDescription] = useState([])
  const [donateAmount, setDonateAmount] = useState([])
  const [withdrawAmount, setWithdrawAmount] = useState([])

  const getProvider = () => {
    const prodramId = new PublicKey(idl.metadata.address)
    const network = clusterApiUrl('devnet')
    const opts = { preflightCommitment: 'processed' }
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new AnchorProvider(connection, window.solana, opts.preflightCommitment)

    const program = new Program(idl, prodramId, provider)

    return { connection, provider, program }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window
      if (solana) {
        if (solana.isPhantom) {
          console.log('=====> Phantom Wallet found.')
          const response = await solana.connect({ onlyIfTrusted: true })
          console.log('=====> Connect with Publickey: ', response.publicKey.toString())
          setWalletAddress(response.publicKey.toString())
        } else {
          alert('Solana object notfound, please install phantom wallet.')
        }
      }
    } catch (error) {
      console.error('===> Error', error)
    }
  };

  const connectToWallet = async () => {
    const { solana } = window
    if (solana) {
      const responce = await solana.connect();
      console.log('=====> connect with publickey: ', responce.publicKey.toString())
      setWalletAddress(responce.publicKey.toString())
    }
  }

  const createCampaign = async () => {
    if (typeof(campaignName) !== 'string' || typeof(campaignDescription) !== 'string'){
      return;
    }
    console.log('===> campaign name: ',campaignName, "\n===> campaign description: ", campaignDescription);

    try {
      const { connection, provider, program } = getProvider()
      const [campaign, _] = await PublicKey.findProgramAddress(
        [provider.wallet.publicKey.toBuffer(), Buffer.from("_"), Buffer.from(campaignName)],
        program.programId
      )

      await program.methods.initialize(campaignName, campaignDescription)
      .accounts({
          campaign,
          user: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId
      })
      .rpc();

      console.log('=====> Create new campaign: ', campaign.toString())
    } catch (error) {
      console.error('===> Error', error)
    }
  }

  const getCampaign = async () => {
    const { connection, provider, program } = getProvider()
    Promise.all((await connection.getProgramAccounts(program.programId))
    .map(async (campaign) => ({...(await program.account.campaign.fetch(campaign.pubkey)), 
      pubkey: campaign.pubkey, 
      accountCurrentBalance: (await connection.getBalance(campaign.pubkey) - 63530880)
    })
    )).then((campaigns) => {setCampaigns(campaigns)})
  }

  const donate = async (publicKey) => {
    let amount = 0;
    if (typeof(donateAmount) !== 'string'){
      return;
    } else {
      try{
        amount = Number(donateAmount)
      } catch(e){
        console.log("its not a number")
        return
      }
    }

    try{
      const { connection, provider, program } = getProvider()
      await program.rpc.donate(new BN(amount * LAMPORTS_PER_SOL), {
        accounts: {
          campaign: publicKey,
          user: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        }
      })

      console.log('Donate to Campaign: ', publicKey.toString())
      getCampaign()
    } catch (error) {
      console.error('===> Error', error)
    }
  }

  const withdraw = async (publicKey) => {
    let amount = 0;
    if (typeof(withdrawAmount) !== 'string'){
      return;
    } else {
      try{
        amount = Number(withdrawAmount)
      } catch(e){
        console.log("its not a number")
        return
      }
    }

    try{
      const { connection, provider, program } = getProvider()
      program.rpc.withdraw(new BN(amount * LAMPORTS_PER_SOL), {
        accounts: {
          campaign: publicKey,
          user: provider.wallet.publicKey,
        }
      })
      console.log('withdraw to: ', provider.wallet.publicKey.toBase58())
      getCampaign()
    } catch (error) {
      console.error('===> Error', error)
    }
  }


  const renderNotConnectedContainer = () => {
    return <button onClick={connectToWallet}> Connect to Wallet </button>
  }

  const renderConnectedContainer = () => {
    return <>
    <br />
    <button onClick={getCampaign}> Get All Campaigns </button>
    <br/> <br/>
    <input type="text" placeholder='Campaign Name' onChange={(e)=>{setCampaignName(e.target.value)}}></input> &nbsp;
    <input type="text" placeholder='Campaign Description' onChange={(e)=>{setCampaignDescription(e.target.value)}}></input> &nbsp;
    <button onClick={createCampaign}> Create New Campaign </button>
    <br />
    {campaigns.map(campaign => (<>
    <hr />
    <h4>Campaign Id: {campaign.pubkey.toString()}</h4>
    <p>{campaign.name}</p>
    <p>{campaign.description}</p>
    <p>Donation Amount: {(campaign.amountDonated / LAMPORTS_PER_SOL).toString()}</p>
    <p>Current Balance: {(campaign.accountCurrentBalance / LAMPORTS_PER_SOL).toString()}</p>
    <input type="text" placeholder='Donate Amount' onChange={(e)=>{setDonateAmount(e.target.value)}}></input> &nbsp;
    <button onClick={() => donate(campaign.pubkey)}>Click to Donate</button>
    <br /> <br />
    <input type="text" placeholder='Withdraw Amount' onChange={(e)=>{setWithdrawAmount(e.target.value)}}></input> &nbsp;
    <button onClick={() => withdraw(campaign.pubkey)}>Click to Withdraw</button>
    <br/> <br />
    </>))}
    </>
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected()
    }
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, []);

  return <div className='App'>
    {!walletAddress && renderNotConnectedContainer()}
    {walletAddress && renderConnectedContainer()}
  </div>
}

export default App;
