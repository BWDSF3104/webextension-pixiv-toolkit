import GlobalSettings from "@/modules/GlobalSettings";
import AbstractDownloadTask from "../AbstractDownloadTask";
import browser from "@/modules/Extension/browser";
import Downloader from "@/modules/Net/Downloader";
import FileSystem from "../../FileSystem";
import NameFormatter from "@/modules/Util/NameFormatter";
import MimeType from "@/modules/Util/MimeType";
import pathjoin from "@/modules/Util/pathjoin";
import AbstractGenerator from "@/content_scripts/modules/Legacy/UgoiraGenerator/AbstractGenerator";
import GifGenerator from "@/content_scripts/modules/Legacy/UgoiraGenerator/GifGenerator";
import WebmGenerator from "@/content_scripts/modules/Legacy/UgoiraGenerator/WebmGenerator";
import ApngGenerator from "@/content_scripts/modules/Legacy/UgoiraGenerator/ApngGenerator";
import { RuntimeError } from "@/errors";

class ZipRepo {
  /**
   * @type {ZipRepo}
   */
  static instance;

  container = new Map();

  static getDefault() {
    if (!ZipRepo.instance) {
      ZipRepo.instance = new ZipRepo();
    }

    return ZipRepo.instance;
  }

  storeZip(uid, data) {
    this.container.set(uid, data);
  }

  getZip(uid) {
    const zip = this.container.get(uid);

    if (zip) {
      return zip;
    }
  }
}

/**
 * @typedef UgoiraDownloadTaskOptions
 * @property {string} uid
 * @property {string} id
 * @property {string} url
 * @property {string} resource
 * @property {any[]} frames
 * @property {string} renameRule
 * @property {0|1|2} packAnimationJsonType
 * @property {any} context
 * @property {string} convertType
 *
 * @class
 */
class UgoiraDownloadTask extends AbstractDownloadTask {
  /**
   * @inheritdoc
   */
  type = 'PIXIV_UGOIRA';

  /**
   * @type {UgoiraDownloadTaskOptions}
   */
  options;

  /**
   * @type {Downloader}
   */
  downloader;

  /**
   * @type {Blob} Download data
   */
  data;

  /**
   * @type {number} Count processed frames
   */
  processedFramesCount = 0;

  /**
   * @type {number} conversion process progress
   */
  processProgress = 0;

  /**
   * @type {AbstractGenerator}
   */
  generator;

  zip;

  /**
   *
   * @param {UgoiraDownloadTaskOptions} options
   */
  constructor(options) {
    super();

    this.uid = options.uid;
    this.id = options.id;
    this.url = options.url;
    this.title = options.context.title;
    this.context = options.context;
    this.options = options;

    const generatorClasses = { gif: GifGenerator, webm: WebmGenerator, apng: ApngGenerator };
    const Generator = generatorClasses[String(options.convertType || '').toLowerCase()];

    if (!Generator) {
      throw new RuntimeError('NOT_SUPPORT_CONVERT_TYPE');
    }

    this.generator = new Generator();

    this.downloader = new Downloader({ processors: GlobalSettings().downloadTasksWhenDownloadingImages });
    this.downloader.appendFile(options.resource);
    this.downloader.addListener('start', this.onStart, this);
    this.downloader.addListener('progress', this.onProgress, this);
    this.downloader.addListener('item-finish', this.onItemFinish, this);
    this.downloader.addListener('finish', this.onFinish, this);
    this.downloader.addListener('item-error', this.onItemError, this);
    this.downloader.addListener('pause', this.onPause, this);
  }

  /**
   * Handle downloader `onStart` event
   */
  onStart() {
    //
  }

  /**
   * Handle downloader `onProgress` event
   * @param {{progress: number, successCount: number, failCount: number}} param0
   * @fires UgoiraDownloadTask#progress
   */
  onProgress({ progress, successCount, failCount}) {
    this.progress = progress;

    this.dispatch('progress', [this.progress]);
  }

  makeAnimationJsonContent(type) {
    if (type == 1) {
      return JSON.stringify(this.context.illustFrames);
    } else if (type == 2) {
      return JSON.stringify({
        ugokuIllustData: {
          src: this.context.illustSrc,
          originalSrc: this.context.illustOriginalSrc,
          mime_type: this.context.illustMimeType,
          frames: this.context.illustFrames
        }
      })
    }
  }

