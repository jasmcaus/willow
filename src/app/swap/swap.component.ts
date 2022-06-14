import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { SettingsService } from "../services/interface/settings/settings.service";
import { TokenService } from "../services/interface/token/token.service";
import { TokenSelectDialogComponent } from "../dialog/token-select-dialog/token-select-dialog.component";
import { WalletProviderService } from "../wallet/wallet-provider/wallet-provider.service";
import { ContractService, PairInterface } from "../services";


@Component({
    selector: "app-swap",
    templateUrl: "./swap.component.html",
    styleUrls: ["./swap.component.scss"]
})
export class SwapComponent implements OnInit {
    private allExchangePairs: PairInterface[] = []
    private liquidityPathAddresses: any[] = []
    private liquidityPools: {
        tokenA_id: number, 
        tokenB_id: number, 
        does_have_liquidity: boolean,
        reserves: {
            reserveA: number,
            reserveB: number,
            total_liquidity: number
        }
    }[] = []

    lpPath: {
        symbol: string, 
        scriptHash: string, 
        decimals: number
    }[] = []

    callSwapTokenOutForTokenIn: boolean = false

    poolExist: boolean = true
    insufficient_liquidity: boolean = false
    loading: boolean = false
    swapping: boolean = false
    txId: string = ""


    swap = this.formBuilder.group({
        tokenASymbol: ["WLT"],
        tokenA: [0],
        tokenAId: [0],
        tokenABalance: [0],
        tokenALogo: ["assets/tokens/Willow.svg"], 
        tokenAAvailable: [""],

        tokenBSymbol: [""],
        tokenB: [],
        tokenBId: [],
        tokenBBalance: [],
        tokenBLogo: [],
        tokenBAvailable: [""],

        tokenBPerTokenA: [0],
        tokenAFee: [0],
        expected: [0],
        amountInMax: [0],
        amountOutMin: [0],

        liquidityPoolContractAddress: [""]
    })


    constructor(
        private walletProvider: WalletProviderService,
        private contractService: ContractService,
        private formBuilder: FormBuilder,
        private settings: SettingsService,
        private tokenService: TokenService,
        private dialog: MatDialog,
    ) { }


    ngOnInit(): void {
        if(this.contractService.is_initialized()) {
            this.contractService.get_all_pairs()
                                .then((value: any) => { this.allExchangePairs = value.data; console.log("Vale:", value) })
                                .then(() => { this.getPairAddress() })
        }
    }


    openTokenSelectDialog(token: string) {
        let dialogRef = this.dialog.open(
            TokenSelectDialogComponent, 
            { panelClass: "custom-token-select-modalbox" }
        )

        dialogRef.componentInstance.tokenEmitter.subscribe(val =>  {
            if(val) {
                if(token === "tokenAId") {
                    this.setSwapPairField("tokenASymbol", val.symbol);
                    this.setSwapPairField("tokenAId", val.id);
                    this.setSwapPairField("tokenAId", val.id);
                    this.setSwapPairField("tokenALogo", val.logo_uri);
                    this.setSwapPairField("tokenBPerTokenA", 0);
                    this.setSwapPairField("tokenABalance", val.balance);
                } else {
                    this.setSwapPairField("tokenBSymbol", val.symbol);
                    this.setSwapPairField("tokenBId", val.id);
                    this.setSwapPairField("tokenBId", val.id);
                    this.setSwapPairField("tokenBLogo", val.logo_uri);
                    this.setSwapPairField("tokenBPerTokenA", 0);
                    this.setSwapPairField("tokenBBalance", val.balance);
                }
                
                dialogRef.close()
                
                if(this.contractService.is_initialized()) {
                    this.getBalances();
                    this.getPairAddress();
                }
            }
        })

        this.settings.getMultihopsDisabledObservable().subscribe((change) => this.getPairAddress());
    }


