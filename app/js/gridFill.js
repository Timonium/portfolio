'use strict';

// extend indexOf to work on old browsers
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
    "use strict";
    if (this == null) {
      throw new TypeError();
    }
    var t = Object(this);
    var len = t.length >>> 0;

    if (len === 0) {
      return -1;
    }
    var n = 0;
    if (arguments.length > 1) {
      n = Number(arguments[1]);
      if (n != n) { // shortcut for verifying if it's NaN
        n = 0;
      } else if (n != 0 && n != Infinity && n != -Infinity) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
      }
    }
    if (n >= len) {
      return -1;
    }
    var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
    for (; k < len; k++) {
      if (k in t && t[k] === searchElement) {
        return k;
      }
    }
    return -1;
  };
}

// http://stackoverflow.com/a/20929896/3063815
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

// http://www.cjboco.com/blog.cfm/post/determining-an-elements-width-and-height-using-javascript/
Element.prototype.getElementWidth = function() {
  if (typeof this.clip !== "undefined") {
    return this.clip.width;
  } else {
    if (this.style.pixelWidth) {
      return this.style.pixelWidth;
    } else {
      return this.offsetWidth;
    }
  }
};

var gridfill = {
  initialize: function(options) {
    this.options = options;
    // convert ratio to useable value
    if (typeof this.options.tile_ratio === 'string') {
      var ratio = this.options.tile_ratio.split(':');
      ratio[0] = parseInt(ratio[0], 10);
      ratio[1] = parseInt(ratio[1], 10);
      var calcRatio = ratio[0] / ratio[1];
      this.options.tile_ratio = calcRatio;
    }
    this.element = document.getElementById(this.options.selector);
    this.data = [];
    var data = this.element.getElementsByTagName('*'), i;
    for (i in data) {
      if((' ' + data[i].className + ' ').indexOf(' ' + this.options.tileSelector + ' ') > -1) {
        this.data.push(data[i]);
      }
    }
    // array of false
    var arr = [];
    for (var i = 0; i < this.options.cols; i++) {
      var row = [];
      for (var j = 0; j < this.options.cols; j++) {
        row[j] = false;
       }
       arr[i] = row;
    }
    this.grid = arr;
    this.data_index = 0;
    this.index_offset = 0;
    this.populatedElements = {};
    this.backfill = {};
    this.positionalData(false, {
        col: 0
      , row: 0
    });
    // layout the grid
    this.createGrid();
  },
  tileSize: function() {
    var size = this.data[this.data_index].dataset.gridSize;
    var maxCols = this.options.cols;
    if (size > maxCols) {
      size = maxCols;
    }
    return size;
  },
  positionalData: function(backfill, data) {
    if (backfill === undefined) { backfill = false; }
    // which set of data to use, base or backfill
    var data_set;
    backfill ? data_set = this.backfill : data_set = this;
    // when passed data we can assume we are storing the data
    if (data) {
      // setter
      if (data.col !== undefined) { data_set.col = data.col; }
      if (data.row !== undefined) { data_set.row = data.row; }
      if (data.base !== undefined) { data_set.base = data.base; }
      return this;
    } else {
      // getter
      var p_data = {};
      p_data.col = data_set.col;
      p_data.row = data_set.row;
      if (backfill) {
        p_data.base = data_set.base;
      }
      return p_data;
    }
  },
  createGrid: function() {
    while (this.data_index < this.data.length) {
      //console.log('data_index: ' + this.data_index);
      //console.log('row: ' + this.row + ' col: ' + this.col);
      //this.consoleGrid();
      if (this.checkGrid()) {
        this.setPositionData();
        this.updateMap();
        // get tile size before resetting data index as we need
        // the last placed tiles size to decide if we backfill
        var tile_size = this.tileSize();
        this.resetDataIndex();
        var moreTiles = this.data_index < this.data.length;
        if (tile_size > 1 && this.col > 0 && moreTiles) {
          this.doBackfill(tile_size - 1);
        }
        if (this.data.length > 0 && moreTiles) {
          this.updatePosition();
        }
      }
    }
    this.layoutGrid();
  },
  checkGrid: function(backfill) {
    if (backfill) {
      var action = this.updatePosition(backfill);
      if (action === 'filled') {
        return false;
      }
    }
    var place = false;
    while (!place) {
        var tile_size = this.tileSize();
        if (tile_size === 1) {
          place = true;
        } else {
          if (this.checkSurround(backfill)) {
            place = true;
          } else {
            // tile doesn't fit we will have to find one that does
            var itemFound = false;
            while (!itemFound) {
              if (this.data_index < this.data.length - 1) {
                // find next unplaced item
                this.data_index++;
                this.index_offset++;
                var state = this.populatedElements[this.data_index];
                if (!state) {
                  //console.log('tile dont fit trying index:' + this.data_index);
                  itemFound = true;
                }
              } else {
                //console.log('nothing fits');
                if (backfill) {
                  return false;
                } else {
                  // find first unplaced item
                  var found = false;
                  for (var i = 0; i < this.data.length; i++) {
                    if (!this.populatedElements[i]) {
                      this.data_index = i;
                      this.index_offset = 0;
                      found = true;
                      //console.log('found unplaced item at index ' + this.data_index);
                      break;
                    }
                  }
                  if (!found) {
                    //console.log('theres no unplaced items');
                    this.data_index = this.data.length;
                    return false;
                  }
                  // increment col or set new row
                  if (this.col < this.options.cols) {
                    this.col += 1;
                  } else {
                    this.col = 0;
                    this.row += 1;
                  }
                  return false;
                }
              }
            }
          }
        }
    }
    return this;
  },
  checkSurround: function(backfill) {
    var p_data = this.positionalData(backfill);
    var tile_size = this.tileSize();
    var cutoff_col;
    if (backfill) {
      // when backfilling do not fill past column that last tile was placed at
      cutoff_col = this.col;
    } else {
      // do not place tiles off the grid
      cutoff_col = this.options.cols;
    }
    var clear = true;
    for (var i = 0; i < tile_size; i++) {
      for (var j = 0; j < tile_size; j++) {
        if (this.grid[p_data.row + i][p_data.col + j] || p_data.col + i >= cutoff_col) {
          clear = false;
        }
      }
    }
    return clear;
  },
  setPositionData: function(backfill) {
    // only place if valid asset
    if (this.data_index < this.data.length) {
      var p_data = this.positionalData(backfill);
      var tile_size = this.tileSize();
      var tile_ratio = this.options.tile_ratio;
      var col_width = 100 / this.options.cols;
      var tile_width = col_width * tile_size; // tile width in %
      var tile_left = p_data.col * col_width;
      var percentRatio = (1 / tile_ratio) * 100;
      // Create HTML element for tile
      var newTile = document.createElement('li');
      this.data[this.data_index].setAttribute('data-grid-row', p_data.row);
      this.data[this.data_index].setAttribute('data-grid-col', p_data.col);
      this.data[this.data_index].style.width = tile_width + '%';
      this.data[this.data_index].style.left = tile_left + '%';
      // set height spacer to create height based on ratio
      var child = this.element.getElementsByTagName('*'), i;
      for (i in child) {
        if((' ' + child[i].className + ' ').indexOf(' ' + 'height-spacer' + ' ') > -1) {
          child[i].setAttribute('style', 'padding-top:' + percentRatio + '%;')
        }
      }
    }
    return this;
  },
  updateMap: function(backfill) {
    var p_data = this.positionalData(backfill);
    var tile_size = this.tileSize();
    var col = p_data.col;
    var row = p_data.row;
    for (var i = 0; i < tile_size; i++) {
      for (var j = 0; j < tile_size; j++) {
        this.grid[row + i][col + j] = true;
      }
    }
    // print map to console
    //this.consoleGrid();
    return this;
  },
  resetDataIndex: function() {
    var elementCount = 0;
    var elems = this.element.getElementsByTagName('*'), i;
    for (i in elems) {
      if((' ' + elems[i].className + ' ').indexOf(' ' + this.options.tileSelector + ' ') > -1) {
        elementCount++;
      }
    }
    this.populatedElements[this.data_index] = true;
    // find first unplaced tile
    var found = false;
    for (var i = 0; i < this.data.length; i++) {
      if (!this.populatedElements[i]) {
        this.data_index = i;
        this.index_offset = 0;
        found = true;
        break;
      }
    }
    if (!found) {
      // all items are placed
      this.data_index = this.data.length;
    }
    //console.log('---- next data_index: ' + this.data_index);
    return this;
  },
  updatePosition: function(backfill) {
    // update positional references
    var p_data = this.positionalData(backfill);
    var tile_size = this.tileSize();
    var col = p_data.col;
    var row = p_data.row;
    var cutoff_col;
    if (backfill) {
      // when backfilling do not fill past column that last tile was placed at
      cutoff_col = this.col;
      // correct so we check for 0 instead of 1 first time round
      col -= 1;
    } else {
      // do not place tiles off the grid
      cutoff_col = this.options.cols;
    }
    // find next empty cell
    var searchEmpty = true;
    while (searchEmpty) {
      col += 1;
      if (col >= cutoff_col) {
        if (backfill) {
          if (row === p_data.base) {
            // we have reached the bottom of the backfill time to stop backfilling
            return 'filled';
          }
        } else {
          // expand array
          var newRow = [];
          for (var i = 0; i < this.options.cols; i++) {
            newRow.push(false);
          }
          this.grid.push(newRow);
        }
        col = 0;
        row += 1;
      }
      if (!this.grid[row][col]) {
        // update new position
        this.positionalData(backfill, {
            col: col
          , row: row
        });
        searchEmpty = false;
      }
    }
    return this;
  },
  doBackfill: function(fill_size) {
    var fill_row = this.row;
    // set backfill data
    this.positionalData(true, {
        col: 0
      , row: fill_row + 1
      , base: fill_row + fill_size
      , fill_size: fill_size
    });
    //console.log('data_index: ' + this.data_index);
    //console.log('row: ' + this.backfill.row + ' col: ' + this.backfill.col);
    //this.consoleGrid();
    // loop until backfill complete
    var doFill = true;
    while (doFill) {
      var doFill = this.checkGrid(true);
      if (doFill) {
        this.setPositionData(true);
        this.updateMap(true);
        this.resetDataIndex(); // backfill independent
        this.updatePosition(true);
      }
    }
  },
  layoutGrid: function() {
    var parentElem = this.element;
    var elems = parentElem.getElementsByTagName('*'), i;
    for (i in elems) {
      if((' ' + elems[i].className + ' ').indexOf(' ' + this.options.tileSelector + ' ') > -1) {
        var ele = elems[i];
        var tile_row = ele.getAttribute('data-grid-row');
        var row_height = (parentElem.getElementWidth() / this.options.cols) / this.options.tile_ratio;
        var top_offset = row_height * tile_row;
        // Position tiles
        ele.style.top = top_offset + 'px';
      }
    }

  },
  consoleGrid: function() {
    // debugging function for watching what square have been filled
    var grid = this.grid;
    var gridStr = '';
    gridStr += String.fromCharCode(9556);
    for (var i = 0; i < grid[0].length; i++) {
      gridStr += String.fromCharCode(9552) + String.fromCharCode(9552) + String.fromCharCode(9552);
      (i === grid[0].length - 1) ? gridStr += String.fromCharCode(9559): gridStr += String.fromCharCode(9574);
    }
    gridStr += '\n';
    for (var i = 0; i < grid.length; i++) {
      gridStr += String.fromCharCode(9553);
      for (var j = 0; j < grid[i].length; j++) {
        if (grid[i][j]) {
          gridStr += ' X ' + String.fromCharCode(9553);
        } else {
          gridStr += '   ' + String.fromCharCode(9553);
        }
      }

      (i === grid.length - 1) ? null: gridStr += '\n' + String.fromCharCode(9568);
      for (var j = 0; j < grid[i].length; j++) {
        if (i !== grid.length - 1) {
          gridStr += String.fromCharCode(9552) + String.fromCharCode(9552) + String.fromCharCode(9552);
          (j === grid[0].length - 1) ? gridStr += String.fromCharCode(9571): gridStr += String.fromCharCode(9580);
        }
      }
      gridStr += '\n';
    }
    gridStr += String.fromCharCode(9562);
    for (var i = 0; i < grid[0].length; i++) {
      gridStr += String.fromCharCode(9552) + String.fromCharCode(9552) + String.fromCharCode(9552);
      (i === grid[0].length - 1) ? gridStr += String.fromCharCode(9565): gridStr += String.fromCharCode(9577);
    }
    console.log(gridStr);
    // 9556: ╔ ;   9552: ═ ;   9574: ╦ ;   9559: ╗ ;   9553: ║ ;   9568: ╠ ;   9580: ╬ ;   9571: ╣ ;   9562: ╚ ;   9577: ╩ ;   9565: ╝ ;
  }
};