var request = require('request'),
    lcconfig = require('meanio').loadConfig().letschat,
    _ = require('lodash');

exports.create = function(req, res) {
    var room = {};
    if (req.application){ //after create application
        room.name = req.application.name;
    }
    else{
        room = _.extend(room, req.body);
    }
    var options = {
        url : lcconfig.host +':' + lcconfig.port +'/rooms',
        headers : {
            "Authorization":"Bearer " + lcconfig.token
        },
        json: {
            name: room.name,
            slug: room.slug || room.name,
            description: room.description || ''
        },
        method: "POST"
    };

    request(options, function(error, response, body) {
        if (response.body.errors) {
            return res.status(500).json({
                error: response.body.errors
            });
        }
        if (req.application){
            res.json(req.application);
        }
        else{
            res.json(body);
        }

    });

};
