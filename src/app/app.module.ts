import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from "@angular/common/http"

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TopNavComponent } from './top-nav/top-nav.component';
import { PoolComponent } from './pool/pool.component';
import { SwapComponent } from './swap/swap.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialsModule } from './materials';
import { MainWindowComponent } from './main-window/main-window.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WalletDialogComponent } from './wallet/wallet-dialog/wallet-dialog.component'; 
import { DebounceClickDirective } from './common/DebounceClickDirective';
import { OverviewComponent } from './pool/overview/overview.component';
import { ActivePoolsComponent } from './pool/active-pools/active-pools.component';
import { AddLiquidityComponent } from './pool/add-liquidity/add-liquidity.component';
import { CreateComponent } from './pool/create/create.component';
import { LockLiquidityComponent } from './pool/lock-liquidity/lock-liquidity.component';
import { RemoveLiquidityComponent } from './pool/remove-liquidity/remove-liquidity.component';
import { SettingsComponent } from './common/settings/settings.component';
import { FaucetComponent } from './faucet/faucet.component';
import { TokenSelectDialogComponent } from './dialog/token-select-dialog/token-select-dialog.component';
import { SettingsDialogComponent } from './services/interface/settings-dialog/settings-dialog.component';
import { NotTrustedDialogComponent } from './dialog/not-trusted-dialog/not-trusted-dialog.component';
import { ViewPoolComponent } from './pool/view-pool/view-pool.component';
import { DoughnutChartComponent } from './chart/doughnut-chart/doughnut-chart.component';
import { ChartsModule } from 'ng2-charts';
import { AmountConverterPipe } from './common/amount-converter-pipe.pipe';

@NgModule({
    declarations: [
        AppComponent,
        TopNavComponent,
        PoolComponent,
        SwapComponent,
        MainWindowComponent,
        WalletDialogComponent,
        DebounceClickDirective,
        OverviewComponent,
        ActivePoolsComponent,
        AddLiquidityComponent,
        CreateComponent,
        LockLiquidityComponent,
        RemoveLiquidityComponent,
        SettingsComponent,
        FaucetComponent,
        TokenSelectDialogComponent,
        SettingsDialogComponent,
        NotTrustedDialogComponent,
        ViewPoolComponent,
        DoughnutChartComponent,
        AmountConverterPipe
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        NgbModule,
        BrowserAnimationsModule,
        MaterialsModule,
        FormsModule,
        ReactiveFormsModule,
        ChartsModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
