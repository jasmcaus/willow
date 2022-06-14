import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { SettingsService } from "src/app/services/interface/settings/settings.service";
import { TokenSelectDialogComponent } from "src/app/dialog/token-select-dialog/token-select-dialog.component";
import { WalletProviderService } from "src/app/wallet/wallet-provider/wallet-provider.service";
import { ActivatedRoute } from "@angular/router";
import { TokenService } from "src/app/services/interface/token/token.service";
import { ContractService, ReserveInterface } from "src/app/services";


@Component({
    selector: "app-add-liquidity",
    templateUrl: "./add-liquidity.component.html",
    styleUrls: ["./add-liquidity.component.scss"]
})
export class AddLiquidityComponent implements OnInit {
    private tokenAParam: string = null
    private tokenBParam: string = null

    private reserves: { token: string, scriptHash: string, address: string, reserve: string }[] = [];
    private reserve: ReserveInterface

    poolTotalSupply: number = 0;

    is_first_liquidity: boolean = false;
    pool_does_not_exist: boolean = false;
    loading: boolean = false;
    showPoolShare: boolean = false;
    adding_lp: boolean = false;
    tokenA_input_amount: number = 1
    tokenB_input_amount: number = 1
    tokenA_balance: number = 0
    tokenB_balance: number = 0

    private tokenPairContractAddress: string = "";

    token = this.fb.group({
        tokenA: [0],
        tokenAAmount: [],
        tokenASymbol: ["WLT"],
        tokenAId: [0],
        tokenALogo: ["assets/tokens/Willow.svg"],
        tokenABalance: [""],

        tokenB: [""],
        tokenBAmount: [],
        tokenBSymbol: [""],
        tokenBId: [0],
        tokenBLogo: [],
        tokenBBalance: [""],

        poolShares: [],
        tokenBPerTokenA: [],
        tokenAPerTokenB: []
    })

    constructor(
        private fb: FormBuilder,
        private walletProvider: WalletProviderService,
        private contractService: ContractService,
        private settings: SettingsService,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private tokenService: TokenService
    ) { }


    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            this.tokenAParam = params.get("tokenA");
            this.tokenBParam = params.get("tokenB");

