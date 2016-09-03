'use strict';

/* Controllers */

function IndexCtrl($scope, $http) {
    $http.get('/api/notifications').success(function(data, status, headers, config) {
        $scope.notifications = data.data;
    });
}
