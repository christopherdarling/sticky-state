'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _classname = require('classname');

var _classname2 = _interopRequireDefault(_classname);

var _scrollEvents = require('scroll-events');

var _scrollEvents2 = _interopRequireDefault(_scrollEvents);

var _eventdispatcher = require('eventdispatcher');

var _eventdispatcher2 = _interopRequireDefault(_eventdispatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

var defaults = {
  disabled: false,
  className: 'sticky',
  stateClassName: 'is-sticky',
  fixedClass: 'sticky-fixed',
  wrapperClass: 'sticky-wrap',
  absoluteClass: 'is-absolute',
  scrollClass: {
    down: null,
    up: null,
    none: null,
    persist: false
  }
};

function getAbsolutBoundingRect(el, fixedHeight) {
  var rect = el.getBoundingClientRect();
  var top = rect.top + _scrollEvents2.default.windowScrollY;
  var height = fixedHeight || rect.height;
  return {
    top: top,
    bottom: top + height,
    height: height,
    width: rect.width
  };
}

function addBounds(rect1, rect2) {
  var rect = (0, _objectAssign2.default)({}, rect1);
  rect.top -= rect2.top;
  rect.bottom = rect.top + rect1.height;
  return rect;
}

function getPositionStyle(el) {
  var obj = {
    top: null,
    bottom: null
  };

  for (var key in obj) {
    var value = parseInt(window.getComputedStyle(el)[key]);
    value = isNaN(value) ? null : value;
    obj[key] = value;
  }

  return obj;
}

function getPreviousElementSibling(el) {
  var prev = el.previousElementSibling;
  if (prev && prev.tagName.toLocaleLowerCase() === 'script') {
    prev = getPreviousElementSibling(prev);
  }
  return prev;
}

var StickyState = function (_EventDispatcher) {
  _inherits(StickyState, _EventDispatcher);

  function StickyState(element, options) {
    _classCallCheck(this, StickyState);

    if (!element) {
      throw new Error('StickyState needs a DomElement');
    }

    var _this = _possibleConstructorReturn(this, _EventDispatcher.call(this));

    if (element instanceof window.NodeList) {
      if (element.length > 1) {
        var _ret;

        return _ret = StickyState.apply(element, options), _possibleConstructorReturn(_this, _ret);
      } else {
        element = element[0];
      }
    }

    _this.el = element;
    if (options && options.scrollClass) {
      options.scrollClass = (0, _objectAssign2.default)({}, defaults.scrollClass, options.scrollClass);
    }
    _this.options = (0, _objectAssign2.default)({}, defaults, options);

    _this.setState({
      sticky: false,
      absolute: false,
      fixedOffset: '',
      offsetHeight: 0,
      bounds: {
        top: null,
        bottom: null,
        height: null,
        width: null
      },
      restrict: {
        top: null,
        bottom: null,
        height: null,
        width: null
      },
      style: {
        top: null,
        bottom: null
      },
      disabled: _this.options.disabled
    }, true);

    _this.scrollTarget = window.getComputedStyle(_this.el.parentNode).overflow !== 'auto' ? window : _this.el.parentNode;
    _this.hasOwnScrollTarget = _this.scrollTarget !== window;
    if (_this.hasOwnScrollTarget) {
      _this.updateFixedOffset = _this.updateFixedOffset.bind(_this);
    }

    _this.firstRender = true;
    _this.resizeHandler = null;
    _this.scroll = null;
    _this.wrapper = null;
    _this.eventObject = {
      target: _this.el,
      currentTarget: _this
    };

    _this.render = _this.render.bind(_this);

    _this.addSrollHandler();
    _this.addResizeHandler();
    _this.render();
    return _this;
  }

  StickyState.apply = function apply(elements, options) {

    if (elements) {
      if (elements.length) {
        var arr = new StickyStateCollection();
        for (var i = 0; i < elements.length; i++) {
          arr.push(new StickyState(elements[i], options));
        }
        return arr;
      } else {
        return new StickyState(elements, options);
      }
    }
    return null;
  };

  StickyState.prototype.setState = function setState(newState, silent) {
    this.lastState = this.state || newState;
    this.state = (0, _objectAssign2.default)({}, this.state, newState);
    if (silent !== true) {
      this.render();
      this.trigger(this.state.sticky ? 'sticky:on' : 'sticky:off', this.eventObject);
    }
  };

  StickyState.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return this.el.getBoundingClientRect();
  };

  StickyState.prototype.getBounds = function getBounds(noCache) {

    var clientRect = this.getBoundingClientRect();
    var offsetHeight = _scrollEvents2.default.documentHeight;
    noCache = noCache === true;

    if (noCache !== true && this.state.bounds.height !== null) {
      if (this.state.offsetHeight === offsetHeight && clientRect.height === this.state.bounds.height) {
        return {
          offsetHeight: offsetHeight,
          style: this.state.style,
          bounds: this.state.bounds,
          restrict: this.state.restrict
        };
      }
    }

    var style = noCache ? this.state.style : getPositionStyle(this.el);
    var child = this.wrapper || this.el;
    var rect;
    var restrict;
    var offset = 0;

    if (!Can.sticky) {
      rect = getAbsolutBoundingRect(child, clientRect.height);
      if (this.hasOwnScrollTarget) {
        var parentRect = getAbsolutBoundingRect(this.scrollTarget);
        offset = this.scroll.y;
        rect = addBounds(rect, parentRect);
        restrict = parentRect;
        restrict.top = 0;
        restrict.height = this.scroll.scrollHeight || restrict.height;
        restrict.bottom = restrict.height;
      }
    } else {
      var elem = getPreviousElementSibling(child);
      offset = 0;

      if (elem) {
        offset = parseInt(window.getComputedStyle(elem)['margin-bottom']);
        offset = offset || 0;
        rect = getAbsolutBoundingRect(elem);
        if (this.hasOwnScrollTarget) {
          rect = addBounds(rect, getAbsolutBoundingRect(this.scrollTarget));
          offset += this.scroll.y;
        }
        rect.top = rect.bottom + offset;
      } else {
        elem = child.parentNode;
        offset = parseInt(window.getComputedStyle(elem)['padding-top']);
        offset = offset || 0;
        rect = getAbsolutBoundingRect(elem);
        if (this.hasOwnScrollTarget) {
          rect = addBounds(rect, getAbsolutBoundingRect(this.scrollTarget));
          offset += this.scroll.scrollY;
        }
        rect.top = rect.top + offset;
      }
      if (this.hasOwnScrollTarget) {
        restrict = getAbsolutBoundingRect(this.scrollTarget);
        restrict.top = 0;
        restrict.height = this.scroll.scrollHeight || restrict.height;
        restrict.bottom = restrict.height;
      }

      rect.height = child.clientHeight;
      rect.width = child.clientWidth;
      rect.bottom = rect.top + rect.height;
    }

    restrict = restrict || getAbsolutBoundingRect(child.parentNode);

    return {
      offsetHeight: offsetHeight,
      style: style,
      bounds: rect,
      restrict: restrict
    };
  };

  StickyState.prototype.updateBounds = function updateBounds(silent, noCache) {
    silent = silent === true;
    noCache = noCache === true;
    this.setState(this.getBounds(noCache), silent);
  };

  StickyState.prototype.updateFixedOffset = function updateFixedOffset() {
    this.lastState.fixedOffset = this.state.fixedOffset;
    if (this.state.sticky) {
      this.state.fixedOffset = this.scrollTarget.getBoundingClientRect().top + 'px';
    } else {
      this.state.fixedOffset = '';
    }
    if (this.lastState.fixedOffset !== this.state.fixedOffset) {
      this.render();
    }
  };

  StickyState.prototype.addSrollHandler = function addSrollHandler() {
    if (!this.scroll) {
      var hasScrollTarget = _scrollEvents2.default.hasScrollTarget(this.scrollTarget);

      this.scroll = _scrollEvents2.default.getInstance(this.scrollTarget);
      this.onScroll = this.onScroll.bind(this);
      this.onScrollDirection = this.onScrollDirection.bind(this);
      this.scroll.on('scroll:start', this.onScroll);
      this.scroll.on('scroll:progress', this.onScroll);
      this.scroll.on('scroll:stop', this.onScroll);
      this.scroll.on('scroll:up', this.onScrollDirection);
      this.scroll.on('scroll:down', this.onScrollDirection);
      if (!this.options.scrollClass.persist) {
        this.scroll.on('scroll:stop', this.onScrollDirection);
      } else {
        // this.scroll.on('scroll:top', this.onScrollDirection);
      }

      if (hasScrollTarget && this.scroll.scrollY > 0) {
        this.scroll.trigger('scroll:progress');
      }
    }
  };

  StickyState.prototype.removeSrollHandler = function removeSrollHandler() {
    if (this.scroll) {
      this.scroll.off('scroll:start', this.onScroll);
      this.scroll.off('scroll:progress', this.onScroll);
      this.scroll.off('scroll:stop', this.onScroll);
      this.scroll.off('scroll:up', this.onScrollDirection);
      this.scroll.off('scroll:down', this.onScrollDirection);
      this.scroll.off('scroll:stop', this.onScrollDirection);
      this.scroll.destroy();
      this.scroll = null;
    }
  };

  StickyState.prototype.addResizeHandler = function addResizeHandler() {
    if (!this.resizeHandler) {
      this.resizeHandler = this.onResize.bind(this);
      window.addEventListener('sticky:update', this.resizeHandler, false);
      window.addEventListener('resize', this.resizeHandler, false);
      window.addEventListener('orientationchange', this.resizeHandler, false);
    }
  };

  StickyState.prototype.removeResizeHandler = function removeResizeHandler() {
    if (this.resizeHandler) {
      window.removeEventListener('sticky:update', this.resizeHandler);
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('orientationchange', this.resizeHandler);
      this.resizeHandler = null;
    }
  };

  StickyState.prototype.getScrollClassObj = function getScrollClassObj(obj) {
    obj = obj || {};
    var direction = this.scroll.y <= 0 || this.scroll.y + this.scroll.clientHeight >= this.scroll.scrollHeight ? 0 : this.scroll.directionY;
    if (this.options.scrollClass.up || this.options.scrollClass.down) {
      obj[this.options.scrollClass.up] = direction < 0;
      obj[this.options.scrollClass.down] = direction > 0;
    }
    return obj;
  };

  StickyState.prototype.onScrollDirection = function onScrollDirection(e) {
    if (this.state.sticky || e.type === _scrollEvents2.default.EVENT_SCROLL_STOP) {
      this.el.className = (0, _classname2.default)(this.el.className, this.getScrollClassObj());
    }
  };

  StickyState.prototype.onScroll = function onScroll(e) {
    this.updateStickyState(false);
    if (this.hasOwnScrollTarget && !Can.sticky) {
      this.updateFixedOffset();
      if (this.state.sticky && !this.hasWindowScrollListener) {
        this.hasWindowScrollListener = true;
        _scrollEvents2.default.getInstance(window).on('scroll:progress', this.updateFixedOffset);
      } else if (!this.state.sticky && this.hasWindowScrollListener) {
        this.hasWindowScrollListener = false;
        _scrollEvents2.default.getInstance(window).off('scroll:progress', this.updateFixedOffset);
      }
    }
  };

  StickyState.prototype.update = function update() {
    this.updateBounds(true, true);
    this.updateStickyState(false);
  };

  StickyState.prototype.onResize = function onResize(e) {
    this.update();
  };

  StickyState.prototype.getStickyState = function getStickyState() {

    if (this.state.disabled) {
      return { sticky: false, absolute: false };
    }

    var scrollY = this.scroll.y;
    var top = this.state.style.top;
    var bottom = this.state.style.bottom;
    var sticky = this.state.sticky;
    var absolute = this.state.absolute;

    if (top !== null) {
      var offsetBottom = this.state.restrict.bottom - this.state.bounds.height - top;
      top = this.state.bounds.top - top;
      if (this.state.sticky === false && (scrollY >= top && scrollY <= offsetBottom || top <= 0 && scrollY < top)) {
        sticky = true;
        absolute = false;
      } else if (this.state.sticky && (top > 0 && scrollY < top || scrollY > offsetBottom)) {
        sticky = false;
        absolute = scrollY > offsetBottom;
      }
    } else if (bottom !== null) {

      scrollY += window.innerHeight;
      var offsetTop = this.state.restrict.top + this.state.bounds.height - bottom;
      bottom = this.state.bounds.bottom + bottom;

      if (this.state.sticky === false && scrollY <= bottom && scrollY >= offsetTop) {
        sticky = true;
        absolute = false;
      } else if (this.state.sticky && (scrollY > bottom || scrollY < offsetTop)) {
        sticky = false;
        absolute = scrollY <= offsetTop;
      }
    }
    return { sticky: sticky, absolute: absolute };
  };

  StickyState.prototype.updateStickyState = function updateStickyState(silent) {
    var values = this.getStickyState();

    if (values.sticky !== this.state.sticky || values.absolute !== this.state.absolute) {
      silent = silent === true;
      values = (0, _objectAssign2.default)(values, this.getBounds());
      this.setState(values, silent);
    }
  };

  StickyState.prototype.render = function render() {

    var className = this.el.className;

    var classNameObj = {};

    if (this.firstRender) {
      this.firstRender = false;

      if (!Can.sticky) {
        this.wrapper = document.createElement('div');
        this.wrapper.className = this.options.wrapperClass;
        var parent = this.el.parentNode;
        if (parent) {
          parent.insertBefore(this.wrapper, this.el);
        }
        this.wrapper.appendChild(this.el);
        classNameObj[this.options.fixedClass] = true;
      }

      this.updateBounds(true);
      this.updateStickyState(true);
    }

    if (!Can.sticky) {
      var height = this.state.disabled || this.state.bounds.height === null || !this.state.sticky && !this.state.absolute ? 'auto' : this.state.bounds.height + 'px';
      this.wrapper.style.height = height;

      if (this.state.absolute !== this.lastState.absolute) {
        this.wrapper.style.position = this.state.absolute ? 'relative' : '';

        classNameObj[this.options.absoluteClass] = this.state.absolute;
        // className = className.indexOf(this.options.absoluteClass) === -1 && this.state.absolute ? className + (' ' + this.options.absoluteClass) : className.split((' ' + this.options.absoluteClass)).join('');
        this.el.style.marginTop = this.state.absolute && this.state.style.top !== null ? this.state.restrict.height - (this.state.bounds.height + this.state.style.top) + (this.state.restrict.top - this.state.bounds.top) + 'px' : '';
        this.el.style.marginBottom = this.state.absolute && this.state.style.bottom !== null ? this.state.restrict.height - (this.state.bounds.height + this.state.style.bottom) + (this.state.restrict.bottom - this.state.bounds.bottom) + 'px' : '';
      }

      if (this.hasOwnScrollTarget && !this.state.absolute && this.lastState.fixedOffset !== this.state.fixedOffset) {
        this.el.style.marginTop = this.state.fixedOffset;
      }
    }

    classNameObj[this.options.stateClassName] = this.state.sticky;
    classNameObj = this.getScrollClassObj(classNameObj);
    className = (0, _classname2.default)(className, classNameObj);

    if (this.el.className !== className) {
      this.el.className = className;
    }

    return this.el;
  };

  _createClass(StickyState, null, [{
    key: 'native',
    get: function get() {
      return Can.sticky;
    }
  }]);

  return StickyState;
}(_eventdispatcher2.default);

