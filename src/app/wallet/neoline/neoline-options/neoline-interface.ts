import InvokeReadArgs from "./invoke-read-args";
import InvokeWriteArgs from "./invoke-write-args";
import NeoAccount from "./account";
import Signers from "./signers";
import TypedValue from "./typed-values";

type GetBalanceArgs = { address: string; contracts: string[] };

export interface NeoLineN3Interface {
    getAccount(): Promise<NeoAccount>;

      getBalance(params: {address: string}): Promise<{
        [address: string]: { contract: string; symbol: string; amount: string }[];
      }>;

    invoke(params: InvokeReadArgs & InvokeWriteArgs & Signers): Promise<any>;

    invokeRead(
        params: InvokeReadArgs & Signers
    ): Promise<{ script: string; stack: TypedValue[]; state: string }>;

    ScriptHashToAddress(params: {scriptHash: string}): any;
    AddressToScriptHash(params: {address: string}): any;

    invokeReadMulti(params: {
        invokeReadArgs: InvokeReadArgs[];
        signers: { account: string; scopes: number }[];
      }): Promise<{ script: string; stack: TypedValue[]; state: string }[]>;

    getApplicationLog(params: {txid: string}): Promise<any>;
}