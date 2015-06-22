var mean  = require('meanio');
exports.save = function(doc, docType) {
    mean.elasticsearch.index({
        index: docType,
        type: docType,
        id: doc._id.toString(),
        body: doc
    }, function(error, response){
        if (error) {
            return error;
        }
        return doc;
    });
};

exports.delete = function(doc, docType, next) {
    mean.elasticsearch.delete({
        index: docType,
        type: docType,
        id: doc._id.toString()
    }, function(error, response){
        if (error){
            return error
        }
        return next();
    });
};