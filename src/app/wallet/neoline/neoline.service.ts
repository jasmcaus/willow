import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IWallet } from '../wallet';
import NeoLineN3Init from './neoline-options/init';
import { NeoLineN3Interface } from './neoline-options/neoline-interface';
import * as bs from 'bs58';
import TypedValue from './neoline-options/typed-values';
import { SettingsService } from 'src/app/services/interface/settings/settings.service';

@Injectable({
    providedIn: 'root'
})
export class NeolineService implements IWallet {

    private DeployerContract = "0xb2d66fbe6f8f8d2e6b6872f4dde2ecb24187338a";
    private GasContract = "0xd2a4cff31913016155e38e474a2c06d08be276cf";
    private FactoryContract = "0xb75ac7542b5d56b3e0d47b49755da47abc719aab";
    private RouterContract = "0x67e5f2b645b86779e0f07efef13e69a56ebc1ab2";
    private LockContract = "0xae0878b7039dce5d59ae9b1da51e3dfe445c9c75";

    private TokenDeployFee = '';
    private SwapPairDeployFee = '';

    private ACCOUNT_HASH = '';
    private ACCOUNT_ADDRESS = '';
    private ACCOUNT_ADDRESS_FORMATED = "";

    walletInitalized = new BehaviorSubject(false);
    neoLine: NeoLineN3Interface;

    constructor(private settings: SettingsService) {
        NeoLineN3Init().then(val => {
            this.neoLine = val;
            if (sessionStorage.getItem('connectedWallet') === "NeoLine") {
                this.connect();
            }

            window.addEventListener('NEOLine.NEO.EVENT.DISCONNECTED', () => {
                this.walletInitalized.next(false);
                sessionStorage.removeItem('connectedWallet');
            });
        });
    }

    getAllExchangePair(): Promise<{tokenA: string, tokenB: string, poolAddress: string}[]>
    {
        return this.invokeRead(this.FactoryContract, "getAllReadableExchangePair", [])
        .then(e => 
            {
                var response: {tokenA: string, tokenB: string, poolAddress: string}[] = [];

                e.stack[0].value.forEach(element => 
                    {
                        response.push(
                            {
                                tokenA: '0x' + this.getScriptHashFromAddress(atob(element.value[0].value)), 
                                tokenB: '0x' + this.getScriptHashFromAddress(atob(element.value[1].value)),
                                poolAddress: '0x' + this.getScriptHashFromAddress(atob(element.value[2].value))
                            });
                    });

                return response;
            });
    }

    getSymbolAndDecimals(contractScriptHash: string): Promise<{ decimals: number, symbol: string}> {
        return this.neoLine.invokeReadMulti({
            invokeReadArgs: 
            [
                {
                    scriptHash: contractScriptHash,
                    operation: "symbol",
                    args: []
                },
                {
                    scriptHash: contractScriptHash,
                    operation: "decimals",
                    args: []
                }
            ],
            signers: [
                {
                    account: this.ACCOUNT_HASH,
                    scopes: 1
                }
            ]}).then(result => 
                {
                    return { 
                        decimals: parseInt(result.find(e => e.stack[0].type === "Integer").stack[0].value), 
                        symbol: atob(result.find(e => e.stack[0].type !== "Integer").stack[0].value)
                    };
                }).catch(error => 
                    {
                        console.log(error);
                        return { symbol: "", scriptHash: "", decimals: 0 };
                    });
    }

