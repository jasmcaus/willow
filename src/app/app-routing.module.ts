import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AddLiquidityComponent } from "./pool/add-liquidity/add-liquidity.component";
import { CreateComponent } from "./pool/create/create.component";
import { PoolComponent } from "./pool/pool.component";
import { RemoveLiquidityComponent } from "./pool/remove-liquidity/remove-liquidity.component";
import { ViewPoolComponent } from "./pool/view-pool/view-pool.component";
import { FaucetComponent } from "./faucet/faucet.component";
import { SwapComponent } from "./swap/swap.component";
import { LockLiquidityComponent } from "./pool/lock-liquidity/lock-liquidity.component";

const routes: Routes = [
    { path: "", component: SwapComponent },
    { path: "pool", component: PoolComponent },
    { path: "pool/add-liquidity", component: AddLiquidityComponent },
    { path: "pool/add-liquidity/:tokenA/:tokenB", component: AddLiquidityComponent },
    { path: "pool/remove-liquidity/:pool", component: RemoveLiquidityComponent },
    { path: "pool/create", component: CreateComponent },
    { path: "pool/create/:tokenA", component: CreateComponent },
    { path: "pool/lock", component: LockLiquidityComponent },
    { path: "pool/view/:hash", component: ViewPoolComponent },
    // { path: "utility", component: DeployComponent },
    // { path: "utility/nep17", component: TokenContractComponent },
    // { path: "utility/liquidity-earning", component: LiquidityEarningsComponent },
    { path: "faucet", component: FaucetComponent }
]

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
