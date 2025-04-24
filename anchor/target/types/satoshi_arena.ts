/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/satoshi_arena.json`.
 */
export type SatoshiArena = {
  "address": "A3gFj48ggWberfYRJ5o9nT3yPYaXmcZrgg5VmSyxMFCS",
  "metadata": {
    "name": "satoshiArena",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimReward",
      "discriminator": [
        149,
        95,
        181,
        242,
        94,
        90,
        158,
        162
      ],
      "accounts": [
        {
          "name": "stateAccount",
          "writable": true
        },
        {
          "name": "claimer",
          "writable": true,
          "signer": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  97,
                  116,
                  111,
                  115,
                  104,
                  105,
                  95,
                  97,
                  114,
                  101,
                  110,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "stateAccount"
              }
            ]
          }
        },
        {
          "name": "claimerTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "globalState"
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "forceResolveIfTimeout",
      "discriminator": [
        137,
        42,
        61,
        236,
        235,
        87,
        178,
        1
      ],
      "accounts": [
        {
          "name": "stateAccount",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "globalState",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "tokenMint",
          "type": "pubkey"
        },
        {
          "name": "treasury",
          "type": "pubkey"
        },
        {
          "name": "treasuryCutBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "initializeGame",
      "discriminator": [
        44,
        62,
        102,
        247,
        126,
        208,
        130,
        215
      ],
      "accounts": [
        {
          "name": "stateAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  97,
                  116,
                  111,
                  115,
                  104,
                  105,
                  95,
                  97,
                  114,
                  101,
                  110,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "creatorTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "stateAccount"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "totalHealth",
          "type": "u8"
        },
        {
          "name": "poolAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "joinGame",
      "discriminator": [
        107,
        112,
        18,
        38,
        56,
        173,
        60,
        128
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "playerTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "stateAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "playTurn",
      "discriminator": [
        116,
        200,
        44,
        67,
        23,
        228,
        209,
        99
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "stateAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "action",
          "type": {
            "defined": {
              "name": "playerAction"
            }
          }
        }
      ]
    },
    {
      "name": "resolveTurn",
      "discriminator": [
        97,
        96,
        32,
        80,
        136,
        41,
        228,
        44
      ],
      "accounts": [
        {
          "name": "stateAccount",
          "writable": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "gameSessionHealth",
      "discriminator": [
        13,
        173,
        69,
        16,
        177,
        214,
        55,
        245
      ]
    },
    {
      "name": "globalState",
      "discriminator": [
        163,
        46,
        74,
        168,
        216,
        123,
        133,
        98
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "alreadyInitialized",
      "msg": "The project is already initialized."
    },
    {
      "code": 6001,
      "name": "notInitialized",
      "msg": "The project is not initialized."
    },
    {
      "code": 6002,
      "name": "notTurn",
      "msg": "Not your Turn"
    },
    {
      "code": 6003,
      "name": "taskNotCompleted",
      "msg": "The task is not completed."
    },
    {
      "code": 6004,
      "name": "notAParticipant",
      "msg": "The caller is not a participant."
    },
    {
      "code": 6005,
      "name": "unauthorized",
      "msg": "Unauthorized access."
    },
    {
      "code": 6006,
      "name": "alreadyJoined",
      "msg": "Game already has a player."
    },
    {
      "code": 6007,
      "name": "gameNotOver",
      "msg": "Game is not over yet."
    },
    {
      "code": 6008,
      "name": "notWinner",
      "msg": "Only the winner can claim the reward."
    },
    {
      "code": 6009,
      "name": "incompleteTurn",
      "msg": "Wait for other Player"
    },
    {
      "code": 6010,
      "name": "notTimedOut",
      "msg": "Turn has not timed out yet."
    },
    {
      "code": 6011,
      "name": "invalidForceResolve",
      "msg": "Invalid attempt to force resolve."
    }
  ],
  "types": [
    {
      "name": "gameSessionHealth",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "player",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "playerCanPlay",
            "type": "bool"
          },
          {
            "name": "creatorCanPlay",
            "type": "bool"
          },
          {
            "name": "totalHealth",
            "type": "u32"
          },
          {
            "name": "playerHealth",
            "type": "u32"
          },
          {
            "name": "creatorHealth",
            "type": "u8"
          },
          {
            "name": "playerAction",
            "type": {
              "defined": {
                "name": "playerAction"
              }
            }
          },
          {
            "name": "creatorAction",
            "type": {
              "defined": {
                "name": "playerAction"
              }
            }
          },
          {
            "name": "poolAmount",
            "type": "u64"
          },
          {
            "name": "winner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "lastTurnTimestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "globalState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "treasuryCutBps",
            "type": "u16"
          },
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "owner",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "playerAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "rock"
          },
          {
            "name": "paper"
          },
          {
            "name": "scissors"
          }
        ]
      }
    }
  ]
};
