define([
  'd3',
  'underscore',
  'page/page',
  'seatscharts/commons',
  'pollchart/pollchart',
  'text!templates/appTemplate.html'
], function(
  d3,
  underscore,
  pageView,
  commonsChart,
  pollChart,
  templateHTML
) {
  'use strict';

  d3.selectAll(".js-loggable")
      .remove();
  d3.selectAll('[data-reload=global]')
      .remove();

  function jumpTo(h) {
    var url = location.href;               
    var newhref=location.href.split("#")[0]+"#"+h;

    location.href = location.href.split("#")[0]+"#"+h;
    //history.replaceState(null,null,url);
  }

  function shareInteractive(){
    var shareButtons = document.querySelectorAll('.btns-share button');
    
    for (var i = 0; i < shareButtons.length; i++) {
      shareButtons[i].addEventListener('click',openShareWindow);
    };

    function openShareWindow(e){
      var shareWindow = "";
      var twitterBaseUrl = "https://twitter.com/home?status=";
      var facebookBaseUrl = "https://www.facebook.com/dialog/feed?display=popup&app_id=741666719251986&link=";
      var network = e.currentTarget.getAttribute('data-source'); 
      
      var hashKey = "#" + e.currentTarget.getAttribute('data-view');
      var sharemessage = "The Guardian Poll Projection";
      var shareImage = "";
      var guardianUrl = "http://localhost:9000" + hashKey;
       
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
              encodeURIComponent(shareImage) + 
              "&redirect_uri=http://www.theguardian.com";
      }
      window.open(shareWindow, network + "share", "width=640,height=320");
    }
  }


  function init(el, context, config, mediator) {
    // DEBUG: What we get given on boot
    //console.log(el, context, config, mediator);
    
    el.innerHTML = templateHTML;
    stickElementOnScroll();
    
    var title = document.querySelector('title');
    title.innerHTML = d3.select(".l-title h1").text();

    loadData(function(data){
      //console.log(data)
      pageView.render(data["sheets"]["glosses"],data.updated);
      commonsChart.render('#commonsChart' ,data);
      commonsChart.renderMainFlow('#flowsChart' ,data);
      commonsChart.renderFlows(data);
      commonsChart.renderDayByDay("#daybyday",data);
      pollChart.render(el.querySelector('#pollchart') ,data);

      shareInteractive();

      if(window.location.hash) {
        //jumpTo("voting-intention-over-time")
        jumpTo(window.location.hash.split('#')[1]);
      }
    })
  }


  /* stick element (time and party labels) to top on scroll */
  function stickElementOnScroll() {
    window.onscroll = _.throttle(stickIfNeeded, 100);
    
    function stickIfNeeded() {
      var el = document.querySelector("#stickyRow"),
          offset = el.offsetTop;
      
      if (offset <= window.pageYOffset) {
        el.classList.add("l-stick");
      } else {
        el.classList.remove("l-stick");
      }
    }
  }
  
  /* load json date */
  function loadData(callback) {
    var jsonSrc = "http://interactive.guim.co.uk/spreadsheetdata/1YilVzArect3kcE1rzJvYivXkfs1oL0MLCrvC9GjPF6E.json";
    d3.json(jsonSrc, function(err, data) {

      data.sheets["RESULT"].forEach(function(d){
          
          d.unfiltered_projection=d.projection.toLowerCase();
          d.unfiltered_winner2010=d.winner2010.toLowerCase();

          if(d.projection=="PC") {
              d.projection="others";
          }
          if(d.winner2010=="PC") {
              d.winner2010="others";
          }
          if(d.projection=="DUP") {
              d.projection="others";
          }
          if(d.winner2010=="DUP") {
              d.winner2010="others";
          }
      })
      //console.log(data)
      callback(data);
    });
  }

  return {
    init: init
  };
});
