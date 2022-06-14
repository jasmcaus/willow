import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { WalletProviderService } from '../wallet-provider/wallet-provider.service';

@Component({
  selector: 'app-wallet-dialog',
  templateUrl: './wallet-dialog.component.html',
  styleUrls: ['./wallet-dialog.component.scss']
})
export class WalletDialogComponent implements OnInit {

  constructor(private walletProvider: WalletProviderService,
    private dialogRef: MatDialogRef<WalletDialogComponent>) { }

  ngOnInit(): void {
    this.walletProvider.walletInitialized.subscribe(result =>
      {
        if(result)
        {
          this.dialogRef.close();
        }
      });
  }

  connectNeoLine()
  {
    this.walletProvider.ConnectNeoLine();
  }
}
