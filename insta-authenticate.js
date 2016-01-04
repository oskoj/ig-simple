var http = require('http');
var express = require('express');
var api = require('instagram-node').instagram();
var app = express();

api.use({
  client_id: '7d36b8506e3241ebbd811a1650f40a41',
  client_secret: '2f0bfc8b7e1848f3a715c78672ed8132'
});

var redirect_uri = 'http://h120n8-sto-a12.ias.bredband.telia.com:10001/r';

exports.authorize_user = function(req, res) {
  res.redirect(
    api.get_authorization_url(redirect_uri, {
      scope: ['likes'], state: 'a state'
    })
  );
};

exports.handleauth = function(req , res) {
  api.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if(err) {
      console.log(err.body);
      res.send('error >:(');
    } else {
      console.log('yay! access_token: ' + result.access_token);
      res.send('yay!')
    }
  });
};

exports.handle_media = function(req, res) {
  api.use({
    access_token: '1607981087.7d36b85.b9e76e34478d4eb7939511b8065245ed'
  });

  var n_medias = 10;
  if(req.query.c > 0){
    n_medias = req.query.c;
  }

  api.user_self_media_recent({ count: n_medias }, function(err, medias, pagination, remaining, limit) {
    var html_list = medias.map(function(media){
      return '<a href="' + media.link + '"><img src="' + media.images.thumbnail.url + '"/></a>';
    }).join('');
    res.send(html_list);
  });
};

app.get('/auth', exports.authorize_user);
app.get('/r', exports.handleauth);
app.get('/media', exports.handle_media);

http.createServer(app).listen(10001, function() {
  console.log('listening on port: ' + 10001);
});
