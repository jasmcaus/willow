import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TokenService } from '../../services/interface/token/token.service';
import { Token, TOKENLIST } from "../../constants"
import { NotTrustedDialogComponent } from '../not-trusted-dialog/not-trusted-dialog.component';

@Component({
    selector: 'app-token-select-dialog',
    templateUrl: './token-select-dialog.component.html',
    styleUrls: ['./token-select-dialog.component.scss']
})
export class TokenSelectDialogComponent implements OnInit {
    loading: boolean = false;

    @Output() tokenEmitter = new EventEmitter<Token>();

    trustedTokens: { symbol: string, scriptHash: string, decimals: number }[] = []
    token_list: Token[] = []

    constructor(
        private service: TokenService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.trustedTokens = this.service.common;
        this.token_list = TOKENLIST
    }

    search(input: any) {
        var value = (input as HTMLInputElement).value;
        this.trustedTokens = this.service.common.filter(e => 
                e.symbol.toLocaleLowerCase().includes(value.toLocaleLowerCase()) 
                || e.scriptHash.toLocaleLowerCase().includes(value.toLocaleLowerCase()));

        if(this.trustedTokens.length === 0 && value.length === 42) {
            this.loading = true;
            this.service.getToken(value)
                .then(e => this.trustedTokens.push(e))
                .then(e => this.dialog.open(NotTrustedDialogComponent, { disableClose: true }))
                .finally(() => this.loading = false);
        }
    }

    select(token: number) {
        this.tokenEmitter.emit(this.token_list.filter(e => e.id === token)[0]);
    }
}

