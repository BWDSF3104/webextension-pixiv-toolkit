/* MV3 extension page CSP では handlebars の new Function が不可のため、
 * js-epub-maker は sandbox ページ（CSP 免除）で実行する。epub 生成のみをここで行う。 */
window.addEventListener('message', async (event) => {
  const data = event.data || {};

  if (data.type !== 'ptk-epub-build') return;

  try {
    const epubMaker = new EpubMaker();
    epubMaker.withTemplate('idpf-wasteland');
    epubMaker.withUuid(data.uuid);
    epubMaker.withAuthor(data.author);
    epubMaker.withAttributionUrl(data.attributionUrl);
    epubMaker.withCover(data.coverUrl);
    epubMaker.withTitle(data.title);

    if (data.includeDescription) {
      epubMaker.withSection(new EpubMaker.Section('bodymatter', null, {
        content: data.description
      }, false, false));
    }

    data.sections.forEach(section => {
      epubMaker.withSection(new EpubMaker.Section('bodymatter', null, {
        content: section
      }, false, false));
    });

    // downloadEpub() はブラウザダウンロードを発火し undefined を返す（上流の既存バグ）。makeEpub() が blob を返す
    const blob = await epubMaker.makeEpub();
    event.source.postMessage({ type: 'ptk-epub-result', buffer: await blob.arrayBuffer() }, '*');
  } catch (error) {
    event.source.postMessage({ type: 'ptk-epub-error', message: String(error) }, '*');
  }
});

parent.postMessage({ type: 'ptk-epub-ready' }, '*');
