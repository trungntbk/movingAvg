const csvFilePath = './NASDAQ.csv';
// const csvFilePath = './NYSE.csv';

const csv = require('csvtojson');

const LIMIT_MARKET_CAP = 10000000000;
// const UPPER_LIMIT_MARKET_CAP = 1000000000000;
// const LOWER_LIMIT_MARKET_CAP = 100000000;

const UPPER_LIMIT_MARKET_CAP = 10000000000;
const LOWER_LIMIT_MARKET_CAP = 1000000;

const API_KEY = 'PR2XXORQFTQJDU3Q';
let API_FUNCTION = 'TIME_SERIES_DAILY';
// let OUTPUT_SIZE = 'compact'; //100
let OUTPUT_SIZE = 'full'; //100
let AVG_LENGTH = 20;
let MOVING_TIME = [20, 50, 150, 250];


const axios = require('axios');

let URL = 'https://www.alphavantage.co/query?function='+ API_FUNCTION + '&symbol=xxxx&outputsize=' + OUTPUT_SIZE + '&apikey=' + API_KEY;

csv()
.fromFile(csvFilePath)
.then((jsonObj)=>{
    // console.log(jsonObj[0]);
    let largeMarketCaps = jsonObj.filter(filterMarketCap);
    // console.log(largeMarketCaps.length);
    // console.log(largeMarketCaps[0]);
    largeMarketCaps.forEach((company) => {
      getStockData(company.Symbol)
    })

})


function filterMarketCap(company) {
  let marketCap = parseFloat(company.MarketCap);
  // return (parseFloat(company.MarketCap) >= LIMIT_MARKET_CAP);
  return (marketCap >= LOWER_LIMIT_MARKET_CAP && marketCap < UPPER_LIMIT_MARKET_CAP);
}

function getStockData(symbol) {
  // console.log('Processing : ', symbol)
  // symbol = 'MSFT'
  let url = URL.replace('xxxx', symbol);
  // console.log(url)
  axios.get(url)
  .then(function ({ data }) {
    // handle success
    // console.log(data);
    if (data) {
      processData(data)
    }

  })
  .catch(function (error) {
    // handle error
    console.log(error);
  });
}


// let MOVING_TIME = [20, 50];

function processData(data) {

  let dailyData = Object.values(data["Time Series (Daily)"] || {}) || [];
  // console.log(dailyData)
  // console.log(dailyData.length)

  if (dailyData.length < MOVING_TIME[MOVING_TIME.length - 1] + AVG_LENGTH) {
    return;
  }

  let movingAvgs = [];
  for (let i = 0; i < MOVING_TIME.length; i++) {
    movingAvgs[i] = calculateMovingAverage(dailyData, MOVING_TIME[i]);
  }

  if (checkUptrend(movingAvgs)) {
    console.log('Symbol : ', data["Meta Data"]["2. Symbol"])
  }

}

function calculateMovingAverage(dailyData, timeLen) {
  // console.log('timeLen ', timeLen)
  let avgs = [];
  let totalPrice = 0;
  let startTime = 0;
  for (let i = startTime; i < timeLen + startTime; i++) {
    totalPrice += parseFloat(dailyData[i]['4. close']);
  }
  // console.log(totalPrice)
  avgs[0] = totalPrice / timeLen;

  for (let i = startTime + 1; i < AVG_LENGTH + startTime; i++) {
    totalPrice -= parseFloat(dailyData[i - 1]['4. close']);
    totalPrice += parseFloat(dailyData[i - 1 + timeLen]['4. close']);
    avgs[i-startTime] = totalPrice / timeLen;
  }
  // console.log(avgs.length)
  return avgs;
}

function checkUptrend(avgs) {
  function checkUptrendAtPoint(j) {
    for (let i = 0; i < avgs.length - 1; i++) {
      if (avgs[i][j] < avgs[i+1][j]) return false;
    }

    return true;
  }

  for (let j = 0; j < AVG_LENGTH; j++) {
    if (!checkUptrendAtPoint(j)) return false;
  }
  return true;
}
