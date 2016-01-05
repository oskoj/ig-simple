var http = require('http');
var express = require('express');
var api = require('instagram-node').instagram();
var app = express();
var moment = require('moment');

api.use({
  client_id: '7d36b8506e3241ebbd811a1650f40a41',
  client_secret: '2f0bfc8b7e1848f3a715c78672ed8132'
});

var redirect_uri = 'http://h120n8-sto-a12.ias.bredband.telia.com:10001/r';
var tmp_access_token;

exports.check_token = function(req, res, next) {
  console.log(tmp_access_token + ' --> ' + req.path);

  if(tmp_access_token == null && req.path != '/auth' && req.path != '/r'){
    res.redirect('/auth?t=' + encodeURIComponent(req.originalUrl));
  } else {
    next();
  }
};

exports.authorize_user = function(req, res) {
  console.log('authorize_user...');
  res.redirect(
    api.get_authorization_url(redirect_uri, {
      scope: ['public_content', 'follower_list'], state: req.query.t
    })
  );
};

exports.handle_auth = function(req , res) {
  api.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if(err) {
      console.log(err.body);
      res.send('error >:(');
    } else {
      console.log('yay! welcome ' + result.user.username + ' access_token: ' + result.access_token);
      tmp_access_token = result.access_token;

      if(req.query.state != null){
        res.redirect(decodeURIComponent(req.query.state));
      } else {
        res.redirect('/media');
      }
    }
  });
};

exports.handle_media = function(req, res) {
  api.use({
    access_token: tmp_access_token
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

exports.handle_moment = function(req, res) {
  api.use({
    access_token: tmp_access_token
  });

  var from_ts = moment(0, 'HH');
  var to_ts = moment();
  if(req.query.d != null) {
    from_ts = moment(req.query.d);
    to_ts = moment(from_ts).add(1, 'days');
  }

  var options = {
    min_timestamp: from_ts.unix(),
    max_timestamp: to_ts.unix()
  };

  console.log('moment: ' + from_ts.format() + ' - ' + to_ts.format());

  api.user_self_media_recent(options, function(err, medias, pagination, remaining, limit) {
    if(medias == null) return;

    var html_list = medias.map(function(media){
      return '<a href="' + media.link + '">'+
        '<img src="' + media.images.thumbnail.url + '"/></a>';
    }).join('');

    res.send(html_list);
  });

};

app.use(exports.check_token);
app.get('/auth', exports.authorize_user);
app.get('/r', exports.handle_auth);
app.get('/media', exports.handle_media);
app.get('/moment', exports.handle_moment);

http.createServer(app).listen(10001, function() {
  console.log('listening on port: ' + 10001);
});
