#! /usr/bin/env node

/*eslint-env node, es6*/
/*eslint no-console:0*/
/*eslint no-undef:0 */
/*eslint no-unused-vars:0 */
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
    if (err) {
        getAllPages(err);
        return;
    }
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
    if (err) {
        pagesToImgObjCb(err);
        return;
    }
    /*for each html file,*/
    var imageObjects = htmlFiles.reduce(function (alts, file) {
        //parse the html with cheerio
        var $ = cheerio.load(file.contents),
            images = $('img');
        images.each(function (i, image) {
            console.log('IMAGE OBJ', image);
            var alt = image.attr('alt');
            if (!alt || alt === '') {
                //find the alt attributes from the images and make a list of them
                var src = image.attr('src'),
                    split = src.split('/'),
                    source = split[0] + '/' + split[split.length - 1];
                console.log('SOURCE', source);
                noAltImgs.images.push({
                    //find the file that the image is associated with. might need to use path stuff
                    imageFile: source,
                    alt: ''
                });
            }
        });
    }, []);
    pagesToImgObjCb(null, imageObjects);
}

function runPrompt(pages, imageObjs, promptCb) {
    if (err) {
        promptCb(err);
        return;
    }
    //for every obj (which represents a file), 
    console.log('noAltImages using the foreach', noAltImgs);
    var getIndvImg = noAltImgs.forEach(function (image, i) {
        console.log('IMAGE:', image);
        console.log('IMAGE name', image.imageFile);
        return image;
    });

    var indvImages = [{
        type: 'string',
        description: 'Please enter alt text for the image ' + JSON.stringify(getIndvImg),
        required: true,
        message: 'alt text must be a string.'

    }];
    console.log('getIndvImg', getIndvImg);
    prompt.get( /*indvImages,*/ function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        var newImageObj = {
            imageFile: result.name,
            newAlt: result.description
        };
    });
    promptCb(null, pages, newImageObj);
}

function changeAltsHtml(pages, imageObject, changeAltsHtmlCb) {
    if (err) {
        changeAltsHtml(err);
        return;
    }
    //not sure if this property will load the body
    //find the matching image from noAltImages
    image = noAltImages[i];
    if (image.imageFile === imageObj.imageFile) {
        //add newAlt to the image.alt on the obj from noAltImages
        image.alt = imageObj.newAlt;
    }
    changeAltsHtmlCb(null, );
}

asyncLib.waterfall([getAllPages, pagesToImageObjs, runPrompt, changeAltsHtml], function (err, result) {
    if (err) {
        console.log(err);
        return;
    }
    //retrieve the htmls back from cheerio
    // var contents = $.html(),
    //var filename = file.name,
    //var newPath = currentPath + '\\' + 'updatedFiles' + filename;
    //make a new directory to store these html files
    //fs.mkDirSync(newPath);
    //fs.writeFileSync(newPath, contents);
    prompt.start();
});