    tokenABalanceInput(input: any) {
        if(this.poolExist && this.contractService.is_initialized()) {
            this.setSwapPairField("tokenABalance", (input as HTMLInputElement).value);
            this.updateTokenBAmount();
            this.updateTokenBPerTokenA();
        }
    }


    tokenBBalanceInput(input: any) {
        if(this.poolExist && this.contractService.is_initialized()) {
            this.setSwapPairField("tokenBBalance", (input as HTMLInputElement).value);
            this.updateTokenAAmount();
            this.updateTokenBPerTokenA();
        }
    }


    swapToken() {
        this.swapping = true;
        console.debug("callSwapTokenOutForTokenIn:", this.callSwapTokenOutForTokenIn)
        console.debug("liquidityPathAddresses:", this.liquidityPathAddresses)

        if(this.callSwapTokenOutForTokenIn) {
            let amountOut = this.addZeros(this.getSwapField("tokenBBalance"))
            
            let amountInMax = this.addZeros(
                this.getSwapField("tokenABalance")) * (1 + this.settings.getSlippageForCalculation())

            this.walletProvider.Wallet()
                .swapTokenOutForTokenIn(
                    amountOut, 
                    amountInMax, 
                    this.liquidityPathAddresses)
                .then(e => this.txId = e)
                .finally(() => this.swapping = false);
        } else {
            let amountAIn = this.addZeros(this.getSwapField("tokenABalance"))

            var amountBMinOut = this.addZeros(
                this.getSwapField("tokenBBalance")) * (1 - this.settings.getSlippageForCalculation());
            
            this.contractService
                .swapTokenInForTokenOut(
                    amountAIn,
                    amountBMinOut,
                    this.liquidityPathAddresses
                )
                .then((value: any) => {
                    console.log("Returned value: ", value)
                })
                .finally(() => this.swapping = false)
        }
    }


    private addZeros(num: string) {
        let decimals: number = 8
        var final = "1";
        for (let index = 0; index < decimals; index++) {
            final = final + "0";
        }
        return parseFloat(num) * parseFloat(final);
    }


    private getPairAddress() {
        if(!this.contractService.is_initialized())
            return

        this.loading = true;
        this.insufficient_liquidity = false
        this.poolExist = true;

        var tokenA = this.getSwapField("tokenAId");
        var tokenB = this.getSwapField("tokenBId");

        console.error("TokenA:", tokenA)
        console.error("TokenB:", tokenB)

        if(tokenA === null || tokenA === undefined || tokenB === null || tokenB === undefined) {
            this.loading = false
            return
        }

        if(tokenA === tokenB) {
            this.loading = false;
            this.poolExist = false;
            return;
        }

        this.liquidityPools = [];
        this.setSwapPairField("tokenBBalance", "");
        this.setSwapPairField("tokenBPerTokenA", 0);
        this.setSwapPairField("tokenABalance", "");
        this.lpPath = []


        if(this.settings.isMultihopsDisable()) {
            console.log("this.allExchangePairs:", this.allExchangePairs)
            // for(const _pool of this.allExchangePairs) {
            //     console.log(_pool)
            //     console.log("\n")
            // }

            var singlePool = this.allExchangePairs.find(pair => 
                (pair.tokenA_id == tokenA && pair.tokenB_id == tokenB) || 
                (pair.tokenA_id == tokenB && pair.tokenB_id == tokenA)
            )
            
            console.log("Single pool:", singlePool)
    
            if(singlePool !== undefined) {
                this.liquidityPools.push( {
                        tokenA_id: singlePool.tokenA_id,
                        tokenB_id: singlePool.tokenB_id,
                        does_have_liquidity: singlePool.total_liquidity === 0,
                        reserves: {
                            reserveA: singlePool.reserveA,
                            reserveB: singlePool.reserveB,
                            total_liquidity: singlePool.total_liquidity
                        }
                    }
                )
                if(singlePool.total_liquidity < 1.0) {
                    console.log("INSUFFICIENT LIQUIDITY!!!")
                    this.insufficient_liquidity = true
                    this.poolExist = true
                }
                this.loading = false
            } else {
                this.poolExist = this.insufficient_liquidity ? true : false
                console.log(`Setting poolExist to ${this.poolExist} when insufficient_liquidity: ${this.insufficient_liquidity}`)
            }
            this.loading = false
        } else {
            this.getLiquidityPoolPaths(tokenA, tokenB)
        }
        

        // this.liquidityPools.forEach(path => {
        //     this.getLiquidityPoolReserve(path.poolAddress);
        // })
    }


