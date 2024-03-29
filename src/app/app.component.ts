import { Component } from '@angular/core';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Events, ModalController, Platform } from 'ionic-angular';
import { Subscription } from 'rxjs';

// providers
import { AmazonProvider } from '../providers/amazon/amazon';
import { AppProvider } from '../providers/app/app';
import { SquarePayCardProvider } from '../providers/squarepay-card/squarepay-card';
import { CoinbaseProvider } from '../providers/coinbase/coinbase';
import { ConfigProvider } from '../providers/config/config';
import { EmailNotificationsProvider } from '../providers/email-notifications/email-notifications';
import { GlideraProvider } from '../providers/glidera/glidera';
import { Logger } from '../providers/logger/logger';
import { MercadoLibreProvider } from '../providers/mercado-libre/mercado-libre';
import { PopupProvider } from '../providers/popup/popup';
import { ProfileProvider } from '../providers/profile/profile';
import { ShapeshiftProvider } from '../providers/shapeshift/shapeshift';
import { TouchIdProvider } from '../providers/touchid/touchid';

// pages
import { FingerprintModalPage } from '../pages/fingerprint/fingerprint';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';
import { OnboardingPage } from '../pages/onboarding/onboarding';
import { PinModalPage } from '../pages/pin/pin';
import { TabsPage } from '../pages/tabs/tabs';


// As the handleOpenURL handler kicks in before the App is started, 
// declare the handler function at the top of app.component.ts (outside the class definition) 
// to track the passed Url
(window as any).handleOpenURL = (url: string) => {
  (window as any).handleOpenURL_LastURL = url;
};

@Component({
  templateUrl: 'app.html',
  providers: [TouchIdProvider]
})
export class GopayApp {

  public rootPage: any;
  private onResumeSubscription: Subscription;
  private isModalOpen: boolean;

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private events: Events,
    private logger: Logger,
    private appProvider: AppProvider,
    private profile: ProfileProvider,
    private configProvider: ConfigProvider,
    private modalCtrl: ModalController,
    private glideraProvider: GlideraProvider,
    private coinbaseProvider: CoinbaseProvider,
    private amazonProvider: AmazonProvider,
    private bitPayCardProvider: SquarePayCardProvider,
    private mercadoLibreProvider: MercadoLibreProvider,
    private shapeshiftProvider: ShapeshiftProvider,
    private emailNotificationsProvider: EmailNotificationsProvider,
    private screenOrientation: ScreenOrientation,
    private popupProvider: PopupProvider
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then((readySource) => {
      this.appProvider.load().then(() => {
        this.logger.info(
          'Platform ready (' + readySource + '): ' +
          this.appProvider.info.nameCase +
          ' - v' + this.appProvider.info.version +
          ' #' + this.appProvider.info.commitHash);

        if (this.platform.is('cordova')) {
          this.statusBar.show();

          // Set to portrait
          this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);

          // Only overlay for iOS
          if (this.platform.is('ios')) this.statusBar.overlaysWebView(true);

          this.statusBar.styleLightContent();
          this.splashScreen.hide();

          // Subscribe Resume
          this.onResumeSubscription = this.platform.resume.subscribe(() => {

            // Update Wallet Status
            this.events.publish('status:updated');

            // Check PIN or Fingerprint
            this.openLockModal();
          });

        }
        this.openLockModal();
        this.registerIntegrations();
        // Check Profile
        this.profile.loadAndBindProfile().then((profile: any) => {
          this.emailNotificationsProvider.init(); // Update email subscription if necessary
          if (profile) {
            this.logger.info('Profile exists.');
            this.rootPage = TabsPage;
          }
          else {
            this.logger.info('No profile exists.');
            this.profile.createProfile();
            this.rootPage = OnboardingPage;
          }
        }).catch((err: Error) => {
          this.logger.warn('LoadAndBindProfile', err.message);
          this.rootPage = err.message == 'ONBOARDINGNONCOMPLETED: Onboarding non completed' ? OnboardingPage : DisclaimerPage;
        });
      }).catch((err) => {
        let title = 'Could not initialize the app';
        let message = JSON.stringify(err);
        this.popupProvider.ionicAlert(title, message);
      });

    }).catch((e) => {
      this.logger.error('Platform is not ready.', e);
    });
  }

  ngOnDestroy() {
    this.onResumeSubscription.unsubscribe();
  }

  private openLockModal(): void {
    if (this.isModalOpen) return;
    let config: any = this.configProvider.get();
    let lockMethod = (config && config.lock && config.lock.method) ? config.lock.method.toLowerCase() : null;
    if (!lockMethod) return;
    if (lockMethod == 'pin') this.openPINModal('checkPin');
    if (lockMethod == 'fingerprint') this.openFingerprintModal();
  }

  private openPINModal(action): void {
    this.isModalOpen = true;
    this.events.publish('showPinModalEvent', action);
    this.events.subscribe('finishPinModalEvent', () => {
      this.isModalOpen = false;
      this.events.unsubscribe('finishPinModalEvent');
    });
  }

  private openFingerprintModal(): void {
    this.isModalOpen = true;
    let isGopay = this.appProvider.info.nameCase == 'Gopay' ? true : false;
    this.events.publish('showFingerprintModalEvent', isGopay);
    this.events.subscribe('finishFingerprintModalEvent', () => {
      this.isModalOpen = false;
      this.events.unsubscribe('finishFingerprintModalEvent');
    });
  }

  private registerIntegrations(): void {

    // Mercado Libre
    if (this.appProvider.info._enabledExtensions.mercadolibre) this.mercadoLibreProvider.register();

    // Amazon Gift Cards
    if (this.appProvider.info._enabledExtensions.amazon) this.amazonProvider.register();

    // ShapeShift
    if (this.appProvider.info._enabledExtensions.shapeshift) this.shapeshiftProvider.register();

    // Glidera
    if (this.appProvider.info._enabledExtensions.glidera) {
      this.glideraProvider.setCredentials();
      this.glideraProvider.register();
    }

    // Coinbase
    if (this.appProvider.info._enabledExtensions.coinbase) {
      this.coinbaseProvider.setCredentials();
      this.coinbaseProvider.register();
    }

    // SquarePay Card
    if (this.appProvider.info._enabledExtensions.debitcard) this.bitPayCardProvider.register();
  }
}
