import { Injectable } from '@angular/core';
import { Logger } from '../logger/logger';

// native 
import { Device } from '@ionic-native/device';

// providers
import { AppIdentityProvider } from '../app-identity/app-identity';
import { SquarePayProvider } from '../squarepay/squarepay';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { PopupProvider } from '../popup/popup';

import * as _ from 'lodash';

@Injectable()
export class SquarePayAccountProvider {


  /*
   * Pair this app with the squarepay server using the specified pairing data.
   * An app identity will be created if one does not already exist.
   * Pairing data is provided by an input URI provided by the squarepay server.
   *
   * pairData - data needed to complete the pairing process
   * {
   *   secret: shared pairing secret
   *   email: email address associated with squarepay account
   *   otp: two-factor one-time use password
   * }
   *
   * pairingReason - text string to be embedded into popup message.  If `null` then the reason
   * message is not shown to the UI.
   *   "To {{reason}} you must pair this app with your SquarePay account ({{email}})."
   *
   * cb - callback after completion
   *   callback(err, paired, apiContext)
   *
   *   err - something unexpected happened which prevented the pairing
   *
   *   paired - boolean indicating whether the pairing was compledted by the user
   *
   *   apiContext - the context needed for making future api calls
   *   {
   *     token: api token for use in future calls
   *     pairData: the input pair data
   *     appIdentity: the identity of this app
   *   }
   */
  
  constructor(
    private platformProvider: PlatformProvider,
    private bitPayProvider: SquarePayProvider,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private persistenceProvider: PersistenceProvider,
    private appIdentityProvider: AppIdentityProvider,
    private device: Device
  ) {
    this.logger.info('SquarePayAccountProvider initialized');
  }

  public pair(pairData: any, pairingReason: string, cb: (err: string, paired?: boolean, apiContext?: any) => any) {
    this.checkOtp(pairData, (otp) => {
      pairData.otp = otp;
      let deviceName = 'Unknown device';
      if (this.platformProvider.isNW) {
        deviceName = require('os').platform();
      } else if (this.platformProvider.isCordova) {
        deviceName = this.device.model;
      }
      let json = {
        method: 'createToken',
        params: {
          secret: pairData.secret,
          version: 2,
          deviceName,
          code: pairData.otp
        }
      };

      this.bitPayProvider.postAuth(json, (data) => {
        if (data && data.error) {
          return cb(data.error);
        }
        let apiContext = {
          token: data.data,
          pairData,
          appIdentity: data.appIdentity
        };
        this.logger.info('SquarePay service BitAuth create token: SUCCESS');

        this.fetchBasicInfo(apiContext, (err, basicInfo) => {
          if (err) return cb(err);
          let title = 'Add SquarePay Account?'; // TODO gettextcatalog
          let msg;

          if (pairingReason) {
            let reason = pairingReason;
            let email = pairData.email;

            msg = 'To ' + reason + ' you must first add your SquarePay account - ' + email; // TODO gettextcatalog
          } else {
            let email = pairData.email;
            msg = 'Add this SquarePay account ' + '(' + email + ')?'; // TODO gettextcatalog
          }

          let ok = 'Add Account'; // TODO gettextcatalog
          let cancel = 'Go back'; // TODO gettextcatalog
          this.popupProvider.ionicConfirm(title, msg, ok, cancel).then((res) => {
            if (res) {
              let acctData = {
                token: apiContext.token,
                email: pairData.email,
                givenName: basicInfo.givenName,
                familyName: basicInfo.familyName
              };
              this.setSquarepayAccount(acctData)
              return cb(null, true, apiContext);
            } else {
              this.logger.info('User cancelled SquarePay pairing process');
              return cb(null, false);
            }
          });
        });
      }, (data) => {
        return cb(this._setError('SquarePay service BitAuth create token: ERROR ', data));
      });
    });
  }

  private checkOtp(pairData: any, cb: (otp?) => any) {
    if (pairData.otp) {
      let msg = 'Enter Two Factor for your SquarePay account'; // TODO gettextcatalog
      this.popupProvider.ionicPrompt(null, msg, null).then((res) => {
        cb(res);
      });
    } else {
      cb();
    }
  }

  private fetchBasicInfo(apiContext: any, cb: (err, basicInfo?) => any) {
    let json = {
      method: 'getBasicInfo'
    };
    // Get basic account information
    this.bitPayProvider.post('/api/v2/' + apiContext.token, json, (data) => {
      if (data && data.error) return cb(data.error);
      this.logger.info('SquarePay Account Get Basic Info: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      return cb(this._setError('SquarePay Account Error: Get Basic Info', data));
    });
  };

  // Returns account objects as stored.
  public getAccountsAsStored(cb: (err, accounts) => any) {
    this.persistenceProvider.getSquarepayAccounts(this.bitPayProvider.getEnvironment().network).then((accounts) => {
      return cb(null, accounts);
    }).catch((err) => {
      return cb(err, []);
    });
  };

  // Returns an array where each element represents an account including all information required for fetching data
  // from the server for each account (apiContext).
  public getAccounts(cb: (err, accounts?) => any) {
    this.getAccountsAsStored((err, accounts) => {
      if (err || _.isEmpty(accounts)) {
        return cb(err, []);
      }
      this.appIdentityProvider.getIdentity(this.bitPayProvider.getEnvironment().network, (err, appIdentity) => {
        if (err) {
          return cb(err);
        }

        let accountsArray = [];
        _.forEach(Object.keys(accounts), (key) => {
          accounts[key].cards = accounts[key].cards;
          accounts[key].email = key;
          accounts[key].givenName = accounts[key].givenName || '';
          accounts[key].familyName = accounts[key].familyName || '';
          accounts[key].apiContext = {
            token: accounts[key].token,
            pairData: {
              email: key
            },
            appIdentity
          };

          accountsArray.push(accounts[key]);
        });
        return cb(null, accountsArray);
      });
    });
  };

  private setSquarepayAccount(account: any) {
    this.persistenceProvider.setSquarepayAccount(this.bitPayProvider.getEnvironment().network, account);
  };

  public removeAccount(email: string, cb: () => any) {
    this.persistenceProvider.removeSquarepayAccount(this.bitPayProvider.getEnvironment().network, email).then(() => {
      return cb();
    });
  };

  private _setError(msg: string, e: any): string {
    this.logger.error(msg);
    let error = (e && e.data && e.data.error) ? e.data.error : msg;
    return error;
  };

}
