using Google.Protobuf.WellKnownTypes;
using AElf.Sdk.CSharp;
using AElf.Types;
using System.Linq;

namespace Willow.Contracts.WillowContract {
    public partial class WillowContractContract 
        : WillowContractContractContainer.WillowContractContractBase {
        public override Empty lock_liquidity(LockLiquidityInput input) {
            return new Empty();
        }
    }
}