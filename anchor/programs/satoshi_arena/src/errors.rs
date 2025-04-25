use anchor_lang::prelude::*;

#[error_code]
pub enum SatoshiError {
    #[msg("The project is already initialized.")]
    AlreadyInitialized,
    #[msg("The project is not initialized.")]
    NotInitialized,
    #[msg("Not your Turn")]
    NotTurn,
    #[msg("The task is not completed.")]
    TaskNotCompleted,
    #[msg("The caller is not a participant.")]
    NotAParticipant,
    #[msg("Unauthorized access.")]
    Unauthorized,
    #[msg("Game already has a player.")]
    AlreadyJoined,
    #[msg("Game is not over yet.")]
    GameNotOver,
    #[msg("Only the winner can claim the reward.")]
    NotWinner,
    #[msg("Wait for other Player")]
    IncompleteTurn,
    #[msg("Turn has not timed out yet.")]
    NotTimedOut,
    #[msg("Invalid attempt to force resolve.")]
    InvalidForceResolve,
    #[msg("Winner hasnt claimed Reward")]
    RewardNotClaimed,
    #[msg("Winner Already Claimed, account closed")]
    AlreadyClaimed,
}
