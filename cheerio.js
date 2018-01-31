#! /usr/bin/env node

/*eslint-env node, es6*/
/*eslint no-console:0*/
/*eslint no-undef:0 */
/*eslint no-unused-vars:0*/
//get a list of images missing alt text, then for each missing alt text, insert a new alt text to the html file
var cheerio = require('cheerio'),
    asyncLib = require('async'),
    fs = require('fs'),
    prompt = require('prompt'),
    pathLib = require('path'),
    noAltImgs = [],
    htmlFiles = [],
    currentPath = '.',
    $;

function getAllPages(getAllPagesCb) {
    /*retrieve all the html files from the export*/
    htmlFiles = fs.readdirSync(currentPath)
        .filter(function (file) {
            return pathLib.extname === '.html';
        })
        .map(function (file) {
            var path = pathLib.resolve(currentPath, file),
                contents = fs.readFileSync(path, 'utf8');
            return {
                file: path,
                contents: contents
            };
        });
    getAllPagesCb(null, htmlFiles);
}

function pagesToImageObjs(pages, pagesToImgObjCb) {
    /*for each html file,*/
    htmlFiles.reduce(function (alts, file) {
        //parse the html with cheerio
        var $ = cheerio.load(file.contents),
            images = $('img');
        if (images.length === 0) {
            pagesToImgObjCb(null, pages);
        }
        images.each(function (i, image) {
            console.log('IMAGE OBJ', image);
            var alt = image.attr('alt');
            if (!alt || alt === '') {
                // make a list of the alt attributes
                var src = image.attr('src'),
                    split = src.split('/'),
                    source = split[0] + '/' + split[split.length - 1];
                console.log('SOURCE', source);
                noAltImgs.images.push({
                    //find the file that the image is associated with
                    imageFile: source,
                    alt: ''
                });
            }
        });
        console.log('noAltImages', noAltImgs);
        pagesToImgObjCb(null, pages, noAltImages);
    }, []);
}

//this function is the most complicated
function runPrompt(pages, noAltImages, promptCb) {
    //you have a collection of images,
    var indvImages = [{
        type: 'string',
        description: 'Please enter alt text for the image ' + JSON.stringify(image),
        required: true,
        message: 'alt text must be a string.'

    }];

    // iterate over the images and do the prompt thing.
    function promptUser() {
        prompt.get(indvImages, function (err, newImageObj) {
            if (err) {
                console.log('prompt.get ERR', err);
                return;
            }
            newImageObj = {
                imageFile: result.name,
                newAlt: result.description
            };
        });
    }
    asyncLib.each(noAltImgs, promptUser, function (err) {
        if (err) {
            runPrompt(err);
            return;
        }
        promptCb(null, pages, noAltImages, newImageObj);
    });
}

function changeAltsHtml(pages, noAltImages, changeAltsHtmlCb) {
    pages.forEach(function (page, i) {
        var $ = cheerio.load(page.contents);
        //find the matching image from noAltImages
        image = noAltImages[i];
        if (image.imageFile === imageObj.imageFile) {
            //add newAlt to the image.alt on the obj from noAltImages
            image.alt = imageObj.newAlt;
        }
    });
    changeAltsHtmlCb(null, pages);
}

asyncLib.waterfall([getAllPages, pagesToImageObjs, runPrompt, changeAltsHtml], function (err, pages) {
    if (err) {
        console.log(err);
        return;
    }
    //retrieve the htmls back from cheerio
    var contents = $.html(),
        filename = pages[i].name,
        newPath = currentPath + '\\' + 'updatedFiles' + filename;
    //make a new directory to store these html files
    fs.mkDirSync(newPath);
    fs.writeFileSync(newPath, contents);
});
prompt.start();