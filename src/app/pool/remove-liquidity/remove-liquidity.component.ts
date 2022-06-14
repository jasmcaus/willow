import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from 'src/app/services/interface/settings/settings.service';
import { WalletProviderService } from 'src/app/wallet/wallet-provider/wallet-provider.service';

@Component({
  selector: 'app-remove-liquidity',
  templateUrl: './remove-liquidity.component.html',
  styleUrls: ['./remove-liquidity.component.scss']
})
export class RemoveLiquidityComponent implements OnInit {

  loading: boolean = false;
  txId: string = '';

  tokenALoaded: boolean = false;
  tokenBLoaded: boolean = false;

  pool = this.fb.group({
    percentToTakeOut: ['0.25'],

    tokenASymbol: [],
    tokenAAmount: [],
    tokenAAmountDisplay: [],
    tokenAMinAmount: [],
    tokenAMinAmountDisplay: [],
    tokenADecimals: [0],
    tokenAReserve: [0],
    tokenAScriptHash: [0],

    tokenBSymbol: [],
    tokenBAmount: [],
    tokenBAmountDisplay: [],
    tokenBMinAmount: [],
    tokenBMinAmountDisplay: [],
    tokenBDecimals: [0],
    tokenBReserve: [0],
    tokenBScriptHash: [0],

    
    liquidityPoolContractAddress: [''],
    poolName: [''],
    poolAmountDisplay: [''],
    poolAmount: [''],
    poolDecimals: [''],
    poolTotalSupply: [''],
    poolAmountToWithdraw: ['']
  });

