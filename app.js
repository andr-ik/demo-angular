'use strict';

var app = angular.module('app', []);

app.config(['$controllerProvider', function($controllerProvider){
    $controllerProvider.allowGlobals();
}]);

app.factory('service', function($q, $http) {
    return {
		// сервис отдает данные из api yahoo finance
        getHistoricalData: function(symbols, start, end) {
		
			var promises = [];
			
			angular.forEach(symbols , function(symbols){
				var deferred = $q.defer();
				var format = '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSON_CALLBACK';
				var query = 'select * from yahoo.finance.historicaldata where symbol = "' + symbols.name + '" and startDate = "' + start + '" and endDate = "' + end + '"';
				var url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + format;

				// отправляем запрос к api, через jsonp
				$http.jsonp(url).success(function(json) {
					var quotes = json.query.results;
					var name = quotes.quote[0].Symbol;
					deferred.resolve({quote: quotes.quote.reverse(), name: name});
				});
				
				promises.push(deferred.promise);
			});
			
            return $q.all(promises);
        }
    };
});

function GraphCtrl($scope,service,dateFilter){
	$scope.symbols = [
		{ name: "GOOG", desc: "Google Inc.", done: true  },
		{ name: "FB",   desc: "Facebook Inc.", done: true  },
		{ name: "AAPL", desc: "Apple Inc.", done: false },
		{ name: "YHOO", desc: "Yahoo! Inc.", done: false },
		{ name: "AMZN", desc: "Amazon.com Inc.", done: false },
		{ name: "YNDX", desc: "Yandex N.V.", done: false }
	];
		
    $scope.items = [];
    $scope.graphsItem = [];
	
    $scope.startDate = '2015-07-01';
    $scope.endDate = '2015-07-31';
	
	$scope.$watch('startDate', function(date){
        $scope.startDate = dateFilter(date, 'yyyy-MM-dd');
    });
	
	$scope.$watch('endDate', function(date){
        $scope.endDate = dateFilter(date, 'yyyy-MM-dd');
    });
	
	var active = function(item){
		return item.done ? 1 : 0;
	}

	// получает данные из сервиса, брабатывает и строит график
    $scope.getData = function() {
        $scope.items = [];

        var promises = service.getHistoricalData($scope.symbols.filter(active), $scope.startDate, $scope.endDate);
		var datasets = [];
		
		// когда все promises придут, обрабатываем данные
		promises.then(function(data){
			angular.forEach(data , function(d){
				$scope.items = d.quote;
				var name = d.name;
				
				$scope.graphsItem = $scope.items.map(function(item){
					return item.Adj_Close
				});
				
				$scope.graphsDate = $scope.items.map(function(item){
					return item.Date;
				});
				
				datasets.push({
					label: name,
					fillColor: "rgba(151,187,205,0.2)",
					strokeColor: "rgba(151,187,205,1)",
					pointColor: "rgba(151,187,205,1)",
					pointStrokeColor: "#fff",
					pointHighlightFill: "#fff",
					pointHighlightStroke: "rgba(151,187,205,1)",
					data: $scope.graphsItem
				});
			});
			
			var data = {
				labels: $scope.graphsDate,
				datasets: datasets
			};
			
			var canvas = document.createElement("canvas");
			canvas.id = "graph";
			canvas.classList.add("col-lg-12");
			canvas.classList.add("graph");
			document.getElementById("view").innerHTML = "";
			document.getElementById("view").appendChild(canvas);
			var ctx = canvas.getContext("2d");
			var myLineChart = new Chart(ctx).Line(data);
		});
    };
	
    $scope.getData();
	
	// обновляет график
	$scope.render = function(){
		$scope.getData();
	}
}