'use strict';

/* Controllers */

function IndexCtrl($scope, $http) {
    $http.get('/api/notifications').success(function(data, status, headers, config) {
        $scope.notifications = data.data;
    });

    $scope.remove = function(index) {
        let id = $scope.notifications[index]._id;
        $http.delete('/notification/' + id).success(function(data, status, headers, config) {
            $scope.notifications.splice(index, 1);
        });
    };
}
