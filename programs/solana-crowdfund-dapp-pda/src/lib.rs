use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;


declare_id!("H9LXFGcGXhvdrNqAkULWnN2ByxEzFzVqJQMvYQWVTfUj");

#[program]
pub mod solana_crowdfund_dapp_pda {
    use super::*;

    // fn 1
    pub fn initialize(ctx: Context<Initialize>, name: String, description: String) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        campaign.name = name;
        campaign.description = description;
        campaign.amount_donated = 0;
        campaign.admin = *ctx.accounts.user.key;
        Ok(())
    }


    // fn 2
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
        let campaign = &mut ctx.accounts.campaign;
        let user = &mut ctx.accounts.user;
        let rent_balance = Rent::get()?.minimum_balance(campaign.to_account_info().data_len());

        if campaign.admin != *user.key {
            return Err(ProgramError::IncorrectProgramId);
        }
        if **campaign.to_account_info().lamports.borrow() - rent_balance < amount {
            return Err(ProgramError::InsufficientFunds);
        }

        **campaign.to_account_info().try_borrow_mut_lamports()? -= amount;
        **user.to_account_info().try_borrow_mut_lamports()? += amount;
        Ok(())
    }

    // fn 3
    pub fn donate(ctx: Context<Donate>, amount: u64) -> ProgramResult {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.campaign.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &ix, 
            &[ctx.accounts.user.to_account_info(), ctx.accounts.campaign.to_account_info()]
        )?;
        (&mut ctx.accounts.campaign).amount_donated += amount;
        Ok(())
    }
}





// struct 1
#[derive(Accounts)]
#[instruction(name: String)]
pub struct Initialize<'info> {
    #[account(init, payer=user, space=9000, seeds=[user.key().as_ref(), b"_",  name.as_ref()], bump)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}


// struct 2
#[derive(Accounts)]
pub struct Withdraw<'info>{
    #[account(mut)]
    pub campaign : Account<'info, Campaign>,
    #[account(mut)]
    pub user: Signer<'info>,
}


// struct 3
#[derive(Accounts)]
pub struct Donate<'info>{
    #[account(mut)]
    pub campaign : Account<'info, Campaign>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}


// struct 4
#[account]
pub struct Campaign{
    pub name: String,
    pub description: String,
    pub amount_donated: u64,
    pub admin: Pubkey,
}