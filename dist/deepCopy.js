/* Copyright 2015 Gael Hatchue, based on work by Oran Looney */
var owl;
(function (owl) {
    "use strict";
    // Cache information about the JavaScript environment
    var jsEnvironment = {
        // Check if Object.defineProperty is implemented. We"ll assume that
        // getOwnPropertyNames is also available if defineProperty is implemented.
        // See compatibility matrix at: http://kangax.github.io/compat-table/es5/
        hasDefineProperty: typeof Object.defineProperty === "function" && (function () {
            try {
                Object.defineProperty({}, "x", {});
                return true;
            }
            catch (e) {
                return false;
            }
        })(),
        // Indicate if the JavaScript engine exhibits the DontEnum bug. This bug affects
        // internet explorer 8 or less, and is described in detail at:
        // https://developer.mozilla.org/en-US/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
        hasDontEnumBug: (function () {
            for (var p in { toString: 1 }) {
                // check actual property name, so that it works with augmented Object.prototype
                if (p === "toString") {
                    return false;
                }
            }
            return true;
        })(),
        // List of Object.prototype functions that are not enumerable due to the DontEnum bug
        dontEnums: [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ]
    };
    // the re-usable constructor function used by clone().
    function Clone() {
        // no-op
    }
    // clone objects, skip other types.
    function clone(target) {
        if (target !== null && typeof target === "object") {
            Clone.prototype = target;
            return new Clone();
        }
        else {
            return target;
        }
    }
    owl.clone = clone;
    // Utility function to Indicate if the object is a wrapper object for a native type
    function isNativeTypeWrapper(object) {
        // We could use the check below, but it can easily fail for objects
        // that override the valueOf function.
        //return object !== null && typeof object === 'object' && object !== object.valueOf();
        // Instead, we explicitly type-check against built-in data-types
        return (object instanceof Number || object instanceof String || object instanceof Boolean || object instanceof Date);
    }
    // Shallow Copy
    function copy(target) {
        if (target === null || typeof target !== "object") {
            return target; // non-object have value semantics, so target is already a copy.
        }
        else {
            if (isNativeTypeWrapper(target)) {
                // the object is a standard object wrapper for a native type, say String.
                // we can make a copy by instantiating a new object around the value.
                return new target.constructor(target.valueOf());
            }
            else {
                // ok, we have a normal object. If possible, we'll clone the original's prototype
                // (not the original) to get an empty object with the same prototype chain as
                // the original, and just copy the instance properties.  Otherwise, we have to
                // copy the whole thing, property-by-property.
                var isPlainObject = !(target instanceof target.constructor) || target.constructor === Object;
                var c = isPlainObject ? {} : clone(target.constructor.prototype);
                if (jsEnvironment.hasDefineProperty) {
                    Object.getOwnPropertyNames(target).forEach(function (property) {
                        Object.defineProperty(c, property, Object.getOwnPropertyDescriptor(target, property));
                    });
                }
                else {
                    for (var property in target) {
                        if (isPlainObject || Object.prototype.hasOwnProperty.call(target, property)) {
                            c[property] = target[property];
                        }
                    }
                    if (jsEnvironment.hasDontEnumBug) {
                        for (var i = 0; i < jsEnvironment.dontEnums.length; i++) {
                            property = jsEnvironment.dontEnums[i];
                            if (Object.prototype.hasOwnProperty.call(target, property)) {
                                c[property] = target[property];
                            }
                        }
                    }
                }
                return c;
            }
        }
    }
    owl.copy = copy;
    // entry point for deep copy.
    //   source is the object to be deep copied.
    //   maxDepth is an optional recursion limit. Defaults to 256.
    function deepCopy(source, maxDepth) {
        var deepCopyAlgorithm = new DeepCopyAlgorithm();
        if (maxDepth) {
            deepCopyAlgorithm.maxDepth = maxDepth;
        }
        return deepCopyAlgorithm.deepCopy(source);
    }
    owl.deepCopy = deepCopy;
    var deepCopy;
    (function (deepCopy) {
        var DeepCopier = (function () {
            function DeepCopier(config) {
                for (var key in config) {
                    if (Object.prototype.hasOwnProperty.call(config, key)) {
                        this[key] = config[key];
                    }
                }
            }
            DeepCopier.prototype.canCopy = function (source) {
                return false;
            };
            DeepCopier.prototype.create = function (source) {
                // no-op
            };
            DeepCopier.prototype.populate = function (deepCopyAlgorithm, source, result) {
                // no-op
            };
            return DeepCopier;
        })();
        deepCopy.DeepCopier = DeepCopier;
        // publicly expose the list of deepCopiers.
        deepCopy.deepCopiers = [];
    })(deepCopy = owl.deepCopy || (owl.deepCopy = {}));
    var DeepCopyAlgorithm = (function () {
        function DeepCopyAlgorithm() {
            this.maxDepth = 256;
            // copiedObjects keeps track of objects already copied by this
            // deepCopy operation, so we can correctly handle cyclic references.
            this.copiedObjects = [];
            var thisPass = this;
            this.recursiveDeepCopy = function (source) {
                return thisPass.deepCopy(source);
            };
            this.depth = 0;
        }
        // add an object to the cache.  No attempt is made to filter duplicates;
        // we always check getCachedResult() before calling it.
        DeepCopyAlgorithm.prototype.cacheResult = function (source, result) {
            this.copiedObjects.push([source, result]);
        };
        // Returns the cached copy of a given object, or undefined if it's an
        // object we haven't seen before.
        DeepCopyAlgorithm.prototype.getCachedResult = function (source) {
            var copiedObjects = this.copiedObjects;
            var length = copiedObjects.length;
            for (var i = 0; i < length; i++) {
                if (copiedObjects[i][0] === source) {
                    return copiedObjects[i][1];
                }
            }
            return undefined;
        };
        // deepCopy handles the simple cases itself: non-objects and object's we've seen before.
        // For complex cases, it first identifies an appropriate DeepCopier, then calls
        // applyDeepCopier() to delegate the details of copying the object to that DeepCopier.
        DeepCopyAlgorithm.prototype.deepCopy = function (source) {
            // null is a special case: it's the only value of type 'object' without properties.
            if (source === null) {
                return null;
            }
            // All non-objects use value semantics and don't need explict copying.
            if (typeof source !== "object") {
                return source;
            }
            var cachedResult = this.getCachedResult(source);
            // we've already seen this object during this deep copy operation
            // so can immediately return the result.  This preserves the cyclic
            // reference structure and protects us from infinite recursion.
            if (cachedResult) {
                return cachedResult;
            }
            for (var i = 0; i < deepCopy.deepCopiers.length; i++) {
                var deepCopier = deepCopy.deepCopiers[i];
                if (deepCopier.canCopy(source)) {
                    return this.applyDeepCopier(deepCopier, source);
                }
            }
            throw new Error("no DeepCopier is able to copy " + source);
        };
        // once we've identified which DeepCopier to use, we need to call it in a very
        // particular order: create, cache, populate.  This is the key to detecting cycles.
        // We also keep track of recursion depth when calling the potentially recursive
        // populate(): this is a fail-fast to prevent an infinite loop from consuming all
        // available memory and crashing or slowing down the browser.
        DeepCopyAlgorithm.prototype.applyDeepCopier = function (deepCopier, source) {
            // Start by creating a stub object that represents the copy.
            var result = deepCopier.create(source);
            // we now know the deep copy of source should always be result, so if we encounter
            // source again during this deep copy we can immediately use result instead of
            // descending into it recursively.
            this.cacheResult(source, result);
            // only DeepCopier::populate() can recursively deep copy.  So, to keep track
            // of recursion depth, we increment this shared counter before calling it,
            // and decrement it afterwards.
            this.depth++;
            if (this.depth > this.maxDepth) {
                throw new Error("Exceeded max recursion depth in deep copy.");
            }
            // It's now safe to let the deepCopier recursively deep copy its properties.
            deepCopier.populate(this.recursiveDeepCopy, source, result);
            this.depth--;
            return result;
        };
        return DeepCopyAlgorithm;
    })();
    owl.DeepCopyAlgorithm = DeepCopyAlgorithm;
    var deepCopy;
    (function (deepCopy) {
        function register(deepCopier) {
            if (!(deepCopier instanceof deepCopy.DeepCopier)) {
                deepCopier = new deepCopy.DeepCopier(deepCopier);
            }
            deepCopy.deepCopiers.unshift(deepCopier);
        }
        deepCopy.register = register;
    })(deepCopy = owl.deepCopy || (owl.deepCopy = {}));
    // Generic Object copier
    // the ultimate fallback DeepCopier, which tries to handle the generic case.  This
    // should work for base Objects and many user-defined classes.
    deepCopy.register({
        canCopy: function (source) {
            return true;
        },
        create: function (source) {
            if (source instanceof source.constructor) {
                return clone(source.constructor.prototype);
            }
            else {
                return {};
            }
        },
        populate: function (deepCopy, source, result) {
            if (jsEnvironment.hasDefineProperty) {
                Object.getOwnPropertyNames(source).forEach(function (key) {
                    var descriptor = Object.getOwnPropertyDescriptor(source, key);
                    descriptor.value = deepCopy(descriptor.value);
                    Object.defineProperty(result, key, descriptor);
                });
            }
            else {
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        result[key] = deepCopy(source[key]);
                    }
                }
                if (jsEnvironment.hasDontEnumBug) {
                    for (var i = 0; i < jsEnvironment.dontEnums.length; i++) {
                        key = jsEnvironment.dontEnums[i];
                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                            result[key] = deepCopy(source[key]);
                        }
                    }
                }
            }
            return result;
        }
    });
    // Array copier
    deepCopy.register({
        canCopy: function (source) {
            return (source instanceof Array);
        },
        create: function (source) {
            return new source.constructor();
        },
        populate: function (deepCopy, source, result) {
            for (var i = 0; i < source.length; i++) {
                result.push(deepCopy(source[i]));
            }
            return result;
        }
    });
    // Native type object wrapper copier
    deepCopy.register({
        canCopy: function (source) {
            return isNativeTypeWrapper(source);
        },
        create: function (source) {
            return new source.constructor(source.valueOf());
        }
    });
    // HTML DOM Node
    // utility function to detect Nodes.  In particular, we're looking
    // for the cloneNode method.  The global document is also defined to
    // be a Node, but is a special case in many ways.
    function isNode(source) {
        /* tslint:disable:no-string-literal */
        if (window["Node"]) {
            return source instanceof Node;
        }
        else {
            // the document is a special Node and doesn't have many of
            // the common properties so we use an identity check instead.
            if (source === document) {
                return true;
            }
            return (typeof source.nodeType === "number" && source.attributes !== undefined && source.childNodes && source.cloneNode);
        }
        /* tslint:enable:no-string-literal */
    }
    // Node copier
    deepCopy.register({
        canCopy: function (source) {
            return isNode(source);
        },
        create: function (source) {
            // there can only be one (document).
            if (source === document) {
                return document;
            }
            // start with a shallow copy.  We'll handle the deep copy of
            // its children ourselves.
            return source.cloneNode(false);
        },
        populate: function (deepCopy, source, result) {
            // we're not copying the global document, so don't have to populate it either.
            if (source === document) {
                return document;
            }
            // if this Node has children, deep copy them one-by-one.
            if (source.childNodes && source.childNodes.length) {
                for (var i = 0; i < source.childNodes.length; i++) {
                    var childCopy = deepCopy(source.childNodes[i]);
                    result.appendChild(childCopy);
                }
            }
        }
    });
})(owl || (owl = {}));
//# sourceMappingURL=deepCopy.js.map