    private getBalances() {
        this.swap.get('tokenAAvailable').setValue('')
        this.swap.get('tokenBAvailable').setValue('')

        if(!this.contractService.is_initialized())
            return


        let tokenAId = this.swap.get('tokenAId').value
        let tokenBId = this.swap.get('tokenBId').value

        const value = this.contractService.get_token_balances(tokenAId, tokenBId)
        if(value) {
            value.then((val: any) => {
                console.log("[swap components] val:", val)
                this.swap.get("tokenAAvailable").setValue(val.tokenA_balance)
                this.swap.get("tokenBAvailable").setValue(val.tokenB_balance)
            })
        } else {
            console.error("NEW VALUE:", value)
        }
    }


    private getLiquidityPoolPaths(tokenA_id: number, tokenB_id: number) {
        var usedPools = [];
        var canContinue = true;

        // while(canContinue) {
        //     this.findLiquidityPoolPaths(tokenA_id, tokenB_id, this.liquidityPools, usedPools, []);

        //     var tokenAPoolExists = this.liquidityPools.find(e => e.tokenA_id === tokenA_id || e.tokenA_id === tokenA_id);
        //     var tokenBPoolExists = this.liquidityPools.find(e => e.tokenA_id === tokenB_id || e.tokenB_id === tokenB)_id;

        //     if(tokenAPoolExists === undefined && tokenBPoolExists === undefined) {
        //         this.liquidityPools = [];
        //         canContinue = false;
        //     } else if(tokenAPoolExists === undefined || tokenBPoolExists === undefined) {
        //         usedPools.push(this.liquidityPools.pop().poolAddress);
        //         this.liquidityPools = []
                
        //         canContinue = this.allExchangePairs.filter(element => 
        //                 element.tokenA_id === tokenA_id ||
        //                 element.tokenB_id === tokenA_id ||
        //                 element.tokenA_id === tokenB_id ||
        //                 element.tokenB_id == tokenB_id) !== undefined;
        //     } else {
        //         canContinue = false;
        //     }
        // }

        // if(this.liquidityPools.length === 0) {
        //     this.poolExist = false;
        //     this.loading = false;
        // }
    }


    private findLiquidityPoolPaths(
        from: string, 
        to: string,
        path: any[], 
        ignorePoolAddress: any[], 
        usedPoolAddress: any[]) {
        // var start = this.allExchangePairs
        //     // .filter(pair => !ignorePoolAddress.includes(pair.poolAddress))
        //     // .filter(pair => !usedPoolAddress.includes(pair.poolAddress))
        //     .find(pair => pair.tokenA_id === from || pair.tokenB_id === from )

        // if(start === null || start === undefined) {
        //     return
        // }

        // path.push(start);

        // if(start.tokenA === to || start.tokenB === to) {
        //     return;
        // }

        // usedPoolAddress.push(start.poolAddress);

        // start.tokenA === from ?
        //     this.findLiquidityPoolPaths(start.tokenB, to, path, ignorePoolAddress, usedPoolAddress) : 
        //     this.findLiquidityPoolPaths(start.tokenA, to, path, ignorePoolAddress, usedPoolAddress);
    }


