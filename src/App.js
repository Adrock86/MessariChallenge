import React, {useEffect} from 'react';
import './App.css';
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import withStyles from "@material-ui/core/styles/withStyles";
import Card from "@material-ui/core/Card";
import AnyChart from 'anychart-react';
import anychart from 'anychart';
const axios = require('axios');


const useStyles = makeStyles({
  welcomeMsg: {
    margin: '12px',
    textAlign: 'center'
  },
  option: {
    fontSize: 15,
    '& > span': {
      marginRight: 10,
      fontSize: 18,
    },
  },
  chartCard: {
    width: '800px',
    margin: 'auto'
  }
});

const App = () => {
  const classes = useStyles();
  const [allTokens, setAllTokens] = React.useState([]);
  const [selectedToken, setSelectedToken] = React.useState('');
  const [selectedTokenMetricTimeData, setSelectedTokenMetricTimeData] = React.useState([]);

  useEffect(() => {
    getTokenList()
      .catch(errResp => console.error(errResp));
  }, []);

  useEffect(() => {
    if (!selectedToken?.symbol) return;
    getTokenMetricData(selectedToken)
      .catch(errResp => console.error(errResp));
  }, [selectedToken]);

  const getTokenList = async () => {
    const messariTokenListResp = await axios.get('https://data.messari.io/api/v2/assets?limit=500');
    if (messariTokenListResp.data.data) {
      setAllTokens(messariTokenListResp.data.data);
    }
    //handle no resp
  }
  //
  // const getTokenData = async (tokenData) => {
  //   const messariTokenDataResp = await axios.get(`https://data.messari.io/api/v1/assets/${tokenData.slug}/metrics`);
  //   console.log(messariTokenDataResp)
  //   if (messariTokenDataResp.data.data) {
  //     setAllTokens(messariTokenDataResp.data.data);
  //   }
  //   //handle no resp
  // }
  const getTokenMetricData = async (tokenData) => {
    const messariTokenMetricDataResp = await axios.get(`https://data.messari.io/api/v1/assets/${tokenData.symbol}/metrics/price/time-series?start=2021-01-01&end=2021-02-01&interval=1d`);
    console.log('time metrics data', messariTokenMetricDataResp)
    if (messariTokenMetricDataResp?.data?.data?.values) {
      setSelectedTokenMetricTimeData(messariTokenMetricDataResp.data.data.values);
    }
    //handle no resp
  }

  const handleGraph = (JSONdata, quoteSymbol, containerObjID) => {

    const dataTable = anychart.data.table();
    dataTable.addData(JSONdata);
    // map loaded data for the ohlc series
    const mapping = dataTable.mapAs({
      open: 1,
      high: 2,
      low: 3,
      close: 4,
      value: 5
    });

    // create stock chart
    const chart = anychart.stock();

    // set chart title
    chart.title(`${quoteSymbol.symbol} - ${quoteSymbol.name}`);

    // create first plot on the chart and set settings
    const plot = chart.plot(0);
    plot
      .height('75%')
      .yGrid(true)
      .xGrid(true)
      .yMinorGrid(true)
      .xMinorGrid(true);

    // create candlestick series
    const series = plot.candlestick(mapping);
    series.name(`${quoteSymbol.symbol} - ${quoteSymbol.name}`);
    series.legendItem().iconType('rising-falling');

    // create second plot
    const volumePlot = chart.plot(1);
    // set yAxis labels formatter
    volumePlot.yAxis().labels().format('{%Value}{scale:(1000)(1)|(k)}');
    // set crosshair y-label formatter
    volumePlot
    .crosshair()
    .yLabel()
    .format('{%Value}{scale:(1000)(1)|(k)}');

    // create volume series on the plot
    const volumeSeries = volumePlot.column(mapping);
    // set series settings
    volumeSeries.name('Volume');

    // create scroller series with mapped data
    chart.scroller().area(mapping);

    // set container id for the chart
    chart.container('container');
    // initiate chart drawing
    chart.draw();

    // create range picker
    const rangePicker = anychart.ui.rangePicker();
    // init range picker
    rangePicker.render(chart);

    // create range selector
    const rangeSelector = anychart.ui.rangeSelector();
    // init range selector
    rangeSelector.render(chart);

    chart.scroller().enabled(false);

    return chart;
  }

  const renderGraph = () => {
    if (selectedTokenMetricTimeData?.length && selectedToken) {
      return (<Card className={classes.chartCard}>
        <AnyChart
            height={600}
            id={`coinChart`}
            instance={handleGraph(selectedTokenMetricTimeData, selectedToken, `coinChart`)}
        />
      </Card>)
    }
    return <div></div>;
  };

  return (
      <div className={'primaryBackground'}>
        <h3 className={classes.welcomeMsg}>Welcome to Adam's Messari Challenge</h3>

        <Autocomplete
            id="messari-token-list"
            style={{ width: 300, margin: '16px auto' }}
            options={allTokens}
            classes={{
              option: classes.option,
            }}

            value={selectedToken}
            onChange={(event, newValue) => {
              setSelectedToken(newValue);
            }}
            autoHighlight
            getOptionLabel={(option) => (option?.symbol) ? `${option?.symbol} - ${option?.name}` : ''}
            renderOption={(option) => (
                <React.Fragment>
                  {(option?.symbol) ? `${option?.symbol} - ${option?.name}` : ''}
                </React.Fragment>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Search for a Token"
                    variant="outlined"
                    inputProps={{
                      ...params.inputProps,
                      autoComplete: 'new-password', // disable autocomplete and autofill
                    }}
                />
            )}
        />
        {renderGraph()}
      </div>
  );
}

export default App;