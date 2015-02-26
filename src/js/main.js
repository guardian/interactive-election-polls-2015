define([
  'd3',
  'underscore',
  'classList.js',
  'page/page',
  'seatscharts/commons',
  'pollchart/pollchart',
  'text!templates/appTemplate.html'
], function(
  d3,
  underscore,
  classList,
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
      

      var currentView = e.currentTarget.getAttribute('data-view');
      var defaultSharemessage = "The Guardian poll projection";
      var sharemessages = {
          "voting-intention-over-time": "How the polls are evolving, from the Guardian poll projection",
          "which-seats-are-changing-hands": "The Guardian poll projection shows how the seats would change hands",
          "conservative-gains-and-losses": "The Guardian poll projection shows how many seats the Tories would gain and lose",
          "labour-gains-and-losses": "The Guardian poll projection shows how many seats Labour would gain and lose",
          "snp-gains-and-losses": "The Guardian poll projection shows how many seats the SNP would gain and lose",
          "ld-gains-and-losses": "The Guardian poll projection shows how many seats the Lib Dems would gain and lose",
          "all-uk-wide-polls":"Full list of opinion polls from the Guardian poll projection"
      }
      var sharemessage = sharemessages[currentView] !== undefined ? sharemessages[currentView] : defaultSharemessage;
      var shareImage = "";
      var guardianUrl = "http://preview.gutools.co.uk/politics/ng-interactive/2015/feb/27/guardian-poll-projection/#" + currentView;

       
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
    var el = document.querySelector("#stickyRow"),
        offset = el.offsetTop;
    
    window.onscroll = _.throttle(stickIfNeeded, 100);
    
    function stickIfNeeded() {
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
