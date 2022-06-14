using Google.Protobuf.WellKnownTypes;
using AElf.Sdk.CSharp;

namespace Willow.Contracts.WillowContract {
    public partial class WillowContractContract 
        : WillowContractContractContainer.WillowContractContractBase {
        /*
            DEPLOY A NEW POOL
        */
        public override Empty create_exchange_pair(
            CreateExchangePairInput input
        ) {
            Assert(
                input.TokenAId != input.TokenBId,
                "Both tokens are the same. This is not allowed"
            );

            Token tokenA = __get_token_from(input.TokenAId, Context.Sender);
            Token tokenB = __get_token_from(input.TokenBId, Context.Sender);

            // Compute a basic "hash"
            string hash = $"{HASH_BEGIN}_{input.TokenAId}_{input.TokenBId}";
            ExchangePair pair = new ExchangePair {
                TokenAId = input.TokenAId,
                TokenBId = input.TokenBId,
                Hash = hash,
                ReserveTokenA = 0,
                ReserveTokenB = 0,
                TotalLiquidity = 0
            };

            // Add to list
            State.ExchangePairs[State.ExchangePairsCount.Value] = pair;
            State.ExchangePairsCount.Value += 1;

            Context.Fire(
                new ExchangePairCreated {
                    TokenAId = input.TokenAId,
                    TokenBId = input.TokenBId,
                    Hash = hash
                }
            );

            return new Empty();
        }


        public override ExchangePairList get_all_exchange_pairs(
            Empty empty
        ) {
            ExchangePairList pairs = new ExchangePairList();
            for(var i = 0; i < State.ExchangePairsCount.Value; i++) {
                var item = State.ExchangePairs[i];
                pairs.Pairs.Add(item);  
            }
            
            return pairs;
        }


        public override GetExchangePairOutput get_exchange_pair(
            GetExchangePairInput input
        ) {
            Assert(
                input.TokenAId != input.TokenBId,
                "Both tokens are the same. This is not allowed"
            );

            for(var i = 0; i < State.ExchangePairsCount.Value; i++) {
                var item = State.ExchangePairs[i];
                if(item.TokenA.Id == input.TokenAId &&
                   item.TokenB.Id == input.TokenBId) {
                        return new GetExchangePairOutput() {
                            PairLocation = i,
                            Pair = item
                        };
                }
            }

            Assert(
                false,
                $"Exchange pair b/w token A: {input.TokenAId} and token B: {input.TokenBId} doesn't exist"
            );
        }
    }
}