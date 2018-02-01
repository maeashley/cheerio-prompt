#!/usr/bin / env node

/*eslint-env node, es6*/
/*eslint no-console:0*/
/*eslint no-undef:1 */
/*eslint no-unused-vars:0*/
//get a list of images missing alt text, then for each missing alt text, insert a new alt text to the html file
var cheerio = require('cheerio'),
    asyncLib = require('async'),
    fs = require('fs'),
    prompt = require('prompt'),
    pathLib = require('path'),
    noAltImgs = [],
    htmlFiles = [],
    currentPath = pathLib.resolve('.'),
    $;

function getAllPages(getAllPagesCb) {
    /*retrieve all the html files from the export*/
    htmlFiles = fs.readdirSync(currentPath)
        .filter(function (file) {
            return file.includes('.html');
        })
        .map(function (file) {
            var path = file,
                contents = fs.readFileSync(path, 'utf8');
            return {
                file: path,
                contents: contents
            };
        });
    getAllPagesCb(null, htmlFiles);
}

function pagesToImageObjs(pages, pagesToImgObjCb) {
    htmlFiles.reduce(function (alts, file) {
        //parse the html with cheerio
        $ = cheerio.load(file.contents);
        var images = $('img');
        if (images.length === 0) {
            pagesToImgObjCb(null, pages);
        }
        images.each(function (i, image) {
            image = $(image);
            var alt = image.attr('alt');
            if (!alt || alt === '') {
                // make a list of the alt attributes
                var src = image.attr('src'),
                    split = src.split('/'),
                    source = split[0] + '/' + split[split.length - 1];
                noAltImgs.push({
                    //find the file that the image is associated with
                    imageFile: source,
                    alt: '',
                    description: 'Please enter alt text for the image ' + source,
                    type: 'string',
                    message: 'Alt text must be a string.'
                });
            }
        });
        pagesToImgObjCb(null, pages, noAltImgs);
    }, []);
}

//this function is going to be the most complicated
function runPrompt(pages, noAltImgs, promptCb) {
    // iterate over the images and prompt for alt text
    var newImgObj;

    function promptUser(getCallback) {
        prompt.get(noAltImgs, function (err, result) {
            if (err) {
                console.log('prompt.get ERR', err);
                return;
            }
            newImgObj = {
                imageFile: result.name,
                newAlt: result.description
            };
            getCallback(newImgObj);
        });
    }

    //I think the results of the prompt will have to get pushed to a different array
    asyncLib.each(noAltImgs, promptUser, function (err) {
        if (err) {
            promptCb(err);
            return;
        }
        promptCb(null, pages, noAltImgs, newImgObj);
    });
}

function changeAltsHtml(pages, noAltImgs, changeObj, changeAltsHtmlCb) {
    //iterate through the images in each file and change the alt based on the prompt.
    //need to use a reduce for this...
    pages.reduce(function (newPages, page) {
        $ = cheerio.load(page.contents);
        //find the matching image from array
        var images = $('img');
        if (images.length === 0) {
            changeAltsHtmlCb(null, pages);
        }
        images.each(function (image) {
            image = $(image);
            if (image.imageFile === changeObj.imageFile) {
                //add newAlt to the image.alt on the obj from noAltImages
                image.alt = changeObj.newAlt;
            }
            changeAltsHtmlCb(null, pages);
        });
    }, []);
}

asyncLib.waterfall([getAllPages, pagesToImageObjs, runPrompt, changeAltsHtml], function (err, pages) {
    if (err) {
        console.log(err);
        return;
    }
    console.log(pages.length);
    /*retrieve the htmls back from cheerio/
    var contents = $.html(),
        //not sure how to get the individual page to get the file name
        newPath = pathLib.resolve(currentPath, '\\' + 'updatedFiles' + page);
    //make directory and push files
    fs.mkDirSync(newPath);
    fs.writeFileSync(newPath, contents);*/
});
prompt.start();