var pdiff = require('page-diff');
var fs = require('fs');
var webpage = require('webpage');
var page = webpage.create();
page.viewportSize = {
    width: 1080,
    height: 800
};
page.settings.webSecurityEnabled = false;

// page.open(url1, function(){
//     page.render('left.png');
// 	console.log("g");
//     var left = page.evaluate(pdiff.walk, walkOpt);
//     page.open(url2, function(){
// 		console.log("r");
//         page.render('right.png');
//         var right = page.evaluate(pdiff.walk, walkOpt);
//         var ret = pdiff.diff(left, right, diffOpt);
//         console.log(JSON.stringify(ret));
//         var hlOpt = {
//             diff: ret,
//             left: {
//                 rect: left.rect,
//                 title: 'old version',
//                 screenshot: 'file:///home/hungrystray/projects/jobified/left.png'
//             },
//             right: {
//                 rect: right.rect,
//                 title: 'new version',
//                 screenshot: 'file:///home/hungrystray/projects/jobified/right.png'
//             },
//             page: webpage.create()
//         };
//         pdiff.highlight(hlOpt, function(err, page){
// 			console.log("==========================here");
//             if(err){
//                 console.log('[ERROR] ' + err);
//             } else {
// 				console.log("done");
//                 page.render('/home/hungrystray/projects/jobified/diff.png');
//             }
// 			phantom.exit();
//         });
//     });
// });
var currPath = fs.workingDirectory;

function Hostname(url) {
    return /^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i.exec(url)[1];
}

function PageInit(url, opt, callback) {
    var options = opt || { operation: "GET" };
    var walkOpt = {};
    var hostname = Hostname(url);
    page.open(url, options, function() {
        var ts = Date.now();
        var dir = currPath + "/scrape/" + hostname + "/";
        var tree = page.evaluate(pdiff.walk, walkOpt);
        if (typeof(callback) == "function") {
            var data = { ts: ts, directory: dir, tree:tree, screenshot: page.renderBase64('png') };
            // page.render(dir + '/'+ ts +'.png');
            callback(data);
        }
        else {
            page.render(dir + ts + '/ss.png');
            fs.write(dir + ts + "/tree.json", JSON.stringify(tree), 'w');
            console.log(JSON.stringify({url: url, ts: ts, op: "init", newScrape: true}));
            phantom.exit();
        }
    });
}

function PageDiff(leftTs, url, opt) {
    var options = opt || { operation: "GET" };
    var walkOpt = {};
    var diffOpt = {};
    leftTs = parseInt(leftTs);

    PageInit(url, opt, function(data) {
        var rightTs = data.ts;
        var dir = data.directory;
        var rightTree = data.tree;

        var left = JSON.parse(fs.read(dir + leftTs + "/tree.json"));
        var ret = pdiff.diff(left, rightTree, diffOpt);
        if (ret.length != 0) {
            fs.makeTree(dir + rightTs);
            // fs.move(dir + '/'+ rightTs +'.png', dir + rightTs + '/ss.png');
            fs.write(dir + rightTs + "/ss.png", atob(data.screenshot), 'b');
            fs.write(dir + rightTs + "/tree.json", JSON.stringify(rightTree), 'w');
            var hlOpt = {
                diff: ret,
                left: {
                    rect: left.rect,
                    title: new Date(leftTs).toLocaleString(),
                    screenshot: 'file://' + dir + "/" + leftTs + '/ss.png'
                },
                right: {
                    rect: rightTree.rect,
                    title: new Date(rightTs).toLocaleString(),
                    screenshot: 'file://' + dir + "/" + rightTs + '/ss.png'
                },
                page: webpage.create()
            };
            pdiff.highlight(hlOpt, function(err, page){
                if(err){
                    // console.log('[ERROR] ' + err);
                } else {
                    page.render(dir + rightTs + '/diff.png');
                    console.log(JSON.stringify({url: url, ts: rightTs, op: "diff", newScrape: true}));
                }
                phantom.exit();
            });
        }
        else {
            console.log(JSON.stringify({url: url, ts: rightTs, op: "diff", newScrape: false}));
            // fs.remove(dir + '/'+ rightTs +'.png');
            phantom.exit();
        }
    });
}

var system = require('system');
var args = system.args;
var invalid_args = true;
// args.forEach(function(arg, i) {
//     console.log(i + ': ' + arg);
// });
if (args.length != 1) {
    invalid_args = false;
    if (args[1] === "init") {
        var arg3;
        if (args.length == 4)
            arg3 = JSON.parse(args[3]);
        PageInit(args[2], arg3);
        // phantom.exit();
    }
    else if (args[1] === "diff") {
        var arg4;
        if (args.length == 5)
            arg4 = JSON.parse(args[4]);
        PageDiff(args[2], args[3], arg4);
    }
    else {
        invalid_args = true;
    }
}
if (invalid_args) {
    console.log("phantom.js: Invalid Arguments: phantomjs phantom.js (diff <oldTs> | init) url [options]");
    phantom.exit();
}
