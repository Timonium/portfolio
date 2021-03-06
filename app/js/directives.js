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
              //scope.$eval(attrs.ngClick);
            }
          });
        }
      }
    };
  })

  .directive('onFinishRender', function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        if (scope.$last === true) {
          $timeout(function () {
            scope.$emit('ngRepeatFinished');
          });
        }
      }
    };
  })

  .directive('tileGrid', function() {
    return {
      restrict: 'EA',
      controller: 'TileGridCtrl',
      scope: true
    };
  })

  .directive('blogHeader', function() {
    return {
      restrict: 'EA',
      templateUrl: 'partials/header.html',
      controller: 'HeaderCtrl',
      scope: true,
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
      replace: true,
      scope: true
    };
  })

  .directive('postTags', function() {
    return {
      restrict: 'EA',
      templateUrl: 'partials/tag-cloud-post.html',
      controller: 'TagCloudCtrl',
      replace: true,
      scope: true
    };
  })

  .directive('recentPosts', function() {
    return {
      restrict: 'EA',
      templateUrl: 'partials/recent-posts.html',
      controller: 'RecentPostsCtrl',
      replace: true,
      scope: true
    };
  })

  .directive('portfolioCv', function() {
    return {
      restrict: 'EA',
      templateUrl: 'partials/cv.html'
    };
  });
