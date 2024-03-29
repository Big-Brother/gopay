import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ModalController, NavParams, ViewController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../providers/config/config';
import { FeeProvider } from '../../providers/fee/fee';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../providers/platform/platform';
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { WalletProvider } from '../../providers/wallet/wallet';

// pages
import { FinishModalPage } from '../finish/finish';

import * as _ from 'lodash';

@Component({
  selector: 'page-txp-details',
  templateUrl: 'txp-details.html'
})
export class TxpDetailsPage {
  public wallet: any;
  public tx: any;
  public gopayers: any;
  public gopayerId: string;
  public isShared: boolean;
  public canSign: boolean;
  public color: string;
  public buttonText: string;
  public successText: string;
  public actionList: any[];
  public paymentExpired: boolean;
  public expires: string;
  public currentSpendUnconfirmed: boolean;
  public loading: boolean;
  public contactName: string;
  public showMultiplesOutputs: boolean;

  private isGlidera: boolean;
  private GLIDERA_LOCK_TIME: number;
  private countDown: any;
  private isCordova: boolean;

  constructor(
    private navParams: NavParams,
    private platformProvider: PlatformProvider,
    private feeProvider: FeeProvider,
    private events: Events,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private bwcError: BwcErrorProvider,
    private walletProvider: WalletProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private viewCtrl: ViewController,
    private configProvider: ConfigProvider,
    private profileProvider: ProfileProvider,
    private txFormatProvider: TxFormatProvider,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private addressBookProvider: AddressBookProvider
  ) {
    this.showMultiplesOutputs = false;
    let config = this.configProvider.get().wallet;
    this.tx = this.navParams.data.tx;
    this.wallet = this.tx.wallet ? this.tx.wallet : this.profileProvider.getWallet(this.tx.walletId);
    this.tx = this.txFormatProvider.processTx(this.wallet.coin, this.tx, this.walletProvider.useLegacyAddress());
    if (!this.tx.toAddress) this.tx.toAddress = this.tx.outputs[0].toAddress;
    this.isGlidera = this.navParams.data.isGlidera;
    this.GLIDERA_LOCK_TIME = 6 * 60 * 60;
    this.currentSpendUnconfirmed = config.spendUnconfirmed;
    this.loading = false;
    this.isCordova = this.platformProvider.isCordova;
    this.gopayers = this.wallet.status.wallet.gopayers;
    this.gopayerId = this.wallet.credentials.gopayerId;
    this.isShared = this.wallet.credentials.n > 1;
    this.canSign = this.wallet.canSign() || this.wallet.isPrivKeyExternal();
    this.color = this.wallet.color;
    this.contact();

    // To test multiple outputs...

    // var txp = {
    //   message: 'test multi-output',
    //   fee: 1000,
    //   createdOn: Math.floor(Date.now() / 1000),
    //   outputs: [],
    // };
    // for (let i = 0; i < 15; i++) {

    //   txp.outputs.push({
    //     amountStr: "600 BTC",
    //     toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
    //     message: 'output #' + (Number(i) + 1)
    //   });
    // };
    // this.tx = _.merge(this.tx, txp);
    // this.tx.hasMultiplesOutputs = true;

  }

