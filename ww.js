/**
 * Westwing's core Javascript object that stores (should store) all data and
 * methods used by the website. In its base state, it has methods to easily
 * extend and retrieve properties within itself or other 3rd-party objects and
 * takes care of the instances when they don't exist or when they become
 * available.
 * Examples: ww('aPropertyWithinWw.aDescendantPropertyWithinWw').value
 *           ww('aPropertyFromA3rdPartyObject', a3rdPartyObject).getValue(fallbackValue)
 *           ww('$', window).ready(doSomething)
 *
 * @author Hesedel Pajaron <hesedel.pajaron@westwing.de>
 * @author Stefan Firnhammer <stefan.firnhammer@westwing.de>
 * @version 1.2.0
 *           - .setValue()
 * @version 1.1.0
 *           - .applyOnReady()
 *           - .callOnReady()
 * @version 1.0.0
 *           - .apply()
 *           - .call()
 *           - .extend() | .x()
 *           - .getType()
 *           - .getValue()
 *           - .ready()
 * @global
 * @property {object}   _interval
 * @property {object}   _propertiesUnready
 * @property {function} apply
 * @property {function} applyOnReady
 * @property {function} call
 * @property {function} callOnReady
 * @property {function} extend | x
 * @property {function} getType
 * @property {function} getValue
 * @property {function} ready
 * @property {function} setValue 
 */
