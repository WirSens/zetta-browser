angular.module('zetta').controller('OverviewCtrl', [
  '$scope', '$state', '$http', '$location', '$window', 'navigator', 'zettaShared',
    function($scope, $state, $http, $location, $window, navigator, zettaShared) {
  $scope.pinned = zettaShared.state.pinned;
  $scope.servers = zettaShared.state.servers;
  $scope.muted = zettaShared.state.muted;
  
  $scope.pageNav = "top";
  
  $scope.init = function() {
    loadServers();
  };

  $scope.$watch('pageNav', function() {
    if($('#' + $scope.pageNav).length){
      var pos = $('#' + $scope.pageNav)[0].offsetTop - $('nav:first').height() - $('#wampum').height();
      
      $(window).scrollTop(pos);
      
    }
  });    
      
  function loadServers() {
    zettaShared.state.root = $state.params.url;
    zettaShared.state.breadcrumbs = [];
    zettaShared.state.onStreamUpdate = function() {
      $scope.$apply();
    };

    var rootUrl = zettaShared.state.root;

    if (!rootUrl) {
      var parser = document.createElement('a');
      parser.href = $state.params.url;
      rootUrl = parser.protocol + '//' + parser.hostname;
      if (parser.port) {
        rootUrl += ':' + parser.port;
      }

      zettaShared.state.root = rootUrl;
    }

    if ($state.params.filter) {
      $scope.filter = $state.params.filter;

      zettaShared.state.breadcrumbs = [
        { title: 'root', href: $state.params.url },
        { title: $state.params.filter }
      ];
    }

    if (!zettaShared.state.servers.length) {
      zettaShared.state.loadServers(rootUrl, function() {
        if ($state.params.filter) {
          filterServer();
        } else {
          zettaShared.state.servers.forEach(function(server) {
            server.available = true;
          })
        }
      });
    } else {
      if ($state.params.filter) {
        filterServer();
      } else {
        zettaShared.state.servers.forEach(function(server) {
          server.available = true;
        })
      }
    }
  }

  $scope.loadServer = function(server) {
    $state.params.filter = server.name;
    $location.search($state.params);
    loadServers();
    $window.scrollTo(0, 0);
  };

  var filterServer = function() {
    $scope.servers.forEach(function(server) {
      if (server.name !== $state.params.filter) {
        server.available = false;
      }
    });
  };

  $scope.resolve = function(href) {
    navigator.transitionTo(href, { url: href });
  };

  $scope.pin = function(characteristic) {
    characteristic.pinned = true;

    if (characteristic.muted) {
      $scope.unmute(characteristic);
    }

    if ($scope.pinned.indexOf(characteristic) === -1) {
      $scope.pinned.push(characteristic);
      setTimeout(function() {
        characteristic.pinOpen = true;
        $scope.$apply();
      }, 1);
    } else {
      $scope.unpin(characteristic);
    }
  };

  $scope.unpin = function(characteristic) {
    var index = $scope.pinned.indexOf(characteristic);
    if (index > -1) {
      characteristic.pinned = false;
      characteristic.pinOpen = false;
      setTimeout(function() {
        $scope.pinned.splice(index, 1);
      }, 1);
    }
  };

  $scope.mute = function(characteristic) {
    if (characteristic.pinned) {
      $scope.unpin(characteristic);
    }

    if ($scope.muted.indexOf(characteristic) === -1) {
      $scope.muted.push(characteristic);
      setTimeout(function() {
        characteristic.open = false;
        characteristic.muteOpen = true;
        $scope.$apply(function() {
          setTimeout(function() {
            characteristic.muted = true;
            $scope.$apply();
          }, 500);
        });
      }, 1);
    } else {
      $scope.unmute(characteristic);
    }
  };

  $scope.unmute = function(characteristic) {
    var index = $scope.muted.indexOf(characteristic);
    if (index > -1) {
      $scope.muted[index].muted = false;
      characteristic.muteOpen = false;
      setTimeout(function() {
        if (characteristic.available) {
          characteristic.open = true;
        }
        $scope.muted.splice(index, 1);
        $scope.$apply();
      }, 1);
    }
  };
}]);
