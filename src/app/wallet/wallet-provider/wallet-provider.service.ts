import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NeolineService } from '../neoline/neoline.service';
import { IWallet } from '../wallet';


@Injectable({
    providedIn: 'root'
})
export class WalletProviderService {
    private wallet = new BehaviorSubject<IWallet>(null);
    walletInitialized = new BehaviorSubject<boolean>(false);

    constructor(private neoLine: NeolineService) {
        this.neoLine.walletInitalized.subscribe(val =>
            {
                if(val)
                {
                    this.wallet.next(this.neoLine);
                    this.walletInitialized.next(this.neoLine.walletInitalized.value);
                }
            });
     }

    public ConnectNeoLine()
    {
        this.neoLine.connect();
    }

    public Disconnect()
    {
        sessionStorage.removeItem('connectedWallet');
        this.wallet.next(null);
        this.walletInitialized.next(false);
    }

     public Wallet(): IWallet
     {
         return this.wallet.value
     }
}
