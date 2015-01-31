'use strict';

// ====== Common objects and utilities
function extend(subclass, superclass) {
  function Temp() {}
  Temp.prototype = superclass.prototype;
  subclass.prototype = new Temp();
  subclass.prototype.constructor = subclass;
}

var Animal = function(a) {
  this.a = a;
};
var Dog = function(a, b) {
  Animal.call(this, a);
  this.b = b;
};
extend(Dog, Animal);

var es5 =
  typeof Object.defineProperty === 'function' && (function() {
    try {
      Object.defineProperty({}, 'x', {});
      return true;
    } catch (e) {
      return false;
    }
  })();
var if_es5_it = es5 ? it : xit;

// ====== Specs
describe('owl.clone', function() {

  var original = { a:'A', b:'B' };
  var clone = owl.clone(original);

  it('should create a clone of an object', function() {
    expect(clone).not.toBe(original);
    expect(clone.a).toEqual('A');
    expect(clone.b).toEqual('B');
  });

  it('should not make changes to clone visible in original object', function() {
    clone.a = 'Apple';
    expect(clone.a).toEqual('Apple');
    expect(original.a).toEqual('A');
  });

  it('should make changes to original object visible through clone', function() {
    original.b = 'Banana';
    expect(original.b).toEqual('Banana');
    expect(clone.b).toEqual('Banana');
  });

  it('should not make new properties in clone visible in original object', function() {
    clone.c = 'Car';
    expect(original.c).toBeUndefined();
  });

  it('should make cloned property hide original property', function() {
    clone.a = 'Apple';
    original.a = 'Abracadabra';
    expect(clone.a).toEqual('Apple');
  });

  it('should make original property visible if cloned property is deleted', function() {
    clone.a = 'Apple';
    original.a = 'Abracadabra';
    delete clone.a;
    expect(clone.a).toEqual('Abracadabra');

    // repeating "delete clone.a" won't delete the original's value.
    delete clone.a;
    expect(original.a).toEqual('Abracadabra');
    expect(clone.a).toEqual('Abracadabra');
  });

  it('should return null for a null value', function() {
    expect(owl.clone(null)).toBeNull();
  });

  it('should return undefined for an undefined value', function() {
    expect(owl.clone(undefined)).toBeUndefined();
  });

  it('should not clone non-object types', function() {
    var a = 1;
    var b = 'b';
    var c = true;
    var d = function() {};
    var e;
    expect(owl.clone(a)).toBe(a);
    expect(owl.clone(b)).toBe(b);
    expect(owl.clone(c)).toBe(c);
    expect(owl.clone(d)).toBe(d);
    expect(owl.clone(e)).toBe(e);
  });

});

