import React, { useEffect } from 'react';
import './App.css';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField, { FilledTextFieldProps, OutlinedTextFieldProps, StandardTextFieldProps } from '@material-ui/core/TextField';
import Card from '@material-ui/core/Card';
import AnyChart from 'anychart-react';
// @ts-ignore
import anychart from 'anychart';

const axios = require('axios');

const useStyles = makeStyles({
  welcomeMsg: {
    margin: '0 12px 12px 12px',
    textAlign: 'center'
  },
  '@keyframes blinker': {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
  loading:{
    animationName: '$blinker',
    animationDuration: '1s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    margin: 'auto',
    height: '100%',
    width: '100%',
    textAlign: 'center',
    padding: '36px'
  },
  option: {
    fontSize: 15,
    '& > span': {
      marginRight: 10,
      fontSize: 18
    }
  },
  chartCard: {
    width: '800px',
    margin: 'auto'
  },
  tableContainer: {
    border: '1px solid #a59393',
    background: 'black',
    borderRadius: '10px',
    margin: '16px auto',
    padding: '24px',
    boxShadow: '3px 3px 3px #000',
    width: '90%',
    display: 'flex',
    color: 'lightgray',
    flexDirection: 'column'
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'space-around'
  },
  statsInnerContainer: {
    display: 'flex',
    flexDirection: 'row'
  },
  stats: {
    width: '49%',
    padding: '12px'
  }
});

interface ITokenData {
  symbol: string;
  slug: string;
  name: string;
}
interface ITokenMetricData {
  market_data: {
    price_usd: number;
    price_btc: number;
    volume_last_24_hours: number;
  };
  marketcap: {
    current_marketcap_usd: number;
  };
}

const tokenDataObj: ITokenData = {
  symbol: '',
  slug: '',
  name: ''
};

const StyledACTextField = withStyles({
  root: {
    '& label.Mui-focused': {
      color: 'white',
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: 'white',
    },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'white',
        color: 'white'
      },
      '&:hover fieldset': {
        borderColor: 'white',
        color: 'white'
      },
      '&.Mui-focused fieldset': {
        borderColor: 'white',
        color: 'white'
      },
    },
    color: 'white',
  },
})(TextField);

const tokenMetricData: ITokenMetricData = {
  market_data: {
    price_usd: undefined || 0,
    price_btc: undefined || 0,
    volume_last_24_hours: undefined || 0
  },
  marketcap: {
    current_marketcap_usd: undefined || 0
  }
};

