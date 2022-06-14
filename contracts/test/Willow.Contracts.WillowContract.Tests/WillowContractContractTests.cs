using System.Linq;
using System.Threading.Tasks;
using System.Diagnostics;
using AElf.ContractTestBase.ContractTestKit;
using AElf.Kernel; // TimestampHelper
using AElf.Types;
using Google.Protobuf;
using Google.Protobuf.WellKnownTypes;
using Shouldly;
using Xunit;

namespace Willow.Contracts.WillowContract {
    public class WillowContractContractTests : WillowContractContractTestBase {
        [Fact]
        public async Task Test() {
            // Get a stub for testing.
            var keyPair = SampleAccount.Accounts.First().KeyPair;
            var stub = GetWillowContractContractStub(keyPair);

            // Use CallAsync or SendAsync method of this stub to test.
            var tx_result = await stub.create_listing.SendAsync(new ListingInput() {
                Title = "Title",
                Description = "Description",
                ExpirationDate = TimestampHelper.GetUtcNow().AddHours(3),
            });
            tx_result.TransactionResult.Status.ShouldBe(TransactionResultStatus.Mined);

            var listing = await stub.get_listing.CallAsync(new Int64Value() {
                Value = 0
            });

            listing.Title.ShouldBe("Title");

            // Or maybe you want to get its return value.
            // var output = (await stub.Hello.SendAsync(new Empty())).Output;

            // Or transaction result.
            // var transactionResult = (await stub.Hello.SendAsync(new Empty())).TransactionResult;
        }
    }
}