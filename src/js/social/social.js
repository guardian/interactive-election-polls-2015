define([
    'd3'
], function(
    d3
) {

    
    var twitterBaseUrl = "https://twitter.com/home?status=";
    var facebookBaseUrl = "https://www.facebook.com/dialog/feed?display=popup&app_id=741666719251986&link=";
    var sharemessage = this.mainVideo.couple + " were both given Google Glass and sent on a date. What happens next? #WatchMeDate ";
    var network = $(e.currentTarget).attr('data-source'); //make sure to add the network (pinterest,twitter,etc) as a classname to the target
    var shareWindow = "";
    var queryString = "?date="+this.mainVideo.coupleid;
    var coupleImage = "{{assets}}/imgs/dates/" + this.mainVideo.coupleid + '_1260.jpg';
    var guardianUrl = "http://www.theguardian.com/lifeandstyle/ng-interactive/2015/feb/12/watch-me-date" + queryString;


    if(network === "twitter"){
        shareWindow = 
            twitterBaseUrl + 
            encodeURIComponent(sharemessage) + 
            "%20" + 
            encodeURIComponent(guardianUrl)
        
    }else if(network === "facebook"){
        shareWindow = 
            facebookBaseUrl + 
            encodeURIComponent(guardianUrl) + 
            "&picture=" + 
            encodeURIComponent(coupleImage) + 
            "&redirect_uri=http://www.theguardian.com";
    }
    window.open(shareWindow, network + "share", "width=640,height=320");


});
