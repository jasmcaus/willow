import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContractService, PairInterface, ReserveInterface } from 'src/app/services';
import { TokenService } from 'src/app/services/interface/token/token.service';
import { WalletProviderService } from 'src/app/wallet/wallet-provider/wallet-provider.service';
import { get_deets_from_token_id } from 'src/app/constants';

@Component({
    selector: 'app-view-pool',
    templateUrl: './view-pool.component.html',
    styleUrls: ['./view-pool.component.scss']
})
export class ViewPoolComponent implements OnInit {
    doughnutChartData: any[] = [];

    hash: string = ""
    address: string = "";
    
    locks: {
        ownerShortened: string, 
        owner: string, 
        contract: string, 
        endDate: number, 
        amount: number, 
        counter: number 
    }[] = []

    totalAmountLocked: number = 0
    totalAmountLockedDisplay: number = 0
    totalTokenAAmountLocked: number = 0.0
    totalTokenBAmountLocked: number = 0.0

    pool: {
        hash: string,
        formattedTotalSupply: string,
        totalSupply: number,
        tokenA_id: number,
        tokenA_symbol: string,
        tokenA_logouri: string,
        tokenA_amount: number,

        tokenB_id: number,
        tokenB_symbol: string,
        tokenB_logouri: string,
        tokenB_amount: number,
        reserves: ReserveInterface,

        user_liquidity: number
    }

    token: {
        tokenASymbol: string,
        tokenBSymbol: string,
        symbol: string, 
        scriptHash: string, 
        decimals: number,
        totalSupply: number,
        totalSupplyDisplay: number,
        reserves: { address: string, reserve: string, scriptHash: string, token: string }[],
        tokenA: {symbol: string, scriptHash: string, decimals: number},
        tokenB: {symbol: string, scriptHash: string, decimals: number},
        tokenATotal: number,
        tokenATotalDisplay: string,
        tokenBTotal: number,
        tokenBTotalDisplay: string,
    };