exports.default = StickyState;


var _canSticky = null;
var _passiveEvents = null;

var Can = function () {
  function Can() {
    _classCallCheck(this, Can);
  }

  _createClass(Can, null, [{
    key: 'sticky',
    get: function get() {
      if (_canSticky !== null) {
        return _canSticky;
      }
      if (typeof window !== 'undefined') {

        if (window.Modernizr && window.Modernizr.hasOwnProperty('csspositionsticky')) {
          return _globals.canSticky = window.Modernizr.csspositionsticky;
        }

        var testEl = document.createElement('div');
        document.documentElement.appendChild(testEl);
        var prefixedSticky = ['sticky', '-webkit-sticky', '-moz-sticky', '-ms-sticky', '-o-sticky'];

        _canSticky = false;

        for (var i = 0; i < prefixedSticky.length; i++) {
          testEl.style.position = prefixedSticky[i];
          _canSticky = !!window.getComputedStyle(testEl).position.match('sticky');
          if (_canSticky) {
            break;
          }
        }
        document.documentElement.removeChild(testEl);
      }
      return _canSticky;
    }
  }, {
    key: 'passiveEvents',
    get: function get() {
      if (_passiveEvents !== null) {
        return _passiveEvents;
      }
      try {
        var opts = Object.defineProperty({}, 'passive', {
          get: function get() {
            _passiveEvents = true;
          }
        });
        window.addEventListener("test", null, opts);
      } catch (e) {
        _passiveEvents = false;
      }
    }
  }]);

  return Can;
}();

var StickyStateCollection = function (_EventDispatcher2) {
  _inherits(StickyStateCollection, _EventDispatcher2);

  function StickyStateCollection() {
    _classCallCheck(this, StickyStateCollection);

    var _this2 = _possibleConstructorReturn(this, _EventDispatcher2.call(this));

    _this2.items = [];
    return _this2;
  }

  StickyStateCollection.prototype.push = function push(item) {
    this.items.push(item);
  };

  StickyStateCollection.prototype.update = function update() {
    window.dispatchEvent(new Event('sticky:update'));
  };

  StickyStateCollection.prototype.addListener = function addListener(event, listener) {

    var i = -1;
    while (++i < this.items.length) {
      this.items[i].addListener(event, listener);
    }
    return this;
  };

  StickyStateCollection.prototype.removeListener = function removeListener(event, listener) {
    var i = -1;
    while (++i < this.items.length) {
      this.items[i].removeListener(event, listener);
    }
    return this;
  };

  return StickyStateCollection;
}(_eventdispatcher2.default);

module.exports = exports['default'];