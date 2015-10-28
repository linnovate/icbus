/**
 * Created by shoshi on 10/19/15.
 */
var letschatConfig = require('meanio').loadConfig().letschat,
    request = require('request');

exports.proxy = function(req, res) {
    var options = {
        method: req.method,
        form: req.body,
        cmd: req.url.replace('/api/hi', '')
    };

    if(options.cmd === '/users')
        options.cmd = '/account/register';
    else if( options.cmd.indexOf('owner') != -1 ) {
        options.form.owner = options.cmd.match(/[^/]*$/, '')[0];
        options.cmd = options.cmd.replace(/owner[/][^/]*$/, '');

    }

    exports.talkToHi(options, function(data, statusCode) {
        res.status(statusCode);
        res.json(data);
    });

};

exports.talkToHi = function(options, callback) {

    var objReq = {
        uri: letschatConfig.uri + options.cmd,
        method: options.method,
        headers: {}
    };

    if(options.cmd != '/account/register')
        objReq.headers['Authorization'] = "Bearer " + letschatConfig.token;

    if (options.form) {
        objReq.form = options.form;
        objReq.headers['Content-Type'] = 'multipart/form-data';
    }

    request(objReq, function(error, response, body) {
        if (!error && response.body.length && response.statusCode < 300) {
            return callback(JSON.parse(body), response.statusCode);
        }
        callback(error ? error : body, response ? response.statusCode : 500);

    });
}