    constructor(
        private route: ActivatedRoute,
        private tokenService: TokenService,
        private walletProvider: WalletProviderService,
        private contractService: ContractService
    ) { }


    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            this.hash = params.get('hash');
        })


        this.get_details()

        // this.walletProvider.walletInitialized.subscribe(initialised =>
        //     {
        //         if(initialised)
        //         {
        //             this.tokenService
        //                 .getToken(this.address)
        //                 .then(t => 
        //                     {
        //                         if(t.symbol.startsWith("PLP"))
        //                         {
        //                             var symbolSplitted = t.symbol.split('-');
        //                             this.token = {
        //                                 tokenBSymbol: symbolSplitted.pop(),
        //                                 tokenASymbol: symbolSplitted.pop(),
        //                                 symbol: t.symbol,
        //                                 scriptHash: t.scriptHash,
        //                                 decimals: t.decimals,
        //                                 totalSupply: undefined,
        //                                 totalSupplyDisplay: undefined,
        //                                 reserves: undefined,
        //                                 tokenA: undefined,
        //                                 tokenATotal: undefined,
        //                                 tokenATotalDisplay: undefined,
        //                                 tokenB: undefined,
        //                                 tokenBTotal: undefined,
        //                                 tokenBTotalDisplay: undefined
        //                             }
        //                         }
        //                     })
        //                     .then(async () =>
        //                     {
        //                         await this.walletProvider
        //                             .Wallet()
        //                             .getTotalSupply(this.token.scriptHash)
        //                             .then(supply => 
        //                                 {
        //                                     this.token.totalSupply = supply;
        //                                     this.token.totalSupplyDisplay = parseFloat(this.getTotalSupplyWithDecimals(supply, this.token.decimals).toFixed(1));
        //                                 })
        //                     })
        //                     .then(async () =>
        //                     {
        //                         await this.walletProvider
        //                             .Wallet()
        //                             .getReserves(this.token.scriptHash)
        //                             .then(reserves => 
        //                                 {
        //                                     this.token.reserves = reserves;
        //                                 })
        //                     })
        //                     .then(async () =>
        //                     {
        //                         await Promise.all(this.token.reserves.map(async (element) =>
        //                         {
        //                             await this.tokenService
        //                             .getToken(element.scriptHash)
        //                             .then(t => {
        //                                 if (element.token === "token0") {
        //                                     this.token.tokenA = t;
        //                                     this.token.tokenATotal = parseFloat(element.reserve);
        //                                     this.token.tokenATotalDisplay = this.getTotalSupplyWithDecimals(element.reserve, this.token.tokenA.decimals).toFixed(1)
        //                                 }
        //                                 else {
        //                                     this.token.tokenB = t;
        //                                     this.token.tokenBTotal = parseFloat(element.reserve);
        //                                     this.token.tokenBTotalDisplay = this.getTotalSupplyWithDecimals(element.reserve, this.token.tokenB.decimals).toFixed(1)
        //                                 }
        //                             });
        //                         }));
        //                     })
        //                     .then(async () =>
        //                     {
        //                         await this.walletProvider
        //                             .Wallet()
        //                             .getAllLocksForContract(this.token.scriptHash)
        //                             .then(async result => 
        //                                 {
        //                                     // this.locks = result;

        //                                     await Promise.all(result.map(async (element) =>
        //                                     {
        //                                         if(element.amount > 0)
        //                                         {
        //                                             this.totalAmountLocked = this.totalAmountLocked + parseFloat(element.amount.toString());
        //                                             this.locks.push(
        //                                                 {
        //                                                     ownerShortened: element.owner.substring(0, 3) + "..." + element.owner.substring(element.owner.length - 3),
        //                                                     amount: this.getTotalSupplyWithDecimals(element.amount.toString(), 8),
        //                                                     contract: element.contract,
        //                                                     counter: element.counter,
        //                                                     endDate: this.diffDays(new Date(element.endDate)),
        //                                                     owner: element.owner
        //                                                 }
        //                                             );
        //                                         }
        //                                     }))

        //                                     this.totalAmountLockedDisplay = this.getTotalSupplyWithDecimals(this.totalAmountLocked.toString(), 8);

        //                                     this.doughnutChartData = [[this.totalAmountLockedDisplay, (this.token.totalSupplyDisplay - this.totalAmountLockedDisplay)]];

        //                                     this.totalTokenAAmountLocked = this.getTotalSupplyWithDecimals(((this.token.tokenATotal / this.token.totalSupply) * this.totalAmountLocked).toString(), this.token.tokenA.decimals).toFixed(1);
        //                                     this.totalTokenBAmountLocked = this.getTotalSupplyWithDecimals(((this.token.tokenBTotal / this.token.totalSupply) * this.totalAmountLocked).toString(), this.token.tokenB.decimals).toFixed(1);
        //                                 });
        //                     })
        //                 .finally(() => this.loading = false)
        //         }
        //     });
    }


    get_details() {
        // if(!pair) {
        //     alert("Internal error. Pair not found. This should not actually happen. Please try again agyer a while")
        // }
        let pair
        console.log("HASH:", this.hash)
        this.contractService
            .get_all_pairs()
            .then((value: { data: PairInterface[] }) => {
                const pairs = value.data
                console.log("PAIRS:", pairs)

                for(const __pair of pairs) {
                    if(__pair.hash.toLowerCase() === this.hash.toLowerCase()) {
                        pair = __pair
                        break
                    }
                }

                if(!pair) {
                    alert("Pair not found. Check your URL.")
                }

                const pool = pair
                const deetsA = get_deets_from_token_id(pool.tokenA_id)
                const deetsB = get_deets_from_token_id(pool.tokenB_id)
                const total_supply = pool.total_liquidity
                const amount = this.get_user_balance(pool.balances)

                const pool_obj = {
                    hash: pool.hash,
                    totalSupply: total_supply,
                    formattedTotalSupply: this.format_amount(pool.total_liquidity),
                    tokenA_id: pool.tokenA_id,
                    tokenA_symbol: deetsA.symbol,
                    tokenA_logouri: deetsA.logo_uri,

                    tokenB_id: pool.tokenB_id,
                    tokenB_symbol: deetsB.symbol,
                    tokenB_logouri: deetsB.logo_uri,
                }

                let reserves: any 
                this.contractService
                    .get_reserves(pool.tokenA_id, pool.tokenB_id)
                    .then((reserve: any) => {
                        console.log("ENTERING HERE")
                        // if(!reserve.status) {
                        //     alert("Internal error. Could not find a matching pool")
                        // } else {
                            reserves = {
                                reserveA: reserve.reserveA,
                                reserveB: reserve.reserveB,
                                total_liquidity: reserve.total_liquidity
                            } as ReserveInterface
                        // }


                        this.pool = {
                            ...pool_obj,
                            tokenA_amount: amount.amountA || 0.0,
                            tokenB_amount: amount.amountB || 0.0,
                            user_liquidity: amount.user_liquidity || 0.0,
                            reserves: reserves
                        }

                        console.log("Got pool:", this.pool)

                        // Get locked liquidity
                        const val = this.contractService.get_locked_liquidity(pool.tokenA_id, pool.tokenB_id)
                        if(val) {
                            let locked_liquidity
                            val.then((v: any) => {
                                console.log("FULL STATUS:", v)
                                if(!v.status) {
                                    console.error("Locked Liquidity error:", v.error)
                                    alert("Internal error. Something went wrong. Please try again after a while.")
                                } else {
                                    const locked_value = v.locks
                                    console.log("LOCKED VALUE:", locked_value)
                                    if(!(locked_value && 
                                        Object.keys(locked_value).length === 0 &&
                                        Object.getPrototypeOf(locked_value) === Object.prototype
                                     )) {
                                        const pool_shares_ratio = parseFloat(((
                                            parseFloat(amount.user_liquidity.toString()) / total_supply
                                        ) * 100).toFixed(3))

                                        console.log("Pool shares ratio:", pool_shares_ratio)

                                        this.totalAmountLockedDisplay = locked_value
                                        this.totalTokenAAmountLocked = +Number((pool_shares_ratio * this.pool.tokenA_amount) / 100).toFixed(2)
                                        this.totalTokenBAmountLocked = +Number((pool_shares_ratio * this.pool.tokenB_amount) / 100).toFixed(2)

                                        console.log("Reserves:", reserves)

                                        this.doughnutChartData = [[
                                            this.totalAmountLockedDisplay, 
                                            (reserves.total_liquidity - this.totalAmountLockedDisplay)
                                        ]]
                                        
                                        console.log("doughnutChartData:", this.doughnutChartData)
                                        console.log("totalAmountLockedDisplay:", this.totalAmountLockedDisplay)
                                        console.log("pool.reserves.total_liquidity:", reserves.total_liquidity)
                                    } else {
                                        console.log("COMING HERE")
                                        this.doughnutChartData = [[
                                            0.0, 
                                            reserves.total_liquidity
                                        ]]
                                    }
                                }
                            })
                        } else {
                            this.doughnutChartData = [[
                                0.0, 
                                reserves.total_liquidity
                            ]]
                        }
                    }) 
            })
    }


    get_user_balance(balances: any): { 
        amountA: number, 
        amountB: number, 
        user_liquidity: number
    } {
        const address = this.contractService.get_address()

        console.log("BALANCE:", balances)
        const balance = balances[address]
        return balance || {}
    }


    format_amount(amount: number | string) {
        if(typeof amount === "string") {
            amount = parseFloat(amount)

        }

        return `${amount.toFixed(2)}`
    }


    private diffDays(endDate: Date)
    {
        var now = new Date;
        const _MS_PER_DAY = 1000 * 60 * 60 * 24;

        const utc1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const utc2 = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        return Math.floor((utc2 - utc1) / _MS_PER_DAY);
    }

    private getTotalSupplyWithDecimals(num: string, decimals: number) : number
    {
        var final = "1";
        for (let index = 0; index < decimals; index++) {
            final = final + "0";
        }
        return Number(parseFloat(num) / parseFloat(final));
    }
}