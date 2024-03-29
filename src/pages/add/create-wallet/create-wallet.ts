import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { GopayersPage } from '../gopayers/gopayers';

// Providers
import { ConfigProvider } from '../../../providers/config/config';
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { OnGoingProcessProvider } from "../../../providers/on-going-process/on-going-process";
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import { WalletProvider } from '../../../providers/wallet/wallet';

import * as _ from 'lodash';

@Component({
  selector: 'page-create-wallet',
  templateUrl: 'create-wallet.html'
})
export class CreateWalletPage implements OnInit {

  /* For compressed keys, m*73 + n*34 <= 496 */
  private COPAYER_PAIR_LIMITS: any = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 4,
    6: 4,
    7: 3,
    8: 3,
    9: 2,
    10: 2,
    11: 1,
    12: 1,
  };

  private createForm: FormGroup;
  private defaults: any;
  private tc: number;
  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;

  public gopayers: number[];
  public signatures: number[];
  public showAdvOpts: boolean;
  public seedOptions: any;
  public isShared: boolean;
  public title: string;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private fb: FormBuilder,
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private logger: Logger,
    private walletProvider: WalletProvider,
    private translate: TranslateService,
    private events: Events,
    private pushNotificationsProvider: PushNotificationsProvider
  ) {

    this.isShared = this.navParams.get('isShared');
    this.title = this.isShared ? this.translate.instant('Create shared wallet') : this.translate.instant('Create personal wallet');
    this.defaults = this.configProvider.getDefaults();
    this.tc = this.isShared ? this.defaults.wallet.totalGopayers : 1;

    this.gopayers = _.range(2, this.defaults.limits.totalGopayers + 1);
    this.derivationPathByDefault = this.derivationPathHelperProvider.default;
    this.derivationPathForTestnet = this.derivationPathHelperProvider.defaultTestnet;
    this.showAdvOpts = false;

    this.createForm = this.fb.group({
      walletName: [null, Validators.required],
      myName: [null],
      totalGopayers: [1],
      requiredGopayers: [1],
      bwsURL: [this.defaults.bws.url],
      selectedSeed: ['new'],
      recoveryPhrase: [null],
      derivationPath: [this.derivationPathByDefault],
      testnetEnabled: [false],
      singleAddress: [false],
      coin: [null, Validators.required]
    });

    this.setTotalGopayers(this.tc);
    this.updateRCSelect(this.tc);
  }

  ngOnInit() {
    if (this.isShared) {
      this.createForm.get('myName').setValidators([Validators.required]);
    }
  }

  public setTotalGopayers(n: number): void {
    this.createForm.controls['totalGopayers'].setValue(n);
    this.updateRCSelect(n);
    this.updateSeedSourceSelect();
  };

  private updateRCSelect(n: number): void {
    this.createForm.controls['totalGopayers'].setValue(n);
    var maxReq = this.COPAYER_PAIR_LIMITS[n];
    this.signatures = _.range(1, maxReq + 1);
    this.createForm.controls['requiredGopayers'].setValue(Math.min(Math.trunc(n / 2 + 1), maxReq));

  };

  private updateSeedSourceSelect(): void {
    this.seedOptions = [{
      id: 'new',
      label: this.translate.instant('Random'),
      supportsTestnet: true
    }, {
      id: 'set',
      label: this.translate.instant('Specify Recovery Phrase'),
      supportsTestnet: false
    }];
    this.createForm.controls['selectedSeed'].setValue(this.seedOptions[0].id); // new or set
  };

  public seedOptionsChange(seed: any): void {
    if (seed === 'set') {
      this.createForm.get('recoveryPhrase').setValidators([Validators.required]);
    } else {
      this.createForm.get('recoveryPhrase').setValidators(null);
    }
    this.createForm.controls['selectedSeed'].setValue(seed); // new or set
    if (this.createForm.controls['testnet']) this.createForm.controls['testnet'].setValue(false);
    this.createForm.controls['derivationPath'].setValue(this.derivationPathByDefault);
    this.createForm.controls['recoveryPhrase'].setValue(null);
  }

  public setDerivationPath(): void {
    let path: string = this.createForm.value.testnet ? this.derivationPathForTestnet : this.derivationPathByDefault;
    this.createForm.controls['derivationPath'].setValue(path);
  }

  public setOptsAndCreate(): void {

    let opts: any = {
      name: this.createForm.value.walletName,
      m: this.createForm.value.requiredGopayers,
      n: this.createForm.value.totalGopayers,
      myName: this.createForm.value.totalGopayers > 1 ? this.createForm.value.myName : null,
      networkName: this.createForm.value.testnetEnabled ? 'testnet' : 'livenet',
      bwsurl: this.createForm.value.bwsURL,
      singleAddress: this.createForm.value.singleAddress,
      coin: this.createForm.value.coin
    };

    let setSeed = this.createForm.value.selectedSeed == 'set';
    if (setSeed) {

      let words = this.createForm.value.recoveryPhrase || '';
      if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
        opts.extendedPrivateKey = words;
      } else {
        opts.mnemonic = words;
      }

      let pathData = this.derivationPathHelperProvider.parse(this.createForm.value.derivationPath);
      if (!pathData) {
        let title = this.translate.instant('Error');
        let subtitle = this.translate.instant('Invalid derivation path');
        this.popupProvider.ionicAlert(title, subtitle);
        return;
      }

      opts.networkName = pathData.networkName;
      opts.derivationStrategy = pathData.derivationStrategy;

    }

    if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
      let title = this.translate.instant('Error');
      let subtitle = this.translate.instant('Please enter the wallet recovery phrase');
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    }

    this.create(opts);
  }

  private create(opts: any): void {
    this.onGoingProcessProvider.set('creatingWallet');

    this.profileProvider.createWallet(opts).then((wallet: any) => {
      this.onGoingProcessProvider.clear();
      this.events.publish('status:updated');
      this.walletProvider.updateRemotePreferences(wallet);
      this.pushNotificationsProvider.updateSubscription(wallet);
      this.profileProvider.setWalletOrder(wallet.credentials.walletId, null, wallet.coin);

      if (this.createForm.value.selectedSeed == 'set') {
        this.profileProvider.setBackupFlag(wallet.credentials.walletId);
      }

      if (!wallet.isComplete()) {
        this.navCtrl.popToRoot();
        this.navCtrl.push(GopayersPage, { walletId: wallet.credentials.walletId });
      } else {
        this.navCtrl.popToRoot();
      }
    }).catch((err: any) => {
      this.onGoingProcessProvider.clear();
      this.logger.error('Create: could not create wallet', err);
      let title = this.translate.instant('Error');
      this.popupProvider.ionicAlert(title, err);
      return;
    });
  }

}