    private getLiquidityPoolReserve(tokenA_id: number, tokenB_id: number) {
        // this.contractService.get_reserves(tokenA_id, tokenB_id)
        //     .then((value: PairInterface) => {
        //         var pool = this.liquidityPools.find(e => 
        //             e.tokenA_id === tokenA_id ||
        //             e.tokenB_id === tokenB_id    
        //         )
        //         pool.reserves = [value.reserveA, value.reserveB]
        //         pool.does_have_liquidity = parseInt(value.total_liquidity.toString()) !== 0
        //     })
             
        // this.walletProvider.Wallet()
        //     .getReserves(pairAddress)
        //     .then(reserve => 
        //         {
        //             var pool = this.liquidityPools.find(e => e.poolAddress === pairAddress);
        //             pool.reserves = reserve;
        //             pool.does_have_liquidity = (reserve[0].reserve !== "0" && reserve[1].reserve !== "0");
        //         }).finally(() => this.loading = false);
    }


    private getSwapField(field: string): any {
        return this.swap.get(field).value;
    }


    private setSwapPairField(field: string, value: any) {
        this.swap.get(field).setValue(value);
    }


    private updateTokenBAmount() {
        if(!this.IsNotEmptyNullOrNaN("tokenABalance")) {
            return;
        }

        this.liquidityPathAddresses = []

        console.log("Getting amounts out:", [
            this.getSwapField("tokenAId"),
            this.getSwapField("tokenABalance"),
            this.getSwapField("tokenBId"),
            this.liquidityPools
        ])

        this.getAmountsOut(
            +this.getSwapField("tokenAId"), 
            +this.getSwapField("tokenABalance"), 
            +this.getSwapField("tokenBId") as number, 
            this.liquidityPools
        )

        this.callSwapTokenOutForTokenIn = false;
    }


    private updateTokenBPerTokenA() {
        if(this.getSwapField("tokenBPerTokenA") === 0) {
            this.setSwapPairField("tokenBPerTokenA", parseFloat(this.getSwapField("tokenABalance")) / parseFloat(this.getSwapField("tokenBBalance")));
        }

        this.setSwapPairField("tokenAFee", 0.003 * parseFloat(this.getSwapField("tokenABalance")));

        if(parseFloat(this.getSwapField("tokenBBalance"))) {
            this.setSwapPairField("expected", Number(parseFloat(this.getSwapField("tokenBBalance")).toFixed(5)));
        }
        
        if(this.callSwapTokenOutForTokenIn && parseFloat(this.getSwapField("tokenABalance"))) {
            this.setSwapPairField("amountInMax", 
            Number(parseFloat(this.getSwapField("tokenABalance")) * (1 + this.settings.getSlippageForCalculation())).toFixed(5));
        }

        if(!this.callSwapTokenOutForTokenIn && parseFloat(this.getSwapField("tokenBBalance"))) {
            this.setSwapPairField("amountOutMin", 
            Number(parseFloat(this.getSwapField("tokenBBalance")) * (1 - this.settings.getSlippageForCalculation())).toFixed(5));
        }

        this.lpPath = [];
        console.log("this.liquidityPathAddresses:", this.liquidityPathAddresses)
        // this.liquidityPathAddresses.forEach(path => {
        //     this.tokenService.getToken(path)
        //         .then(result => this.lpPath.push(result));
        // })
    }


    private getAmountsOut(
        tokenA: number, 
        tokenABalance: number, 
        endToken: number, 
        liquidityPools: any[]
    ) {
        if(!this.liquidityPathAddresses.includes(tokenA)) {
            this.liquidityPathAddresses.push(tokenA);
        }
        
        var liquidityPool = liquidityPools.find(e => e.tokenA_id === tokenA || e.tokenB_id === tokenA)

        // var found = liquidityPool.reserves.find(r => tokenA.includes(r.scriptHash));
        // var other = liquidityPool.reserves.find(r => !tokenA.includes(r.scriptHash));

        console.log("Liquidity pool:", liquidityPool)

        let outputAmount = this.getAmountOut(
            parseFloat(tokenABalance.toString()),
            parseFloat(liquidityPool.reserves.reserveA), 
            parseFloat(liquidityPool.reserves.reserveB)
        )

        if(liquidityPool.tokenA_id === endToken || liquidityPool.tokenB_id === endToken) {
            this.liquidityPathAddresses.push(endToken)
            console.log("outputAmount:", outputAmount)
            this.setSwapPairField("tokenBBalance", outputAmount);
        } else {
            // this.liquidityPathAddresses.push(other.scriptHash);

        //     this.getAmountsOut(
        //         other.scriptHash,
        //         outputAmount.toString(), 
        //         endToken, 
        //         liquidityPools.filter(pair => !liquidityPool.poolAddress.includes(pair.poolAddress)));
        }
    }


