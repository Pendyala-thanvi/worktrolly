import { Component, OnInit, Input } from '@angular/core';
import { ThemeService } from '../../../services/theme/theme.service';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { ErrorHandlerService } from 'src/app/services/error-handler/error-handler.service';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrls: ['./theme.component.css']
})
export class ThemeComponent implements OnInit {
  @Input('appTheme') appTheme: string
  @Input('uid') uid: string
  showloader: boolean = false;
  componentName:string ="THEME";
  enableDarkTheme: boolean
  constructor(public themeService: ThemeService, private functions: AngularFireFunctions, public errorHandlerService: ErrorHandlerService) { }

  ngOnInit(): void {
    if (this.appTheme == 'theme-dark') {
      this.enableDarkTheme = true;
    } else {
      this.enableDarkTheme = false;
    }
  }

  changeThemeSwitch() {
    if (!this.enableDarkTheme) {
      return this.updateTheme('theme-dark')
    }
    else {
      return this.updateTheme('theme-light')
    }

  }

  async updateTheme(appTheme: string) {
    const callable = this.functions.httpsCallable('users/updateTheme');
    this.showloader = true;
    this.themeService.changeTheme(appTheme);

    try {
      const result = await callable({Uid: this.uid, AppTheme: appTheme }).toPromise();
      this.showloader = false;
    } catch (error) {
      this.errorHandlerService.showError = true;
      this.errorHandlerService.getErrorCode(this.componentName, "InternalError","Api");
    }
  }

}
