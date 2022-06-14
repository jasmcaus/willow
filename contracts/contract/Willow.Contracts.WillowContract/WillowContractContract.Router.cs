using Google.Protobuf.WellKnownTypes;
using AElf.Sdk.CSharp;
using AElf.Types;

namespace Willow.Contracts.WillowContract {
    public partial class WillowContractContract 
        : WillowContractContractContainer.WillowContractContractBase {
        public override AddLiquidityOutput add_liquidity(
            AddLiquidityInput input
        ) {
            // ADD CHECK TO CHECK IF USER HAS ENOUGH BALANCE (AMOUNTA, AMOUNTB)

            Assert(
                Context.Sender == input.Sender,
                $"Expected input.Sender {input.Sender} to match Context.Sender: {Context.Sender}"
            );
            Assert(
                Context.CurrentBlockTime.ToDateTime() <= input.Deadline.ToDateTime(),
                "Deadline exceeded"
            );

            var exchange_pair_output = get_exchange_pair(new GetExchangePairInput() {
                TokenAId = input.TokenAId,
                TokenBId = input.TokenBId
            });
            var pair = exchange_pair_output.Pair;
            long reserveA = pair.ReserveTokenA;
            long reserveB = pair.ReserveTokenB;
            long amountA = 0;
            long amountB = 0;

            if(reserveA == 0 && reserveB == 0) {
                // You are the first liquidity provider
                amountA = input.AmountADesired;
                amountB = input.AmountBDesired;
            } else {
                var estimatedB = get_quote(input.AmountADesired, reserveA, reserveB);
                if(estimatedB <= input.AmountBDesired) {
                    Assert(estimatedB >= input.AmountBMin, $"Insufficient amount for token B of id: `{input.TokenBId}`");
                    amountA = input.AmountADesired;
                    amountB = estimatedB;
                } else {
                    var estimatedA = get_quote(input.AmountBDesired, reserveB, reserveA);
                    Assert(estimatedA <= input.AmountADesired, $"Excess amount of token A of id: `{input.TokenAId}`");
                    Assert(estimatedA >= input.AmountAMin, $"Insufficient amount for token A of id: `{input.TokenAId}`");
                    amountA = estimatedA;
                    amountB = input.AmountBDesired;
                }
            }

            transfer(new TransferTokenInput() {
                TokenId = input.TokenAId,
                From = input.Sender,
                To = Context.Self,   // contract
                Amount = amountA
            });

            transfer(new TransferTokenInput() {
                TokenId = input.TokenBId,
                From = input.Sender,
                To = Context.Self,   // contract
                Amount = amountB
            });

            MintLpTokensOutput output = mint_lp_tokens(
                input.TokenAId, 
                input.TokenBId, 
                pair, 
                Context.Sender
            );
            long liquidity = output.Liquidity;

            // output.Pair.ReserveA += amountA;
            // output.Pair.ReserveB += amountB;

            State.ExchangePairs[exchange_pair_output.PairLocation] = output.Pair;

            return new AddLiquidityOutput() {
                ActualAAmount = amountA,
                ActualBAmount = amountB,
                Liquidity = liquidity
            };
            return null;
        }


        public override RemoveLiquidityOutput remove_liquidity(
            RemoveLiquidityInput input
        ) {
            Assert(false, "TODO");
            // Assert(
            //     Context.Sender == input.Sender,
            //     $"Expected input.Sender {input.Sender} to match Context.Sender: {Context.Sender}"
            // );
            // Assert(
            //     Context.CurrentBlockTime.ToDateTime() <= input.Deadline.ToDateTime(),
            //     "Deadline exceeded"
            // );
            
            // var pair = get_exchange_pair(new GetExchangePairInput() {
            //     TokenAId = input.TokenA,
            //     TokenBId = input.TokenB
            // }).Pair;

            // transfer(new TransferTokenInput() {
            //     Token = Context.Self,
            //     From = input.Sender,
            //     To = Context.Self,
            //     Amount = input.Liquidity
            // })            

            return base.remove_liquidity(input);
        }


        private long get_quote(
            long amount,
            long reserveX,
            long reserveY
        ) {
            Assert(
                amount > 0 && reserveX > 0 && reserveY > 0,
                $"Amount/Reserve Invalid. amount: {amount}; reserveX: {reserveX}; reserveY: {reserveY}"
            );

            long amountB = amount * reserveY / reserveX;
            return amountB;
        }


        // Mint LP tokens and provide liquidity balance tracking
        // Computes the right amount of tokens to take to keep the liquidity pool balanced
        private MintLpTokensOutput mint_lp_tokens(
            long tokenAId,
            long tokenBId,
            ExchangePair pair,
            Address sender
        ) {
            long reserveA = pair.ReserveTokenA;
            long reserveB = pair.ReserveTokenB;
            long balanceA = __get_balance_priv(tokenAId, Context.Self);
            long balanceB = __get_balance_priv(tokenBId, Context.Self);

            long amountA = balanceA - reserveA;
            long amountB = balanceB - reserveB;

            long total_liquidity = pair.TotalLiquidity;

            long liquidity;
            if(total_liquidity == 0) {
                // No liquidity in pool
                liquidity = compute_sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
                // Permanently lock `MINIMUM_LIQUIDITY`
                pair.TotalLiquidity += MINIMUM_LIQUIDITY;
            } else {
                long liquidityA = amountA * total_liquidity / reserveA;
                long liquidityB = amountB * total_liquidity / reserveB;
                liquidity = liquidityA > liquidityB ? liquidityB : liquidityA;
            }

            Assert(liquidity > 0, "Insufficient LP tokens minted");
            pair.TotalLiquidity += liquidity;

            // Mint LP tokens to sender
            State.TokenBalance[LP_TOKEN_ID][sender] += liquidity;

            return new MintLpTokensOutput() {
                Liquidity = liquidity, // the number of WLP tokens minted
                Pair = pair
            };
        }


        public override Empty swap_tokenin_for_tokenout(
            SwapTokenInForTokenOutInput input 
        ) {
            Assert(
                Context.Sender == input.Sender,
                $"Expected input.Sender {input.Sender} to match Context.Sender: {Context.Sender}"
            );
            Assert(
                Context.CurrentBlockTime.ToDateTime() <= input.Deadline.ToDateTime(),
                "Deadline exceeded"
            );

            var amounts = get_amounts_out(input.AmountIn, input);
            Assert(amounts.List[amounts.List.Count - 1] >= input.AmountOutMin, "Insufficient AmountOut");

            var pair = get_exchange_pair(new GetExchangePairInput() {
                TokenAId = input.Paths.List[0].Id,
                TokenBId = input.Paths.List[1].Id
            }).Pair;

            transfer(new TransferTokenInput() {
                TokenId = input.Paths.List[0].Id,
                From = input.Sender,
                To = Context.Self,
                Amount = amounts.List[0]
            });
            
            swap(new SwapInput() {
                Amounts = amounts, 
                Paths = input.Paths, 
                Sender = input.Sender
            });

            return new Empty();
        }


        public override Empty swap_tokenout_for_tokenin(
            SwapTokenOutForTokenInInput input 
        ) {
            Assert(
                Context.Sender == input.Sender,
                $"Expected input.Sender {input.Sender} to match Context.Sender: {Context.Sender}"
            );
            Assert(
                Context.CurrentBlockTime.ToDateTime() <= input.Deadline.ToDateTime(),
                "Deadline exceeded"
            );

            var amounts = get_amounts_in(input.AmountOut, input);
            Assert(amounts.List[0] <= input.AmountInMax, "Excessive amountIn");

            var pair = get_exchange_pair(new GetExchangePairInput() {
                TokenAId = input.Paths.List[0].Id,
                TokenBId = input.Paths.List[1].Id
            }).Pair;
            transfer(new TransferTokenInput() {
                TokenId = input.Paths.List[0].Id,
                From = input.Sender,
                To = Context.Self,
                Amount = amounts.List[0]
            });
            swap(new SwapInput() {
                Amounts = amounts, 
                Paths = input.Paths, 
                Sender = input.Sender
            });

            return new Empty();
        }


        public override Empty swap(
            SwapInput sw_input
        ) {
            var max = sw_input.Paths.List.Count - 1;
            for(int i = 0; i < max; i++) {
                var input_token = sw_input.Paths.List[i];
                var output_token = sw_input.Paths.List[i + 1];
                var amount_out = sw_input.Amounts.List[i + 1];

                long amountA_out = 0;
                long amountB_out = 0;
                if(input_token.Id < output_token.Id) {
                    amountB_out = amount_out;
                } else {
                    amountA_out = amount_out;
                }

                if(i < sw_input.Paths.List.Count - 2) {
                    output_token = sw_input.Paths.List[i + 2];
                }

                // Actual Swap
                safe_swap(new SwapPairInput() {
                    AmountAOut = amountA_out,
                    AmountBOut = amountB_out,
                    TokenAId = input_token.Id,
                    TokenBId = output_token.Id
                });
            }

            return new Empty();
        }


        /*
            Private
        */

        private long get_amount_out(
            long amount_in,
            long reserve_in,
            long reserve_out
        ) {
            Assert(
                amount_in > 0 && reserve_in > 0 && reserve_out > 0,
                $"Amount must be > 0"
            );

            var amount_in_with_fee = amount_in * 997;
            var numerator = amount_in_with_fee * reserve_out;
            var denominator = reserve_in * 1000 + amount_in_with_fee;

            return numerator/denominator;
        }


        private long get_amount_in(
            long amount_out,
            long reserve_in,
            long reserve_out
        ) {
            Assert(
                amount_out > 0 && reserve_in > 0 && reserve_out > 0,
                $"Amount must be > 0"
            );

            var numerator = reserve_in * amount_out * 1000;
            var denominator = (reserve_out - amount_out) * 997;
            return (numerator / denominator) + 1;
        }
        

        private LongList get_amounts_out(
            long amount_in,
            SwapTokenInForTokenOutInput input
        ) {
            Assert(input.Paths.List.Count >= 2, $"Expected input paths to be >=2. Got {input.Paths.List.Count}");
            var amounts = new LongList();

            amounts.List.Add(amount_in);
            var max = input.Paths.List.Count - 1;
            for(var i = 0; i < max; i++) {
                var pair = get_exchange_pair(new GetExchangePairInput() {
                    TokenAId = input.Paths.List[i].Id, 
                    TokenBId = input.Paths.List[i+1].Id
                }).Pair;
                amounts.List.Add(
                    get_amount_out(amounts.List[i], pair.ReserveTokenA, pair.ReserveTokenB)
                );
            }

            return amounts;
        }


        private LongList get_amounts_in(
            long amount_out,
            SwapTokenOutForTokenInInput input
        ) {
            Assert(input.Paths.List.Count >= 2, $"Expected input paths to be >=2. Got {input.Paths.List.Count}");
            var amounts = new LongList();

            var max = input.Paths.List.Count - 1;
            amounts.List[max] = amount_out;
            for(var i = max; i > 0; i--) {
                var pair = get_exchange_pair(new GetExchangePairInput() {
                    TokenAId = input.Paths.List[i-1].Id, 
                    TokenBId = input.Paths.List[i].Id
                }).Pair;
                amounts.List[i-1] = get_amount_in(amounts.List[i], pair.ReserveTokenA, pair.ReserveTokenB);
            }

            return amounts;
        }
        
    }
}