var owl;
(function (owl) {
    "use strict";
    var jsEnvironment = {
        hasDefineProperty: typeof Object.defineProperty === "function" && (function () {
            try {
                Object.defineProperty({}, "x", {});
                return true;
            }
            catch (e) {
                return false;
            }
        })(),
        hasDontEnumBug: (function () {
            for (var p in { toString: 1 }) {
                if (p === "toString") {
                    return false;
                }
            }
            return true;
        })(),
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
    function Clone() {
    }
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
    function isNativeTypeWrapper(object) {
        return (object instanceof Number || object instanceof String || object instanceof Boolean || object instanceof Date);
    }
    function copy(target) {
        if (target === null || typeof target !== "object") {
            return target;
        }
        else {
            if (isNativeTypeWrapper(target)) {
                return new target.constructor(target.valueOf());
            }
            else {
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
    owl.deepCopiers = [];
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
            };
            DeepCopier.prototype.populate = function (deepCopyAlgorithm, source, result) {
            };
            return DeepCopier;
        })();
        deepCopy.DeepCopier = DeepCopier;
    })(deepCopy = owl.deepCopy || (owl.deepCopy = {}));
    var DeepCopyAlgorithm = (function () {
        function DeepCopyAlgorithm() {
            this.maxDepth = 256;
            this.copiedObjects = [];
            var thisPass = this;
            this.recursiveDeepCopy = function (source) {
                return thisPass.deepCopy(source);
            };
            this.depth = 0;
        }
        DeepCopyAlgorithm.prototype.cacheResult = function (source, result) {
            this.copiedObjects.push([source, result]);
        };
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
        DeepCopyAlgorithm.prototype.deepCopy = function (source) {
            if (source === null) {
                return null;
            }
            if (typeof source !== "object") {
                return source;
            }
            var cachedResult = this.getCachedResult(source);
            if (cachedResult) {
                return cachedResult;
            }
            for (var i = 0; i < owl.deepCopiers.length; i++) {
                var deepCopier = owl.deepCopiers[i];
                if (deepCopier.canCopy(source)) {
                    return this.applyDeepCopier(deepCopier, source);
                }
            }
            throw new Error("no DeepCopier is able to copy " + source);
        };
        DeepCopyAlgorithm.prototype.applyDeepCopier = function (deepCopier, source) {
            var result = deepCopier.create(source);
            this.cacheResult(source, result);
            this.depth++;
            if (this.depth > this.maxDepth) {
                throw new Error("Exceeded max recursion depth in deep copy.");
            }
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
            owl.deepCopiers.unshift(deepCopier);
        }
        deepCopy.register = register;
    })(deepCopy = owl.deepCopy || (owl.deepCopy = {}));
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
    deepCopy.register({
        canCopy: function (source) {
            return isNativeTypeWrapper(source);
        },
        create: function (source) {
            return new source.constructor(source.valueOf());
        }
    });
    function isNode(source) {
        if (window["Node"]) {
            return source instanceof Node;
        }
        else {
            if (source === document) {
                return true;
            }
            return (typeof source.nodeType === "number" && source.attributes !== undefined && source.childNodes && source.cloneNode);
        }
    }
    deepCopy.register({
        canCopy: function (source) {
            return isNode(source);
        },
        create: function (source) {
            if (source === document) {
                return document;
            }
            return source.cloneNode(false);
        },
        populate: function (deepCopy, source, result) {
            if (source === document) {
                return document;
            }
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