import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';

// Providers
import { SquarePayAccountProvider } from '../../../../providers/squarepay-account/squarepay-account';
import { SquarePayCardProvider } from '../../../../providers/squarepay-card/squarepay-card';
import { ConfigProvider } from '../../../../providers/config/config';
import { HomeIntegrationsProvider } from '../../../../providers/home-integrations/home-integrations';
import { PopupProvider } from '../../../../providers/popup/popup';


@Component({
  selector: 'page-squarepay-settings',
  templateUrl: 'squarepay-settings.html',
})
export class SquarePaySettingsPage {

  private serviceName: string = 'debitcard';
  public showAtHome: any;
  public service: any;
  public squarepayCard: any;

  constructor(
    private navParams: NavParams,
    private navCtrl: NavController,
    private squarepayAccountProvider: SquarePayAccountProvider,
    private bitPayCardProvider: SquarePayCardProvider,
    private popupProvider: PopupProvider,
    private configProvider: ConfigProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    this.service = _.filter(this.homeIntegrationsProvider.get(), { name: this.serviceName });
    this.showAtHome = !!this.service[0].show;
  }

  ionViewWillEnter() {
    let cardId = this.navParams.data.id;
    if (cardId) {
      this.bitPayCardProvider.getCards((cards) => {
        this.squarepayCard = _.find(cards, { id: cardId });
      });
    }
    else {
      this.service = _.filter(this.homeIntegrationsProvider.get(), { name: this.serviceName });
      this.showAtHome = !!this.service[0].show;
    }
  }

  public integrationChange(): void {
    let opts = {
      showIntegration: { [this.serviceName]: this.showAtHome }
    };
    this.homeIntegrationsProvider.updateConfig(this.serviceName, this.showAtHome);
    this.configProvider.set(opts);
  }

  public unlinkCard(card: any) {
    let title = 'Unlink SquarePay Card?';
    let msg = 'Are you sure you would like to remove your SquarePay Card (' + card.lastFourDigits + ') from this device?';
    this.popupProvider.ionicConfirm(title, msg).then((res) => {
      if (res) {
        this.bitPayCardProvider.remove(card.id, (err) => {
          if (err) {
            this.popupProvider.ionicAlert('Error', 'Could not remove the card');
            return;
          }
          this.navCtrl.pop();
        });
      }
    });
  }

}