    private updateTokenAAmount() {
        if(!this.IsNotEmptyNullOrNaN("tokenBBalance")) {
            return;
        }

        this.liquidityPathAddresses = [];

        this.getAmountsIn(
            this.getSwapField("tokenBId"),
            this.getSwapField("tokenBBalance"),
            this.getSwapField("tokenAId"),
            this.liquidityPools);

        this.callSwapTokenOutForTokenIn = true;
    }
    

    private getAmountsIn(tokenB: string, tokenBBalance: string, endToken: string, liquidityPools: any[]) {
        if(!this.liquidityPathAddresses.includes(tokenB)) {
            this.liquidityPathAddresses.push(tokenB);
        }
        
        var liquidityPool = liquidityPools.find(e => e.tokenA === tokenB || e.tokenB === tokenB);

        var found = liquidityPool.reserves.find(r => tokenB.includes(r.scriptHash));
        var other = liquidityPool.reserves.find(r => !tokenB.includes(r.scriptHash));

        let outputAmount = this.getAmountIn(
            parseFloat(tokenBBalance),
            parseFloat(other.reserve),
            parseFloat(found.reserve))

        if(liquidityPool.tokenA === endToken 
            || liquidityPool.tokenB === endToken) {
            this.liquidityPathAddresses.push(endToken);
            this.setSwapPairField("tokenABalance", outputAmount);
        } else {
            this.liquidityPathAddresses.push(other.scriptHash);

            this.getAmountsIn(
                other.scriptHash, 
                outputAmount.toString(), 
                endToken, 
                liquidityPools.filter(pair => !liquidityPool.poolAddress.includes(pair.poolAddress)));
        }
    }


    private IsNotEmptyNullOrNaN(field: any) : boolean {
        return this.getSwapField(field) !== "" 
        && this.getSwapField(field) !== null
        && this.getSwapField(field) !== NaN;
    }
    

    private getAmountOut(amountA: number, reserveA: number, reserveB: number): number {
        var amountInWithFee = amountA * 997;
        var numerator = amountInWithFee * reserveB;
        var denominator = reserveA * 1000 + amountInWithFee;
        
        return numerator / denominator;
    }
    

    private getAmountIn(amountOut: number, reserveIn: number, reserveOut: number) {
            var numerator = reserveIn * amountOut * 1000;
            var denominator = (reserveOut - amountOut) * 997;
            var amountIn = (numerator / denominator);
            return amountIn;
    }


    swapOrder() {
        var tokenASymbol = this.getSwapField("tokenASymbol");
        var tokenA = this.getSwapField("tokenAId");
        var tokenALogo = this.getSwapField("tokenALogo");

        this.setSwapPairField("tokenASymbol", this.getSwapField("tokenBSymbol"));
        this.setSwapPairField("tokenAId", this.getSwapField("tokenBId"));
        this.setSwapPairField("tokenABalance", "");
        this.setSwapPairField("tokenALogo", this.getSwapField("tokenBLogo"));

        this.setSwapPairField("tokenBSymbol", tokenASymbol);
        this.setSwapPairField("tokenBId", tokenA);
        this.setSwapPairField("tokenBBalance", "");
        this.setSwapPairField("tokenBLogo", tokenALogo);

        this.setSwapPairField("tokenBPerTokenA", 0);
        this.getBalances();
    }
}