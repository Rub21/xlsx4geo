var fs = require('fs');
var csv = require("fast-csv");
var path = require('path');
var numRowsAllowed = 20;

module.exports = {
  build: function(file) {
    var rows = [];
    var counterflag = 1;
    var stream = fs.createReadStream(file);
    csv.fromStream(stream, {
        headers: true
      })
      .on("data", function(data) {
        rows.push(data);
      })
      .on("end", function() {
        rows.sort(function(a, b) {
          return a.Importance - b.Importance;
        }).reverse();
        for (var i = 0; i < rows.length; i++) {
          if (i < numRowsAllowed) {
            if (rows[i].name_en) {
              console.log(rows[i].longitude + ',' + rows[i].latitude + ',' + quotation(rows[i].name_en));
            } else {
              console.log(rows[i].longitude + ',' + rows[i].latitude + ',' + quotation(rows[i].name));
            }
          }
        }
      });
  },

  full: function(dirSource, dirResult, coords) {
    var pathToFiles = fileList(dirSource);
    var flag = 0;
    togeoc(pathToFiles[flag]);
    var qlc = {};
    coords = coords.replace('[', '').replace(']', '');

    function togeoc(pathTofile) {
      var forward = {
        "options": {
          "debug": true,
          "proximity": null
        },
        "pass": "0/"
      };
      var reverse = {
        "pass": "0/"
      };
      var counterflag = 1;
      var body = '';
      var rows = [];
      var stream = fs.createReadStream(pathTofile);
      csv.fromStream(stream, {
          headers: true
        })
        .on("data", function(data) {
          rows.push(data);
        })
        .on("end", function() {

          rows.sort(function(a, b) {
            return a.Importances - b.Importance;
          }).reverse();
          for (var i = 0; i < rows.length; i++) {
            if (i < numRowsAllowed) {
              if (rows[i].name_en) {
                if ((i + 1) === numRowsAllowed || i === (rows.length - 1)) {
                  body += rows[i].longitude + ',' + rows[i].latitude + ',' + quotation(rows[i].name_en);
                } else {
                  body += rows[i].longitude + ',' + rows[i].latitude + ',' + quotation(rows[i].name_en) + '\n';
                }
              } else {
                if ((i + 1) === numRowsAllowed || i === (rows.length - 1)) {
                  body += rows[i].longitude + ',' + rows[i].latitude + ',' + quotation(rows[i].name);
                } else {
                  body += rows[i].longitude + ',' + rows[i].latitude + ',' + quotation(rows[i].name) + '\n';
                }
              }
              counterflag = i + 1;
            }
          }

          var baseFileName = path.basename(pathTofile).split('-');
          baseFileName = 'aa-poi-' + baseFileName[1] + '-' + baseFileName[2];
          fs.writeFile(path.join(dirResult, baseFileName), body, function(err) {
            if (err) return console.log(err);
            flag++;
            if (flag < pathToFiles.length) {
              togeoc(pathToFiles[flag]);
              //build json file
              forward.options.proximity = coords.split(',').map(Number);
              forward.pass += counterflag;
              reverse.pass += counterflag;
              qlc[baseFileName.split('.')[0] + '.forward'] = forward;
              qlc[baseFileName.split('.')[0] + '.reverse'] = reverse;
            } else {
              //build json file
              forward.options.proximity = coords.split(',').map(Number);
              forward.pass += counterflag;
              reverse.pass += counterflag;
              qlc[baseFileName.split('.')[0] + '.forward'] = forward;
              qlc[baseFileName.split('.')[0] + '.reverse'] = reverse;
              console.log(JSON.stringify(qlc));
            }
          });
        });
    }
  }
};

function fileList(dir) {
  return fs.readdirSync(dir).reduce(function(list, file) {
    var name = path.join(dir, file);
    var isDir = fs.statSync(name).isDirectory();
    return list.concat(isDir ? fileList(name) : [name]);
  }, []);
}

function quotation(str) {
  str = str.replace(/\"/g, '\'').replace('&#10;', '');
  return str;
}