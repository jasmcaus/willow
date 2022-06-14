import { Pipe, PipeTransform } from '@angular/core';
        
@Pipe({
    name: 'amountConverter'
})
export class AmountConverterPipe implements PipeTransform {
    transform(value: number | string): string {
        // return new Intl.NumberFormat('en-US', {
        //     minimumFractionDigits: 2
        // }).format(Number(value));
        return Number(value).toFixed(2).toString()
    }

}