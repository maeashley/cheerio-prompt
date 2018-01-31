/*eslint-env node, es6*/
/*eslint no-console:0*/
/*eslint no-unused-vars:1*/
//get a list of images missing alt text, then for each missing alt text, insert a new alt text to the html file
var cheerio = require('cheerio'),
    fs = require('fs'),
    prompt = require('prompt'),
    pathLib = require('path'),
    noAltImgs = [],
    htmlFiles = [],
    currentPath = '.';
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
        }
    });
/*for each html file,*/
var myNewVar = htmlFiles.reduce(function (alts, file) {
    //parse the html with cheerio
    var $ = cheerio.load(file.contents),
        images = $('img');
    images.each(function (i, image) {
        console.log('IMAGE OBJ', image)
        var alt = image.attr('alt')
        if (!alt || alt === '') {
            //find the alt attributes from the images and make a list of them
            noAltImgs.images.push({
                //find the file that the image is associated with. might need to use path stuff
                image: image.file,
                alt: ''
            });
        }
    })
}, [])
//for every obj? (which represents a file), prompt user for missing alt attr
//user inputs alt attribute specific to that image, but different files

//retrieve the htmls back from cheerio
/*var contents = $.html();*/
//make a new directory to store these html files
//push the html files to the new directory
