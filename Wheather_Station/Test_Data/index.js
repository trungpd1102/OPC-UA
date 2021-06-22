var unirest = require("unirest");

var req = unirest("GET", "https://community-open-weather-map.p.rapidapi.com/weather");

req.query({
    "q": "London,uk",
    "lat": "0",
    "lon": "0",
    "callback": "test",
    "id": "2172797",
    "lang": "null",
    "units": "\"metric\" or \"imperial\"",
    "mode": "xml, html"
});

req.headers({
    "x-rapidapi-key": "a33aa18daemsh15a91713bc3d37ep176960jsn2a161a1ed703",
    "x-rapidapi-host": "community-open-weather-map.p.rapidapi.com",
    "useQueryString": true
});


req.end(function (res) {
    if (res.error) throw new Error(res.error);

    console.log(res.body);
});
