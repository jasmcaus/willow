import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SettingsDialogComponent } from 'src/app/services/interface/settings-dialog/settings-dialog.component';
import { SettingsService } from 'src/app/services/interface/settings/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  constructor(public service: SettingsService,
    private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  openSettings()
  {
    let dialogRef = this.dialog.open(SettingsDialogComponent, {panelClass: "custom-token-select-modalbox-no-height", data: this.service.settings});

    dialogRef.afterClosed().subscribe(result =>
      {
        if(this.service.getDeadline() <= 0)
        {
          this.service.setDeadline(5);
        }

        if(this.service.getSlippageForCalculation() <= 0)
        {
          this.service.setSlippageForCalculation(0.5);
        }
      })
  }
}
