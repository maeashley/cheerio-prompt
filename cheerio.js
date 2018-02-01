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
    console.log('files:', htmlFiles.length);
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
                    alt: ''
                });
            }
        });
        pagesToImgObjCb(null, pages, noAltImgs);
    }, []);
}

//this function is going to be the most complicated
function runPrompt(pages, noAltImgs, promptCb) {
    var images = noAltImgs.map(function (file) {
        return file.imageFile;
    });

    var indvImages = [{
        type: 'string',
        //try to get the individual image
        description: 'Please enter alt text for the image ' + images.imageFile,
        required: true,
        message: 'alt text must be a string.'

    }];
    // iterate over the images and do the prompt thing.
    function promptUser(getCallback) {
        prompt.get(indvImages, function (err, newImageObj) {
            if (err) {
                // console.log('prompt.get ERR', err);
                return;
            }
            newImageObj = {
                imageFile: newImageObj.name,
                newAlt: newImageObj.description
            };
            getCallback(newImageObj);
        });
    }
    asyncLib.each(images, promptUser, function (err) {
        if (err) {
            promptCb(err);
            return;
        }
        promptCb(null, pages, images /* , newImageObj */ );
    });
}

function changeAltsHtml(pages, noAltImgs, changeAltsHtmlCb) {
    //iterate through the files and change the alt based on the prompt.
    pages.forEach(function (page, i) {
        $ = cheerio.load(page.contents);
        //find the matching image from array
        var image = noAltImgs[i];
        if (image.imageFile /*  === imageObj.imageFile */ ) {
            //add newAlt to the image.alt on the obj from noAltImages
            // image.alt = imageObj.newAlt;
        }
    });
    changeAltsHtmlCb(null, pages);
}

asyncLib.waterfall([getAllPages, pagesToImageObjs, runPrompt, changeAltsHtml], function (err, pages) {
    if (err) {
        // console.log(err);
        return;
    }
    //writing this console to get rid of errors
    console.log(pages.length);
    //retrieve the htmls back from cheerio
    /* var contents = $.html(),
        filename = pages[i].name,
        newPath = currentPath + '\\' + 'updatedFiles' + filename; */
    //make a new directory to store these html files
    /* fs.mkDirSync(newPath);
    fs.writeFileSync(newPath, contents); */
});
prompt.start();