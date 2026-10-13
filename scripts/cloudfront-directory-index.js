// CloudFront Function: bmsd-homepage-directory-index (cloudfront-js-2.0).
function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value.toLowerCase() : '';

  if (host === 'brothermaze.com' || host === 'adhaeyo.com') {
    var query = [];
    Object.keys(request.querystring || {}).forEach(function (key) {
      var item = request.querystring[key];
      var values = item.multiValue || [item];
      values.forEach(function (value) {
        query.push(key + '=' + value.value);
      });
    });
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: {
          value: 'https://www.' + host + request.uri + (query.length ? '?' + query.join('&') : ''),
        },
        'cache-control': { value: 'public,max-age=300' },
      },
    };
  }

  var isAdhaeyo = host === 'www.adhaeyo.com' || host === 'd1oyjttq7vlv4n.cloudfront.net';
  if (isAdhaeyo && (request.uri === '/' || request.uri === '/index.html')) {
    request.uri = '/adhaeyo/index.html';
  } else if (request.uri.slice(-1) === '/') {
    request.uri += 'index.html';
  }
  return request;
}
