var request = require('request'),
    lcconfig = require('meanio').loadConfig().letschat;

exports.create = function(req, res) {
    var options = {
        url : lcconfig.host +':' + lcconfig.port +'/rooms/'+ req.params.app.name +'/messages',
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
