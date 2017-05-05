var React = require('react');
var assert = require('assert');
var TestUtils = require('react-dom/test-utils');
var mock = require('mock-require');
var sinon = require('sinon');

function nonBundleTest(lib, chartName, modulename){
  var libPath = 'dist/' + lib + '.src.js';
  var fakeHighChartsInstance = {};
  var noop = () =>{
  };
  describe('react-highcharts/' + lib, ()=>{
    var Component, fakeHighcharts;

    beforeEach(()=>{
      fakeHighcharts = {};
        console.log(modulename);
      mock(modulename, fakeHighcharts);
      Component = mock.reRequire('../../' + libPath);
    });

    describe('Config', ()=>{
      it('Renders the chart and passes apropriate fakeConfig', ()=>{
        var fakeConfig = {};

        fakeHighcharts[chartName] = sinon.spy();

        TestUtils.renderIntoDocument(
          React.createElement(Component, {config: fakeConfig, callback: noop})
        );

        assert(fakeHighcharts[chartName].called);
        var arg = fakeHighcharts[chartName].firstCall.args[0];
        delete arg.chart;
        assert.deepEqual(arg, fakeConfig);
      });

      it('Extends config with the DOM node, but preserves existing properties', ()=>{
        var fakeConfig = {
          chart: {
            specialProp: {}
          }
        };

        fakeHighcharts[chartName] = sinon.spy();

        TestUtils.renderIntoDocument(
          React.createElement(Component, {config: fakeConfig, callback: noop})
        );

        assert(fakeHighcharts[chartName].called);

        var arg = fakeHighcharts[chartName].firstCall.args[0];
        // Existing property is preserved
        assert.equal(arg.chart.specialProp, fakeConfig.chart.specialProp);
        // Node element is added
        assert(arg.chart.hasOwnProperty('renderTo'));
      });
    });

    it('Sets chart property to the highcharts instance', ()=>{
      var fakeHighchartsInstance = {};
      fakeHighcharts[chartName] = sinon.stub().returns(fakeHighchartsInstance);

      var component = TestUtils.renderIntoDocument(
        React.createElement(Component, {config: {}, callback: noop})
      );
      assert.equal(fakeHighchartsInstance, component.getChart());
    });


    describe('clean up', ()=>{
      it('Destroys Highcharts when component gets unmounted', ()=>{
        var fakeHighchartsInstance = {
          destroy: sinon.stub()
        };
        fakeHighcharts[chartName] = sinon.stub().returns(fakeHighchartsInstance);

        var component = TestUtils.renderIntoDocument(
          React.createElement(Component, {config: {}, callback: noop})
        );

        assert(!fakeHighchartsInstance.destroy.called);
        component.componentWillUnmount();
        assert(fakeHighchartsInstance.destroy.called);
      });
    });

    describe('WithHighcharts', ()=>{
      it('Allows to replace Highcharts instance', ()=>{
        var otherFakeHighcharts = {};
        fakeHighcharts[chartName] = sinon.spy();
        otherFakeHighcharts[chartName] = sinon.spy();
        var fakeConfig = {};

        // When an ReactHighachrts instance is creative with a different
        // Highcharts instance
        var Component2 = Component.withHighcharts(otherFakeHighcharts);

        // And rendered
        TestUtils.renderIntoDocument(
          React.createElement(Component2, {config: fakeConfig, callback: noop})
        );

        // The original Highcharts instance methods were not called.
        assert(!fakeHighcharts[chartName].called);

        // The passed Highcharts instance methods were called.
        assert(otherFakeHighcharts[chartName].called);
        var arg = otherFakeHighcharts[chartName].firstCall.args[0];
        delete arg.chart;
        assert.deepEqual(arg, fakeConfig);
      });
    });

    describe('Updating Data', function (){
      beforeEach(()=>{
        global.requestAnimationFrame = sinon.stub();
      });

      
      it('doesnt update chart when no new data', function (){
        const config={
          chart:{
            type:'column'
          },
          title:{
            text:'my chart'
          },
          credits:{
            enabled:false
          },
          series:[
            {
              data:[[.5, .7], [.6, .9], [1, .4]]
            }
          ]

        }
        var fakeHighchartsInstance = {
          options: {},
          reflow: sinon.stub()
        };

        fakeHighcharts[chartName] = sinon.stub().returns(fakeHighchartsInstance);

        var component=TestUtils.renderIntoDocument(
          React.createElement(Component, {config: config, callback: noop})
        );
        assert(component.shouldComponentUpdate({config:config})===false)
  
      });
      it('Updates data when new data series', function (){
        const config1={
          chart:{
            type:'column'
          },
          title:{
            text:'my chart'
          },
          credits:{
            enabled:false
          },
          series:[
            {
              data:[[.5, .7], [.6, .9], [1, .4]]
            }
          ]

        }
        const config2={
          chart:{
            type:'column'
          },
          title:{
            text:'my chart'
          },
          credits:{
            enabled:false
          },
          series:[
            {
              data:[[.5, 1.2], [.6, .9], [1, .9]]
            }
          ]

        }
        var fakeHighchartsInstance = {
          options: {},
          reflow: sinon.stub(),
          redraw:()=>{

          },
          series:[
            {
              setData:(data, shouldUpdate)=>{
                fakeHighchartsInstance.series[0].data=data
              },
              data:config1.series[0].data
            }
          ]
        };
        //fakeHighcharts[chartName] = sinon.spy();
        fakeHighcharts[chartName] = sinon.stub().returns(fakeHighchartsInstance);

        var component=TestUtils.renderIntoDocument(
          React.createElement(Component, {config: config1, callback: noop})
        );
        
        component.shouldComponentUpdate({config:config2})
        assert(component.getChart().series[0].data===config2.series[0].data)
  
      });
    });
  })
}


nonBundleTest('ReactHighcharts', 'Chart', 'highcharts');
nonBundleTest('ReactHighstock', 'StockChart', 'highcharts/highstock');
nonBundleTest('ReactHighmaps', 'Map', 'highcharts/highmaps');



