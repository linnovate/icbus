var request = require('request'),
    lcconfig = require('meanio').loadConfig().letschat,
    Q = require('q'),
    fs = require('fs'),
    rooms = require('./rooms');

exports.send = function(req, res) {
    rooms.getUsername(req.user.email)
        .then(function(user){
            var params = {
                message: req.body.message,
                room: req.params.room,
                owner: user.id
            };
            exports.sendMessage(params)
                .then(function(response){
                    res.send(response);
                });
        });
};

exports.sendMessage = function(params) {
    var deferred = Q.defer();
    var options = {
        url: lcconfig.uri + '/rooms/' + params.room + '/messages',
        headers: {
            "Authorization": "Bearer " + lcconfig.token
        },
        json: {
            text: params.message,
            owner: params.owner
        },
        method: "POST"
    };

    request(options, function(error, response, body) {

        if (response.body.errors || error)
            deferred.reject(response.body.errors || error);
        else {
            deferred.resolve(response.body);
        }
    });

    return deferred.promise;
};


exports.sendFile = function(params) {

    var deferred = Q.defer();
    var fileOptions = {
        url: lcconfig.uri + '/rooms/' + params.room + '/files',
        headers: {
            "Authorization": "Bearer " + lcconfig.token,
            'Content-Type': 'multipart/form-data'
        },
        method: "POST"
    };

    var messageOptions = {
        url: lcconfig.uri + '/rooms/' + params.room + '/messages',
        headers: {
            "Authorization": "Bearer " + lcconfig.token
        },
        json: {
            "text": 'New attachment added to ' + params.issue + ' ' + params.title
        },
        method: "POST"
    };

    request(messageOptions, function(error, response, body) {
        if (response && response.body.errors || error) {
            console.log(response ? response.body.errors : error)
            deferred.reject(response ? response.body.errors : error);
        } else {
            var rqst = request(fileOptions, function(error, response, body) {
                if (error || body === 'Bad Request') {
                    console.log(error || body);
                    deferred.reject(error || body);
                } else {
                    messageOptions.json.text = 'upload://' + JSON.parse(body).url;
                    request(messageOptions, function(error, response, body) {
                        if (response.body.errors || error) {
                            deferred.reject(response.body.errors || error);
                        } else {
                            deferred.resolve(response);
                        }
                    });

                }
            });
            var form = rqst.form();
            form.append('file', fs.createReadStream(params.path));
        }
    });

    return deferred.promise;
};