'use strict';

/* Controllers */

function IndexCtrl($scope, $http, $window) {
    $http.get('/api/notifications').success(function(data, status, headers, config) {
        $scope.notifications = data.data;
    });

    $scope.remove = function(index) {
        let id = $scope.notifications[index]._id;
        $http.delete('/notification/' + id).success(function(data, status, headers, config) {
            $scope.notifications.splice(index, 1);
        });
    };

    $scope.popupDiff = function(index) {
        console.log($scope.notifications[index].ts);
        let ts = new Date($scope.notifications[index].ts).getTime();
        console.log(ts);
        $window.open('/api/diffs/partial/' + ts + '/img');
    };
}
