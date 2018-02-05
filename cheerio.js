#!/usr/bin / env node

/*eslint-env node, es6*/
/*eslint no-console:0*/
/*eslint no-undef:1 */
/*eslint no-unused-vars:1*/
//get a list of images missing alt text, then for each missing alt text, insert a new alt text to the html file
var cheerio = require('cheerio'),
    asyncLib = require('async'),
    fs = require('fs'),
    prompt = require('prompt'),
    pathLib = require('path'),
    currentPath = pathLib.resolve('.'),
    chalk = require('chalk');

function getAllPages(getAllPagesCb) {
    //retrieve all the html files from the files
    var htmlFiles = fs.readdirSync(currentPath)
        .filter(function (file) {
            return file.includes('.html');
        })
        .map(function (file) {
            return {
                file: file,
                contents: fs.readFileSync(file, 'utf8')
            };
        });
    getAllPagesCb(null, htmlFiles);
}

function pagesToImageObjs(htmlFiles, pagesToImgObjCb) {
    var alts = {
        noAltImgs: [],
        questions: []
    };

    //don't need to catch the reduce contents because you're editing the obj thats being passed
    htmlFiles.reduce(function (alts, file) {
        //parse the html with cheerio
        file.dom = cheerio.load(file.contents);
        var images = file.dom('img');
        file.images = images.each(function (i, image) {
            image = file.dom(image);
            var alt = image.attr('alt');
            if (alts.questions.length < 30 && (!alt || alt === '')) {
                // make a list of the alt attributes
                var src = image.attr('src'),
                    //convert to url
                    split = src.split('/'),
                    source = pathLib.resolve(split[0], '/' + split[split.length - 1]),
                    filename = split[split.length - 1];
                //push each individual image question
                alts.questions.push({
                    //need the alt obj because results returns an obj
                    name: 'alt' + alts.questions.length,
                    description: chalk.green('Please enter alt text for the image ' + filename + '(' + file.file + ')'),
                    type: 'string',
                    required: true,
                    message: chalk.red('Alt text must be a string.')
                });
                //push each image obj to later match it
                alts.noAltImgs.push({
                    source: source,
                    imageFile: filename
                });
            }
        });
        return alts;
    }, alts);
    console.log(alts.noAltImgs.length);
    pagesToImgObjCb(null, htmlFiles, alts.noAltImgs, alts.questions);
}

function runPrompt(pages, noAltImgs, questions, promptCb) {
    prompt.get(questions, function (err, results) {
        if (err) {
            promptCb(err);
            return;
        }
        //move the user data to our image array objs
        noAltImgs.forEach(function (image, i) {
            image.alt = results['alt' + i];
        });
        promptCb(null, pages, noAltImgs);
    });
    prompt.start();
}

//noAltImgs array of objs now each have an alt property that needs to be on the html
function changeAltsHtml(pages, noAltImgs, changeAltsHtmlCb) {
    pages.forEach(function (page) {
        //images saved from previous search
        page.images.each(function (image, i) {
            image = page.dom(image);
            var src = image.attr('src');
            if (src) {
                //convert to pathLib...not sure if this is right
                var split = src.split('/'),
                    source = pathLib.resolve(split[0], '/' + split[split.length - 1]),
                    //check the source attr against the obj in the noAltImgs array
                    match = noAltImgs.find(function (image) {
                        return source === image.source;
                    });
                if (match) {
                    var newAlt = noAltImgs[i].alt;
                    image.attr('alt', newAlt);
                }
            }
        });
        page.html = page.dom.html();
        //could take the dom out since you're already saving it 
    });
    changeAltsHtmlCb(null, pages);
}

asyncLib.waterfall([getAllPages, pagesToImageObjs, runPrompt, changeAltsHtml], function (err, pages) {
    if (err) {
        console.log(err);
        return;
    }
    var timestamp = Date.now(),
        newPath = pathLib.resolve(currentPath, 'updatedFiles ' + timestamp);
    fs.mkdirSync(newPath);
    pages.forEach(function (page) {
        var parsedPath = pathLib.parse(page.file),
            fileName = parsedPath.name + parsedPath.ext,
            path = pathLib.join(newPath, fileName);
        fs.writeFileSync(path, page.html);
    });
    console.log(chalk.cyan('PROCESS COMPLETE! Check the "updatedFiles" folder for the new files.'));
});