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
    else if(req.params.owner) {
        options.form.owner = req.params.owner;
        options.cmd = options.cmd.replace(/[^/]*$/, '');
    }

    exports.talkToHi(options, function(data, statusCode) {
        res.status(statusCode);
        res.json(data);
    });

};

exports.talkToHi = function(options, callback) {

    var cmd_api = (options.param) ? options.cmd + '/' + options.param : options.cmd;
    var objReq = {
        uri: letschatConfig.uri + cmd_api,
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