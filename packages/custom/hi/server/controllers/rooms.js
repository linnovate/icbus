var request = require('request'),
    lcconfig = require('meanio').loadConfig().letschat,
    _ = require('lodash'),
    Q = require('q'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    notifications = require('./notifications'),
    room;


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

exports.createForProject  = function(req, res, project) {
    room  = {};
    var deferred = Q.defer();
    getOwnerUsername(req.user.email)
        .then(getWatchersUsername(project.watchers))
        .then(function(){
        var dt = new Date().toJSON();
        var options = {
            url : lcconfig.host +':' + lcconfig.port +'/rooms',
            headers : {
                "Authorization":"Bearer " + lcconfig.token
            },
            json: {
                name: project.title,
                slug: (project.title + '_' + dt).toLowerCase().replace(/[^a-z0-9 ]/gi,'').trim().replace(/ /g, '_'),
                owner: room.owner,
                isExternal: true,
                private: true,
                participants: room.participants
            },
            method: "POST"
        };
        request(options, function(error, response, body) {
            if (error || response.body.errors || body == 'Unauthorized'){
                deferred.reject(error || response.body.errors || 'Unauthorized');
            }
            else{
                notifications.sendFromApi({entityType:'project',title: project.title, method:'created', room: body.id})
                    .then(function(){
                        deferred.resolve(body.id)
                    });
            }

        });
    }, function(error){
        deferred.reject(error)
    });
    return deferred.promise;
};

function getOwnerUsername(UserEmail) {
    var deferred = Q.defer();
    getUsername(UserEmail, 'owner', false).then(function(){
        deferred.resolve();
    }, function(err){
        deferred.reject(err);
    });
    return deferred.promise;
}

function getWatchersUsername(usersArray) {
    var deferred = Q.defer();
    if (!usersArray || usersArray.length == 0) {
        deferred.resolve();
    }
    else{
        User.find({_id: {$in: usersArray}}, function (err, users) {
            if (err)
                deferred.reject(err || 'cannot find watchers');
            else{
                getParticipants(users).then(function(){
                    deferred.resolve();
                })
            }
        });
    }
    return deferred.promise;
}

function getParticipants(users) {
    var promises = [];
    users.forEach(function(item){
        promises.push(getUsername(item.email, 'participants', true));
    });
    return Q.all(promises);
}

function getUsername (userEmail, category, isArray) {
    var deferred = Q.defer();
    var options = {
        url : lcconfig.host +':' + lcconfig.port +'/users/' + userEmail,
        headers : {
            "Authorization":"Bearer " + lcconfig.token
        },
        method: "GET"
    };
    request(options, function(error, response, body) {
        if (error || response.body.errors || body == 'Unauthorized')
            deferred.reject(error || response.body.errors || 'Unauthorized');
        else{
            var user = JSON.parse(body);
            if (isArray){
                room[category] = [].concat([user.id]);
            }
            else
                room[category] = user.id;
            deferred.resolve();
        }
    });
    return deferred.promise;
}

exports.updateParticipants = function(roomId, title, watchers) {
    var deferred = Q.defer();
    room = {};
    getWatchersUsername(watchers)
        .then(function() {
            var options = {
                url : lcconfig.host +':' + lcconfig.port +'/rooms/' + roomId ,
                headers : {
                    "Authorization":"Bearer " + lcconfig.token
                },
                json: {
                    participants: room.participants,
                    name: title
                },
                method: "PUT"
            };

            request(options, function(error, response, body) {
                if (error || response.body.errors || body == 'Unauthorized'){
                    deferred.reject(error || response.body.errors || 'Unauthorized');
                }
                else{
                    deferred.resolve(body.id);
                    notifications.sendFromApi({entityType:'Users',title: '', method:'added', room: roomId});
                }

            });
        })
    return deferred.promise;
};


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
