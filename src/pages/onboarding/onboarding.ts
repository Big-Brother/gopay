import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { AppProvider } from '../../providers/app/app';

import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { TourPage } from './tour/tour';

@Component({
  selector: 'page-onboarding',
  templateUrl: 'onboarding.html',
})
export class OnboardingPage {

  public isGopay: boolean;

  constructor(
    public navCtrl: NavController,
    private logger: Logger,
    private app: AppProvider
  ) {
    this.isGopay = this.app.info.nameCase == 'Gopay' ? true : false;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad OnboardingPage');
  }

  public getStarted(): void {
    this.navCtrl.push(TourPage);
  }

  public restoreFromBackup(): void {
    this.navCtrl.push(ImportWalletPage, { fromOnboarding: true });
  }

}
