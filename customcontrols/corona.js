mviewer.customControls.corona = (function() {
    /*
     * Private
     */
    var _idlayer = 'corona';

    // stock data
    var _data = [];
    var _orderedDate = [];
    var _dateObj = {};

    var _formatDate = function (date) {
        var d = date.getDate();
        var m = date.getMonth() + 1;
        var year = date.getFullYear();
        var day = d < 10 ? ("0" + d) : d;
        var month = m < 10 ? ("0" + m) : m;
        var formatedDate = [year,month,day].join("/");
        return formatedDate;
    };

    var _formatUTCDate = function (fdate, delimiter) {        
        var Y = fdate.getUTCFullYear();
        var D = fdate.getUTCDate() > 9 ? fdate.getUTCDate() : `0${fdate.getUTCDate()}`
        var M = fdate.getUTCMonth()+1 > 9 ? fdate.getUTCMonth()+1 : `0${fdate.getUTCMonth()+1}`
        return [Y,M,D].join(delimiter);
    };    

    // update layer from date
    var _updateLayer = function (type) {        
        var date = $('.coronaInput').val() || _formatUTCDate(new Date(),'/');      
        date = new Date(date);
        date = _formatUTCDate(date,'');
        // get layer source
        var _source = mviewer.getLayers()["corona"].layer.getSource();
        // get data for a date
        var isInRange = false;

        if(type === 0) { // update by range
            var toRead = [];
            var inRange = false;
            _orderedDate.forEach((e,n) => {
                if(date === e) {
                    inRange = true;
                }
                if(inRange) {
                    toRead.push(e);
                }
            })
            // update map for each day
            var counterLimit = toRead.length;
            counter = 0;
            var intervalId = null;
            function updateMap() {
                // while counter
                if(counter != counterLimit) {	
                    _source.clear();
                    if(_dateObj[toRead[counter]].features) {
                        _source.addFeatures(_dateObj[toRead[counter]].features);
                        _source.refresh();                    
                    }
                } else {
                    // stop counter
                    clearInterval(intervalId);
                }
                counter++;
            }
            function start(){
                intervalId = setInterval(updateMap, 1000);
            }
            start();
        } else { // init
            if(_dateObj[date]) {
                _source.clear();
                _source.addFeatures(_dateObj[date].features);
                _source.refresh();
            }        
        }
    }

    _applyFilterToAllLayers = function (time_filter, cc) {
        var coronaInput_layers = ["corona"];
        coronaInput_layers.forEach(function(layer) {
            _setLayerExtraParameters(layer,time_filter, cc);
        });
    }
    _getEveryDays = function (from, to) {
        from = _formatUTCDate(from);
        to = _formatUTCDate(to);
        var date = new Date(from)
        var dates = [];
        while(_formatDate(date) != to ) {
            // request
            dates.push(_formatDate(date));
            // up date
            date.setUTCDate(date.getUTCDate() + 1);
        }
        return dates;
    }

    _getFeaturesFromDate = function(date, features,) {
        date = new Date(date);
        var selection = [];
        // filter features
        features.forEach(e => {
            var fdate = new Date(e.properties.date);
            var D = fdate.getUTCDate() > 9 ? fdate.getUTCDate() : `0${fdate.getUTCDate()}`
            var M = fdate.getUTCMonth()+1 > 9 ? fdate.getUTCMonth()+1 : `0${fdate.getUTCMonth()+1}`
            fdate = new Date([fdate.getUTCFullYear(),M,D].join('/'));
            if(fdate>date) {
                selection.push(e);
            }
        });
        return selection;
    }

    // get day by date where date is like 2020/01/25
    _getFeaturesByDay = function (date, features) {
        var selection = [];
        // filter features
        features.forEach(e => {
            var fdate = new Date(e.properties.date);
            var D = fdate.getUTCDate()+1 > 9 ? fdate.getUTCDate()+1 : `0${fdate.getUTCDate()+1}`
            var M = fdate.getUTCMonth()+1 > 9 ? fdate.getUTCMonth()+1 : `0${fdate.getUTCMonth()+1}`
            fdate = [fdate.getUTCFullYear(),M,D].join('/');
            // control string not Date object
            if(fdate===date) {
                selection.push(e);
            }
        });
        return selection;        
    }

    _getWFSParams = function() {
        // getFeatures
        return {
            "test":"test",
            "service": "WFS",
            "version": "1.0.0",
            "request": "GetFeature",
            "typenames": "corona:datacorona",
            "srsname": "EPSG:3857",
            "outputformat": "application/json"
        }     
    }


    return {
        /*
         * Public
         */

        init: function () {
            // mandatory - code executed when panel is opened
            $(".coronaInput.datepicker").datepicker({
                todayHighlight: true
            });
            var resultJson;
            $.ajax({
                type: "GET",
                url: "https://gis.jdev.fr/geoserver/corona/ows",
                data: _getWFSParams(),
                crossDomain: true,
                dataType: "json",
                success: function (result) {
                    if(!_data.length){
                        _data = result.features;
                        resultJson = result;
                        _data.forEach(e=>{
                            var fdate = new Date(e.properties.date);
                            var newData = e;
                            var prop = [e.properties.country,e.properties.state].join('-');
                            var addFeature = true;
                            fdate = _formatUTCDate(fdate, '');
                            // create index into json
                            if(_orderedDate.indexOf(fdate) < 0) {
                                _orderedDate.push(fdate);
                                _dateObj[fdate] = {
                                    features: []
                                }
                            } else {
                                // directly add feature if not already exist
                                // else, just keep biggest confirmed value if already exist
                                _dateObj[fdate].features.forEach((e,i) => {
                                    parsedProp = [e.getProperties().properties.country,e.getProperties().properties.state].join('-');
                                    if(parsedProp === prop) {
                                        var oldConfirmed = newData.properties.confirmed;
                                        var newConfirmed = e.getProperties().properties.confirmed;
                                        if(oldConfirmed <= newConfirmed) {
                                            _dateObj[fdate].features.splice(i,1); // remove old element because value is not biggest
                                            addFeature = true;
                                        } else {
                                            addFeature = false;
                                        }
                                    }
                                         
                                });
                                // add feature
                                if(addFeature) {
                                    var feature = new ol.Feature({
                                        id: e.id,
                                        properties: e.properties,
                                        geometry: new ol.geom.Point(e.geometry.coordinates)
                                    });
                                    _dateObj[fdate].features.push(feature); 
                                }
                                
                            }                        
                        });
                        _updateLayer(1);
                        _orderedDate.sort();
                    }
                }   
            });         
            // getFeatures
            $(".corona-date-values").change(function(e) {
                console.log('change');
                _updateLayer(0);
            });
        },

        filter: function (cc) {
            var dates = [];
            var result = _data.filter(item => item.properties.cloudCoverPercentage <= cc);
            result.forEach(function(item, id) {
                if (dates.indexOf(item.properties.date) === -1) {
                    dates.push(item.properties.date);
                }
            });

            return dates;
        },

        destroy: function () {
            // mandatory - code executed when panel is closed

        }
     };

}());