    addLiquidity(
        tokenA: string, 
        tokenAAmountDesired: number, 
        tokenAMin: number, 
        tokenB: string, 
        tokenBAmountDesired: number, 
        tokenBMin: number, 
        tokenPairContractAddress: string): Promise<string> {
            var date = new Date();
            date.setMinutes(date.getMinutes() + this.settings.getDeadline());

            return this.neoLine.invoke(
                {
                    scriptHash: this.RouterContract,
                    operation: "addLiquidity",
                    args: [
                        { type: 'Hash160', value: '0x' + this.ACCOUNT_HASH },
                        { type: 'Hash160', value: tokenA },
                        { type: 'Hash160', value: tokenB },
                        { type: 'Integer', value: tokenAAmountDesired },
                        { type: 'Integer', value: tokenBAmountDesired },
                        { type: 'Integer', value: tokenAMin },
                        { type: 'Integer', value: tokenBMin },
                        { type: 'Integer', value: date.getTime() },
                    ],
                    signers: [
                        {
                            account: this.ACCOUNT_HASH,
                            scopes: 16,
                            allowedContracts: [this.RouterContract, tokenA, tokenB, this.getScriptHashFromAddress(tokenPairContractAddress)]
                        }
                    ],
                    broadcastOverride: false
                })
                .then(result => {
                    return result["txid"];
                });
    }

    private invokeRead(scriptHash: string, operation: string, readArguments: TypedValue[]): Promise<any> {
        return this.neoLine.invokeRead(
            {
                scriptHash: scriptHash,
                operation: operation,
                args: readArguments,
                signers: []
            })
            .then(result => {
                if (result.state === "HALT") {
                    return result;
                }
                return Promise.reject("Not Found");
            })
            .catch((error) => {
                console.log(error);
                return Promise.reject("Not Found");
            });
    }

    getTotalSupply(poolAddress: string): Promise<any> 
    {
        var scriptHash = poolAddress.startsWith("0x") ? poolAddress : "0x" + this.getScriptHashFromAddress(poolAddress);
        return this.invokeRead(scriptHash, "totalSupply", [])
        .then(result => result.stack[0].value);
    }

    async getReserves(poolAddress: string): Promise<{ address: string, reserve: string, scriptHash: string, token: string }[]> {
        var reserves = [];
        var scriptHash = '';
        
        if(poolAddress.startsWith('0x'))
        {
            scriptHash = poolAddress;
        }
        else
        {
            scriptHash = this.getScriptHashFromAddress(poolAddress);
        }

        await this.invokeRead(scriptHash, "getReadableToken0", []).then(e => 
            {
                reserves.push({ token: "token0", scriptHash: '0x' + this.getScriptHashFromAddress(atob(e.stack[0].value)), address: atob(e.stack[0].value) });
            });

        await this.invokeRead(scriptHash, "getReadableToken1", []).then(e => 
            {
                reserves.push({ token: "token1", scriptHash: '0x' + this.getScriptHashFromAddress(atob(e.stack[0].value)), address: atob(e.stack[0].value) });
            });

        return this.invokeRead(scriptHash, "getReserves", [])
            .then(result => 
                {
                    reserves.forEach(e => 
                        {
                            if(e.token === "token0")
                            {
                                e.reserve = result.stack[0].value[0].value;
                            }
                            else if(e.token === "token1")
                            {
                                e.reserve = result.stack[0].value[1].value;
                            }
                        });

                        return reserves;
                });
    }

    getTokenPairContractAddress(tokenA: string, tokenB: string): Promise<string> {
        let args: TypedValue[] =
            [
                { type: 'Hash160', value: tokenA },
                { type: 'Hash160', value: tokenB },
            ];

        return this.invokeRead(this.FactoryContract, "getReadableExchangePair", args)
            .then(result => {
                return result.stack[0].value;
            });
    }

    getAllLocksForContract(scriptHash: string): Promise<{ owner: string, contract: string, endDate: Date, amount: number, counter: number }[]>
    {
        return this.invokeRead(
            this.LockContract, 
            "getAllLocksForContract", 
            [{type: 'Hash160', value: scriptHash }])
            .then(e => 
                {
                    var response: { 
                        owner: string, 
                        contract: string, 
                        endDate: Date, 
                        amount: number,
                        counter: number }[] = [];

                    e.stack[0].value.forEach(element =>
                        {
                            response.push(
                                {
                                    owner: atob(element.value[0].value), 
                                    contract: "0x" + this.getScriptHashFromAddress(atob(element.value[1].value)), 
                                    endDate: new Date(parseFloat(element.value[2].value)), 
                                    amount: element.value[3].value,
                                    counter: element.value[4].value,
                                });
                        });

                        return response;
                });
    }

