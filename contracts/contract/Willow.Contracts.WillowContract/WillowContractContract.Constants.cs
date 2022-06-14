namespace Willow.Contracts.WillowContract {
    public partial class WillowContractContract : WillowContractContractContainer.WillowContractContractBase {
        // Token
        // public const string WILLOW_TOKEN_SYMBOL = "WLT";
        public const long LP_TOKEN_ID = 23; // special number. For LP
        public const long LP_TOKEN_INITIAL_SUPPLY = 100_000_000;


        // Factory
        public const string HASH_BEGIN = "0xaa";


        // SwapPair
        public const long MINIMUM_LIQUIDITY = 1000;
        public const long FIXED = 100_000_000_000_000_000;

    }
}