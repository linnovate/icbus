var request = require('request'),
    lcconfig = require('meanio').loadConfig().letschat,
    Q = require('q');

exports.send = function(req, res) {
    var options = {
        url : lcconfig.host +':' + lcconfig.port +'/rooms/'+ req.params.room +'/messages',
        headers : {
            "Authorization":"Bearer " + lcconfig.token
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
        url : lcconfig.host +':' + lcconfig.port +'/rooms/'+ params.room +'/messages',
        headers : {
            "Authorization":"Bearer " + lcconfig.token
        },
        json: {
            "text":params.entityType+' '+ params.title + ' was ' +  params.method +'d'
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