  ionViewWillEnter() {
    this.displayFeeValues();
    this.initActionList();
    this.checkPaypro();
    this.applyButtonText();

    // ToDo: use tx.customData instead of tx.message
    if (this.tx.message === 'Glidera transaction' && this.isGlidera) {
      this.tx.isGlidera = true;
      if (this.tx.canBeRemoved) {
        this.tx.canBeRemoved = (Date.now() / 1000 - (this.tx.ts || this.tx.createdOn)) > this.GLIDERA_LOCK_TIME;
      }
    }

    this.events.subscribe('bwsEvent', (walletId: string, type: string, n: number) => {
      _.each([
        'TxProposalRejectedBy',
        'TxProposalAcceptedBy',
        'transactionProposalRemoved',
        'TxProposalRemoved',
        'NewOutgoingTx',
        'UpdateTx'
      ], (eventName: string) => {
        if (walletId == this.wallet.id && type == eventName) {
          this.updateTxInfo(eventName);
        }
      });
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
  }

  private displayFeeValues(): void {
    this.tx.feeFiatStr = this.txFormatProvider.formatAlternativeStr(this.wallet.coin, this.tx.fee);
    this.tx.feeRateStr = (this.tx.fee / (this.tx.amount + this.tx.fee) * 100).toFixed(2) + '%';
    this.tx.feeLevelStr = this.feeProvider.feeOpts[this.tx.feeLevel];
  }

  private applyButtonText(): void {
    var lastSigner = _.filter(this.tx.actions, {
      type: 'accept'
    }).length == this.tx.requiredSignatures - 1;

    if (lastSigner) {
      this.buttonText = this.isCordova ? this.translate.instant('Slide to send') : this.translate.instant('Click to send');
      this.successText = this.translate.instant('Payment Sent');
    } else {
      this.buttonText = this.isCordova ? this.translate.instant('Slide to accept') : this.translate.instant('Click to accept');
      this.successText = this.translate.instant('Payment Accepted');
    }
  }

  private initActionList(): void {
    this.actionList = [];

    if (!this.isShared) return;

    var actionDescriptions = {
      created: this.translate.instant('Proposal Created'),
      accept: this.translate.instant('Accepted'),
      reject: this.translate.instant('Rejected'),
      broadcasted: this.translate.instant('Broadcasted'),
    };

    this.actionList.push({
      type: 'created',
      time: this.tx.createdOn,
      description: actionDescriptions['created'],
      by: this.tx.creatorName
    });

    _.each(this.tx.actions, (action: any) => {
      this.actionList.push({
        type: action.type,
        time: action.createdOn,
        description: actionDescriptions[action.type],
        by: action.gopayerName
      });
    });

    setTimeout(() => {
      this.actionList.reverse();
    }, 10);
  }

  private checkPaypro() {
    if (this.tx.payProUrl) {
      this.wallet.fetchPayPro({
        payProUrl: this.tx.payProUrl,
      }, (err, paypro) => {
        if (err) {
          this.logger.error(err);
          this.paymentExpired = true;
          this.popupProvider.ionicAlert(null, this.translate.instant('Could not fetch the invoice'));
          return;
        }
        this.tx.paypro = paypro;
        this.paymentTimeControl(this.tx.paypro.expires);
      });
    }
  }

  private paymentTimeControl(expirationTime) {

    let setExpirationTime = (): void => {
      let now = Math.floor(Date.now() / 1000);
      if (now > expirationTime) {
        this.paymentExpired = true;
        if (this.countDown) clearInterval(this.countDown);
        return;
      }
      let totalSecs = expirationTime - now;
      let m = Math.floor(totalSecs / 60);
      let s = totalSecs % 60;
      this.expires = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
    };

    this.paymentExpired = false;
    setExpirationTime();

    this.countDown = setInterval(() => {
      setExpirationTime();
    }, 1000);
  }

  private setError(err: any, prefix: string): void {
    this.loading = false;
    this.popupProvider.ionicAlert(this.translate.instant('Error'), this.bwcError.msg(err, prefix));
  }

  public sign(): void {
    this.loading = true;
    this.walletProvider.publishAndSign(this.wallet, this.tx).then((txp: any) => {
      this.onGoingProcessProvider.clear();
      this.openFinishModal();
    }).catch((err: any) => {
      this.onGoingProcessProvider.clear();
      this.setError(err, ('Could not send payment'));
    });
  }

  public reject(txp: any): void {
    let title = this.translate.instant('Warning!');
    let msg = this.translate.instant('Are you sure you want to reject this transaction?');
    this.popupProvider.ionicConfirm(title, msg, null, null).then((res: boolean) => {
      if (!res) return
      this.loading = true;
      this.onGoingProcessProvider.set('rejectTx');
      this.walletProvider.reject(this.wallet, this.tx).then((txpr) => {
        this.onGoingProcessProvider.clear();
        this.close();
      }).catch((err: any) => {
        this.onGoingProcessProvider.clear();
        this.setError(err, this.translate.instant('Could not reject payment'));
      });
    });
  }

  public remove(): void {
    let title = this.translate.instant('Warning!');
    let msg = this.translate.instant('Are you sure you want to remove this transaction?');
    this.popupProvider.ionicConfirm(title, msg, null, null).then((res: boolean) => {
      if (!res) return;
      this.onGoingProcessProvider.set('removeTx');
      this.walletProvider.removeTx(this.wallet, this.tx).then(() => {
        this.onGoingProcessProvider.clear();
        this.close();
      }).catch((err: any) => {
        this.onGoingProcessProvider.clear();
        if (err && !(err.message && err.message.match(/Unexpected/))) {
          this.setError(err, this.translate.instant('Could not delete payment proposal'));
        }
      });
    });
  }

  public broadcast(txp: any): void {
    this.loading = true;
    this.onGoingProcessProvider.set('broadcastingTx');
    this.walletProvider.broadcastTx(this.wallet, this.tx).then((txpb: any) => {
      this.onGoingProcessProvider.clear();
      this.openFinishModal();
    }).catch((err: any) => {
      this.onGoingProcessProvider.clear();
      this.setError(err, 'Could not broadcast payment');

      this.logger.error('Could not broadcast: ', this.tx.coin, this.tx.network, this.tx.raw);
    });
  }

  public getShortNetworkName(): string {
    return this.wallet.credentials.networkName.substring(0, 4);
  }

  private updateTxInfo(eventName: string): void {
    this.walletProvider.getTxp(this.wallet, this.tx.id).then((tx: any) => {
      let action = _.find(tx.actions, {
        gopayerId: this.wallet.credentials.gopayerId
      });

      this.tx = this.txFormatProvider.processTx(this.wallet.coin, tx, this.walletProvider.useLegacyAddress());

      if (!action && tx.status == 'pending') this.tx.pendingForUs = true;

      this.updateGopayerList();
      this.initActionList();
    }).catch((err) => {
      if (err.message && err.message == 'Transaction proposal not found' &&
        (eventName == 'transactionProposalRemoved' || eventName == 'TxProposalRemoved')) {
        this.tx.removed = true;
        this.tx.canBeRemoved = false;
        this.tx.pendingForUs = false;
      }
    });
  }

  public updateGopayerList(): void {
    _.map(this.gopayers, (cp: any) => {
      _.each(this.tx.actions, (ac: any) => {
        if (cp.id == ac.gopayerId) {
          cp.action = ac.type;
        }
      });
    });
  }

  public onConfirm(): void {
    this.sign();
  };

  public close(): void {
    this.loading = false;
    this.viewCtrl.dismiss();
  }

  private openFinishModal() {
    let modal = this.modalCtrl.create(FinishModalPage, { finishText: this.successText }, { showBackdrop: true, enableBackdropDismiss: false });
    modal.present();
    modal.onDidDismiss(() => {
      this.close();
    })
  }

  private contact(): void {
    let addr = this.tx.toAddress;
    this.addressBookProvider.get(addr).then((ab: any) => {
      if (ab) {
        let name = _.isObject(ab) ? ab.name : ab;
        this.contactName = name;
      }
    }).catch((err: any) => {
      this.logger.warn(err);
    });
  }

}
