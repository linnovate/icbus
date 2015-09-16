var request = require('request'),
    async = require('async'),
    lcconfig = require('meanio').loadConfig().letschat,
    _ = require('lodash'),
    Q = require('q'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    notifications = require('./notifications'),
    room;


exports.create = function(req, res) {

    var project = {
        title: req.body.title,
        watchers: req.body.watchers
    }

    exports.createForProject(req, project)
        .then(function (roomId) {
            return res.json({room: roomId});
        }, function (error) {
            return res.send(500, 'cannot create a room in lets-chat ' + error);
        });
};

exports.createForProject  = function(req, project) {

    var deferred = Q.defer();
    room  = {};

    async.parallel([
            // get owner
            function (cb) {
                exports.getUsername(req.user.email)
                    .then(function(user){
                        room.owner = user.id;
                        cb(null, 'owner')
                    }, function(err){
                        cb(err, null)
                    });
            },
            function (cb) {
                // get participants
                getWatchersUsername(project.watchers)
                    .then(function(){
                        cb(null, 'participants')
                    }, function(err){
                        cb(err, null)
                    });
            }
        ],
        function(error, result){
            console.log(room,'finish')
            createRoom(project)
                .then(function(roomId){
                    deferred.resolve(roomId)
                }, function(err){
                    deferred.reject(err)
                });
        }
    );

    return deferred.promise;
};

function createRoom (project) {

    var deferred = Q.defer();
    var dt = new Date().toJSON();
    var options = {
        url : lcconfig.uri +'/rooms',
        headers : {
            "Authorization":"Bearer " + lcconfig.token
        },
        json: {
            name: project.title,
            slug: (project.title + '_' + dt).toLowerCase().replace(/[^a-z0-9 ]/gi,'').trim().replace(/ /g, '_'),
            owner: room.owner,
            participants: []//room.participants
        },
        method: "POST"
    };

    request(options, function(error, response, body) {

        if (error || response.body.errors || body == 'Unauthorized'){
            deferred.reject(error || response.body.errors || 'Unauthorized');
        }
        else{
            notifications.sendMessage({message:'project ' + project.title + ' was created', room: body.id,owner: body.owner})
                .then(function(){
                    deferred.resolve(body.id)
                });
        }

    });
    return deferred.promise;
}

function getWatchersUsername(usersArray) {
    var deferred = Q.defer();
    if (!usersArray || usersArray.length == 0) {
        room.participants = '';
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
    room.participants = '';
    users.forEach(function(item){
        var deferred = Q.defer();
        exports.getUsername(item.email)
            .then(function(user){
                room.participants += user.username   + ',';
                deferred.resolve();
            });

        promises.push(deferred.promise);
    });
    return Q.all(promises);
}

exports.getUsername = function (userEmail) {
    var deferred = Q.defer();
    var options = {
        url : lcconfig.uri +'/users/' + userEmail,
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
            deferred.resolve(user);

        }
    });
    return deferred.promise;
}

exports.update = function(req, res) {
    //var deferred = Q.defer();
    room = {};
    exports.getUsername(req.user.email)
        .then(function(user){
            room.owner = user.id;
            getWatchersUsername(req.body.watchers)
                .then(function() {
                    var options = {
                        url : lcconfig.uri +'/rooms/' + req.params.room ,
                        headers : {
                            "Authorization":"Bearer " + lcconfig.token
                        },
                        json: {
                            participants: room.participants,
                            name: req.body.title,
                            owner: room.owner
                        },
                        method: "PUT"
                    };

                    console.log(options)
                    request(options, function(error, response, body) {
                        if (error || response.body.errors || body == 'Unauthorized'){
                            return res.send(500, 'cannot update a room: ' + req.body.title + ' ' + error);

                            //deferred.reject(error || response.body.errors || 'Unauthorized');

                        }
                        else{
                            res.send({room: body.id});
                            //deferred.resolve(body.id);
                            notifications.sendMessage({message: req.body.message, room: req.params.room, owner: room.owner});
                        }

                    });
                })
        });

    //return deferred.promise;
};


exports.all = function(req, res) {
    var options = {
        url : lcconfig.uri +'/rooms',
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
