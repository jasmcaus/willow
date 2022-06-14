import { Injectable, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SettingsService{
    settings = this.fb.group({
        deadline: [5, Validators.required],
        slippage: ["10", Validators.required],
        disableMultihops: [true]
    });

    constructor(private fb: FormBuilder) { 
        let deadline = sessionStorage.getItem("deadline");
        if(parseInt(deadline))
        {
            this.setDeadline(parseInt(sessionStorage.getItem("deadline")));
        }

        let slippage = sessionStorage.getItem("slippage");
        if(parseFloat(slippage))
        {
            this.setSlippageForCalculation(parseFloat(slippage));
        }

        let disableMultihops = sessionStorage.getItem("disableMultihops");
        if(disableMultihops && disableMultihops !== "")
        {
            this.settings.get('disableMultihops').setValue(disableMultihops === 'true');
        }
    }
    
    getMultihopsDisabledObservable(): Observable<any> {
        return this.settings.get('disableMultihops').valueChanges
    }

    isMultihopsDisable(): boolean {
        return this.settings.get('disableMultihops').value;
    }

    getSlippageForCalculation() : number {
        return (parseFloat(this.settings.get('slippage').value)/100) || 0;
    }

    getDeadline(): any {
        return (parseFloat(this.settings.get('deadline').value)) || 0
    }

    setSlippageForCalculation(value: number) {
        this.settings.get('slippage').setValue(value);
        sessionStorage.setItem('slippage', value.toString());
    }

    setDeadline(value: number) {
        this.settings.get('deadline').setValue(value);
        sessionStorage.setItem('deadline', value.toString());
    }
}
