import AbstractDownloadTask from "../AbstractDownloadTask";
import GlobalSettings from "@/modules/GlobalSettings";
import FileSystem from "../../FileSystem";
import NameFormatter from "@/modules/Util/NameFormatter";
import pathjoin from "@/modules/Util/pathjoin";

/**
 * @typedef NovelDownloadTaskOptions
 * @property {string} id
 * @property {string} url
 * @property {string} renameRule
 * @property {boolean} includeDescription
 * @property {'txt'|'epub'} bookType
 * @property {any} context
 *
 * @class
 */
class NovelDownloadTask extends AbstractDownloadTask {
  /**
   * @inheritdoc
   */
  type = 'PIXIV_NOVEL';

  /**
   * @type {NovelDownloadTaskOptions}
   */
  options;

  /**
   *
   * @param {NovelDownloadTaskOptions} options
   */
  constructor(options) {
    super();

    this.id = options.id;
    this.url = options.url;
    this.state = this.PENDING_STATE;
    this.title = options.context.title;
    this.context = options.context;
    this.options = options;
  }

  /**
   * Create a pixiv illustration download task
   * @param {NovelDownloadTaskOptions} options
   * @returns {NovelDownloadTask}
   */
  static create(options) {
    return new NovelDownloadTask(options);
  }

  /**
   * MV3 extension page CSP で handlebars の new Function が不可のため、
   * epub 生成は sandbox ページ（sandbox/epub.html）へ隔離して postMessage で受ける。
   * 表紙は extension page 側で取得し dataURL で渡す（sandbox からの CORS/Referer を回避）。
   */
  async makeEpubBook() {
    let coverUrl = this.context.coverUrl;

    if (coverUrl) {
      coverUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        fetch(coverUrl).then(response => response.blob()).then(blob => reader.readAsDataURL(blob)).catch(reject);
      });
    }

    const blob = await new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.src = browser.runtime.getURL('sandbox/epub.html');
      iframe.setAttribute('sandbox', 'allow-scripts');
      iframe.style.display = 'none';

      const cleanup = () => {
        window.removeEventListener('message', onMessage);
        iframe.remove();
      };

      const onMessage = (event) => {
        if (event.source !== iframe.contentWindow) return;
        const data = event.data || {};

        if (data.type === 'ptk-epub-ready') {
          iframe.contentWindow.postMessage({
            type: 'ptk-epub-build',
            uuid: this.url,
            author: this.context.userName,
            attributionUrl: this.context.url,
            coverUrl,
            title: this.title,
            includeDescription: this.options.includeDescription,
            description: this.context.description,
            sections: this.context.sections
          }, '*');
        } else if (data.type === 'ptk-epub-result') {
          cleanup();
          resolve(new Blob([data.buffer], { type: 'application/epub+zip' }));
        } else if (data.type === 'ptk-epub-error') {
          cleanup();
          reject(new Error(data.message));
        }
      };

      window.addEventListener('message', onMessage);
      document.body.appendChild(iframe);
    });

    let url = URL.createObjectURL(blob);

    this.lastDownloadId = await FileSystem.getDefault().saveFileInBackground({
      url,
      filename: pathjoin(GlobalSettings().downloadRelativeLocationnameFormatter.format(
        GlobalSettings().novelRenameFormat,
        this.context.id + '_' + this.context.title
      )) + '.epub'
    });

    URL.revokeObjectURL(url);
    this.changeState(this.COMPLETE_STATE);
    this.dispatch('complete');
  }

  async makeTxtBook() {
    let contentParts = [];

    contentParts.push(this.url);
    contentParts.push(this.context.userName);
    contentParts.push(this.title);

    if (this.options.includeDescription) {
      contentParts.push(this.context.description.replace(/<br\s*\/>/ig, "\r\n").trim());
    }

    this.context.sections.forEach(section => {
      contentParts.push(section.replace(/<br\s*\/>/ig, "\r\n").trim());
    });

    let content = contentParts.join("\r\n".repeat(2));
    let url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    let nameFormatter = NameFormatter.getFormatter({ context: this.context });

    this.lastDownloadId = await FileSystem.getDefault().saveFileInBackground({
      url,
      filename: pathjoin(GlobalSettings().downloadRelativeLocation, nameFormatter.format(
        this.options.renameRule,
        this.context.id + '_' + this.context.title
      )) + '.txt'
    });

    this.changeState(this.COMPLETE_STATE);
    this.dispatch('complete');

    URL.revokeObjectURL(url);
  }

  /**
   * @override
   */
  async start() {
    if (this.options.bookType === 'epub') {
      await this.makeEpubBook();
    } else {
      await this.makeTxtBook();
    }

    this.progress = 1;

    this.dispatch('start');
  }

  /**
   * @override
   */
  pause() {
    //
  }

  /**
   * @override
   */
  stop() {
    //
  }
}

export default NovelDownloadTask;