  constructor(private walletProvider: WalletProviderService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private settings: SettingsService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.pool.get('liquidityPoolContractAddress').setValue(params.get('pool'));
    });

    this.walletProvider.walletInitialized.subscribe(initialised => 
      {
        if(initialised)
        {
          this.initialise();
        }
      });

    this.pool.get("percentToTakeOut").valueChanges.subscribe(() => 
      {
        this.updateTokenAAmount();
        this.updateTokenBAmount();
      });
  }

  private initialise()
  {
    this.walletProvider
      .Wallet()
      .getLiquidity()
      .then(result => 
        {
          result.forEach(pool => 
            {
              if(pool.contract === this.getPoolValue("liquidityPoolContractAddress"))
              {
                this.setPoolValue('poolName', pool.tokenA + " / " + pool.tokenB);
                this.setPoolValue('poolAmount', pool.amount);
                this.setPoolValue('poolAmountDisplay', pool.amount);
              }
            })
        })
        .then(async () => 
        {
          await this.walletProvider
            .Wallet()
            .getTotalSupply(this.getPoolValue("liquidityPoolContractAddress"))
            .then(supply => this.setPoolValue('poolTotalSupply', supply));
        })
        .then(async () => 
        {
          await this.walletProvider
            .Wallet()
            .getDecimals(this.getPoolValue("liquidityPoolContractAddress"))
            .then(poolDecimals =>
              {
                this.setPoolValue("poolDecimals", poolDecimals);
                this.setPoolValue("poolAmount", this.addZeros(this.getPoolValue("poolAmount"), poolDecimals))
                this.setPoolValue("poolTotalSupply", this.addZeros(this.getPoolValue("poolTotalSupply"), poolDecimals));
              })   
        })
        .then(async () => 
        {
          await this.walletProvider
          .Wallet()
          .getReserves(this.getPoolValue("liquidityPoolContractAddress"))
          .then(async reserve => 
            {
              this.setPoolValue("tokenAReserve", reserve[0].reserve);
              this.setPoolValue("tokenBReserve", reserve[1].reserve);
              this.setPoolValue("tokenAScriptHash", reserve[0].scriptHash);
              this.setPoolValue("tokenBScriptHash", reserve[1].scriptHash);
              
              await this.walletProvider.Wallet().getSymbolAndDecimals(reserve[0].scriptHash)
              .then(e => 
                {
                  this.setPoolValue("tokenASymbol", e.symbol);
                  this.setPoolValue("tokenADecimals", e.decimals);
                  this.updateTokenAAmount();
                });

              await this.walletProvider.Wallet().getSymbolAndDecimals(reserve[1].scriptHash)
              .then(e => 
                {
                  this.setPoolValue("tokenBSymbol", e.symbol);
                  this.setPoolValue("tokenBDecimals", e.decimals);
                  this.updateTokenBAmount();
                });
            });
        });;
  }

  removeLiquidity()
  {
    this.walletProvider
      .Wallet()
      .removeLiquidity(
        this.getPoolValue("liquidityPoolContractAddress"),
        this.getPoolValue("tokenAScriptHash"),
        this.getPoolValue("tokenBScriptHash"),
        this.getPoolValue("poolAmountToWithdraw"),
        this.getPoolValue("tokenAMinAmount"),
        this.getPoolValue("tokenBMinAmount"))
        .then(e => this.txId = e)
        .finally(() => this.loading = false);
  }

  private addZeros(num: string, decimals: number)
  {
    var final = "1";
    for (let index = 0; index < decimals; index++) {
      final = final + "0";
    }
    return parseFloat(num) * parseFloat(final);
  }

  private updateTokenAAmount()
  {
    var poolAmount = parseFloat(this.getPoolValue("poolAmount"));
    var tokenAReserve = this.addZeros(this.getPoolValue("tokenAReserve"), this.getPoolValue('tokenADecimals'));
    var totalSupply = parseFloat(this.getPoolValue("poolTotalSupply"));
    var percentToTakeOut = parseFloat(this.getPoolValue("percentToTakeOut"));

    var amount = (poolAmount * percentToTakeOut) * tokenAReserve / totalSupply
    var amountMin = ((poolAmount * percentToTakeOut) * tokenAReserve) * (1 - this.settings.getSlippageForCalculation()) / totalSupply

    this.setPoolValue("tokenAAmount", amount);
    this.setPoolValue("tokenAMinAmount", amountMin);
    this.setPoolValue("tokenAAmountDisplay", (amount/ (this.addZeros("1",this.getPoolValue("poolDecimals")))).toFixed(4));
    this.setPoolValue("tokenAMinAmountDisplay", (amountMin/ (this.addZeros("1",this.getPoolValue("poolDecimals")))).toFixed(4));
    this.setPoolValue("poolAmountToWithdraw", poolAmount * percentToTakeOut);
    this.tokenALoaded = true;
  }

  private updateTokenBAmount()
  {
    var poolAmount = parseFloat(this.getPoolValue("poolAmount"));
    var tokenBReserve = this.addZeros(this.getPoolValue("tokenBReserve"), this.getPoolValue('tokenBDecimals'));
    var totalSupply = parseFloat(this.getPoolValue("poolTotalSupply"));
    var percentToTakeOut = parseFloat(this.getPoolValue("percentToTakeOut"));

    var amount = (poolAmount * percentToTakeOut) * tokenBReserve / totalSupply
    var amountMin = ((poolAmount * percentToTakeOut) * tokenBReserve) * (1 - this.settings.getSlippageForCalculation()) / totalSupply

    this.setPoolValue("tokenBAmount", amount);
    this.setPoolValue("tokenBMinAmount", amountMin);
    this.setPoolValue("tokenBAmountDisplay", (amount/ (this.addZeros("1",this.getPoolValue("poolDecimals")))).toFixed(4));
    this.setPoolValue("tokenBMinAmountDisplay", (amountMin/ (this.addZeros("1",this.getPoolValue("poolDecimals")))).toFixed(4));
    this.tokenBLoaded = true;
  }

  private setPoolValue(field: string, value: any)
  {
    this.pool.get(field).setValue(value);
  }

  private getPoolValue(field: string) : any
  {
    return this.pool.get(field).value;
  }
}
