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
            name: room.name || room.title,
            slug: room.slug || room.name || room.title,
            description: room.description || '',
            isExternal: true
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

exports.createForProject  = function(project, callback) {
    console.log('createForProject')
    var options = {
        url : lcconfig.host +':' + lcconfig.port +'/rooms',
        headers : {
            "Authorization":"Bearer " + lcconfig.token
        },
        json: {
            name: project.title,
            slug: project.title.toLowerCase().replace(/[^a-z0-9 ]/gi,'').trim().replace(/ /g, '_'),
            isExternal: true
        },
        method: "POST"
    };
    request(options, function(error, response, body) {
        if (response.body.errors) {
            return res.status(500).json({
                error: response.body.errors
            });
        }
        callback(body.id);
    });
}

exports.all = function(req, res) {
    var options = {
        url : lcconfig.host +':' + lcconfig.port +'/rooms',
        headers : {
            "Authorization":"Bearer " + lcconfig.token
        },
        method: "GET"
    };
    request(options, function(error, response, body) {
        if (response.body.errors) {
            return res.status(500).json({
                error: response.body.errors
            });
        }
        res.json(JSON.parse(body));
    });
}
