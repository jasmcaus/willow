using Google.Protobuf.WellKnownTypes;
using AElf.Sdk.CSharp;
using AElf.Types;

namespace Willow.Contracts.WillowContract {
    public partial class WillowContractContract 
        : WillowContractContractContainer.WillowContractContractBase {
        public static long compute_sqrt(long number)  {
            // https://www.c-sharpcorner.com/blogs/implement-square-root-method-using-c-sharp1
            long precision = (long)0.0001f;
            long min = 0;  
            long max = number;  
            long result = 0;  
            while(max-min > precision) {
                result = (min + max) / 2;  
                if ((result*result) >= number) {
                    max = result;  
                } else {
                    min = result;  
                }
            }  
            return result;
        }
    }
}