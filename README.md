# Featurs of this project
1. create solana DAPP
2. use PDA (Program Driven Address)
3. transfer funds from one account to other using onchain Rust code by CPI 
4. create React App (in app folder)
5. phantom wallet intigration in react




## Create new wallet
`cd my-solana-wallet`
`solana-keygen grind --starts-with cf:1`
`solana config set --url devnet`
`solana airdrop 2 -k [wallet.json]`

## Deploy program
run `yarn install` in root directory
set newly generated wallet address in "Anchor.toml" file
run `cargo clean` , `anchor build` and `solana address -k target/deploy/solana_crowdfunding_dapp-keypair.json`
copy new program id and past it in "Anchor.toml" and "lib.rs" files
run `anchor build && anchor deploy`


## Run frontend
copy `target/idl/[program name].json` file data and past it in `app/src/idl.json`
run `cd app`
run `npm install`
run `npm start`


## Explain Rust Program
#### In this program we use 4 struct
1. Initialize:
    This struct use for create and initialize the PDA. Whenver we create a new compaign that program will first create the PDA for thet compaign and that PDA will hold the program data and balance that any one will donate.
2. Withdraw
    This struct use for the withdraw balance from PDA and only admin who will create the compaign can withdraw the SOL.
3. Donate
    This struct use when a doner wants to donate an ammount of SOL and tha PDA will hold that SOL.
4. Compaign
    This is the basics struct that use in above all structs.

#### Functions that we use in this program
1. initialize(ctx: Context<Initialize>, name: String, description: String) -> Result<()>
    Use for create and initialize new compaign. This function gat the 3 perameters 1: Initialize struct, 2: name String and description String. 
2. withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult
    Use for withdraw the SOL from compaign PDA. This function get 2 parameters 1: Withdraw struct and amount u64.
3. donate(ctx: Context<Donate>, amount: u64) -> ProgramResult 
    Use for donate SOL to a compaign. This function get 2 parameters 1: Donate struct and amount u64.


# Use this application
1. run  this command in app folder `npm run` and open it on web browser
2. click on "Connect Wallet" button and connect the phantom wallet
3. click on "Get All Compaign" Button that will show the all compaign and you can donate some fix SOL to any of that compaign through your wallet and if you create any compaign and you are the admin of that compaign then you can withdraw some fix SOL from your compaign
4. click on "Create New Compaign" Button this will create new compaign against your wallet address and compaign name is hardcor