
export interface PairInterface {
    tokenA_id: number,
    tokenB_id: number,
    hash: string,
    created_by: string,
    reserveA: number,
    reserveB: number,
    total_liquidity: number,
    balances: any
}

export interface ReserveInterface {
    reserveA: number,
    reserveB: number,
    total_liquidity: number
}