    getAddressLiquidityLockup(): Promise<{ owner: string, contract: string, endDate: Date, amount: number, counter: number }[]>
    {
        return this.invokeRead(
            this.LockContract, 
            "getAllLocksForAddress", 
            [{type: 'Hash160', value: '0x' + this.ACCOUNT_HASH }])
            .then(e => 
                {
                    var response: { 
                        owner: string, 
                        contract: string, 
                        endDate: Date, 
                        amount: number,
                        counter: number }[] = [];

                    e.stack[0].value.forEach(element =>
                        {
                            response.push(
                                {
                                    owner: "0x" + this.getScriptHashFromAddress(atob(element.value[0].value)), 
                                    contract: "0x" + this.getScriptHashFromAddress(atob(element.value[1].value)), 
                                    endDate: new Date(parseFloat(element.value[2].value)), 
                                    amount: (element.value[3].value / 100000000),
                                    counter: element.value[4].value,
                                });
                        });

                        return response;
                });
    }

    unlockLiquidity(liquidity: string, counter: number): Promise<any>
    {
        return this.neoLine.invoke(
            {
                scriptHash: this.LockContract,
                operation: "unlockLiquidity",
                args: [
                    { type: 'Hash160', value: '0x' + this.ACCOUNT_HASH },
                    { type: 'Hash160', value: liquidity },
                    { type: 'Integer', value: counter }
                ],
                signers: [
                    {
                        account: this.ACCOUNT_HASH,
                        scopes: 16,
                        allowedContracts: [this.LockContract ,liquidity]
                    }
                ],
                broadcastOverride: false
            })
            .then(result => {
                return result["txid"];
            });
    }

    lockLiquidity(liquidity: string, amount: number, endDate: number): Promise<any>
    {
        return this.neoLine.invoke(
            {
                scriptHash: this.LockContract,
                operation: "lockLiquidity",
                args: [
                    { type: 'Hash160', value: '0x' + this.ACCOUNT_HASH },
                    { type: 'Hash160', value: liquidity },
                    { type: 'Integer', value: amount },
                    { type: "Integer", value: endDate },
                ],
                signers: [
                    {
                        account: this.ACCOUNT_HASH,
                        scopes: 16,
                        allowedContracts: [this.LockContract ,liquidity]
                    }
                ],
                broadcastOverride: false
            })
            .then(result => {
                return result["txid"];
            });
    }

    swapTokenOutForTokenIn(amountOut: number, amountInMax: number, paths: any[]): Promise<string> {
        
        var date = new Date();
        date.setMinutes(date.getMinutes() + this.settings.getDeadline());

        var newPath: TypedValue[] = []
        var allowedContracts = [this.RouterContract];

        paths.forEach(element => 
            {
                newPath.push({type: "Hash160", value: element});
                allowedContracts.push(element);
            });

        return this.neoLine.invoke(
            {
                scriptHash: this.RouterContract,
                operation: "swapTokenOutForTokenIn",
                args: [
                    { type: 'Hash160', value: '0x' + this.ACCOUNT_HASH },
                    { type: 'Integer', value: amountOut },
                    { type: 'Integer', value: amountInMax },
                    { type: "Array", value: newPath.reverse() },
                    { type: 'Integer', value: date.getTime() },
                ],
                signers: [
                    {
                        account: this.ACCOUNT_HASH,
                        scopes: 16,
                        allowedContracts: allowedContracts
                    }
                ],
                broadcastOverride: false
            })
            .then(result => {
                return result["txid"];
            });
    }


