import { Injectable } from '@angular/core';
import { WalletProviderService } from 'src/app/wallet/wallet-provider/wallet-provider.service';

@Injectable({
    providedIn: 'root'
})
export class TokenService {

    common: {symbol: string, scriptHash: string, decimals: number}[] = 
    [
        { symbol: "PUMPKIN", scriptHash: "0xecf114235d014e6f70455054c30ddb7151676d3f", decimals: 8 },
        { symbol: "PFARM", scriptHash: "0xb57f00e0306d079662bef0f524dfcfaf1c65244c", decimals: 8 },
        { symbol: "GAS", scriptHash: "0xd2a4cff31913016155e38e474a2c06d08be276cf", decimals: 8 },
        { symbol: "CROW", scriptHash: "0x674a18fd4b56ee77889071ec909e063399800055", decimals: 8 },
        { symbol: "SHEEP", scriptHash: "0xafb922a11e99c9db5b7a00460feb8bd632cdfc40", decimals: 8 }
    ]

    cached: {symbol: string, scriptHash: string, decimals: number}[] = []

    constructor(private walletProvider: WalletProviderService) { }

    public getToken(scriptHash: string): Promise<{symbol: string, scriptHash: string, decimals: number}>
    {
        var token = this.common.find(c => c.scriptHash === scriptHash);
        if(token !== undefined)
        {
            return Promise.resolve(token);
        }

        var cachedToken = this.cached.find(c => c.scriptHash === scriptHash);
        if(cachedToken !== undefined)
        {
            return Promise.resolve(cachedToken);
        }
        else
        {
            return this.walletProvider.Wallet()
                        .getSymbolAndDecimals(scriptHash)
                        .then(e => 
                            { 
                                this.cached.push({ symbol: e.symbol, scriptHash: scriptHash, decimals: e.decimals });
                                return { symbol: e.symbol, scriptHash: scriptHash, decimals: e.decimals };
                            });
        }
    }
}
