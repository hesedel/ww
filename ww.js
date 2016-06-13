/**
 * ...
 * @global
 */
var ww = (function() {
  'use strict';

  /**
   * ...
   * @type {object}
   * @private
   */
  var _properties = {};

  /**
   * ...
   * @constructor
   * @private
   * @param {*} value - ...
   * @param {string} path - ...
   * @param {object} context - ...
   * @property {object} context - ...
   * @property {object} id - ...
   * @property {object} path - ...
   * @property {object} type - ...
   * @property {object} value - ...
   */
  var _Property = (function() {

    /**
     * ...
     * @type {number}
     * @private
     */
    var _i = 0;

    return function(value, path, context) {
      this.context = context;
      this.id = _i;
      this.path = path;
      this.type = typeof value;
      this.value = value;
      _properties[_i] = this;
      _i += 1;
    };
  })();

  /**
   * @function
   * @param {*} value - ...
   * @returns {undefined}
   */
  _Property.prototype.update = function(value) {
    this.type = typeof value;
    this.value = value;
  };

  /**
   * ...
   * @constructor
   * @public
   */
  var Interval = (function() {

    /**
     * @type {boolean}
     * @private
     */
    var _isPaused = false;

    /**
     * ...
     * @function
     * @private
     * @returns {undefined}
     */
    function _callback() {
      if (_isPaused) {
        return;
      }
      PropertiesUnready.process();
    }

    /**
     * ...
     * @function
     * @public
     * @returns {undefined}
     */
    function pause() {
      _isPaused = true;
    }

    /**
     * ...
     * @function
     * @public
     * @returns {undefined}
     */
    function resume() {
      _isPaused = false;
    }

    setInterval(_callback, 1);

    return {
      pause: pause,
      resume: resume
    };
  })();

  /**
   * ...
   * @constructor
   * @public
   */
  var PropertiesUnready = (function() {

    /**
     * ...
     * @type {object}
     * @private
     */
    var _propertiesUnready = {};

    /**
     * ...
     * @function
     * @public
     * @returns {array}
     */
    function getIds() {
      var i;
      var ids = [];
      for (i in _propertiesUnready) {
        if (_propertiesUnready.hasOwnProperty(i)) {
          ids.push(i);
        }
      }
      return ids;
    }

    /**
     * ...
     * @function
     * @public
     * @returns {undefined}
     */
    function process() {
      var i, property, value;
      for (i in _propertiesUnready) {
        if (_propertiesUnready.hasOwnProperty(i)) {
          property = _properties[i];
          value = _getProperty(property.path, property.context);
          if ('undefined' === typeof value) {
            continue;
          }
          property.update(value);
          _propertiesUnready[i](property);
          delete _propertiesUnready[i];
        }
      }
    }

    /**
     * ...
     * @function
     * @public
     * @param {number} id - ...
     * @param {function} callback - ...
     * @returns {boolean}
     */
    function set(id, callback) {
      if ('number' !== typeof id || 'function' !== typeof callback) {
        return false;
      }
      if (!_properties[id]) {
        return false;
      }
      _propertiesUnready[id] = callback;
      return true;
    }

    return {
      getIds: getIds,
      process: process,
      set: set
    };
  })();

  /**
   * ...
   * @function
   * @private
   * @param {object} context - ...
   * @returns {object}
   */
  function _getContext(context) {
    if ('object' === typeof context || 'function' === typeof context) {
      return context;
    }
    return Ww;
  }

  /**
   * ...
   * @function
   * @private
   * @param {string} propertyPathString - ...
   * @param {object} context - ...
   * @param {*} [extendValue] - ...
   * @returns {*}
   */
  function _getProperty(propertyPathString, context, extendValue) {
    var i, property, propertyPathArray, propertyPathArrayLength, propertyPrevious, propertyString;
    var isExtend = 'undefined' !== typeof extendValue;
    propertyPrevious = context;
    propertyPathArray = propertyPathString.split('.');
    propertyPathArrayLength = propertyPathArray.length;
    for (i = 0; i < propertyPathArrayLength; i += 1) {
      propertyString = propertyPathArray[i];
      property = propertyPrevious[propertyString];
      if ('undefined' === typeof property) {
        if (isExtend) {
          propertyPrevious[propertyString] = extendValue;
          propertyPrevious = propertyPrevious[propertyString];
          continue;
        }
        return;
      }
      propertyPrevious = property;
    }
    return propertyPrevious;
  }

  /**
   * ...
   * @constructor
   * @param {_Property} property - ...
   */
  var ww = function(property) {
    var i;
    for (i in property) {
      if (property.hasOwnProperty(i)) {
        this[i] = property[i];
      }
    }
  };

  /**
   * ...
   * @todo
   * @function
   */
  //ww.prototype.apply = function() {};

  /**
   * ...
   * @todo
   * @function
   */
  //ww.prototype.call = function() {};

  /**
   * ...
   * @function
   * @param {*} [value] - ...
   * @returns {object}
   */
  ww.prototype.extend = function(value) {
    if ('undefined' === typeof value) {
      value = {};
    }
    return _getProperty(this.path, this.context, value);
  };

  /**
   * ...
   * @function
   * @returns {string}
   */
  ww.prototype.getType = function() {
    return typeof this.getValue();
  };

  /**
   * ...
   * @function
   * @param {*} [defaultValue] - ...
   * @returns {*}
   */
  ww.prototype.getValue = function(defaultValue) {
    var value = _getProperty(this.path, this.context);
    if ('undefined' !== typeof value) {
      return value;
    }
    return defaultValue;
  };

  /**
   * ...
   * @function
   * @param {function} callback - ...
   * @returns {ww}
   */
  ww.prototype.ready = function(callback) {
    if ('function' !== typeof callback) {
      return this;
    }
    if (this.type) {
      callback(this);
      return this;
    }
    PropertiesUnready.set(this.id, callback);
    return this;
  };

  /**
   * ...
   * @todo
   * @function
   * @param {*} value - ...
   * @returns {boolean}
   */
  //ww.prototype.setValue = function(value) {};

  /**
   * ...
   * @constructor
   * @param {string|number} propertyPathString - ...
   * @param {object} [context] - ...
   */
  var Ww = function(propertyPathString, context) {
    var property;
    switch (typeof propertyPathString) {
      case 'string':
        if (!propertyPathString.trim().length) {
          return;
        }
        context = _getContext(context);
        return new ww(new _Property(_getProperty(propertyPathString, context), propertyPathString, context));
      case 'number':
        property = _properties[propertyPathString];
        if (!property) {
          return;
        }
        return new ww(property);
    }
    return;
  };
  Ww._interval = Interval;
  Ww._propertiesUnready = PropertiesUnready;

  return Ww;
})();

