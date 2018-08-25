$(document).ready(function() {
  const { date, zip_code } = getQueryParams();
  var weatherURL = `http://api.wunderground.com/api/${API_KEY}/forecast10day/q/${zip_code}.json`;
  var locationURL = `http://api.wunderground.com/api/${API_KEY}/geolookup/q/${zip_code}.json`;
  //Get Requests For Forecast Data and Location Based On Zip Code
  $.when($.get(weatherURL), $.get(locationURL))
   .done((weatherData, locationData) => {
     const { error } = weatherData[0].response;
     if(error) return handleError(new Error(error.description))
     //Pull Ten Day Forecast
     var tenDayForecastArray = weatherData[0].forecast.simpleforecast.forecastday;
     //Extract Three Days Using Query Date
     var threeDayForecast = getForecastForDates(tenDayForecastArray, date);
     //Ensure There Are 3 Days To Show Based On Date Input
     if(threeDayForecast === null || threeDayForecast.length < 3) return handleError(new Error('Date Outside Range'));
     //Filter Unwanted Data & Store In New Array
     var forecastData = [];
     threeDayForecast.forEach(day => forecastData.push( extractData(day) ));
     //Write Forecast And Location Data To Page
     const { city, state } = locationData[0].location
     writeToPage(null, `${city}, ${state}`);
     forecastData.forEach(data => writeToPage(data, null));
   })
   .fail(er => {
     handleError(er)
   });
});

//***HELPER FUNCTIONS***//

const getQueryParams = () => {
  //Extract Query Parameters
  var params = window.location.search.substring(1).split('&');
  //Check If Parameter Was Included. Retrieve Value
  const findParam = (param) => {
    for(let i = 0; i < params.length; i++) {
      //if Param Exists, Return Value
      if(params[i].search(param) !== -1) return params[i].split('=')[1];
    }
    return null;
  };
  return {
    date: findParam('date'),
    zip_code: findParam('zip_code'),
  };
};

//Date Format Must Be MM/DD/YYYY

const getForecastForDates = (arr, date, numDays = 3) => {
  for(let i = 0; i < arr.length; i++) {
    //Extract Dates & Convert Them To String Format To Match URL Query Input
    const { day, month, year } = arr[i].date;
    if(dateToString(month, day, year) === date) return arr.slice(i, i + numDays);
  }
  return null;
};

//Function To Compare Query String Date With JSON Response

const dateToString = (...args) => {
  var resultStr = '';
  for(let i = 0; i < args.length; i++) {
    `${args[i]}`.length < 2 ? resultStr += `0${args[i]}` : resultStr += `${args[i]}`;
    i < 2 ? resultStr += '/' : null;
  }
  return resultStr;
};

const extractData = (obj) => {
  //Check If Day Is Current Day
  var today = new Date();
  var day = obj.date.day === today.getDate() ? 'Today' : obj.date.weekday;
  //Return Filtered Data Object
  return {
    day,
    high: obj.high.fahrenheit,
    low: obj.low.fahrenheit,
    conditions: obj.conditions,
    icon_url: `https://icons.wxug.com/i/c/g/${obj.icon}.gif`,
  };
};

const htmlOutput = (day, high, low, conditions, icon_url) => {
  return `<div class="child">
            <h5 class="day">${day}:</h5>
            <div class="content">
              <img src='${icon_url}' width='60' height='60'/>
              <div class="info">
                <p>${conditions}</p>
                <p><b>${high}&#176;</b> / ${low}&#176; F</p>
              </div>
            </div>
          </div>`
}

const writeToPage = (obj, location) => {
  location && $('#heading').text(`WEATHER FORECAST FOR ${location.toUpperCase()}`);
  if(obj) {
    const { day, high, low, conditions, icon_url } = obj;
    $('#container').append(htmlOutput(day, high, low, conditions, icon_url));
  };
}

//Error Handler

const handleError = (er) => {
  //Log Error
  console.error(er);
  //Blank Out Page
  $('body').html('<div></div>');
}

//*** END HELPER FUNCTIONS***//
