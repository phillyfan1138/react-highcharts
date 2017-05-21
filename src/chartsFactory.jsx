var React = require('react');
var createReactClass = require('create-react-class');
var PropTypes = require('prop-types');
module.exports = function (chartType, Highcharts){
  var displayName = 'Highcharts' + chartType;
  var result = createReactClass({
    displayName: displayName,
    propTypes: {
      config: PropTypes.object,
      callback: PropTypes.func,
      domProps: PropTypes.object
    },

    defaultProps: {
      callback: () =>{},
      domProps: {}
    },

    renderChart: function (config){
      if (!config) {
        throw new Error('Config must be specified for the ' + displayName + ' component');
      }
      let chartConfig = config.chart;
      this.chart = new Highcharts[chartType]({
        ...config,
        chart: {
          ...chartConfig,
          renderTo: this.refs.chart
        }
      }, this.props.callback);

    },
    updateSeries:function(oldSeries, currSeries){
      oldSeries.map((oldS, index)=>{
        if(oldS!==currSeries[index]){
          this.chart.series[index].setData(currSeries[index].data, false)
        }
      })
      this.chart.redraw(true)
    },
    shouldComponentUpdate(nextProps) {
      if (this.props.config === nextProps.config) {
        return false
      }
      if(this.props.config.series!==nextProps.config.series){ //fakes a "react" render as more data is loaded
        this.updateSeries(this.props.config.series, nextProps.config.series)
        return false
      }
      this.renderChart(nextProps.config);
      return true

    },

    getChart: function (){
      if (!this.chart) {
        throw new Error('getChart() should not be called before the component is mounted');
      }
      return this.chart;
    },

    componentDidMount: function (){
      this.renderChart(this.props.config);
    },

    componentWillUnmount() {
      this.chart.destroy();
    },

    render: function (){
      return <div ref="chart" {...this.props.domProps} />;
    }
  });

  result.Highcharts = Highcharts;
  result.withHighcharts = (Highcharts) =>{
    return module.exports(chartType, Highcharts);
  };
  return result;
};

