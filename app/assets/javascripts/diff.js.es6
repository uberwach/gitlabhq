/* eslint-disable class-methods-use-this */

(() => {
  const UNFOLD_COUNT = 20;

  class Diff {
    constructor() {
      const $diffFile = $('.files .diff-file');
      $diffFile.singleFileDiff();
      $diffFile.filesCommentButton();

      $diffFile.each((index, file) => new gl.ImageFile(file));

      if (this.diffViewType() === 'parallel') {
        $('.content-wrapper .container-fluid').removeClass('container-limited');
      }

      $(document)
        .off('click', '.js-unfold, .diff-line-num a')
        .on('click', '.js-unfold', this.handleClickUnfold.bind(this))
        .on('click', '.diff-line-num a', this.handleClickLineNum.bind(this));

      this.highlighSelectedLine();
    }

    handleClickUnfold(e) {
      const $target = $(e.target);
      // current babel config relies on iterators implementation, so we cannot simply do:
      // const [oldLineNumber, newLineNumber] = this.lineNumbers($target.parent());
      const ref = this.lineNumbers($target.parent());
      const oldLineNumber = ref[0];
      const newLineNumber = ref[1];
      const offset = newLineNumber - oldLineNumber;
      const bottom = $target.hasClass('js-unfold-bottom');
      let since;
      let to;
      let unfold = true;

      if (bottom) {
        const lineNumber = newLineNumber + 1;
        since = lineNumber;
        to = lineNumber + UNFOLD_COUNT;
      } else {
        const lineNumber = newLineNumber - 1;
        since = lineNumber - UNFOLD_COUNT;
        to = lineNumber;

        // make sure we aren't loading more than we need
        const prevNewLine = this.lineNumbers($target.parent().prev())[1];
        if (since <= prevNewLine + 1) {
          since = prevNewLine + 1;
          unfold = false;
        }
      }

      const file = $target.parents('.diff-file');
      const link = file.data('blob-diff-path');
      const view = file.data('view');

      const params = { since, to, bottom, offset, unfold, view };
      $.get(link, params, response => $target.parent().replaceWith(response));
    }

    openAnchoredDiff(anchoredDiff, cb) {
      const diffTitle = $(`#file-path-${anchoredDiff}`);
      const diffFile = diffTitle.closest('.diff-file');
      const nothingHereBlock = $('.nothing-here-block:visible', diffFile);
      if (nothingHereBlock.length) {
        diffFile.singleFileDiff(true, cb);
      } else {
        cb();
      }
    }

    handleClickLineNum(e) {
      const hash = $(e.currentTarget).attr('href');
      e.preventDefault();
      if (window.history.pushState) {
        window.history.pushState(null, null, hash);
      } else {
        window.location.hash = hash;
      }
      this.highlighSelectedLine();
    }

    diffViewType() {
      return $('.inline-parallel-buttons a.active').data('view-type');
    }

    lineNumbers(line) {
      if (!line.children().length) {
        return [0, 0];
      }
      return line.find('.diff-line-num').map((i, elm) => parseInt($(elm).data('linenumber'), 10));
    }

    highlighSelectedLine() {
      const $diffFiles = $('.diff-file');
      $diffFiles.find('.hll').removeClass('hll');

      if (window.location.hash !== '') {
        const hash = window.location.hash.replace('#', '');
        $diffFiles
          .find(`tr#${hash}:not(.match) td, td#${hash}, td[data-line-code="${hash}"]`)
          .addClass('hll');
      }
    }
  }

  window.gl = window.gl || {};
  window.gl.Diff = Diff;
})();
