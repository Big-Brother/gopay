import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

import { PlatformProvider } from '../platform/platform';
import { FileStorage } from './storage/file-storage';
import { LocalStorage } from './storage/local-storage';
// TODO import { RamStorage } from './storage/ram-storage';

const Keys = {
  ADDRESS_BOOK: network => 'addressbook-' + network,
  AGREE_DISCLAIMER: 'agreeDisclaimer',
  AMAZON_GIFT_CARDS: network => 'amazonGiftCards-' + network,
  APP_IDENTITY: network => 'appIdentity-' + network,
  BACKUP: walletId => 'backup-' + walletId,
  BALANCE_CACHE: cardId => 'balanceCache-' + cardId,
  BITPAY_ACCOUNTS_V2: network => 'squarepayAccounts-v2-' + network,
  CLEAN_AND_SCAN_ADDRESSES: 'CleanAndScanAddresses',
  COINBASE_REFRESH_TOKEN: network => 'coinbaseRefreshToken-' + network,
  COINBASE_TOKEN: network => 'coinbaseToken-' + network,
  COINBASE_TXS: network => 'coinbaseTxs-' + network,
  CONFIG: 'config',
  FEEDBACK: 'feedback',
  FOCUSED_WALLET_ID: 'focusedWalletId',
  GLIDERA_PERMISSIONS: network => 'glideraPermissions-' + network,
  GLIDERA_STATUS: network => 'glideraStatus-' + network,
  GLIDERA_TOKEN: network => 'glideraToken-' + network,
  GLIDERA_TXS: network => 'glideraTxs-' + network,
  HIDE_BALANCE: walletId => 'hideBalance-' + walletId,
  HOME_TIP: 'homeTip',
  LAST_ADDRESS: walletId => 'lastAddress-' + walletId,
  LAST_CURRENCY_USED: 'lastCurrencyUsed',
  MERCADO_LIBRE: network => 'MercadoLibreGiftCards-' + network,
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  PROFILE: 'profile',
  REMOTE_PREF_STORED: 'remotePrefStored',
  TX_CONFIRM_NOTIF: txid => 'txConfirmNotif-' + txid,
  TX_HISTORY: walletId => 'txsHistory-' + walletId,
};

interface Storage {
  get(k: string): Promise<any>;
  set(k: string, v: any): Promise<void>;
  remove(k: string): Promise<void>;
  create(k: string, v: any): Promise<void>;
}

@Injectable()
export class PersistenceProvider {

  public storage: Storage;

  constructor(
    private logger: Logger,
    private platform: PlatformProvider,
    private file: File) {
    this.logger.info('PersistenceProvider initialized.');
  };

  public load() {
    this.storage = this.platform.isCordova
      ? new FileStorage(this.file, this.logger)
      : new LocalStorage(this.platform, this.logger);
  }

  storeNewProfile(profile): Promise<void> {
    return this.storage.create(Keys.PROFILE, profile);
  };

  storeProfile(profile): Promise<void> {
    return this.storage.set(Keys.PROFILE, profile);
  };

