use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;

declare_id!("ArkV9fZePgbQpyCLwNHMLTUMFqVVba812uTRWJxnYbqD");

#[program]
pub mod deposit_sol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let _deposit_data = &mut ctx.accounts.deposit_data;
        _deposit_data.total_amount = 0;
        _deposit_data.min_deposit_amount = 10000;
        _deposit_data.depositors = vec![];
        msg!("initialize deposit pda!");
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> ProgramResult {
        // Check if the deposit amount meets the minimum requirement
        if amount < ctx.accounts.deposit_data.min_deposit_amount {
            return Err(ProgramError::InsufficientFunds);
        }

        // transfer sol to program PDA
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.from.key(),
            &ctx.accounts.deposit_data.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.from.to_account_info(),
                ctx.accounts.deposit_data.to_account_info(),
            ],
        )?;

        // Increment the deposited amount in the PDA account
        let _deposit_data = &mut ctx.accounts.deposit_data;
        _deposit_data.total_amount += amount;
        _deposit_data.min_deposit_amount += 10000;
        _deposit_data.depositors.push(ctx.accounts.from.key());

        msg!("Received SOL deposit!");
        Ok(())
    }
}

// struct 1
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer=from, space=8 + 8 + 32 * 100 + 8, seeds=[b"deposit_", from.key().as_ref()], bump)]
    pub deposit_data: Account<'info, DepositData>,
    #[account(mut)]
    pub from: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub deposit_data: Account<'info, DepositData>,
    #[account(mut)]
    pub from: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct DepositData {
    pub total_amount: u64,
    pub min_deposit_amount: u64,
    pub depositors: Vec<Pubkey>,
}
