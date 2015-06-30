var request = require('request'),
    lcconfig = require('meanio').loadConfig().letschat;

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
    var options = {
        url : lcconfig.host +':' + lcconfig.port +'/rooms/'+ params.room +'/messages',
        headers : {
            "Authorization":"Bearer " + lcconfig.token
        },
        json: {
            "text":params.entityType+' '+ params.entity._id + ' was ' +  params.method +'d'
        },
        method: "POST"
    };
    request(options, function(error, body, response) {
        return response;
    });


};
