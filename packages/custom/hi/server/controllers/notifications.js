var request = require('request'),
    lcconfig = require('meanio').loadConfig().letschat,
    Q = require('q'),
    fs = require('fs');

exports.send = function(req, res) {
    var options = {
        url: lcconfig.host + ':' + lcconfig.port + '/rooms/' + req.params.room + '/messages',
        headers: {
            "Authorization": "Bearer " + lcconfig.token
        },
        json: {
            "text": req.params.text
        },
        method: "POST"
    };

    request(options, function(error, body, response) {
        res.send(response);
    });
};

exports.sendFromApi = function(params) {
    var deferred = Q.defer();
    var options = {
        url: lcconfig.host + ':' + lcconfig.port + '/rooms/' + params.room + '/messages',
        headers: {
            "Authorization": "Bearer " + lcconfig.token
        },
        json: {
            "text": params.entityType + ' ' + params.title + ' was ' + params.method
        },
        method: "POST"
    };
    request(options, function(error, response, body) {
        if (response.body.errors || error)
            deferred.reject(response.body.errors || error);
        else
            deferred.resolve(response);
    });
    return deferred.promise;
};


exports.sendFile = function(params) {

    var deferred = Q.defer();
    var fileOptions = {
        url: lcconfig.host + ':' + lcconfig.port + '/rooms/' + params.room + '/files',
        headers: {
            "Authorization": "Bearer " + lcconfig.token,
            'Content-Type': 'multipart/form-data'
        },
        method: "POST"
    };

    var messageOptions = {
        url: lcconfig.host + ':' + lcconfig.port + '/rooms/' + params.room + '/messages',
        headers: {
            "Authorization": "Bearer " + lcconfig.token
        },
        json: {
            "text": 'New attachment added to ' + params.issue + ' ' + params.title
        },
        method: "POST"
    };

    request(messageOptions, function(error, response, body) {
        if (response.body.errors || error)
            deferred.reject(response.body.errors || error);
        else
            var rqst = request(fileOptions, function(error, response, body) {
                if (error) {
                    deferred.reject(error);
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
    });

    return deferred.promise;
}