const App = () => {
  const classes = useStyles();
  const [allTokens, setAllTokens] = React.useState([]);
  const [selectedToken, setSelectedToken] = React.useState(tokenDataObj);
  const [selectedTokenMetricTimeData, setSelectedTokenMetricTimeData] = React.useState([]);
  const [selectedTokenMetricData, setSelectedTokenMetricData] = React.useState(tokenMetricData);
  const internationalNumberFormat = new Intl.NumberFormat('en-US');

  useEffect(() => {
    getTokenList().catch((errResp) => console.error(errResp));
  }, []);

  useEffect(() => {
    if (!selectedToken?.symbol) return;
    getTokenMetricData(selectedToken).catch((errResp) => console.error(errResp));
    getTokenTimeMetricData(selectedToken).catch((errResp) => console.error(errResp));
  }, [selectedToken]);

  const getTokenList = async () => {
    const messariTokenListResp = await axios.get('https://data.messari.io/api/v2/assets?limit=500');
    if (messariTokenListResp.data.data) {
      setAllTokens(messariTokenListResp.data.data);
    }
  };

  const getTokenMetricData = async (tokenData: ITokenData) => {
    const messariTokenMetricDataResp = await axios.get(
        `https://data.messari.io/api/v1/assets/${tokenData.slug}/metrics`
    );
    if (messariTokenMetricDataResp.data.data) {
      setSelectedTokenMetricData(messariTokenMetricDataResp.data.data);
    }
  };

  const getTokenTimeMetricData = async (tokenData: ITokenData) => {
    const messariTokenMetricTimeDataResp = await axios.get(
        `https://data.messari.io/api/v1/assets/${tokenData.symbol}/metrics/price/time-series?start=2021-01-01&end=2021-02-01&interval=1d`
    );
    if (messariTokenMetricTimeDataResp?.data?.data?.values) {
      setSelectedTokenMetricTimeData(messariTokenMetricTimeDataResp.data.data.values);
    }
  };

  const handleGraph = (timeData: string[], quoteSymbol: ITokenData) => {
    const dataTable = anychart.data.table();
    dataTable.addData(timeData);
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
    plot.height('75%').yGrid(true).xGrid(true).yMinorGrid(true).xMinorGrid(true);

    // create candlestick series
    const series = plot.candlestick(mapping);
    series.name(`${quoteSymbol.symbol} - ${quoteSymbol.name}`);
    series.legendItem().iconType('rising-falling');

    // create second plot
    const volumePlot = chart.plot(1);
    // set yAxis labels formatter
    volumePlot.yAxis().labels().format('{%Value}{scale:(1000)(1)|(k)}');
    // set crosshair y-label formatter
    volumePlot.crosshair().yLabel().format('{%Value}{scale:(1000)(1)|(k)}');

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
  };

  const tokenData = () => {
    if (selectedTokenMetricTimeData?.length && selectedToken && selectedTokenMetricData) {
      return (
          <Card className={classes.tableContainer}>
            <div className={classes.statsContainer}>
              <div className={classes.statsInnerContainer}>
                <span className={classes.stats}>
                  Current Price USD: ${internationalNumberFormat.format(selectedTokenMetricData.market_data.price_usd)}
                </span>
                <span className={classes.stats}>
                  Current Price BTC: {selectedTokenMetricData.market_data.price_btc}
                </span>
              </div>
              <div className={classes.statsInnerContainer}>
                <span className={classes.stats}>
                  Volume: ${internationalNumberFormat.format(selectedTokenMetricData.market_data.volume_last_24_hours)}
                </span>
                <span className={classes.stats}>
                  Market Cap: ${internationalNumberFormat.format(selectedTokenMetricData.marketcap.current_marketcap_usd)}
                </span>
              </div>
            </div>
            <AnyChart height={600} id={`coinChart`} instance={handleGraph(selectedTokenMetricTimeData, selectedToken)} />
          </Card>
      );
    }
    return <div></div>;
  };

  const renderAutocomplete = () => {
    if (!allTokens.length) {
      return (
          <h2 className={classes.loading}>Loading...</h2>
      )
    }
    return (
        <Autocomplete
            id='messari-token-list'
            style={{ width: 300, margin: '16px auto', color: 'white' }}
            options={allTokens}
            classes={{
              option: classes.option
            }}
            value={selectedToken}
            onChange={(event: any, newValue: ITokenData | null) => {
              if (newValue) setSelectedToken(newValue);
            }}
            autoHighlight
            getOptionLabel={(option: { symbol: string; name: string }) =>
                option?.symbol ? `${option?.symbol} - ${option?.name}` : ''
            }
            renderOption={(option: { symbol: string; name: string }) => (
                <React.Fragment>{option?.symbol ? `${option?.symbol} - ${option?.name}` : ''}</React.Fragment>
            )}
            renderInput={(
                params:
                    | (JSX.IntrinsicAttributes & StandardTextFieldProps)
                    | (JSX.IntrinsicAttributes & FilledTextFieldProps)
                    | (JSX.IntrinsicAttributes & OutlinedTextFieldProps)
            ) => (
                <StyledACTextField
                    {...params}
                    label='Search for a Token'
                    variant='outlined'
                    inputProps={{
                      ...params.inputProps,
                      autoComplete: 'new-password' // disable autocomplete and autofill
                    }}
                />
            )}
        />
    )
  }


  return (
      <div className={'primaryBackground'}>
        <h1 className={classes.welcomeMsg}>Welcome to Adam's Messari Challenge</h1>
        {renderAutocomplete()}
        {tokenData()}
      </div>
  );
};

export default App;
