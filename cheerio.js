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
        file.images = [];
        images.each(function (i, image) {
            image = file.dom(image);
            var alt = image.attr('alt'),
                src = image.attr('src');
            // console.log('original source', src);
            if (alts.questions.length < 3 && (!alt || alt === '')) {
                // make a list of the alt attributes
                var filename = pathLib.basename(src),
                    source = pathLib.dirname(src) + '/' + filename;
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
            } else if (src.includes('Course%20Files')) {
                file.images.push(image);
            }
        });
        return alts;
    }, alts);
    console.log(chalk.magenta(' # images to name:', alts.noAltImgs.length));
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

//make the changes to the html from alt on noAltImgs[i]
function changeAltsHtml(pages, newAltImgs, changeAltsHtmlCb) {
    //helper function to change the alt text
    function changeAlt(image, newAlt) {
        image.attr('alt', newAlt);
    }
    pages.forEach(function (page) {
        //just to clean up the console printing
        // if (page.images.length !== 0) {
        //     console.log('#page ' + page.file, chalk.bgBlue('contains ' + page.images.length + ' images'));
        // }
        //images from the page object mapped previously
        page.images.forEach(function (image) {
            image = page.dom(image);
            var src = image.attr('src');
            image.source = pathLib.basename(src);
            var oldSrc = image.source;
            //check the source attr against the obj in the newAltImgs array in order to match them
            newAltImgs.forEach(function (image) {
                console.log(chalk.bgRed('OLD'), oldSrc);
                var newSrc = pathLib.basename(image.source);
                console.log(chalk.bgGreen('newSrc'), newSrc);
                if (newSrc === oldSrc) {
                    console.log(chalk.bgGreen('MATCH'));
                    changeAlt(image, image.alt);
                }
            });
        });
        page.html = page.dom.html();
        //could take the dom out since you're already saving it 
    });
    changeAltsHtmlCb(null, pages);
}
var functions = [getAllPages, pagesToImageObjs, runPrompt, changeAltsHtml];

asyncLib.waterfall(functions, function (err, pages) {
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
    console.log(chalk.cyan('PROCESS COMPLETE!'));
});