            console.log("tokenAParam:", this.tokenAParam)
            console.log("tokenBParam:", this.tokenBParam)
        })

        if(this.contractService.is_initialized()) {
            this.getBalances()
        }

        console.log("tokenBBalance:", this.token.get("tokenBBalance").value)
    }


    openTokenSelectDialog(token: string) {
        let dialogRef = this.dialog.open(TokenSelectDialogComponent, {panelClass: "custom-token-select-modalbox"});

        dialogRef.componentInstance.tokenEmitter.subscribe(val => {
            if(val) {
                if(token === "tokenA") {
                    this.token.get("tokenASymbol").setValue(val.symbol)
                    this.token.get("tokenA").setValue(val.scriptHash)
                    this.token.get("tokenALogo").setValue(val.logo_uri)
                    this.token.get("tokenAId").setValue(val.id)
                } else {
                    this.token.get("tokenBSymbol").setValue(val.symbol)
                    this.token.get("tokenB").setValue(val.scriptHash)
                    this.token.get("tokenBLogo").setValue(val.logo_uri)
                    this.token.get("tokenBId").setValue(val.id)
                }

                this.token.get("tokenAAmount").setValue("")
                this.token.get("tokenBAmount").setValue("")
                
                this.showPoolShare = false
                dialogRef.close()
                this.is_first_liquidity = false 
                this.pool_does_not_exist = false
                this.getBalances()
                this.get_reserves()
            }
        })
    }

    get_reserves() {
        if(this.token.get("tokenASymbol").value !== "" ||
           this.token.get("tokenBSymbol").value !== ""
        ) {
            this.loading = true
            const tokenA_id = this.token.get("tokenAId").value as number
            const tokenB_id = this.token.get("tokenBId").value as number

            this.contractService
                .get_reserves(tokenA_id, tokenB_id)
                .then((reserve: any) => {
                    console.log("RESERVE:", reserve)
                    if(!reserve.status) {
                        this.pool_does_not_exist = true
                    } else {
                        const reserveA = reserve.reserveA
                        const reserveB = reserve.reserveB
                        this.is_first_liquidity = parseFloat(reserveA) === 0 && parseFloat(reserveA) === 0
                        if(!this.is_first_liquidity) {
                            this.poolTotalSupply = reserve.total_liquidity
                        }
                        this.reserve = {
                            reserveA: reserveA,
                            reserveB: reserveB,
                            total_liquidity: parseFloat(reserve.total_liquidity.toString())
                        } as ReserveInterface
                    }
                })
                .then(() => this.loading = false)
        }
    }

    // private getPairAddress() {
    //     if(this.token.get("tokenA").value !== "" 
    //        && this.token.get("tokenB").value !== "") {
    //         this.loading = true;
    //         this.walletProvider
    //             .Wallet()
    //             .getTokenPairContractAddress(
    //                 this.token.get("tokenA").value,
    //                 this.token.get("tokenB").value)
    //             .then(result => 
    //                 {
    //                     this.pool_does_not_exist = false;
    //                     this.tokenPairContractAddress = atob(result);
    //                 })
    //                 .then(async () =>
    //                 {
    //                     try 
    //                     {
    //                         const reserve = await this.walletProvider.Wallet()
    //                             .getReserves(this.tokenPairContractAddress);
    //                         this.reserves = reserve;
    //                         this.is_first_liquidity = (parseFloat(reserve[0].reserve) === 0 && parseFloat(reserve[1].reserve) === 0);
    //                     }
    //                     catch {

    //                     }
    //                 })
    //                 .then(async () =>
    //                 {
    //                     if(!this.is_first_liquidity)
    //                     {
    //                         const supply = await this.walletProvider.Wallet()
    //                         .getTotalSupply(this.tokenPairContractAddress);
    //                         this.poolTotalSupply = parseFloat(supply);
    //                     }
    //                 })
    //                 .catch(() => {this.pool_does_not_exist = true})
    //                 .finally(() => this.loading = false);
    //     }
    // }

    tokenAAmountInput(input: any) {
        this.token.get("tokenAAmount").setValue((input as HTMLInputElement).value);
        this.tokenA_input_amount = +this.token.get("tokenAAmount").value
        
        console.log("Typeof:", typeof this.tokenA_input_amount)

        if(!this.is_first_liquidity) {
            this.updateTokenBAmount();
            this.calculateSharesOfPool();
            this.calculateTokensPerToken();
        } else {
            this.showPoolShare = false;
        }
    }

    
    tokenBAmountInput(input: any) {
        this.token.get("tokenBAmount").setValue((input as HTMLInputElement).value);
        this.tokenB_input_amount = +this.token.get("tokenBAmount").value
        if(!this.is_first_liquidity)
        {
            this.updateTokenAAmount();
            this.calculateSharesOfPool();
            this.calculateTokensPerToken();
        }
        else
        {
            this.showPoolShare = false;
        }
    }

    private updateTokenBAmount() {
        if(this.token.get("tokenAAmount").value !== "" 
            && this.token.get("tokenAAmount").value !== null
            && this.token.get("tokenAAmount").value !== NaN
            && this.reserves.length > 0)
        {
            var found = this.reserves.find(r => this.token.get("tokenA").value.includes(r.scriptHash));
            var other = this.reserves.find(r => !this.token.get("tokenA").value.includes(r.scriptHash));

            this.token.get("tokenBAmount")
                .setValue(
                    this.getAmount(
                        parseFloat(this.token.get("tokenAAmount").value), 
                        parseFloat(found.reserve), 
                        parseFloat(other.reserve)));
        }
    }

    private updateTokenAAmount()
    {
        if(this.token.get("tokenBAmount").value !== "" 
            && this.token.get("tokenBAmount").value !== null
            && this.token.get("tokenBAmount").value !== NaN
            && this.reserves.length > 0)
        {
            var found = this.reserves.find(r => this.token.get("tokenB").value.includes(r.scriptHash));
            var other = this.reserves.find(r => !this.token.get("tokenB").value.includes(r.scriptHash));

            this.token.get("tokenAAmount")
                .setValue(
                    this.getAmount(
                        parseFloat(this.token.get("tokenBAmount").value), 
                        parseFloat(found.reserve), 
                        parseFloat(other.reserve)));
        }
    }


    addLiquidity() {
        this.adding_lp = true;
        
        const tokenA_id = +this.token.get("tokenAId").value
        const tokenB_id = +this.token.get("tokenBId").value

        // let tokenAAmount = this.addZeros(this.token.get("tokenAAmount").value);
        // let tokenBAmount = this.addZeros(this.token.get("tokenBAmount").value);
        let tokenAAmount = this.token.get("tokenAAmount").value
        let tokenBAmount = this.token.get("tokenBAmount").value

        if(this.is_first_liquidity) {
            if(tokenA_id < tokenB_id) {
                this.add_liquidity(
                    tokenA_id,
                    tokenAAmount,
                    0,
                    tokenB_id,
                    tokenBAmount,
                    0
                )
            } else {
                this.add_liquidity(
                    tokenB_id,
                    tokenBAmount,
                    0,
                    tokenA_id,
                    tokenAAmount,
                    0
                )
            }
        } else {
            const slippage = this.settings.getSlippageForCalculation()
            console.log("Slippage:", slippage)
            var tokenAMin = tokenAAmount * (1 - slippage);
            var tokenBMin = tokenBAmount * (1 - slippage);

            console.log("Using A min:", tokenAMin)
            console.log("Using B min:", tokenBMin)

            if(tokenA_id < tokenB_id) {
                this.add_liquidity(
                    tokenA_id,
                    tokenAAmount,
                    tokenAMin,
                    tokenB_id,
                    tokenBAmount,
                    tokenBMin
                )
            } else {
                this.add_liquidity(
                    tokenB_id,
                    tokenBAmount,
                    tokenBMin,
                    tokenA_id,
                    tokenAAmount,
                    tokenAMin
                )
            }
        }
    }

    private add_liquidity(
        tokenA_id: number, 
        tokenADesired: number, 
        tokenAMin: number, 
        tokenB_id: number, 
        tokenBDesired: number, 
        tokenBMin: number
    ) {
        const value = this.contractService.add_liquidity(
            tokenA_id,
            tokenADesired,
            tokenAMin,
            tokenB_id,
            tokenBDesired,
            tokenBMin
        )
        if(value) {
            value.then((val: any) => {
                console.log("add_liquidity result:", val)
                this.adding_lp = false
            })
        } else {
            alert("Something went wrong when adding liquidity. Please try again after a while")
        }
    }

    private addZeros(num: string) : number {
        const decimals = 8
        var final = "1";
        for (let index = 0; index < decimals; index++) {
            final = final + "0";
        }
        return parseFloat(num) * parseFloat(final);
    }

    private getAmount(amountA: number, reserveA: number, reserveB: number): number {
        return amountA * reserveB / reserveA;
    }

    private calculateSharesOfPool() {
        let reserve0 = parseFloat(this.reserves.find(r => r.scriptHash === this.token.get("tokenA").value).reserve);
        let reserve1 = parseFloat(this.reserves.find(r => r.scriptHash === this.token.get("tokenB").value).reserve);

        let amount0 = this.addZeros(this.token.get("tokenAAmount").value)
        let amount1 = this.addZeros(this.token.get("tokenAAmount").value)

        let liquidity0 = (amount0 * this.poolTotalSupply)/reserve0;
        let liquidity1 = (amount1 * this.poolTotalSupply)/reserve1;

        if(liquidity0 > liquidity1)
        {
            this.token.get("poolShares").setValue(parseFloat(((liquidity1/(this.poolTotalSupply + liquidity1))*100).toFixed(5)))
        }
        else
        {
            this.token.get("poolShares").setValue(parseFloat(((liquidity0/(this.poolTotalSupply + liquidity0))*100).toFixed(5)))
        }
        this.showPoolShare = true;
    }


    private calculateTokensPerToken()
    {
        this.token.get("tokenBPerTokenA")
            .setValue((parseFloat(this.token.get("tokenAAmount").value) / parseFloat(this.token.get("tokenBAmount").value)).toFixed(4));
            this.token.get("tokenAPerTokenB")
            .setValue((parseFloat(this.token.get("tokenBAmount").value) / parseFloat(this.token.get("tokenAAmount").value)).toFixed(4));
    }


    private getBalances() {
        this.token.get("tokenABalance").setValue("")
        this.token.get("tokenBBalance").setValue("")

        if(!this.contractService.is_initialized())
            return


        let tokenAId = this.token.get("tokenAId").value
        let tokenBId = this.token.get("tokenBId").value

        const value = this.contractService.get_token_balances(tokenAId, tokenBId)
        if(value) {
            value.then((val: any) => {
                this.token.get("tokenABalance").setValue(val.tokenA_balance)
                this.tokenA_balance = +val.tokenA_balance
                this.token.get("tokenBBalance").setValue(val.tokenB_balance)
                this.tokenB_balance = +val.tokenB_balance
            })
        } else {
            console.error("NEW VALUE:", value)
        }
    }


    is_insufficient_balance(): boolean {
        return (this.tokenA_input_amount >= this.tokenA_balance) ||
                (this.tokenB_input_amount >= this.tokenB_balance)
    }

    
    are_inputs_invalid(): boolean {
        return (
            this.token.get("tokenAAmount").value === "" ||
            this.token.get("tokenBAmount").value === ""
        )
    }
}