//-----------------------------------------------------------------------

ww.tests = (function() {
  var tests = {
    'If no property path is given, object should be undefined.': function() {
      return 'undefined' === typeof ww();
    },
    'If property path is an empty string, object should be undefined.': function() {
      return 'undefined' === typeof ww('');
    },
    'If property path points to a nonexistent child, value should be undefined.': function() {
      if ('undefined' !== typeof ww('nonexistentProperty').value) {
        return false;
      }
      if ('undefined' !== typeof ww('nonexistentProperty').getValue()) {
        return false;
      }
      return true;
    },
    'If property path points to a child of a nonexistent parent, value should be undefined.': function() {
      if ('undefined' !== typeof ww('nonexistentProperty.nonexistentProperty').value) {
        return false;
      }
      if ('undefined' !== typeof ww('nonexistentProperty.nonexistentProperty').getValue()) {
        return false;
      }
      return true;
    },
    'If property path points to an existent child, value should be defined.': function() {
      var mock = {
        existentProperty: true
      };
      if (true !== ww('existentProperty', mock).value) {
        return false;
      }
      if (true !== ww('existentProperty', mock).getValue()) {
        return false;
      }
      return true;
    },
    'If property path points to a nonexistent decendant, value should be undefined.': function() {
      var mock = {
        existentProperty: true
      };
      if ('undefined' !== typeof ww('existentProperty.nonexistentProperty', mock).value) {
        return false;
      }
      if ('undefined' !== typeof ww('existentProperty.nonexistentProperty', mock).getValue()) {
        return false;
      }
      return true;
    },
    'If property path points to an existent decendant, value should be defined.': function() {
      var mock = {
        existentProperty: {
          existentProperty: true
        }
      };
      if (true !== ww('existentProperty.existentProperty', mock).value) {
        return false;
      }
      if (true !== ww('existentProperty.existentProperty', mock).getValue()) {
        return false;
      }
      return true;
    },
    'If `getValue` method is given a default value and value is undefined, the default value should be returned.': function() {
      var mock = {};
      return true === ww('nonexistentProperty', mock).getValue(true);
    },
    'If `getValue` method is given a default value and value is defined, the value should be returned.': function() {
      var mock = {
        existentProperty: true
      };
      return true === ww('existentProperty', mock).getValue(false);
    },
    'If property path is a number (id) that does not correspond to an internal property, object should be undefined.': function() {
      return 'undefined' === typeof ww(-1);
    },
    'If property path is a number (id) that corresponds to an internal property, value should be the same as when it was initially called.': function() {
      var mock = {
        existentProperty: 'originalValue'
      };
      return 'originalValue' === ww(ww('existentProperty', mock).id).value;
    },
    'Modifying the returned object should not affect the internally stored object.': function() {
      var mock = {
        existentProperty: 'originalValue'
      };
      var object = ww('existentProperty', mock);
      object.value = 'modifiedValue';
      return 'originalValue' === ww(object.id).value;
    },
    'Modifying the returned object should not affect the original object.': function() {
      var mock = {
        existentProperty: 'originalValue'
      };
      ww('existentProperty', mock).value = 'modifiedValue';
      return 'originalValue' === ww('existentProperty', mock).value;
    },
    'If property does not yet exist when `extend` method is called, the property is created as an empty object and returned.': function() {
      var mock = {};
      if ('object' !== typeof ww('nonexistentProperty', mock).extend()) {
        return false;
      }
      if ('object' !== typeof ww('nonexistentProperty.nonexistentProperty', mock).extend()) {
        return false;
      }
      if ('object' !== typeof ww('nonexistentProperty2.nonexistentProperty', mock).extend()) {
        return false;
      }
      return true;
    },
    'If property already exists when `extend` method is called, the property is returned.': function() {
      var mock = {
        'existentProperty': true,
        'existentProperty2': {
          'existentProperty': true
        }
      };
      if (true !== ww('existentProperty', mock).extend()) {
        return false;
      }
      if (true !== ww('existentProperty2.existentProperty', mock).extend()) {
        return false;
      }
      return true;
    },
    'If property already exists when `ready` method is called, execute the given function right away with the ww object as an argument.': function() {
      var mock = {
        existentProperty: true
      };
      return ww('existentProperty', mock).ready(function(ww) {
        return true === ww.value;
      });
    },
    '`ready` method tests': function() {
      var isPassed = false;
      var mock = {};
      var object = ww('nonexistentProperty', mock).ready(function(ww) {
        isPassed = true;
      });
      if (1 === typeof ww._propertiesUnready.getIds().length) {
        return false;
      }
      ww._propertiesUnready.process();
      mock.nonExistentProperty = true;
      ww._propertiesUnready.process();
      if (0 === typeof ww._propertiesUnready.getIds().length) {
        return false;
      }
      return isPassed;
    }
  };

  function run() {
    var i, isPassed;
    var failedCount = 0;
    for (i in tests) {
      isPassed = tests[i]();
      if (!isPassed) {
        failedCount += 1;
      }
      console.log((isPassed ? '[o]' : '[x]') + ' ' + i);
    }
    console.log('[' + failedCount + '] test' + (failedCount !== 1 ? 's' : '') + ' failed.');
  }

  return {
    run: run,
    tests: tests
  };
})();

ww.tests.run();