  /**
   *
   * @param {*} param0
   * @fires UgoiraDownloadTask#progress
   */
  async onItemFinish({ blob, mimeType }) {
    ZipRepo.getDefault().storeZip(this.uid, blob);

    this.data = blob;

    let nameFormatter = NameFormatter.getFormatter({ context: this.context });

    this.zip = new JSZip();
    await this.zip.loadAsync(blob);

    if (this.options.packAnimationJsonType > 0) {
      this.zip.file('animation.json', this.makeAnimationJsonContent(this.options.packAnimationJsonType));
    }

    let url = URL.createObjectURL(await this.zip.generateAsync({ type: 'blob' }));

    this.lastDownloadId = await browser.runtime.sendMessage({
      to: 'ws', action: 'download:saveFile',
      args: {
        url,
        filename: pathjoin(GlobalSettings().downloadRelativeLocation, nameFormatter.format(
          this.options.renameRule
        )) + '.' + MimeType.getExtenstion(mimeType)
      }
    })

    URL.revokeObjectURL(url);

    this.dispatch('progress', [this.progress]);

    /**
     * Save work information accroding the enableDownloadMetadata setting
     */
    if (GlobalSettings().enableDownloadMetadata && this.options.context) {
      const blob = new Blob([JSON.stringify(this.options.context)], { type: 'application/json' });
      await browser.runtime.sendMessage({
        to: 'ws', action: 'download:saveFile',
        args: {
          url: URL.createObjectURL(blob),
          filename: 'info.json'
        }
      });
    }
  }

  /**
   * When resource is downloaded, then generate animation file using generator
   * @fires UgoiraDownloadTask#progress
   * @fires UgoiraDownloadTask#complete
   */
  async onFinish() {
    this.changeState(this.PROCESSING_STATE);

    this.generator.addListener('progress', (progress) => {
      this.processProgress = progress;
      this.dispatch('progress', [progress]);
    });

    this.generator.addListener('complete', async (blob, mimeType) => {
      /**
       * Save file to disk
       */
      let animationFileUrl = URL.createObjectURL(blob);
      let nameFormatter = NameFormatter.getFormatter({ context: this.context });

      this.lastDownloadId = await browser.runtime.sendMessage({
        to: 'ws',
        action: 'download:saveFile',
        args: {
          url: animationFileUrl,
          filename: pathjoin(GlobalSettings().downloadRelativeLocation, nameFormatter.format(
            this.options.renameRule
          )) + '.' + MimeType.getExtenstion(mimeType)
        }
      });

      URL.revokeObjectURL(animationFileUrl);

      this.changeState(this.COMPLETE_STATE);
      this.dispatch('complete');
    });

    this.generator.addListener('error', (error) => {
      this.changeState(this.FAILURE_STATE);
      this.dispatch('error', [error]);
    });

    this.generator.generate(this);
  }

  /**
   *
   * @param {*} error
   * @fires UgoiraDownloadTask#error
   */
  onItemError(error) {
    this.lastError = error;

    this.dispatch('error');
  }

  /**
   * Handle downloader abort event
   * @fires UgoiraDownloadTask#pause
   */
  onPause() {
    this.dispatch('pause');
  }

  /**
   * Create a pixiv illustration download task
   * @param {UgoiraDownloadTaskOptions} options
   * @returns {UgoiraDownloadTask}
   */
  static create(options) {
    return new UgoiraDownloadTask(options);
  }

  /**
   * @override
   * @fires UgoiraDownloadTask#start
   * @param {boolean} reset
   */
  async start(reset = false) {
    if (reset) {
      this.downloader.reset();
    }

    if (this.isPending()) {
      this.zipRepo = ZipRepo.getDefault();

      /**
       * Here we get the zip file from cache repo, if get one then skip the download
       * process and start download onFinish event handler manully.
       */
      const data = this.zipRepo.getZip(this.uid);

      if (data) {
        this.data = data;
        this.zip = new JSZip();
        await this.zip.loadAsync(this.data);
        this.progress = 1;
        this.dispatch('progress', [this.progress]);
        this.onFinish();
      } else {
        this.changeState(this.DOWNLOADING_STATE);
        this.dispatch('start');
        this.downloader.download();
      }
    }
  }

  abortProcess() {
    if (this.downloader) {
      this.downloader.pause();
    }

    if (this.generator) {
      this.generator.stop();
    }
  }

  /**
   * If the task is start to generate animation, then it can be stopped.
   * @override
   */
  pause() {
    if (this.state !== this.PROCESSING_STATE) {
      this.changeState(this.PAUSED_STATE);
      this.abortProcess();
    }
  }

  /**
   * @override
   */
  stop() {
    this.abortProcess();
  }

  /**
   * Convert task instance to json object
   * @return {object}
   */
  toJson() {
    return Object.assign({}, super.toJson(), {
      processProgress: this.processProgress,
      convertType: this.options.convertType
    });
  }
}

export default UgoiraDownloadTask;
