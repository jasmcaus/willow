import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { TokenService } from "src/app/services/interface/token/token.service";
import { TokenSelectDialogComponent } from "src/app/dialog/token-select-dialog/token-select-dialog.component";
import { WalletProviderService } from "src/app/wallet/wallet-provider/wallet-provider.service";
import { ContractService } from "src/app/services";
import { PairInterface } from "src/app/services";


@Component({
    selector: "app-create",
    templateUrl: "./create.component.html",
    styleUrls: ["./create.component.scss"]
})
export class CreateComponent implements OnInit {
    availablePools: PairInterface[] = [];

    error: boolean = false;
    poolMessage: string = "";

    showTokenPair: boolean = false;
    disable_button: boolean = false

    token = this.fb.group({
        tokenAId: [0],
        tokenASymbol: ["WLT"],
        tokenALogo: ["assets/tokens/Willow.svg"],


        tokenBId: [],
        tokenBSymbol: [""],
        tokenBLogo: []
    });

    tokenALoading: boolean = false;
    tokenAFault: boolean = false;

    constructor(
        private fb: FormBuilder,
        private walletProvider: WalletProviderService,
        private contractService: ContractService,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private service: TokenService
    ) { }


    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            if(params.get("tokenAId") === null)
                return

            this.token.get("tokenAId").setValue(params.get("tokenAId"));
            this.token.get("tokenASymbol").setValue("Loading");
            this.tokenALoading = true;
        })


        if(this.contractService.is_initialized()) {
            this.contractService
                .get_all_pairs()
                .then((value: { data: PairInterface[]}) => { 
                    this.availablePools = value.data
                    console.log("AVAILABLE POOLS:", value.data)
                })
        }
    }


    openTokenSelectDialog(token: string) {
        let dialogRef = this.dialog.open(
            TokenSelectDialogComponent, 
            {panelClass: "custom-token-select-modalbox"}
        )

        dialogRef.componentInstance.tokenEmitter.subscribe(val =>  {
            console.debug("GETTING TOKEN:", token)
            if(val) {
                if(token === "tokenA") {
                    this.token.get("tokenAId").setValue(val.id);
                    this.token.get("tokenASymbol").setValue(val.symbol);
                    this.token.get("tokenALogo").setValue(val.logo_uri);
                } else {
                    this.token.get("tokenBId").setValue(val.id);
                    this.token.get("tokenBSymbol").setValue(val.symbol);
                    this.token.get("tokenBLogo").setValue(val.logo_uri);
                }
                
                dialogRef.close()
                this.checkIfExchangeExists()
            }
        })
    }


    private checkIfExchangeExists() {
        this.disable_button = false

        var tokenA_id = this.token.get("tokenAId").value;
        var tokenB_id = this.token.get("tokenBId").value;
        this.error = false;
        this.poolMessage = "";

        if(tokenA_id == tokenB_id) {
            this.error = true
            this.poolMessage = "Cannot deploy a pool consisting of the same pair"
        }

        var exchangeFound = this.availablePools
            .find(lp => 
                (lp.tokenA_id === tokenA_id && lp.tokenB_id === tokenB_id) ||
                (lp.tokenA_id === tokenB_id && lp.tokenB_id === tokenA_id)
            )

        if(exchangeFound) {
            this.error = true
            this.disable_button = true
            this.poolMessage = "Liquidity pool already exists!";
        }
    }


    deployPoolPair() {
        if(this.error) {
            return
        }

        const tokenA_id = this.token.get("tokenAId").value
        const tokenB_id = this.token.get("tokenBId").value
        
        const result = this.contractService.create_pair(tokenA_id, tokenB_id)
        if(result === undefined) {
            alert("Something went wrong when creating a pair. Try again after a while")
        } else {
            result.then((value: any) => console.log("Result:", value))
        }
    }
}
