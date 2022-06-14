import { Injectable } from "@angular/core"
import { BehaviorSubject, Observable } from "rxjs"
import { map, finalize } from "rxjs/operators"
import { environment } from "src/environments/environment"
import {
    Pair
} from "./interface"
import { NightElfService } from "../night-elf/NightElfService"
import { FAUCET_TOKENS } from "src/app/constants"
import { PairInterface } from "../interface/wallet"
import * as moment from "moment"


@Injectable({providedIn: "root"})
export class ContractService {
    api: string = environment.apiUrl


    constructor(
        private nightElfService: NightElfService
    ) {

    }

    async ngOnInit() {
        const value = await this.get_all_pairs()
        console.log("ALL PAIRS:", value)
    }

    get_address(): string {
        return this.nightElfService.get_aelf_address()
    }

    is_initialized(): boolean {
        const address = this.nightElfService.get_aelf_address()
        return !!address
    }


    // get_all_pairs(): Observable<any[]> {
    async get_all_pairs() {
        try {
            const contract = await this.nightElfService.get_contract()
            console.log("Contract:", contract)
            const result = await contract["get_all_exchange_pairs"].call()
            return result
        } catch(err) {
            console.error("NightELF Error:", err)
            if(err.from === "contentNightElf") {
                alert(`[NightElf Error]: ${err.errorMessage.message}. TEMP SOLUTION: Login and logout of the dApp.`)
            } else {
                alert("NightELf error. Please check the console.")
            }
        }
    }


    async get_reserves(
        tokenA_id: number,
        tokenB_id: number
    ) {
        const data = {
            tokenA_id: tokenA_id,
            tokenB_id: tokenB_id
        }
        try {
            const contract = await this.nightElfService.get_contract()
            console.log("Contract:", contract)
            const result = await contract["get_reserves"].call(data)
            return result
        } catch(err) {
            console.error("NightELF Error:", err)
            if(err.from === "contentNightElf") {
                alert(`[NightElf Error]: ${err.errorMessage.message}. TEMP SOLUTION: Login and logout of the dApp.`)
            } else {
                alert("NightELf error. Please check the console.")
            }
        }
    }


    async get_token_balances(
        tokenA_id: number,
        tokenB_id: number,
    ) {
        const address = this.nightElfService.get_aelf_address()
        if(!address) {
            alert("Connect your wallet first")
        } else {
            const data = {
                sender: address,
                tokenA_id: tokenA_id,
                tokenB_id: tokenB_id,
            }

            try {
                const contract = await this.nightElfService.get_contract()
                console.log("Contract:", contract)
                const result = await contract["get_token_balances"].call(data)
                return result
            } catch(err) {
                console.error("NightELF Error:", err)
                if(err.from === "contentNightElf") {
                    alert(`[NightElf Error]: ${err.errorMessage.message}. TEMP SOLUTION: Login and logout of the dApp.`)
                } else {
                    alert("NightELf error. Please check the console.")
                }
            }
        }

        return null
    }  
    
    
    async faucet() {
        const address = this.nightElfService.get_aelf_address()
        if(!address) {
            alert("Connect your wallet first")
        } else {
            const data = {
                sender: address,
                tokens: FAUCET_TOKENS
            }
            
            let TOKENS = []
            FAUCET_TOKENS.forEach(token => {
                TOKENS.push({
                    id: token.id,
                    decimals: token.decimals,
                    symbol: token.symbol,
                    total_supply: token.total_supply / 100_000
                })
            })

            console.log("FAUCET TOKENS:", FAUCET_TOKENS)
            try {
                const contract = await this.nightElfService.get_contract()
                console.log("Contract:", contract)
                const result = await contract["faucet"]({
                    tokens: FAUCET_TOKENS
                })
                console.log("RESULT", result)
                if(!result || result.error !== undefined) {
                    alert("Transaction failed/was cancelled. Please try again after a while.")
                } else {
                    console.log("RESULT:", result)
                    alert(`Transaction confirmed: ${result.TransactionId}`)
                }
            } catch(err) {
                console.error("NightELF Error:", err)
                if(err.from === "contentNightElf") {
                    alert(`[NightElf Error]: ${err.errorMessage.message}. TEMP SOLUTION: Login and logout of the dApp.`)
                } else {
                    alert("NightELf error. Please check the console.")
                }
            }
        }
    }


    async create_pair(
        tokenA_id: number,
        tokenB_id: number 
    ): Promise<any> | undefined {
        const address = this.nightElfService.get_aelf_address()
        if(!address) {
            alert("Connect your wallet first")
        } else {
            const data = {
                tokenA_id: tokenA_id,
                tokenB_id: tokenB_id,
                sender: address
            }

            let value = undefined
            try {
                const contract = await this.nightElfService.get_contract()
                console.log("Contract:", contract)

                const result = await contract["create_exchange_pair"]({
                    tokenAId: tokenA_id,
                    tokenBId: tokenB_id,
                })
                if(!result || result.error !== undefined) {
                    alert("Transaction failed/was cancelled. Please try again after a while.")
                } else {
                    alert(`Transaction confirmed: ${result.TransactionId}`)
                }
            } catch(err) {
                console.error("NightELF Error:", err)
                if(err.from === "contentNightElf") {
                    alert(`[NightElf Error]: ${err.errorMessage.message}. TEMP SOLUTION: Login and logout of the dApp.`)
                } else {
                    alert("NightELf error. Please check the console.")
                }
            }

            return value 
        }

        return undefined
    }