    swapTokenInForTokenOut(amountIn: number, amountOutMin: number, paths: any[]): Promise<string> {
        var date = new Date();
        date.setMinutes(date.getMinutes() + this.settings.getDeadline());

        var newPath: TypedValue[] = []
        var allowedContracts = [this.RouterContract];

        paths.forEach(element => 
            {
                newPath.push({type: "Hash160", value: element});
                allowedContracts.push(element);
            });

        return this.neoLine.invoke(
            {
                scriptHash: this.RouterContract,
                operation: "swapTokenInForTokenOut",
                args: [
                    { type: 'Hash160', value: '0x' + this.ACCOUNT_HASH },
                    { type: 'Integer', value: amountIn },
                    { type: 'Integer', value: amountOutMin },
                    { type: "Array", value: newPath },
                    { type: 'Integer', value: date.getTime() },
                ],
                signers: [
                    {
                        account: this.ACCOUNT_HASH,
                        scopes: 16,
                        allowedContracts: allowedContracts
                    }
                ],
                broadcastOverride: false
            })
            .then(result => {
                return result["txid"];
            });
        }

    removeLiquidity(poolContract: string, tokenA: string, tokenB: string, liquidity: number, amountAMin: number, amountBMin: number) : Promise<any>
    {
        var date = new Date();
        date.setMinutes(date.getMinutes() + this.settings.getDeadline());

        return this.neoLine.invoke(
            {
                scriptHash: this.RouterContract,
                operation: "removeLiquidity",
                args: [
                    { type: 'Hash160', value: '0x' + this.ACCOUNT_HASH },
                    { type: 'Hash160', value: tokenA },
                    { type: 'Hash160', value: tokenB },
                    { type: 'Integer', value: liquidity },
                    { type: 'Integer', value: amountAMin },
                    { type: 'Integer', value: amountBMin },
                    { type: 'Integer', value: date.getTime() },
                ],
                signers: [
                    {
                        account: this.ACCOUNT_HASH,
                        scopes: 16,
                        allowedContracts: [this.RouterContract, poolContract]
                    }
                ],
                broadcastOverride: false
            })
            .then(result => {
                return result["txid"];
            });
    }

    getSwapPairDeployFee(): Promise<string> {
        return this.invokeRead(this.FactoryContract, "getDeployFee", [])
            .then(result => {
                this.SwapPairDeployFee = result.stack[0].value;
                return this.SwapPairDeployFee;
            });
    }

    deploySwapPairContract(symbol: string, tokenA: string, tokenB: string): Promise<any> {
        return this.neoLine.invoke(
            {
                scriptHash: this.GasContract,
                operation: "transfer",
                args: [
                    { type: 'Address', value: '0x' + this.ACCOUNT_HASH },
                    { type: 'Address', value: this.FactoryContract },
                    { type: 'Integer', value: this.SwapPairDeployFee },
                    {
                        type: 'Array', value: [
                            { type: 'String', value: symbol },
                            { type: 'Hash160', value: tokenA },
                            { type: 'Hash160', value: tokenB },
                        ]
                    }
                ],
                signers: [
                    {
                        account: this.ACCOUNT_HASH,
                        scopes: 1
                    }
                ],
                broadcastOverride: false
            })
            .then(result => {
                return result["txid"];
            });
    }

    getTokenSymbol(scriptHash: string): Promise<string> {
        return this.invokeRead(scriptHash, "symbol", [])
            .then(result => atob(result.stack[0].value));
    }

    public connect() {
        if (this.neoLine) {
            sessionStorage.setItem('connectedWallet', "NeoLine");
            this.neoLine.getAccount()
                .then(result => {
                    this.ACCOUNT_ADDRESS_FORMATED = result.address.substring(0, 3) + "..." + result.address.substring(result.address.length - 3);
                    this.ACCOUNT_ADDRESS = result.address;

                    this.neoLine.AddressToScriptHash({ address: result.address })
                        .then(t => {
                            this.ACCOUNT_HASH = t.scriptHash;
                            this.walletInitalized.next(true);

                            this.getSwapPairDeployFee();
                        });
                });
        }
    }

    getAccountAddressFormatted(): string {
        return this.ACCOUNT_ADDRESS_FORMATED;
    }