var ww = ww || (function () { // jshint ignore:line
  'use strict';

  var _Property,
      Interval,
      PropertiesUnready,
      Ww,
      ww;

  /**
   * Internal storage of properties which have been called.
   *
   * @type {object}
   * @private
   */
  var _properties = {};

  /**
   * Internal representation of a property.
   *
   * @constructor
   * @private
   * @param {string} path
   * @param {*}      context
   * @property {*}                context
   * @property {number}           id
   * @property {*}                parent
   * @property {string|undefined} parentPath
   * @property {string}           path
   * @property {string}           property
   * @property {string}           type
   * @property {*}                value
   */
  _Property = (function () {

    /**
     * Incrementing ID everytime a new instance is created.
     *
     * @type {number}
     * @private
     */
    var _i = 0;

    return function (path, context) {
      var pathArray = path.split('.');
      this.context = context;
      this.id = _i;
      this.path = path;
      this.property = pathArray.pop();
      this.parentPath = pathArray.length ? pathArray.join('.') : undefined;
      this.parent = _getProperty(this.parentPath, context);
      this.type = 'undefined' !== typeof this.parent ? typeof this.parent[this.property] : 'undefined';
      this.value = 'undefined' !== this.type ? this.parent[this.property] : undefined;
      _properties[_i] = this;
      _i += 1;
    };
  })();

  /**
   * @function
   * @param {*} value
   */
  _Property.prototype.update = function (parent) {
    this.parent = parent;
    this.value = parent[this.property];
    this.type = typeof this.value;
  };

  /**
   * Interval for the continual execution of internal processes.
   *
   * @constructor
   * @public
   * @property {function} pause
   * @property {function} resume
   */
  Interval = (function () {

    /**
     * @type {boolean}
     * @private
     */
    var _isPaused = false;

    /**
     * @function
     * @private
     */
    function _callback() {
      if (!_isPaused) {
        PropertiesUnready.process();
      }
      setTimeout(_callback, 1);
    }

    /**
     * @function
     * @public
     */
    function pause() {
      _isPaused = true;
    }

    /**
     * @function
     * @public
     */
    function resume() {
      _isPaused = false;
    }

    setTimeout(_callback, 1);

    return {
      pause: pause,
      resume: resume
    };
  })();

  /**
   * Properties which were called by the .ready() method and are awaiting
   * resolution.
   *
   * @constructor
   * @public
   * @property {function} getIds
   * @property {function} process
   * @property {function} set
   */
  PropertiesUnready = (function () { // jshint ignore:line

    /**
     * Internal reference to the properties awaiting resolution and the callback
     * functions assigned to them.
     *
     * @type {object}
     * @private
     */
    var _propertiesUnready = {};

    /**
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
     * @function
     * @public
     */
    function process() {
      var i, parent, property;
      for (i in _propertiesUnready) {
        if (!_propertiesUnready.hasOwnProperty(i)) {
          continue;
        }
        property = _properties[i];
        parent = _getProperty(property.parentPath, property.context);
        if ('undefined' === typeof parent) {
          continue;
        }
        if ('undefined' === typeof parent[property.property]) {
          continue;
        }
        property.update(parent);
        _propertiesUnready[i](new ww(property)); // jshint ignore:line
        delete _propertiesUnready[i];
      }
    }

    /**
     * @function
     * @public
     * @param {number} id
     * @param {function} callback
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
   * Returns the given context if it is valid or the core ww object if it isn't.
   *
   * @function
   * @private
   * @param {*} context
   * @returns {*|Ww}
   */
  function _getContext(context) {
    if ('object' === typeof context || 'function' === typeof context) {
      return context;
    }
    return Ww;
  }

  /**
   * Returns the property if it exists. If it doesn't exist and extendValue is
   * defined, create the property from extendValue and return it.
   *
   * @function
   * @private
   * @param {string} propertyPathString
   * @param {*}      context
   * @param {*}      [extendValue]
   * @returns {*}
   */
  function _getProperty(propertyPathString, context, extendValue) {
    var i, j, property, propertyPathArray, propertyPathArrayLength, propertyPrevious, propertyString;
    var isExtend = 'undefined' !== typeof extendValue;
    if ('undefined' === typeof propertyPathString) {
      return context;
    }
    propertyPrevious = context;
    propertyPathArray = propertyPathString.split('.');
    propertyPathArrayLength = propertyPathArray.length;
    for (i = 0; i < propertyPathArrayLength; i += 1) {
      propertyString = propertyPathArray[i];
      property = propertyPrevious[propertyString];
      if ('undefined' === typeof property) {
        if (isExtend) {
          propertyPrevious[propertyString] = i < propertyPathArrayLength - 1 ? {} : extendValue;
          propertyPrevious = propertyPrevious[propertyString];
          continue;
        }
        return;
      }
      if (isExtend && i === propertyPathArrayLength - 1) {
        for (j in extendValue) {
            if ('undefined' === typeof property[j] && extendValue.hasOwnProperty(j)) {
                property[j] = extendValue[j];
            }
        }
      }
      propertyPrevious = property;
    }
    return propertyPrevious;
  }

  /**
   * Wrapper for the internal property to be returned when ww() is called.
   *
   * @constructor
   * @param {_Property} property
   */
  ww = function (property) {
    var i;
    for (i in property) {
      if (property.hasOwnProperty(i)) {
        this[i] = property[i];
      }
    }
  };

  /**
   * Executes the value if it's a function, using function's apply method.
   *
   * @function
   * @param {*}     valueForThis
   * @param {array} arrayOfArguments
   * @returns {*}
   */
  ww.prototype.apply = function (valueForThis, arrayOfArguments) {
    if ('function' !== this.type) {
      return false;
    }
    if ('undefined' === typeof valueForThis) {
      valueForThis = this.parent;
    }
    return this.value.apply(valueForThis, arrayOfArguments);
  };

  /**
   * Executes the function when it becomes available, using function's apply method.
   * @function
   * @param {*}     valueForThis
   * @param {array} arrayOfArguments
   * @returns {boolean}
   */
  ww.prototype.applyOnReady = function (valueForThis, arrayOfArguments) {
    return this.ready(function (ww) {
      ww.apply(valueForThis, arrayOfArguments);
    });
  };

  /**
   * Executes the value if it's a function, using function's call method.
   *
   * @function
   * @returns {*}
   */
  ww.prototype.call = function () {
    var valueForThis;
    var argumentsNew = [];
    if ('function' !== this.type) {
      return false;
    }
    argumentsNew = Array.prototype.slice.call(arguments);
    valueForThis = argumentsNew.shift();
    if ('undefined' === typeof valueForThis) {
      valueForThis = this.parent;
    }
    return this.value.apply(valueForThis, argumentsNew);
  };

  /**
   * Executes the function when it becomes available, using function's call method.
   * @function
   * @param {*}     valueForThis
   * @param {array} arrayOfArguments
   * @returns {boolean}
   */
  ww.prototype.callOnReady = function () {
    var arrayOfArguments = Array.prototype.slice.call(arguments);
    var valueForThis = arrayOfArguments.shift();
    return this.ready(function (ww) {
      ww.apply(valueForThis, arrayOfArguments);
    });
  };

  /**
   * Extends the context to the path if it doesn't exist and returns it.
   *
   * @function
   * @param {*} [value] - Creates the extension with this.
   * @returns {*}
   */
  ww.prototype.extend = function (value) {
    if ('undefined' === typeof value) {
      value = {};
    }
    return _getProperty(this.path, this.context, value);
  };
  ww.prototype.x = ww.prototype.extend;

  /**
   * Returns the type of the value.
   *
   * @function
   * @returns {string}
   */
  ww.prototype.getType = function () {
    return this.type;
  };

  /**
   * Returns the value of the property.
   *
   * @function
   * @param {*} [defaultValue] - Returns this if value is undefined.
   * @returns {*}
   */
  ww.prototype.getValue = function (defaultValue) {
    if ('undefined' !== typeof this.value) {
      return this.value;
    }
    return defaultValue;
  };

  /**
   * Executes a callback function when the property becomes available.
   *
   * @function
   * @param {function} callback
   * @returns {boolean}
   */
  ww.prototype.ready = function (callback) {
    var isCallbackAFunction = 'function' === typeof callback;
    if ('undefined' !== this.type) {
      if (isCallbackAFunction) {
        callback(this);
      }
      return true;
    }
    if (isCallbackAFunction) {
      PropertiesUnready.set(this.id, callback);
    }
    return false;
  };

  /**
   * Sets the value on the property
   *
   * @function
   * @param {*} value
   * @returns {*}
   */
  ww.prototype.setValue = function (value) {
    return _getProperty(this.parentPath, this.context, {})[this.property] = value;
  };

  /**
   * The ww object itself.
   *
   * @constructor
   * @param {string|number} propertyPathString
   * @param {*}             [context]
   * @returns {ww|undefined}
   */
  Ww = function (propertyPathString, context) { // jshint ignore:line
    var property;
    switch (typeof propertyPathString) {
      case 'string':
        if (!propertyPathString.replace(/^\s+|\s+$/, '').length) {
          return;
        }
        context = _getContext(context);
        return new ww(new _Property(propertyPathString, context)); // jshint ignore:line
      case 'number':
        property = _properties[propertyPathString];
        if (!property) {
          return;
        }
        return new ww(property); // jshint ignore:line
    }
  };
  Ww._interval = Interval;
  Ww._propertiesUnready = PropertiesUnready;

  return Ww;
})();

/**
 * Events model
 *
 * @param    {array}    events
 * @property {function} off
 * @property {funciton} on
 * @property {funciton} trigger
 */
ww('Events').x((function () {
  'use strict';

  function Events(events) {
    var i;

    this.events = {};

    if ('undefined' === typeof events) {
      return;
    }

    for (i in events) {
      this.events[events[i]] = [];
    }
  }

  /**
   * @function
   * @param {string} event
   */
  Events.prototype.off = function (event) {
    ww(event, this.events).setValue([]);
  };

  /**
   * @function
   * @param {string} event
   * @param {function} fn
   */
  Events.prototype.on = function (event, fn) {
    var i;
    var eventArray = [];

    eventArray = event.split('.');
    eventArray = eventArray.map(function (name, i) {
      return eventArray.slice(0, i + 1).join('.');
    });

    for (i = 0; i < eventArray.length; i += 1) {
      ww(eventArray[i], this.events).x([]);
    }

    ww(event, this.events).value.push(fn);
  };

  /**
   * @function
   * @param {string} event
   */
  Events.prototype.trigger = function (event) {
    var i;
    var arrayOfArguments = Array.prototype.slice.call(arguments, 1);
    var events = ww(event, this.events).getValue([]);

    for (i in events) {
      if (events.hasOwnProperty(i)) {
        if ('function' === typeof events[i]) {
          events[i].apply(undefined, arrayOfArguments);

          continue;
        }

        this.trigger([event, i].join('.'));
      }
    }
  };

  return Events;
})());
