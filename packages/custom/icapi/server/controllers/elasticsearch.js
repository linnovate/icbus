var mean  = require('meanio');
var notifications = require('../../../hi/server/controllers/notifications');

exports.save = function(doc, docType, room) {
    mean.elasticsearch.index({
        index: docType,
        type: docType,
        id: doc._id.toString(),
        body: doc
    }, function(error, response){
        if (error) {
            return error;
        }
        console.log(room)
        if (room)
            notifications.sendFromApi({entityType: docType, entity: doc, room:room, method: (response.created ? 'create' : 'update')});
        return doc;
    });
};

exports.delete = function(doc, docType, room, next) {
    mean.elasticsearch.delete({
        index: docType,
        type: docType,
        id: doc._id.toString()
    }, function(error, response){
        if (error){
            return error
        }
        notifications.sendFromApi({entityType: docType, entity: doc, room:room, method: 'delete'});
        return next();
    });
};