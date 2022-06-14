using AElf.Sdk.CSharp.State;
using AElf.Types;

namespace Willow.Contracts.WillowContract {
    public class WillowContractContractState : ContractState {
        /*
            Token
        */
        // List<TokenId, List<Address, Balance>>
        public MappedState<long, Address, long> TokenBalance { get; set; }
        public MappedState<Address, TokenList> Tokens { get; set; }

        /*
            Factory
        */
        // List of deployed pools
        public MappedState<long, ExchangePair> ExchangePairs { get; set; }
        public SingletonState<long> ExchangePairsCount { get; set; }
        public MappedState<long, Address, long> ExchangePairsBalance { get; set; }

        /*
            Pairs
        */


    }
}