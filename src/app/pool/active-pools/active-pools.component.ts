import { Component, OnInit } from '@angular/core';
import { TokenService } from 'src/app/services/interface/token/token.service';
import { WalletProviderService } from 'src/app/wallet/wallet-provider/wallet-provider.service';
import { ContractService, NightElfService } from 'src/app/services';
import { Subscription } from "rxjs"
import { PairInterface } from 'src/app/services';
import { get_deets_from_token_id } from 'src/app/constants';

@Component({
    selector: 'app-active-pools',
    templateUrl: './active-pools.component.html',
    styleUrls: ['./active-pools.component.scss']
})
export class ActivePoolsComponent implements OnInit {
    private subscriptions = new Subscription()
    address: string = ""

    loading: boolean = false;

    all_pools: { 
        hash: string,
        formattedTotalSupply: string,
        totalSupply: number,
        tokenA_id: number,
        tokenA_symbol: string,
        tokenA_logouri: string,

        tokenB_id: number,
        tokenB_symbol: string,
        tokenB_logouri: string,
    }[] = []


    user_positions: {
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

        user_liquidity: any,
        sharesOfPool: number,
    }[] = []

    
    constructor(
        public walletProvider: WalletProviderService,
        private tokenService: TokenService,
        private nightElfService: NightElfService,
        private contractService: ContractService
    ) { }


    ngOnInit(): void {
        this.address = this.nightElfService.get_aelf_address()
        this.loading = true
        if(this.contractService.is_initialized()) {
            this.get_all_pools()
        }
        this.loading = false


        // this.walletProvider.walletInitialized.subscribe(initialised => {
        //     if(initialised) {
        //         this.pools = []
        //         this.loading = true
        //         this.walletProvider
        //             .Wallet()
        //             .getLiquidity()
        //             .then(async e =>  {
        //                 await Promise.all(e.map(async (element) => {
        //                     this.pools.push({
        //                         contract: element.contract,
        //                         symbol: element.symbol,
        //                         amount: element.amount,
        //                         tokenA: element.tokenA,
        //                         tokenAAmount: undefined,
        //                         tokenASymbol: undefined,
        //                         tokenB: element.tokenB,
        //                         tokenBAmount: undefined,
        //                         tokenBSymbol: undefined,
        //                         reserves: [],
        //                         totalSupply: undefined,
        //                         sharesOfPool: undefined
        //                     });
        //                 }))
        //             })
        //             .then(async () => {
        //                 await Promise.all(this.pools.map(async (pool) => {
        //                     return this.walletProvider
        //                         .Wallet()
        //                         .getTotalSupply(pool.contract)
        //                         .then(amount => {
        //                                 pool.totalSupply = this.getTotalSupplyWithDecimals(amount);
        //                                 pool.sharesOfPool = parseFloat(((parseFloat(pool.amount) / pool.totalSupply) * 100).toFixed(3));
        //                             })
        //                 }))
        //             })
        //             .then(async () => {
        //                 await Promise.all(this.pools.map(async (pool) => {
        //                     return this.walletProvider
        //                             .Wallet()
        //                             .getReserves(pool.contract)
        //                             .then(reserve => 
        //                                 {
        //                                     reserve.forEach(reserve =>
        //                                         {
        //                                             this.tokenService
        //                                                 .getToken(reserve.scriptHash)
        //                                                 .then(result => {
        //                                                         if(reserve.token === "token0") {
        //                                                             pool.tokenAAmount = parseFloat(((parseFloat(pool.amount) * this.getTotalSupplyWithDecimals(reserve.reserve)) / pool.totalSupply).toFixed(4));
        //                                                             pool.tokenASymbol = result.symbol;
        //                                                         } else {
        //                                                             pool.tokenBAmount = parseFloat(((parseFloat(pool.amount) * this.getTotalSupplyWithDecimals(reserve.reserve)) / pool.totalSupply).toFixed(4));
        //                                                             pool.tokenBSymbol = result.symbol;
        //                                                         }
        //                                                     })
        //                                         })
        //                                     pool.reserves = reserve;
        //                                 })
        //                 }))
        //             })
        //             .finally(() => this.loading = false);
        //     }
        // })
    }


    private getTotalSupplyWithDecimals(num: string) : number {
        const decimals = 8
        var final = "1";
        for (let index = 0; index < decimals; index++) {
            final = final + "0";
        }
        return Number(parseFloat(num) / parseFloat(final));
    }


    get logined(): boolean {
        return !!this.address
    }


    get_all_pools() {
        this.contractService
            .get_all_pairs()
            .then((pools: {data: PairInterface[]}) => {
                for(const pool of pools.data) {
                    console.log("POOL DATA:", pool)
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
                    this.all_pools.push(pool_obj)
                    
                    // Does user have a position in this pool?
                    if(!(amount && 
                       Object.keys(amount).length === 0 &&
                       Object.getPrototypeOf(amount) === Object.prototype
                    )) {
                        this.user_positions.push({
                            ...pool_obj,
                            tokenA_amount: amount.amountA,
                            tokenB_amount: amount.amountB,
                            user_liquidity: amount.user_liquidity,
                            sharesOfPool: parseFloat(((
                                parseFloat(amount.user_liquidity.toString()) / total_supply
                            ) * 100).toFixed(3)),
                        })
                    }
                    console.log("ALL POOLS:", this.all_pools)
                    console.log("USER POSITIONS:", this.user_positions)
                }
            })
            .finally(() => {
                this.loading = false
            })
    }

    format_amount(amount: number | string) {
        if(typeof amount === "string") {
            amount = parseFloat(amount)

        }

        return `${amount.toFixed(2)}`
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

    ngOnDestroy() {
        if(this.subscriptions) {
            this.subscriptions.unsubscribe();
        }
    }
}
