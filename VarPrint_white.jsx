// PS • Автоматизация: склейка для УФ-печати.
// Фон (TIFF) + маска белил (TIFF в оттенках серого, чёрное = белила) -> один TIFF с плашечным каналом.
// Аргументы: 0 — фон, 1 — маска белил (пусто — без белил), 2 — итоговый файл, 3 — имя канала, 4 — "cmyk" или "rgb",
// 5 — поворот: 0, 90 (по часовой) или -90 (против часовой).
// Возвращает "ok" или текст ошибки.
function vpMerge(a) {
  var fon = a[0], white = a[1], out = a[2], chName = a[3] || 'W', mode = a[4] || 'cmyk', ang = Number(a[5] || 0);
  var oldDlg = app.displayDialogs;
  app.displayDialogs = DialogModes.NO;
  var doc = null, wdoc = null;
  try {
    doc = app.open(new File(fon));
    if (doc.layers.length > 1 || !doc.activeLayer.isBackgroundLayer) doc.flatten();
    if (mode == 'cmyk' && doc.mode != DocumentMode.CMYK) doc.changeMode(ChangeMode.CMYK);
    if (white) {
      wdoc = app.open(new File(white));
      if (wdoc.width.as('px') != doc.width.as('px') || wdoc.height.as('px') != doc.height.as('px'))
        throw new Error('размер маски белил не совпадает с фоном');
      if (wdoc.mode != DocumentMode.GRAYSCALE) wdoc.changeMode(ChangeMode.GRAYSCALE);
      wdoc.selection.selectAll();
      wdoc.selection.copy();
      wdoc.close(SaveOptions.DONOTSAVECHANGES);
      wdoc = null;
      app.activeDocument = doc;
      var ch = doc.channels.add();
      ch.kind = ChannelType.SPOTCOLOR;
      ch.name = chName;
      var c = new SolidColor();
      c.rgb.red = 235; c.rgb.green = 235; c.rgb.blue = 255;
      ch.color = c;
      ch.opacity = 100;
      doc.activeChannels = [ch];
      doc.selection.selectAll();
      doc.paste();
      doc.selection.deselect();
      doc.activeChannels = doc.componentChannels;
    }
    if (ang) doc.rotateCanvas(ang);
    var o = new TiffSaveOptions();
    o.imageCompression = TIFFEncoding.TIFFLZW;
    o.layers = false;
    o.spotColors = true;
    o.alphaChannels = true;
    o.embedColorProfile = true;
    doc.saveAs(new File(out), o, true, Extension.LOWERCASE);
    doc.close(SaveOptions.DONOTSAVECHANGES);
    doc = null;
    return 'ok';
  } catch (e) {
    try { if (wdoc) wdoc.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) {}
    try { if (doc) doc.close(SaveOptions.DONOTSAVECHANGES); } catch (e3) {}
    return 'ошибка Фотошопа: ' + e.message;
  } finally {
    app.displayDialogs = oldDlg;
  }
}
vpMerge(arguments);
