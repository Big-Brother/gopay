import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, NavController, NavParams } from 'ionic-angular';

import * as _ from 'lodash';

// providers
import { SquarePayAccountProvider } from '../../../../providers/squarepay-account/squarepay-account';
import { SquarePayCardProvider } from '../../../../providers/squarepay-card/squarepay-card';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { PopupProvider } from '../../../../providers/popup/popup';

// pages
import { SquarePayCardPage } from '../squarepay-card';

@Component({
  selector: 'page-squarepay-card-intro',
  templateUrl: 'squarepay-card-intro.html',
})
export class SquarePayCardIntroPage {

  public accounts: any;

  constructor(
    private translate: TranslateService,
    private actionSheetCtrl: ActionSheetController,
    private navParams: NavParams,
    private bitPayAccountProvider: SquarePayAccountProvider,
    private popupProvider: PopupProvider,
    private bitPayCardProvider: SquarePayCardProvider,
    private navCtrl: NavController,
    private externalLinkProvider: ExternalLinkProvider
  ) {
  }

  ionViewWillEnter() {
    if (this.navParams.data.secret) {
      let pairData = {
        secret: this.navParams.data.secret,
        email: this.navParams.data.email,
        otp: this.navParams.data.otp
      };
      let pairingReason = this.translate.instant('add your SquarePay Visa card(s)');
      this.bitPayAccountProvider.pair(pairData, pairingReason, (err: string, paired: boolean, apiContext: any) => {
        if (err) {
          this.popupProvider.ionicAlert(this.translate.instant('Error pairing SquarePay Account'), err);
          return;
        }
        if (paired) {
          this.bitPayCardProvider.sync(apiContext, (err, cards) => {
            if (err) {
              this.popupProvider.ionicAlert(this.translate.instant('Error updating Debit Cards'), err);
              return;
            }
            this.navCtrl.popToRoot({ animate: false }).then(() => {
              this.navCtrl.parent.select(0);
              
              // Fixes mobile navigation
              setTimeout(() => {
                if (cards[0]) this.navCtrl.push(SquarePayCardPage, { id: cards[0].id }, { animate: false });
              }, 200);
            });
          });
        }
      });
    }

    this.bitPayAccountProvider.getAccounts((err, accounts) => {
      if (err) {
        this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
        return;
      }
      this.accounts = accounts;
    });
  }


  public bitPayCardInfo() {
    let url = 'https://squarepay.com/visa/faq';
    this.externalLinkProvider.open(url);
  }

  public orderSquarePayCard() {
    let url = 'https://squarepay.com/visa/get-started';
    this.externalLinkProvider.open(url);
  }

  public connectSquarePayCard() {
    if (this.accounts.length == 0) {
      this.startPairSquarePayAccount();
    } else {
      this.showAccountSelector();
    }
  }

  private startPairSquarePayAccount() {
    let url = 'https://squarepay.com/visa/dashboard/add-to-squarepay-wallet-confirm';
    this.externalLinkProvider.open(url);
  }

  private showAccountSelector() {
    let options:any[] = [];

    _.forEach(this.accounts, (account: any) => {
      options.push(
        {
          text: (account.givenName || account.familyName) + ' (' + account.email + ')',
          handler: () => {
            this.onAccountSelect(account);
          }
        }
      );
    });

    // Cancel
    options.push(
      {
        text: this.translate.instant('Cancel'),
        role: 'cancel',
        handler: () => {
          this.navCtrl.pop();
        }
      }
    );

    let actionSheet = this.actionSheetCtrl.create({
      title: this.translate.instant('From SquarePay account'),
      buttons: options
    });
    actionSheet.present();
  }

  private onAccountSelect(account): void {
    if (account == undefined) {
      this.startPairSquarePayAccount();
    } else {
      this.bitPayCardProvider.sync(account.apiContext, (err, data) => {
        if (err) {
          this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
          return;
        }
        this.navCtrl.pop();
      });
    }
  }

}
