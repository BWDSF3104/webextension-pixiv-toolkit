import Application from "./Application";
import { bookmark, like } from "./modules/PixivBookmark";
import browser from "@/modules/Extension/browser";
import ErrorTracker from '@/modules/ErrorTracker';

/**
 * Bootstrap
 * @class
 */
class Bootstrap {
  /**
   * Track the uncaught errors
   */
  trackError() {
    // let errorTracker = new ErrorTracker();
    // errorTracker.addListener('error', error => {
    //   console.error(error);
    //   browser.runtime.sendMessage({
    //     service: 'log:trackError',
    //     args: {
    //       error
    //     }
    //   });
    // });
  }

  /**
   * Boot the application and expose the application instance to window scope
   */
  boot() {
    this.trackError();

    window.$app = Application.app();
    window.$settings = window.$app.settings;

    browser.runtime.onConnect.addListener((port) => {
      port.onMessage.addListener(message => {
        if (message.type === 'fetch-info' && window.$app.resource) {
          port.postMessage({ info: window.$app.resource.unpack() });
        } else if (message.type === 'favorite') {
          bookmark(message.favKind, message.idKey, message.id)
            .then(result => port.postMessage({ favorite: result }))
            .catch(error => port.postMessage({ favorite: { ok: false, message: String(error) } }));
        } else if (message.type === 'like') {
          like(message.id)
            .then(result => port.postMessage({ like: result }))
            .catch(error => port.postMessage({ like: { ok: false, message: String(error) } }));
        }
      });
    });
  }
}

export default Bootstrap;
