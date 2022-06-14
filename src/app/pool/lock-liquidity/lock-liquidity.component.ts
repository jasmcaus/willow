import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ContractService } from 'src/app/services';
import { WalletProviderService } from 'src/app/wallet/wallet-provider/wallet-provider.service';
import { PairInterface } from 'src/app/services';
import { get_deets_from_token_id } from 'src/app/constants';

interface UserPositionsInterface {
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
}


@Component({
    selector: 'app-lock-liquidity',
    templateUrl: './lock-liquidity.component.html',
    styleUrls: ['./lock-liquidity.component.scss']
})
export class LockLiquidityComponent implements OnInit {
    // allLiquidityPools:
    symbolAndDecimals: {contract: string, decimals: number, symbol: string}[] = [];
    liquidity: {contract: string, symbol: string, amount: string, tokenA: string, tokenB: string}[];
    liquidityLoaded: boolean = false;

    lockedUpLiquidity: { owner: string, contract: string, endDate: Date, amount: number, counter: number }[] = [];
    fullyLoaded: boolean = true;

    liquidityToLock = this.fb.group({
        contract: [''],
        symbol: [''],
        totalAmount: [''],
        lockAmount: [''],
        length: [1826]
    });

    liquidity_to_lock = this.fb.group({
        hash: [""],
        tokenA_id: [],
        tokenA_symbol: [],
        tokenA_logouri: [],
        tokenB_id: [],
        tokenB_symbol: [],
        tokenB_logouri: [],
        user_liquidity: [],
        lock_amount: [],
        length: [1826]
    })

    user_positions: UserPositionsInterface[] = []

    now: Date = new Date;

    showLockedAmountMessage: boolean = false;
    showLockedUpLengthMessage: boolean = false;

    constructor(
        private walletProvider: WalletProviderService,
        private fb: FormBuilder,
        private contractService: ContractService
    ) { }

    ngOnInit(): void {
        this.get_all_pools()

        console.log("liquidity_to_lock:", this.liquidity_to_lock.get("hash"))

        this.liquidityToLock.get('lockAmount').valueChanges.subscribe((val) =>
        {
            if(parseFloat(val))
            {
                this.showLockedAmountMessage = (parseFloat(val)/parseFloat(this.liquidityToLock.get('totalAmount').value) < 0.8);
            }
        });

        this.liquidityToLock.get('length').valueChanges.subscribe((val) =>
        {
            if(parseFloat(val))
            {
                this.showLockedUpLengthMessage = parseFloat(val) < 1095;
            }
        });

        this.walletProvider.walletInitialized.subscribe((initialised) =>
        {
            if(initialised)
            {
                this.walletProvider
                    .Wallet()
                    .getLiquidity()
                    .then(e => this.liquidity = e)
                    .then(async () =>
                    {
                        this.liquidityLoaded = true;
                        if(this.liquidity.length > 0)
                        {
                            await this.walletProvider
                            .Wallet()
                            .getAddressLiquidityLockup()
                            .then(lps => this.lockedUpLiquidity = lps.filter(lp => lp.amount > 0));
                        }
                    })
                    .then(async () => {
                        await Promise.all(this.lockedUpLiquidity.map(async (element) =>
                        {
                            this.walletProvider
                                    .Wallet()
                                    .getSymbolAndDecimals(element.contract)
                                    .then(response => this.symbolAndDecimals.push({contract: element.contract, symbol: response.symbol, decimals: response.decimals}))
                        }))
                    })
                    .finally(() => this.fullyLoaded = true);
            }
        })
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
                    // this.all_pools.push(pool_obj)
                    
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
                    console.log("USER POSITIONS:", this.user_positions)
                }
            })
            .finally(() => {
                this.liquidityLoaded = true
                this.fullyLoaded = true
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


    getSymbol(address: string) {
        var result = this.symbolAndDecimals.find(e => e.contract === address)
        
        if(result === undefined) {
            return "";
        }
        
        if(result.symbol.startsWith("PLP")) {
            var splitted = result.symbol.split('-');
            var tokenB = splitted.pop();
            return splitted.pop() + " / " + tokenB;
        }

        return result.symbol;
    }


    // lock(lp: {contract: string, symbol: string, amount: string, tokenA: string, tokenB: string}) {
    lock(pool: UserPositionsInterface) {
        console.log("Selected pool:", pool)
        this.liquidity_to_lock.get("tokenA_id").setValue(pool.tokenA_id)
        this.liquidity_to_lock.get("tokenA_symbol").setValue(pool.tokenA_symbol)
        this.liquidity_to_lock.get("tokenA_logouri").setValue(pool.tokenA_logouri)
        this.liquidity_to_lock.get("tokenB_id").setValue(pool.tokenB_id)
        this.liquidity_to_lock.get("tokenB_symbol").setValue(pool.tokenB_symbol)
        this.liquidity_to_lock.get("tokenB_logouri").setValue(pool.tokenB_logouri)
        this.liquidity_to_lock.get("user_liquidity").setValue(pool.user_liquidity)
        this.liquidity_to_lock.get("lock_amount").setValue(pool.user_liquidity)
        this.liquidity_to_lock.get("length").setValue(365)

        this.liquidity_to_lock.get("hash").setValue(pool.hash)
    }

    back() {
        this.liquidity_to_lock.get("hash").setValue("")
        this.liquidity_to_lock.get("tokenA_id").setValue("")
        this.liquidity_to_lock.get("tokenA_symbol").setValue("")
        this.liquidity_to_lock.get("tokenA_logouri").setValue("")
        this.liquidity_to_lock.get("tokenB_id").setValue("")
        this.liquidity_to_lock.get("tokenB_symbol").setValue("")
        this.liquidity_to_lock.get("tokenB_logouri").setValue("")
        this.liquidity_to_lock.get("user_liquidity").setValue("")
        this.liquidity_to_lock.get("lock_amount").setValue("")
    }

    unlock(element) {
        this.walletProvider
            .Wallet()
            .unlockLiquidity(element.contract, element.counter)
            .then(result => console.log(result));
    }

    confirm() {
        var myDate = new Date(new Date().getTime()+(this.liquidityToLock.get('length').value * 24 * 60 * 60 * 1000))

        this.contractService
            .lock_liquidity(
                this.liquidity_to_lock.get("tokenA_id").value as number,
                this.liquidity_to_lock.get("tokenB_id").value as number,
                this.liquidity_to_lock.get("lock_amount").value as number,
            )
            .then((e) => {
                console.log("e:", e)
            })
    }

    private addZeros(num: string, decimals: number) {
        var final = "1";
        for (let index = 0; index < decimals; index++) {
            final = final + "0";
        }
        return parseFloat(num) * parseFloat(final);
    }
}