    async add_liquidity(
        tokenA_id: number, 
        tokenAAmount: number, 
        tokenAMin: number, 
        tokenB_id: number, 
        tokenBAmount: number, 
        tokenBMin: number
    ): Promise<any> | undefined {
        const address = this.nightElfService.get_aelf_address()
        if(!address) {
            alert("Connect your wallet first")
        } else {
            const data = {
                sender: address,
                tokenA_id: tokenA_id,
                amountADesired: tokenAAmount,
                amountAMin: tokenAMin,
                tokenB_id: tokenB_id,
                amountBDesired: tokenBAmount,
                amountBMin: tokenBMin,
            }

                                
            let value = undefined
            try {
                const contract = await this.nightElfService.get_contract()
                console.log("Contract:", contract)

                const result = await contract["add_liquidity"]({
                    sender: address,
                    tokenAId: tokenA_id,
                    tokenBId: tokenB_id,
                    amountADesired: tokenAAmount,
                    amountBDesired: tokenBAmount,
                    amountAMin: tokenAMin,
                    amountBMin: tokenBMin,
                    deadline: {
                        seconds: moment(moment().add({minutes: 5})).unix(),
                        nanos: moment(moment().add({minutes: 5})).milliseconds() * 1000.
                    }
                })
                if(!result || result.error !== undefined) {
                    alert("Transaction failed/was cancelled. Please try again after a while.")
                } else {
                    alert(`Transaction confirmed: ${result.TransactionId}`)
                }
            } catch(err) {
                console.error("NightELF Error:", err)
                if(err.from === "contentNightElf") {
                    alert(`[NightElf Error]: ${err.errorMessage.message}. TEMP SOLUTION: Login and logout of the dApp.`)
                } else {
                    alert("NightELf error. Please check the console.")
                }
            }

            return value
        }

        return undefined 
    }
    

    async lock_liquidity(
        tokenA_id: number,
        tokenB_id: number,
        amount_to_lock: number,
        amount_in_days: number = 100
    ): Promise<any> | undefined {
        const address = this.nightElfService.get_aelf_address()
        if(!address) {
            alert("Connect your wallet first")
        } else {
            const data = {
                sender: address,
                tokenA_id: tokenA_id,
                tokenB_id: tokenB_id,
                amount_to_lock: amount_to_lock
            }


            let value = undefined
            try {
                const contract = await this.nightElfService.get_contract()
                console.log("Contract:", contract)

                const result = await contract["lock_liquidity"]({
                    tokenAId: tokenA_id,
                    tokenBId: tokenB_id,
                })
                if(!result || result.error !== undefined) {
                    alert("Transaction failed/was cancelled. Please try again after a while.")
                } else {
                    alert(`Transaction confirmed: ${result.TransactionId}`)
                }
            } catch(err) {
                console.error("NightELF Error:", err)
                if(err.from === "contentNightElf") {
                    alert(`[NightElf Error]: ${err.errorMessage.message}. TEMP SOLUTION: Login and logout of the dApp.`)
                } else {
                    alert("NightELf error. Please check the console.")
                }
            }

            return value 
        }

        return undefined
    }

    
    async get_locked_liquidity(
        tokenA_id: number,
        tokenB_id: number 
    ): Promise<any> | undefined {
        const address = this.nightElfService.get_aelf_address()
        if(!address) {
            alert("Connect your wallet first")
        } else {
            const data = {
                sender: address,
                tokenA_id: tokenA_id,
                tokenB_id: tokenB_id,
            }

            let value = undefined
            try {
                const contract = await this.nightElfService.get_contract()
                console.log("Contract:", contract)

                const result = await contract["get_locked_liquidity"](data)
                return result
            } catch(err) {
                console.error("NightELF Error:", err)
                if(err.from === "contentNightElf") {
                    alert(`[NightElf Error]: ${err.errorMessage.message}. TEMP SOLUTION: Login and logout of the dApp.`)
                } else {
                    alert("NightELf error. Please check the console.")
                }
            }
        }

        return undefined
    }


    async swapTokenInForTokenOut(
        amount_out_in: number,
        amount_out_min: number,
        paths: number[],
    ) {
        const address = this.nightElfService.get_aelf_address()
        if(!address) {
            alert("Connect your wallet first")
        } else {
            const data = {
                sender: address,
                amountOutIn: amount_out_in,
                amountOutMin: amount_out_min,
                paths: paths
            }

            let value = undefined
            try {
                const contract = await this.nightElfService.get_contract()
                console.log("Contract:", contract)

                const result = await contract["swap_tokenin_for_tokenout"]({
                    sender: address,
                    paths: { paths: paths, },
                    amountIn: amount_out_in,
                    amountOutMin: amount_out_min,
                    deadline: {
                        seconds: moment(moment().add({minutes: 5})).unix(),
                        nanos: moment(moment().add({minutes: 5})).milliseconds() * 1000.
                    }
                })
                if(!result || result.error !== undefined) {
                    alert("Transaction failed/was cancelled. Please try again after a while.")
                } else {
                    alert(`Transaction confirmed: ${result.TransactionId}`)
                }
            } catch(err) {
                console.error("NightELF Error:", err)
                if(err.from === "contentNightElf") {
                    alert(`[NightElf Error]: ${err.errorMessage.message}. TEMP SOLUTION: Login and logout of the dApp.`)
                } else {
                    alert("NightELf error. Please check the console.")
                }
            }

            return value
        }

        return undefined
    }
}