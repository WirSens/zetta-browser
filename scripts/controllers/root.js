angular.module('zetta').controller('RootCtrl', [
  '$scope', '$state', '$http', 'navigator', function($scope, $state, $http, navigator) {
    $scope.pinned = [];
    $scope.servers = [];
    $scope.muted = [];

    $scope.init = function() {
      $http.get($state.params.url).then(function(response) {
        var data = response.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }

        var serverLinks = data.links.filter(function(link) {
          return link.rel.indexOf('http://rels.zettajs.io/server') !== -1;
        });

        if (serverLinks.length) {
          var server = serverLinks[0];
          $scope.servers.push({
            name: server.title,
            type: 'server',
            href: server.href
          });
        }

        var peerLinks = data.links.filter(function(link) {
          return link.rel.indexOf('http://rels.zettajs.io/peer') !== -1;
        });

        peerLinks.forEach(function(peer) {
          $scope.servers.push({
            name: peer.title,
            type: 'peer',
            href: peer.href
          });
        });

        $scope.crawl();
      });
    };

    $scope.crawl = function() {
      $scope.servers.forEach(function(server) {
        $http.get(server.href).then(function(response) {
          var data = response.data;
          if (typeof data === 'string') {
            data = JSON.parse(data);
          }

          data.links.forEach(function(link) {
            if (link.rel.indexOf('monitor') !== -1) {
              server.monitorHref = link.href;
              server.monitorSocket = new WebSocket(link.href);
            }
          });
          
          if (!data.entities) {
            return;
          }

          server.devices = [];

          var devices = data.entities.filter(function(entity) {
            return entity.class.indexOf('device') !== -1;
          });

          devices.forEach(function(device) {
            var selfLink;
            device.links.forEach(function(link) {
              if (link.rel.indexOf('self') !== -1) {
                selfLink = link;
              }
            });

            if (!selfLink) {
              return;
            }

            $http.get(selfLink.href).then(function(response) {
              var deviceData = response.data;
              if (typeof deviceData === 'string') {
                deviceData = JSON.parse(deviceData);
              }

              var device = {
                href: selfLink.href
              };

              if (deviceData.properties) {
                device.name = deviceData.properties.name;
                device.type = deviceData.properties.type;
              }

              var objectStreamLinks = deviceData.links.filter(function(link) {
                return link.rel.indexOf('http://rels.zettajs.io/object-stream') !== -1;
              });

              if (objectStreamLinks.length) {
                device.streams = [];
              }

              objectStreamLinks.forEach(function(objectStream) {
                if (objectStream.title === 'logs') {
                  device.monitorHref = objectStream.href;
                  //device.socket = new WebSocket(objectStream.href);
                } else {
                  device.streams.push({
                    name: objectStream.title,
                    href: objectStream.href,
                    //socket: new WebSocket(objectStream.href),
                    current: null,
                    pinned: false,
                    muted: false
                  });
                }
              });

              if (deviceData.actions && deviceData.actions.length) {
                device.actions = deviceData.actions;
              }

              server.devices.push(device);
            });
          });
        });
      });
    };

    $scope.resolve = function(href) {
      console.log(href);
      navigator.transitionTo(href, { url: href });
    };
  }
]);
