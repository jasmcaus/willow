using AElf.Boilerplate.TestBase;
using AElf.Cryptography.ECDSA;

namespace Willow.Contracts.WillowContract
{
    public class WillowContractContractTestBase : DAppContractTestBase<WillowContractContractTestModule>
    {
        // You can get address of any contract via GetAddress method, for example:
        // internal Address DAppContractAddress => GetAddress(DAppSmartContractAddressNameProvider.StringName);

        internal WillowContractContractContainer.WillowContractContractStub GetWillowContractContractStub(ECKeyPair senderKeyPair)
        {
            return GetTester<WillowContractContractContainer.WillowContractContractStub>(DAppContractAddress, senderKeyPair);
        }
    }
}