  getProfile(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get(Keys.PROFILE).then((profile) => {
        resolve(profile);
      });
    });
  };

  deleteProfile(): Promise<void> {
    return this.storage.remove(Keys.PROFILE);
  };

  setFeedbackInfo(feedbackValues: any): Promise<void> {
    return this.storage.set(Keys.FEEDBACK, feedbackValues);
  };

  getFeedbackInfo(): Promise<void> {
    return this.storage.get(Keys.FEEDBACK);
  };

  storeFocusedWalletId(walletId: string): Promise<void> {
    return this.storage.set(Keys.FOCUSED_WALLET_ID, walletId || '');
  };

  getFocusedWalletId(): Promise<string> {
    return this.storage.get(Keys.FOCUSED_WALLET_ID);
  };

  getLastAddress(walletId: string): Promise<any> {
    return this.storage.get(Keys.LAST_ADDRESS(walletId));
  };

  storeLastAddress(walletId: string, address: any): Promise<void> {
    return this.storage.set(Keys.LAST_ADDRESS(walletId), address);
  };

  clearLastAddress(walletId: string): Promise<void> {
    return this.storage.remove(Keys.LAST_ADDRESS(walletId));
  };

  setBackupFlag(walletId: string): Promise<void> {
    return this.storage.set(Keys.BACKUP(walletId), Date.now());
  };

  getBackupFlag(walletId: string): Promise<any> {
    return this.storage.get(Keys.BACKUP(walletId));
  };

  clearBackupFlag(walletId: string): Promise<void> {
    return this.storage.remove(Keys.BACKUP(walletId));
  };

  setCleanAndScanAddresses(walletId: string): Promise<void> {
    return this.storage.set(Keys.CLEAN_AND_SCAN_ADDRESSES, walletId);
  };

  getCleanAndScanAddresses(): Promise<any> {
    return this.storage.get(Keys.CLEAN_AND_SCAN_ADDRESSES);
  };

  removeCleanAndScanAddresses(): Promise<void> {
    return this.storage.remove(Keys.CLEAN_AND_SCAN_ADDRESSES);
  };

  getConfig(): Promise<object> {
    return this.storage.get(Keys.CONFIG);
  };

  storeConfig(config: object): Promise<void> {
    return this.storage.set(Keys.CONFIG, config);
  };

  clearConfig(): Promise<void> {
    return this.storage.remove(Keys.CONFIG);
  };

  getHomeTipAccepted(): Promise<any> {
    return this.storage.get(Keys.HOME_TIP);
  };

  setHomeTipAccepted(homeTip: any): Promise<void> {
    return this.storage.set(Keys.HOME_TIP, homeTip);
  };

  setHideBalanceFlag(walletId: string, val: any): Promise<void> {
    return this.storage.set(Keys.HIDE_BALANCE(walletId), val);
  };

  getHideBalanceFlag(walletId: string): Promise<any> {
    return this.storage.get(Keys.HIDE_BALANCE(walletId));
  };

  setDisclaimerAccepted(): Promise<any> {
    return this.storage.set(Keys.AGREE_DISCLAIMER, true);
  }

  setOnboardingCompleted(): Promise<any> {
    return this.storage.set(Keys.ONBOARDING_COMPLETED, true);
  }

  // for compatibility
  getGopayDisclaimerFlag(): Promise<any> {
    return this.storage.get(Keys.AGREE_DISCLAIMER);
  };

  getGopayOnboardingFlag(): Promise<any> {
    return this.storage.get(Keys.ONBOARDING_COMPLETED);
  };

  setRemotePrefsStoredFlag(): Promise<void> {
    return this.storage.set(Keys.REMOTE_PREF_STORED, true);
  };

  getRemotePrefsStoredFlag(): Promise<any> {
    return this.storage.get(Keys.REMOTE_PREF_STORED);
  };

  setGlideraToken(network: string, token: string): Promise<void> {
    return this.storage.set(Keys.GLIDERA_TOKEN(network), token);
  };

  getGlideraToken(network: string): Promise<string> {
    return this.storage.get(Keys.GLIDERA_TOKEN(network));
  };

  removeGlideraToken(network: string): Promise<void> {
    return this.storage.remove(Keys.GLIDERA_TOKEN(network));
  };

  setGlideraPermissions(network: string, permissions: any): Promise<void> {
    return this.storage.set(Keys.GLIDERA_PERMISSIONS(network), permissions);
  };

  getGlideraPermissions(network: string): Promise<any> {
    return this.storage.get(Keys.GLIDERA_PERMISSIONS(network));
  };

  removeGlideraPermissions(network: string): Promise<void> {
    return this.storage.remove(Keys.GLIDERA_PERMISSIONS(network));
  };

  setGlideraStatus(network: string, status: any): Promise<void> {
    return this.storage.set(Keys.GLIDERA_STATUS(network), status);
  };

  getGlideraStatus(network: string): Promise<any> {
    return this.storage.get(Keys.GLIDERA_STATUS(network));
  };

  removeGlideraStatus(network: string): Promise<void> {
    return this.storage.remove(Keys.GLIDERA_STATUS(network));
  };

  setGlideraTxs(network: string, txs: any): Promise<void> {
    return this.storage.set(Keys.GLIDERA_TXS(network), txs);
  };

  getGlideraTxs(network: string): Promise<any> {
    return this.storage.get(Keys.GLIDERA_TXS(network));
  };

  removeGlideraTxs(network: string): Promise<void> {
    return this.storage.remove(Keys.GLIDERA_TXS(network));
  };

  setCoinbaseToken(network: string, token: string): Promise<void> {
    return this.storage.set(Keys.COINBASE_TOKEN(network), token);
  };

  getCoinbaseToken(network: string): Promise<string> {
    return this.storage.get(Keys.COINBASE_TOKEN(network));
  };

  removeCoinbaseToken(network: string): Promise<void> {
    return this.storage.remove(Keys.COINBASE_TOKEN(network));
  };

  setCoinbaseRefreshToken(network: string, token: string): Promise<void> {
    return this.storage.set(Keys.COINBASE_REFRESH_TOKEN(network), token);
  };

  getCoinbaseRefreshToken(network: string): Promise<string> {
    return this.storage.get(Keys.COINBASE_REFRESH_TOKEN(network));
  };

  removeCoinbaseRefreshToken(network: string): Promise<void> {
    return this.storage.remove(Keys.COINBASE_REFRESH_TOKEN(network));
  };

  setCoinbaseTxs(network: string, ctx: any): Promise<void> {
    return this.storage.set(Keys.COINBASE_TXS(network), ctx);
  };

  getCoinbaseTxs(network: string): Promise<any> {
    return this.storage.get(Keys.COINBASE_TXS(network));
  };

  removeCoinbaseTxs(network: string): Promise<void> {
    return this.storage.remove(Keys.COINBASE_TXS(network));
  };

  setAddressbook(network: string, addressbook: any): Promise<void> {
    return this.storage.set(Keys.ADDRESS_BOOK(network), addressbook);
  };

  getAddressbook(network: string): Promise<any> {
    return this.storage.get(Keys.ADDRESS_BOOK(network));
  };

  removeAddressbook(network: string): Promise<void> {
    return this.storage.remove(Keys.ADDRESS_BOOK(network));
  };

  setLastCurrencyUsed(lastCurrencyUsed: any): Promise<void> {
    return this.storage.set(Keys.LAST_CURRENCY_USED, lastCurrencyUsed);
  };

  getLastCurrencyUsed(): Promise<any> {
    return this.storage.get(Keys.LAST_CURRENCY_USED);
  };

  checkQuota(): void {
    let block = '';
    // 50MB
    for (let i = 0; i < 1024 * 1024; ++i) {
      block += '12345678901234567890123456789012345678901234567890';
    }
    this.storage.set('test', block).catch(err => {
      this.logger.error('CheckQuota Return:' + err);
    });
  };

  setTxHistory(walletId: string, txs: any): Promise<void> {
    return this.storage.set(Keys.TX_HISTORY(walletId), txs).catch(err => {
      this.logger.error('Error saving tx History. Size:' + txs.length);
      this.logger.error(err);
    });
  }

  getTxHistory(walletId: string): Promise<any> {
    return this.storage.get(Keys.TX_HISTORY(walletId));
  }

  removeTxHistory(walletId: string): Promise<void> {
    return this.storage.remove(Keys.TX_HISTORY(walletId));
  }

  setBalanceCache(cardId: string, data: any): Promise<void> {
    return this.storage.set(Keys.BALANCE_CACHE(cardId), data);
  };

  getBalanceCache(cardId: string): Promise<any> {
    return this.storage.get(Keys.BALANCE_CACHE(cardId));
  };

  removeBalanceCache(cardId: string): Promise<void> {
    return this.storage.remove(Keys.BALANCE_CACHE(cardId));
  };

  setAppIdentity(network: string, data: any): Promise<void> {
    return this.storage.set(Keys.APP_IDENTITY(network), data);
  };

  getAppIdentity(network: string): Promise<any> {
    return this.storage.get(Keys.APP_IDENTITY(network));
  };

  removeAppIdentity(network: string): Promise<void> {
    return this.storage.remove(Keys.APP_IDENTITY(network));
  };

  removeAllWalletData(walletId: string): Promise<void> {
    return this.clearLastAddress(walletId)
      .then(() => this.removeTxHistory(walletId))
      .then(() => this.clearBackupFlag(walletId));
  };

  setAmazonGiftCards(network: string, gcs: any): Promise<void> {
    return this.storage.set(Keys.AMAZON_GIFT_CARDS(network), gcs);
  };

  getAmazonGiftCards(network: string): Promise<any> {
    return this.storage.get(Keys.AMAZON_GIFT_CARDS(network));
  };

  removeAmazonGiftCards(network: string): Promise<void> {
    return this.storage.remove(Keys.AMAZON_GIFT_CARDS(network));
  };

  setTxConfirmNotification(txid: string, val: any): Promise<void> {
    return this.storage.set(Keys.TX_CONFIRM_NOTIF(txid), val);
  };

  getTxConfirmNotification(txid: string): Promise<any> {
    return this.storage.get(Keys.TX_CONFIRM_NOTIF(txid));
  };

  removeTxConfirmNotification(txid: string): Promise<void> {
    return this.storage.remove(Keys.TX_CONFIRM_NOTIF(txid));
  };


  // cb(err, accounts)
  // accounts: {
  //   email_1: {
  //     token: account token
  //     cards: {
  //       <card-data>
  //     }
  //   }
  //   ...
  //   email_n: {
  //    token: account token
  //    cards: {
  //       <card-data>
  //     }
  //   }
  // }
  //
  getSquarepayAccounts(network: string): Promise<any> {
    return this.storage.get(Keys.BITPAY_ACCOUNTS_V2(network));
  };

  setSquarepayAccount(network: string, data: {
    email: string,
    token: string,
    familyName?: string, // last name
    givenName?: string, // firstName
  }): Promise<any> {
    return this.getSquarepayAccounts(network)
      .then(allAccounts => {
        allAccounts = allAccounts || {};
        let account = allAccounts[data.email] || {};
        account.token = data.token;
        account.familyName = data.familyName;
        account.givenName = data.givenName;
        allAccounts[data.email] = account;

        this.logger.info('Storing SquarePay accounts with new account:' + data.email);
        return this.storage.set(Keys.BITPAY_ACCOUNTS_V2(network), allAccounts);
      });
  };

  removeSquarepayAccount(network: string, email: string): Promise<void> {
    return this.getSquarepayAccounts(network)
      .then(allAccounts => {
        allAccounts = allAccounts || {};
        delete allAccounts[email];
        return this.storage.set(Keys.BITPAY_ACCOUNTS_V2(network), allAccounts);
      });
  };

  // cards: [
  //   eid: card id
  //   id: card id
  //   lastFourDigits: card number
  //   token: card token
  // ]
  setSquarepayDebitCards(network: string, email: string, cards: any): Promise<void> {
    return this.getSquarepayAccounts(network)
      .then(allAccounts => {
        allAccounts = allAccounts || {};
        if (!allAccounts[email]) throw new Error('Cannot set cards for unknown account ' + email);
        allAccounts[email].cards = cards;
        return this.storage.set(Keys.BITPAY_ACCOUNTS_V2(network), allAccounts);
      });
  };

  // cards: [
  //   eid: card id
  //   id: card id
  //   lastFourDigits: card number
  //   token: card token
  //   email: account email
  // ]
  getSquarepayDebitCards(network: string): Promise<any[]> {
    return this.getSquarepayAccounts(network)
      .then(allAccounts => {
        let allCards = [];
        _.each(allAccounts, (account, email) => {
          if (account.cards) {
            // Add account's email to each card
            var cards = _.clone(account.cards);
            _.each(cards, (x) => {
              x.email = email;
            });

            allCards = allCards.concat(cards);
          }
        });
        return allCards;
      });
  };

  removeSquarepayDebitCard(network: string, cardEid: string): Promise<void> {
    return this.getSquarepayAccounts(network)
      .then(allAccounts => {
        return _.each(allAccounts, (account) => {
          account.cards = _.reject(account.cards, {
            eid: cardEid
          });
        });
      }).then(allAccounts => {
        return this.storage.set(Keys.BITPAY_ACCOUNTS_V2(network), allAccounts);
      });
  };

  setMercadoLibreGiftCards(network: string, gcs): Promise<void> {
    return this.storage.set((Keys.MERCADO_LIBRE(network)), gcs);
  };

  getMercadoLibreGiftCards(network: string): Promise<void> {
    return this.storage.get((Keys.MERCADO_LIBRE(network)));
  };

  removeMercadoLibreGiftCards(network: string): Promise<void> {
    return this.storage.remove((Keys.MERCADO_LIBRE(network)));
  };

  setShapeshift(network: string, gcs: any): Promise<void> {
    return this.storage.set('shapeShift-' + network, gcs);
  };

  getShapeshift(network: string): Promise<void> {
    return this.storage.get('shapeShift-' + network);
  };

  removeShapeshift(network: string): Promise<void> {
    return this.storage.remove('shapeShift-' + network);
  };

  setWalletOrder(walletId: string, index: number): Promise<void> {
    return this.storage.set('order-' + walletId, index);
  };

  getWalletOrder(walletId: string): Promise<void> {
    return this.storage.get('order-' + walletId);
  };

  setLockStatus(isLocked: string): Promise<void> {
    return this.storage.set('lockStatus', isLocked);
  };

  getLockStatus(): Promise<string> {
    return this.storage.get('lockStatus');
  };

  removeLockStatus(): Promise<void> {
    return this.storage.remove('lockStatus');
  };
}
