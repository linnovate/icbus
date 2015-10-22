

exports.checkApp = function(req, res, next) {
    var mongoose = require('mongoose'),
        Application = mongoose.model('Application');

    Application.findOne({name: req.headers['app-name']}, function(err, app) {
       if (err) {
           return res.status(500).json({
               error: 'Unrecognized application'
           });

       }
        if (app.token && app.token !== req.headers['x-csrf-token']){
            return res.status(500).json({
                error: 'Token is not match to application name'
            });
        }
        next();

    });
};
