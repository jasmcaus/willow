import { Component, OnInit } from '@angular/core';
import { NightElfService } from '../services'
import { Subscription } from "rxjs"

@Component({
    selector: 'app-top-nav',
    templateUrl: './top-nav.component.html',
    styleUrls: ['./top-nav.component.scss']
})
export class TopNavComponent implements OnInit {
    private subscriptions = new Subscription();
    address: string = ""
    

    constructor(
        private nightElfService: NightElfService,
    ) { }


    ngOnInit(): void {
        const addr = this.nightElfService.get_aelf_address()
        if(addr) {
            this.address = `${addr.slice(0, 3)}...${addr.slice(
                addr.length - 3,
                addr.length
            )}`
        }
    }

    
    login() {
        this.nightElfService.login()
        .then((addr: string) => {
            if(addr) {
                this.address = `${addr.slice(0, 3)}...${addr.slice(
                    addr.length - 3,
                    addr.length
                )}`
            }
        })
    }


    logout() {
        this.nightElfService.logout_aelf()
    }


    get logined(): boolean {
        return !!this.address
    }


    ngOnDestroy() {
        if(this.subscriptions) {
            this.subscriptions.unsubscribe();
        }
    }
}
