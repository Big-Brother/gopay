import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed
} from '@angular/core/testing';

import { Platform } from 'ionic-angular';
import { Subject } from 'rxjs';

import { TestUtils } from '../../test';

import { HomePage } from './home';

import { AddressBookProvider } from '../../providers/address-book/address-book';
import { AppIdentityProvider } from '../../providers/app-identity/app-identity';
import { AppProvider } from '../../providers/app/app';
import { SquarePayCardProvider } from '../../providers/squarepay-card/squarepay-card';
import { SquarePayProvider } from '../../providers/squarepay/squarepay';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { FeeProvider } from '../../providers/fee/fee';
import { FeedbackProvider } from '../../providers/feedback/feedback';
import { FilterProvider } from '../../providers/filter/filter';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { LanguageProvider } from '../../providers/language/language';
import { NodeWebkitProvider } from '../../providers/node-webkit/node-webkit';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PayproProvider } from '../../providers/paypro/paypro';
import { PlatformProvider } from '../../providers/platform/platform';
import { PopupProvider } from '../../providers/popup/popup';
import { PushNotificationsProvider } from '../../providers/push-notifications/push-notifications';
import { RateProvider } from '../../providers/rate/rate';
import { ReleaseProvider } from '../../providers/release/release';
import { ScanProvider } from '../../providers/scan/scan';
import { TouchIdProvider } from '../../providers/touchid/touchid';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { WalletProvider } from '../../providers/wallet/wallet';
import { BwcErrorProvider } from './../../providers/bwc-error/bwc-error';
import { BwcProvider } from './../../providers/bwc/bwc';
import { ConfigProvider } from './../../providers/config/config';
import { Logger } from './../../providers/logger/logger';
import { PersistenceProvider } from './../../providers/persistence/persistence';
import { ProfileProvider } from './../../providers/profile/profile';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let instance: any;
  let testBed: typeof TestBed;

  beforeEach(
    async(() =>
      TestUtils.configurePageTestingModule([HomePage], {
        providers: [
          AddressBookProvider,
          AppIdentityProvider,
          SquarePayCardProvider,
          SquarePayProvider,
          BwcProvider,
          BwcErrorProvider,
          ConfigProvider,
          ExternalLinkProvider,
          FeedbackProvider,
          FeeProvider,
          FilterProvider,
          HomeIntegrationsProvider,
          IncomingDataProvider,
          LanguageProvider,
          Logger,
          NodeWebkitProvider,
          OnGoingProcessProvider,
          PayproProvider,
          PersistenceProvider,
          PopupProvider,
          ProfileProvider,
          PushNotificationsProvider,
          RateProvider,
          ReleaseProvider,
          ScanProvider,
          TouchIdProvider,
          TxFormatProvider,
          WalletProvider
        ]
      }).then(testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        testBed = testEnv.testBed;
        fixture.detectChanges();
      })
    )
  );
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should get config', () => {
        instance.ionViewWillEnter();
        const configProvider = testBed.get(ConfigProvider);
        expect(instance.config).toEqual(configProvider.get());
      });
      it('should not break if address book list call fails', () => {
        spyOn(testBed.get(AddressBookProvider), 'list').and.returnValue(
          Promise.reject('bad error')
        );
        instance.ionViewWillEnter();
      });
    });

    describe('ionViewDidEnter', () => {
      it('should check for update if NW', () => {
        instance.isNW = true;
        const spy = spyOn(instance, 'checkUpdate');
        instance.ionViewDidEnter();
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('ionViewDidLoad', () => {
      it('should update txps and set wallets on platform resume', () => {
        instance.plt.resume = new Subject();
        instance.ionViewDidLoad();
        const updateTxpsSpy = spyOn(instance, 'updateTxps');
        const setWalletsSpy = spyOn(instance, 'setWallets');
        instance.plt.resume.next();
        expect(updateTxpsSpy).toHaveBeenCalled();
        expect(setWalletsSpy).toHaveBeenCalled();
      });
    });

    describe('ionViewWillLeave', () => {
      it('should unsubscribe from feedback:hide event', () => {
        const spy = spyOn(instance.events, 'unsubscribe');
        instance.ionViewWillLeave();
        expect(spy).toHaveBeenCalledWith('feedback:hide');
      });
    });
  });

  describe('Methods', () => {
    describe('handleDeepLinksNW', () => {
      beforeEach(() => {
        (window as any).require = () => {
          return {
            App: {
              on: (event, cb) => {}
            }
          };
        };
      });
      afterEach(() => {
        delete (window as any).require;
      });
      it('should not break', () => {
        instance.handleDeepLinksNW();
      });
    });
  });
});
