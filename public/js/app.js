// Declare app level module which depends on filters, and services
angular.module('beardiff', ['ngRoute']).config([
    '$routeProvider',
    '$locationProvider',
    function($routeProvider, $locationProvider) {
        $routeProvider.when('/notifications', {
            templateUrl: 'partials/notis',
            controller: IndexCtrl
        }).otherwise({redirectTo: '/'});
        $locationProvider.html5Mode(true);
    }
]);
