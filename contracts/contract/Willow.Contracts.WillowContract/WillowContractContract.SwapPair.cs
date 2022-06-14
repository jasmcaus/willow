using Google.Protobuf.WellKnownTypes;
using AElf.Sdk.CSharp;

namespace Willow.Contracts.WillowContract {
    public partial class WillowContractContract 
        : WillowContractContractContainer.WillowContractContractBase {
        public override Empty safe_swap(
            SwapPairInput input
        ) {
            Assert(
                input.AmountAOut >= 0 && input.AmountBOut >= 0,
                $"[safe_swap] 1: Invalid Amounts: AmountAOut: {input.AmountAOut} and AmountBOut: {input.AmountBOut}"
            );
            Assert(
                input.AmountAOut > 0 || input.AmountBOut > 0,
                $"[safe_swap] 2: Invalid Amounts: AmountAOut: {input.AmountAOut} and AmountBOut: {input.AmountBOut}"
            );

            var pair = get_exchange_pair(new GetExchangePairInput() {
                TokenAId = input.TokenAId,
                TokenBId = input.TokenBId,
            }).Pair;

            Assert(
                input.AmountAOut < pair.ReserveTokenA && input.AmountBOut < pair.ReserveTokenB,
                $"Insufficient liquidity"
            );
            Assert(
                input.To != Context.Self,
                $"Invalid TO"
            );

            if(input.AmountAOut > 0) {
                transfer(new TransferTokenInput() {
                    TokenId = input.TokenAId,
                    From = Context.Self,
                    To = input.To,
                    Amount = input.AmountAOut
                });
            }

            if(input.AmountBOut > 0) {
                transfer(new TransferTokenInput() {
                    TokenId = input.TokenAId,
                    From = Context.Self,
                    To = input.To,
                    Amount = input.AmountBOut
                });
            }

            return new Empty();
        }
    }
}