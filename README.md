# Satoshi Arena

This is an on-chain PvP strategy game where players battle in turn-based duels with
@ZeusNetworkHQ zBTC pools✨

## Setting yourself up for success 😄

it is assumed the dev already has the necessary `anchor` and `solana cli` tools installed

- cd to `/anchor` and you can find the necessary config in `Anchor.toml` like `cluster = "devnet"` and the programId in `satoshi_arena = "6KciRUF5bK2uuhLY587Fzn1Z3bUYjjCFSVWo7negrVA9"`
- run `anchor build`
- run `anchor deploy`
- for the following test-required files `/anchor/tests/creator_wallet.json`, `/anchor/tests/game_store-keypair.json`, `/anchor/tests/player_wallet.json`, and `/anchor/tests/wallet.json` do `solana-keygen new -o /test/$(filename) --force` where file name is `creator_wallet.json`, `game_store-keypair.json`, etc respectively. 🚨 the `--force` flag is used o override any existing file with that exact same name

## Understanding the tests

in the root folder, cd to `/anchor` and locate the `/tests` directory where you'll find the `basic.spec.ts` test file

- The Initializing test is a one-time deployment state initiaalizer for Anchor where all the details like `token_mint` which is the zBTC token address, `treasury` is an account where all the platform fees go to, and `10` is the percent in bps, `10 is 0.1%` of the withdrawal amount.

# Satoshi Arena

Satoshi Arena is an on-chain PvP strategy game where players engage in turn-based duels using @ZeusNetworkHQ zBTC pools.

This documentation details the test suite used to validate and simulate the core gameplay and initialization logic of the smart contract. It provides an in-depth explanation of each test case found in `/anchor/tests/basic.spec.ts`.

---

## Test File Location

Navigate to the root folder and locate the tests at:

```
/anchor/tests/basic.spec.ts
```

#### 🚨 Not immediately

you'll have to run `anchor test --skip-build --skip-deploy` to run the tests here in his file
for now, Please finmish reading the Readme, and come back when you're done. 👍️

## Test Overview

### 1. **Program Initialization**

```ts
it('should initialize the program state', async () => { ... })
```

This is a one-time deployment setup that initializes the global state of the game. It sets the following:

- `token_mint`: The SPL token used in the game (zBTC).
- `treasury`: An account to receive platform fees.
- `10` (basis points): Represents a 0.1% fee applied during withdrawals.

#### Accounts:

- `globalState`: PDA to hold global settings.
- `authority`: Deployer/owner of the program.

### 2. **Game Creation by Creator**

```ts
it('should initialize a game', async () => { ... })
```

This test allows a creator to initialize a game session.

#### Key Parameters:

- `total_health`: Number of health points for the session.
- `pool_amount`: Amount of zBTC staked by the creator (converted from SOL to lamports).

#### Accounts:

- `creatorTokenAccount`: Associated Token Account for the creator.
- `tokenMint`: zBTC mint address.
- `signer`: Creator’s wallet.

#### on the frontend, the zBTC mint address are hardcoded in `/src/uils/program.ts` and

```ts
let gameStore = new PublicKey('E5hyZuNHMgnjAU4i98ohbB8GqTdJ9S7nrv8Q9voxhqwH') // this should change on every new programID
```

#### 🚨 should be changed to the address of the wallet at `/anchor/tests/game_store-keypair.json` which you would not store in plain sight, but for the purpose of this demo

### 3. **Joining the Game**

```ts
it('should join a game', async () => { ... })
```

Allows a second player to join an existing game session initialized by the creator.

#### Accounts:

- `playerTokenAccount`: The token account for the player.
- `vaultTokenAccount`: PDA-controlled vault to pool assets.
- `stateAccount`: Game state PDA.
- `player`: Joining player’s wallet.

### 4. **Playing a Turn (Player)**

```ts
it('should play joined game', async () => { ... })
```

This test simulates the player making a move.

#### Game Actions:

- `scissors`, `paper`, or `rock`: The move being made by the player.

#### Accounts:

- `stateAccount`: Game state PDA.
- `signer`: The player's wallet.

### 5. **Playing a Turn (Creator)**

```ts
it('should play joined game', async () => { ... })
```

Similar to the player’s turn, this test simulates the creator making their move.

#### Game Actions:

- `scissors`, `paper`, or `rock`.

#### Accounts:

- `stateAccount`: Game state PDA.
- `signer`: The creator's wallet.

### 6. **Resolving the Turn**

```ts
it('should resolve game', async () => { ... })
```

Resolves the turn and determines the outcome based on submitted moves by both players.

#### Accounts:

- `stateAccount`: Game state PDA that contains both players' turns and handles the logic to determine the result.

---

## Additional Notes

- **PDAs**: The program uses Program Derived Addresses for state and vault management:

  - `pda_state_account`: Unique to the creator’s session.
  - `pda_vault_token`: Securely holds pooled zBTC tokens.

- **Token Accounts**: All interactions with zBTC are done through associated token accounts created dynamically if not found.

- **Anchor Provider**: All operations use the environment’s Anchor provider configured for localnet/devnet during testing.

---

## Commented-Out Tests

There is a commented test for another game initialization from a different player which can be enabled for multi-session support testing.

```ts
// it('player should initialize a game', async () => { ... })
```

This test mirrors the creator’s initialization but from the perspective of a second user.

---

## Conclusion

This test suite covers the lifecycle of a Satoshi Arena game instance:

- Program initialization
- Game creation
- Player joining
- Moves submission
- Game resolution

Each test validates the program logic and state transitions, providing confidence in the deployed contract’s integrity.

### Now you can run `anchor test --skip-build --skip-deploy` happily 😁👍️
