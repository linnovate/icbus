var request = require('request');

exports.create = function(req, res) {
    var user = { '_id' : '5549e130080321455efd41fc' };
    request.post('http://localhost:5000/rooms/' + req.params.app.name +'/messages?text=' +req.params.text + '&user=' + user, function(error, body, response) {
        console.dir(response);
        res.send(response);
    });

};