describe('owl.copy', function() {

  it('should not copy non-object types, they have value semantics', function() {
    var a = 1;
    var b = 'b';
    var c = true;
    var d = function() {};
    var e;
    expect(owl.copy(a)).toBe(a);
    expect(owl.copy(b)).toBe(b);
    expect(owl.copy(c)).toBe(c);
    expect(owl.copy(d)).toBe(d);
    expect(owl.copy(e)).toBe(e);
  });

  it('should return null for a null value', function() {
    expect(owl.copy(null)).toBeNull();
  });

  it('should return undefined for an undefined value', function() {
    expect(owl.copy(undefined)).toBeUndefined();
  });

  it('should copy object wrapper for native type', function() {
    /*jshint -W053*/
    var a = new Number(123);
    var b = new String('abc');
    var c = new Boolean(true);
    var d = new Date();
    /*jshint +W053*/

    var a2 = owl.copy(a);
    var b2 = owl.copy(b);
    var c2 = owl.copy(c);
    var d2 = owl.copy(d);

    expect(a2).not.toBe(a);
    expect(b2).not.toBe(b);
    expect(c2).not.toBe(c);
    expect(d2).not.toBe(d);

    expect(a2 instanceof Number).toBeTruthy();
    expect(b2 instanceof String).toBeTruthy();
    expect(c2 instanceof Boolean).toBeTruthy();
    expect(d2 instanceof Date).toBeTruthy();

    expect(a2.valueOf()).toEqual(a.valueOf());
    expect(b2.valueOf()).toEqual(b.valueOf());
    expect(c2.valueOf()).toEqual(c.valueOf());
    expect(d2.valueOf()).toEqual(d.valueOf());
  });

  it('should copy a plain object that overrides the valueOf function', function() {
    var original = {a: 'A', valueOf: function() { throw new Error('boom'); }};
    var copy = owl.copy(original);
    expect(copy).not.toBe(original);
    expect(copy.a).toEqual('A');
    expect(function(){ copy.valueOf(); }).toThrow(new Error('boom'));
  });

  it('should copy a class that overrides the toString function', function() {
    var Bird = function() {
      Animal.call(this, 'A');
      this.toString = function() { return 'abc'; };
    };
    extend(Bird, Animal);

    var original = new Bird();
    var copy = owl.copy(original);
    expect(copy.toString()).toEqual('abc');
  });

  it('should copy plain object properties', function() {
    var original = { a:'A', b:'B' };
    var copy = owl.copy(original);
    expect(copy).not.toBe(original);
    expect(copy.a).toEqual('A');
    expect(copy.b).toEqual('B');
  });

  it('should not make changes to original object visible through clone', function() {
    var original = { a:'A', b:'B' };
    var copy = owl.copy(original);
    original.b = 'Banana';
    expect(original.b).toEqual('Banana');
    expect(copy.b).toEqual('B');
  });

  it('should make shallow-copy of a plain object', function() {
    var original = { a:'A', b:{c:'C'}, c:[1,2] };
    var copy = owl.copy(original);
    original.b.c = 'Car';
    expect(copy.b.c).toEqual('Car');
    expect(copy.c).toBe(original.c);
  });


  if_es5_it('should copy non-enumerable properties of a plain object', function() {
    var original = { a: 'A' };
    Object.defineProperty(original, 'b', {
      value: 'B',
      enumerable: false
    });
    var copy = owl.copy(original);
    expect(original.b).toEqual('B');
    expect(copy.b).toEqual('B');
  });

  if_es5_it('should copy non-enumerable properties of a user defined class', function() {
    var original = new Dog('A', 'B');
    Object.defineProperty(original, 'c', {
      value: 'C',
      enumerable: false
    });
    var copy = owl.copy(original);
    expect(original.c).toEqual('C');
    expect(copy.c).toEqual('C');
  });

  it('should make shallow-copy of a class', function() {
    var original = new Dog('A', {c: 'C'});
    var copy = owl.copy(original);
    original.b.c = 'Car';
    expect(copy.b.c).toEqual('Car');
  });

  it('should copy a user defined class', function() {
    var original = new Dog('A', 'B');
    var copy = owl.copy(original);
    original.a = 'AA';
    expect(copy).not.toBe(original);
    expect(copy.a).toEqual('A');
    expect(copy.b).toEqual('B');
    expect(copy instanceof Dog).toBeTruthy();
    expect(copy instanceof Animal).toBeTruthy();
  });

  it('should copy properties of an object that overrides hasOwnProperty ', function() {
    var original = new Dog('A', 'B');
    /*jshint -W001*/
    original.hasOwnProperty = function() {
      return false;
    };
    /*jshint +W001*/
    var copy = owl.copy(original);
    original.a = 'AA';
    expect(copy).not.toBe(original);
    expect(copy.a).toEqual('A');
    expect(copy.b).toEqual('B');
    expect(copy instanceof Dog).toBeTruthy();
    expect(copy instanceof Animal).toBeTruthy();
  });

});

