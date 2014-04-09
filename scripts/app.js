var siren = angular
  .module('elroy', [
    'siren'
    , 'ui.state'
    , 'ngAnimate'
    , 'nvd3ChartDirectives'
    , 'luegg.directives'
    , 'sirenFilters'
    , 'sirenAppController'
    , 'sirenEntityController'
    , 'sirenMainController'
    , 'sirenServices'
  ]);

  siren.config([
    'classRouterProvider'
    , '$stateProvider'
    , function(classRouterProvider, $stateProvider) {
      // Route Siren entity classes to UI states.
      classRouterProvider
        .when(['app'], 'app')
        .otherwise('entity');

      // Configure UI states for app. (this should be rolled up into the .when declarations above
      $stateProvider
        .state('index', {
          url: '',
          templateUrl: 'partials/start.html',
          controller: 'MainCtrl'
        })
        .state('app', {
          url: '/app?url',
          templateUrl: 'partials/app.html',
          controller: 'AppCtrl'
        })
        .state('entity', {
          url: '/entity?url',
          templateUrl: 'partials/entity.html',
          controller: 'EntityCtrl'
        });
    }
  ])
  .factory('appState', function() {
    return { url: '', collection: '', query: '' };
  })
  .directive('selectOnClick', function() {
    return function(scope, element, attrs) {
      element.bind('click', function() {
        element[0].select();
      });
    };
  }).directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}])
.directive('zDnaStrip', ['$compile', function($compile) {
  function textToColor(text) {
    var code = text.split('').map(function(c) {
      return c.charCodeAt(0);
    }).reduce(function(previous, current) {
      return previous + current;
    }, 0);

    return code % 360;
  }

  function drawCanvas(context, hues, cb) {
    var unitWidth = context.canvas.width / 36;
    var x = context.canvas.width - unitWidth;
    var y = 0;
    var width = unitWidth;
    var height = context.canvas.height;

    hues.forEach(function(hue) {
      context.fillStyle = 'hsl(' + hue + ', 50%, 50%)';
      context.fillRect(x, y, width, height);
      x = x - unitWidth;
    });

    if (cb) cb();
  }

  function link(scope, element, attrs) {
    var canvas = element.children()[0];
    var context = canvas.getContext('2d');

    context.fillStyle = 'rgb(222, 222, 222)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    var hues = [];
    function getColor() {
      return textToColor(scope.entity.raw.state);
    };

    var last = getColor();
    hues.push(last);

    var index = 1;
    var interval = setInterval(function() {
      var last = getColor();
      hues.unshift(last);
      if (hues.length > 36) {
        hues = hues.slice(0, 35);
      }
      drawCanvas(context, hues);
    }, 50);
  }

  return {
    restrict: 'E',
    scope: {
      entity: '='
    },
    templateUrl: 'partials/dna-strip.html',
    link: link
  };
}])
.directive('zWampumBelt', ['$compile', function($compile) {
  function textToColor(text) {
    var code = text.split('').map(function(c) {
      return c.charCodeAt(0);
    }).reduce(function(previous, current) {
      return previous + current;
    }, 0);

    return code % 360;
  }

  function drawCanvas(context, hues, cb) {
    var unitWidth = context.canvas.width / 36;
    var x = context.canvas.width - unitWidth;
    var y = 0;
    var width = unitWidth;
    var height = 4;//context.canvas.height;

    hues.forEach(function(row) {
      row.forEach(function(hue) {
        context.fillStyle = 'hsl(' + hue + ', 50%, 50%)';
        context.fillRect(x, y, width, height);
        x = x - unitWidth;
      });
      y = y + height;
      x = context.canvas.width - unitWidth;
    });

    if (cb) cb();
  }

  function link(scope, element, attrs) {
    var canvas = element.children()[0];
    var context = canvas.getContext('2d');

    scope.$watchCollection('main.entities', function() {
      if (scope.main.entities.length === 0) {
        return;
      }

      var unitSize = 4;
      canvas.width = screen.width;//unitSize * 36;
      canvas.height = scope.main.entities.length * unitSize;
      context.fillStyle = 'rgb(222, 222, 222)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      console.log('width:', canvas.width);
      console.log('height:', canvas.height);
      console.log('length:', scope.main.entities.length);

      var hues = [];
      angular.forEach(scope.main.entities, function(entity) {
        var last = textToColor(scope.main.entities[0].raw.state);
        hues.push([last]);
      });

      var index = 1;
      var interval = setInterval(function() {
        angular.forEach(scope.main.entities, function(entity, i) {
          var last = textToColor(scope.main.entities[i].raw.state);
          hues[i].unshift(last);
          if (hues.length > 36) {
            hues[i] = hues[i].slice(0, 35);
          }
        });

        drawCanvas(context, hues);
      }, 50);
    });
  }

  return {
    restrict: 'E',
    scope: {
      main: '='
    },
    template: '<canvas class="wampum" id="wampum"></canvas>',
    link: link
  };
}])
.directive('srnAction', ['$compile', 'navigator', function($compile, navigator) {
    function link(scope, element, attrs) {
      if (!scope.action) {
        return;
      }

      var container = $('<div>');
      var visible = false;

      for(var i = 0; i < scope.action.fields.length; i++) {
        var field = scope.action.fields[i];

        var label = $('<label>')
          .addClass('control-label')
          .attr('for', scope.action.name + field.name)
          .text(field.title || field.name);

        var controls = $('<div>').addClass('controls');

        var input = $('<input>')
          .attr('name', field.name)
          .attr('id', scope.action.name + field.name)
          .attr('type', field.type || 'text')
          .attr('ng-model', 'action.fields[' + i + '].value')
          .val(field.value);
	
	if(field.type === 'file'){
	  input.attr('file-model','action.fields[' + i + '].file');
	}
	
        $compile(input)(scope);

        controls.append(input);

        if (field.type !== 'hidden') {
          visible = true;
          container.append(label);
        }

        container.append(controls);
      };

      if (!visible) {
        container.append($('<em>').text('No fields available.'));
      }

      element.replaceWith(container);
    }

    return {
      restrict: 'E',
      scope: {
        action: '=value'
      },
      link: link
    };
  }])
