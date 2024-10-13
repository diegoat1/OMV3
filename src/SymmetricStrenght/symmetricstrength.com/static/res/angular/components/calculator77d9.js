(function (module) {
  module.controller("IdealBodyweightController", function () {
    "use strict";
    var _this = this;
    _this.state = {
      resultsShown: false,
      unitSystem: "Imperial",
      sex: "Male",
      feet: null,
      inches: null,
      centimeters: null,
    };
    var resetErrors = function () {
      _this.state.errors = {
        errorList: [],
        feet: false,
        inches: false,
        centimeters: false,
      };
    };
    resetErrors();
    var resetResults = function () {
      _this.state.results = {
        unitSystem: "Imperial",
        sex: "Male",
        male: {
          maximumMuscularPotential55: null,
          maximumMuscularPotential8: null,
          maximumMuscularPotential10: null,
          maximumMuscularPotential12: null,
          maximumMuscularPotential15: null,
          powerlifting: null,
          powerliftingIPF: null,
          weightlifting: null,
          mma: null,
          bodybuilding: null,
          classicBodybuilding: null,
          fitnessBodybuilding: null,
          marathoning: null,
          sprinting: null,
        },
        female: {
          maximumMuscularPotential12: null,
          maximumMuscularPotential15: null,
          maximumMuscularPotential18: null,
          maximumMuscularPotential21: null,
          maximumMuscularPotential24: null,
          powerlifting: null,
          powerliftingIPF: null,
          weightlifting: null,
          figureFitnessBodybuilding: null,
          bikiniBodybuilding: null,
          marathoning: null,
          sprinting: null,
        },
      };
    };
    resetResults();
    _this.calculateIdealBodyweight = function () {
      resetErrors();
      resetResults();
      var fieldsAreValid = function () {
        var valid = true;
        var invalidFeet = !_this.state.feet || _this.state.feet < 0;
        var invalidInches =
          _this.state.inches === null ||
          _this.state.inches === undefined ||
          _this.state.inches < 0;
        if (
          _this.state.unitSystem === "Imperial" &&
          (invalidFeet || invalidInches)
        ) {
          valid = false;
          if (invalidFeet) {
            _this.state.errors.feet = true;
          }
          if (invalidInches) {
            _this.state.errors.inches = true;
          }
          _this.state.errors.errorList.push("Enter your height.");
        } else if (
          _this.state.unitSystem === "Metric" &&
          (!_this.state.centimeters || _this.state.centimeters < 1)
        ) {
          valid = false;
          _this.state.errors.centimeters = true;
          _this.state.errors.errorList.push("Enter your height.");
        }
        if (!valid) {
          _this.state.resultsShown = false;
        }
        return valid;
      };
      if (fieldsAreValid()) {
        _this.state.results.unitSystem = _this.state.unitSystem;
        _this.state.results.sex = _this.state.sex;
        var height = 0;
        if (_this.state.unitSystem === "Metric") {
          height = _this.state.centimeters;
        } else {
          height = _this.state.feet * 12 + _this.state.inches;
        }
        if (_this.state.sex === "Male") {
          _this.state.results.male.maximumMuscularPotential55 = Strength.mround(
            Strength.idealWeightMaleMaximumMuscularPotential(
              _this.state.unitSystem,
              height,
              5.5
            ),
            1
          );
          _this.state.results.male.maximumMuscularPotential8 = Strength.mround(
            Strength.idealWeightMaleMaximumMuscularPotential(
              _this.state.unitSystem,
              height,
              8
            ),
            1
          );
          _this.state.results.male.maximumMuscularPotential10 = Strength.mround(
            Strength.idealWeightMaleMaximumMuscularPotential(
              _this.state.unitSystem,
              height,
              10
            ),
            1
          );
          _this.state.results.male.maximumMuscularPotential12 = Strength.mround(
            Strength.idealWeightMaleMaximumMuscularPotential(
              _this.state.unitSystem,
              height,
              12
            ),
            1
          );
          _this.state.results.male.maximumMuscularPotential15 = Strength.mround(
            Strength.idealWeightMaleMaximumMuscularPotential(
              _this.state.unitSystem,
              height,
              15
            ),
            1
          );
          _this.state.results.male.powerlifting = Strength.mround(
            Strength.idealWeightMalePowerlifting(
              _this.state.unitSystem,
              height
            ),
            1
          );
          _this.state.results.male.powerliftingIPF = Strength.mround(
            Strength.idealWeightMalePowerliftingIPF(
              _this.state.unitSystem,
              height
            ),
            1
          );
          _this.state.results.male.weightlifting = Strength.mround(
            Strength.idealWeightMaleWeightlifting(
              _this.state.unitSystem,
              height
            ),
            1
          );
          _this.state.results.male.mma = Strength.mround(
            Strength.idealWeightMaleMMA(_this.state.unitSystem, height),
            1
          );
          _this.state.results.male.bodybuilding = Strength.mround(
            Strength.idealWeightMaleBodybuilding(
              _this.state.unitSystem,
              height
            ),
            1
          );
          _this.state.results.male.classicBodybuilding = Strength.mround(
            Strength.idealWeightMaleClassicBodybuilding(
              _this.state.unitSystem,
              height
            ),
            1
          );
          _this.state.results.male.fitnessBodybuilding = Strength.mround(
            Strength.idealWeightMaleFitnessBodybuilding(
              _this.state.unitSystem,
              height
            ),
            1
          );
          _this.state.results.male.marathoning = Strength.mround(
            Strength.idealWeightMaleMarathoner(_this.state.unitSystem, height),
            1
          );
          _this.state.results.male.sprinting = Strength.mround(
            Strength.idealWeightMaleSprinter(_this.state.unitSystem, height),
            1
          );
        } else {
          _this.state.results.female.maximumMuscularPotential12 =
            Strength.mround(
              Strength.idealWeightFemaleMaximumMuscularPotential(
                _this.state.unitSystem,
                height,
                12
              ),
              1
            );
          _this.state.results.female.maximumMuscularPotential15 =
            Strength.mround(
              Strength.idealWeightFemaleMaximumMuscularPotential(
                _this.state.unitSystem,
                height,
                15
              ),
              1
            );
          _this.state.results.female.maximumMuscularPotential18 =
            Strength.mround(
              Strength.idealWeightFemaleMaximumMuscularPotential(
                _this.state.unitSystem,
                height,
                18
              ),
              1
            );
          _this.state.results.female.maximumMuscularPotential21 =
            Strength.mround(
              Strength.idealWeightFemaleMaximumMuscularPotential(
                _this.state.unitSystem,
                height,
                21
              ),
              1
            );
          _this.state.results.female.maximumMuscularPotential24 =
            Strength.mround(
              Strength.idealWeightFemaleMaximumMuscularPotential(
                _this.state.unitSystem,
                height,
                24
              ),
              1
            );
          _this.state.results.female.powerlifting = Strength.mround(
            Strength.idealWeightFemalePowerlifting(
              _this.state.unitSystem,
              height
            ),
            1
          );
          _this.state.results.female.powerliftingIPF = Strength.mround(
            Strength.idealWeightFemalePowerliftingIPF(
              _this.state.unitSystem,
              height
            ),
            1
          );
          _this.state.results.female.weightlifting = Strength.mround(
            Strength.idealWeightFemaleWeightlifting(
              _this.state.unitSystem,
              height
            ),
            1
          );
          _this.state.results.female.figureFitnessBodybuilding =
            Strength.mround(
              Strength.idealWeightFemaleFigureFitnessBodybuilding(
                _this.state.unitSystem,
                height
              ),
              1
            );
          _this.state.results.female.bikiniBodybuilding = Strength.mround(
            Strength.idealWeightFemaleBikiniBodybuilding(
              _this.state.unitSystem,
              height
            ),
            1
          );
          _this.state.results.female.marathoning = Strength.mround(
            Strength.idealWeightFemaleMarathoner(
              _this.state.unitSystem,
              height
            ),
            1
          );
          _this.state.results.female.sprinting = Strength.mround(
            Strength.idealWeightFemaleSprinter(_this.state.unitSystem, height),
            1
          );
        }
        _this.state.resultsShown = true;
        if (window.location.href.match(/symmetricstrength\.com/)) {
          ga("send", "event", "button", "click", "calculate_ideal_bodyweight");
        }
      }
    };
    _this.displayUnits = function (singular) {
      return Strength.displayUnits(_this.state.results.unitSystem, singular);
    };
  });
  module.directive("idealbodyweight", function () {
    "use strict";
    return {
      restrict: "E",
      templateUrl: "idealbodyweight",
      controller: "IdealBodyweightController",
      controllerAs: "idealBodyweightCtrl",
    };
  });
  module.controller("OneRepMaxController", function () {
    "use strict";
    var _this = this;
    _this.state = { resultsShown: false, weight: null, reps: null };
    var resetErrors = function () {
      _this.state.errors = { errorList: [], weight: false, reps: false };
    };
    resetErrors();
    var resetResults = function () {
      _this.state.results = { oneRepMax: null, repMaxes: [] };
    };
    resetResults();
    _this.calculateOneRepMax = function () {
      resetErrors();
      resetResults();
      var fieldsAreValid = function () {
        var valid = true;
        if (!_this.state.weight || _this.state.weight < 0) {
          valid = false;
          _this.state.errors.weight = true;
          _this.state.errors.errorList.push("Enter the weight lifted.");
        }
        if (
          !_this.state.reps ||
          _this.state.reps < 1 ||
          _this.state.reps > 10
        ) {
          valid = false;
          _this.state.errors.reps = true;
          _this.state.errors.errorList.push("Enter between 1 and 10 reps.");
        }
        if (!valid) {
          _this.state.resultsShown = false;
        }
        return valid;
      };
      if (fieldsAreValid()) {
        _this.state.results.oneRepMax = Strength.mround(
          Strength.oneRepMax(_this.state.weight, _this.state.reps),
          1
        );
        _this.state.resultsShown = true;
        for (var i = 1; i <= 10; i++) {
          var rm = Strength.mround(
            Strength.nRepMax(i, _this.state.weight, _this.state.reps),
            1
          );
          _this.state.results.repMaxes.push({ title: i + "RM", weight: rm });
        }
        if (window.location.href.match(/symmetricstrength\.com/)) {
          ga("send", "event", "button", "click", "calculate_1rm");
        }
      }
    };
  });
  module.directive("onerepmax", function () {
    "use strict";
    return {
      restrict: "E",
      templateUrl: "onerepmax",
      controller: "OneRepMaxController",
      controllerAs: "oneRepMaxCtrl",
    };
  });
  module.controller("TDEEController", function () {
    "use strict";
    var _this = this;
    _this.state = {
      resultsShown: false,
      unitSystem: "Imperial",
      sex: "Male",
      age: null,
      feet: null,
      inches: null,
      centimeters: null,
      weight: null,
      bodyfat: null,
      activityLevel: "Average",
    };
    var resetErrors = function () {
      _this.state.errors = {
        errorList: [],
        age: false,
        feet: false,
        inches: false,
        centimeters: false,
        bodyweight: false,
      };
    };
    resetErrors();
    var resetResults = function () {
      _this.state.results = {
        tdee: null,
        cutSuperSlowCalories: null,
        cutSlowCalories: null,
        cutFastCalories: null,
        cutSuperFastCalories: null,
        bulkSuperSlowCalories: null,
        bulkSlowCalories: null,
        bulkFastCalories: null,
        bulkSuperFastCalories: null,
      };
    };
    resetResults();
    _this.calculateTDEE = function () {
      resetErrors();
      resetResults();
      var fieldsAreValid = function () {
        var valid = true;
        if (!_this.state.age || _this.state.age < 0) {
          valid = false;
          _this.state.errors.age = true;
          _this.state.errors.errorList.push("Enter your age.");
        }
        if (!_this.state.bodyweight || _this.state.bodyweight <= 0) {
          valid = false;
          _this.state.errors.bodyweight = true;
          _this.state.errors.errorList.push("Enter your body weight.");
        }
        var invalidFeet = !_this.state.feet || _this.state.feet < 0;
        var invalidInches =
          _this.state.inches === null ||
          _this.state.inches === undefined ||
          _this.state.inches < 0;
        if (
          _this.state.unitSystem === "Imperial" &&
          (invalidFeet || invalidInches)
        ) {
          valid = false;
          if (invalidFeet) {
            _this.state.errors.feet = true;
          }
          if (invalidInches) {
            _this.state.errors.inches = true;
          }
          _this.state.errors.errorList.push("Enter your height.");
        } else if (
          _this.state.unitSystem === "Metric" &&
          (!_this.state.centimeters || _this.state.centimeters < 1)
        ) {
          valid = false;
          _this.state.errors.centimeters = true;
          _this.state.errors.errorList.push("Enter your height.");
        }
        if (!valid) {
          _this.state.resultsShown = false;
        }
        return valid;
      };
      if (fieldsAreValid()) {
        var height = 0;
        if (_this.state.unitSystem === "Metric") {
          height = _this.state.centimeters;
        } else {
          height = _this.state.feet * 12 + _this.state.inches;
        }
        _this.state.results.tdee = Strength.mround(
          Strength.tdee(
            _this.state.unitSystem,
            _this.state.sex,
            _this.state.bodyweight,
            _this.state.age,
            height,
            _this.state.activityLevel,
            _this.state.bodyfat
          ),
          1
        );
        _this.state.results.cutSuperSlowCalories =
          _this.state.results.tdee - 250;
        _this.state.results.cutSlowCalories = _this.state.results.tdee - 500;
        _this.state.results.cutFastCalories = _this.state.results.tdee - 750;
        _this.state.results.cutSuperFastCalories =
          _this.state.results.tdee - 1000;
        _this.state.results.bulkSuperSlowCalories =
          _this.state.results.tdee + 250;
        _this.state.results.bulkSlowCalories = _this.state.results.tdee + 500;
        _this.state.results.bulkFastCalories = _this.state.results.tdee + 750;
        _this.state.results.bulkSuperFastCalories =
          _this.state.results.tdee + 1000;
        _this.state.resultsShown = true;
        if (window.location.href.match(/symmetricstrength\.com/)) {
          ga("send", "event", "button", "click", "calculate_tdee");
        }
      }
    };
    _this.displayUnits = function (singular) {
      return Strength.displayUnits(_this.state.unitSystem, singular);
    };
    _this.showLbs = function (lbs) {
      if (_this.state.unitSystem === "Metric") {
        var kg = lbs * 0.453592;
        return Math.round(kg * 10) / 10 + " kg";
      } else {
        if (lbs === 1) {
          return "1 lb";
        } else {
          return lbs + " lbs";
        }
      }
    };
  });
  module.directive("tdee", function () {
    "use strict";
    return {
      restrict: "E",
      templateUrl: "tdee",
      controller: "TDEEController",
      controllerAs: "tdeeCtrl",
    };
  });
  module.controller("WilksController", function () {
    "use strict";
    var _this = this;
    _this.state = {
      resultsShown: false,
      unitSystem: "Imperial",
      sex: "Male",
      bodyweight: null,
      liftFields: {
        backSquat: { weight: null, reps: 1 },
        benchPress: { weight: null, reps: 1 },
        deadlift: { weight: null, reps: 1 },
      },
    };
    var resetErrors = function () {
      _this.state.errors = {
        errorList: [],
        bodyweight: false,
        backSquat: { weight: false, reps: false },
        benchPress: { weight: false, reps: false },
        deadlift: { weight: false, reps: false },
      };
    };
    resetErrors();
    var resetResults = function () {
      _this.state.results = {
        backSquat1RM: null,
        benchPress1RM: null,
        deadlift1RM: null,
        total: null,
        wilks: null,
        estimated: false,
      };
    };
    resetResults();
    var preFill = function () {
      $("#form-back-squat-reps").addClass("edited");
      $("#form-bench-press-reps").addClass("edited");
      $("#form-deadlift-reps").addClass("edited");
    };
    preFill();
    _this.calculateWilks = function () {
      resetErrors();
      resetResults();
      var fieldsAreValid = function () {
        var valid = true;
        if (!_this.state.bodyweight || _this.state.bodyweight <= 0) {
          valid = false;
          _this.state.errors.bodyweight = true;
          _this.state.errors.errorList.push("Enter your body weight.");
        }
        if (
          !_this.state.liftFields.backSquat.weight ||
          _this.state.liftFields.backSquat.weight < 0
        ) {
          valid = false;
          _this.state.errors.backSquat.weight = true;
          _this.state.errors.errorList.push("Enter back squat weight.");
        }
        if (
          !_this.state.liftFields.backSquat.reps ||
          _this.state.liftFields.backSquat.reps < 1 ||
          _this.state.liftFields.backSquat.reps > 10
        ) {
          valid = false;
          _this.state.errors.backSquat.reps = true;
          _this.state.errors.errorList.push(
            "Enter between 1 and 10 back squat reps."
          );
        }
        if (
          !_this.state.liftFields.benchPress.weight ||
          _this.state.liftFields.benchPress.weight < 0
        ) {
          valid = false;
          _this.state.errors.benchPress.weight = true;
          _this.state.errors.errorList.push("Enter bench press weight.");
        }
        if (
          !_this.state.liftFields.benchPress.reps ||
          _this.state.liftFields.benchPress.reps < 1 ||
          _this.state.liftFields.benchPress.reps > 10
        ) {
          valid = false;
          _this.state.errors.benchPress.reps = true;
          _this.state.errors.errorList.push(
            "Enter between 1 and 10 bench press reps."
          );
        }
        if (
          !_this.state.liftFields.deadlift.weight ||
          _this.state.liftFields.deadlift.weight < 0
        ) {
          valid = false;
          _this.state.errors.deadlift.weight = true;
          _this.state.errors.errorList.push("Enter deadlift weight.");
        }
        if (
          !_this.state.liftFields.deadlift.reps ||
          _this.state.liftFields.deadlift.reps < 1 ||
          _this.state.liftFields.deadlift.reps > 10
        ) {
          valid = false;
          _this.state.errors.deadlift.reps = true;
          _this.state.errors.errorList.push(
            "Enter between 1 and 10 deadlift reps."
          );
        }
        if (!valid) {
          _this.state.resultsShown = false;
        }
        return valid;
      };
      if (fieldsAreValid()) {
        _this.state.results.backSquat1RM = Strength.mround(
          Strength.oneRepMax(
            _this.state.liftFields.backSquat.weight,
            _this.state.liftFields.backSquat.reps
          ),
          1
        );
        _this.state.results.benchPress1RM = Strength.mround(
          Strength.oneRepMax(
            _this.state.liftFields.benchPress.weight,
            _this.state.liftFields.benchPress.reps
          ),
          1
        );
        _this.state.results.deadlift1RM = Strength.mround(
          Strength.oneRepMax(
            _this.state.liftFields.deadlift.weight,
            _this.state.liftFields.deadlift.reps
          ),
          1
        );
        _this.state.results.total = Strength.mround(
          _this.state.results.backSquat1RM +
            _this.state.results.benchPress1RM +
            _this.state.results.deadlift1RM,
          1
        );
        _this.state.results.wilks = Strength.mround(
          Strength.wilks(
            _this.state.unitSystem,
            _this.state.sex,
            _this.state.bodyweight,
            _this.state.results.total
          ),
          1
        );
        _this.state.results.estimated =
          _this.state.liftFields.backSquat.reps > 1 ||
          _this.state.liftFields.benchPress.reps > 1 ||
          _this.state.liftFields.deadlift.reps > 1;
        _this.state.resultsShown = true;
        if (window.location.href.match(/symmetricstrength\.com/)) {
          ga("send", "event", "button", "click", "calculate_wilks");
        }
      }
    };
    _this.displayUnits = function (singular) {
      return Strength.displayUnits(_this.state.unitSystem, singular);
    };
  });
  module.directive("wilks", function () {
    "use strict";
    return {
      restrict: "E",
      templateUrl: "wilks",
      controller: "WilksController",
      controllerAs: "wilksCtrl",
    };
  });
  module.run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "idealbodyweight",
        '<div class="page-container"><div class="page-head"><div class="container"><div class="page-title"><h1>Ideal Bodyweight Calculator <small>Find your ideal bodyweight based on your height and fitness goals</small></h1></h1>\n</div>\n</div>\n</div>\n<div class="page-content"><div class="container"><div class="row"><div class="col-md-12"><div class="portlet light"><div class="portlet-body"><form role="form" name="mainForm" novalidate><div class="col-md-12"><div class="row"><div class="form-group form-md-line-input form-md-floating-label col-md-3 unit-system"><select class="form-control edited" id="form-unit-system" ng-model="idealBodyweightCtrl.state.unitSystem"><option value="Imperial">Imperial</option>\n<option value="Metric">Metric</option>\n</select>\n<label for="form-unit-system">Units</label>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-2"><select class="form-control edited" id="form-sex" ng-model="idealBodyweightCtrl.state.sex"><option value="Male">Male</option>\n<option value="Female">Female</option>\n</select>\n<label for="form-sex">Sex</label>\n</div>\n</div>\n<div class="row" ng-if="idealBodyweightCtrl.state.unitSystem === \'Metric\'"><div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\': idealBodyweightCtrl.state.errors.centimeters}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':idealBodyweightCtrl.state.centimeters != null}" ng-model="idealBodyweightCtrl.state.centimeters" name="centimeters" required>\n<span class="input-group-addon">cm</span>\n<label for="form-centimeters">Height</label>\n</div>\n<span class="help-block">Enter your height.</span>\n</div>\n</div>\n<div class="row" ng-if="idealBodyweightCtrl.state.unitSystem === \'Imperial\'"><div class="form-group form-md-line-input form-md-floating-label col-xs-6 col-md-3 col-lg-2" ng-class="{\'has-error\': idealBodyweightCtrl.state.errors.feet}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':idealBodyweightCtrl.state.feet != null}" ng-model="idealBodyweightCtrl.state.feet" name="feet" required>\n<span class="input-group-addon">ft</span>\n<label for="form-feet">Feet</label>\n</div>\n<span class="help-block">Enter your height (feet).</span>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-xs-6 col-md-3 col-lg-2" ng-class="{\'has-error\': idealBodyweightCtrl.state.errors.inches}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':idealBodyweightCtrl.state.inches != null}" ng-model="idealBodyweightCtrl.state.inches" name="inches" required>\n<span class="input-group-addon">in</span>\n<label for="form-body-weight">Inches</label>\n</div>\n<span class="help-block">Enter your height (inches).</span>\n</div>\n</div>\n<div class="row"><button class="btn btn-primary btn-lg red-sunglo" type="submit" ng-click="idealBodyweightCtrl.calculateIdealBodyweight()">Calculate Ideal Bodyweight</button>\n<div class="alert alert-block alert-danger error-panel" ng-if="idealBodyweightCtrl.state.errors.errorList.length > 0"><h4 class="alert-heading">Please correct the following and try again:</h4>\n<ul><li ng-repeat="error in idealBodyweightCtrl.state.errors.errorList" ng-bind="error"></li>\n</ul>\n</div>\n</div>\n</div>\n</form>\n</div>\n</div>\n</div>\n</div>\n<div ng-if="idealBodyweightCtrl.state.resultsShown"><div class="row"><div class="col-md-12"><div class="portlet light"><div class="portlet-body"><div ng-if="idealBodyweightCtrl.state.results.sex === \'Male\'"><div class="row"><div class="col-md-12"><h2>Maximum muscular potential for drug-free athletes <small>The maximum bodyweight at the following body fat percentages for average men at your height.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.maximumMuscularPotential55}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} at 5.5% body fat</span>\n</div>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.maximumMuscularPotential8}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} at 8% body fat</span>\n</div>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.maximumMuscularPotential10}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} at 10% body fat</span>\n</div>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.maximumMuscularPotential12}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} at 12% body fat</span>\n</div>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.maximumMuscularPotential15}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} at 15% body fat</span>\n</div>\n</div>\n</div>\n<div class="note"><p>The weights listed above were calculated using Martin Berkhan\'s formula in his article <a href="http://www.leangains.com/2010/12/maximum-muscular-potential.html">here</a>. The weights at the lower bodyfat percentages are heavily supported by research using the fat free mass index (FFMI), although athletes at higher bodyfat percentages may be able to reach higher FFMIs. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Powerlifting <small>The average weight of elite raw powerlifters at your height.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.powerlifting}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} (Most federations)</span>\n</div>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.powerliftingIPF}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} (IPF)</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off powerlifting weight classes and powerlifting records. Note that there is some variation at elite levels of powerlifting; in addition, the weight above is the "weigh-in" weight. Most high-level competitors will weigh more prior to the competition and quickly drop weight to meet their weight class. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Olympic Weightlifting <small>The average weight of elite weightlifters at your height.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.weightlifting}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off weightlifting weight classes and weightlifting records. Note that there is some variation at elite levels of weightlifting; in addition, the weight above is the "weigh-in" weight. Most high-level competitors will weigh more prior to the competition and quickly drop weight to meet their weight class. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Mixed Martial Arts <small>The average weight of elite MMA fighters at your height.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.mma}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off UFC weight classes and records. Note that the weight above is the "weigh-in" weight. High-level competitors will weigh dramatically more prior to the competition and quickly drop weight to meet their weight class. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Bodybuilding <small>The average weight of elite bodybuilders at your height.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.bodybuilding}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off Mr. Olympia records in the last 15 years. Note that there is significant variation of weight at elite levels of bodybuilding. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Bodybuilding, IFBB Classic Division <small>The ideal weight at your height to compete in the IFBB Classic division.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.classicBodybuilding}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off the IFBB Classic division height classes and weight limits. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Bodybuilding, IFBB Fitness Division <small>The ideal weight at your height to compete in the IFBB Fitness division.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.fitnessBodybuilding}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off the IFBB Fitness division height classes and weight limits. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Marathon running <small>The ideal weight at your height to compete in marathons.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.marathoning}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off the average weights of world record marathon runners at your height. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Sprinting <small>The ideal weight at your height to compete as a 100m sprinter.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.male.sprinting}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off the average weights of world record 100 meter sprinters at your height. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n</div>\n<div ng-if="idealBodyweightCtrl.state.results.sex === \'Female\'"><div class="row"><div class="col-md-12"><h2>Maximum muscular potential for drug-free athletes <small>The estimated maximum bodyweight at the following body fat percentages for women at your height.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.maximumMuscularPotential12}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} at 12% body fat</span>\n</div>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.maximumMuscularPotential15}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} at 15% body fat</span>\n</div>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.maximumMuscularPotential18}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} at 18% body fat</span>\n</div>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.maximumMuscularPotential21}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} at 21% body fat</span>\n</div>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.maximumMuscularPotential24}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} at 24% body fat</span>\n</div>\n</div>\n</div>\n<div class="note"><p>The weight and body fat combinations above would put a woman at your height in the 99.9th percentile for fat-free muscle mass (FFMI). Athletes at higher bodyfat percentages may be able to reach higher FFMIs. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Powerlifting <small>The average weight of elite raw powerlifters at your height.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.powerlifting}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} (Most federations)</span>\n</div>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.powerliftingIPF}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}} (IPF)</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off powerlifting weight classes and powerlifting records. Note that there is some variation at elite levels of powerlifting. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Olympic Weightlifting <small>The average weight of elite weightlifters at your height.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.weightlifting}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off weightlifting weight classes and weightlifting records. Note that there is some variation in bodyweight at elite levels of weightlifting. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Bodybuilding, IFBB Figure and Fitness Divisions <small>The ideal weight at your height to compete in the IFBB Figure or Fitness divisions.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.figureFitnessBodybuilding}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off the average weight of women\'s figure and fitness competitors with NPC or IFBB pro cards at your height. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Bodybuilding, IFBB Bikini Division <small>The ideal weight at your height to compete in the IFBB Bikini division.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.bikiniBodybuilding}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off the average weight of bikini competitors with NPC or IFBB pro cards at your height. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Marathon running <small>The ideal weight at your height to compete in marathons.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.marathoning}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off the average weights of world record marathon runners at your height. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n<div class="row"><div class="col-md-12"><h2>Sprinting <small>The ideal weight at your height to compete as a 100m sprinter.</small></h2></h2>\n</div>\n</div>\n<div class="row list-separated more-stats-items"><div class="col-md-12"><div class="font-massive font-red-flamingo">{{idealBodyweightCtrl.state.results.female.sprinting}}<span class="font-hg font-grey-mint">&nbsp;{{idealBodyweightCtrl.displayUnits()}}</span>\n</div>\n</div>\n</div>\n<div class="note"><p>This weight is based off the average weights of world record 100 meter sprinters at your height. See the <a href="/about#references">references</a> section for more information.</p>\n</div>\n</div>\n<div class="note note-info"><p><strong>Tip:</strong>\nSee the <a href="/calculator/tdee">Total Daily Energy Expenditure calculator</a> to find out how many calories to eat each day in order to lose or gain weight.</p>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "onerepmax",
        '<div class="page-container"><div class="page-head"><div class="container"><div class="page-title"><h1>1RM Calculator</h1></h1>\n</div>\n</div>\n</div>\n<div class="page-content"><div class="container"><div class="row"><div class="col-md-12"><div class="portlet light"><div class="portlet-body"><form role="form" name="mainForm" novalidate><div class="col-md-12"><div class="row"><div class="form-group form-md-line-input form-md-floating-label col-xs-6 col-md-3 col-lg-2" ng-class="{\'has-error\':oneRepMaxCtrl.state.errors.weight}"><div class="input-group full-width"><input class="form-control" type="number" ng-class="{\'edited\': oneRepMaxCtrl.state.weight != null}" id="form-weight" ng-model="oneRepMaxCtrl.state.weight" required>\n<label for="form-weight">Weight</label>\n</div>\n<span class="help-block">Enter the weight.</span>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-xs-6 col-md-2" ng-class="{\'has-error\':oneRepMaxCtrl.state.errors.reps}"><div class="input-group left-addon"><span class="input-group-addon"><i class="fa fa-times"></i>\n</span>\n<input class="form-control" type="number" ng-class="{\'edited\': oneRepMaxCtrl.state.reps != null}" id="form-back-squat-reps" ng-model="oneRepMaxCtrl.state.reps" required>\n<label for="form-back-squat-reps">Reps</label>\n</div>\n<span class="help-block">Enter the rep count.</span>\n</div>\n</div>\n<div class="row"><button class="btn btn-primary btn-lg red-sunglo" type="submit" ng-click="oneRepMaxCtrl.calculateOneRepMax()">Calculate 1RM</button>\n<div class="alert alert-block alert-danger error-panel" ng-if="oneRepMaxCtrl.state.errors.errorList.length > 0"><h4 class="alert-heading">Please correct the following and try again:</h4>\n<ul><li ng-repeat="error in oneRepMaxCtrl.state.errors.errorList" ng-bind="error"></li>\n</ul>\n</div>\n</div>\n</div>\n</form>\n</div>\n</div>\n</div>\n</div>\n<div ng-show="oneRepMaxCtrl.state.resultsShown"><div class="row"><div class="col-md-12"><div class="portlet light"><div class="portlet-body"><div class="row list-separated more-stats-items"><div class="col-md-3 col-xs-6"><div class="item-name font-grey-mint font-lg">1RM</div>\n<div class="font-massive font-red-flamingo">{{oneRepMaxCtrl.state.results.oneRepMax}}</div>\n</div>\n</div>\n<p>Below is a table of other estimated rep maxes:</p>\n<table class="table table-striped table-bordered table-hover"><thead><tr><th>Rep Max</th>\n<th>Weight</th>\n</tr>\n</thead>\n<tbody><tr ng-repeat="rm in oneRepMaxCtrl.state.results.repMaxes"><td>{{rm.title}}</td>\n<td>{{rm.weight}}</td>\n</tr>\n</tbody>\n</table>\n<div class="note note-info"><p>Symmetric Strength uses Wathan\'s formula for all rep max calculations. A study on the accuracy of seven different rep max prediction formulas found Wathan\'s formula to be the most accurate. See the <a href="/about#references">References</a> section for more information.</p>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "tdee",
        '<div class="page-container"><div class="page-head"><div class="container"><div class="page-title"><h1>TDEE Calculator <small>Calculate your total daily energy expenditure (how many calories you burn per day)</small></h1></h1>\n</div>\n</div>\n</div>\n<div class="page-content"><div class="container"><div class="row"><div class="col-md-12"><div class="portlet light"><div class="portlet-body"><form role="form" name="mainForm" novalidate><div class="col-md-12"><div class="row"><div class="form-group form-md-line-input form-md-floating-label col-md-3 unit-system"><select class="form-control edited" id="form-unit-system" ng-model="tdeeCtrl.state.unitSystem"><option value="Imperial">Imperial</option>\n<option value="Metric">Metric</option>\n</select>\n<label for="form-unit-system">Units</label>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-2"><select class="form-control edited" id="form-sex" ng-model="tdeeCtrl.state.sex"><option value="Male">Male</option>\n<option value="Female">Female</option>\n</select>\n<label for="form-sex">Sex</label>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\': tdeeCtrl.state.errors.age}"><div class="input-group full-width"><input class="form-control" type="number" ng-class="{\'edited\':tdeeCtrl.state.age != null}" ng-model="tdeeCtrl.state.age" name="age" required>\n<label for="form-age">Age</label>\n</div>\n<span class="help-block">Enter your age.</span>\n</div>\n</div>\n<div class="row"><div class="form-group form-md-line-input form-md-floating-label col-md-8 col-lg-6"><select class="form-control edited" id="form-activity-level" ng-model="tdeeCtrl.state.activityLevel"><option value="Inactive">Extremely inactive (bed-ridden)</option>\n<option value="Sedentary">Sedentary (office worker, little or no exercise)</option>\n<option value="Average">Average (some exercise throughout the week)</option>\n<option value="Moderately active">Moderately active (physical job or an hour of exercise daily)</option>\n<option value="Vigorously active">Vigorously active (very physical job or two hours of exercise daily)</option>\n<option value="Extremely active">Extremely active (competitive endurance athlete)</option>\n</select>\n<label for="form-activity-level">Activity Level</label>\n</div>\n</div>\n<div class="row"><div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\': tdeeCtrl.state.errors.bodyweight}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':tdeeCtrl.state.bodyweight != null}" ng-model="tdeeCtrl.state.bodyweight" name="bodyweight" required>\n<span class="input-group-addon" ng-bind="tdeeCtrl.displayUnits()"></span>\n<label for="form-body-weight">Body weight</label>\n</div>\n<span class="help-block">Enter your body weight.</span>\n</div>\n</div>\n<div class="row" ng-if="tdeeCtrl.state.unitSystem === \'Metric\'"><div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\': tdeeCtrl.state.errors.centimeters}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':tdeeCtrl.state.centimeters != null}" ng-model="tdeeCtrl.state.centimeters" name="centimeters" required>\n<span class="input-group-addon">cm</span>\n<label for="form-centimeters">Height</label>\n</div>\n<span class="help-block">Enter your height.</span>\n</div>\n</div>\n<div class="row" ng-if="tdeeCtrl.state.unitSystem === \'Imperial\'"><div class="form-group form-md-line-input form-md-floating-label col-xs-6 col-md-3 col-lg-2" ng-class="{\'has-error\': tdeeCtrl.state.errors.feet}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':tdeeCtrl.state.feet != null}" ng-model="tdeeCtrl.state.feet" name="feet" required>\n<span class="input-group-addon">ft</span>\n<label for="form-feet">Feet</label>\n</div>\n<span class="help-block">Enter your height (feet).</span>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-xs-6 col-md-3 col-lg-2" ng-class="{\'has-error\': tdeeCtrl.state.errors.inches}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':tdeeCtrl.state.inches != null}" ng-model="tdeeCtrl.state.inches" name="inches" required>\n<span class="input-group-addon">in</span>\n<label for="form-body-weight">Inches</label>\n</div>\n<span class="help-block">Enter your height (inches).</span>\n</div>\n</div>\n<div class="row"><div class="form-group form-md-line-input form-md-floating-label col-md-3"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':tdeeCtrl.state.bodyfat != null}" ng-model="tdeeCtrl.state.bodyfat" name="bodyfat">\n<span class="input-group-addon">%</span>\n<label for="form-bodyfat">Body fat (optional)</label>\n</div>\n</div>\n</div>\n<div class="row"><div class="col-md-12"><div class="note"><strong>Note:</strong>\nEntering your body fat percentage is optional and is only used to fine-tune your TDEE estimate.</div>\n</div>\n</div>\n<div class="row"><button class="btn btn-primary btn-lg red-sunglo" type="submit" ng-click="tdeeCtrl.calculateTDEE()">Calculate TDEE</button>\n<div class="alert alert-block alert-danger error-panel" ng-if="tdeeCtrl.state.errors.errorList.length > 0"><h4 class="alert-heading">Please correct the following and try again:</h4>\n<ul><li ng-repeat="error in tdeeCtrl.state.errors.errorList" ng-bind="error"></li>\n</ul>\n</div>\n</div>\n</div>\n</form>\n</div>\n</div>\n</div>\n</div>\n<div ng-show="tdeeCtrl.state.resultsShown"><div class="row"><div class="col-md-12"><div class="portlet light"><div class="portlet-body"><div class="row list-separated more-stats-items"><div class="col-md-3 col-xs-6"><div class="item-name font-grey-mint font-lg">TDEE</div>\n<div class="font-massive font-red-flamingo">{{tdeeCtrl.state.results.tdee}}<span class="font-hg font-grey-mint">&nbsp;calories</span>\n</div>\n</div>\n</div>\n<p>The TDEE above is the amount of calories you need to eat in order to maintain your current weight. Below are caloric intake suggestions to lose or gain weight:</p>\n<div class="row list-separated more-stats-items"><div class="col-md-3 col-xs-6"><div class="item-name font-grey-mint font-md">Lose {{ tdeeCtrl.showLbs(0.5) }} per week</div>\n<div class="font-hg font-red-flamingo">{{tdeeCtrl.state.results.cutSuperSlowCalories}}<span class="font-md font-grey-mint">&nbsp;calories</span>\n</div>\n</div>\n<div class="col-md-3 col-xs-6"><div class="item-name font-grey-mint font-md">Lose {{ tdeeCtrl.showLbs(1) }} per week</div>\n<div class="font-hg font-red-flamingo">{{tdeeCtrl.state.results.cutSlowCalories}}<span class="font-md font-grey-mint">&nbsp;calories</span>\n</div>\n</div>\n<div class="col-md-3 col-xs-6"><div class="item-name font-grey-mint font-md">Lose {{ tdeeCtrl.showLbs(1.5) }} per week</div>\n<div class="font-hg font-red-flamingo">{{tdeeCtrl.state.results.cutFastCalories}}<span class="font-md font-grey-mint">&nbsp;calories</span>\n</div>\n</div>\n<div class="col-md-3 col-xs-6"><div class="item-name font-grey-mint font-md">Lose {{ tdeeCtrl.showLbs(2) }} per week</div>\n<div class="font-hg font-red-flamingo">{{tdeeCtrl.state.results.cutSuperFastCalories}}<span class="font-md font-grey-mint">&nbsp;calories</span>\n</div>\n</div>\n<div class="col-md-3 col-xs-6"><div class="item-name font-grey-mint font-md">Gain {{ tdeeCtrl.showLbs(0.5) }} per week</div>\n<div class="font-hg font-red-flamingo">{{tdeeCtrl.state.results.bulkSuperSlowCalories}}<span class="font-md font-grey-mint">&nbsp;calories</span>\n</div>\n</div>\n<div class="col-md-3 col-xs-6"><div class="item-name font-grey-mint font-md">Gain {{ tdeeCtrl.showLbs(1) }} per week</div>\n<div class="font-hg font-red-flamingo">{{tdeeCtrl.state.results.bulkSlowCalories}}<span class="font-md font-grey-mint">&nbsp;calories</span>\n</div>\n</div>\n<div class="col-md-3 col-xs-6"><div class="item-name font-grey-mint font-md">Gain {{ tdeeCtrl.showLbs(1.5) }} per week</div>\n<div class="font-hg font-red-flamingo">{{tdeeCtrl.state.results.bulkFastCalories}}<span class="font-md font-grey-mint">&nbsp;calories</span>\n</div>\n</div>\n<div class="col-md-3 col-xs-6"><div class="item-name font-grey-mint font-md">Gain {{ tdeeCtrl.showLbs(2) }} per week</div>\n<div class="font-hg font-red-flamingo">{{tdeeCtrl.state.results.bulkSuperFastCalories}}<span class="font-md font-grey-mint">&nbsp;calories</span>\n</div>\n</div>\n</div>\n<div class="note note-info"><p>The total daily energy expenditure above is an estimate only. To find your true energy expenditure, track your caloric intake for a period of time, then track your weight loss or weight gain and adjust accordingly.</p>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n'
      );
      $templateCache.put(
        "wilks",
        '<div class="page-container"><div class="page-head"><div class="container"><div class="page-title"><h1>Wilks Calculator <small>Calculate your powerlifting wilks score</small></h1></h1>\n</div>\n</div>\n</div>\n<div class="page-content"><div class="container"><div class="row"><div class="col-md-12"><div class="portlet light"><div class="portlet-body"><form role="form" name="mainForm" novalidate><div class="col-md-12"><div class="row"><div class="form-group form-md-line-input form-md-floating-label col-md-3 unit-system"><select class="form-control edited" id="form-unit-system" ng-model="wilksCtrl.state.unitSystem"><option value="Imperial">Imperial</option>\n<option value="Metric">Metric</option>\n</select>\n<label for="form-unit-system">Units</label>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-2"><select class="form-control edited" id="form-sex" ng-model="wilksCtrl.state.sex"><option value="Male">Male</option>\n<option value="Female">Female</option>\n</select>\n<label for="form-sex">Sex</label>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\': wilksCtrl.state.errors.bodyweight}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':wilksCtrl.state.bodyweight != null}" ng-model="wilksCtrl.state.bodyweight" name="bodyweight" required>\n<span class="input-group-addon" ng-bind="wilksCtrl.displayUnits()"></span>\n<label for="form-body-weight">Body weight</label>\n</div>\n<span class="help-block">Enter your body weight.</span>\n</div>\n</div>\n<hr>\n<div class="row"><h2>Enter your best back squat, bench press, and deadlift. <small>If you enter more than one rep, Symmetric Strength will estimate your one rep max.</small></h2></h2>\n</div>\n<div class="row"><div class="col-md-2"><h5 class="lift-title">Back Squat</h5>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\':wilksCtrl.state.errors.backSquat.weight}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':wilksCtrl.state.liftFields.backSquat.weight != null}" id="form-back-squat-weight" ng-model="wilksCtrl.state.liftFields.backSquat.weight" required>\n<span class="input-group-addon" ng-bind="wilksCtrl.displayUnits()"></span>\n<label for="form-back-squat-weight">Weight</label>\n</div>\n<span class="help-block">Enter the weight.</span>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-2" ng-class="{\'has-error\':wilksCtrl.state.errors.backSquat.reps}"><div class="input-group left-addon"><span class="input-group-addon"><i class="fa fa-times"></i>\n</span>\n<input class="form-control" type="number" ng-class="{\'edited\':wilksCtrl.state.liftFields.backSquat.reps != null}" id="form-back-squat-reps" ng-model="wilksCtrl.state.liftFields.backSquat.reps" required>\n<label for="form-back-squat-reps">Reps</label>\n</div>\n<span class="help-block">Enter the rep count.</span>\n</div>\n</div>\n<div class="row"><div class="col-md-2"><h5 class="lift-title">Bench Press</h5>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\':wilksCtrl.state.errors.benchPress.weight}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':wilksCtrl.state.liftFields.benchPress.weight != null}" id="form-bench-press-weight" ng-model="wilksCtrl.state.liftFields.benchPress.weight" required>\n<span class="input-group-addon" ng-bind="wilksCtrl.displayUnits()"></span>\n<label for="form-bench-press-weight">Weight</label>\n</div>\n<span class="help-block">Enter the weight.</span>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-2" ng-class="{\'has-error\':wilksCtrl.state.errors.benchPress.reps}"><div class="input-group left-addon"><span class="input-group-addon"><i class="fa fa-times"></i>\n</span>\n<input class="form-control" type="number" ng-class="{\'edited\':wilksCtrl.state.liftFields.benchPress.reps != null}" id="form-bench-press-reps" ng-model="wilksCtrl.state.liftFields.benchPress.reps" required>\n<label for="form-bench-press-reps">Reps</label>\n</div>\n<span class="help-block">Enter the rep count.</span>\n</div>\n</div>\n<div class="row"><div class="col-md-2"><h5 class="lift-title">Deadlift</h5>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-3 col-lg-2" ng-class="{\'has-error\':wilksCtrl.state.errors.deadlift.weight}"><div class="input-group right-addon"><input class="form-control" type="number" ng-class="{\'edited\':wilksCtrl.state.liftFields.deadlift.weight != null}" id="form-deadlift-weight" ng-model="wilksCtrl.state.liftFields.deadlift.weight" required>\n<span class="input-group-addon" ng-bind="wilksCtrl.displayUnits()"></span>\n<label for="form-deadlift-weight">Weight</label>\n</div>\n<span class="help-block">Enter the weight.</span>\n</div>\n<div class="form-group form-md-line-input form-md-floating-label col-md-2" ng-class="{\'has-error\':wilksCtrl.state.errors.deadlift.reps}"><div class="input-group left-addon"><span class="input-group-addon"><i class="fa fa-times"></i>\n</span>\n<input class="form-control" type="number" ng-class="{\'edited\':wilksCtrl.state.liftFields.deadlift.reps != null}" id="form-deadlift-reps" ng-model="wilksCtrl.state.liftFields.deadlift.reps" required>\n<label for="form-deadlift-reps">Reps</label>\n</div>\n<span class="help-block">Enter the rep count.</span>\n</div>\n</div>\n<div class="row"><button class="btn btn-primary btn-lg red-sunglo" type="submit" ng-click="wilksCtrl.calculateWilks()">Calculate Wilks</button>\n<div class="alert alert-block alert-danger error-panel" ng-if="wilksCtrl.state.errors.errorList.length > 0"><h4 class="alert-heading">Please correct the following and try again:</h4>\n<ul><li ng-repeat="error in wilksCtrl.state.errors.errorList" ng-bind="error"></li>\n</ul>\n</div>\n</div>\n</div>\n</form>\n</div>\n</div>\n</div>\n</div>\n<div ng-show="wilksCtrl.state.resultsShown"><div class="row"><div class="col-md-12"><div class="portlet light"><div class="portlet-body"><div class="row list-separated more-stats-items"><div class="col-md-3 col-xs-6"><div class="item-name font-grey-mint font-lg">Wilks</div>\n<div class="font-massive font-red-flamingo">{{wilksCtrl.state.results.wilks}}</div>\n</div>\n<div class="col-md-3 col-xs-6" bs-tooltip data-title="{{wilksCtrl.state.results.backSquat1RM}}/{{wilksCtrl.state.results.benchPress1RM}}/{{wilksCtrl.state.results.deadlift1RM}}" data-placement="top-left"><div class="item-name font-grey-mint font-lg">Total\n<i class="fa fa-info-circle"></i>\n</div>\n<div class="font-massive font-red-flamingo">{{wilksCtrl.state.results.total}}</div>\n</div>\n</div>\n<div class="alert alert-warning" ng-if="wilksCtrl.state.results.estimated"><strong>Note:</strong>\nThis wilks score is an estimate using calculated one rep maxes. For an accurate wilks score, test your one rep maxes.</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n</div>\n'
      );
    },
  ]);
})(angular.module("calculator", []));