    public getTokenDeployFee(): Promise<string> {
        return this.invokeRead(this.DeployerContract, "getDeployFee", [])
            .then(result => {
                this.TokenDeployFee = result.stack[0].value;
                return this.TokenDeployFee;
            });
    }

    
    deployTokenContract(contractName: string,
        author: string,
        email: string,
        description: string,
        symbol: string,
        decimals: number,
        supply: number): Promise<any> {
        return this.neoLine.invoke(
            {
                scriptHash: this.GasContract,
                operation: "transfer",
                args: [
                    { type: 'Address', value: '0x' + this.ACCOUNT_HASH },
                    { type: 'Address', value: this.DeployerContract },
                    { type: 'Integer', value: this.TokenDeployFee },
                    {
                        type: 'Array', value: [
                            { type: 'String', value: contractName },
                            { type: 'String', value: symbol },
                            { type: 'Integer', value: decimals },
                            { type: 'Integer', value: supply },
                            { type: 'String', value: author },
                            { type: 'String', value: email },
                            { type: 'String', value: description },
                        ]
                    }
                ],
                signers: [
                    {
                        account: this.ACCOUNT_HASH,
                        scopes: 1
                    }
                ],
                broadcastOverride: false
            })
            .then(result => {
                return result["txid"];
            });
    }

    getDecimals(contractAddress: string): Promise<any> {
        return this.invokeRead(contractAddress, "decimals", [])
            .then(result => parseInt(result.stack[0].value));
    }

    getLiquidity(): Promise<{contract: string, symbol: string, amount: string, tokenA: string, tokenB: string}[]> {
        return this.neoLine
            .getBalance({ address: this.ACCOUNT_ADDRESS })
            .then((token: any) => {
                let newPoolArray = [];

                Object.keys(token).forEach(address => {
                    const balances = token[address];

                    balances.forEach(balance => {
                        const { contract, symbol, amount } = balance

                        if (symbol.includes("PLP-")) {
                            var splitted = symbol.split("-");
                            var tokenB = splitted.pop();
                            var tokenA = splitted.pop();
                            newPoolArray.push({ contract: contract, symbol: symbol, amount: amount, tokenA: tokenA, tokenB: tokenB });
                        }
                    });
                });

                return newPoolArray;
            });
    }

    getTokenContractDeployed(txId: string): Promise<any>
    {
        return this.neoLine.getApplicationLog({txid: txId})
        .then(result => {
            let contractAddress = "";

            result.executions.forEach(execution =>
                {
                    if(execution.vmstate === "HALT")
                    {
                        execution.notifications.forEach(notis => 
                            {
                                if(notis.contract === this.DeployerContract)
                                {
                                    var last = notis.state.value.pop();

                                    if(last.type === "ByteString")
                                    {
                                        contractAddress = "0x" + this.getScriptHashFromAddress(atob(last.value));
                                    }
                                }
                            });

                    }
                })
                return contractAddress;
        }).catch(() => {return ""});
    }

    private getScriptHashFromAddress(address) {
        const hash = this.ab2hexstring(bs.decode(address));
        return this.reverseHex(hash.substr(2, 40));
    }

    private ab2hexstring(arr) {
        if (typeof arr !== 'object') {
            throw new Error(`ab2hexstring expects an array. Input was ${arr}`);
        }
        let result = '';
        const intArray = new Uint8Array(arr);
        for (const i of intArray) {
            let str = i.toString(16);
            str = str.length === 0 ? '00' : str.length === 1 ? '0' + str : str;
            result += str;
        }
        return result;
    }

    private reverseHex(hex) {
        this.ensureHex(hex);
        let out = '';
        for (let i = hex.length - 2; i >= 0; i -= 2) {
            out += hex.substr(i, 2);
        }
        return out;
    }

    private ensureHex(str) {
        if (!this.isHex(str)) {
            throw new Error(`Expected a hexstring but got ${str}`);
        }
    }

    private isHex(str) {
        try {
            const hexRegex = /^([0-9A-Fa-f]{2})*$/;
            return hexRegex.test(str);
        } catch (err) {
            return false;
        }
    }

    getBalances(): Promise<{ contract, symbol, amount }[]>
    {
        return this.neoLine.getBalance({address: this.ACCOUNT_ADDRESS})
        .then((results) => {
            var result: { contract, symbol, amount }[] = [];
            Object.keys(results).forEach(address => {
                result = results[address];
            });
            return result;
        })
    }
}
