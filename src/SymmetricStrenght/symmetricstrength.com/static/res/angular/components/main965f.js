(function (module) {
  module.filter("abs", function () {
    "use strict";
    return function (val) {
      return Math.abs(val);
    };
  });
  module.directive("convertToNumber", function () {
    "use strict";
    return {
      require: "ngModel",
      link: function (scope, element, attrs, ngModel) {
        ngModel.$parsers.push(function (val) {
          return parseFloat(val, 10);
        });
        ngModel.$formatters.push(function (val) {
          return "" + val;
        });
      },
    };
  });
  module.filter("englishStrengthScore", function () {
    "use strict";
    return function (input) {
      if (typeof input === "number") {
        return Strength.englishStrengthScore(input);
      } else {
        return "Not entered";
      }
    };
  });
  module.filter("escape", function () {
    "use strict";
    return window.encodeURIComponent;
  });
  module.controller("FriendsStatsController", [
    "MainService",
    "$scope",
    "$alert",
    "Restangular",
    function (MainService, $scope, $alert, Restangular) {
      "use strict";
      var _this = this;
      _this.lifts = Strength.lifts;
      _this.liftIsSpecial = Strength.liftIsSpecial;
      _this.displayLift = Strength.displayLift;
      _this.displayWeight = MainService.displayWeight;
      _this.friendDisplay = $scope.friendDisplay;
      _this.selectedLifts = _.filter(
        _.map(_.pairs($scope.lastSavedLiftFields), function (lf) {
          return lf[1].checked ? lf[0] : null;
        })
      );
      _this.state = {
        error: false,
        friendData: [],
        newFriendUsername: null,
        addFriendError: null,
        loadingFriendData: true,
      };
      var handleFriendData = function (response) {
        var getOneRM = function (weight, reps, convF) {
          if (!weight || !reps) {
            return null;
          } else {
            if (convF) {
              return convF(Strength.oneRepMax(weight, reps));
            } else {
              return Strength.oneRepMax(weight, reps);
            }
          }
        };
        var friendData = [];
        _.forEach(response, function (r) {
          if (r.lastLoggedLifts) {
            var convF = null;
            if (
              $scope.unitSystem &&
              r.lastLoggedLifts.unitSystem !== $scope.unitSystem
            ) {
              if ($scope.unitSystem === "Imperial") {
                convF = Strength.kgToLb;
              } else {
                convF = Strength.lbToKg;
              }
            }
            var liftStats = {};
            var bodyweight = convF
              ? convF(r.lastLoggedLifts.bodyweight)
              : r.lastLoggedLifts.bodyweight;
            var displayBodyweight = r.hideBodyweight
              ? "--"
              : Strength.mround(bodyweight, 1) +
                " " +
                Strength.displayUnits($scope.unitSystem, false);
            var bodyweightComparison = "eq";
            _.forEach(_this.lifts, function (lift) {
              liftStats[lift] = {};
              liftStats[lift].oneRM = getOneRM(
                r.lastLoggedLifts[lift + "Weight"],
                r.lastLoggedLifts[lift + "Reps"],
                convF
              );
              liftStats[lift].score =
                Math.round(
                  Strength.singleLiftStrengthScore(
                    $scope.unitSystem,
                    r.lastLoggedLifts.sex,
                    r.lastLoggedLifts.age,
                    bodyweight,
                    Strength.displayLift(lift),
                    liftStats[lift].oneRM
                  ) * 10
                ) / 10;
              liftStats[lift].displayOneRM = liftStats[lift].oneRM
                ? _this.displayWeight(
                    _this.displayLift(lift),
                    liftStats[lift].oneRM,
                    bodyweight,
                    convF ? 1 : r.lastLoggedLifts.roundTo,
                    false
                  ) +
                  " " +
                  Strength.displayUnits($scope.unitSystem, false)
                : "--";
            });
            var catScores = {};
            catScores.squat = _.max([
              liftStats.backSquat.score,
              liftStats.frontSquat.score,
            ]);
            catScores.floorPull = _.max([
              liftStats.deadlift.score,
              liftStats.sumoDeadlift.score,
              liftStats.powerClean.score,
            ]);
            catScores.horizontalPress = _.max([
              liftStats.benchPress.score,
              liftStats.inclineBenchPress.score,
              liftStats.dip.score,
            ]);
            catScores.verticalPress = _.max([
              liftStats.overheadPress.score,
              liftStats.pushPress.score,
              liftStats.snatchPress.score,
            ]);
            catScores.pullup = _.max([
              liftStats.chinup.score,
              liftStats.pullup.score,
              liftStats.pendlayRow.score,
            ]);
            var knownCatScores = _.filter([
              catScores.squat,
              catScores.floorPull,
              catScores.horizontalPress,
              catScores.verticalPress,
              catScores.pullup,
            ]);
            var totalScore =
              Math.round(
                (_.sum(knownCatScores) / _.size(knownCatScores)) * 10
              ) / 10;
            var liftStatComparisons = {};
            var catScoreComparisons = {
              squat: "eq",
              floorPull: "eq",
              horizontalPress: "eq",
              verticalPress: "eq",
              pullup: "eq",
            };
            var totalScoreComparison = "eq";
            _.forEach(_this.lifts, function (lift) {
              liftStatComparisons[lift] = { score: "eq", oneRM: "eq" };
            });
            if (r.lastSeenLifts) {
              convF = null;
              if (
                $scope.unitSystem &&
                r.lastSeenLifts.unitSystem !== $scope.unitSystem
              ) {
                if ($scope.unitSystem === "Imperial") {
                  convF = Strength.kgToLb;
                } else {
                  convF = Strength.lbToKg;
                }
              }
              var liftStatsOld = {};
              var bodyweightOld = convF
                ? convF(r.lastSeenLifts.bodyweight)
                : r.lastSeenLifts.bodyweight;
              _.forEach(_this.lifts, function (lift) {
                liftStatsOld[lift] = {};
                liftStatsOld[lift].oneRM = getOneRM(
                  r.lastSeenLifts[lift + "Weight"],
                  r.lastSeenLifts[lift + "Reps"],
                  convF
                );
                liftStatsOld[lift].score =
                  Math.round(
                    Strength.singleLiftStrengthScore(
                      $scope.unitSystem,
                      r.lastSeenLifts.sex,
                      r.lastSeenLifts.age,
                      bodyweightOld,
                      Strength.displayLift(lift),
                      liftStatsOld[lift].oneRM
                    ) * 10
                  ) / 10;
                if (liftStats[lift].oneRM && liftStatsOld[lift].oneRM) {
                  if (liftStats[lift].oneRM > liftStatsOld[lift].oneRM) {
                    liftStatComparisons[lift].oneRM = "gt";
                  } else if (liftStats[lift].oneRM < liftStatsOld[lift].oneRM) {
                    liftStatComparisons[lift].oneRM = "lt";
                  }
                }
                if (liftStats[lift].score && liftStatsOld[lift].score) {
                  if (liftStats[lift].score > liftStatsOld[lift].score) {
                    liftStatComparisons[lift].score = "gt";
                  } else if (liftStats[lift].score < liftStatsOld[lift].score) {
                    liftStatComparisons[lift].score = "lt";
                  }
                }
              });
              var catScoresOld = {};
              catScoresOld.squat = _.max([
                liftStatsOld.backSquat.score,
                liftStatsOld.frontSquat.score,
              ]);
              catScoresOld.floorPull = _.max([
                liftStatsOld.deadlift.score,
                liftStatsOld.sumoDeadlift.score,
                liftStatsOld.powerClean.score,
              ]);
              catScoresOld.horizontalPress = _.max([
                liftStatsOld.benchPress.score,
                liftStatsOld.inclineBenchPress.score,
                liftStatsOld.dip.score,
              ]);
              catScoresOld.verticalPress = _.max([
                liftStatsOld.overheadPress.score,
                liftStatsOld.pushPress.score,
                liftStatsOld.snatchPress.score,
              ]);
              catScoresOld.pullup = _.max([
                liftStatsOld.chinup.score,
                liftStatsOld.pullup.score,
                liftStatsOld.pendlayRow.score,
              ]);
              _.forEach(
                [
                  "squat",
                  "floorPull",
                  "horizontalPress",
                  "verticalPress",
                  "pullup",
                ],
                function (c) {
                  if (catScores[c] && catScoresOld[c]) {
                    if (catScores[c] > catScoresOld[c]) {
                      catScoreComparisons[c] = "gt";
                    } else if (catScores[c] < catScoresOld[c]) {
                      catScoreComparisons[c] = "lt";
                    }
                  }
                }
              );
              var knownCatScoresOld = _.filter([
                catScoresOld.squat,
                catScoresOld.floorPull,
                catScoresOld.horizontalPress,
                catScoresOld.verticalPress,
                catScoresOld.pullup,
              ]);
              var totalScoreOld =
                Math.round(
                  (_.sum(knownCatScoresOld) / _.size(knownCatScoresOld)) * 10
                ) / 10;
              if (totalScore > totalScoreOld) {
                totalScoreComparison = "gt";
              } else if (totalScore < totalScoreOld) {
                totalScoreComparison = "lt";
              }
              if (!r.hideBodyweight) {
                if (bodyweight > bodyweightOld) {
                  bodyweightComparison = "gt";
                } else if (bodyweight < bodyweightOld) {
                  bodyweightComparison = "lt";
                }
              }
            }
            friendData.push({
              username: r.username,
              liftStats: liftStats,
              catScores: catScores,
              totalScore: totalScore,
              bodyweight: displayBodyweight,
              liftStatComparisons: liftStatComparisons,
              catScoreComparisons: catScoreComparisons,
              totalScoreComparison: totalScoreComparison,
              bodyweightComparison: bodyweightComparison,
            });
          }
        });
        _this.state.friendData = _.sortBy(friendData, function (fd) {
          return -fd.totalScore;
        });
        _this.state.loadingFriendData = false;
      };
      _this.handleFriendDisplayChanged = function () {
        var updatedDisplayPreferenceF = Restangular.one("/api/friend_display");
        updatedDisplayPreferenceF.friendDisplay = _this.friendDisplay;
        updatedDisplayPreferenceF.put();
      };
      var getFriendData = function () {
        Restangular.all("/api/friend")
          .getList()
          .then(
            function (response) {
              handleFriendData(response);
            },
            function (response) {
              _this.error = response.data || response;
            }
          );
      };
      _this.addNewFriend = function () {
        _this.state.addFriendError = null;
        Restangular.all("/api/friend")
          .post({ username: _this.state.newFriendUsername })
          .then(
            function () {
              _this.state.friendData = [];
              _this.state.loadingFriendData = true;
              getFriendData();
              $alert({
                title:
                  "Added " + _this.state.newFriendUsername + " as a friend!",
                placement: "top-right",
                container: "#wrapper",
                type: "success",
                show: true,
                duration: 3,
              });
              _this.state.newFriendUsername = null;
            },
            function () {
              _this.state.addFriendError =
                "Oops! There was a problem adding " +
                _this.state.newFriendUsername +
                " as a friend. Make sure you spelled the username correctly.";
            }
          );
      };
      getFriendData();
    },
  ]);
  module.directive("friendsStats", function () {
    "use strict";
    return {
      restrict: "E",
      templateUrl: "friends-stats",
      scope: { unitSystem: "@", friendDisplay: "@", lastSavedLiftFields: "=" },
      controller: "FriendsStatsController",
      controllerAs: "friendsStatsCtrl",
    };
  });
  module.directive("googleAdsense", [
    "$window",
    "$compile",
    function ($window, $compile) {
      "use strict";
      var adSenseTpl =
        '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7045305996532700" data-ad-slot="1781348279" data-ad-format="auto"></ins>';
      return {
        restrict: "A",
        transclude: true,
        template: adSenseTpl,
        replace: false,
        link: function postLink(scope, element) {
          element.html("");
          element.append(angular.element($compile(adSenseTpl)(scope)));
          if (!$window.adsbygoogle) {
            $window.adsbygoogle = [];
          }
          $window.adsbygoogle.push({});
        },
      };
    },
  ]);
  module.directive("liftsForm", function () {
    "use strict";
    return { restrict: "E", templateUrl: "lifts-form" };
  });
  module.controller("MainController", [
    "MainService",
    "$timeout",
    "$cookies",
    "$scope",
    "$q",
    "$alert",
    "$http",
    "$window",
    "Restangular",
    function (
      MainService,
      $timeout,
      $cookies,
      $scope,
      $q,
      $alert,
      $http,
      $window,
      Restangular
    ) {
      "use strict";
      var _this = this;
      MainService.initState($scope.username);
      _this.state = MainService.state;
      _this.products = [];
      _this.lifts = Strength.lifts;
      _this.muscleGroups = Strength.muscleGroups;
      _this.liftIsSpecial = Strength.liftIsSpecial;
      _this.displayLift = Strength.displayLift;
      _this.displayWeight = MainService.displayWeight;
      _this.displayUnits = MainService.displayUnits;
      _this.displayMuscleGroup = Strength.displayMuscleGroup;
      _this.hideWeight = $scope.hideWeight === "True";
      _this.pageIsPublic = $scope.pageIsPublic === "True";
      _this.showAndroidAppImg = false;
      var preFillFromCookies = function () {
        var lifterStats = $cookies.getObject("lifterStats");
        if (lifterStats) {
          if (lifterStats.unitSystem) {
            _this.state.unitSystem = lifterStats.unitSystem;
          }
          if (lifterStats.roundCalculationsTo) {
            _this.state.roundCalculationsTo = lifterStats.roundCalculationsTo;
          }
          if (lifterStats.sex) {
            _this.state.sex = lifterStats.sex;
          }
          if (lifterStats.age) {
            _this.state.age = lifterStats.age;
          }
          if (lifterStats.bodyweight) {
            _this.state.bodyweight = lifterStats.bodyweight;
          }
          if (lifterStats.lifts) {
            _.forEach(_this.lifts, function (lift) {
              if (lifterStats.lifts[lift]) {
                _this.state.liftFields[lift].checked =
                  lifterStats.lifts[lift].checked;
                if (lifterStats.lifts[lift].weight) {
                  _this.state.liftFields[lift].weight =
                    lifterStats.lifts[lift].weight;
                }
                if (lifterStats.lifts[lift].reps) {
                  _this.state.liftFields[lift].reps =
                    lifterStats.lifts[lift].reps;
                }
                if (lifterStats.lifts[lift].liftType) {
                  _this.state.liftFields[lift].liftType =
                    lifterStats.lifts[lift].liftType;
                }
                if (lifterStats.lifts[lift].specialWeight) {
                  _this.state.liftFields[lift].specialWeight =
                    lifterStats.lifts[lift].specialWeight;
                }
              }
            });
          }
        }
      };
      var preFillFromURL = function () {
        var urlParams;
        (window.onpopstate = function () {
          var match,
            pl = /\+/g,
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) {
              return decodeURIComponent(s.replace(pl, " "));
            },
            query = window.location.search.substring(1);
          urlParams = {};
          while ((match = search.exec(query))) {
            urlParams[decode(match[1])] = decode(match[2]);
          }
        })();
        _this.state.unitSystem = urlParams.unitSystem;
        if (
          _this.state.unitSystem !== "Imperial" &&
          _this.state.unitSystem !== "Metric"
        ) {
          $window.location.href = "/";
        }
        _this.state.roundCalculationsTo = parseInt(
          urlParams.roundCalculationsTo || 1
        );
        if (
          _this.state.roundCalculationsTo !== 1 &&
          _this.state.roundCalculationsTo !== 2.5 &&
          _this.state.roundCalculationsTo !== 5 &&
          _this.state.roundCalculationsTo !== 10
        ) {
          $window.location.href = "/";
        }
        _this.state.sex = urlParams.sex;
        if (_this.state.sex !== "Male" && _this.state.sex !== "Female") {
          $window.location.href = "/";
        }
        _this.state.bodyweight = Strength.mround(
          parseFloat(urlParams.bodyweight),
          1
        );
        if (isNaN(_this.state.bodyweight)) {
          $window.location.href = "/";
        }
        _.forEach(_this.lifts, function (lift) {
          if (urlParams[lift + "Weight"]) {
            _this.state.liftFields[lift].checked = true;
            _this.state.liftFields[lift].weight = parseFloat(
              urlParams[lift + "Weight"]
            );
            _this.state.liftFields[lift].reps = parseInt(
              urlParams[lift + "Reps"] || 1
            );
            if (
              isNaN(_this.state.liftFields[lift].weight) ||
              _this.state.liftFields[lift].weight <= 0
            ) {
              _this.state.liftFields[lift].checked = false;
              _this.state.liftFields[lift].weight = null;
              _this.state.liftFields[lift].reps = null;
            }
            if (
              isNaN(_this.state.liftFields[lift].reps) ||
              _this.state.liftFields[lift].reps < 1 ||
              _this.state.liftFields[lift].reps > 10
            ) {
              _this.state.liftFields[lift].checked = false;
              _this.state.liftFields[lift].weight = null;
              _this.state.liftFields[lift].reps = null;
            }
          } else {
            _this.state.liftFields[lift].checked = false;
          }
        });
      };
      var preFillFromServer = function (username) {
        var apiUrl = "/api/lifts";
        if (typeof username !== "undefined") {
          apiUrl = "/api/lifts/" + username;
        }
        var deferred = $q.defer();
        Restangular.one(apiUrl)
          .get()
          .then(
            function (liftData) {
              if (!liftData) {
                _this.state.waitingForLastSaved = false;
                deferred.reject("No lifting data.");
                return deferred.promise;
              }
              _this.state.unitSystem = liftData.unitSystem;
              _this.state.roundCalculationsTo = liftData.roundTo;
              _this.state.sex = liftData.sex;
              _this.state.age = liftData.age;
              _this.state.bodyweight = liftData.bodyweight;
              if (liftData.backSquatWeight && liftData.backSquatReps) {
                _this.state.liftFields.backSquat.checked = true;
                _this.state.liftFields.backSquat.weight =
                  liftData.backSquatWeight;
                _this.state.liftFields.backSquat.reps = liftData.backSquatReps;
              } else {
                _this.state.liftFields.backSquat.checked = false;
              }
              if (liftData.frontSquatWeight && liftData.frontSquatReps) {
                _this.state.liftFields.frontSquat.checked = true;
                _this.state.liftFields.frontSquat.weight =
                  liftData.frontSquatWeight;
                _this.state.liftFields.frontSquat.reps =
                  liftData.frontSquatReps;
              } else {
                _this.state.liftFields.frontSquat.checked = false;
              }
              if (liftData.deadliftWeight && liftData.deadliftReps) {
                _this.state.liftFields.deadlift.checked = true;
                _this.state.liftFields.deadlift.weight =
                  liftData.deadliftWeight;
                _this.state.liftFields.deadlift.reps = liftData.deadliftReps;
              } else {
                _this.state.liftFields.deadlift.checked = false;
              }
              if (liftData.sumoDeadliftWeight && liftData.sumoDeadliftReps) {
                _this.state.liftFields.sumoDeadlift.checked = true;
                _this.state.liftFields.sumoDeadlift.weight =
                  liftData.sumoDeadliftWeight;
                _this.state.liftFields.sumoDeadlift.reps =
                  liftData.sumoDeadliftReps;
              } else {
                _this.state.liftFields.sumoDeadlift.checked = false;
              }
              if (liftData.powerCleanWeight && liftData.powerCleanReps) {
                _this.state.liftFields.powerClean.checked = true;
                _this.state.liftFields.powerClean.weight =
                  liftData.powerCleanWeight;
                _this.state.liftFields.powerClean.reps =
                  liftData.powerCleanReps;
              } else {
                _this.state.liftFields.powerClean.checked = false;
              }
              if (liftData.benchPressWeight && liftData.benchPressReps) {
                _this.state.liftFields.benchPress.checked = true;
                _this.state.liftFields.benchPress.weight =
                  liftData.benchPressWeight;
                _this.state.liftFields.benchPress.reps =
                  liftData.benchPressReps;
              } else {
                _this.state.liftFields.benchPress.checked = false;
              }
              if (
                liftData.inclineBenchPressWeight &&
                liftData.inclineBenchPressReps
              ) {
                _this.state.liftFields.inclineBenchPress.checked = true;
                _this.state.liftFields.inclineBenchPress.weight =
                  liftData.inclineBenchPressWeight;
                _this.state.liftFields.inclineBenchPress.reps =
                  liftData.inclineBenchPressReps;
              } else {
                _this.state.liftFields.inclineBenchPress.checked = false;
              }
              if (liftData.dipWeight && liftData.dipReps) {
                _this.state.liftFields.dip.checked = true;
                _this.state.liftFields.dip.weight = liftData.dipWeight;
                _this.state.liftFields.dip.reps = liftData.dipReps;
                if (liftData.dipWeight < liftData.bodyweight) {
                  _this.state.liftFields.dip.liftType = "Assisted";
                  _this.state.liftFields.dip.specialWeight =
                    Math.round(
                      (liftData.bodyweight - liftData.dipWeight) * 10
                    ) / 10;
                } else if (liftData.dipWeight > liftData.bodyweight) {
                  _this.state.liftFields.dip.liftType = "Weighted";
                  _this.state.liftFields.dip.specialWeight =
                    Math.round(
                      (liftData.dipWeight - liftData.bodyweight) * 10
                    ) / 10;
                } else {
                  _this.state.liftFields.dip.liftType = "Standard";
                }
              } else {
                _this.state.liftFields.dip.checked = false;
              }
              if (liftData.overheadPressWeight && liftData.overheadPressReps) {
                _this.state.liftFields.overheadPress.checked = true;
                _this.state.liftFields.overheadPress.weight =
                  liftData.overheadPressWeight;
                _this.state.liftFields.overheadPress.reps =
                  liftData.overheadPressReps;
              } else {
                _this.state.liftFields.overheadPress.checked = false;
              }
              if (liftData.pushPressWeight && liftData.pushPressReps) {
                _this.state.liftFields.pushPress.checked = true;
                _this.state.liftFields.pushPress.weight =
                  liftData.pushPressWeight;
                _this.state.liftFields.pushPress.reps = liftData.pushPressReps;
              } else {
                _this.state.liftFields.pushPress.checked = false;
              }
              if (liftData.snatchPressWeight && liftData.snatchPressReps) {
                _this.state.liftFields.snatchPress.checked = true;
                _this.state.liftFields.snatchPress.weight =
                  liftData.snatchPressWeight;
                _this.state.liftFields.snatchPress.reps =
                  liftData.snatchPressReps;
              } else {
                _this.state.liftFields.snatchPress.checked = false;
              }
              if (liftData.chinupWeight && liftData.chinupReps) {
                _this.state.liftFields.chinup.checked = true;
                _this.state.liftFields.chinup.weight = liftData.chinupWeight;
                _this.state.liftFields.chinup.reps = liftData.chinupReps;
                if (liftData.chinupWeight < liftData.bodyweight) {
                  _this.state.liftFields.chinup.liftType = "Assisted";
                  _this.state.liftFields.chinup.specialWeight =
                    Math.round(
                      (liftData.bodyweight - liftData.chinupWeight) * 10
                    ) / 10;
                } else if (liftData.chinupWeight > liftData.bodyweight) {
                  _this.state.liftFields.chinup.liftType = "Weighted";
                  _this.state.liftFields.chinup.specialWeight =
                    Math.round(
                      (liftData.chinupWeight - liftData.bodyweight) * 10
                    ) / 10;
                } else {
                  _this.state.liftFields.chinup.liftType = "Standard";
                }
              } else {
                _this.state.liftFields.chinup.checked = false;
              }
              if (liftData.pullupWeight && liftData.pullupReps) {
                _this.state.liftFields.pullup.checked = true;
                _this.state.liftFields.pullup.weight = liftData.pullupWeight;
                _this.state.liftFields.pullup.reps = liftData.pullupReps;
                if (liftData.pullupWeight < liftData.bodyweight) {
                  _this.state.liftFields.pullup.liftType = "Assisted";
                  _this.state.liftFields.pullup.specialWeight =
                    Math.round(
                      (liftData.bodyweight - liftData.pullupWeight) * 10
                    ) / 10;
                } else if (liftData.pullupWeight > liftData.bodyweight) {
                  _this.state.liftFields.pullup.liftType = "Weighted";
                  _this.state.liftFields.pullup.specialWeight =
                    Math.round(
                      (liftData.pullupWeight - liftData.bodyweight) * 10
                    ) / 10;
                } else {
                  _this.state.liftFields.pullup.liftType = "Standard";
                }
              } else {
                _this.state.liftFields.pullup.checked = false;
              }
              if (liftData.pendlayRowWeight && liftData.pendlayRowReps) {
                _this.state.liftFields.pendlayRow.checked = true;
                _this.state.liftFields.pendlayRow.weight =
                  liftData.pendlayRowWeight;
                _this.state.liftFields.pendlayRow.reps =
                  liftData.pendlayRowReps;
              } else {
                _this.state.liftFields.pendlayRow.checked = false;
              }
              _this.state.lastSavedLiftFields = _.cloneDeep(
                _this.state.liftFields
              );
              _this.state.lastSavedLiftFields.timeLogged = new Date(
                liftData.timeLogged
              );
              _this.state.waitingForLastSaved = false;
              deferred.resolve(true);
            },
            function (response) {
              _this.state.waitingForLastSaved = false;
              deferred.reject(response.data || response);
            }
          );
        return deferred.promise;
      };
      var convertAllWeights = function (unitSystem) {
        var fConvert =
          unitSystem === "Imperial" ? Strength.kgToLb : Strength.lbToKg;
        _this.state.bodyweight = Strength.mround(
          fConvert(_this.state.bodyweight),
          1
        );
        _.forEach(_this.state.liftFields, function (lf) {
          lf.weight = Strength.mround(fConvert(lf.weight), 1);
          if (lf.specialWeight) {
            lf.specialWeight = Strength.mround(fConvert(lf.specialWeight), 1);
          }
        });
        _.forEach(_this.state.lastSavedLiftFields, function (lf) {
          lf.weight = Strength.mround(fConvert(lf.weight), 1);
          if (lf.specialWeight) {
            lf.specialWeight = Strength.mround(fConvert(lf.specialWeight), 1);
          }
        });
        _this.state.unitsConverted = true;
      };
      var preFillFromServerAndConvert = function () {
        var deferred = $q.defer();
        preFillFromServer($scope.username).then(
          function () {
            if ($scope.pageType === "defaultPublic") {
              var lifterStats = $cookies.getObject("lifterStats");
              if (
                lifterStats &&
                lifterStats.unitSystem !== _this.state.unitSystem
              ) {
                _this.state.unitSystem = lifterStats.unitSystem;
                convertAllWeights(_this.state.unitSystem);
              }
              deferred.resolve(true);
            } else if ($scope.pageType === "loggedInPublic") {
              Restangular.one("/api/lifts")
                .get()
                .then(
                  function (liftData) {
                    if (
                      liftData &&
                      liftData.unitSystem !== _this.state.unitSystem
                    ) {
                      _this.state.unitSystem = liftData.unitSystem;
                      convertAllWeights(_this.state.unitSystem);
                    }
                    deferred.resolve(true);
                  },
                  function () {
                    deferred.resolve(true);
                  }
                );
            }
          },
          function () {
            deferred.reject("No lifting data.");
            _this.state.noLiftingDataError = true;
          }
        );
        return deferred.promise;
      };
      _this.calculateResults = function () {
        if (MainService.calculateResults()) {
          _this.displayCharts();
          if (window.location.href.match(/symmetricstrength\.com/)) {
            ga("send", "event", "button", "click", "analyze_strength");
          }
          if ($scope.pageType === "default") {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 30);
            $cookies.putObject(
              "lifterStats",
              {
                unitSystem: _this.state.unitSystem,
                roundCalculationsTo: _this.state.roundCalculationsTo,
                sex: _this.state.sex,
                age: _this.state.age,
                bodyweight: _this.state.bodyweight,
                lifts: _this.state.liftFields,
              },
              { expires: expireDate }
            );
          }
          return true;
        }
        return false;
      };
      _this.saveLifts = function () {
        Restangular.all("/api/lifts")
          .post({
            unitSystem: _this.state.unitSystem,
            roundTo: _this.state.roundCalculationsTo,
            sex: _this.state.sex,
            age: _this.state.age || null,
            bodyweight: _this.state.bodyweight,
            backSquatWeight: _this.state.liftFields.backSquat.checked
              ? _this.state.liftFields.backSquat.weight
              : null,
            backSquatReps: _this.state.liftFields.backSquat.checked
              ? _this.state.liftFields.backSquat.reps
              : null,
            frontSquatWeight: _this.state.liftFields.frontSquat.checked
              ? _this.state.liftFields.frontSquat.weight
              : null,
            frontSquatReps: _this.state.liftFields.frontSquat.checked
              ? _this.state.liftFields.frontSquat.reps
              : null,
            deadliftWeight: _this.state.liftFields.deadlift.checked
              ? _this.state.liftFields.deadlift.weight
              : null,
            deadliftReps: _this.state.liftFields.deadlift.checked
              ? _this.state.liftFields.deadlift.reps
              : null,
            sumoDeadliftWeight: _this.state.liftFields.sumoDeadlift.checked
              ? _this.state.liftFields.sumoDeadlift.weight
              : null,
            sumoDeadliftReps: _this.state.liftFields.sumoDeadlift.checked
              ? _this.state.liftFields.sumoDeadlift.reps
              : null,
            powerCleanWeight: _this.state.liftFields.powerClean.checked
              ? _this.state.liftFields.powerClean.weight
              : null,
            powerCleanReps: _this.state.liftFields.powerClean.checked
              ? _this.state.liftFields.powerClean.reps
              : null,
            benchPressWeight: _this.state.liftFields.benchPress.checked
              ? _this.state.liftFields.benchPress.weight
              : null,
            benchPressReps: _this.state.liftFields.benchPress.checked
              ? _this.state.liftFields.benchPress.reps
              : null,
            inclineBenchPressWeight: _this.state.liftFields.inclineBenchPress
              .checked
              ? _this.state.liftFields.inclineBenchPress.weight
              : null,
            inclineBenchPressReps: _this.state.liftFields.inclineBenchPress
              .checked
              ? _this.state.liftFields.inclineBenchPress.reps
              : null,
            dipWeight: _this.state.liftFields.dip.checked
              ? _this.state.liftFields.dip.weight
              : null,
            dipReps: _this.state.liftFields.dip.checked
              ? _this.state.liftFields.dip.reps
              : null,
            overheadPressWeight: _this.state.liftFields.overheadPress.checked
              ? _this.state.liftFields.overheadPress.weight
              : null,
            overheadPressReps: _this.state.liftFields.overheadPress.checked
              ? _this.state.liftFields.overheadPress.reps
              : null,
            pushPressWeight: _this.state.liftFields.pushPress.checked
              ? _this.state.liftFields.pushPress.weight
              : null,
            pushPressReps: _this.state.liftFields.pushPress.checked
              ? _this.state.liftFields.pushPress.reps
              : null,
            snatchPressWeight: _this.state.liftFields.snatchPress.checked
              ? _this.state.liftFields.snatchPress.weight
              : null,
            snatchPressReps: _this.state.liftFields.snatchPress.checked
              ? _this.state.liftFields.snatchPress.reps
              : null,
            chinupWeight: _this.state.liftFields.chinup.checked
              ? _this.state.liftFields.chinup.weight
              : null,
            chinupReps: _this.state.liftFields.chinup.checked
              ? _this.state.liftFields.chinup.reps
              : null,
            pullupWeight: _this.state.liftFields.pullup.checked
              ? _this.state.liftFields.pullup.weight
              : null,
            pullupReps: _this.state.liftFields.pullup.checked
              ? _this.state.liftFields.pullup.reps
              : null,
            pendlayRowWeight: _this.state.liftFields.pendlayRow.checked
              ? _this.state.liftFields.pendlayRow.weight
              : null,
            pendlayRowReps: _this.state.liftFields.pendlayRow.checked
              ? _this.state.liftFields.pendlayRow.reps
              : null,
          })
          .then(function () {
            $alert({
              title: "Lifts saved!",
              placement: "top-right",
              container: "#wrapper",
              type: "success",
              show: true,
              duration: 3,
            });
            _this.state.lastSavedLiftFields = _.cloneDeep(
              _this.state.liftFields
            );
            _this.state.lastSavedLiftFields.timeLogged = new Date();
          });
        return true;
      };
      _this.loadLifts = function () {
        preFillFromServer().then(function () {
          if (_this.state.resultsShown) {
            _this.calculateResults();
          }
        });
      };
      _this.displayCharts = function () {
        var activeLifts = [];
        _.forEach(_.pairs(_this.state.results.lifts), function (lift) {
          if (lift[1].user1RM) {
            activeLifts.push({
              name: _this.displayLift(lift[0]),
              user1RM: lift[1].user1RM,
              expected: lift[1].expected,
              relVsAvg: Math.round(
                ((lift[1].user1RM - lift[1].expected) / lift[1].expected) * 100
              ),
            });
          }
        });
        activeLifts.reverse();
        if (!_this.hideWeight) {
          _this.liftsVsAverageChart = echarts.init(
            document.getElementById("lifts-vs-average-chart")
          );
        }
        _this.strengthsAndWeaknessesChart = echarts.init(
          document.getElementById("strengths-and-weaknesses-chart")
        );
        var youOrUsers = function (possessive, lowercase) {
          if (
            $scope.pageType === "defaultPublic" ||
            $scope.pageType === "loggedInPublic"
          ) {
            if (possessive) {
              return $scope.username + "'s";
            } else {
              return $scope.username;
            }
          } else {
            var word = "";
            if (possessive) {
              word = "Your";
            } else {
              word = "You";
            }
            return lowercase ? word.toLowerCase() : word;
          }
        };
        if (!_this.hideWeight) {
          var option = {
            title: {
              text: "Lifts vs Average",
              subtext:
                youOrUsers(true, false) +
                " lifts versus those of an average lifter at " +
                youOrUsers(true, true) +
                " strength level",
            },
            tooltip: {
              trigger: "axis",
              formatter: function (params) {
                var firstSeries = params[0];
                var secondSeries = params[1];
                var strengthScore = 0;
                if (
                  typeof firstSeries === "undefined" &&
                  typeof secondSeries === "undefined"
                ) {
                  return "";
                } else if (typeof firstSeries === "undefined") {
                  strengthScore = Strength.singleLiftStrengthScore(
                    _this.state.unitSystem,
                    _this.state.sex,
                    _this.state.age,
                    _this.state.bodyweight,
                    secondSeries.name,
                    secondSeries.data
                  );
                  return (
                    secondSeries.name +
                    "<br />" +
                    secondSeries.seriesName +
                    ": " +
                    _this.displayWeight(
                      secondSeries.name,
                      secondSeries.data,
                      _this.state.bodyweight,
                      _this.state.roundCalculationsTo
                    ) +
                    " " +
                    _this.displayUnits() +
                    (secondSeries.seriesName === "You"
                      ? " [" +
                        Strength.englishStrengthScore(strengthScore) +
                        "]"
                      : "")
                  );
                } else if (typeof secondSeries === "undefined") {
                  strengthScore = Strength.singleLiftStrengthScore(
                    _this.state.unitSystem,
                    _this.state.sex,
                    _this.state.age,
                    _this.state.bodyweight,
                    firstSeries.name,
                    firstSeries.data
                  );
                  return (
                    firstSeries.name +
                    "<br />" +
                    firstSeries.seriesName +
                    ": " +
                    _this.displayWeight(
                      firstSeries.name,
                      firstSeries.data,
                      _this.state.bodyweight,
                      _this.state.roundCalculationsTo
                    ) +
                    " " +
                    _this.displayUnits() +
                    (firstSeries.seriesName === "You"
                      ? " [" +
                        Strength.englishStrengthScore(strengthScore) +
                        "]"
                      : "")
                  );
                } else {
                  var you = firstSeries;
                  var avg = secondSeries;
                  strengthScore = Strength.singleLiftStrengthScore(
                    _this.state.unitSystem,
                    _this.state.sex,
                    _this.state.age,
                    _this.state.bodyweight,
                    you.name,
                    you.data
                  );
                  var relVsAvg = Math.round(
                    ((you.data - avg.data) / avg.data) * 100
                  );
                  var strongerOrWeaker = relVsAvg < 0 ? "weaker" : "stronger";
                  return (
                    '<div class="lift-vs-avg-tooltip"><div class="lift-name">' +
                    you.name +
                    '</div><div class="you">' +
                    you.seriesName +
                    ": " +
                    _this.displayWeight(
                      you.name,
                      you.data,
                      _this.state.bodyweight,
                      _this.state.roundCalculationsTo
                    ) +
                    " " +
                    _this.displayUnits() +
                    '<span class="lift-category-classification">[' +
                    Strength.englishStrengthScore(strengthScore) +
                    ']</span></div><div class="avg">' +
                    avg.seriesName +
                    ": " +
                    _this.displayWeight(
                      avg.name,
                      avg.data,
                      _this.state.bodyweight,
                      _this.state.roundCalculationsto
                    ) +
                    " " +
                    _this.displayUnits() +
                    '</div><div class="lift-vs-avg-info">Compared to the average lifter<br />at ' +
                    youOrUsers(true, true) +
                    " strength level, " +
                    youOrUsers(true, true) +
                    "<br />" +
                    you.name +
                    ' is <span class="' +
                    strongerOrWeaker +
                    '">' +
                    Math.abs(relVsAvg) +
                    "% " +
                    strongerOrWeaker +
                    "</span>.</div></div>"
                  );
                }
              },
            },
            legend: { data: [youOrUsers(false, false), "Average"] },
            grid: { x: 130, x2: 20 },
            calculable: false,
            yAxis: [{ type: "category", data: _.map(activeLifts, "name") }],
            xAxis: [
              {
                type: "value",
                axisLabel: {
                  formatter: function (s) {
                    return s + " " + _this.displayUnits();
                  },
                },
              },
            ],
            series: [
              {
                name: youOrUsers(false, false),
                type: "bar",
                data: _.map(activeLifts, "user1RM"),
                itemStyle: {
                  normal: {
                    color: Strength.strengthColor(
                      _this.state.results.totalScore
                    ),
                  },
                },
              },
              {
                name: "Average",
                type: "bar",
                data: _.map(activeLifts, "expected"),
                itemStyle: { normal: { color: "#999999" } },
              },
            ],
          };
          _this.liftsVsAverageChart.setOption(option);
        }
        var option2 = {
          title: {
            text: "Relative strengths and weaknesses",
            subtext:
              "How " +
              youOrUsers(false, true) +
              " compare" +
              ($scope.pageType === "defaultPublic" ||
              $scope.pageType === "loggedInPublic"
                ? "s"
                : "") +
              " to other lifters at " +
              youOrUsers(true, true) +
              " strength level",
          },
          tooltip: {
            trigger: "axis",
            formatter: function (params) {
              var you = params[0];
              var strongWeakText = function (d) {
                if (d >= 0) {
                  return d + "% stronger";
                } else {
                  return Math.abs(d) + "% weaker";
                }
              };
              var strongerOrWeaker = you.data < 0 ? "weaker" : "stronger";
              return (
                '<div class="lift-vs-avg-tooltip"><div class="lift-name">' +
                you.name +
                '</div><div class="you"><span class="' +
                strongerOrWeaker +
                '">' +
                strongWeakText(you.data) +
                "</span> than the average<br />lifter at " +
                youOrUsers(true, true) +
                " strength level</div></div>"
              );
            },
          },
          grid: { x: 130, x2: 20 },
          calculable: false,
          yAxis: [{ type: "category", data: _.map(activeLifts, "name") }],
          xAxis: [
            {
              type: "value",
              axisLabel: {
                formatter: function (s) {
                  if (s <= 0) {
                    return s + "%";
                  } else {
                    return "+" + s + "%";
                  }
                },
              },
            },
          ],
          series: [
            {
              name: "Comparison to avg lifter",
              type: "bar",
              data: _.map(activeLifts, "relVsAvg"),
              itemStyle: {
                normal: {
                  color: function (params) {
                    var color1 = "#a94442";
                    var color2 = "#3c7630";
                    if (typeof params.data !== "number") {
                      return "#ffff00";
                    } else if (params.data < 0) {
                      return color1;
                    } else {
                      return color2;
                    }
                  },
                  label: {
                    show: true,
                    position: "inside",
                    textStyle: { fontWeight: "bold" },
                    formatter: function (params) {
                      if (params.data <= 0) {
                        return params.data + "%";
                      } else {
                        return "+" + params.data + "%";
                      }
                    },
                  },
                },
              },
            },
          ],
        };
        _this.strengthsAndWeaknessesChart.setOption(option2);
        $timeout(function () {
          if (!_this.hideWeight) {
            _this.liftsVsAverageChart.restore();
            _this.liftsVsAverageChart.resize();
          }
          _this.strengthsAndWeaknessesChart.restore();
          _this.strengthsAndWeaknessesChart.resize();
          $timeout(function () {
            if (!_this.hideWeight) {
              _this.liftsVsAverageChart.restore();
              _this.liftsVsAverageChart.resize();
            }
            _this.strengthsAndWeaknessesChart.restore();
            _this.strengthsAndWeaknessesChart.resize();
          });
        });
        window.onresize = _this.strengthsAndWeaknessesChart.resize;
      };
      _this.showStrengthsAndWeaknessesChart = function () {
        _this.state.selectedChartTab = "strengthsAndWeaknesses";
        _this.strengthsAndWeaknessesChart.restore();
        _this.strengthsAndWeaknessesChart.resize();
        $timeout(function () {
          _this.strengthsAndWeaknessesChart.restore();
          _this.strengthsAndWeaknessesChart.resize();
          $timeout(function () {
            _this.strengthsAndWeaknessesChart.restore();
            _this.strengthsAndWeaknessesChart.resize();
            if (
              navigator.userAgent.indexOf("Safari") !== -1 &&
              navigator.userAgent.indexOf("Chrome") === -1
            ) {
              $timeout(function () {
                _this.strengthsAndWeaknessesChart.restore();
                _this.strengthsAndWeaknessesChart.resize();
              });
            }
          });
        });
        window.onresize = _this.strengthsAndWeaknessesChart.resize;
      };
      _this.showLiftsVsAverageChart = function () {
        if (!_this.hideWeight) {
          _this.state.selectedChartTab = "liftsVsAverage";
          _this.liftsVsAverageChart.restore();
          _this.liftsVsAverageChart.resize();
          $timeout(function () {
            _this.liftsVsAverageChart.restore();
            _this.liftsVsAverageChart.resize();
            $timeout(function () {
              _this.liftsVsAverageChart.restore();
              _this.liftsVsAverageChart.resize();
              if (
                navigator.userAgent.indexOf("Safari") !== -1 &&
                navigator.userAgent.indexOf("Chrome") === -1
              ) {
                $timeout(function () {
                  _this.liftsVsAverageChart.restore();
                  _this.liftsVsAverageChart.resize();
                });
              }
            });
          });
          window.onresize = _this.liftsVsAverageChart.resize;
        }
      };
      _this.tooltip = function (muscleGroup) {
        var header = "";
        var subheader = "";
        var score =
          Math.round(_this.state.results.muscleGroups[muscleGroup] * 10) / 10;
        var englishScore = "[" + Strength.englishStrengthScore(score) + "]";
        if (score === 0) {
          score = "Unknown";
          englishScore = "";
        }
        if (muscleGroup === "upperTraps") {
          header = "Upper Traps";
        } else if (muscleGroup === "middleTraps") {
          header = "Middle Traps";
        } else if (muscleGroup === "lowerTraps") {
          header = "Lower Traps";
        } else if (muscleGroup === "frontDelts") {
          header = "Delts";
          subheader = "(Anterior)";
        } else if (muscleGroup === "sideDelts") {
          header = "Delts";
          subheader = "(Lateral)";
        } else if (muscleGroup === "rearDelts") {
          header = "Delts";
          subheader = "(Posterior)";
        } else if (muscleGroup === "rotatorCuff") {
          header = "Rotator Cuff";
        } else if (muscleGroup === "upperChest") {
          header = "Pecs";
          subheader = "(Clavicular head)";
        } else if (muscleGroup === "lowerChest") {
          header = "Pecs";
          subheader = "(Sternal head)";
        } else if (muscleGroup === "biceps") {
          header = "Biceps";
        } else if (muscleGroup === "triceps") {
          header = "Triceps";
        } else if (muscleGroup === "forearms") {
          header = "Forearms";
        } else if (muscleGroup === "serratusAndObliques") {
          header = "Obliques";
          subheader = "& Serratus";
        } else if (muscleGroup === "abdominals") {
          header = "Abdominals";
        } else if (muscleGroup === "latsAndTeresMajor") {
          header = "Lats";
          subheader = "& Teres Major";
        } else if (muscleGroup === "spinalErectors") {
          header = "Spinal Erectors";
        } else if (muscleGroup === "glutes") {
          header = "Glutes";
        } else if (muscleGroup === "hamstrings") {
          header = "Hamstrings";
        } else if (muscleGroup === "quads") {
          header = "Quads";
        } else if (muscleGroup === "hipFlexors") {
          header = "Hip Flexors";
        } else if (muscleGroup === "hipAdductors") {
          header = "Hip Adductors";
        } else if (muscleGroup === "calves") {
          header = "Calves";
        }
        return (
          '<div class="tooltip-title"><div class="tooltip-header">' +
          header +
          '</div><div class="tooltip-subheader">' +
          subheader +
          '</div></div><div class="tooltip-data"><div class="tooltip-score">Score: ' +
          score +
          '</div><div class="tooltip-classification">' +
          englishScore +
          "</div></div>"
        );
      };
      var checkFriendship = function () {
        if (
          $scope.loggedInUsername &&
          $scope.loggedInUsername !== $scope.username
        ) {
          Restangular.one("/api/friend/check/" + $scope.username)
            .get()
            .then(
              function (response) {
                _this.state.isFriend = response.friends;
                _this.state.checkedFriendshipAndLoggedIn = true;
              },
              function () {
                _this.state.isFriend = false;
                _this.state.checkedFriendshipAndLoggedIn = false;
              }
            );
        } else {
          _this.state.isFriend = false;
          _this.state.checkedFriendshipAndLoggedIn = false;
        }
      };
      _this.addFriend = function () {
        _this.state.checkedFriendshipAndLoggedIn = false;
        Restangular.all("/api/friend")
          .post({ username: $scope.username })
          .then(
            function () {
              _this.state.isFriend = true;
              _this.state.checkedFriendshipAndLoggedIn = true;
            },
            function () {
              _this.state.checkedFriendshipAndLoggedIn = true;
              $alert({
                title:
                  "Oops! There was a problem adding " +
                  $scope.username +
                  " as a friend. Please refresh the page and try again.",
                placement: "top-right",
                container: "#wrapper",
                type: "danger",
                show: true,
                duration: 5,
              });
            }
          );
      };
      _this.removeFriend = function () {
        _this.state.checkedFriendshipAndLoggedIn = false;
        Restangular.one("/api/friend/" + $scope.username)
          .remove()
          .then(
            function () {
              _this.state.isFriend = false;
              _this.state.checkedFriendshipAndLoggedIn = true;
            },
            function () {
              _this.state.checkedFriendshipAndLoggedIn = true;
              $alert({
                title:
                  "Oops! There was a problem removing " +
                  $scope.username +
                  " as a friend. Please refresh the page and try again.",
                placement: "top-right",
                container: "#wrapper",
                type: "danger",
                show: true,
                duration: 5,
              });
            }
          );
      };
      _this.trackSideAppClick = function (product) {
        if (window.location.href.match(/symmetricstrength\.com/)) {
          ga("send", "event", "ad", "click", "side-app");
        }
        return false;
      };
      _this.trackTopAppClick = function (product) {
        if (window.location.href.match(/symmetricstrength\.com/)) {
          ga("send", "event", "ad", "click", "top-app");
        }
        return false;
      };
      if ($scope.pageType === "default") {
        preFillFromCookies();
      } else if ($scope.pageType === "loggedIn") {
        preFillFromServer();
      } else if (
        $scope.pageType === "defaultPublic" ||
        $scope.pageType === "loggedInPublic"
      ) {
        preFillFromServerAndConvert().then(function () {
          _this.calculateResults();
          checkFriendship();
        });
        if ($scope.username === $scope.loggedInUsername) {
          $("#public-page-link").addClass("active");
          $("#mobile-public-tab").addClass("active");
        }
      } else if ($scope.pageType === "anonymous") {
        preFillFromURL();
        $timeout(function () {
          _this.calculateResults();
        });
      }
      if (/android/i.test(navigator.userAgent)) {
        _this.showAndroidAppImg = true;
      } else if (/iPad|iPhone|iPod|ios/i.test(navigator.userAgent)) {
        _this.showAndroidAppImg = false;
      } else {
        _this.showAndroidAppImg = Math.random() >= 0.5;
      }
    },
  ]);
  module.service("MainService", function () {
    "use strict";
    var _this = this;
    _this.lifts = Strength.lifts;
    _this.muscleGroups = Strength.muscleGroups;
    _this.liftIsSpecial = Strength.liftIsSpecial;
    _this.displayLift = Strength.displayLift;
    _this.displayMuscleGroup = Strength.displayMuscleGroup;
    _this.state = {};
    _this.resetResults = function () {
      _this.state.results = {
        totalScore: null,
        symmetryScore: null,
        powerliftingWilks: null,
        powerliftingTotal: null,
        strongestLift: null,
        weakestLift: null,
        strongestMuscleGroups: null,
        weakestMuscleGroups: null,
        scoreClass: null,
        chartHeight: 145,
        lifts: {
          backSquat: { user1RM: null, userScore: null, expected: null },
          frontSquat: { user1RM: null, userScore: null, expected: null },
          deadlift: { user1RM: null, userScore: null, expected: null },
          sumoDeadlift: { user1RM: null, userScore: null, expected: null },
          powerClean: { user1RM: null, userScore: null, expected: null },
          benchPress: { user1RM: null, userScore: null, expected: null },
          inclineBenchPress: { user1RM: null, userScore: null, expected: null },
          dip: {
            user1RM: null,
            special1RM: null,
            userScore: null,
            expected: null,
          },
          overheadPress: { user1RM: null, userScore: null, expected: null },
          pushPress: { user1RM: null, userScore: null, expected: null },
          snatchPress: { user1RM: null, userScore: null, expected: null },
          chinup: {
            user1RM: null,
            special1RM: null,
            userScore: null,
            expected: null,
          },
          pullup: {
            user1RM: null,
            special1RM: null,
            userScore: null,
            expected: null,
          },
          pendlayRow: { user1RM: null, userScore: null, expected: null },
        },
        categories: {
          squat: null,
          floorPull: null,
          horizontalPress: null,
          verticalPress: null,
          pullup: null,
        },
        muscleGroups: {
          upperTraps: 0,
          middleTraps: 0,
          lowerTraps: 0,
          frontDelts: 0,
          sideDelts: 0,
          rearDelts: 0,
          rotatorCuff: 0,
          upperChest: 0,
          lowerChest: 0,
          biceps: 0,
          triceps: 0,
          forearms: 0,
          serratusAndObliques: 0,
          abdominals: 0,
          latsAndTeresMajor: 0,
          spinalErectors: 0,
          glutes: 0,
          hamstrings: 0,
          quads: 0,
          hipFlexors: 0,
          hipAdductors: 0,
          calves: 0,
        },
        standards: {},
      };
    };
    _this.resetErrors = function () {
      _this.state.errors = {
        errorList: [],
        bodyweight: false,
        noLiftChecked: false,
        liftFields: {
          backSquat: { weight: false, reps: false },
          frontSquat: { weight: false, reps: false },
          deadlift: { weight: false, reps: false },
          sumoDeadlift: { weight: false, reps: false },
          powerClean: { weight: false, reps: false },
          benchPress: { weight: false, reps: false },
          inclineBenchPress: { weight: false, reps: false },
          dip: { weight: false, reps: false },
          overheadPress: { weight: false, reps: false },
          pushPress: { weight: false, reps: false },
          snatchPress: { weight: false, reps: false },
          chinup: { weight: false, reps: false },
          pullup: { weight: false, reps: false },
          pendlayRow: { weight: false, reps: false },
        },
      };
    };
    _this.initState = function (username) {
      _this.state = {
        resultsShown: false,
        noLiftingDataError: false,
        unitsConverted: false,
        isFriend: false,
        friendButtonHovered: false,
        checkedFriendshipAndLoggedIn: false,
        publicUrl: username
          ? "https://" + window.location.host + "/lifter/" + username
          : "",
        unitSystem: "Imperial",
        roundCalculationsTo: 5,
        sex: "Male",
        age: null,
        bodyweight: null,
        displayAnalyzeHelp: false,
        waitingForLastSaved: true,
        liftFields: {
          backSquat: {
            liftName: "Back Squat",
            checked: true,
            weight: null,
            reps: null,
          },
          frontSquat: {
            liftName: "Front Squat",
            checked: false,
            weight: null,
            reps: null,
          },
          deadlift: {
            liftName: "Deadlift",
            checked: true,
            weight: null,
            reps: null,
          },
          sumoDeadlift: {
            liftName: "Sumo Deadlift",
            checked: false,
            weight: null,
            reps: null,
          },
          powerClean: {
            liftName: "Power Clean",
            checked: false,
            weight: null,
            reps: null,
          },
          benchPress: {
            liftName: "Bench Press",
            checked: true,
            weight: null,
            reps: null,
          },
          inclineBenchPress: {
            liftName: "Incline Bench Press",
            checked: false,
            weight: null,
            reps: null,
          },
          dip: {
            liftName: "Dip",
            liftType: "Standard",
            checked: false,
            specialWeight: null,
            weight: null,
            reps: null,
          },
          overheadPress: {
            liftName: "Overhead Press",
            checked: true,
            weight: null,
            reps: null,
          },
          pushPress: {
            liftName: "Push Press",
            checked: false,
            weight: null,
            reps: null,
          },
          snatchPress: {
            liftName: "Snatch Press",
            checked: false,
            weight: null,
            reps: null,
          },
          chinup: {
            liftName: "Chin-up",
            liftType: "Standard",
            checked: true,
            specialWeight: null,
            weight: null,
            reps: null,
          },
          pullup: {
            liftName: "Pull-up",
            liftType: "Standard",
            checked: false,
            specialWeight: null,
            weight: null,
            reps: null,
          },
          pendlayRow: {
            liftName: "Pendlay Row",
            checked: false,
            weight: null,
            reps: null,
          },
        },
        lastSavedLiftFields: null,
        hovering: {
          upperTraps: false,
          middleTraps: false,
          lowerTraps: false,
          frontDelts: false,
          sideDelts: false,
          rearDelts: false,
          rotatorCuff: false,
          upperChest: false,
          lowerChest: false,
          biceps: false,
          triceps: false,
          forearms: false,
          serratusAndObliques: false,
          abdominals: false,
          latsAndTeresMajor: false,
          spinalErectors: false,
          glutes: false,
          hamstrings: false,
          quads: false,
          hipFlexors: false,
          hipAdductors: false,
          calves: false,
        },
        selectedChartTab: "strengthsAndWeaknesses",
      };
      _this.resetErrors();
      _this.resetResults();
    };
    _this.updateSpecialWeights = function () {
      var specialLifts = ["dip", "chinup", "pullup"];
      if (_this.state.bodyweight) {
        _.forEach(specialLifts, function (lift) {
          if (
            _this.state.liftFields[lift].specialWeight &&
            _this.state.liftFields[lift].liftType === "Assisted"
          ) {
            _this.state.liftFields[lift].weight =
              _this.state.bodyweight -
              _this.state.liftFields[lift].specialWeight;
          } else if (
            _this.state.liftFields[lift].specialWeight &&
            _this.state.liftFields[lift].liftType === "Weighted"
          ) {
            _this.state.liftFields[lift].weight =
              _this.state.bodyweight +
              _this.state.liftFields[lift].specialWeight;
          } else {
            _this.state.liftFields[lift].weight = _this.state.bodyweight;
          }
        });
      } else {
        _.forEach(specialLifts, function (lift) {
          _this.state.liftFields[lift].specialWeight = null;
        });
      }
    };
    _this.calculateResults = function () {
      _this.resetResults();
      _this.resetErrors();
      _this.updateSpecialWeights();
      var fieldsAreValid = function () {
        var liftsChecked = 0;
        var valid = true;
        for (var lift in _this.state.liftFields) {
          if (_this.state.liftFields.hasOwnProperty(lift)) {
            var lf = _this.state.liftFields[lift];
            if (lf.checked) {
              liftsChecked += 1;
            }
            var invalidWeightStandard =
              !_this.liftIsSpecial(lift) && (!lf.weight || lf.weight < 0);
            var invalidWeightSpecial =
              _this.liftIsSpecial(lift) &&
              lf.liftType !== "Standard" &&
              (!lf.specialWeight || lf.specialWeight < 0);
            var checkedButInvalidWeight =
              lf.checked && (invalidWeightStandard || invalidWeightSpecial);
            var checkedButInvalidReps =
              lf.checked && (!lf.reps || lf.reps < 1 || lf.reps > 10);
            if (checkedButInvalidWeight) {
              valid = false;
              _this.state.errors.errorList.push(
                "Enter " + _this.displayLift(lift) + " weight."
              );
              _this.state.errors.liftFields[lift].weight = true;
            }
            if (checkedButInvalidReps) {
              valid = false;
              _this.state.errors.errorList.push(
                "Enter between 1-10 " + _this.displayLift(lift) + " reps."
              );
              _this.state.errors.liftFields[lift].reps = true;
            }
          }
        }
        if (liftsChecked === 0) {
          _this.state.errors.noLiftChecked = true;
          valid = false;
          _this.state.errors.errorList.push("Check at least one lift.");
        }
        if (
          !_this.state.bodyweight ||
          _this.state.bodyweight <= 0 ||
          !_this.state.unitSystem ||
          !_this.state.sex ||
          !_this.state.roundCalculationsTo
        ) {
          _this.state.errors.bodyweight = true;
          valid = false;
          _this.state.errors.errorList.push("Enter your body weight.");
        }
        if (
          _this.state.age &&
          (_this.state.age < 10 || _this.state.age > 100)
        ) {
          _this.state.errors.age = true;
          valid = false;
          _this.state.errors.errorList.push("Age must be between 10 and 100.");
        }
        if (!valid) {
          _this.state.resultsShown = false;
        }
        return valid;
      };
      if (fieldsAreValid()) {
        _this.state.resultsShown = true;
        for (var lift in _this.state.liftFields) {
          if (_this.state.liftFields.hasOwnProperty(lift)) {
            var lf = _this.state.liftFields[lift];
            if (lf.checked) {
              var oneRM = Strength.mround(
                Strength.oneRepMax(lf.weight, lf.reps),
                _this.state.roundCalculationsTo
              );
              _this.state.results.lifts[lift].user1RM = oneRM;
              _this.state.results.lifts[lift].userScore =
                Math.round(
                  Strength.singleLiftStrengthScore(
                    _this.state.unitSystem,
                    _this.state.sex,
                    _this.state.age,
                    _this.state.bodyweight,
                    lf.liftName,
                    oneRM
                  ) * 10
                ) / 10;
              if (_this.liftIsSpecial(lift)) {
                _this.state.results.lifts[lift].special1RM = Strength.mround(
                  Strength.oneRepMax(lf.weight, lf.reps) -
                    _this.state.bodyweight,
                  _this.state.roundCalculationsTo
                );
              }
              _this.state.results.chartHeight += 50;
            }
          }
        }
        _this.state.results.categories.squat = _.max([
          _this.state.results.lifts.backSquat.userScore,
          _this.state.results.lifts.frontSquat.userScore,
        ]);
        _this.state.results.categories.floorPull = _.max([
          _this.state.results.lifts.deadlift.userScore,
          _this.state.results.lifts.sumoDeadlift.userScore,
          _this.state.results.lifts.powerClean.userScore,
        ]);
        _this.state.results.categories.horizontalPress = _.max([
          _this.state.results.lifts.benchPress.userScore,
          _this.state.results.lifts.inclineBenchPress.userScore,
          _this.state.results.lifts.dip.userScore,
        ]);
        _this.state.results.categories.verticalPress = _.max([
          _this.state.results.lifts.overheadPress.userScore,
          _this.state.results.lifts.pushPress.userScore,
          _this.state.results.lifts.snatchPress.userScore,
        ]);
        _this.state.results.categories.pullup = _.max([
          _this.state.results.lifts.chinup.userScore,
          _this.state.results.lifts.pullup.userScore,
          _this.state.results.lifts.pendlayRow.userScore,
        ]);
        var catScores = _.filter([
          _this.state.results.categories.squat,
          _this.state.results.categories.floorPull,
          _this.state.results.categories.horizontalPress,
          _this.state.results.categories.verticalPress,
          _this.state.results.categories.pullup,
        ]);
        _this.state.results.totalScore =
          Math.round((_.sum(catScores) / _.size(catScores)) * 10) / 10;
        var engScore = Strength.englishStrengthScore(
          _this.state.results.totalScore
        );
        _this.state.results.scoreClass = engScore
          .toLowerCase()
          .replace(" ", "-");
        var muscleGroupTuples = {
          upperTraps: [],
          middleTraps: [],
          lowerTraps: [],
          frontDelts: [],
          sideDelts: [],
          rearDelts: [],
          rotatorCuff: [],
          upperChest: [],
          lowerChest: [],
          biceps: [],
          triceps: [],
          forearms: [],
          serratusAndObliques: [],
          abdominals: [],
          latsAndTeresMajor: [],
          spinalErectors: [],
          glutes: [],
          hamstrings: [],
          quads: [],
          hipFlexors: [],
          hipAdductors: [],
          calves: [],
        };
        _.forEach(_this.lifts, function (lift) {
          var liftWeights = Strength.liftInvolvement(_this.displayLift(lift));
          var liftScore = _this.state.results.lifts[lift].userScore;
          if (liftScore) {
            _.forEach(_this.muscleGroups, function (muscleGroup) {
              muscleGroupTuples[muscleGroup].push([
                liftScore,
                liftWeights[muscleGroup],
              ]);
            });
          }
        });
        _.forEach(_this.muscleGroups, function (muscleGroup) {
          _this.state.results.muscleGroups[muscleGroup] =
            Math.round(
              Strength.weightedAvg(muscleGroupTuples[muscleGroup]) * 10
            ) / 10;
        });
        _.forEach(_this.lifts, function (lift) {
          _this.state.results.lifts[lift].expected = Strength.mround(
            Strength.liftFromStrengthScore(
              _this.state.unitSystem,
              _this.state.sex,
              _this.state.age,
              _this.state.bodyweight,
              _this.state.results.totalScore,
              _this.displayLift(lift)
            ),
            _this.state.roundCalculationsTo
          );
        });
        _this.state.results.standards = _.zipObject(
          _this.lifts,
          _.map(_this.lifts, function (l) {
            return {
              "World class": Strength.mround(
                Strength.liftFromStrengthScore(
                  _this.state.unitSystem,
                  _this.state.sex,
                  _this.state.age,
                  _this.state.bodyweight,
                  125.0,
                  _this.displayLift(l)
                ),
                _this.state.roundCalculationsTo
              ),
              Elite: Strength.mround(
                Strength.liftFromStrengthScore(
                  _this.state.unitSystem,
                  _this.state.sex,
                  _this.state.age,
                  _this.state.bodyweight,
                  112.5,
                  _this.displayLift(l)
                ),
                _this.state.roundCalculationsTo
              ),
              Exceptional: Strength.mround(
                Strength.liftFromStrengthScore(
                  _this.state.unitSystem,
                  _this.state.sex,
                  _this.state.age,
                  _this.state.bodyweight,
                  100.0,
                  _this.displayLift(l)
                ),
                _this.state.roundCalculationsTo
              ),
              Advanced: Strength.mround(
                Strength.liftFromStrengthScore(
                  _this.state.unitSystem,
                  _this.state.sex,
                  _this.state.age,
                  _this.state.bodyweight,
                  87.5,
                  _this.displayLift(l)
                ),
                _this.state.roundCalculationsTo
              ),
              Proficient: Strength.mround(
                Strength.liftFromStrengthScore(
                  _this.state.unitSystem,
                  _this.state.sex,
                  _this.state.age,
                  _this.state.bodyweight,
                  75.0,
                  _this.displayLift(l)
                ),
                _this.state.roundCalculationsTo
              ),
              Intermediate: Strength.mround(
                Strength.liftFromStrengthScore(
                  _this.state.unitSystem,
                  _this.state.sex,
                  _this.state.age,
                  _this.state.bodyweight,
                  60.0,
                  _this.displayLift(l)
                ),
                _this.state.roundCalculationsTo
              ),
              Novice: Strength.mround(
                Strength.liftFromStrengthScore(
                  _this.state.unitSystem,
                  _this.state.sex,
                  _this.state.age,
                  _this.state.bodyweight,
                  45.0,
                  _this.displayLift(l)
                ),
                _this.state.roundCalculationsTo
              ),
              Untrained: Strength.mround(
                Strength.liftFromStrengthScore(
                  _this.state.unitSystem,
                  _this.state.sex,
                  _this.state.age,
                  _this.state.bodyweight,
                  30.0,
                  _this.displayLift(l)
                ),
                _this.state.roundCalculationsTo
              ),
            };
          })
        );
        var liftScores = _.filter(
          _.map(_this.state.results.lifts, "userScore")
        );
        if (_.size(liftScores) > 1) {
          _this.state.results.symmetryScore = Strength.mround(
            Strength.symmetryScore(liftScores),
            1
          );
        }
        if (
          _this.state.results.lifts.backSquat.user1RM &&
          _this.state.results.lifts.benchPress.user1RM &&
          (_this.state.results.lifts.deadlift.user1RM ||
            _this.state.results.lifts.sumoDeadlift.user1RM)
        ) {
          var bestDeadlift = Math.max(
            _this.state.results.lifts.deadlift.user1RM,
            _this.state.results.lifts.sumoDeadlift.user1RM
          );
          _this.state.results.powerliftingTotal =
            _this.state.results.lifts.backSquat.user1RM +
            _this.state.results.lifts.benchPress.user1RM +
            bestDeadlift;
          _this.state.results.powerliftingWilks = Strength.mround(
            Strength.wilks(
              _this.state.unitSystem,
              _this.state.sex,
              _this.state.bodyweight,
              _this.state.results.powerliftingTotal
            ),
            1
          );
        }
        var userLiftPairs = _.filter(
          _.pairs(_this.state.results.lifts),
          function (liftPair) {
            return liftPair[1].userScore;
          }
        );
        var liftScoreProportions = _.map(userLiftPairs, function (liftPair) {
          return {
            liftName: _this.displayLift(liftPair[0]),
            scoreDifference:
              (liftPair[1].user1RM - liftPair[1].expected) /
              liftPair[1].expected,
          };
        });
        var goodLifts = _.sortBy(
          _.filter(liftScoreProportions, function (liftScoreProportion) {
            return liftScoreProportion.scoreDifference > 0;
          }),
          "scoreDifference"
        ).reverse();
        var badLifts = _.sortBy(
          _.filter(liftScoreProportions, function (liftScoreProportion) {
            return liftScoreProportion.scoreDifference < 0;
          }),
          "scoreDifference"
        );
        if (goodLifts.length > 0) {
          _this.state.results.strongestLift = goodLifts[0].liftName;
        }
        if (badLifts.length > 0) {
          _this.state.results.weakestLift = badLifts[0].liftName;
        }
        var userMuscleGroupPairs = _.filter(
          _.pairs(_this.state.results.muscleGroups),
          function (muscleGroupPair) {
            return muscleGroupPair[1];
          }
        );
        var muscleGroupScoreDifferences = _.map(
          userMuscleGroupPairs,
          function (muscleGroupPair) {
            return {
              muscleGroupName: _this.displayMuscleGroup(muscleGroupPair[0]),
              scoreDifference:
                (muscleGroupPair[1] - _this.state.results.totalScore) /
                _this.state.results.totalScore,
            };
          }
        );
        var goodMuscleGroups = _.sortBy(
          _.filter(
            muscleGroupScoreDifferences,
            function (muscleGroupScoreDifference) {
              return muscleGroupScoreDifference.scoreDifference >= 0.05;
            }
          ),
          "scoreDifference"
        ).reverse();
        var badMuscleGroups = _.sortBy(
          _.filter(
            muscleGroupScoreDifferences,
            function (muscleGroupScoreDifference) {
              return muscleGroupScoreDifference.scoreDifference <= -0.05;
            }
          ),
          "scoreDifference"
        );
        if (goodMuscleGroups.length > 0) {
          var goodMuscleGroupNames = _.map(goodMuscleGroups, "muscleGroupName");
          _this.state.results.strongestMuscleGroups =
            goodMuscleGroupNames.join(", ");
        }
        if (badMuscleGroups.length > 0) {
          var badMuscleGroupNames = _.map(badMuscleGroups, "muscleGroupName");
          _this.state.results.weakestMuscleGroups =
            badMuscleGroupNames.join(", ");
        }
        return true;
      } else {
        return false;
      }
    };
    _this.displayWeight = function (
      lift,
      weight,
      bodyweight,
      roundCalculationsTo,
      includeBodyweight
    ) {
      if (typeof includeBodyweight === undefined) {
        includeBodyweight = true;
      }
      var bodyweightStr = includeBodyweight ? "Bodyweight " : "";
      if (lift === "Pull-up" || lift === "Chin-up" || lift === "Dip") {
        var specialWeight = Strength.mround(
          weight - bodyweight,
          roundCalculationsTo
        );
        if (specialWeight < 0) {
          return bodyweightStr + specialWeight;
        } else {
          return bodyweightStr + "+" + specialWeight;
        }
      } else {
        return Strength.mround(weight, roundCalculationsTo);
      }
    };
    _this.displayUnits = function (singular) {
      return Strength.displayUnits(_this.state.unitSystem, singular);
    };
  });
  module.directive("mainStats", function () {
    "use strict";
    return { restrict: "E", templateUrl: "main-stats" };
  });
  module.directive("main", function () {
    "use strict";
    return {
      restrict: "E",
      templateUrl: "main",
      scope: {
        pageType: "@",
        username: "@",
        hideWeight: "@",
        loggedInUsername: "@",
        friendDisplay: "@",
        pageIsPublic: "@",
      },
      controller: "MainController",
      controllerAs: "mainCtrl",
    };
  });
  module.directive("moreStats", function () {
    "use strict";
    return { restrict: "E", templateUrl: "more-stats" };
  });
  module.directive("muscleFigure", function () {
    "use strict";
    return { restrict: "E", templateUrl: "muscle-figure" };
  });
  module.directive("oneRepMaxes", function () {
    "use strict";
    return { restrict: "E", templateUrl: "one-rep-maxes" };
  });
  module.filter("scoreClass", function () {
    "use strict";
    return function (input) {
      if (typeof input === "number") {
        if (input === 0) {
          return "unknown";
        } else {
          var roundedInput = Math.round(input * 10) / 10;
          return Strength.englishStrengthScore(roundedInput)
            .toLowerCase()
            .replace(" ", "-");
        }
      } else {
        return "";
      }
    };
  });
  module.controller("StrengthProgressController", [
    "MainService",
    "$timeout",
    "$q",
    "$scope",
    "Restangular",
    function (MainService, $timeout, $q, $scope, Restangular) {
      "use strict";
      var _this = this;
      _this.state = {
        progressData: [],
        waitingForProgress: true,
        pointClicked: false,
        pointDateString: "",
        pointID: null,
        selectedChartTab: "categoryScores",
        noLiftData: false,
      };
      _this.liftIsSpecial = Strength.liftIsSpecial;
      _this.displayLift = Strength.displayLift;
      _this.displayWeight = MainService.displayWeight;
      _this.displayUnits = MainService.displayUnits;
      _this.hideWeight = $scope.hideWeight === "True";
      var calculateDataPoint = function (liftData) {
        var dp = {
          unitSystem: null,
          roundCalculationsTo: null,
          sex: null,
          age: null,
          bodyweight: null,
          liftFields: {
            backSquat: {
              liftName: "Back Squat",
              checked: true,
              weight: null,
              reps: null,
            },
            frontSquat: {
              liftName: "Front Squat",
              checked: false,
              weight: null,
              reps: null,
            },
            deadlift: {
              liftName: "Deadlift",
              checked: true,
              weight: null,
              reps: null,
            },
            sumoDeadlift: {
              liftName: "Sumo Deadlift",
              checked: false,
              weight: null,
              reps: null,
            },
            powerClean: {
              liftName: "Power Clean",
              checked: false,
              weight: null,
              reps: null,
            },
            benchPress: {
              liftName: "Bench Press",
              checked: true,
              weight: null,
              reps: null,
            },
            inclineBenchPress: {
              liftName: "Incline Bench Press",
              checked: false,
              weight: null,
              reps: null,
            },
            dip: {
              liftName: "Dip",
              liftType: "Standard",
              checked: false,
              specialWeight: null,
              weight: null,
              reps: null,
            },
            overheadPress: {
              liftName: "Overhead Press",
              checked: true,
              weight: null,
              reps: null,
            },
            pushPress: {
              liftName: "Push Press",
              checked: false,
              weight: null,
              reps: null,
            },
            snatchPress: {
              liftName: "Snatch Press",
              checked: false,
              weight: null,
              reps: null,
            },
            chinup: {
              liftName: "Chin-up",
              liftType: "Standard",
              checked: true,
              specialWeight: null,
              weight: null,
              reps: null,
            },
            pullup: {
              liftName: "Pull-up",
              liftType: "Standard",
              checked: false,
              specialWeight: null,
              weight: null,
              reps: null,
            },
            pendlayRow: {
              liftName: "Pendlay Row",
              checked: false,
              weight: null,
              reps: null,
            },
          },
          results: {
            timeLogged: null,
            totalScore: null,
            symmetryScore: null,
            scoreClass: null,
            lifts: {
              backSquat: { user1RM: null, userScore: null },
              frontSquat: { user1RM: null, userScore: null },
              deadlift: { user1RM: null, userScore: null },
              sumoDeadlift: { user1RM: null, userScore: null },
              powerClean: { user1RM: null, userScore: null },
              benchPress: { user1RM: null, userScore: null },
              inclineBenchPress: { user1RM: null, userScore: null },
              dip: { user1RM: null, special1RM: null, userScore: null },
              overheadPress: { user1RM: null, userScore: null },
              pushPress: { user1RM: null, userScore: null },
              snatchPress: { user1RM: null, userScore: null },
              chinup: { user1RM: null, special1RM: null, userScore: null },
              pullup: { user1RM: null, special1RM: null, userScore: null },
              pendlayRow: { user1RM: null, userScore: null },
            },
            categories: {
              squat: null,
              floorPull: null,
              horizontalPress: null,
              verticalPress: null,
              pullup: null,
            },
          },
        };
        dp.unitSystem = liftData.unitSystem;
        dp.roundCalculationsTo = liftData.roundTo;
        dp.sex = liftData.sex;
        dp.age = liftData.age;
        dp.bodyweight = liftData.bodyweight;
        if (liftData.backSquatWeight && liftData.backSquatReps) {
          dp.liftFields.backSquat.checked = true;
          dp.liftFields.backSquat.weight = liftData.backSquatWeight;
          dp.liftFields.backSquat.reps = liftData.backSquatReps;
        } else {
          dp.liftFields.backSquat.checked = false;
        }
        if (liftData.frontSquatWeight && liftData.frontSquatReps) {
          dp.liftFields.frontSquat.checked = true;
          dp.liftFields.frontSquat.weight = liftData.frontSquatWeight;
          dp.liftFields.frontSquat.reps = liftData.frontSquatReps;
        } else {
          dp.liftFields.frontSquat.checked = false;
        }
        if (liftData.deadliftWeight && liftData.deadliftReps) {
          dp.liftFields.deadlift.checked = true;
          dp.liftFields.deadlift.weight = liftData.deadliftWeight;
          dp.liftFields.deadlift.reps = liftData.deadliftReps;
        } else {
          dp.liftFields.deadlift.checked = false;
        }
        if (liftData.sumoDeadliftWeight && liftData.sumoDeadliftReps) {
          dp.liftFields.sumoDeadlift.checked = true;
          dp.liftFields.sumoDeadlift.weight = liftData.sumoDeadliftWeight;
          dp.liftFields.sumoDeadlift.reps = liftData.sumoDeadliftReps;
        } else {
          dp.liftFields.sumoDeadlift.checked = false;
        }
        if (liftData.powerCleanWeight && liftData.powerCleanReps) {
          dp.liftFields.powerClean.checked = true;
          dp.liftFields.powerClean.weight = liftData.powerCleanWeight;
          dp.liftFields.powerClean.reps = liftData.powerCleanReps;
        } else {
          dp.liftFields.powerClean.checked = false;
        }
        if (liftData.benchPressWeight && liftData.benchPressReps) {
          dp.liftFields.benchPress.checked = true;
          dp.liftFields.benchPress.weight = liftData.benchPressWeight;
          dp.liftFields.benchPress.reps = liftData.benchPressReps;
        } else {
          dp.liftFields.benchPress.checked = false;
        }
        if (
          liftData.inclineBenchPressWeight &&
          liftData.inclineBenchPressReps
        ) {
          dp.liftFields.inclineBenchPress.checked = true;
          dp.liftFields.inclineBenchPress.weight =
            liftData.inclineBenchPressWeight;
          dp.liftFields.inclineBenchPress.reps = liftData.inclineBenchPressReps;
        } else {
          dp.liftFields.inclineBenchPress.checked = false;
        }
        if (liftData.dipWeight && liftData.dipReps) {
          dp.liftFields.dip.checked = true;
          dp.liftFields.dip.weight = liftData.dipWeight;
          dp.liftFields.dip.reps = liftData.dipReps;
          if (liftData.dipWeight < liftData.bodyweight) {
            dp.liftFields.dip.liftType = "Assisted";
            dp.liftFields.dip.specialWeight =
              Math.round((liftData.bodyweight - liftData.dipWeight) * 10) / 10;
          } else if (liftData.dipWeight > liftData.bodyweight) {
            dp.liftFields.dip.liftType = "Weighted";
            dp.liftFields.dip.specialWeight =
              Math.round((liftData.dipWeight - liftData.bodyweight) * 10) / 10;
          } else {
            dp.liftFields.dip.liftType = "Standard";
          }
        } else {
          dp.liftFields.dip.checked = false;
        }
        if (liftData.overheadPressWeight && liftData.overheadPressReps) {
          dp.liftFields.overheadPress.checked = true;
          dp.liftFields.overheadPress.weight = liftData.overheadPressWeight;
          dp.liftFields.overheadPress.reps = liftData.overheadPressReps;
        } else {
          dp.liftFields.overheadPress.checked = false;
        }
        if (liftData.pushPressWeight && liftData.pushPressReps) {
          dp.liftFields.pushPress.checked = true;
          dp.liftFields.pushPress.weight = liftData.pushPressWeight;
          dp.liftFields.pushPress.reps = liftData.pushPressReps;
        } else {
          dp.liftFields.pushPress.checked = false;
        }
        if (liftData.snatchPressWeight && liftData.snatchPressReps) {
          dp.liftFields.snatchPress.checked = true;
          dp.liftFields.snatchPress.weight = liftData.snatchPressWeight;
          dp.liftFields.snatchPress.reps = liftData.snatchPressReps;
        } else {
          dp.liftFields.snatchPress.checked = false;
        }
        if (liftData.chinupWeight && liftData.chinupReps) {
          dp.liftFields.chinup.checked = true;
          dp.liftFields.chinup.weight = liftData.chinupWeight;
          dp.liftFields.chinup.reps = liftData.chinupReps;
          if (liftData.chinupWeight < liftData.bodyweight) {
            dp.liftFields.chinup.liftType = "Assisted";
            dp.liftFields.chinup.specialWeight =
              Math.round((liftData.bodyweight - liftData.chinupWeight) * 10) /
              10;
          } else if (liftData.chinupWeight > liftData.bodyweight) {
            dp.liftFields.chinup.liftType = "Weighted";
            dp.liftFields.chinup.specialWeight =
              Math.round((liftData.chinupWeight - liftData.bodyweight) * 10) /
              10;
          } else {
            dp.liftFields.chinup.liftType = "Standard";
          }
        } else {
          dp.liftFields.chinup.checked = false;
        }
        if (liftData.pullupWeight && liftData.pullupReps) {
          dp.liftFields.pullup.checked = true;
          dp.liftFields.pullup.weight = liftData.pullupWeight;
          dp.liftFields.pullup.reps = liftData.pullupReps;
          if (liftData.pullupWeight < liftData.bodyweight) {
            dp.liftFields.pullup.liftType = "Assisted";
            dp.liftFields.pullup.specialWeight =
              Math.round((liftData.bodyweight - liftData.pullupWeight) * 10) /
              10;
          } else if (liftData.pullupWeight > liftData.bodyweight) {
            dp.liftFields.pullup.liftType = "Weighted";
            dp.liftFields.pullup.specialWeight =
              Math.round((liftData.pullupWeight - liftData.bodyweight) * 10) /
              10;
          } else {
            dp.liftFields.pullup.liftType = "Standard";
          }
        } else {
          dp.liftFields.pullup.checked = false;
        }
        if (liftData.pendlayRowWeight && liftData.pendlayRowReps) {
          dp.liftFields.pendlayRow.checked = true;
          dp.liftFields.pendlayRow.weight = liftData.pendlayRowWeight;
          dp.liftFields.pendlayRow.reps = liftData.pendlayRowReps;
        } else {
          dp.liftFields.pendlayRow.checked = false;
        }
        for (var lift in dp.liftFields) {
          if (dp.liftFields.hasOwnProperty(lift)) {
            var lf = dp.liftFields[lift];
            if (lf.checked) {
              var oneRM = Strength.mround(
                Strength.oneRepMax(lf.weight, lf.reps),
                dp.roundCalculationsTo
              );
              dp.results.lifts[lift].user1RM = oneRM;
              dp.results.lifts[lift].userScore =
                Math.round(
                  Strength.singleLiftStrengthScore(
                    dp.unitSystem,
                    dp.sex,
                    dp.age,
                    dp.bodyweight,
                    lf.liftName,
                    oneRM
                  ) * 10
                ) / 10;
              if (_this.liftIsSpecial(lift)) {
                dp.results.lifts[lift].special1RM = Strength.mround(
                  Strength.oneRepMax(lf.weight, lf.reps) - dp.bodyweight,
                  dp.roundCalculationsTo
                );
              }
            }
          }
        }
        dp.results.timeLogged = liftData.timeLogged;
        dp.results.id = liftData.id;
        dp.results.unitSystem = dp.unitSystem;
        dp.results.categories.squat = _.max([
          dp.results.lifts.backSquat.userScore,
          dp.results.lifts.frontSquat.userScore,
        ]);
        dp.results.categories.floorPull = _.max([
          dp.results.lifts.deadlift.userScore,
          dp.results.lifts.sumoDeadlift.userScore,
          dp.results.lifts.powerClean.userScore,
        ]);
        dp.results.categories.horizontalPress = _.max([
          dp.results.lifts.benchPress.userScore,
          dp.results.lifts.inclineBenchPress.userScore,
          dp.results.lifts.dip.userScore,
        ]);
        dp.results.categories.verticalPress = _.max([
          dp.results.lifts.overheadPress.userScore,
          dp.results.lifts.pushPress.userScore,
          dp.results.lifts.snatchPress.userScore,
        ]);
        dp.results.categories.pullup = _.max([
          dp.results.lifts.chinup.userScore,
          dp.results.lifts.pullup.userScore,
          dp.results.lifts.pendlayRow.userScore,
        ]);
        var catScores = _.filter([
          dp.results.categories.squat,
          dp.results.categories.floorPull,
          dp.results.categories.horizontalPress,
          dp.results.categories.verticalPress,
          dp.results.categories.pullup,
        ]);
        dp.results.totalScore =
          Math.round((_.sum(catScores) / _.size(catScores)) * 10) / 10;
        var engScore = Strength.englishStrengthScore(dp.results.totalScore);
        dp.results.scoreClass = engScore.toLowerCase().replace(" ", "-");
        var liftScores = _.filter(_.map(dp.results.lifts, "userScore"));
        if (_.size(liftScores) > 1) {
          dp.results.symmetryScore = Strength.mround(
            Strength.symmetryScore(liftScores),
            1
          );
        }
        return dp.results;
      };
      var initChart = function () {
        if (!MainService.state.lastSavedLiftFields) {
          _this.state.waitingForProgress = false;
          _this.state.noLiftData = true;
          return false;
        }
        _this.categoryScoreProgressChart = echarts.init(
          document.getElementById("category-score-progress-chart")
        );
        if (!_this.hideWeight) {
          _this.liftOneRepMaxProgressChart = echarts.init(
            document.getElementById("lift-onerepmax-progress-chart")
          );
        }
        _this.liftScoreProgressChart = echarts.init(
          document.getElementById("lift-score-progress-chart")
        );
        var option = {
          title: {
            text: "Strength Progress",
            subtext: "Strength score over time",
          },
          tooltip: {
            trigger: "item",
            formatter: function (params) {
              var date = new Date(params.value[0]);
              var data =
                date.getFullYear() +
                "-" +
                (date.getMonth() + 1) +
                "-" +
                date.getDate();
              return (
                data +
                "<br/><strong>" +
                params.seriesName +
                " score: " +
                params.value[1] +
                "</strong>"
              );
            },
          },
          dataZoom: { show: true, start: 0 },
          legend: {
            data: [
              "Overall",
              "Squat",
              "Floor Pull",
              "Horizontal Press",
              "Vertical Press",
              "Pull-up / Row",
            ],
            selectedMode: true,
            x: "right",
            selected: {
              Squat: false,
              "Floor Pull": false,
              "Horizontal Press": false,
              "Vertical Press": false,
              "Pull-up / Row": false,
            },
          },
          grid: { x: 40, x2: 30, y2: 80 },
          xAxis: [{ type: "time", splitNumber: 10 }],
          yAxis: [{ type: "value" }],
          series: [
            {
              name: "Overall",
              type: "line",
              itemStyle: { normal: { areaStyle: { type: "default" } } },
              showAllSymbol: true,
              data: (function () {
                var d = [];
                _.forEach(_this.state.progressData, function (dp) {
                  if (dp.totalScore) {
                    d.push([new Date(dp.timeLogged), dp.totalScore, dp.id]);
                  }
                });
                return d;
              })(),
            },
            {
              name: "Squat",
              type: "line",
              showAllSymbol: true,
              data: (function () {
                var d = [];
                _.forEach(_this.state.progressData, function (dp) {
                  if (dp.categories.squat) {
                    d.push([
                      new Date(dp.timeLogged),
                      dp.categories.squat,
                      dp.id,
                    ]);
                  }
                });
                return d;
              })(),
            },
            {
              name: "Floor Pull",
              type: "line",
              showAllSymbol: true,
              data: (function () {
                var d = [];
                _.forEach(_this.state.progressData, function (dp) {
                  if (dp.categories.floorPull) {
                    d.push([
                      new Date(dp.timeLogged),
                      dp.categories.floorPull,
                      dp.id,
                    ]);
                  }
                });
                return d;
              })(),
            },
            {
              name: "Horizontal Press",
              type: "line",
              showAllSymbol: true,
              data: (function () {
                var d = [];
                _.forEach(_this.state.progressData, function (dp) {
                  if (dp.categories.horizontalPress) {
                    d.push([
                      new Date(dp.timeLogged),
                      dp.categories.horizontalPress,
                      dp.id,
                    ]);
                  }
                });
                return d;
              })(),
            },
            {
              name: "Vertical Press",
              type: "line",
              showAllSymbol: true,
              data: (function () {
                var d = [];
                _.forEach(_this.state.progressData, function (dp) {
                  if (dp.categories.verticalPress) {
                    d.push([
                      new Date(dp.timeLogged),
                      dp.categories.verticalPress,
                      dp.id,
                    ]);
                  }
                });
                return d;
              })(),
            },
            {
              name: "Pull-up / Row",
              type: "line",
              showAllSymbol: true,
              data: (function () {
                var d = [];
                _.forEach(_this.state.progressData, function (dp) {
                  if (dp.categories.pullup) {
                    d.push([
                      new Date(dp.timeLogged),
                      dp.categories.pullup,
                      dp.id,
                    ]);
                  }
                });
                return d;
              })(),
            },
          ],
        };
        var activeLifts = [];
        _.forEach(_.pairs(MainService.state.liftFields), function (lift) {
          if (lift[1].checked) {
            activeLifts.push(lift[0]);
          }
        });
        activeLifts.reverse();
        if (!_this.hideWeight) {
          var option2 = {
            title: {
              text: "Strength Progress",
              subtext: "Estimated lift one rep maxes over time",
            },
            tooltip: {
              trigger: "item",
              formatter: function (params) {
                var date = new Date(params.value[0]);
                var data =
                  date.getFullYear() +
                  "-" +
                  (date.getMonth() + 1) +
                  "-" +
                  date.getDate();
                return (
                  data +
                  "<br/><strong>" +
                  params.seriesName +
                  ": " +
                  _this.displayWeight(
                    params.seriesName,
                    params.value[1],
                    MainService.state.bodyweight,
                    MainService.state.roundCalculationsTo
                  ) +
                  " " +
                  _this.displayUnits() +
                  "</strong>"
                );
              },
            },
            dataZoom: { show: true, start: 0 },
            legend: {
              data: _.map(activeLifts, function (l) {
                return _this.displayLift(l);
              }),
              x: "right",
              selectedMode: true,
            },
            grid: { x: 40, x2: 30, y2: 80 },
            xAxis: [{ type: "time", splitNumber: 10 }],
            yAxis: [{ type: "value" }],
            series: _.map(activeLifts, function (l) {
              return {
                name: _this.displayLift(l),
                type: "line",
                showAllSymbol: true,
                data: (function () {
                  var d = [];
                  _.forEach(_this.state.progressData, function (dp) {
                    var liftWeight = null;
                    if (MainService.state.unitSystem !== dp.unitSystem) {
                      var fConvert =
                        MainService.state.unitSystem === "Imperial"
                          ? Strength.kgToLb
                          : Strength.lbToKg;
                      liftWeight = Strength.mround(
                        fConvert(dp.lifts[l].user1RM),
                        1
                      );
                    } else {
                      liftWeight = dp.lifts[l].user1RM;
                    }
                    if (dp.lifts[l].user1RM) {
                      d.push([new Date(dp.timeLogged), liftWeight, dp.id]);
                    }
                  });
                  return d;
                })(),
              };
            }),
          };
        }
        var option3 = {
          title: {
            text: "Strength Progress",
            subtext: "Lift scores over time",
          },
          tooltip: {
            trigger: "item",
            formatter: function (params) {
              var date = new Date(params.value[0]);
              var data =
                date.getFullYear() +
                "-" +
                (date.getMonth() + 1) +
                "-" +
                date.getDate();
              return (
                data +
                "<br/><strong>" +
                params.seriesName +
                " score: " +
                params.value[1] +
                "</strong>"
              );
            },
          },
          dataZoom: { show: true, start: 0 },
          legend: {
            data: _.map(activeLifts, function (l) {
              return _this.displayLift(l);
            }),
            x: "right",
            selectedMode: true,
          },
          grid: { x: 40, x2: 30, y2: 80 },
          xAxis: [{ type: "time", splitNumber: 10 }],
          yAxis: [{ type: "value" }],
          series: _.map(activeLifts, function (l) {
            return {
              name: _this.displayLift(l),
              type: "line",
              showAllSymbol: true,
              data: (function () {
                var d = [];
                _.forEach(_this.state.progressData, function (dp) {
                  if (dp.lifts[l].userScore) {
                    d.push([
                      new Date(dp.timeLogged),
                      dp.lifts[l].userScore,
                      dp.id,
                    ]);
                  }
                });
                return d;
              })(),
            };
          }),
        };
        var displayDeletePointPrompt = function (t) {
          $timeout(function () {
            _this.state.pointClicked = true;
            var date = new Date(t.data[0]);
            _this.state.pointDateString =
              date.getFullYear() +
              "-" +
              (date.getMonth() + 1) +
              "-" +
              date.getDate();
            _this.state.pointID = t.data[2];
          });
        };
        _this.categoryScoreProgressChart.setOption(option);
        if (!_this.hideWeight) {
          _this.liftOneRepMaxProgressChart.setOption(option2);
        }
        _this.liftScoreProgressChart.setOption(option3);
        if ($scope.pageType === "loggedIn") {
          _this.categoryScoreProgressChart.on(
            "click",
            displayDeletePointPrompt
          );
          if (!_this.hideWeight) {
            _this.liftOneRepMaxProgressChart.on(
              "click",
              displayDeletePointPrompt
            );
          }
          _this.liftScoreProgressChart.on("click", displayDeletePointPrompt);
        }
        $timeout(function () {
          if (!_this.hideWeight) {
            _this.liftOneRepMaxProgressChart.restore();
            _this.liftOneRepMaxProgressChart.resize();
          }
          _this.categoryScoreProgressChart.restore();
          _this.categoryScoreProgressChart.resize();
          _this.liftScoreProgressChart.restore();
          _this.liftScoreProgressChart.resize();
          $timeout(function () {
            if (!_this.hideWeight) {
              _this.liftOneRepMaxProgressChart.restore();
              _this.liftOneRepMaxProgressChart.resize();
            }
            _this.categoryScoreProgressChart.restore();
            _this.categoryScoreProgressChart.resize();
            _this.liftScoreProgressChart.restore();
            _this.liftScoreProgressChart.resize();
          });
        });
        window.onresize = _this.categoryScoreProgressChart.resize;
        _this.state.waitingForProgress = false;
      };
      _this.showCategoryScoreProgressChart = function () {
        _this.state.selectedChartTab = "categoryScores";
        if (!_this.state.noLiftData) {
          _this.categoryScoreProgressChart.restore();
          _this.categoryScoreProgressChart.resize();
          $timeout(function () {
            _this.categoryScoreProgressChart.restore();
            _this.categoryScoreProgressChart.resize();
            $timeout(function () {
              _this.categoryScoreProgressChart.restore();
              _this.categoryScoreProgressChart.resize();
              if (
                navigator.userAgent.indexOf("Safari") !== -1 &&
                navigator.userAgent.indexOf("Chrome") === -1
              ) {
                $timeout(function () {
                  _this.categoryScoreProgressChart.restore();
                  _this.categoryScoreProgressChart.resize();
                });
              }
            });
          });
          window.onresize = _this.categoryScoreProgressChart.resize;
        }
      };
      _this.showLiftOneRepMaxProgressChart = function () {
        if (!_this.hideWeight) {
          _this.state.selectedChartTab = "liftOneRepMaxes";
          if (!_this.state.noLiftData) {
            _this.liftOneRepMaxProgressChart.restore();
            _this.liftOneRepMaxProgressChart.resize();
            $timeout(function () {
              _this.liftOneRepMaxProgressChart.restore();
              _this.liftOneRepMaxProgressChart.resize();
              $timeout(function () {
                _this.liftOneRepMaxProgressChart.restore();
                _this.liftOneRepMaxProgressChart.resize();
                if (
                  navigator.userAgent.indexOf("Safari") !== -1 &&
                  navigator.userAgent.indexOf("Chrome") === -1
                ) {
                  $timeout(function () {
                    _this.liftOneRepMaxProgressChart.restore();
                    _this.liftOneRepMaxProgressChart.resize();
                  });
                }
              });
            });
            window.onresize = _this.liftOneRepMaxProgressChart.resize;
          }
        }
      };
      _this.showLiftScoreProgressChart = function () {
        _this.state.selectedChartTab = "liftScores";
        if (!_this.state.noLiftData) {
          _this.liftScoreProgressChart.restore();
          _this.liftScoreProgressChart.resize();
          $timeout(function () {
            _this.liftScoreProgressChart.restore();
            _this.liftScoreProgressChart.resize();
            $timeout(function () {
              _this.liftScoreProgressChart.restore();
              _this.liftScoreProgressChart.resize();
              if (
                navigator.userAgent.indexOf("Safari") !== -1 &&
                navigator.userAgent.indexOf("Chrome") === -1
              ) {
                $timeout(function () {
                  _this.liftScoreProgressChart.restore();
                  _this.liftScoreProgressChart.resize();
                });
              }
            });
          });
          window.onresize = _this.liftScoreProgressChart.resize;
        }
      };
      var preFillFromServer = function () {
        var apiUrl = null;
        if (
          $scope.pageType === "loggedInPublic" ||
          $scope.pageType === "defaultPublic"
        ) {
          apiUrl = "/api/past_lifts/" + $scope.username;
        } else if ($scope.pageType === "loggedIn") {
          apiUrl = "/api/past_lifts";
        }
        var deferred = $q.defer();
        Restangular.one(apiUrl)
          .get()
          .then(
            function (liftData) {
              _this.state.progressData = [];
              _.forEach(liftData, function (d) {
                var dataPoint = calculateDataPoint(d);
                _this.state.progressData.push(dataPoint);
              });
              deferred.resolve(true);
            },
            function (response) {
              deferred.reject(response.data || response);
            }
          );
        return deferred.promise;
      };
      _this.deleteLiftingData = function () {
        console.log("Delete lifting data. ID: " + _this.state.pointID);
        var apiUrl = "/api/lift_data/" + _this.state.pointID;
        _this.state.waitingForProgress = true;
        Restangular.one(apiUrl)
          .remove()
          .then(
            function () {
              _this.state.waitingForProgress = false;
              preFillFromServer().then(function () {
                initChart();
              });
            },
            function () {
              _this.state.waitingForProgress = false;
            }
          );
      };
      _this.cancelDelete = function () {
        _this.state.pointClicked = false;
      };
      preFillFromServer().then(function () {
        initChart();
      });
    },
  ]);
  module.directive("strengthProgress", function () {
    "use strict";
    return {
      restrict: "E",
      templateUrl: "strength-progress",
      controller: "StrengthProgressController",
      controllerAs: "strengthProgressCtrl",
    };
  });
  module.directive("strengthsWeaknessesChart", function () {
    "use strict";
    return { restrict: "E", templateUrl: "strengths-weaknesses-chart" };
  });
  module.run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "friends-stats",
        '<div class="portlet light friends-stats"><div class="portlet-title"><div class="caption caption-md"><span class="caption-subject theme-font bold uppercase">Friends</span>\n</div>\n</div>\n<div class="portlet-body"><div class="col-md-12"><div class="row display-select" ng-if="friendsStatsCtrl.state.friendData.length > 0"><div class="form-group"><label class="col-md-2 control-label">Display</label>\n<div class="col-md-4"><select class="form-control input-sm" ng-model="friendsStatsCtrl.friendDisplay" ng-change="friendsStatsCtrl.handleFriendDisplayChanged()"><option value="CategoryScores">Category Scores</option>\n<option value="LiftOneRMs">Lift 1RMs</option>\n<option value="LiftScores">Lift Scores</option>\n</select>\n</div>\n</div>\n</div>\n<div class="row" ng-if="friendsStatsCtrl.state.friendData.length > 0"><div class="table-responsive col-md-12"><table class="table table-striped table-bordered table-hover table-condensed" ng-if="friendsStatsCtrl.friendDisplay === \'CategoryScores\'"><thead><tr><th>User</th>\n<th>Bodyweight</th>\n<th>Squat</th>\n<th>Floor Pull</th>\n<th>Hor. Press</th>\n<th>Vert. Press</th>\n<th>Pull-up / Row</th>\n<th>Total</th>\n</tr>\n</thead>\n<tbody><tr ng-repeat="friend in friendsStatsCtrl.state.friendData"><td><a href="/lifter/{{friend.username}}">{{friend.username}}</a>\n</td>\n<td>{{friend.bodyweight}}\n<i class="fa" ng-if="friend.bodyweightComparison !== \'eq\'" ng-class="{\'fa-caret-up\':friend.bodyweightComparison === \'gt\',\'fa-caret-down\':friend.bodyweightComparison === \'lt\'}"></i>\n</td>\n<td>{{friend.catScores.squat || \'--\'}}\n<i class="fa" ng-if="friend.catScoreComparisons.squat !== \'eq\'" ng-class="{\'fa-caret-up\':friend.catScoreComparisons.squat === \'gt\',\'fa-caret-down\':friend.catScoreComparisons.squat === \'lt\'}"></i>\n</td>\n<td>{{friend.catScores.floorPull || \'--\'}}\n<i class="fa" ng-if="friend.catScoreComparisons.floorPull !== \'eq\'" ng-class="{\'fa-caret-up\':friend.catScoreComparisons.floorPull === \'gt\',\'fa-caret-down\':friend.catScoreComparisons.floorPull === \'lt\'}"></i>\n</td>\n<td>{{friend.catScores.horizontalPress || \'--\'}}\n<i class="fa" ng-if="friend.catScoreComparisons.horizontalPress !== \'eq\'" ng-class="{\'fa-caret-up\':friend.catScoreComparisons.horizontalPress === \'gt\',\'fa-caret-down\':friend.catScoreComparisons.horizontalPress === \'lt\'}"></i>\n</td>\n<td>{{friend.catScores.verticalPress || \'--\'}}\n<i class="fa" ng-if="friend.catScoreComparisons.verticalPress !== \'eq\'" ng-class="{\'fa-caret-up\':friend.catScoreComparisons.verticalPress === \'gt\',\'fa-caret-down\':friend.catScoreComparisons.verticalPress === \'lt\'}"></i>\n</td>\n<td>{{friend.catScores.pullup || \'--\'}}\n<i class="fa" ng-if="friend.catScoreComparisons.pullup !== \'eq\'" ng-class="{\'fa-caret-up\':friend.catScoreComparisons.pullup === \'gt\',\'fa-caret-down\':friend.catScoreComparisons.pullup === \'lt\'}"></i>\n</td>\n<td>{{friend.totalScore || \'--\'}}\n<i class="fa" ng-if="friend.totalScoreComparison !== \'eq\'" ng-class="{\'fa-caret-up\':friend.totalScoreComparison === \'gt\',\'fa-caret-down\':friend.totalScoreComparison === \'lt\'}"></i>\n</td>\n</tr>\n</tbody>\n</table>\n<table class="table table-striped table-bordered table-hover table-condensed" ng-if="friendsStatsCtrl.friendDisplay === \'LiftOneRMs\'"><thead><tr><th>User</th>\n<th>Bodyweight</th>\n<th ng-repeat="lift in friendsStatsCtrl.selectedLifts">{{friendsStatsCtrl.displayLift(lift)}}</th>\n</tr>\n</thead>\n<tbody><tr ng-repeat="friend in friendsStatsCtrl.state.friendData"><td><a href="/lifter/{{friend.username}}">{{friend.username}}</a>\n</td>\n<td>{{friend.bodyweight}}\n<i class="fa" ng-if="friend.bodyweightComparison !== \'eq\'" ng-class="{\'fa-caret-up\':friend.bodyweightComparison === \'gt\',\'fa-caret-down\':friend.bodyweightComparison === \'lt\'}"></i>\n</td>\n<td ng-repeat="lift in friendsStatsCtrl.selectedLifts">{{friend.liftStats[lift].displayOneRM}}\n<i class="fa" ng-if="friend.liftStatComparisons[lift].oneRM !== \'eq\'" ng-class="{\'fa-caret-up\':friend.liftStatComparisons[lift].oneRM === \'gt\',\'fa-caret-down\':friend.liftStatComparisons[lift].oneRM === \'lt\'}"></i>\n</td>\n</tr>\n</tbody>\n</table>\n<table class="table table-striped table-bordered table-hover table-condensed" ng-if="friendsStatsCtrl.friendDisplay === \'LiftScores\'"><thead><tr><th>User</th>\n<th>Bodyweight</th>\n<th ng-repeat="lift in friendsStatsCtrl.selectedLifts">{{friendsStatsCtrl.displayLift(lift)}}</th>\n</tr>\n</thead>\n<tbody><tr ng-repeat="friend in friendsStatsCtrl.state.friendData"><td><a href="/lifter/{{friend.username}}">{{friend.username}}</a>\n</td>\n<td>{{friend.bodyweight}}\n<i class="fa" ng-if="friend.bodyweightComparison !== \'eq\'" ng-class="{\'fa-caret-up\':friend.bodyweightComparison === \'gt\',\'fa-caret-down\':friend.bodyweightComparison === \'lt\'}"></i>\n</td>\n<td ng-repeat="lift in friendsStatsCtrl.selectedLifts">{{friend.liftStats[lift].score || \'--\'}}\n<i class="fa" ng-if="friend.liftStatComparisons[lift].score !== \'eq\'" ng-class="{\'fa-caret-up\':friend.liftStatComparisons[lift].score === \'gt\',\'fa-caret-down\':friend.liftStatComparisons[lift].score === \'lt\'}"></i>\n</td>\n</tr>\n</tbody>\n</table>\n</div>\n</div>\n<div class="row" ng-if="!friendsStatsCtrl.state.loadingFriendData && friendsStatsCtrl.state.friendData.length === 0"><div class="col-md-12"><div class="alert alert-info">You haven\'t added any friends yet! Add a friend by entering their username below.</div>\n</div>\n</div>\n<div class="row" ng-if="friendsStatsCtrl.state.loadingFriendData"><div class="col-md-12"><p class="loading-indicator"><i class="fa fa-spin fa-spinner"></i>\n</p>\n</div>\n</div>\n<div class="row"><div class="col-sm-7"><div class="form-group form-md-line-input form-md-floating-label" ng-class="{\'has-error\':friendsStatsCtrl.state.addFriendError}"><div class="input-group"><div class="input-group-control"><input class="form-control input-sm" ng-model="friendsStatsCtrl.state.newFriendUsername" ng-class="{\'edited\':friendsStatsCtrl.state.newFriendUsername}" type="text">\n<label for="form_control_1">Username</label>\n</div>\n<span class="input-group-btn btn-right"><button class="btn btn-sm green-haze" ng-click="friendsStatsCtrl.addNewFriend()" type="button">Add friend\n<i class="fa fa-plus"></i>\n</button>\n</span>\n</div>\n<span class="help-block" ng-bind="friendsStatsCtrl.state.addFriendError"></span>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "lifts-form",
        '<div class="portlet light"><div class="portlet-title" ng-if="pageType === \'loggedIn\'"><div class="caption caption-md"><span class="caption-subject theme-font bold uppercase">Log your latest lifts</span>\n</div>\n</div>\n<div class="portlet-body"><form role="form" name="mainForm" novalidate><div class="col-md-12"><div class="row"><div class="form-group form-md-line-input form-md-floating-label col-md-3 unit-system"><select class="form-control edited" id="form-unit-system" ng-model="mainCtrl.state.unitSystem"><option value="Imperial">Imperial</option>\n<option value="Metric">Metric</option>\n</select>\n<label for="form-unit-system">Units</label>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3"><select class="form-control edited" id="form-round-to" ng-model="mainCtrl.state.roundCalculationsTo" convert-to-number><option value="1" ng-if="mainCtrl.state.unitSystem === \'Metric\'">1 kg</option>\n<option value="1" ng-if="mainCtrl.state.unitSystem !== \'Metric\'">1 lb</option>\n<option value="2.5" ng-if="mainCtrl.state.unitSystem === \'Metric\'">2.5 kg</option>\n<option value="2.5" ng-if="mainCtrl.state.unitSystem !== \'Metric\'">2.5 lbs</option>\n<option value="5" ng-if="mainCtrl.state.unitSystem === \'Metric\'">5 kg</option>\n<option value="5" ng-if="mainCtrl.state.unitSystem !== \'Metric\'">5 lbs</option>\n<option value="10" ng-if="mainCtrl.state.unitSystem === \'Metric\'">10 kg</option>\n<option value="10" ng-if="mainCtrl.state.unitSystem !== \'Metric\'">10 lbs</option>\n</select>\n<label for="form-round-to">Round calculations to nearest</label></label>\n</div>\n</div>\n<hr>\n<div class="row"><h2>Select the lifts that you train. <small>These lifts will be used to determine your strength levels. For the most complete results, choose at least one lift per category.</small></h2></h2>\n</div>\n<div class="row lift-categories"><div class="col-md-4 col-lg-3"><div class="form-group form-md-checkboxes"><label>Squat</label>\n<div class="md-checkbox-list"><div class="md-checkbox"><input class="md-check" type="checkbox" id="form-back-squat" ng-model="mainCtrl.state.liftFields.backSquat.checked"><label for="form-back-squat"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nBack Squat</label>\n</input>\n</div>\n<div class="md-checkbox"><input class="md-check" type="checkbox" id="form-front-squat" ng-model="mainCtrl.state.liftFields.frontSquat.checked"><label for="form-front-squat"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nFront Squat</label>\n</input>\n</div>\n</div>\n</div>\n</div>\n<div class="col-md-4 col-lg-3"><div class="form-group form-md-checkboxes"><label>Floor Pull</label>\n<div class="md-checkbox-list"><div class="md-checkbox"><input class="md-check" type="checkbox" id="form-deadlift" ng-model="mainCtrl.state.liftFields.deadlift.checked"><label for="form-deadlift"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nDeadlift</label>\n</input>\n</div>\n<div class="md-checkbox"><input class="md-check" type="checkbox" id="form-sumo-deadlift" ng-model="mainCtrl.state.liftFields.sumoDeadlift.checked"><label for="form-sumo-deadlift"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nSumo Deadlift</label>\n</input>\n</div>\n<div class="md-checkbox"><input class="md-check" type="checkbox" id="form-power-clean" ng-model="mainCtrl.state.liftFields.powerClean.checked"><label for="form-power-clean"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nPower Clean</label>\n</input>\n</div>\n</div>\n</div>\n</div>\n<div class="col-md-4 col-lg-3"><div class="form-group form-md-checkboxes"><label>Horizontal Press</label>\n<div class="md-checkbox-list"><div class="md-checkbox"><input class="md-check" type="checkbox" id="form-bench-press" ng-model="mainCtrl.state.liftFields.benchPress.checked"><label for="form-bench-press"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nBench Press</label>\n</input>\n</div>\n<div class="md-checkbox"><input class="md-check" type="checkbox" id="form-incline-bench-press" ng-model="mainCtrl.state.liftFields.inclineBenchPress.checked"><label for="form-incline-bench-press"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nIncline Bench Press</label>\n</input>\n</div>\n<div class="md-checkbox"><input class="md-check" type="checkbox" id="form-dip" ng-model="mainCtrl.state.liftFields.dip.checked"><label for="form-dip"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nDip</label>\n</input>\n</div>\n</div>\n</div>\n</div>\n</div>\n<div class="row lift-categories"><div class="col-md-4 col-lg-3"><div class="form-group form-md-checkboxes"><label>Vertical Press</label>\n<div class="md-checkbox-list"><div class="md-checkbox"><input class="md-check" type="checkbox" id="form-overhead-press" ng-model="mainCtrl.state.liftFields.overheadPress.checked"><label for="form-overhead-press"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nOverhead Press</label>\n</input>\n</div>\n<div class="md-checkbox"><input class="md-check" type="checkbox" id="form-push-press" ng-model="mainCtrl.state.liftFields.pushPress.checked"><label for="form-push-press"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nPush Press</label>\n</input>\n</div>\n<div class="md-checkbox"><input class="md-check" type="checkbox" id="form-snatch-press" ng-model="mainCtrl.state.liftFields.snatchPress.checked"><label for="form-snatch-press"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nSnatch Press</label>\n</input>\n</div>\n</div>\n</div>\n</div>\n<div class="col-md-4 col-lg-3"><div class="form-group form-md-checkboxes"><label>Pull-up / Row</label>\n<div class="md-checkbox-list"><div class="md-checkbox"><input class="md-check" type="checkbox" id="form-chinup" ng-model="mainCtrl.state.liftFields.chinup.checked"><label for="form-chinup"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nChin-up</label>\n</input>\n</div>\n<div class="md-checkbox"><input class="md-check" type="checkbox" id="form-pullup" ng-model="mainCtrl.state.liftFields.pullup.checked"><label for="form-pullup"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nPull-up</label>\n</input>\n</div>\n<div class="md-checkbox"><input class="md-check" type="checkbox" id="form-pendlay-row" ng-model="mainCtrl.state.liftFields.pendlayRow.checked"><label for="form-pendlay-row"><span></span>\n<span class="check"></span>\n<span class="box"></span>\nPendlay Row</label>\n</input>\n</div>\n</div>\n</div>\n</div>\n</div>\n<p class="text-error" ng-if="mainCtrl.state.errors.noLiftChecked">Check at least one lift.</p>\n<hr>\n<div class="row"><h2>Enter your sex, bodyweight, &amp; age. <small>Your strength score adjusts by sex, bodyweight, and age, allowing you to measure yourself against any other lifter.</small></h2></h2>\n</div>\n<div class="row lifter-info"><div class="form-group form-md-line-input form-md-floating-label col-md-2"><select class="form-control edited" id="form-sex" ng-model="mainCtrl.state.sex"><option value="Male">Male</option>\n<option value="Female">Female</option>\n</select>\n<label for="form-sex">Sex</label>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\': mainCtrl.state.errors.bodyweight}"><div class="input-group right-addon"><input class="form-control" id="form-bodyweight" ng-class="{\'edited\':mainCtrl.state.bodyweight != null}" type="number" ng-model="mainCtrl.state.bodyweight" name="bodyweight" required>\n<span class="input-group-addon" ng-bind="mainCtrl.displayUnits()"></span>\n<label for="form-body-weight">Body weight</label>\n</div>\n<span class="help-block">Enter your body weight.</span>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\': mainCtrl.state.errors.age}"><div class="input-group"><input class="form-control" id="form-age" ng-class="{\'edited\':mainCtrl.state.age != null}" type="number" ng-model="mainCtrl.state.age" name="age" required>\n<label for="form-age">Age (optional)</label>\n</div>\n<span class="help-block">Age must be between 10 and 100.</span>\n</div>\n</div>\n<hr>\n<div class="row"><h2>Enter your best recent sets. <small>Finally, for each lift you train, enter your most difficult set that you have completed recently. Each set should be 10 or fewer reps.</small></h2></h2>\n</div>\n<div class="animate-fade" ng-repeat="lift in mainCtrl.lifts" ng-if="mainCtrl.state.liftFields[lift].checked"><div class="row"><div class="col-md-2"><h5 class="lift-title" ng-bind="mainCtrl.state.liftFields[lift].liftName"></h5>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-2" ng-if="mainCtrl.state.liftFields[lift].liftType"><select class="form-control edited" id="form-{{lift}}-type" ng-model="mainCtrl.state.liftFields[lift].liftType"><option value="Standard">Standard</option>\n<option value="Weighted">Weighted</option>\n<option value="Assisted">Assisted</option>\n</select>\n<label for="form-{{lift}}-type">Type</label>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-if="mainCtrl.state.liftFields[lift].liftType !== \'Standard\'" ng-class="{\'has-error\':mainCtrl.state.errors.liftFields[lift].weight}"><div class="input-group right-addon"><input class="form-control" ng-if="lift === \'chinup\' || lift === \'pullup\' || lift === \'dip\'" ng-class="{\'edited\':mainCtrl.state.liftFields[lift].specialWeight != null}" type="number" id="form-{{lift}}-weight" ng-model="mainCtrl.state.liftFields[lift].specialWeight" required>\n<input class="form-control" ng-if="lift !== \'chinup\' && lift !== \'pullup\' && lift !== \'dip\'" ng-class="{\'edited\':mainCtrl.state.liftFields[lift].weight != null}" type="number" id="form-{{lift}}-weight" ng-model="mainCtrl.state.liftFields[lift].weight" required>\n<span class="input-group-addon" ng-bind="mainCtrl.displayUnits()"></span>\n<label ng-if="mainCtrl.state.liftFields[lift].liftType === \'Weighted\'" for="form-{{lift}}-weight">Weight added</label>\n<label ng-if="mainCtrl.state.liftFields[lift].liftType === \'Assisted\'" for="form-{{lift}}-weight">Assist weight</label>\n<label ng-if="mainCtrl.state.liftFields[lift].liftType !== \'Weighted\' && mainCtrl.state.liftFields[lift].liftType !== \'Assisted\'" for="form-{{lift}}-weight">Weight</label>\n</div>\n<span class="help-block">Enter the weight.</span>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-2" ng-class="{\'has-error\':mainCtrl.state.errors.liftFields[lift].reps}"><div class="input-group left-addon"><span class="input-group-addon"><i class="fa fa-times"></i>\n</span>\n<input class="form-control" type="number" ng-class="{\'edited\':mainCtrl.state.liftFields[lift].reps != null}" id="form-{{lift}}-reps" ng-model="mainCtrl.state.liftFields[lift].reps" required>\n<label for="form-{{lift}}-reps">Reps</label>\n</div>\n<span class="help-block">Enter the rep count.</span>\n</div>\n</div>\n<div class="row" ng-if="mainCtrl.state.liftFields[lift].liftType === \'Standard\'"><div class="col-md-10 col-md-offset-2 note-ten-reps"><div class="note note-info col-md-10 col-md-offset-2"><strong>Note:</strong> If you can do over 10 reps, start doing weighted {{mainCtrl.displayLift(lift)|lowercase}}s for the most accurate results. See the <a href="/about#faq">FAQ section</a> for more information.</div>\n</div>\n</div>\n</div>\n<div class="row"><button class="btn btn-lg red-sunglo" ng-click="mainCtrl.calculateResults()">Analyze{{ pageType === \'default\' ? \' Strength\' : \'\'}}</button>\n<button class="btn btn-lg green-haze" ng-if="pageType === \'loggedIn\'" ng-click="mainCtrl.calculateResults() && mainCtrl.saveLifts()">Analyze and Log Lifts</button>\n<button class="btn btn-lg grey-pastel" ng-if="pageType === \'loggedIn\'" ng-click="mainCtrl.loadLifts()">Reset</button>\n<button class="btn btn-lg grey-steel analyze-help-btn" ng-if="pageType === \'loggedIn\'" ng-click="mainCtrl.state.displayAnalyzeHelp = !mainCtrl.state.displayAnalyzeHelp"><i class="fa fa-question"></i>\n</button>\n<div class="note note-info analyze-help animate-fade" ng-if="pageType === \'loggedIn\' && mainCtrl.state.displayAnalyzeHelp"><p><strong>Analyze:</strong> Displays a strength analysis, but does not save the data you entered. Use this if you\'re just curious about some results.</p>\n<p><strong>Analyze and Log Lifts:</strong> Displays a strength analysis and saves the data you entered. Use this if the numbers you entered match your recent lifts.</p>\n<p><strong>Reset:</strong> Loads your last logged lifts.</p>\n</div>\n<div class="alert alert-block alert-danger error-panel" ng-if="mainCtrl.state.errors.errorList.length > 0"><h4 class="alert-heading">Please correct the following and try again:</h4>\n<ul><li ng-repeat="error in mainCtrl.state.errors.errorList" ng-bind="error"></li>\n</ul>\n</div>\n</div>\n</div>\n</form>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "main-stats",
        '<div class="dashboard-stat {{mainCtrl.state.results.scoreClass || \'novice\'}}"><div class="visual"><i class="fa fa-bar-chart-o"></i>\n</div>\n<div class="details"><div class="number">Score: {{mainCtrl.state.results.totalScore}}</div>\n<div class="desc">{{mainCtrl.state.results.totalScore|englishStrengthScore}}</div>\n</div>\n<div class="more"><div><span class="lift-category-stats">Squat: {{mainCtrl.state.results.categories.squat}}</span> <span class="lift-category-classification">[{{mainCtrl.state.results.categories.squat|englishStrengthScore}}]</span></span>\n</div>\n<div><span class="lift-category-stats">Floor Pull: {{mainCtrl.state.results.categories.floorPull}}</span> <span class="lift-category-classification">[{{mainCtrl.state.results.categories.floorPull|englishStrengthScore}}]</span></span>\n</div>\n<div><span class="lift-category-stats">Horizontal Press: {{mainCtrl.state.results.categories.horizontalPress}}</span> <span class="lift-category-classification">[{{mainCtrl.state.results.categories.horizontalPress|englishStrengthScore}}]</span></span>\n</div>\n<div><span class="lift-category-stats">Vertical Press: {{mainCtrl.state.results.categories.verticalPress}}</span> <span class="lift-category-classification">[{{mainCtrl.state.results.categories.verticalPress|englishStrengthScore}}]</span></span>\n</div>\n<div><span class="lift-category-stats">Pull-up / Row: {{mainCtrl.state.results.categories.pullup}}</span> <span class="lift-category-classification">[{{mainCtrl.state.results.categories.pullup|englishStrengthScore}}]</span></span>\n</div>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "main",
        '<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script></script>\n<div class="page-container"><div class="page-head"><div class="container"><div class="page-title"><h1 ng-if="pageType === \'default\'">Analyze Your Strength <small>Find strengths and weaknesses and measure yourself against other lifters</small></h1></h1>\n<h1 ng-if="pageType === \'anonymous\'">Lifter analysis&nbsp;<small>{{mainCtrl.state.sex}}, {{mainCtrl.state.bodyweight}} {{mainCtrl.displayUnits()}}</small>\n</h1>\n<h1 ng-if="pageType === \'loggedIn\'">Welcome, {{username}}. <small>Log your latest lifts and view your strength analysis.</small></h1></h1>\n<h1 ng-if="pageType === \'defaultPublic\' || pageType === \'loggedInPublic\'">Lifter profile: {{username}}\n<small><span ng-if="!mainCtrl.hideWeight && mainCtrl.state.age">{{mainCtrl.state.age}} years old, </span>{{mainCtrl.state.sex}}<span ng-if="!mainCtrl.hideWeight">, {{mainCtrl.state.bodyweight}} {{mainCtrl.displayUnits()}}</span></small></small>\n<button class="btn grey-steel" ng-if="mainCtrl.state.checkedFriendshipAndLoggedIn && !mainCtrl.state.isFriend" ng-click="mainCtrl.addFriend()"><i class="fa fa-user-plus"></i>\nAdd friend</button>\n<button class="btn" ng-if="mainCtrl.state.checkedFriendshipAndLoggedIn && mainCtrl.state.isFriend" ng-class="{\'red-sunglo\': mainCtrl.state.friendButtonHovered, \'green-haze\': !mainCtrl.state.friendButtonHovered}" ng-click="mainCtrl.removeFriend()" ng-mouseenter="mainCtrl.state.friendButtonHovered = true" ng-mouseleave="mainCtrl.state.friendButtonHovered = false"><span ng-if="mainCtrl.state.friendButtonHovered"><i class="fa fa-user-times"></i>\nRemove</span>\n<span ng-if="!mainCtrl.state.friendButtonHovered">Friends</span>\n</button>\n</h1>\n</div>\n</div>\n</div>\n<div class="page-content"><div class="container"><div class="row"><div class="col-md-12"><div class="alert alert-success">The Symmetric Strength iOS app has launched!<a href="https://itunes.apple.com/us/app/symmetric-strength/id1232104742" ng-click="mainCtrl.trackTopAppClick()"><img class="top-app-btn" src="/static/res/img/app-store-badge.png">\n</a>\n</div>\n<div class="alert alert-info">Get the Symmetric Strength Android app!<a href="https://play.google.com/store/apps/details?id=com.hansler.android.symmetricstrength" ng-click="mainCtrl.trackTopAppClick()"><img class="top-app-btn" src="/static/res/img/play-store-badge.png">\n</a>\n</div>\n</div>\n</div>\n<div class="row" ng-if="pageType === \'defaultPublic\' || pageType === \'loggedInPublic\'"><div class="col-md-12"><div class="alert alert-info" ng-if="mainCtrl.state.unitsConverted"><strong>Note:</strong>\nAll weights on this page have been converted to {{mainCtrl.state.unitSystem}} and rounded to the nearest {{mainCtrl.displayUnits(true)}}.</div>\n</div>\n</div>\n<div class="row" ng-if="pageType === \'defaultPublic\'"><div class="col-md-12"><div class="alert alert-info"><a href="/auth/login">Log in</a> to create your own strength profile and add {{username}} as a friend!</a>\n</div>\n</div>\n</div>\n<div class="row" ng-if="(pageType === \'defaultPublic\' && mainCtrl.state.lastSavedLiftFields) || (pageType === \'loggedInPublic\' && mainCtrl.state.lastSavedLiftFields) || pageType === \'loggedIn\'"><div class="col-md-12"><strength-progress></strength-progress>\n</div>\n<div ng-class="{\'col-md-12\': pageType === \'defaultPublic\' || pageType === \'loggedInPublic\', \'col-md-4\': pageType === \'loggedIn\'}"><div class="portlet light"><div class="portlet-title"><div class="caption caption-md"><span class="caption-subject theme-font bold uppercase">Latest saved lifts</span>\n</div>\n</div>\n<div class="portlet-body" ng-if="mainCtrl.state.lastSavedLiftFields && !mainCtrl.state.waitingForLastSaved"><p><em>Logged on {{mainCtrl.state.lastSavedLiftFields.timeLogged.toLocaleDateString()}}:</em>\n</p>\n<ul class="list-unstyled"><li ng-if="!mainCtrl.hideWeight"><span class="boldish">Bodyweight:</span>\n{{mainCtrl.state.bodyweight}} {{mainCtrl.displayUnits()}}</li>\n<li ng-if="!mainCtrl.hideWeight && mainCtrl.state.age"><span class="boldish">Age:</span>\n{{mainCtrl.state.age}}</li>\n<li ng-repeat="lift in mainCtrl.lifts" ng-if="mainCtrl.state.lastSavedLiftFields[lift].weight && mainCtrl.state.lastSavedLiftFields[lift].reps"><span class="boldish">{{mainCtrl.displayLift(lift)}}:</span>\n{{mainCtrl.displayWeight(mainCtrl.displayLift(lift), mainCtrl.state.lastSavedLiftFields[lift].weight, mainCtrl.state.bodyweight, mainCtrl.state.roundCalculationsTo)}} {{mainCtrl.displayUnits()}} x {{mainCtrl.state.lastSavedLiftFields[lift].reps}}</li>\n</ul>\n</div>\n<p class="loading-indicator" ng-if="mainCtrl.state.waitingForLastSaved"><i class="fa fa-spinner fa-spin"></i>\n</p>\n<div class="portlet-body" ng-if="!mainCtrl.state.lastSavedLiftFields && !mainCtrl.state.waitingForLastSaved"><div class="alert alert-info">You haven\'t saved any lifts yet! Enter your lifts below, then click "Analyze and Log Lifts".</div>\n</div>\n</div>\n</div>\n<div class="col-md-8" ng-if="pageType === \'loggedIn\' && mainCtrl.state.lastSavedLiftFields"><friends-stats unit-system="{{mainCtrl.state.unitSystem}}" last-saved-lift-fields="mainCtrl.state.lastSavedLiftFields" friend-display="{{friendDisplay}}"></friends-stats>\n</div>\n</div>\n<div class="row" ng-if="pageType === \'default\' || pageType === \'loggedIn\'"><div class="col-md-12"><lifts-form></lifts-form>\n</div>\n</div>\n<div ng-show="mainCtrl.state.resultsShown"><div class="row" ng-if="pageType === \'loggedIn\' && mainCtrl.pageIsPublic"><div class="col-md-12"><div class="portlet light"><div class="portlet-title"><div class="caption caption-md"><span class="caption-subject theme-font bold uppercase">Share your results</span>\n</div>\n</div>\n<div class="portlet-body"><p>Use your public profile link or the social media buttons below to share your last saved results:</p>\n<p><a href="{{mainCtrl.state.publicUrl}}" ng-bind="mainCtrl.state.publicUrl"></a>\n</p>\n<p><a class="social-icon social-icon-color facebook" href="https://www.facebook.com/sharer/sharer.php?u={{mainCtrl.state.publicUrl|escape}}" data-original-title="facebook"></a>\n<a class="social-icon social-icon-color googleplus" href="https://plus.google.com/share?url={{mainCtrl.state.publicUrl|escape}}" data-original-title="google plus"></a>\n<a class="social-icon social-icon-color pintrest" href="http://pinterest.com/pin/create/button/?url={{mainCtrl.state.publicUrl|escape}}&amp;media=https://symmetricstrength.com/static/res/img/fbimage.png&amp;description=My%20symmetric%20strength%20profile." data-original-title="pintrest"></a>\n<a class="social-icon social-icon-color twitter" href="https://twitter.com/intent/tweet?text={{\'My symmetric strength profile: \' + mainCtrl.state.publicUrl + \' #symmetricstrength\'|escape}}" data-original-title="twitter"></a>\n</p>\n</div>\n</div>\n</div>\n</div>\n<div class="row"><div class="col-md-4"><main-stats></main-stats>\n<one-rep-maxes></one-rep-maxes>\n</div>\n<div class="col-md-8"><strengths-weaknesses-chart></strengths-weaknesses-chart>\n</div>\n</div>\n<div class="row"><div class="col-md-12"><muscle-figure></muscle-figure>\n</div>\n</div>\n<div class="row"><div class="col-md-6"><more-stats></more-stats>\n</div>\n<div class="col-md-6"><div class="portlet light"><div class="portlet-body" ng-show="mainCtrl.showAndroidAppImg"><a href="https://play.google.com/store/apps/details?id=com.hansler.android.symmetricstrength" ng-click="mainCtrl.trackSideAppClick()"><img class="app-img" src="/static/res/img/app.png">\n</a>\n</div>\n<div class="portlet-body" ng-show="!mainCtrl.showAndroidAppImg"><a href="https://itunes.apple.com/us/app/symmetric-strength/id1232104742" ng-click="mainCtrl.trackSideAppClick()"><img class="app-img" src="/static/res/img/ios-app.png">\n</a>\n</div>\n</div>\n</div>\n</div>\n<div class="row" ng-if="mainCtrl.state.resultsShown && !mainCtrl.hideWeight"><div class="col-md-12"><standards sex="mainCtrl.state.sex" age="mainCtrl.state.age" bodyweight="mainCtrl.state.bodyweight" unit-system="mainCtrl.state.unitSystem" round-calculations-to="mainCtrl.state.roundCalculationsTo" standards-page="false"></standards>\n</div>\n</div>\n</div>\n<div ng-if="mainCtrl.state.noLiftingDataError"><div class="alert alert-block alert-warning"><p>{{username}} has not logged any lifts yet!</p>\n</div>\n</div>\n</div>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "more-stats",
        '<div class="more-stats portlet light" ng-if="mainCtrl.state.results.symmetryScore || mainCtrl.state.results.powerliftingTotal || mainCtrl.state.results.powerliftingWilks || mainCtrl.state.results.strongestLift || mainCtrl.state.results.weakestLift || mainCtrl.state.results.strongestMuscleGroups || mainCtrl.state.results.weakestMuscleGroups"><div class="portlet-title"><div class="caption caption-md"><span class="caption-subject theme-font bold uppercase">More stats</span>\n</div>\n</div>\n<div class="portlet-body"><div class="row list-separated more-stats-items"><div class="col-md-4 col-sm-4 col-xs-6" ng-if="mainCtrl.state.results.symmetryScore" bs-tooltip data-title="Higher scores indicate more symmetric strength. The highest possible score is 100."><div class="item-name font-grey-mint font-sm">Symmetry Score\n<i class="fa fa-info-circle"></i>\n</div>\n<div class="font-hg font-red-flamingo">{{mainCtrl.state.results.symmetryScore}}</div>\n</div>\n<div class="col-md-4 col-sm-4 col-xs-6" ng-if="mainCtrl.state.results.powerliftingTotal" bs-tooltip data-title="Powerlifting total. Combined one-rep maxes for the back squat, bench press, and deadlift."><div class="item-name font-grey-mint font-sm">Estimated PL Total\n<i class="fa fa-info-circle"></i>\n</div>\n<div class="font-hg font-red-flamingo">{{mainCtrl.state.results.powerliftingTotal}}\n<span class="font-lg font-grey-mint">{{mainCtrl.displayUnits()}}</span>\n</div>\n</div>\n<div class="col-md-4 col-sm-4 col-xs-6" ng-if="mainCtrl.state.results.powerliftingWilks" bs-tooltip data-title="Used in powerlifting competitions to determine the best lifter."><div class="item-name font-grey-mint font-sm">Estimated PL Wilks\n<i class="fa fa-info-circle"></i>\n</div>\n<div class="font-hg font-red-flamingo">{{mainCtrl.state.results.powerliftingWilks}}</div>\n</div>\n<div class="col-md-4 col-sm-4 col-xs-6" ng-if="mainCtrl.state.results.strongestLift"><div class="item-name font-grey-mint font-sm">Strongest Lift</div>\n<div class="font-hg font-red-flamingo">{{mainCtrl.state.results.strongestLift}}</div>\n</div>\n<div class="col-md-4 col-sm-4 col-xs-6" ng-if="mainCtrl.state.results.weakestLift"><div class="item-name font-grey-mint font-sm">Weakest Lift</div>\n<div class="font-hg font-red-flamingo">{{mainCtrl.state.results.weakestLift}}</div>\n</div>\n</div>\n<div class="row"><div class="col-xs-12 font-grey-gallery" ng-if="mainCtrl.state.results.strongestMuscleGroups"><strong>Strongest Muscle Groups:</strong> {{mainCtrl.state.results.strongestMuscleGroups}}</strong>\n</div>\n<div class="col-xs-12 font-grey-gallery" ng-if="mainCtrl.state.results.weakestMuscleGroups"><strong>Weakest Muscle Groups:</strong> {{mainCtrl.state.results.weakestMuscleGroups}}</strong>\n</div>\n</div>\n<div class="row" ng-if="pageType === \'default\'"><div class="col-xs-12"><hr>\n<div class="login-push"><h3>Save your lifts, track your lifting progress, and share your results!</h3>\n<p>Make a free account to track your lifting progress and share your results with others! Log in instantly with Facebook or Google, or register using your email address.</p>\n<p><a class="btn facebook-btn" href="/auth/page/fb/login"><i class="fa fa-facebook"></i> Sign in with Facebook</a>\n</p>\n<p><a class="btn google-plus-btn" href="/auth/page/googleemail2/forward"><i class="fa fa-google-plus"></i> Sign in with Google</a>\n</p>\n<p><a class="btn email-btn" href="/auth/page/email/register"><i class="fa fa-envelope"></i> Sign in with email</a>\n</p>\n</div>\n</div>\n</div>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "muscle-figure",
        '<div class="portlet light"><div class="portlet-title"><div class="caption caption-md"><span class="caption-subject theme-font bold uppercase">Estimated strength by muscle group</span>\n</div>\n</div>\n<div class="portlet-body"><img class="hidden muscle-figure" id="muscle-figure-male-img" src="/static/res/img/male-musculature.jpg">\n<div id="canvas-container"><svg ng-if="mainCtrl.state.sex === \'Male\'" id="muscle-figure-male" xmlns="http://www.w3.org/2000/svg" width="700" height="800" viewBox="0 0 700 800"><image width="700" height="800" xlink:href="/static/res/img/male-musculature.jpg"></image>\n<path class="forearms {{mainCtrl.state.results.muscleGroups.forearms|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.forearms}" ng-mouseenter="mainCtrl.hovering.forearms=true" ng-mouseleave="mainCtrl.hovering.forearms=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'forearms\')}}" data-html="true" data-container="#canvas-container" d="M 277.00,276.00 L 284.50,268.12 293.12,273.75 298.75,260.00 306.18,247.87 310.38,232.00 312.00,243.75 314.12,259.43 316.38,264.38 318.79,295.55 319.88,358.88 311.64,356.17 300.50,355.12 297.75,357.25 282.23,315.03 278.12,295.62 277.00,276.00 Z" /></path>\n<path class="forearms {{mainCtrl.state.results.muscleGroups.forearms|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.forearms}" ng-mouseenter="mainCtrl.hovering.forearms=true" ng-mouseleave="mainCtrl.hovering.forearms=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'forearms\')}}" data-html="true" data-container="#canvas-container" d="M 106.75,252.62 L 101.88,262.38 98.88,271.25 93.75,285.12 92.88,295.88 90.25,311.88 82.00,355.14 88.88,355.50 102.25,360.62 113.88,341.50 126.88,320.00 134.50,303.12 138.88,288.12 138.88,270.62 127.12,265.00 111.25,277.92 106.87,266.25 106.75,252.62 Z" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 143.50,550.00 L 149.00,583.00 151.75,601.50 154.00,624.25 156.50,641.75 164.50,690.00 148.00,693.75 145.50,642.25 141.00,613.75 138.50,582.25 143.50,550.00 Z" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 181.50,559.50 L 176.75,568.75 169.50,578.50 166.50,587.25 164.75,601.75 165.75,623.25 167.75,650.50 174.25,673.50 177.50,649.00 178.75,625.00 184.00,613.75 186.50,603.75 185.50,583.75 181.50,559.50 Z" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 227.75,564.75 L 237.00,580.75 240.50,591.50 242.00,618.75 241.75,646.25 241.75,655.75 238.25,665.00 234.75,646.25 233.50,623.50 226.50,605.25 226.50,583.50 227.75,564.75 Z" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 260.25,545.75 L 257.00,579.00 254.25,594.50 254.00,621.75 250.75,633.25 250.50,648.75 244.25,688.75 259.25,692.50 264.00,690.00 267.75,620.00 270.75,594.50 269.75,568.50 266.75,552.25 260.25,545.75 Z" /></path>\n<path class="triceps {{mainCtrl.state.results.muscleGroups.triceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.triceps}" ng-mouseenter="mainCtrl.hovering.triceps=true" ng-mouseleave="mainCtrl.hovering.triceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'triceps\')}}" data-html="true" data-container="#canvas-container" d="M 138.88,270.12 L 143.25,260.12 140.88,234.12" /></path>\n<path class="hip-flexors {{mainCtrl.state.results.muscleGroups.hipFlexors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipFlexors}" ng-mouseenter="mainCtrl.hovering.hipFlexors=true" ng-mouseleave="mainCtrl.hovering.hipFlexors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipFlexors\')}}" data-html="true" data-container="#canvas-container" d="M 219.50,370.25 L 226.50,355.75 225.75,348.00 229.00,342.25 254.50,330.50 265.00,364.75 269.00,388.50 272.75,406.50 274.25,422.00 266.50,406.75 244.00,371.00 239.00,345.75 236.25,381.75 230.00,426.00 225.50,449.50 222.75,512.25 227.75,525.00 231.00,546.25 237.00,558.75 243.75,566.50 239.00,575.75 228.00,560.75 227.75,555.50 224.00,545.25 222.75,528.25 219.50,519.75 218.25,451.25 219.50,430.75 223.00,417.25 223.25,403.00 218.00,387.25 219.50,370.25 Z" /></path>\n<path class="hip-flexors {{mainCtrl.state.results.muscleGroups.hipFlexors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipFlexors}" ng-mouseenter="mainCtrl.hovering.hipFlexors=true" ng-mouseleave="mainCtrl.hovering.hipFlexors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipFlexors\')}}" data-html="true" data-container="#canvas-container" d="M 129.00,408.50 L 133.50,399.25 143.50,382.50 149.50,369.50 154.75,351.00 155.75,345.00 156.25,376.00 162.75,420.75 172.75,457.00 173.50,470.00 177.25,497.75 178.25,515.75 174.75,524.50 171.00,548.25 160.50,563.25 165.50,576.00 178.50,561.75 182.75,537.50 183.25,529.25 181.75,475.25 180.25,455.50 171.00,407.00 176.50,387.75 175.50,374.50 166.50,355.75 166.00,346.25 161.75,341.50 143.75,330.50 140.50,342.00 138.75,355.50 134.00,378.25 129.00,408.50 Z" /></path>\n<path class="hip-adductors {{mainCtrl.state.results.muscleGroups.hipAdductors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipAdductors}" ng-mouseenter="mainCtrl.hovering.hipAdductors=true" ng-mouseleave="mainCtrl.hovering.hipAdductors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipAdductors\')}}" data-html="true" data-container="#canvas-container" d="M 204.00,400.00 L 210.50,387.75 219.75,371.00 217.75,387.25 223.00,403.00 222.75,417.25 219.75,431.50 218.00,454.25 219.50,519.50 217.00,506.75 215.50,495.50 212.25,477.00 208.75,461.75 206.50,432.75 206.00,421.50 207.00,409.50 204.00,400.00 Z" /></path>\n<path class="hip-adductors {{mainCtrl.state.results.muscleGroups.hipAdductors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipAdductors}" ng-mouseenter="mainCtrl.hovering.hipAdductors=true" ng-mouseleave="mainCtrl.hovering.hipAdductors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipAdductors\')}}" data-html="true" data-container="#canvas-container" d="M 198.00,402.25 L 195.00,406.00 195.00,420.25 196.75,436.00 195.75,460.25 191.00,488.00 188.25,509.75 183.50,530.25 181.50,471.00 180.00,454.00 174.25,424.75 171.00,406.50 176.75,387.00 175.50,374.75 186.25,391.00 198.00,402.25 Z" /></path>\n<path class="biceps {{mainCtrl.state.results.muscleGroups.biceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.biceps}" ng-mouseenter="mainCtrl.hovering.biceps=true" ng-mouseleave="mainCtrl.hovering.biceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'biceps\')}}" data-html="true" data-container="#canvas-container" d="M 134.75,179.75 L 126.51,188.06 119.70,203.99 116.25,212.50 111.62,224.88 109.25,234.50 107.25,242.62 107.25,253.62 107.25,266.00 111.65,277.68 119.88,271.12 127.01,265.24 138.78,270.53 139.42,262.97 140.62,235.88 139.62,211.12 133.50,193.00 134.75,179.75 Z" /></path>\n<path class="glutes {{mainCtrl.state.results.muscleGroups.glutes|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.glutes}" ng-mouseenter="mainCtrl.hovering.glutes=true" ng-mouseleave="mainCtrl.hovering.glutes=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'glutes\')}}" data-html="true" data-container="#canvas-container" d="M 143.75,331.00 L 140.50,342.75 138.50,356.75 138.75,337.25 141.00,329.75 143.75,331.00 Z" /></path>\n<path class="glutes {{mainCtrl.state.results.muscleGroups.glutes|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.glutes}" ng-mouseenter="mainCtrl.hovering.glutes=true" ng-mouseleave="mainCtrl.hovering.glutes=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'glutes\')}}" data-html="true" data-container="#canvas-container" d="M 255.25,330.50 L 259.50,325.50 263.25,336.00 264.50,362.50 255.25,330.50 Z" /></path>\n<path class="upper-traps {{mainCtrl.state.results.muscleGroups.upperTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperTraps}" ng-mouseenter="mainCtrl.hovering.upperTraps=true" ng-mouseleave="mainCtrl.hovering.upperTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperTraps\')}}" data-html="true" data-container="#canvas-container" d="M 520.75,74.50 L 526.75,74.50 527.88,80.50 527.25,91.50 525.00,100.00 520.75,106.25 519.88,113.62 504.50,119.50 488.75,126.00 473.88,131.00 468.62,126.00 480.12,122.00 493.00,116.25 502.12,109.62 513.00,101.75 519.00,91.62 520.38,81.38 520.75,74.50 Z" /></path>\n<path class="upper-traps {{mainCtrl.state.results.muscleGroups.upperTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperTraps}" ng-mouseenter="mainCtrl.hovering.upperTraps=true" ng-mouseleave="mainCtrl.hovering.upperTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperTraps\')}}" data-html="true" data-container="#canvas-container" d="M 536.12,90.38 L 537.38,83.50 539.62,77.88 544.25,78.00 544.38,86.00 543.88,92.12 547.25,100.00 551.38,108.00 559.62,114.62 571.25,120.88 581.00,126.12 589.50,128.75 585.38,133.75 580.25,132.75 571.50,128.75 563.38,123.88 552.50,119.38 543.12,116.00 540.62,107.25 536.12,95.00" /></path>\n<path class="quads {{mainCtrl.state.results.muscleGroups.quads|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.quads}" ng-mouseenter="mainCtrl.hovering.quads=true" ng-mouseleave="mainCtrl.hovering.quads=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'quads\')}}" data-html="true" data-container="#canvas-container" d="M 239.00,348.00 L 243.75,370.75 252.50,385.25 266.75,407.50 274.50,423.25 278.50,445.00 277.25,477.50 273.25,496.50 268.25,506.75 266.00,525.25 262.50,531.75 257.00,518.75 255.25,503.75 243.50,502.75 243.25,515.25 241.00,526.50 235.75,529.75 228.00,525.25 223.25,512.75 223.25,493.75 225.00,454.75 230.25,425.75 236.25,383.00 239.00,348.00 Z" /></path>\n<path class="middle-traps {{mainCtrl.state.results.muscleGroups.middleTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.middleTraps}" ng-mouseenter="mainCtrl.hovering.middleTraps=true" ng-mouseleave="mainCtrl.hovering.middleTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'middleTraps\')}}" data-html="true" data-container="#canvas-container" d="M 542.88,115.88 L 549.62,151.38 585.12,133.75 580.38,132.88 571.38,128.75 563.62,124.00 552.38,119.38 542.88,115.88 Z" /></path>\n<path class="middle-traps {{mainCtrl.state.results.muscleGroups.middleTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.middleTraps}" ng-mouseenter="mainCtrl.hovering.middleTraps=true" ng-mouseleave="mainCtrl.hovering.middleTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'middleTraps\')}}" data-html="true" data-container="#canvas-container" d="M 474.00,130.88 L 488.62,126.00 504.88,119.50 519.75,113.62 521.75,128.25 525.00,141.50 527.12,148.75 481.25,134.12 474.00,130.88 Z" /></path>\n<path class="forearms {{mainCtrl.state.results.muscleGroups.forearms|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.forearms}" ng-mouseenter="mainCtrl.hovering.forearms=true" ng-mouseleave="mainCtrl.hovering.forearms=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'forearms\')}}" data-html="true" data-container="#canvas-container" d="M 622.62,279.62 L 622.12,273.50 625.00,270.12 631.62,262.12 633.88,257.88 637.25,273.25 638.00,294.88 637.50,328.12 637.25,359.88 619.75,359.50 615.00,358.00 607.50,335.62 602.38,320.12 598.38,302.50 596.75,290.00 596.88,254.62 619.38,280.38 622.62,279.62 Z" /></path>\n<path class="forearms {{mainCtrl.state.results.muscleGroups.forearms|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.forearms}" ng-mouseenter="mainCtrl.hovering.forearms=true" ng-mouseleave="mainCtrl.hovering.forearms=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'forearms\')}}" data-html="true" data-container="#canvas-container" d="M 414.50,248.00 L 407.50,263.38 402.88,277.62 400.25,294.12 398.88,308.62 396.25,327.25 393.88,342.00 391.62,353.75 390.50,361.75 395.25,363.25 411.00,363.50 437.38,320.38 446.50,298.50 450.62,279.25 450.50,270.12 441.25,284.50 426.50,273.50 417.38,258.00 414.50,248.00 Z" /></path>\n<path class="quads {{mainCtrl.state.results.muscleGroups.quads|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.quads}" ng-mouseenter="mainCtrl.hovering.quads=true" ng-mouseleave="mainCtrl.hovering.quads=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'quads\')}}" data-html="true" data-container="#canvas-container" d="M 155.75,347.25 L 149.75,369.50 141.50,386.50 133.50,400.00 128.75,411.00 123.75,435.75 122.00,457.50 125.25,485.75 132.00,501.75 136.75,510.25 139.50,526.00 143.50,515.75 143.50,505.75 141.00,500.50 152.00,500.50 155.00,512.00 158.00,523.75 162.75,529.75 168.25,529.75 174.75,525.00 178.25,516.25 177.00,497.00 173.25,469.00 172.75,458.25 163.00,421.00 156.25,377.00 155.75,347.25 Z" /></path>\n<path class="side-delts {{mainCtrl.state.results.muscleGroups.sideDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.sideDelts}" ng-mouseenter="mainCtrl.hovering.sideDelts=true" ng-mouseleave="mainCtrl.hovering.sideDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'sideDelts\')}}" data-html="true" data-container="#canvas-container" d="M 287.50,202.88 L 294.38,215.12 301.00,193.25 304.25,173.88 303.29,164.25 300.75,156.75 296.25,149.75 288.38,143.50 281.26,140.00 270.50,136.50 265.88,136.50 261.88,140.00 268.62,140.12 279.25,145.88 286.38,151.38 290.62,164.12 292.00,177.75 287.50,202.88 Z" /></path>\n<path class="front-delts {{mainCtrl.state.results.muscleGroups.frontDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.frontDelts}" ng-mouseenter="mainCtrl.hovering.frontDelts=true" ng-mouseleave="mainCtrl.hovering.frontDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'frontDelts\')}}" data-html="true" data-container="#canvas-container" d="M 225.50,145.62 L 254.75,142.25 262.12,140.38 268.88,140.38 279.25,145.88 286.30,151.60 290.38,164.00 291.88,177.75 287.62,203.12 269.12,178.75 267.88,169.88 245.00,148.00 225.50,145.62 Z" /></path>\n<path class="upper-chest {{mainCtrl.state.results.muscleGroups.upperChest|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperChest}" ng-mouseenter="mainCtrl.hovering.upperChest=true" ng-mouseleave="mainCtrl.hovering.upperChest=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperChest\')}}" data-html="true" data-container="#canvas-container" d="M 203.12,149.88 L 225.25,145.62 245.38,148.25 267.75,169.88 269.00,178.75 242.88,159.25 225.50,156.62 203.12,149.88 Z" /></path>\n<path class="rear-delts {{mainCtrl.state.results.muscleGroups.rearDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.rearDelts}" ng-mouseenter="mainCtrl.hovering.rearDelts=true" ng-mouseleave="mainCtrl.hovering.rearDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'rearDelts\')}}" data-html="true" data-container="#canvas-container" d="M 423.25,186.38 L 428.25,168.12 434.25,155.88 445.38,146.38 463.75,136.88 472.75,149.00 461.25,152.50 452.38,156.88 445.38,163.75 442.75,173.88 437.00,180.25 427.88,192.38 426.25,197.00 423.25,186.38 Z" /></path>\n<path class="side-delts {{mainCtrl.state.results.muscleGroups.sideDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.sideDelts}" ng-mouseenter="mainCtrl.hovering.sideDelts=true" ng-mouseleave="mainCtrl.hovering.sideDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'sideDelts\')}}" data-html="true" data-container="#canvas-container" d="M 455.12,128.88 L 444.25,133.62 437.38,137.75 431.25,145.00 425.62,154.12 422.38,162.62 421.88,171.88 423.25,186.25 428.00,168.62 434.38,155.88 445.75,146.12 456.00,141.00 463.75,136.88 455.12,128.88 Z" /></path>\n<path class="lats-and-teres-major {{mainCtrl.state.results.muscleGroups.latsAndTeresMajor|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.latsAndTeresMajor}" ng-mouseenter="mainCtrl.hovering.latsAndTeresMajor=true" ng-mouseleave="mainCtrl.hovering.latsAndTeresMajor=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'latsAndTeresMajor\')}}" data-html="true" data-container="#canvas-container" d="M 592.38,198.25 L 598.38,187.12 602.25,172.25 603.00,168.38 606.88,166.38 612.50,167.12 619.75,173.88 605.25,176.38 602.88,197.62 599.50,206.38 599.88,213.88 596.38,226.00 591.88,236.25 588.25,242.25 586.62,248.00 576.50,267.75 574.75,278.12 574.25,284.25 572.25,297.25 565.75,309.38 563.62,315.00 562.62,323.38 556.25,320.88 553.12,313.25 555.25,304.38 557.00,295.88 555.00,285.50 552.50,277.25 547.50,270.25 542.12,264.88 543.50,253.75 549.12,243.00 556.75,230.00 565.50,210.25 567.62,207.12 577.75,207.62" /></path>\n<path class="lats-and-teres-major {{mainCtrl.state.results.muscleGroups.latsAndTeresMajor|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.latsAndTeresMajor}" ng-mouseenter="mainCtrl.hovering.latsAndTeresMajor=true" ng-mouseleave="mainCtrl.hovering.latsAndTeresMajor=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'latsAndTeresMajor\')}}" data-html="true" data-container="#canvas-container" d="M 477.12,194.88 L 482.38,201.00 496.50,207.75 507.50,207.50 509.62,214.88 512.00,223.00 516.50,235.88 519.50,243.75 521.12,253.88 521.12,263.38 513.62,270.25 503.25,281.00 494.88,288.62 489.75,299.25 491.62,312.00 492.62,318.25 488.75,321.12 479.88,323.75 481.00,320.62 479.75,314.75 471.88,298.62 467.00,285.00 461.50,266.88 460.38,257.88 456.88,246.50 462.25,231.25 464.00,206.62 462.88,197.75 459.62,188.25 458.50,174.12 449.38,171.88 443.75,173.38 451.62,166.50 460.00,165.62 464.12,169.25 471.75,181.38" /></path>\n<path class="triceps {{mainCtrl.state.results.muscleGroups.triceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.triceps}" ng-mouseenter="mainCtrl.hovering.triceps=true" ng-mouseleave="mainCtrl.hovering.triceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'triceps\')}}" data-html="true" data-container="#canvas-container" d="M 414.50,247.75 L 417.88,224.38 421.75,210.25 425.88,202.00 426.12,196.88 427.88,192.25 437.00,180.12 442.75,173.75 449.38,172.25 458.38,174.12 459.75,188.50 463.00,197.88 463.88,206.12 462.00,222.38 462.00,230.88 458.00,243.12 455.38,249.88 452.50,259.00 450.12,264.00 450.38,270.12 441.25,284.12 426.50,273.62 417.62,258.62 414.50,247.75 Z" /></path>\n<path class="triceps {{mainCtrl.state.results.muscleGroups.triceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.triceps}" ng-mouseenter="mainCtrl.hovering.triceps=true" ng-mouseleave="mainCtrl.hovering.triceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'triceps\')}}" data-html="true" data-container="#canvas-container" d="M 592.00,236.50 L 596.50,226.00 599.75,214.00 599.50,206.88 602.88,198.00 605.38,176.38 615.62,174.88 619.75,174.12 623.25,185.50 623.38,189.62 626.38,197.62 631.25,210.25 631.50,217.88 632.38,235.88 633.50,241.50 633.88,257.75 631.50,262.00 622.12,273.38 622.50,279.50 619.62,280.25 596.00,253.38 593.25,244.25 592.00,236.50 Z" /></path>\n<path class="rear-delts {{mainCtrl.state.results.muscleGroups.rearDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.rearDelts}" ng-mouseenter="mainCtrl.hovering.rearDelts=true" ng-mouseleave="mainCtrl.hovering.rearDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'rearDelts\')}}" data-html="true" data-container="#canvas-container" d="M 601.38,140.62 L 607.25,143.12 614.88,149.12 620.88,158.25 626.50,174.25 623.38,185.25 620.12,174.62 619.75,171.62 616.25,164.75 610.25,157.88 599.38,150.50 601.38,140.62 Z" /></path>\n<path class="side-delts {{mainCtrl.state.results.muscleGroups.sideDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.sideDelts}" ng-mouseenter="mainCtrl.hovering.sideDelts=true" ng-mouseleave="mainCtrl.hovering.sideDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'sideDelts\')}}" data-html="true" data-container="#canvas-container" d="M 603.25,133.88 L 613.25,138.50 620.00,145.38 624.62,153.00 626.12,160.75 626.38,174.62 621.00,158.12 615.25,149.50 607.00,143.00 601.38,140.62 603.25,133.88 Z" /></path>\n<path class="rotator-cuff {{mainCtrl.state.results.muscleGroups.rotatorCuff|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.rotatorCuff}" ng-mouseenter="mainCtrl.hovering.rotatorCuff=true" ng-mouseleave="mainCtrl.hovering.rotatorCuff=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'rotatorCuff\')}}" data-html="true" data-container="#canvas-container" d="M 567.25,207.00 L 571.50,198.50 571.62,183.88 576.00,167.88 576.62,152.62 579.25,150.00 581.75,153.25 599.88,154.25 610.25,157.75 616.38,165.12 619.75,171.50 620.00,174.25 612.50,166.88 606.88,166.25 603.12,168.38 600.88,176.62 596.88,190.00 592.38,198.62 585.88,203.62 577.75,207.75 573.00,207.50 567.25,207.00 Z" /></path>\n<path class="rotator-cuff {{mainCtrl.state.results.muscleGroups.rotatorCuff|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.rotatorCuff}" ng-mouseenter="mainCtrl.hovering.rotatorCuff=true" ng-mouseleave="mainCtrl.hovering.rotatorCuff=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'rotatorCuff\')}}" data-html="true" data-container="#canvas-container" d="M 443.00,173.75 L 445.50,164.00 452.50,157.00 461.50,152.75 489.75,152.25 494.50,149.75 499.00,154.00 504.75,180.75 506.25,202.00 507.62,207.38 496.50,207.75 482.62,201.25 477.38,194.88 471.88,181.25 463.88,169.00 460.00,165.62 451.62,166.50 443.00,173.75 Z" /></path>\n<path class="quads {{mainCtrl.state.results.muscleGroups.quads|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.quads}" ng-mouseenter="mainCtrl.hovering.quads=true" ng-mouseleave="mainCtrl.hovering.quads=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'quads\')}}" data-html="true" data-container="#canvas-container" d="M 455.50,397.00 L 451.50,418.50 445.75,439.25 445.75,460.00 448.25,479.00 450.75,498.00 452.25,520.75 453.75,502.50 456.00,468.25 457.50,447.00 459.00,427.25 460.00,413.25 455.50,397.00 Z" /></path>\n<path class="glutes {{mainCtrl.state.results.muscleGroups.glutes|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.glutes}" ng-mouseenter="mainCtrl.hovering.glutes=true" ng-mouseleave="mainCtrl.hovering.glutes=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'glutes\')}}" data-html="true" data-container="#canvas-container" d="M 465.00,323.50 L 473.75,325.25 481.75,329.50 493.25,339.25 502.00,346.75 508.00,354.00 515.00,363.00 527.50,363.25 535.50,351.25 543.50,343.25 566.25,325.25 573.50,323.00 575.50,337.00 576.50,351.50 575.25,368.25 576.25,381.00 576.25,398.25 571.00,407.75 561.50,414.50 553.50,416.25 540.50,415.25 524.00,408.00 521.00,402.25 517.00,402.25 510.00,410.25 499.75,416.00 486.00,417.00 479.25,412.75 468.50,407.50 465.25,398.25 462.50,387.00 465.25,367.75 464.25,341.25 465.00,323.50 Z" /></path>\n<path class="hip-adductors {{mainCtrl.state.results.muscleGroups.hipAdductors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipAdductors}" ng-mouseenter="mainCtrl.hovering.hipAdductors=true" ng-mouseleave="mainCtrl.hovering.hipAdductors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipAdductors\')}}" data-html="true" data-container="#canvas-container" d="M 553.75,416.50 L 540.00,415.25 523.75,408.00 522.50,434.25 525.75,466.75 530.75,496.50 538.25,528.75 542.50,536.25 540.50,518.25 539.25,485.75 541.25,472.25 546.00,456.25 547.75,434.75 553.75,416.50 Z" /></path>\n<path class="hip-adductors {{mainCtrl.state.results.muscleGroups.hipAdductors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipAdductors}" ng-mouseenter="mainCtrl.hovering.hipAdductors=true" ng-mouseleave="mainCtrl.hovering.hipAdductors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipAdductors\')}}" data-html="true" data-container="#canvas-container" d="M 490.00,416.50 L 499.75,416.25 510.25,410.50 511.75,425.50 512.50,451.00 509.25,475.25 505.50,491.50 504.75,504.50 499.50,529.75 499.75,478.75 494.75,462.75 490.00,416.50 Z" /></path>\n<path class="hamstrings {{mainCtrl.state.results.muscleGroups.hamstrings|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hamstrings}" ng-mouseenter="mainCtrl.hovering.hamstrings=true" ng-mouseleave="mainCtrl.hovering.hamstrings=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hamstrings\')}}" data-html="true" data-container="#canvas-container" d="M 580.00,434.75 L 575.25,424.25 570.00,417.50 553.50,417.00 548.25,435.00 546.25,455.25 541.25,472.50 539.25,486.25 541.50,527.50 542.75,534.75 542.25,552.75 543.25,561.25 550.50,548.75 558.00,541.00 562.50,549.50 570.00,543.75 574.25,534.50 582.50,550.00 584.50,512.25 581.50,482.25 582.50,461.50 580.00,434.75 Z" /></path>\n<path class="hamstrings {{mainCtrl.state.results.muscleGroups.hamstrings|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hamstrings}" ng-mouseenter="mainCtrl.hovering.hamstrings=true" ng-mouseleave="mainCtrl.hovering.hamstrings=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hamstrings\')}}" data-html="true" data-container="#canvas-container" d="M 458.25,436.75 L 464.25,426.00 470.50,418.25 489.50,416.75 494.75,463.25 499.50,478.50 499.25,527.25 497.25,542.25 495.75,552.25 493.50,559.00 487.50,547.50 480.25,539.75 477.75,544.75 477.50,550.50 469.75,545.00 463.25,534.50 458.50,546.25 453.25,552.25 452.50,520.50 455.25,483.50 458.25,436.75 Z" /></path>\n<path class="quads {{mainCtrl.state.results.muscleGroups.quads|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.quads}" ng-mouseenter="mainCtrl.hovering.quads=true" ng-mouseleave="mainCtrl.hovering.quads=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'quads\')}}" data-html="true" data-container="#canvas-container" d="M 582.75,394.75 L 586.00,417.75 590.50,432.75 591.50,456.50 589.25,474.75 587.50,493.75 584.25,512.25 582.25,484.75 582.50,460.50 580.50,435.50 580.50,409.25 582.75,394.75 Z" /></path>\n<path class="serratus-and-obliques {{mainCtrl.state.results.muscleGroups.serratusAndObliques|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.serratusAndObliques}" ng-mouseenter="mainCtrl.hovering.serratusAndObliques=true" ng-mouseleave="mainCtrl.hovering.serratusAndObliques=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'serratusAndObliques\')}}" data-html="true" data-container="#canvas-container" d="M 562.75,323.62 L 563.25,316.38 565.25,310.38 572.12,298.00 574.38,284.50 576.00,294.38 577.50,300.62 577.12,309.62 575.25,319.12 562.75,323.62 Z" /></path>\n<path class="serratus-and-obliques {{mainCtrl.state.results.muscleGroups.serratusAndObliques|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.serratusAndObliques}" ng-mouseenter="mainCtrl.hovering.serratusAndObliques=true" ng-mouseleave="mainCtrl.hovering.serratusAndObliques=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'serratusAndObliques\')}}" data-html="true" data-container="#canvas-container" d="M 461.62,267.75 L 466.75,285.00 472.25,299.50 479.75,314.50 481.00,320.50 479.75,324.25 469.50,320.50 460.75,319.50 458.38,311.25 458.38,295.38 460.88,286.75 461.62,267.75 Z" /></path>\n<path class="lower-chest {{mainCtrl.state.results.muscleGroups.lowerChest|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.lowerChest}" ng-mouseenter="mainCtrl.hovering.lowerChest=true" ng-mouseleave="mainCtrl.hovering.lowerChest=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'lowerChest\')}}" data-html="true" data-container="#canvas-container" d="M 203.12,149.75 L 225.00,156.50 242.62,159.25 260.88,173.00 260.88,188.75 259.50,193.00 252.75,204.25 242.52,214.27 222.62,218.00 215.12,218.00 197.38,212.38 191.40,209.24 187.44,200.14 188.75,183.25 195.00,162.38 203.12,149.75 Z" /></path>\n<path class="lower-chest {{mainCtrl.state.results.muscleGroups.lowerChest|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.lowerChest}" ng-mouseenter="mainCtrl.hovering.lowerChest=true" ng-mouseleave="mainCtrl.hovering.lowerChest=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'lowerChest\')}}" data-html="true" data-container="#canvas-container" d="M 135.50,170.12 L 144.62,163.25 182.25,150.88 183.62,152.62 183.62,184.00 181.38,199.25 175.25,209.75 170.62,213.25 158.25,219.75 152.62,220.75 148.12,220.75 143.62,217.62 139.50,211.12 133.75,193.25 135.50,170.12 Z" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 543.50,563.00 L 550.50,548.88 558.38,541.00 562.62,550.38 570.38,543.38 574.88,534.75 582.75,550.88 584.75,568.25 587.12,586.00 587.88,607.88 584.75,632.25 581.50,668.62 580.50,694.88 580.38,707.00 570.12,716.38 563.00,727.12 559.12,729.38 551.62,728.38 552.88,684.00 549.75,663.75 548.00,641.38 541.38,623.75 540.50,597.00 543.50,563.00 Z" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 480.62,540.00 L 477.88,546.12 477.50,550.75 470.00,544.88 463.12,534.75 458.62,544.75 453.62,552.50 451.88,574.88 450.12,593.00 451.25,605.75 454.38,644.50 456.38,668.12 458.25,693.88 458.00,699.25 466.25,710.88 473.38,720.12 482.12,726.88 487.50,727.12 486.50,711.50 485.12,695.00 488.62,662.62 490.88,640.88 498.50,621.88 497.12,588.62 494.25,569.12 492.88,558.50 487.25,548.25 480.62,540.00 Z" /></path>\n<path class="abdominals {{mainCtrl.state.results.muscleGroups.abdominals|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.abdominals}" ng-mouseenter="mainCtrl.hovering.abdominals=true" ng-mouseleave="mainCtrl.hovering.abdominals=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'abdominals\')}}" data-html="true" data-container="#canvas-container" d="M 158.25,219.88 L 170.53,213.18 196.25,212.12 214.75,218.00 219.38,232.50 219.38,249.88 219.38,255.50 221.38,265.39 224.62,277.25 224.62,293.12 223.62,313.25 222.62,320.88 217.38,331.38 217.38,349.25 205.50,389.38 191.51,389.09 186.37,383.28 175.75,358.50 173.50,346.53 173.50,333.25 162.88,315.88 161.62,301.25 158.62,292.25 156.62,257.00 153.34,248.61 153.04,234.89 158.25,219.88 Z" /></path>\n<path class="spinal-erectors {{mainCtrl.state.results.muscleGroups.spinalErectors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.spinalErectors}" ng-mouseenter="mainCtrl.hovering.spinalErectors=true" ng-mouseleave="mainCtrl.hovering.spinalErectors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'spinalErectors\')}}" data-html="true" data-container="#canvas-container" d="M 491.25,331.88 L 492.50,318.25 489.62,299.12 494.75,288.75 504.25,280.12 513.88,270.12 521.00,263.50 523.62,263.50 526.25,239.25 529.50,219.00 533.88,186.50 531.38,158.88 527.38,148.62 523.75,134.75 521.62,128.00 520.12,114.00 520.88,106.38 525.12,99.88 531.75,96.25 539.12,102.88 542.88,115.25 549.38,151.12 545.25,180.50 545.00,207.00 540.75,233.38 538.62,265.88 542.12,265.25 548.50,270.88 552.50,277.50 557.00,296.50 553.00,313.38 556.38,321.38 562.75,323.38 542.75,340.50 532.88,346.50 528.50,355.25 526.12,360.62 517.25,360.50 510.62,350.38 508.62,343.38 491.25,331.88 Z" /></path>\n<path class="upper-traps {{mainCtrl.state.results.muscleGroups.upperTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperTraps}" ng-mouseenter="mainCtrl.hovering.upperTraps=true" ng-mouseleave="mainCtrl.hovering.upperTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperTraps\')}}" data-html="true" data-container="#canvas-container" d="M 226.75,110.12 L 221.25,121.62 232.50,141.88 244.12,141.88 257.88,134.38 247.59,130.50 240.00,126.25 234.62,122.62 229.88,117.00 226.75,110.12 Z" /></path>\n<path class="serratus-and-obliques {{mainCtrl.state.results.muscleGroups.serratusAndObliques|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.serratusAndObliques}" ng-mouseenter="mainCtrl.hovering.serratusAndObliques=true" ng-mouseleave="mainCtrl.hovering.serratusAndObliques=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'serratusAndObliques\')}}" data-html="true" data-container="#canvas-container" d="M 139.75,211.25 L 143.57,217.66 147.88,220.62 153.25,220.74 149.49,225.62 151.88,227.50 150.88,235.50 150.88,239.88 147.25,241.75 149.94,244.44 151.00,250.62 152.00,258.62 148.62,259.88 152.00,261.88 152.88,265.62 154.12,280.38 151.25,281.38 154.45,287.53 154.45,291.50 157.00,297.38 152.00,302.38 159.27,309.37 160.50,321.50 165.62,332.88 168.25,338.50 161.62,338.75 150.95,332.57 142.62,326.34 144.88,321.38 142.38,312.25 141.81,296.14 145.37,282.99 145.00,269.18 143.38,259.88 140.62,234.00 139.75,211.25 Z" /></path>\n<path class="serratus-and-obliques {{mainCtrl.state.results.muscleGroups.serratusAndObliques|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.serratusAndObliques}" ng-mouseenter="mainCtrl.hovering.serratusAndObliques=true" ng-mouseleave="mainCtrl.hovering.serratusAndObliques=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'serratusAndObliques\')}}" data-html="true" data-container="#canvas-container" d="M 269.12,178.62 L 261.00,173.00 261.12,188.92 259.75,193.00 252.38,204.50 242.75,214.25 221.25,218.50 224.89,222.12 222.38,225.00 222.38,233.12 224.38,237.25 227.25,238.38 224.38,241.75 224.38,256.62 229.50,259.12 226.12,261.38 227.25,269.88 228.75,278.38 233.38,279.62 231.75,285.00 228.75,287.62 229.75,299.25 237.12,300.38 228.62,306.00 226.62,320.38 222.62,332.75 222.62,344.25 223.88,347.25 226.50,340.38 233.75,336.25 251.75,329.50 257.38,322.38 258.50,310.50 258.50,299.25 256.00,288.88 256.88,272.81 255.64,255.69 257.88,247.00 260.38,206.00 262.50,199.88 263.25,192.50 268.12,185.62 269.12,178.62 Z" /></path>\n<path class="lats-and-teres-major {{mainCtrl.state.results.muscleGroups.latsAndTeresMajor|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.latsAndTeresMajor}" ng-mouseenter="mainCtrl.hovering.latsAndTeresMajor=true" ng-mouseleave="mainCtrl.hovering.latsAndTeresMajor=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'latsAndTeresMajor\')}}" data-html="true" data-container="#canvas-container" d="M 268.12,186.00 L 263.68,192.42 262.52,199.63 260.62,206.12 258.88,231.12 257.88,246.75 255.88,255.88 256.88,272.50 266.62,250.41 270.16,240.69 272.38,238.00 268.25,219.40 268.12,186.00 Z" /></path>\n<path class="upper-traps {{mainCtrl.state.results.muscleGroups.upperTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperTraps}" ng-mouseenter="mainCtrl.hovering.upperTraps=true" ng-mouseleave="mainCtrl.hovering.upperTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperTraps\')}}" data-html="true" data-container="#canvas-container" d="M 150.31,140.70 L 153.88,144.34 158.00,145.38 175.12,145.25 177.88,142.50 178.82,128.75 164.62,136.88 158.76,139.77 150.31,140.70 Z" /></path>\n<path class="side-delts {{mainCtrl.state.results.muscleGroups.sideDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.sideDelts}" ng-mouseenter="mainCtrl.hovering.sideDelts=true" ng-mouseleave="mainCtrl.hovering.sideDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'sideDelts\')}}" data-html="true" data-container="#canvas-container" d="M 143.62,145.12 L 135.88,145.00 130.12,148.25 125.00,152.00 119.25,159.00 115.00,165.88 112.38,175.62 112.38,185.88 113.38,194.25 115.38,203.25 116.64,211.44 119.50,204.91 116.88,189.36 116.88,175.75 118.25,166.62 122.32,159.62 127.12,153.62 134.50,148.75 143.62,145.12 Z" /></path>\n<path class="front-delts {{mainCtrl.state.results.muscleGroups.frontDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.frontDelts}" ng-mouseenter="mainCtrl.hovering.frontDelts=true" ng-mouseleave="mainCtrl.hovering.frontDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'frontDelts\')}}" data-html="true" data-container="#canvas-container" d="M 155.62,148.00 L 143.50,145.12 134.50,148.75 127.38,153.38 122.88,158.62 118.38,166.50 116.88,175.38 116.88,188.62 119.50,204.12 123.00,196.32 126.50,188.12 134.75,179.62 135.75,169.88 137.75,159.38 155.62,148.00 Z" /></path>\n<path class="biceps {{mainCtrl.state.results.muscleGroups.biceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.biceps}" ng-mouseenter="mainCtrl.hovering.biceps=true" ng-mouseleave="mainCtrl.hovering.biceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'biceps\')}}" data-html="true" data-container="#canvas-container" d="M 294.25,215.25 L 297.00,231.75 298.62,260.38 293.12,273.88 284.62,268.12 277.25,276.12 277.25,255.88 272.38,237.25 268.38,219.88 268.38,188.50 269.36,179.19 287.38,203.00 294.25,215.25 Z" /></path>\n<path class="triceps {{mainCtrl.state.results.muscleGroups.triceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.triceps}" ng-mouseenter="mainCtrl.hovering.triceps=true" ng-mouseleave="mainCtrl.hovering.triceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'triceps\')}}" data-html="true" data-container="#canvas-container" d="M 294.12,214.75 L 297.12,231.50 298.75,260.25 305.88,247.42 310.13,233.16 310.50,219.50 306.75,207.50 301.38,193.54 294.12,214.75 Z" /></path>\n<path class="lower-traps {{mainCtrl.state.results.muscleGroups.lowerTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.lowerTraps}" ng-mouseenter="mainCtrl.hovering.lowerTraps=true" ng-mouseleave="mainCtrl.hovering.lowerTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'lowerTraps\')}}" data-html="true" data-container="#canvas-container" d="M 527.38,148.88 L 501.75,141.00 509.62,147.12 511.25,154.12 509.38,170.50 508.12,191.00 506.25,201.50 511.00,219.88 516.50,235.75 519.50,243.75 521.38,254.00 521.12,263.38 523.62,263.50 526.00,240.12 530.38,213.12 533.62,186.25 530.88,158.50 527.38,148.88 Z" /></path>\n<path class="lower-traps {{mainCtrl.state.results.muscleGroups.lowerTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.lowerTraps}" ng-mouseenter="mainCtrl.hovering.lowerTraps=true" ng-mouseleave="mainCtrl.hovering.lowerTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'lowerTraps\')}}" data-html="true" data-container="#canvas-container" d="M 549.38,151.38 L 571.00,140.88 566.25,148.12 565.50,155.75 567.50,179.12 568.25,190.62 568.88,202.50 563.62,214.12 557.00,229.38 550.50,240.62 543.38,253.50 542.00,265.25 538.88,265.62 541.00,232.50 545.00,207.25 545.25,180.50 549.38,151.38 Z" /></path>\n<path class="upper-chest {{mainCtrl.state.results.muscleGroups.upperChest|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperChest}" ng-mouseenter="mainCtrl.hovering.upperChest=true" ng-mouseleave="mainCtrl.hovering.upperChest=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperChest\')}}" data-html="true" data-container="#canvas-container" d="M 155.62,148.50 L 175.25,148.00 182.38,150.88 145.12,163.00 135.50,169.88 137.62,159.62 155.62,148.50 Z" /></path>\n</svg>\n<svg ng-if="mainCtrl.state.sex === \'Female\'" id="muscle-figure-female" xmlns="http://www.w3.org/2000/svg" width="700" height="800" viewBox="0 0 700 800"><image width="700" height="800" xlink:href="/static/res/img/female-musculature.jpg"></image>\n<path class="upper-chest {{mainCtrl.state.results.muscleGroups.upperChest|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperChest}" ng-mouseenter="mainCtrl.hovering.upperChest=true" ng-mouseleave="mainCtrl.hovering.upperChest=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperChest\')}}" data-html="true" data-container="#canvas-container" d="M 468.62,167.75 L 470.25,163.00 476.88,160.25 484.75,160.38 493.00,160.12 502.12,160.62 510.12,162.62 515.25,165.00 517.00,168.62 514.75,168.38 511.38,167.62 504.62,167.12 494.25,167.00 480.88,167.38 468.62,167.75 Z" /></path>\n<path class="lower-chest {{mainCtrl.state.results.muscleGroups.lowerChest|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.lowerChest}" ng-mouseenter="mainCtrl.hovering.lowerChest=true" ng-mouseleave="mainCtrl.hovering.lowerChest=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'lowerChest\')}}" data-html="true" data-container="#canvas-container" d="M 513.38,189.88 L 503.62,189.25 491.25,188.25 482.12,189.62 475.12,192.50 469.88,198.75 466.25,205.12 465.75,213.25 466.12,219.50 462.62,209.62 461.88,193.12 463.88,184.25 465.62,177.25 468.50,167.75 478.00,167.75 491.38,167.25 501.25,167.25 510.38,167.88 516.62,168.75 515.50,181.00 513.38,189.88 Z" /></path>\n<path class="hip-adductors {{mainCtrl.state.results.muscleGroups.hipAdductors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipAdductors}" ng-mouseenter="mainCtrl.hovering.hipAdductors=true" ng-mouseleave="mainCtrl.hovering.hipAdductors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipAdductors\')}}" data-html="true" data-container="#canvas-container" d="M 507.25,344.75 L 504.50,345.00 502.25,342.12 496.25,349.88 485.88,365.75 476.88,385.00 469.00,398.12 467.25,402.75 467.88,408.62 470.62,428.75 481.25,464.00 483.25,443.62 483.12,431.50 500.75,374.88 507.25,344.75 Z" /></path>\n<path class="hip-adductors {{mainCtrl.state.results.muscleGroups.hipAdductors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipAdductors}" ng-mouseenter="mainCtrl.hovering.hipAdductors=true" ng-mouseleave="mainCtrl.hovering.hipAdductors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipAdductors\')}}" data-html="true" data-container="#canvas-container" d="M 414.25,346.00 L 418.38,344.12 427.00,356.50 439.00,380.88 452.25,402.50 450.62,419.38 446.38,441.50 442.75,458.50 440.62,440.75 437.50,426.75 427.75,407.12 417.00,368.00 414.25,346.00 Z" /></path>\n<path class="hip-flexors {{mainCtrl.state.results.muscleGroups.hipFlexors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipFlexors}" ng-mouseenter="mainCtrl.hovering.hipFlexors=true" ng-mouseleave="mainCtrl.hovering.hipFlexors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipFlexors\')}}" data-html="true" data-container="#canvas-container" d="M 442.38,458.38 L 440.38,440.38 437.50,427.00 427.75,406.75 422.62,388.75 416.88,367.75 414.00,346.12 410.75,342.00 406.25,339.38 401.62,334.88 396.88,349.38 394.12,362.38 390.38,377.12 387.50,391.38 387.25,403.50 387.50,423.50 389.12,431.75 391.25,406.75 395.88,392.38 408.00,363.50 413.88,394.50 434.38,452.25 437.62,468.62 439.12,497.62 442.38,458.38 Z" /></path>\n<path class="hip-flexors {{mainCtrl.state.results.muscleGroups.hipFlexors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipFlexors}" ng-mouseenter="mainCtrl.hovering.hipFlexors=true" ng-mouseleave="mainCtrl.hovering.hipFlexors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipFlexors\')}}" data-html="true" data-container="#canvas-container" d="M 481.38,466.38 L 483.00,443.50 483.12,431.38 488.50,413.38 494.62,394.38 501.12,375.12 502.75,365.38 507.50,344.62 513.50,337.88 517.75,334.88 521.50,348.00 525.75,363.88 530.12,380.12 532.75,393.12 534.38,406.38 534.88,424.25 533.75,414.25 532.50,408.25 530.38,397.12 516.75,374.75 511.00,367.88 509.38,376.88 505.75,395.62 499.62,411.88 494.25,428.00 490.88,441.25 488.62,453.75 487.50,460.25 487.00,488.12 486.50,504.50 483.38,478.25 481.38,466.38 Z" /></path>\n<path class="quads {{mainCtrl.state.results.muscleGroups.quads|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.quads}" ng-mouseenter="mainCtrl.hovering.quads=true" ng-mouseleave="mainCtrl.hovering.quads=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'quads\')}}" data-html="true" data-container="#canvas-container" d="M 491.25,542.75 L 488.25,521.50 486.50,503.12 487.12,484.38 487.25,461.38 490.50,442.38 492.75,433.62 499.12,413.38 505.75,396.00 509.38,376.88 510.75,367.88 516.75,374.62 525.38,389.12 530.38,397.62 533.50,414.00 534.12,423.50 533.75,440.38 533.62,468.75 532.25,548.00 527.38,543.12 521.50,532.50 519.00,524.88 518.50,511.62 520.25,504.88 517.25,508.50 514.75,511.38 510.12,511.62 506.62,510.12 502.12,508.00 502.75,513.75 504.62,524.12 504.62,542.00 500.88,546.88 495.75,546.25 491.25,542.75 Z" /></path>\n<path class="quads {{mainCtrl.state.results.muscleGroups.quads|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.quads}" ng-mouseenter="mainCtrl.hovering.quads=true" ng-mouseleave="mainCtrl.hovering.quads=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'quads\')}}" data-html="true" data-container="#canvas-container" d="M 396.00,546.38 L 396.50,527.38 393.25,489.25 390.75,457.88 389.38,431.62 391.62,406.88 396.00,392.62 407.88,364.00 409.88,373.25 413.38,393.50 421.38,416.88 431.12,443.38 434.38,452.38 437.62,468.88 438.12,483.50 438.88,507.75 436.88,527.00 434.88,538.12 430.38,544.62 427.38,545.50 424.25,541.62 424.25,520.50 427.12,503.00 423.00,509.00 418.25,511.25 413.12,509.88 409.00,506.38 406.12,502.25 409.12,514.12 410.25,521.62 408.75,531.00 405.62,538.00 396.00,546.38 Z" /></path>\n<path class="front-delts {{mainCtrl.state.results.muscleGroups.frontDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.frontDelts}" ng-mouseenter="mainCtrl.hovering.frontDelts=true" ng-mouseleave="mainCtrl.hovering.frontDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'frontDelts\')}}" data-html="true" data-container="#canvas-container" d="M 402.62,152.75 L 395.38,157.88 390.38,163.38 387.12,174.62 388.00,204.62 404.75,179.00 402.50,172.38 403.25,163.25 415.62,157.25 402.62,152.75 Z" /></path>\n<path class="serratus-and-obliques {{mainCtrl.state.results.muscleGroups.serratusAndObliques|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.serratusAndObliques}" ng-mouseenter="mainCtrl.hovering.serratusAndObliques=true" ng-mouseleave="mainCtrl.hovering.serratusAndObliques=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'serratusAndObliques\')}}" data-html="true" data-container="#canvas-container" d="M 245.50,326.00 L 250.00,288.50 261.75,249.25 261.50,264.75 259.75,280.00 258.50,302.25 266.50,321.25 256.50,320.50 245.50,326.00 Z" /></path>\n<path class="serratus-and-obliques {{mainCtrl.state.results.muscleGroups.serratusAndObliques|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.serratusAndObliques}" ng-mouseenter="mainCtrl.hovering.serratusAndObliques=true" ng-mouseleave="mainCtrl.hovering.serratusAndObliques=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'serratusAndObliques\')}}" data-html="true" data-container="#canvas-container" d="M 171.00,300.50 L 172.00,328.00 161.25,321.25 156.75,321.75 164.75,300.75 163.50,271.75 171.00,300.50 Z" /></path>\n<path class="lats-and-teres-major {{mainCtrl.state.results.muscleGroups.latsAndTeresMajor|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.latsAndTeresMajor}" ng-mouseenter="mainCtrl.hovering.latsAndTeresMajor=true" ng-mouseleave="mainCtrl.hovering.latsAndTeresMajor=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'latsAndTeresMajor\')}}" data-html="true" data-container="#canvas-container" d="M 227.00,217.50 L 228.50,208.00 233.00,208.50 263.50,187.00 258.75,193.50 257.00,202.25 256.00,209.25 259.25,230.25 262.25,247.75 250.75,285.25 246.75,311.00 245.25,326.50 238.25,330.50 233.75,298.75 222.50,280.50 214.00,268.25 211.25,254.50 217.25,232.75 227.00,217.50 Z" /></path>\n<path class="lats-and-teres-major {{mainCtrl.state.results.muscleGroups.latsAndTeresMajor|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.latsAndTeresMajor}" ng-mouseenter="mainCtrl.hovering.latsAndTeresMajor=true" ng-mouseleave="mainCtrl.hovering.latsAndTeresMajor=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'latsAndTeresMajor\')}}" data-html="true" data-container="#canvas-container" d="M 151.00,193.00 L 174.75,209.25 179.00,208.50 182.00,217.50 192.50,233.25 200.25,249.50 202.50,268.50 189.25,286.25 180.75,321.75 172.50,327.50 171.25,300.00 164.25,274.25 154.00,227.50 155.00,203.00 151.00,193.00 Z" /></path>\n<path class="rotator-cuff {{mainCtrl.state.results.muscleGroups.rotatorCuff|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.rotatorCuff}" ng-mouseenter="mainCtrl.hovering.rotatorCuff=true" ng-mouseleave="mainCtrl.hovering.rotatorCuff=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'rotatorCuff\')}}" data-html="true" data-container="#canvas-container" d="M 241.75,159.50 L 259.75,162.75 266.25,164.50 263.75,186.50 233.00,208.75 229.00,208.25 229.50,202.75 241.75,159.50 Z" /></path>\n<path class="rotator-cuff {{mainCtrl.state.results.muscleGroups.rotatorCuff|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.rotatorCuff}" ng-mouseenter="mainCtrl.hovering.rotatorCuff=true" ng-mouseleave="mainCtrl.hovering.rotatorCuff=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'rotatorCuff\')}}" data-html="true" data-container="#canvas-container" d="M 141.25,165.25 L 148.25,164.00 162.00,160.50 177.50,203.00 179.50,208.50 174.75,208.75 150.75,192.75 139.50,173.00 141.25,165.25 Z" /></path>\n<path class="upper-traps {{mainCtrl.state.results.muscleGroups.upperTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperTraps}" ng-mouseenter="mainCtrl.hovering.upperTraps=true" ng-mouseleave="mainCtrl.hovering.upperTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperTraps\')}}" data-html="true" data-container="#canvas-container" d="M 403.75,150.00 L 417.00,149.50 427.50,148.38 435.12,144.88 430.12,150.00 427.00,156.00 415.75,154.88 403.75,150.00 Z" /></path>\n<path class="glutes {{mainCtrl.state.results.muscleGroups.glutes|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.glutes}" ng-mouseenter="mainCtrl.hovering.glutes=true" ng-mouseleave="mainCtrl.hovering.glutes=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'glutes\')}}" data-html="true" data-container="#canvas-container" d="M 173.50,417.25 L 162.75,411.75 153.00,403.25 148.00,386.75 149.00,369.25 151.50,355.75 152.50,342.00 154.25,330.75 155.75,324.75 160.75,325.75 169.75,332.00 191.50,347.25 194.75,355.25 201.50,362.00 210.00,361.75 215.00,355.50 216.75,349.25 232.25,338.50 241.75,333.50 256.25,324.75 265.25,325.00 266.75,355.00 268.50,382.50 267.25,397.50 265.25,410.50 257.25,417.25 246.75,423.75 232.00,421.25 221.00,414.75 214.00,407.50 211.00,402.25 206.75,402.50 202.25,407.25 190.25,415.50 173.50,417.25 Z" /></path>\n<path class="spinal-erectors {{mainCtrl.state.results.muscleGroups.spinalErectors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.spinalErectors}" ng-mouseenter="mainCtrl.hovering.spinalErectors=true" ng-mouseleave="mainCtrl.hovering.spinalErectors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'spinalErectors\')}}" data-html="true" data-container="#canvas-container" d="M 190.75,341.75 L 180.75,335.50 172.00,327.50 180.75,321.75 188.75,286.25 202.00,268.50 200.25,248.25 198.00,215.25 191.50,159.25 192.25,135.00 195.50,111.25 200.75,107.75 208.75,113.25 213.75,135.25 214.50,159.00 211.25,185.25 211.00,252.75 214.00,269.25 223.00,280.50 233.50,298.75 238.25,330.50 212.50,346.75 212.50,354.00 205.75,356.75 198.75,351.75" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 429.00,576.00 L 421.75,589.25 417.12,597.88 415.88,607.25 416.12,633.00 416.50,658.62 419.62,645.00 423.12,626.62 426.25,609.38 428.00,599.25 429.00,576.00 Z" /></path>\n<path class="serratus-and-obliques {{mainCtrl.state.results.muscleGroups.serratusAndObliques|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.serratusAndObliques}" ng-mouseenter="mainCtrl.hovering.serratusAndObliques=true" ng-mouseleave="mainCtrl.hovering.serratusAndObliques=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'serratusAndObliques\')}}" data-html="true" data-container="#canvas-container" d="M 408.75,249.50 L 414.75,243.62 424.25,244.12 425.88,247.50 425.50,255.38 422.12,258.62 425.25,261.75 425.50,274.12 422.00,276.75 425.38,279.12 426.00,290.25 423.50,292.25 423.75,295.12 426.38,297.38 426.12,304.75 422.88,307.12 427.12,312.38 427.50,327.50 426.75,337.50 431.38,359.00 420.50,343.12 411.25,332.62 406.88,317.38 413.00,301.12 412.50,283.62 409.88,266.25 408.75,249.50 Z" /></path>\n<path class="serratus-and-obliques {{mainCtrl.state.results.muscleGroups.serratusAndObliques|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.serratusAndObliques}" ng-mouseenter="mainCtrl.hovering.serratusAndObliques=true" ng-mouseleave="mainCtrl.hovering.serratusAndObliques=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'serratusAndObliques\')}}" data-html="true" data-container="#canvas-container" d="M 496.00,244.00 L 494.12,247.38 494.62,254.25 497.75,258.12 494.88,262.25 494.00,273.00 497.50,275.12 494.00,278.62 494.12,290.00 497.25,291.88 493.75,296.38 493.62,304.75 498.00,306.88 492.62,311.25 490.00,354.75 494.50,347.50 511.25,330.00 512.00,323.62 513.25,318.50 508.25,307.00 507.12,301.88 507.25,283.88 509.12,264.50 510.62,251.62 509.00,246.75 502.25,243.12 496.00,244.00 Z" /></path>\n<path class="abdominals {{mainCtrl.state.results.muscleGroups.abdominals|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.abdominals}" ng-mouseenter="mainCtrl.hovering.abdominals=true" ng-mouseleave="mainCtrl.hovering.abdominals=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'abdominals\')}}" data-html="true" data-container="#canvas-container" d="M 429.25,242.62 L 444.62,230.88 451.50,224.38 452.88,220.00 466.38,220.38 472.25,227.25 478.75,233.50 489.12,239.75 491.88,241.50 491.00,262.62 490.50,283.38 490.12,297.88 488.50,328.00 482.38,351.25 467.50,388.75 451.75,387.88 437.25,350.50 432.25,322.50 431.75,304.00 429.62,296.25 430.12,280.38 430.75,263.25 429.00,254.75 429.25,242.62 Z" /></path>\n<path class="hip-adductors {{mainCtrl.state.results.muscleGroups.hipAdductors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipAdductors}" ng-mouseenter="mainCtrl.hovering.hipAdductors=true" ng-mouseleave="mainCtrl.hovering.hipAdductors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipAdductors\')}}" data-html="true" data-container="#canvas-container" d="M 245.50,424.00 L 232.25,421.25 220.75,414.75 227.50,440.75 236.25,467.75 242.25,508.50 241.50,470.50 242.50,453.00" /></path>\n<path class="hip-adductors {{mainCtrl.state.results.muscleGroups.hipAdductors|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hipAdductors}" ng-mouseenter="mainCtrl.hovering.hipAdductors=true" ng-mouseleave="mainCtrl.hovering.hipAdductors=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hipAdductors\')}}" data-html="true" data-container="#canvas-container" d="M 174.00,417.25 L 190.50,415.25 203.25,407.00 201.75,421.50 198.75,440.25 191.75,469.25 188.50,488.75 184.25,513.75 178.00,437.00 174.00,417.25 Z" /></path>\n<path class="quads {{mainCtrl.state.results.muscleGroups.quads|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.quads}" ng-mouseenter="mainCtrl.hovering.quads=true" ng-mouseleave="mainCtrl.hovering.quads=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'quads\')}}" data-html="true" data-container="#canvas-container" d="M 192.50,467.50 L 189.75,516.00 187.25,541.50 182.50,560.25 178.25,567.75 183.00,542.25 184.00,514.50 192.50,467.50 Z" /></path>\n<path class="hamstrings {{mainCtrl.state.results.muscleGroups.hamstrings|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hamstrings}" ng-mouseenter="mainCtrl.hovering.hamstrings=true" ng-mouseleave="mainCtrl.hovering.hamstrings=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hamstrings\')}}" data-html="true" data-container="#canvas-container" d="M 272.50,441.25 L 267.00,427.75 262.75,424.25 245.75,424.50 242.75,430.50 242.75,452.50 242.75,508.25 245.00,527.00 251.00,549.00 257.00,568.75 261.25,547.00 264.50,554.50 271.75,539.25 289.75,557.00 287.00,536.75 283.00,523.00 280.75,499.25 277.25,483.50 278.00,466.50 272.50,441.25 Z" /></path>\n<path class="hamstrings {{mainCtrl.state.results.muscleGroups.hamstrings|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.hamstrings}" ng-mouseenter="mainCtrl.hovering.hamstrings=true" ng-mouseleave="mainCtrl.hovering.hamstrings=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'hamstrings\')}}" data-html="true" data-container="#canvas-container" d="M 149.00,438.25 L 149.75,426.00 154.75,418.25 163.50,416.25 174.00,417.75 177.50,434.25 184.00,516.00 182.50,543.25 177.75,568.50 175.00,582.25 172.00,558.25 167.50,549.00 163.00,552.50 155.00,540.00 142.75,559.25 146.00,518.50 147.00,485.25 147.25,458.00 149.00,438.25 Z" /></path>\n<path class="quads {{mainCtrl.state.results.muscleGroups.quads|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.quads}" ng-mouseenter="mainCtrl.hovering.quads=true" ng-mouseleave="mainCtrl.hovering.quads=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'quads\')}}" data-html="true" data-container="#canvas-container" d="M 273.00,442.25 L 276.25,399.75 282.00,409.25 283.50,418.25 284.75,443.00 286.25,468.50 286.75,494.25 286.75,537.50 283.25,522.25 281.00,498.50 277.75,483.50 277.75,466.75 273.00,442.25 Z" /></path>\n<path class="quads {{mainCtrl.state.results.muscleGroups.quads|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.quads}" ng-mouseenter="mainCtrl.hovering.quads=true" ng-mouseleave="mainCtrl.hovering.quads=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'quads\')}}" data-html="true" data-container="#canvas-container" d="M 142.50,397.50 L 139.50,417.50 142.25,468.75 146.25,518.75 147.00,487.00 147.25,458.00 148.50,440.50 146.00,418.50 142.50,397.50 Z" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 155.25,540.25 L 163.50,553.25 167.25,549.00 171.50,558.00 175.00,587.50 175.25,615.50 169.00,648.25 164.25,670.25 160.00,688.25 157.75,722.25 154.25,734.50 150.00,740.25 142.25,744.50 136.25,734.25 134.50,716.75 135.75,680.25 132.25,645.00 131.00,604.00 137.00,572.75 145.75,555.00 155.25,540.25 Z" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 261.50,547.75 L 264.50,554.50 271.75,539.25 276.25,542.50 289.75,557.25 295.00,570.75 299.25,600.75 299.25,629.75 299.00,690.75 296.25,708.25 290.75,717.25 283.50,717.50 281.00,713.00 277.25,680.00 265.75,639.25 258.25,608.25 257.00,569.25 261.50,547.75 Z" /></path>\n<path class="triceps {{mainCtrl.state.results.muscleGroups.triceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.triceps}" ng-mouseenter="mainCtrl.hovering.triceps=true" ng-mouseleave="mainCtrl.hovering.triceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'triceps\')}}" data-html="true" data-container="#canvas-container" d="M 126.75,209.00 L 126.25,230.25 123.75,253.00 122.50,266.75 122.38,273.38 127.88,280.75 141.12,288.62 148.88,278.75 149.50,261.12 152.50,244.25 154.12,226.25 154.62,211.00 155.62,203.12 148.12,187.50 144.50,182.00 139.38,172.75 137.50,179.88 137.12,188.50 126.75,209.00 Z" /></path>\n<path class="triceps {{mainCtrl.state.results.muscleGroups.triceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.triceps}" ng-mouseenter="mainCtrl.hovering.triceps=true" ng-mouseleave="mainCtrl.hovering.triceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'triceps\')}}" data-html="true" data-container="#canvas-container" d="M 266.62,167.62 L 263.75,186.62 259.25,192.88 256.75,202.50 256.25,209.88 257.62,219.75 261.38,242.38 264.25,257.38 266.38,267.38 267.12,280.50 272.25,288.50 284.88,280.50 290.12,275.38 293.75,265.38 291.00,244.50 288.00,223.25 286.62,212.25 275.50,197.12 266.62,167.62 Z" /></path>\n<path class="forearms {{mainCtrl.state.results.muscleGroups.forearms|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.forearms}" ng-mouseenter="mainCtrl.hovering.forearms=true" ng-mouseleave="mainCtrl.hovering.forearms=false" bs-tooltip data-title="{{mainCtrl.tooltip(\'forearms\')}}" data-html="true" data-container="#canvas-container" d="M 267.25,281.00 L 272.38,288.88 284.50,280.88 290.25,275.12 293.62,265.62 297.00,283.12 301.12,304.62 302.62,324.75 304.12,351.88 305.00,372.12 289.25,372.50 284.25,353.88 277.62,334.75 271.62,314.88 268.62,295.88 267.25,281.00 Z" /></path>\n<path class="forearms {{mainCtrl.state.results.muscleGroups.forearms|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.forearms}" ng-mouseenter="mainCtrl.hovering.forearms=true" ng-mouseleave="mainCtrl.hovering.forearms=false" bs-tooltip data-title="{{mainCtrl.tooltip(\'forearms\')}}" data-html="true" data-container="#canvas-container" d="M 116.25,372.12 L 116.00,324.38 116.62,298.50 122.38,273.50 128.00,281.12 140.88,288.88 148.88,278.75 148.88,296.75 144.88,319.50 140.00,340.00 134.25,362.88 132.62,372.25 116.25,372.12 Z" /></path>\n<path class="rear-delts {{mainCtrl.state.results.muscleGroups.rearDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.rearDelts}" ng-mouseenter="mainCtrl.hovering.rearDelts=true" ng-mouseleave="mainCtrl.hovering.rearDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'rearDelts\')}}" data-html="true" data-container="#canvas-container" d="M 272.62,154.12 L 263.62,154.12 260.75,156.12 259.38,163.12 266.12,164.38 272.62,188.38 275.62,197.00 286.75,212.38 287.50,174.25 281.38,164.38 272.62,154.12 Z" /></path>\n<path class="rear-delts {{mainCtrl.state.results.muscleGroups.rearDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.rearDelts}" ng-mouseenter="mainCtrl.hovering.rearDelts=true" ng-mouseleave="mainCtrl.hovering.rearDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'rearDelts\')}}" data-html="true" data-container="#canvas-container" d="M 127.00,169.50 L 130.25,162.25 135.25,157.00 140.88,154.25 146.50,155.62 148.00,164.38 141.00,165.38 139.62,172.75 137.25,180.00 137.12,188.75 126.75,209.38 127.00,169.50 Z" /></path>\n<path class="side-delts {{mainCtrl.state.results.muscleGroups.sideDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.sideDelts}" ng-mouseenter="mainCtrl.hovering.sideDelts=true" ng-mouseleave="mainCtrl.hovering.sideDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'sideDelts\')}}" data-html="true" data-container="#canvas-container" d="M 272.50,154.38 L 281.12,151.62 284.38,155.50 286.25,160.62 287.00,167.62 287.38,174.12 281.75,164.62 276.75,158.88 272.50,154.38 Z" /></path>\n<path class="side-delts {{mainCtrl.state.results.muscleGroups.sideDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.sideDelts}" ng-mouseenter="mainCtrl.hovering.sideDelts=true" ng-mouseleave="mainCtrl.hovering.sideDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'sideDelts\')}}" data-html="true" data-container="#canvas-container" d="M 131.62,153.75 L 128.50,159.62 127.25,168.88 130.12,162.25 135.25,157.12 140.50,154.38 131.62,153.75 Z" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 398.25,558.25 L 390.38,565.75 388.50,585.12 389.88,612.62 393.50,646.38 395.00,671.75 401.75,674.62 404.88,675.25 410.50,673.38 408.62,646.75 407.38,618.12 404.50,598.12 403.12,579.38 402.00,565.00 398.25,558.25 Z" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 501.00,590.25 L 508.00,601.25 514.00,611.12 516.62,624.88 517.50,648.38 518.75,675.88 518.75,690.88 513.50,669.00 507.50,643.38 502.50,622.00 501.38,613.00 501.00,590.25 Z" /></path>\n<path class="calves {{mainCtrl.state.results.muscleGroups.calves|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.calves}" ng-mouseenter="mainCtrl.hovering.calves=true" ng-mouseleave="mainCtrl.hovering.calves=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'calves\')}}" data-html="true" data-container="#canvas-container" d="M 531.75,564.25 L 538.50,575.50 541.88,589.00 544.00,614.38 544.00,643.88 543.00,665.12 543.12,704.75 525.50,700.88 525.12,642.88 526.62,612.00 528.12,575.75 531.75,564.25 Z" /></path>\n<path class="triceps {{mainCtrl.state.results.muscleGroups.triceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.triceps}" ng-mouseenter="mainCtrl.hovering.triceps=true" ng-mouseleave="mainCtrl.hovering.triceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'triceps\')}}" data-html="true" data-container="#canvas-container" d="M 517.88,181.88 L 530.62,200.12 534.25,207.12 536.50,218.62 539.25,241.25 541.12,256.00 541.75,265.75 536.12,281.12 528.00,273.25 532.50,260.62 533.12,249.50 532.88,237.88 531.50,229.12 523.75,196.12 517.88,181.88 Z" /></path>\n<path class="upper-traps {{mainCtrl.state.results.muscleGroups.upperTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperTraps}" ng-mouseenter="mainCtrl.hovering.upperTraps=true" ng-mouseleave="mainCtrl.hovering.upperTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperTraps\')}}" data-html="true" data-container="#canvas-container" d="M 479.88,141.12 L 479.38,155.12 482.50,156.75 492.50,156.50 508.12,152.62 516.50,149.50 495.25,148.88 485.62,145.50 479.88,141.12 Z" /></path>\n<path class="middle-traps {{mainCtrl.state.results.muscleGroups.middleTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.middleTraps}" ng-mouseenter="mainCtrl.hovering.middleTraps=true" ng-mouseleave="mainCtrl.hovering.middleTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'middleTraps\')}}" data-html="true" data-container="#canvas-container" d="M 214.00,135.62 L 230.75,141.38 238.88,143.38 253.75,145.12 238.38,150.25 230.75,153.12 220.62,157.12 214.25,159.12 214.00,135.62 Z" /></path>\n<path class="lower-traps {{mainCtrl.state.results.muscleGroups.lowerTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.lowerTraps}" ng-mouseenter="mainCtrl.hovering.lowerTraps=true" ng-mouseleave="mainCtrl.hovering.lowerTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'lowerTraps\')}}" data-html="true" data-container="#canvas-container" d="M 214.38,159.50 L 232.25,153.00 226.50,160.62 228.00,171.12 228.12,184.12 229.50,203.62 226.75,217.62 218.88,229.38 214.62,241.25 211.00,254.50 211.50,213.38 211.12,186.00 212.62,169.50 214.38,159.50 Z" /></path>\n<path class="lower-traps {{mainCtrl.state.results.muscleGroups.lowerTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.lowerTraps}" ng-mouseenter="mainCtrl.hovering.lowerTraps=true" ng-mouseleave="mainCtrl.hovering.lowerTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'lowerTraps\')}}" data-html="true" data-container="#canvas-container" d="M 191.38,159.38 L 174.00,152.12 178.12,159.75 177.00,168.62 177.50,180.25 177.25,202.88 182.38,217.62 192.62,233.12 200.50,249.38 198.38,216.12 192.75,171.00 191.38,159.38 Z" /></path>\n<path class="middle-traps {{mainCtrl.state.results.muscleGroups.middleTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.middleTraps}" ng-mouseenter="mainCtrl.hovering.middleTraps=true" ng-mouseleave="mainCtrl.hovering.middleTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'middleTraps\')}}" data-html="true" data-container="#canvas-container" d="M 155.38,144.88 L 164.62,143.25 171.12,141.50 177.88,140.25 192.75,135.38 191.25,159.38 171.88,151.12 161.88,147.38 155.38,144.88 Z" /></path>\n<path class="upper-traps {{mainCtrl.state.results.muscleGroups.upperTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperTraps}" ng-mouseenter="mainCtrl.hovering.upperTraps=true" ng-mouseleave="mainCtrl.hovering.upperTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperTraps\')}}" data-html="true" data-container="#canvas-container" d="M 205.62,96.38 L 212.12,97.00 212.88,103.38 215.75,113.50 220.25,120.38 225.38,128.50 229.38,134.12 240.25,138.38 250.50,140.12 261.00,141.75 259.12,145.12 250.50,144.88 239.12,143.38 228.62,140.75 214.12,135.50 209.88,118.25 206.75,104.00 205.62,96.38 Z" /></path>\n<path class="upper-traps {{mainCtrl.state.results.muscleGroups.upperTraps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperTraps}" ng-mouseenter="mainCtrl.hovering.upperTraps=true" ng-mouseleave="mainCtrl.hovering.upperTraps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperTraps\')}}" data-html="true" data-container="#canvas-container" d="M 195.12,97.00 L 190.25,100.38 190.38,108.62 189.12,113.38 187.00,118.12 184.50,127.88 180.38,133.88 174.25,137.50 161.88,140.62 148.00,142.75 149.88,144.88 155.50,144.75 162.62,143.50 172.00,141.25 177.75,140.25 183.62,138.25 192.38,135.38 192.50,130.62 194.00,118.50 196.12,103.25 195.12,97.00 Z" /></path>\n<path class="upper-chest {{mainCtrl.state.results.muscleGroups.upperChest|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.upperChest}" ng-mouseenter="mainCtrl.hovering.upperChest=true" ng-mouseleave="mainCtrl.hovering.upperChest=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'upperChest\')}}" data-html="true" data-container="#canvas-container" d="M 403.88,163.25 L 407.25,161.25 415.88,157.25 424.75,158.25 434.25,159.25 444.62,159.75 450.38,161.12 451.62,166.88 446.00,164.75 438.00,164.38 428.88,164.12 412.88,163.12 403.88,163.25 Z" /></path>\n<path class="side-delts {{mainCtrl.state.results.muscleGroups.sideDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.sideDelts}" ng-mouseenter="mainCtrl.hovering.sideDelts=true" ng-mouseleave="mainCtrl.hovering.sideDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'sideDelts\')}}" data-html="true" data-container="#canvas-container" d="M 402.75,152.50 L 399.75,150.75 395.75,151.25 389.38,155.88 384.25,164.00 381.88,171.50 382.00,189.38 382.88,218.88 384.75,209.75 388.12,204.38 387.12,174.38 390.25,163.50 394.88,158.25 402.75,152.50 Z" /></path>\n<path class="side-delts {{mainCtrl.state.results.muscleGroups.sideDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.sideDelts}" ng-mouseenter="mainCtrl.hovering.sideDelts=true" ng-mouseleave="mainCtrl.hovering.sideDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'sideDelts\')}}" data-html="true" data-container="#canvas-container" d="M 515.38,152.25 L 521.38,151.12 526.12,152.12 530.38,156.00 534.50,162.12 537.12,170.00 537.88,179.00 536.50,218.88 534.25,207.12 530.62,200.00 531.62,190.50 530.88,170.25 527.25,159.62 522.75,155.25 515.38,152.25 Z" /></path>\n<path class="front-delts {{mainCtrl.state.results.muscleGroups.frontDelts|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.frontDelts}" ng-mouseenter="mainCtrl.hovering.frontDelts=true" ng-mouseleave="mainCtrl.hovering.frontDelts=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'frontDelts\')}}" data-html="true" data-container="#canvas-container" d="M 494.00,159.50 L 508.75,154.62 515.25,152.50 522.62,155.25 527.38,159.88 530.75,170.00 531.25,179.88 531.50,190.12 530.62,200.00 516.00,179.12 516.75,168.12 514.62,164.75 509.75,162.38 501.88,160.38 494.00,159.50 Z" /></path>\n<path class="triceps {{mainCtrl.state.results.muscleGroups.triceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.triceps}" ng-mouseenter="mainCtrl.hovering.triceps=true" ng-mouseleave="mainCtrl.hovering.triceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'triceps\')}}" data-html="true" data-container="#canvas-container" d="M 401.50,184.38 L 387.88,204.50 385.00,209.50 382.62,218.88 379.62,250.75 379.25,257.50 383.38,270.88 384.88,281.12 391.62,273.50 388.50,265.88 387.00,248.50 388.50,229.38 390.75,218.38 396.25,199.62 401.50,184.38 Z" /></path>\n<path class="biceps {{mainCtrl.state.results.muscleGroups.biceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.biceps}" ng-mouseenter="mainCtrl.hovering.biceps=true" ng-mouseleave="mainCtrl.hovering.biceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'biceps\')}}" data-html="true" data-container="#canvas-container" d="M 401.62,183.62 L 395.88,201.50 390.38,219.88 388.50,230.12 387.12,247.75 388.75,265.75 391.75,273.25 397.88,282.12 403.62,285.25 404.75,257.88 407.88,246.38 405.38,239.50 402.62,224.88 402.62,211.00 405.75,198.62 405.88,190.00 404.62,179.38 401.62,183.62 Z" /></path>\n<path class="biceps {{mainCtrl.state.results.muscleGroups.biceps|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.biceps}" ng-mouseenter="mainCtrl.hovering.biceps=true" ng-mouseleave="mainCtrl.hovering.biceps=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'biceps\')}}" data-html="true" data-container="#canvas-container" d="M 517.62,181.62 L 523.75,196.88 530.62,225.00 532.75,237.38 533.25,249.25 532.38,260.75 528.12,273.25 522.38,282.62 516.75,285.12 515.25,264.38 513.38,250.75 515.25,238.75 519.25,225.00 519.75,212.38 514.38,197.50 513.38,189.38 515.88,179.12 517.62,181.62 Z" /></path>\n<path class="forearms {{mainCtrl.state.results.muscleGroups.forearms|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.forearms}" ng-mouseenter="mainCtrl.hovering.forearms=true" ng-mouseleave="mainCtrl.hovering.forearms=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'forearms\')}}" data-html="true" data-container="#canvas-container" d="M 516.75,285.62 L 522.12,283.00 528.25,273.25 535.88,281.38 541.75,266.00 545.88,286.88 549.38,302.50 551.00,322.75 552.12,338.12 552.25,370.50 546.12,369.38 537.12,370.00 529.50,342.75 522.38,321.12 518.62,304.25 516.75,285.62 Z" /></path>\n<path class="forearms {{mainCtrl.state.results.muscleGroups.forearms|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.forearms}" ng-mouseenter="mainCtrl.hovering.forearms=true" ng-mouseleave="mainCtrl.hovering.forearms=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'forearms\')}}" data-html="true" data-container="#canvas-container" d="M 379.38,258.00 L 383.00,269.50 385.00,281.12 391.75,273.25 397.88,281.88 403.25,285.25 401.62,301.62 396.88,324.38 388.88,349.62 383.50,369.25 379.75,367.75 367.75,367.38 369.25,334.62 370.25,305.38 374.00,287.00 377.38,270.00 379.38,258.00 Z" /></path>\n<path class="lower-chest {{mainCtrl.state.results.muscleGroups.lowerChest|scoreClass}}" ng-class="{\'active\':mainCtrl.hovering.lowerChest}" ng-mouseenter="mainCtrl.hovering.lowerChest=true" ng-mouseleave="mainCtrl.hovering.lowerChest=false" bs-tooltip data-animation="none" data-title="{{mainCtrl.tooltip(\'lowerChest\')}}" data-html="true" data-container="#canvas-container" d="M 406.00,190.12 L 405.00,180.00 402.62,172.88 403.50,163.38 413.75,163.12 427.38,164.25 440.88,164.62 445.88,164.88 451.38,166.75 457.12,186.88 456.88,196.00 457.12,203.62 454.38,211.38 453.00,205.12 450.12,198.88 445.88,193.50 438.38,190.12 429.62,188.25 417.50,189.50 406.00,190.12 Z" /></path>\n</svg>\n</div>\n<div class="panel panel-default muscle-figure-legend"><div class="panel-heading"><h3 class="panel-title">Legend</h3>\n</div>\n<div class="panel-body"><ul class="list-unstyled"><li><i class="fa fa-circle subpar"></i>\nSubpar</li>\n<li><i class="fa fa-circle untrained"></i>\nUntrained</li>\n<li><i class="fa fa-circle novice"></i>\nNovice</li>\n<li><i class="fa fa-circle intermediate"></i>\nIntermediate</li>\n<li><i class="fa fa-circle proficient"></i>\nProficient</li>\n<li><i class="fa fa-circle advanced"></i>\nAdvanced</li>\n<li><i class="fa fa-circle exceptional"></i>\nExceptional</li>\n<li><i class="fa fa-circle elite"></i>\nElite</li>\n<li><i class="fa fa-circle world-class"></i>\nWorld Class</li>\n</ul>\n</div>\n</div>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "one-rep-maxes",
        '<div class="one-rep-maxes portlet light"><div class="portlet-title"><div class="caption caption-md"><span class="caption-subject theme-font bold uppercase">Estimated one rep maxes</span>\n</div>\n</div>\n<div class="portlet-body"><div ng-repeat="lift in mainCtrl.lifts" ng-if="mainCtrl.state.results.lifts[lift].user1RM"><span class="boldish">{{mainCtrl.displayLift(lift)}}:</span> <span ng-if="mainCtrl.liftIsSpecial(lift)">{{mainCtrl.state.results.lifts[lift].special1RM|abs}}</span><span ng-if="!mainCtrl.liftIsSpecial(lift)">{{mainCtrl.state.results.lifts[lift].user1RM}}</span> <span ng-bind="mainCtrl.displayUnits()"></span><span ng-if="mainCtrl.liftIsSpecial(lift) && mainCtrl.state.results.lifts[lift].special1RM < 0"> assisted</span><span ng-if="mainCtrl.liftIsSpecial(lift) && mainCtrl.state.results.lifts[lift].special1RM >= 0"> added</span><span class="lift-classification">[{{mainCtrl.state.results.lifts[lift].userScore|englishStrengthScore}}]</span>\n</div>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "strength-progress",
        '<div class="portlet light"><div class="portlet-body"><ul class="nav nav-tabs"><li ng-class="{\'active\':strengthProgressCtrl.state.selectedChartTab === \'categoryScores\'}"><a href="javascript:;" id="category-score-progress-chart-tab" data-toggle="tab" ng-click="strengthProgressCtrl.showCategoryScoreProgressChart()">Category Scores</a>\n</li>\n<li ng-if="!mainCtrl.hideWeight" ng-class="{\'active\':strengthProgressCtrl.state.selectedChartTab === \'liftOneRepMaxes\'}"><a href="javascript:;" id="lift-onerepmax-progress-chart-tab" data-toggle="tab" ng-click="strengthProgressCtrl.showLiftOneRepMaxProgressChart()">Lift 1RMs</a>\n</li>\n<li ng-class="{\'active\':strengthProgressCtrl.state.selectedChartTab === \'liftScores\'}"><a href="javascript:;" id="lift-score-progress-chart-tab" data-toggle="tab" ng-click="strengthProgressCtrl.showLiftScoreProgressChart()">Lift Scores</a>\n</li>\n</ul>\n<div class="tab-content" id="progress-chart-tabs"><div class="tab-pane active" ng-show="strengthProgressCtrl.state.selectedChartTab === \'categoryScores\'"><div ng-show="!strengthProgressCtrl.state.noLiftData && !strengthProgressCtrl.state.waitingForProgress" id="category-score-progress-chart"></div>\n<p class="loading-indicator" ng-if="strengthProgressCtrl.state.waitingForProgress"><i class="fa fa-spin fa-spinner"></i>\n</p>\n<div class="portlet-body" ng-if="strengthProgressCtrl.state.noLiftData && !strengthProgressCtrl.state.waitingForProgress"><div class="alert alert-info">Start logging your lifts to view strength progress charts!</div>\n</div>\n</div>\n<div class="tab-pane active" ng-if="!mainCtrl.hideWeight" ng-show="strengthProgressCtrl.state.selectedChartTab === \'liftOneRepMaxes\'"><div ng-show="!strengthProgressCtrl.state.noLiftData && !strengthProgressCtrl.state.waitingForProgress" id="lift-onerepmax-progress-chart"></div>\n<p class="loading-indicator" ng-if="strengthProgressCtrl.state.waitingForProgress"><i class="fa fa-spin fa-spinner"></i>\n</p>\n<div class="portlet-body" ng-if="strengthProgressCtrl.state.noLiftData && !strengthProgressCtrl.state.waitingForProgress"><div class="alert alert-info">Start logging your lifts to view strength progress charts!</div>\n</div>\n</div>\n<div class="tab-pane active" ng-show="strengthProgressCtrl.state.selectedChartTab === \'liftScores\'"><div ng-show="!strengthProgressCtrl.state.noLiftData && !strengthProgressCtrl.state.waitingForProgress" id="lift-score-progress-chart"></div>\n<p class="loading-indicator" ng-if="strengthProgressCtrl.state.waitingForProgress"><i class="fa fa-spin fa-spinner"></i>\n</p>\n<div class="portlet-body" ng-if="strengthProgressCtrl.state.noLiftData && !strengthProgressCtrl.state.waitingForProgress"><div class="alert alert-info">Start logging your lifts to view strength progress charts!</div>\n</div>\n</div>\n</div>\n<div class="delete-lift-data" ng-if="strengthProgressCtrl.state.pointClicked"><p>Do you want to delete the lifting data you entered on {{strengthProgressCtrl.state.pointDateString}}? This cannot be undone!</p>\n<div><button class="btn red-sunglo" ng-click="strengthProgressCtrl.deleteLiftingData()">Delete</button>\n<button class="btn grey-pastel" ng-click="strengthProgressCtrl.cancelDelete()">Cancel</button>\n</div>\n</div>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "strengths-weaknesses-chart",
        '<div class="portlet light"><div class="portlet-body"><ul class="nav nav-tabs"><li ng-class="{\'active\':mainCtrl.state.selectedChartTab === \'strengthsAndWeaknesses\'}"><a href="javascript:;" id="strengths-and-weaknesses-tab" data-toggle="tab" ng-click="mainCtrl.showStrengthsAndWeaknessesChart()">Relative strengths and weaknesses</a>\n</li>\n<li ng-if="!mainCtrl.hideWeight" ng-class="{\'active\':mainCtrl.state.selectedChartTab === \'liftsVsAverage\'}"><a href="javascript:;" id="lifts-vs-average-tab" data-toggle="tab" ng-click="mainCtrl.showLiftsVsAverageChart()">Lifts vs average</a>\n</li>\n</ul>\n<div class="tab-content"><div class="tab-pane active" ng-show="mainCtrl.state.selectedChartTab === \'strengthsAndWeaknesses\'" style="height:{{mainCtrl.state.results.chartHeight}}px"><div id="strengths-and-weaknesses-chart" ng-style="{height: mainCtrl.state.results.chartHeight + \'px\'}"></div>\n</div>\n<div class="tab-pane active" ng-if="!mainCtrl.hideWeight" ng-show="mainCtrl.state.selectedChartTab === \'liftsVsAverage\'" style="height:{{mainCtrl.state.results.chartHeight}}px"><div id="lifts-vs-average-chart" ng-style="{height: mainCtrl.state.results.chartHeight + \'px\'}"></div>\n</div>\n</div>\n</div>\n</div>\n'
      );
    },
  ]);
})(angular.module("main", ["standards", "ngCookies", "restangular"]));
