

exports.checkApp = function(req, res, next) {
    var mongoose = require('mongoose'),
        Application = mongoose.model('Application');

    Application.findOne({name: req.params.appName}, function(err, app) {
       if (err) {
           return res.status(500).json({
               error: 'Unrecognized application'
           });
       }
        if (app.token && app.token !== req.params.token){
            return res.status(500).json({
                error: 'Token is not match to application name'
            });
        }

        req.params.app = app;
        req.body.app = app;
        req.query.app = app;
        next();

    });
};
