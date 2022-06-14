using Google.Protobuf.WellKnownTypes;
using AElf.Sdk.CSharp;
using AElf.Types;

namespace Willow.Contracts.WillowContract {
    public partial class WillowContractContract 
        : WillowContractContractContainer.WillowContractContractBase {
        // Token
        public override Empty faucet(
            FaucetInput input
        ) {
            foreach(NewTokenInput tokenInput in input.Tokens) {
                var _ = new_token(tokenInput);
            }

            if(State.Tokens[Context.Sender].Tokens[(int)LP_TOKEN_ID] is null) {
                // Now separately deploy LP tokens
                var lp = new_token(new NewTokenInput() {
                    Id = LP_TOKEN_ID,
                    Decimals = 8,
                    Symbol = "WLP", // Willow Governance Token
                    AmountToIssue = 0,
                    TotalSupply = LP_TOKEN_INITIAL_SUPPLY
                });
            }

            return new Empty();
        }


        public override Empty transfer(
            TransferTokenInput input
        ) {
            Address from = input.From;
            Address to = input.To;
            long token_id = input.TokenId;
            long amount = input.Amount;
            long sender_balance = __get_balance_priv(token_id, from);

            Assert(
                sender_balance > amount,
                $"Cannot transfer {amount} tokens (id: {token_id}) since current balance of {from} is ${sender_balance}"
            );

            // Add more secure checks for overflow
            State.TokenBalance[token_id][from] -= amount;
            State.TokenBalance[token_id][to] += amount;

            Context.Fire(
                new TokenTransferred {
                    TokenId = input.TokenId,
                    From = from,
                    To = to,
                    Amount = amount
                }
            );

            return new Empty();
        }

        /*
            Transfers tokens between the `Context.Self`s of two different token ids
        */        
        private void transfer_between_token_ids(
            Address from,
            Address to,
            long input_token_id,
            long output_token_id,
            long amount_from,
            long amount_to
        ) {
            Assert(
                (from == to) && from == Context.Self,
                $"Expected both `from` and `to` to be `Context.Self`s, but got from: {from}, to: {to} and Context.Self: {Context.Self}"
            );

            long sender_balance = __get_balance_priv(input_token_id, from);
            Assert(
                sender_balance > amount_from,
                $"[transfer_between_token_ids] Cannot transfer {amount_from} tokens (input_token_id: {input_token_id}) since current balance of {from} is ${sender_balance}"
            );

            State.TokenBalance[input_token_id][from] -= amount_from;
            State.TokenBalance[output_token_id][to] += amount_to;

            Context.LogDebug(() => 
                $"Transferred {amount_from} from {input_token_id} which resulted in a trade of {amount_to} for {output_token_id}");
        }

        public override TokenList get_all_tokens(
            Address input
        ) {
            return State.Tokens[input] ?? new TokenList();
        }

        // Views
        public override Int64Value get_balance(
            Int64Value input
        ) {
            return new Int64Value{ 
                Value = __get_balance_priv(input.Value, Context.Sender) 
            };
        }

         public override Int64Value get_contract_balance_for(
            Int64Value input
        ) {
            return new Int64Value {
                Value = State.TokenBalance[input.Value][Context.Self]
            };
        }

        // Not for external use.
        // Exposed only via the Faucet
        private Empty new_token(
            NewTokenInput input 
        ) {
            TokenList tokenlist = State.Tokens[Context.Sender] ?? new TokenList();
            Token token = new Token() {
                Owner = Context.Sender,
                Id = input.Id,
                Decimals = input.Decimals,
                Symbol = input.Symbol,
                Balance = input.AmountToIssue,
                TotalSupply = input.TotalSupply
            };
            tokenlist.Tokens.Add(token);
            State.Tokens[Context.Sender] = tokenlist;
            State.TokenBalance[input.Id][Context.Sender] = input.AmountToIssue;

            Context.Fire(
                new TokenCreated {
                    Owner = Context.Sender,
                    Id = input.Id,
                    Decimals = input.Decimals,
                    Symbol = input.Symbol,
                    Balance = input.AmountToIssue,
                    TotalSupply = input.TotalSupply,
                }
            );

            return new Empty();
        }


        /*
            Private
        */
        private long __get_balance_priv(
            long tokenId,
            Address sender
        ) {
            return State.TokenBalance[tokenId][sender];
        }
        

        private Token __get_token_from(
            long id,
            Address sender
        ) {
            foreach(Token token in State.Tokens[sender].Tokens) {
                if(token.Id == id) {
                    return token;
                }
            }

            return null;
        }
    }
}