describe('owl.deepCopy', function() {

  it('should not copy the document DOM node', function() {
    expect(owl.deepCopy(document)).toBe(document);
  });

  it('should not copy non-object types, they have value semantics', function() {
    var a = 1;
    var b = 'b';
    var c = true;
    var d = function() {};
    var e;
    expect(owl.deepCopy(a)).toBe(a);
    expect(owl.deepCopy(b)).toBe(b);
    expect(owl.deepCopy(c)).toBe(c);
    expect(owl.deepCopy(d)).toBe(d);
    expect(owl.deepCopy(e)).toBe(e);
  });

  it('should return null for null value', function() {
    expect(owl.deepCopy(null)).toBeNull();
  });

  it('should return undefined for an undefined value', function() {
    expect(owl.deepCopy(undefined)).toBeUndefined();
  });

  it('should copy object wrapper for native type', function() {
    /*jshint -W053*/
    var a = new Number(123);
    var b = new String('abc');
    var c = new Boolean(true);
    var d = new Date();
    /*jshint +W053*/

    var a2 = owl.deepCopy(a);
    var b2 = owl.deepCopy(b);
    var c2 = owl.deepCopy(c);
    var d2 = owl.deepCopy(d);

    expect(a2).not.toBe(a);
    expect(b2).not.toBe(b);
    expect(c2).not.toBe(c);
    expect(d2).not.toBe(d);

    expect(a2 instanceof Number).toBeTruthy();
    expect(b2 instanceof String).toBeTruthy();
    expect(c2 instanceof Boolean).toBeTruthy();
    expect(d2 instanceof Date).toBeTruthy();

    expect(a2.valueOf()).toEqual(a.valueOf());
    expect(b2.valueOf()).toEqual(b.valueOf());
    expect(c2.valueOf()).toEqual(c.valueOf());
    expect(d2.valueOf()).toEqual(d.valueOf());
  });

  it('should copy an object that implements a valueOf function', function() {
    var original = {a: 'A', valueOf: function() { throw new Error('boom'); }};
    var copy = owl.deepCopy(original);
    expect(copy).not.toBe(original);
    expect(copy.a).toEqual('A');
    expect(function(){ copy.valueOf(); }).toThrow(new Error('boom'));
  });

  it('should copy plain object properties', function() {
    var original = { a:'A', b:'B' };
    var copy = owl.deepCopy(original);
    expect(copy).not.toBe(original);
    expect(copy.a).toEqual('A');
    expect(copy.b).toEqual('B');
  });

  it('should not make changes to original object visible through clone', function() {
    var original = { a:'A', b:'B' };
    var copy = owl.deepCopy(original);
    original.b = 'Banana';
    expect(original.b).toEqual('Banana');
    expect(copy.b).toEqual('B');
  });

  it('should make deep-copy of a plain object', function() {
    var original = { a:'A', b:{c:'C'}, c:[1,2] };
    var copy = owl.deepCopy(original);
    original.b.c = 'Car';
    expect(copy.b.c).toEqual('C');
    expect(copy.c).not.toBe(original.c);
  });

  it('should recursively copy a class that overrides the toString function', function() {
    var Bird = function() {
      Animal.call(this, 'A');
      this.toString = {a: {b: [1, 2, 3]}};  // toString is now a plain object
    };
    extend(Bird, Animal);

    var original = new Bird();
    var copy = owl.deepCopy(original);
    expect(copy.toString.a).not.toBe(original.toString.a);
    expect(copy.toString.a.b).not.toBe(original.toString.a.b);
    expect(copy.toString.a.b).toEqual(original.toString.a.b);
  });

  if_es5_it('should recursively copy non-enumerable properties of a plain object', function() {
    var original = { a: 'A' };
    Object.defineProperty(original, 'b', {
      value: {},
      enumerable: false
    });
    Object.defineProperty(original.b, 'c', {
      value: 'C',
      enumerable: false
    });
    var copy = owl.deepCopy(original);
    expect(original.b.c).toEqual('C');
    expect(copy.b.c).toEqual('C');
    expect(copy.b).not.toBe(original.b);
  });

  if_es5_it('should copy non-enumerable properties of a user defined class', function() {
    var original = new Dog('A', 'B');
    Object.defineProperty(original, 'c', {
      value: 'C',
      enumerable: false
    });
    var copy = owl.deepCopy(original);
    expect(original.c).toEqual('C');
    expect(copy.c).toEqual('C');
  });

  it('should make deep-copy of a class', function() {
    var original = new Dog('A', {c: 'C'});
    var copy = owl.deepCopy(original);
    original.b.c = 'Car';
    expect(copy.b.c).toEqual('C');
  });

  it('should copy a user defined class', function() {
    var original = new Dog('A', 'B');
    var copy = owl.deepCopy(original);
    original.a = 'AA';
    expect(copy).not.toBe(original);
    expect(copy.a).toEqual('A');
    expect(copy.b).toEqual('B');
    expect(copy instanceof Dog).toBeTruthy();
    expect(copy instanceof Animal).toBeTruthy();
  });

  it('should copy properties of an object that overrides hasOwnProperty ', function() {
    var original = new Dog('A', 'B');
    /*jshint -W001*/
    original.hasOwnProperty = function() {
      return false;
    };
    /*jshint +W001*/
    var copy = owl.deepCopy(original);
    original.a = 'AA';
    expect(copy).not.toBe(original);
    expect(copy.a).toEqual('A');
    expect(copy.b).toEqual('B');
    expect(copy instanceof Dog).toBeTruthy();
    expect(copy instanceof Animal).toBeTruthy();
  });

  it('should handle cyclic references', function() {
    var john = {
      name: 'John Smith',
      hobbies: ['surfing', 'diving'],
      friends: []
    };
    var bob = {
      name: 'Bob Boston',
      hobbies: ['rowing', 'surfing'],
      friends: [ john ]
    };
    john.friends.push(bob);
    var john2 = owl.deepCopy(john);
    var bob2 = john2.friends[0];

    // bob was included in the deep copy,
    // so now we have another bob.
    expect(bob2).not.toBe(bob);

    // john2 and bob2 have the same cyclic
    // relationship as john and bob.
    expect(bob2.friends[0]).toBe(john2);
  });

  it('should abort if the max recursion depth is reached', function() {
    var a = {a:{b:{c:'C'}}};
    expect(owl.deepCopy(a.a).b.c).toEqual('C');
    expect(function(){ owl.deepCopy(a, 2); }).toThrow(new Error('Exceeded max recursion depth in deep copy.'));
  });

  it('should use custom registered copier', function() {
    owl.deepCopy.register({
      canCopy: function(source) {
        return ( source.copyMe );
      },

      create: function() {
        return {};
      },

      populate: function(deepCopy, source, result) {
        result.copyMe = source.copyMe + 'abc';
        return result;
      }
    });
    expect(owl.deepCopy({copyMe: '123'}).copyMe).toEqual('123abc');
  });

  it('should use custom copier registered via DeepCopier instance', function() {
    var CustomCopier = function() {};
    extend(CustomCopier, owl.deepCopy.DeepCopier);
    CustomCopier.prototype.canCopy = function(source) {
      return ( source.customCopier );
    };
    CustomCopier.prototype.create = function() {
      return {};
    };
    CustomCopier.prototype.populate = function(deepCopy, source, result) {
      result.customCopier = source.customCopier + 'abc';
      return result;
    };
    owl.deepCopy.register(new CustomCopier());
    expect(owl.deepCopy({customCopier: '123'}).customCopier).toEqual('123abc');
  });

  it('should recursively copy DOM nodes', function() {
    var div = document.createElement('div');
    var p1 = document.createElement('p');
    var p2 = document.createElement('p');
    var t1 = document.createTextNode('123');
    var t2 = document.createTextNode('abc');
    p1.appendChild(t1);
    p2.appendChild(t2);
    div.appendChild(p1);
    div.appendChild(p2);
    var divCopy = owl.deepCopy(div);

    expect(divCopy).not.toBe(div);
    expect(divCopy.childNodes.length).toEqual(2);
    expect(divCopy.childNodes[0].firstChild).not.toBe(t1);
    expect(divCopy.childNodes[0].firstChild.nodeValue).toEqual('123');
    expect(divCopy.childNodes[1].firstChild).not.toBe(t2);
    expect(divCopy.childNodes[1].firstChild.nodeValue).toEqual('abc');
  });

  it('should preserve reference structure of DOM nodes with the rest of the copy', function() {
    var outerDiv = document.createElement('div');
    var headerDiv = document.createElement('div');
    var footerDiv = document.createElement('div');
    var contentP = document.createElement('div');
    contentP.appendChild(outerDiv);
    contentP.appendChild(headerDiv);
    contentP.appendChild(footerDiv);
    var original = {
      outer: outerDiv,
      header: headerDiv,
      footer: footerDiv,
      body: contentP
    };
    var copy = owl.deepCopy(original);
    expect(copy.outer).not.toBe(original.outer);
    expect(copy.outer).toBe(copy.body.childNodes[0]);
    expect(copy.header).toBe(copy.body.childNodes[1]);
    expect(copy.footer).toBe(copy.body.childNodes[2]);
  });

});
