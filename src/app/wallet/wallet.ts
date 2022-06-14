export interface IWallet {
    connect(): void,
    getAccountAddressFormatted(): string,
    getTokenDeployFee(): Promise<string>,
    deployTokenContract(contractName: string, author: string, email: string, description: string, symbol: string, decimals: number, supply: number): Promise<any>,
    getSwapPairDeployFee(): Promise<string>,
    deploySwapPairContract(symbol: string, tokenA: string, tokenB: string): Promise<any>,
    getTokenSymbol(scriptHash: string): Promise<string>,
    getDecimals(contractAddress: string) : Promise<number>
    getTokenPairContractAddress(tokenA: string, tokenB: string) : Promise<string>
    getLiquidity() : Promise<{contract: string, symbol: string, amount: string, tokenA: string, tokenB: string}[]>,
    getReserves(poolAddress: string): Promise<{ address: string, reserve: string, scriptHash: string, token: string }[]>,
    addLiquidity(tokenA: string, 
        tokenAAmountDesired: number, 
        tokenAMin: number,
        tokenB: string, 
        tokenBAmountDesired: number, 
        tokenBMin: number,
        tokenPairContractAddress: string): Promise<string>,
    swapTokenInForTokenOut(amountIn: number, amountOutMin: number, paths: any[]): Promise<string>,
    swapTokenOutForTokenIn(amountOut: number,amountInMax: number, paths: any[]): Promise<string>,
    getTotalSupply(poolAddress: string): Promise<any>,
    removeLiquidity(poolContract: string, tokenA: string, tokenB: string, liquidity: number, amountAMin: number, amountBMin: number): Promise<any>
    getSymbolAndDecimals(contractScriptHash: string) : Promise<{ decimals: number, symbol: string}>,
    getAllExchangePair(): Promise<{tokenA: string, tokenB: string, poolAddress: string}[]>,
    getTokenContractDeployed(txId: string): Promise<any>,
    lockLiquidity(liquidity: string, amount: number, endDate: number): Promise<any>,
    unlockLiquidity(liquidity: string, counter: number): Promise<any>,
    getAddressLiquidityLockup(): Promise<{ owner: string, contract: string, endDate: Date, amount: number, counter: number }[]>,
    getAllLocksForContract(scriptHash: string): Promise<{ owner: string, contract: string, endDate: Date, amount: number, counter: number }[]>,
    getBalances(): Promise<{ contract, symbol, amount }[]>
}