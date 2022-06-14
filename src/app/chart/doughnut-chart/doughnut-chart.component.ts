import { Component, Input, OnInit } from "@angular/core";

import { ChartType, ChartOptions } from "chart.js";
import { MultiDataSet, Label } from "ng2-charts";

@Component({
    selector: "app-doughnut-chart",
    templateUrl: "./doughnut-chart.component.html",
    styleUrls: ["./doughnut-chart.component.scss"]
})
export class DoughnutChartComponent implements OnInit {
    @Input()
    doughnutChartData: MultiDataSet;
        
    chartOptions: ChartOptions = {
        responsive: true,
        legend: {
            display: false
        }
    }

    donutColors = [{
        // Green / Red
        backgroundColor: ["rgba(39, 174, 96, 1)", "rgba(240, 27, 54, 1)"],
        borderColor: ["rgba(148,159,177, 0)", "rgba(148,159,177, 0)"]
    }]

    doughnutChartLabels: Label[] = ["Locked Supply", "Circulating Supply"];
    doughnutChartType: ChartType = "doughnut";

    constructor() { }

    ngOnInit(): void { }

}
