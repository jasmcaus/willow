import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss']
})
export class SettingsDialogComponent implements OnInit {

  settings = this.fb.group({
    slippage: [0.5, Validators.required],
    deadline: [5, Validators.required],
    disableMultihops: [false]
  });

  constructor(private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) data: FormGroup) {
      this.settings = data;
     }

  ngOnInit(): void {
    this.settings
      .get('slippage')
      .valueChanges
      .subscribe(val => sessionStorage.setItem('slippage', val));

    this.settings
      .get('deadline')
      .valueChanges
      .subscribe(val => sessionStorage.setItem('deadline', val));

    this.settings
      .get('disableMultihops')
      .valueChanges
      .subscribe(val => sessionStorage.setItem('disableMultihops', val));
  }

}
