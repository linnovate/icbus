var mean  = require('meanio');
var notifications = require('../../../hi/server/controllers/notifications');

exports.save = function(doc, docType, room, title) {
    mean.elasticsearch.index({
        index: docType,
        type: docType,
        id: doc._id.toString(),
        body: doc
    }, function(error, response){
        if (error) {
            return error;
        }
        if (room)
            if (docType === 'attachment')
                notifications.sendFile({entityType: docType, title: title, room:room, method: 'uploaded', path: doc.path, issue:doc.issue});
            else
                notifications.sendFromApi({entityType: docType, title: doc.title, room:room, method: (response.created ? 'created' : 'updated')});
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
        if (room)
            notifications.sendFromApi({entityType: docType, title: doc.title, room:room, method: 'deleted'});
        return next();
    });
};

exports.search = function (req, res) {
    //var filters = [];
    //if (req.query.title)
    //    filters.push({'term': {'title': req.query.title}});
    //if (req.query.color)
    //    filters.push({'term': {'color': req.query.color}});
    //if (req.query.creator)
    //    filters.push({'term': {'creator': req.query.creator}});
    var query = {
        query: {
            //'filtered': {
            //    filter:  {and : filters}
            //}
    
            'multi_match' : {
                'query':    req.query.term,
                'fields': [ 'title^3', 'color', 'creator']
            }
        }
    };
    mean.elasticsearch.search({'from': 0,
        'size': 3000,
        'body': query}, function (err, result) {
        if (err){
            res.send(500, err)
        }
        res.send(result.hits.hits)

    })
};


exports.advancedSearch = function(query) {
    var queries = [], jsonQuery;
    for (var i in query){
        var isArray = query[i].indexOf(',') > -1;
        if (isArray){
            var terms = query[i].split(',');
            jsonQuery = {terms: {minimum_should_match: terms.length}};
            jsonQuery.terms[i] = terms;
            queries.push(jsonQuery);
        }
        else{
            jsonQuery = {term: {}};
            jsonQuery.term[i] = query[i];
            queries.push(jsonQuery);
        }
    }
    return {
        query : {
            filtered: {
                query : {
                    bool : {must: queries}
                }
            }
        }
    }
};