define([
  'd3',
  'underscore',
  'page/page',
  'seatscharts/commons',
  'pollchart/pollchart',
  'social/social',
  'text!templates/appTemplate.html'
], function(
  d3,
  underscore,
  pageView,
  commonsChart,
  pollChart,
  shareInteractive,
  templateHTML
) {
  'use strict';

  d3.selectAll(".js-loggable")
      .remove();
  d3.selectAll('[data-reload=global]')
      .remove();
  d3.selectAll('.top-banner-ad-container')
      .remove();
  d3.selectAll('header#header')
      .remove();
  d3.selectAll('header.content__head')
      .remove();
  d3.selectAll('.gs-container.u-cf')
      .remove();
  d3.selectAll('.content-footer')
      .remove();
  d3.selectAll('.l-footer.u-cf')
      .remove();
      
  function jumpTo(h) {
    var url = location.href;               
    var newhref=location.href.split("#")[0]+"#"+h;

    location.href = location.href.split("#")[0]+"#"+h;
    //history.replaceState(null,null,url);
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
      pageView.render(data["sheets"]["glosses"],data["sheets"]["RESULT"][0],data.updated);
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
        d3.select(el).classed("l-stick", true);
      } else {
        d3.select(el).classed("l-stick", false);
      }
    }
  }
  
  /* load json date */
  function loadData(callback) {
    var jsonSrc = "http://interactive.guim.co.uk/spreadsheetdata/1YilVzArect3kcE1rzJvYivXkfs1oL0MLCrvC9GjPF6E.json";
    

    d3.json(jsonSrc, function(err, data) {

      //data=testData;

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
