/*
 * @Author: Leo Ding <leoding86@msn.com>
 * @Date: 2024-08-11 14:34:57
 * @LastEditors: Leo Ding <leoding86@msn.com>
 * @LastEditTime: 2024-08-11 23:01:49
 * @FilePath: \webextension-pixiv-toolkit\src\content_scripts\modules\Legacy\UgoiraGenerator\ApngGenerator.js
 */
import MimeType from "@/modules/Util/MimeType";
import AbstractGenerator from "./AbstractGenerator";
import APNG from '@/modules/Util/APNG';
import getImageSize from '@/modules/Util/getImageSize';
import getCanvasFromDataURI from "@/modules/Util/getCanvasFromDataURI";

class ApngGenerator extends AbstractGenerator {
  /**
   * @constructor
   */
  constructor() {
    super();

    this.status = 0;
    this.zip;
    this.mimeType;
    this.frames;
    this.imagesData = [];
    this.delays = [];
    this.repeat = 0;
    this.currentRepeat = 0;
  }

  /**
   * @param {Number} repeat
   */
  setRepeat(repeat) {
    this.repeat = this.currentRepeat = parseInt(repeat);
  }

  /**
   * @param {{width: Number, height: Number}} size
   * @param {Number} [index=0]
   * @returns {Promise.<void>}
   */
  getImagesData(size, index = 0) {
    return new Promise(resolve => {
      if (index < this.frames.length) {
        this.zip.file(this.frames[index].file).async('base64').then(b64 => {
          return getCanvasFromDataURI(
            "data:" + MimeType.getFileMimeType(this.frames[index].file) + ";base64," + b64,
            size
          );
        }).then(canvas => {
          this.imagesData.push(canvas.getContext('2d').getImageData(0, 0, size.width, size.height).data.buffer);
          this.delays.push(this.frames[index].delay);

          this.dispatch('data', [this.frames.length * (this.repeat + 1), this.frames.length * (this.repeat - this.currentRepeat) + index + 1]);

          resolve(this.getImagesData(size, index + 1));
        });
      } else if (this.currentRepeat > 0) {
        this.currentRepeat--;

        resolve(this.getImagesData(size));
      } else {
        resolve();
      }
    });
  }

  /**
   * @returns {void}
   */
  async generate(downloadTask) {
    let self = this;

    this.frames = downloadTask.options.frames;
    this.zip = new JSZip();
    await this.zip.loadAsync(downloadTask.data);
    this.status = 1;

    this.dispatch("start");

    this.zip.file(this.frames[0].file).async('base64').then(b64 => {
      let imageBase64 = "data:" + MimeType.getFileMimeType(this.frames[0].file) + ';base64,' + b64;

      getImageSize(imageBase64).then(size => {
        self.getImagesData(size).then(() => {
          // worker-loader の blob worker は MV3 CSP で不可なのでメインスレッドで直接 APNG.encode（ugoira は数〜数十フレームで十分軽い）
          APNG.event.addListener('onProgress', (currentProgress, totalProgress) => {
            self.dispatchProgress(currentProgress / totalProgress);
          });

          let arrayBuffer = APNG.encode(self.imagesData, size.width, size.height, 0, self.delays);

          self.status = 2;
          self.dispatchComplete([new Blob([arrayBuffer], { type: 'image/apng' }), 'image/apng']);
        });
      });
    });
  }
}

export default ApngGenerator;
