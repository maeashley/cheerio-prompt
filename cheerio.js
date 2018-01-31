/*eslint-env node, es6*/
/*eslint no-console:0*/
/*eslint no-undef:0 */
/*eslint no-unused-vars:0 */
/*eslint vars-on-top:0 */
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
        };
    });
/*for each html file,*/
var myNewVar = htmlFiles.reduce(function (alts, file) {
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
//for every obj (which represents a file), 
var indvImages = [{
        name: images[i].imageFile,
        //^^I don't know if this will work with the index
        type: string,
        description: 'Please submit alt text for this image',
        //prompt user for missing alt attr
        required: true,
        message: 'alt text must be a string.'

    }],
    images = noAltImgs.map(function (image) {
        return image;
    });
prompt.get(indvImages, function (err, result) {
    if (err) {
        console.log(err);
        return;
    }
    var newImageObj = {
        imageFile: result.name,
        newAlt: result.description
    };
    changeAlt(newImageObj);
});
//make the changes to the html files
function changeAlt(imageObj) {
    //not sure if this property will load the body
    var $ = cheerio.load(imageObj.imageFile.contents),
        //find the matching image from noAltImages
        image = noAltImages[i];
    if (image.imageFile === imageObj.imageFile) {
        //add newAlt to the image.alt on the obj from noAltImages
        image.alt = imageObj.newAlt;
    }
}
//change the alt on each actual html file
//retrieve the htmls back from cheerio
var contents = $.html(),
    newPath = currentPath + '\\' + updatedFiles + file;
//make a new directory to store these html files
fs.mkDirSync(newPath);
fs.writeFileSync(newPath, contents);
prompt.start();