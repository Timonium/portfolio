'use strict';

/* Directives */


angular.module('portfolio.directives', [])
  // Prevent default on <a> tags with an href of "#", "" or an ng-click attribute
  .directive('a', function() {
    return {
      restrict: 'E',
      link: function(scope, elem, attrs) {
        if(attrs.ngClick || attrs.href === '' || attrs.href === '#'){
          elem.on('click', function(e){
            e.preventDefault();
            if(attrs.ngClick){
              scope.$eval(attrs.ngClick);
            }
          });
        }
      }
    };
  })

  .directive('blogHeader', function() {
    return {
      restrict: 'EA',
      templateUrl: 'partials/header.html',
      replace: true
    };
  })

  .directive('blogSidebar', function() {
    return {
      restrict: 'EA',
      templateUrl: 'partials/sidebar.html',
      replace: true
    };
  })

  .directive('blogTags', function() {
    return {
      restrict: 'EA',
      templateUrl: 'partials/tag-cloud.html',
      controller: 'TagCloudCtrl',
      replace: true
    };
  })

  .directive('portfolioCv', function() {
    return {
      restrict: 'EA',
      templateUrl: 'partials/cv.html'
    };
  });
