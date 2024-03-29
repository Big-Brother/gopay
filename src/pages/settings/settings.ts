import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

import * as _ from 'lodash';

// providers
import { AppProvider } from '../../providers/app/app';
import { SquarePayCardProvider } from '../../providers/squarepay-card/squarepay-card';
import { ConfigProvider } from '../../providers/config/config';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { LanguageProvider } from '../../providers/language/language';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';

// pages
import { FeedbackCompletePage } from '../feedback/feedback-complete/feedback-complete';
import { SendFeedbackPage } from '../feedback/send-feedback/send-feedback';
import { AmazonSettingsPage } from '../integrations/amazon/amazon-settings/amazon-settings';
import { SquarePaySettingsPage } from '../integrations/squarepay-card/squarepay-settings/squarepay-settings';
import { CoinbaseSettingsPage } from '../integrations/coinbase/coinbase-settings/coinbase-settings';
import { GlideraSettingsPage } from '../integrations/glidera/glidera-settings/glidera-settings';
import { MercadoLibreSettingsPage } from '../integrations/mercado-libre/mercado-libre-settings/mercado-libre-settings';
import { ShapeshiftSettingsPage } from '../integrations/shapeshift/shapeshift-settings/shapeshift-settings';
import { AboutPage } from './about/about';
import { AddressbookPage } from './addressbook/addressbook';
import { AdvancedPage } from './advanced/advanced';
import { AltCurrencyPage } from './alt-currency/alt-currency';
import { BitcoinCashPage } from './bitcoin-cash/bitcoin-cash';
import { FeePolicyPage } from './fee-policy/fee-policy';
import { LanguagePage } from './language/language';
import { LockPage } from './lock/lock';
import { NotificationsPage } from './notifications/notifications';
import { WalletSettingsPage } from './wallet-settings/wallet-settings';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  public appName: string;
  public currentLanguageName: string;
  public languages: any[];
  public walletsBtc: any[];
  public walletsBch: any[];
  public config: any;
  public selectedAlternative: any;
  public isCordova: boolean;
  public lockMethod: string;
  public integrationServices: any[] = [];
  public squarepayCardItems: any[] = [];
  public showSquarePayCard: boolean = false;

  constructor(
    private navCtrl: NavController,
    private app: AppProvider,
    private language: LanguageProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private logger: Logger,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private bitPayCardProvider: SquarePayCardProvider,
    private platformProvider: PlatformProvider,
    private translate: TranslateService
  ) {
    this.appName = this.app.info.nameCase;
    this.walletsBch = [];
    this.walletsBtc = [];
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad SettingsPage');
  }

  ionViewWillEnter() {
    this.currentLanguageName = this.language.getName(this.language.getCurrent());
    this.walletsBtc = this.profileProvider.getWallets({
      coin: 'btc'
    });
    this.walletsBch = this.profileProvider.getWallets({
      coin: 'bch'
    });
    this.config = this.configProvider.get();
    this.selectedAlternative = {
      name: this.config.wallet.settings.alternativeName,
      isoCode: this.config.wallet.settings.alternativeIsoCode
    }
    this.lockMethod = (this.config && this.config.lock && this.config.lock.method) ? this.config.lock.method.toLowerCase() : null;
  }

  ionViewDidEnter() {
    // Show integrations
    let integrations = this.homeIntegrationsProvider.get();

    // Hide SquarePay if linked
    setTimeout(() => {
      this.integrationServices = _.remove(_.clone(integrations), (x) => {
        if (x.name == 'debitcard' && x.linked) return;
        else return x;
      });
    }, 200);

    // Only SquarePay Wallet
    this.bitPayCardProvider.get({}, (err, cards) => {
      this.showSquarePayCard = this.app.info._enabledExtensions.debitcard ? true : false;
      this.squarepayCardItems = cards;
    });
  }

  public openBitcoinCashPage(): void {
    this.navCtrl.push(BitcoinCashPage);
  }

  public openAltCurrencyPage(): void {
    this.navCtrl.push(AltCurrencyPage);
  }

  public openLanguagePage(): void {
    this.navCtrl.push(LanguagePage);
  }

  public openAdvancedPage(): void {
    this.navCtrl.push(AdvancedPage);
  }

  public openAboutPage(): void {
    this.navCtrl.push(AboutPage);
  }

  public openLockPage(): void {
    this.navCtrl.push(LockPage);
  }

  public openAddressBookPage(): void {
    this.navCtrl.push(AddressbookPage);
  }

  public openNotificationsPage(): void {
    this.navCtrl.push(NotificationsPage);
  }

  public openFeePolicyPage(): void {
    this.navCtrl.push(FeePolicyPage);
  }

  public openWalletSettingsPage(walletId: string): void {
    this.navCtrl.push(WalletSettingsPage, { walletId });
  }

  public openSendFeedbackPage(): void {
    this.navCtrl.push(SendFeedbackPage);
  }

  public openFeedbackCompletePage(): void {
    this.navCtrl.push(FeedbackCompletePage, { score: 4, skipped: true, fromSettings: true });
  }

  public openSettingIntegration(name: string): void {
    switch (name) {
      case 'coinbase':
        this.navCtrl.push(CoinbaseSettingsPage);
        break;
      case 'glidera':
        this.navCtrl.push(GlideraSettingsPage);
        break;
      case 'debitcard':
        this.navCtrl.push(SquarePaySettingsPage);
        break;
      case 'amazon':
        this.navCtrl.push(AmazonSettingsPage);
        break;
      case 'mercadolibre':
        this.navCtrl.push(MercadoLibreSettingsPage);
        break;
      case 'shapeshift':
        this.navCtrl.push(ShapeshiftSettingsPage);
        break;
    }
  }

  public openCardSettings(id): void {
    this.navCtrl.push(SquarePaySettingsPage, { id });
  }

  public openHelpExternalLink(): void {
    let url = this.appName == 'Gopay' ? 'https://github.com/squarepay/gopay/issues' : 'https://help.squarepay.com/squarepay-app';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('Help and support information is available at the website.');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }
}
