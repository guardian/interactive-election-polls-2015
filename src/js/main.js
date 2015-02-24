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

  function init(el, context, config, mediator) {
    // DEBUG: What we get given on boot
    //console.log(el, context, config, mediator);
    
    

    el.innerHTML = templateHTML;
    stickElementOnScroll();
    
    var title = document.querySelector('title');
    title.innerHTML = d3.select(".l-title h1").text();

    loadData(function(data){
      //chartView.render(el.querySelector('#chart'), data);
      console.log(data)
      pageView.render(data["sheets"]["glosses"],data.updated);
      commonsChart.render('#commonsChart' ,data);
      commonsChart.renderMainFlow('#flowsChart' ,data);
      commonsChart.renderFlows(data);
      pollChart.render(el.querySelector('#pollchart') ,data);
      commonsChart.renderDayByDay("#daybyday",data);
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
          if(d.projection=="PC") {
              d.projection="others";
          }
          if(d.winner2010=="PC") {
              d.winner2010="others";
          }
      })

      callback(data);
    });
  }

  return {
    init: init
  };
});
