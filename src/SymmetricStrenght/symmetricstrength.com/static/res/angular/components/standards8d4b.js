(function (module) {
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
  module.controller("StandardsController", [
    "$scope",
    "$routeParams",
    "$location",
    function ($scope, $routeParams, $location) {
      "use strict";
      var _this = this;
      _this.state = {
        roundCalculationsToSpecial: null,
        repMax: 1,
        results: { standards: {} },
      };
      _this.lifts = Strength.lifts;
      _this.displayUnits = Strength.displayUnits;
      _this.displayLift = Strength.displayLift;
      _this.liftIsSpecial = Strength.liftIsSpecial;
      var routeParamsSupplied = function () {
        return (
          $routeParams.bodyweight && $routeParams.units && $routeParams.sex
        );
      };
      var validRouteParams = function () {
        if (isNaN($routeParams.bodyweight)) {
          return false;
        }
        var bodyweight = parseInt($routeParams.bodyweight, 10);
        if (bodyweight <= 0) {
          return false;
        }
        if ($routeParams.units !== "lb" && $routeParams.units !== "kg") {
          return false;
        }
        if ($routeParams.sex !== "male" && $routeParams.sex !== "female") {
          return false;
        }
        if (
          !isNaN($routeParams.age) &&
          (parseInt($routeParams.age, 10) < 10 ||
            parseInt($routeParams.age, 10) > 100)
        ) {
          return false;
        }
        return true;
      };
      if (routeParamsSupplied()) {
        if (validRouteParams()) {
          $scope.bodyweight = parseInt($routeParams.bodyweight, 10);
          $scope.unitSystem =
            $routeParams.units === "lb" ? "Imperial" : "Metric";
          $scope.sex = $routeParams.sex === "male" ? "Male" : "Female";
          $scope.age = $routeParams.age ? parseInt($routeParams.age, 10) : null;
          $scope.roundCalculationsTo = $scope.unitSystem === "Imperial" ? 5 : 1;
          _this.state.roundCalculationsToSpecial = $scope.roundCalculationsTo;
        } else {
          $location.path("/");
        }
      }
      _this.displayLiftWeight = function (lift, weight) {
        var weightStr = "";
        if ($scope.bodyweight && $scope.roundCalculationsTo && weight) {
          if (_this.liftIsSpecial(lift)) {
            var specialWeight = Strength.mround(
              weight - $scope.bodyweight,
              $scope.roundCalculationsTo
            );
            if (specialWeight < 0) {
              weightStr = weightStr + "-" + Math.abs(specialWeight);
            } else {
              weightStr = weightStr + "+" + specialWeight;
            }
          } else {
            weightStr = weightStr + weight;
          }
          weightStr = weightStr + " " + _this.displayUnits($scope.unitSystem);
        }
        return weightStr;
      };
      _this.calculateStandards = function () {
        if (
          $scope.sex &&
          $scope.bodyweight &&
          $scope.unitSystem &&
          $scope.roundCalculationsTo
        ) {
          _this.state.results.standards = _.zipObject(
            _this.lifts,
            _.map(_this.lifts, function (l) {
              return {
                "World class": Strength.mround(
                  Strength.multiRepMax(
                    _this.state.repMax,
                    Strength.liftFromStrengthScore(
                      $scope.unitSystem,
                      $scope.sex,
                      $scope.age,
                      $scope.bodyweight,
                      125.0,
                      _this.displayLift(l)
                    )
                  ),
                  $scope.roundCalculationsTo
                ),
                Elite: Strength.mround(
                  Strength.multiRepMax(
                    _this.state.repMax,
                    Strength.liftFromStrengthScore(
                      $scope.unitSystem,
                      $scope.sex,
                      $scope.age,
                      $scope.bodyweight,
                      112.5,
                      _this.displayLift(l)
                    )
                  ),
                  $scope.roundCalculationsTo
                ),
                Exceptional: Strength.mround(
                  Strength.multiRepMax(
                    _this.state.repMax,
                    Strength.liftFromStrengthScore(
                      $scope.unitSystem,
                      $scope.sex,
                      $scope.age,
                      $scope.bodyweight,
                      100.0,
                      _this.displayLift(l)
                    )
                  ),
                  $scope.roundCalculationsTo
                ),
                Advanced: Strength.mround(
                  Strength.multiRepMax(
                    _this.state.repMax,
                    Strength.liftFromStrengthScore(
                      $scope.unitSystem,
                      $scope.sex,
                      $scope.age,
                      $scope.bodyweight,
                      87.5,
                      _this.displayLift(l)
                    )
                  ),
                  $scope.roundCalculationsTo
                ),
                Proficient: Strength.mround(
                  Strength.multiRepMax(
                    _this.state.repMax,
                    Strength.liftFromStrengthScore(
                      $scope.unitSystem,
                      $scope.sex,
                      $scope.age,
                      $scope.bodyweight,
                      75.0,
                      _this.displayLift(l)
                    )
                  ),
                  $scope.roundCalculationsTo
                ),
                Intermediate: Strength.mround(
                  Strength.multiRepMax(
                    _this.state.repMax,
                    Strength.liftFromStrengthScore(
                      $scope.unitSystem,
                      $scope.sex,
                      $scope.age,
                      $scope.bodyweight,
                      60.0,
                      _this.displayLift(l)
                    )
                  ),
                  $scope.roundCalculationsTo
                ),
                Novice: Strength.mround(
                  Strength.multiRepMax(
                    _this.state.repMax,
                    Strength.liftFromStrengthScore(
                      $scope.unitSystem,
                      $scope.sex,
                      $scope.age,
                      $scope.bodyweight,
                      45.0,
                      _this.displayLift(l)
                    )
                  ),
                  $scope.roundCalculationsTo
                ),
                Untrained: Strength.mround(
                  Strength.multiRepMax(
                    _this.state.repMax,
                    Strength.liftFromStrengthScore(
                      $scope.unitSystem,
                      $scope.sex,
                      $scope.age,
                      $scope.bodyweight,
                      30.0,
                      _this.displayLift(l)
                    )
                  ),
                  $scope.roundCalculationsTo
                ),
              };
            })
          );
        }
      };
      _this.calculateStandards();
      _this.handleRoundCalculationsToInput = function () {
        $scope.roundCalculationsTo = _this.state.roundCalculationsToSpecial;
      };
      $scope.$watch("sex", function () {
        _this.calculateStandards();
      });
      $scope.$watch("bodyweight", function () {
        _this.calculateStandards();
      });
      $scope.$watch("unitSystem", function () {
        _this.calculateStandards();
      });
      $scope.$watch("roundCalculationsTo", function () {
        _this.calculateStandards();
      });
      $scope.$watch("age", function () {
        _this.calculateStandards();
      });
    },
  ]);
  module.controller("StandardsFormController", [
    "$location",
    "$routeParams",
    function ($location, $routeParams) {
      "use strict";
      var _this = this;
      _this.state = {
        unitSystem: "Imperial",
        sex: "Male",
        age: null,
        bodyweight: null,
      };
      var resetErrors = function () {
        _this.state.errors = { bodyweight: false, age: false };
      };
      resetErrors();
      var preFill = function () {
        if (
          $routeParams.bodyweight &&
          $routeParams.units &&
          $routeParams.sex &&
          $routeParams.age
        ) {
          _this.state.bodyweight = parseInt($routeParams.bodyweight, 10);
          _this.state.unitSystem =
            $routeParams.units === "lb" ? "Imperial" : "Metric";
          _this.state.sex = $routeParams.sex === "male" ? "Male" : "Female";
          _this.state.age = isNaN($routeParams.age)
            ? null
            : parseInt($routeParams.age);
        }
      };
      preFill();
      _this.displayUnits = function (singular) {
        return Strength.displayUnits(_this.state.unitSystem, singular);
      };
      _this.calculateResults = function () {
        resetErrors();
        var validateInput = function () {
          var valid = true;
          if (!_this.state.bodyweight || _this.state.bodyweight <= 0) {
            _this.state.errors.bodyweight = true;
            valid = false;
          }
          if (
            _this.state.age &&
            (_this.state.age < 10 || _this.state.age > 100)
          ) {
            _this.state.errors.age = true;
            valid = false;
          }
          return valid;
        };
        if (validateInput()) {
          var unit = _this.state.unitSystem === "Imperial" ? "lb" : "kg";
          var sex = _this.state.sex === "Male" ? "male" : "female";
          var age = _this.state.age ? _this.state.age : "-";
          $location.path(
            "/" + _this.state.bodyweight + "/" + unit + "/" + sex + "/" + age
          );
          if (window.location.href.match(/symmetricstrength\.com/)) {
            ga("send", "event", "button", "click", "view_strength_standards");
          }
        }
      };
      Layout.initContent();
    },
  ]);
  module.directive("standardsForm", function () {
    "use strict";
    return {
      restrict: "E",
      templateUrl: "standards-form",
      controller: "StandardsFormController",
      controllerAs: "standardsFormCtrl",
    };
  });
  module.controller("StandardsPageController", function () {
    "use strict";
    var _this = this;
  });
  module.directive("standardsPage", function () {
    "use strict";
    return {
      restrict: "E",
      templateUrl: "standards-page",
      controller: "StandardsPageController",
      controllerAs: "standardsPageCtrl",
    };
  });
  module.directive("standards", function () {
    "use strict";
    return {
      restrict: "E",
      scope: {
        sex: "=",
        age: "=",
        bodyweight: "=",
        unitSystem: "=",
        roundCalculationsTo: "=",
        standardsPage: "=",
      },
      templateUrl: "standards",
      controller: "StandardsController",
      controllerAs: "standardsCtrl",
    };
  });
  module.run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "standards-form",
        '<div class="portlet light"><div class="portlet-title"><div class="caption caption-md"><span class="caption-subject theme-font bold uppercase">Find strength standards by sex &amp; bodyweight</span>\n</div>\n</div>\n<div class="portlet-body"><form role="form" name="standardsForm" novalidate><div class="col-md-12"><div class="row"><div class="form-group form-md-line-input form-md-floating-label col-md-3 unit-system"><select class="form-control edited" id="form-unit-system" ng-model="standardsFormCtrl.state.unitSystem"><option value="Imperial">Imperial</option>\n<option value="Metric">Metric</option>\n</select>\n<label for="form-unit-system">Units</label>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-2"><select class="form-control edited" id="form-sex" ng-model="standardsFormCtrl.state.sex"><option value="Male">Male</option>\n<option value="Female">Female</option>\n</select>\n<label for="form-sex">Sex</label>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\': standardsFormCtrl.state.errors.bodyweight}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':standardsFormCtrl.state.bodyweight != null}" id="form-body-weight" ng-model="standardsFormCtrl.state.bodyweight" name="bodyweight" required>\n<span class="input-group-addon" ng-bind="standardsFormCtrl.displayUnits()"></span>\n<label for="form-body-weight">Body weight</label>\n</div>\n<span class="help-block">Enter a body weight.</span>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\': standardsFormCtrl.state.errors.age}"><div class="input-group"><input class="form-control" type="number" ng-class="{\'edited\':standardsFormCtrl.state.age != null}" id="form-age" ng-model="standardsFormCtrl.state.age" name="age" required>\n<label for="form-age">Age (optional)</label>\n</div>\n<span class="help-block">Age must be between 10 and 100.</span>\n</div>\n</div>\n<div class="row"><button class="btn btn-primary btn-lg red-sunglo" type="submit" ng-click="standardsFormCtrl.calculateResults()">View Strength Standards</button>\n</div>\n</div>\n</form>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "standards-page",
        '<div class="page-container"><div class="page-head"><div class="container"><div class="page-title"><h1>Strength Standards <small>115 lb female</small></h1></h1>\n</div>\n</div>\n</div>\n<div class="page-content"><div class="container"><div class="row"><div class="col-md-12"><standards sex="\'Female\'" bodyweight="115" unit-system="\'Imperial\'" round-calculations-to="5"></standards>\n</div>\n</div>\n</div>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "standards",
        '<div class="portlet light"><div class="portlet-title"><div class="caption caption-md"><span class="caption-subject theme-font bold uppercase">Strength standards for a {{ age ? age + \' year old \' : \'\' }}{{ bodyweight }} {{ standardsCtrl.displayUnits(unitSystem, true) }} <span ng-if="sex === \'Male\'">male</span><span ng-if="sex !== \'Male\'">female</span></span>\n</div>\n</div>\n<div class="portlet-body"><div class="col-md-12"><div class="row"><form role="form" novalidate><div class="form-group form-md-line-input form-md-floating-label col-md-3 col-sm-4 col-xs-6"><select class="form-control edited" id="form-rep-max" ng-model="standardsCtrl.state.repMax" ng-change="standardsCtrl.calculateStandards()" convert-to-number><option value="1">1 rep maxes</option>\n<option value="2">2 rep maxes</option>\n<option value="3">3 rep maxes</option>\n<option value="4">4 rep maxes</option>\n<option value="5">5 rep maxes</option>\n<option value="6">6 rep maxes</option>\n<option value="7">7 rep maxes</option>\n<option value="8">8 rep maxes</option>\n<option value="9">9 rep maxes</option>\n<option value="10">10 rep maxes</option>\n</select>\n<label for="form-rep-max">Rep maxes</label>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3 col-sm-4 col-xs-6 second-select-fix" ng-if="standardsPage"><select class="form-control edited" id="form-round-to" ng-model="standardsCtrl.state.roundCalculationsToSpecial" ng-change="standardsCtrl.handleRoundCalculationsToInput()" convert-to-number><option value="1" ng-if="unitSystem === \'Metric\'">1 kg</option>\n<option value="1" ng-if="unitSystem !== \'Metric\'">1 lb</option>\n<option value="2.5" ng-if="unitSystem === \'Metric\'">2.5 kg</option>\n<option value="2.5" ng-if="unitSystem !== \'Metric\'">2.5 lbs</option>\n<option value="5" ng-if="unitSystem === \'Metric\'">5 kg</option>\n<option value="5" ng-if="unitSystem !== \'Metric\'">5 lbs</option>\n<option value="10" ng-if="unitSystem === \'Metric\'">10 kg</option>\n<option value="10" ng-if="unitSystem !== \'Metric\'">10 lbs</option>\n</select>\n<label for="form-round-to">Round to nearest</label></label>\n</div>\n</form>\n</div>\n<div class="row"><div class="table-responsive"><table class="table table-striped table-bordered table-hover"><thead><tr><th>Lift</th>\n<th>Untrained <i class="fa fa-circle untrained"></i></th>\n<th>Novice <i class="fa fa-circle novice"></i></th>\n<th>Intermediate <i class="fa fa-circle intermediate"></i></th>\n<th>Proficient <i class="fa fa-circle proficient"></i></th>\n<th>Advanced <i class="fa fa-circle advanced"></i></th>\n<th>Exceptional <i class="fa fa-circle exceptional"></i></th>\n<th>Elite <i class="fa fa-circle elite"></i></th>\n<th>World class <i class="fa fa-circle world-class"></i></th>\n</tr>\n</thead>\n<tbody><tr ng-repeat="lift in standardsCtrl.lifts"><td>{{standardsCtrl.displayLift(lift)}} <i bs-tooltip data-container="body" data-title="&quot;+10 {{standardsCtrl.displayUnits()}}&quot; means 10 {{standardsCtrl.displayUnits()}} added; &quot;-10 {{standardsCtrl.displayUnits()}}&quot; means 10 {{standardsCtrl.displayUnits()}} assisted." class="fa fa-info-circle" ng-if="lift === \'dip\' || lift === \'chinup\' || lift === \'pullup\'"></i></td>\n<td>{{standardsCtrl.displayLiftWeight(lift, standardsCtrl.state.results.standards[lift][\'Untrained\'])}}</td>\n<td>{{standardsCtrl.displayLiftWeight(lift, standardsCtrl.state.results.standards[lift][\'Novice\'])}}</td>\n<td>{{standardsCtrl.displayLiftWeight(lift, standardsCtrl.state.results.standards[lift][\'Intermediate\'])}}</td>\n<td>{{standardsCtrl.displayLiftWeight(lift, standardsCtrl.state.results.standards[lift][\'Proficient\'])}}</td>\n<td>{{standardsCtrl.displayLiftWeight(lift, standardsCtrl.state.results.standards[lift][\'Advanced\'])}}</td>\n<td>{{standardsCtrl.displayLiftWeight(lift, standardsCtrl.state.results.standards[lift][\'Exceptional\'])}}</td>\n<td>{{standardsCtrl.displayLiftWeight(lift, standardsCtrl.state.results.standards[lift][\'Elite\'])}}</td>\n<td>{{standardsCtrl.displayLiftWeight(lift, standardsCtrl.state.results.standards[lift][\'World class\'])}}</td>\n</tr>\n</tbody>\n</table>\n</div>\n<p class="note" ng-if="!standardsPage"><strong>Note:</strong> To view strength standards for any sex and bodyweight, visit the <a href="/standards">strength standards</a> page.</span></strong>\n</p>\n<h2>Strength classifications</h2>\n<div class="strength-classification"><div class="classification-name"><i class="fa fa-circle subpar"></i> <strong>Subpar:</strong></i>\n</div>\n<div class="classification-description">The lifter is weaker than the average untrained individual of the same sex and weight. Strength score &lt;30. </div>\n</div>\n<div class="strength-classification"><div class="classification-name"><i class="fa fa-circle untrained"></i> <strong>Untrained:</strong></i>\n</div>\n<div class="classification-description">The lifter has not trained for strength before. The majority of the population. Strength score 30. </div>\n</div>\n<div class="strength-classification"><div class="classification-name"><i class="fa fa-circle novice"></i> <strong>Novice:</strong></i>\n</div>\n<div class="classification-description">The lifter is stronger than the average untrained lifter of the same sex and weight. Lifters in this category have typically been training for a few months or more. Strength score 45. </div>\n</div>\n<div class="strength-classification"><div class="classification-name"><i class="fa fa-circle intermediate"></i> <strong>Intermediate:</strong></i>\n</div>\n<div class="classification-description">The lifter has been consistently training, likely for at least a year. The majority of those who go to the gym regularly fall into this category. Strength score 60. </div>\n</div>\n<div class="strength-classification"><div class="classification-name"><i class="fa fa-circle proficient"></i> <strong>Proficient:</strong></i>\n</div>\n<div class="classification-description">The lifter has been consistently training with a focus on strength, likely for 2+ years. Lifters in this category are stronger than most gym regulars. Strength score 75. </div>\n</div>\n<div class="strength-classification"><div class="classification-name"><i class="fa fa-circle advanced"></i> <strong>Advanced:</strong></i>\n</div>\n<div class="classification-description">The lifter has taken a consistent and structured approach to strength training and dieting for multiple years. At this level, the individual is among the strongest in an average commercial gym. Many in this category compete in strength sports. Strength score 87.5. </div>\n</div>\n<div class="strength-classification"><div class="classification-name"><i class="fa fa-circle exceptional"></i> <strong>Exceptional:</strong></i>\n</div>\n<div class="classification-description">Lifters in this category have typically taken a consistent, structured approach to diet and strength training for the majority of their adult life and are competitive at the regional level. For many lifters, this level is near the maximum genetic potential without the use of performance-enhancing drugs. Strength score 100. </div>\n</div>\n<div class="strength-classification"><div class="classification-name"><i class="fa fa-circle elite"></i> <strong>Elite:</strong></i>\n</div>\n<div class="classification-description">Lifters in this category are competitive at the national level. Those at this level have typically spent a lifetime of rigorous and structured training and dieting. Strength score 112.5. </div>\n</div>\n<div class="strength-classification"><div class="classification-name"><i class="fa fa-circle world-class"></i> <strong>World class:</strong></i>\n</div>\n<div class="classification-description">Lifters in this category are among the best in the world and compete at the international level. Those at this level are often gifted individuals who have spent a lifetime of rigorous and structured training and dieting. Strength score 125. </div>\n</div>\n</div>\n</div>\n</div>\n</div>\n'
      );
    },
  ]);
})(angular.module("standards", []));
