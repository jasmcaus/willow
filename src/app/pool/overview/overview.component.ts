import { Component, OnInit } from '@angular/core';
import { WalletProviderService } from 'src/app/wallet/wallet-provider/wallet-provider.service';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {

  constructor(public walletProvider: WalletProviderService) { }

  ngOnInit(): void {
  }

}
