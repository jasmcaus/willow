import { Component, OnInit } from '@angular/core';
import { ContractService } from '../services';

@Component({
    selector: 'app-faucet',
    templateUrl: './faucet.component.html',
    styleUrls: ['./faucet.component.scss']
})
export class FaucetComponent implements OnInit {
    constructor(
        private contractService: ContractService
    ) { }

    ngOnInit(): void { }

    async claim_from_faucet() {
        await this.contractService.faucet()
    }
}
