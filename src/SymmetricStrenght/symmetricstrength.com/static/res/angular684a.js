(function (O, U, t) {
  "use strict";
  function J(b) {
    return function () {
      var a = arguments[0],
        c;
      c =
        "[" +
        (b ? b + ":" : "") +
        a +
        "] http://errors.angularjs.org/1.4.3/" +
        (b ? b + "/" : "") +
        a;
      for (a = 1; a < arguments.length; a++) {
        c = c + (1 == a ? "?" : "&") + "p" + (a - 1) + "=";
        var d = encodeURIComponent,
          e;
        e = arguments[a];
        e =
          "function" == typeof e
            ? e.toString().replace(/ \{[\s\S]*$/, "")
            : "undefined" == typeof e
            ? "undefined"
            : "string" != typeof e
            ? JSON.stringify(e)
            : e;
        c += d(e);
      }
      return Error(c);
    };
  }
  function Ea(b) {
    if (null == b || Wa(b)) return !1;
    var a = "length" in Object(b) && b.length;
    return b.nodeType === qa && a
      ? !0
      : L(b) ||
          G(b) ||
          0 === a ||
          ("number" === typeof a && 0 < a && a - 1 in b);
  }
  function m(b, a, c) {
    var d, e;
    if (b)
      if (z(b))
        for (d in b)
          "prototype" == d ||
            "length" == d ||
            "name" == d ||
            (b.hasOwnProperty && !b.hasOwnProperty(d)) ||
            a.call(c, b[d], d, b);
      else if (G(b) || Ea(b)) {
        var f = "object" !== typeof b;
        d = 0;
        for (e = b.length; d < e; d++) (f || d in b) && a.call(c, b[d], d, b);
      } else if (b.forEach && b.forEach !== m) b.forEach(a, c, b);
      else if (nc(b)) for (d in b) a.call(c, b[d], d, b);
      else if ("function" === typeof b.hasOwnProperty)
        for (d in b) b.hasOwnProperty(d) && a.call(c, b[d], d, b);
      else for (d in b) Xa.call(b, d) && a.call(c, b[d], d, b);
    return b;
  }
  function oc(b, a, c) {
    for (var d = Object.keys(b).sort(), e = 0; e < d.length; e++)
      a.call(c, b[d[e]], d[e]);
    return d;
  }
  function pc(b) {
    return function (a, c) {
      b(c, a);
    };
  }
  function Ud() {
    return ++nb;
  }
  function qc(b, a) {
    a ? (b.$$hashKey = a) : delete b.$$hashKey;
  }
  function Nb(b, a, c) {
    for (var d = b.$$hashKey, e = 0, f = a.length; e < f; ++e) {
      var g = a[e];
      if (H(g) || z(g))
        for (var h = Object.keys(g), l = 0, k = h.length; l < k; l++) {
          var n = h[l],
            r = g[n];
          c && H(r)
            ? aa(r)
              ? (b[n] = new Date(r.valueOf()))
              : (H(b[n]) || (b[n] = G(r) ? [] : {}), Nb(b[n], [r], !0))
            : (b[n] = r);
        }
    }
    qc(b, d);
    return b;
  }
  function P(b) {
    return Nb(b, za.call(arguments, 1), !1);
  }
  function Vd(b) {
    return Nb(b, za.call(arguments, 1), !0);
  }
  function W(b) {
    return parseInt(b, 10);
  }
  function Ob(b, a) {
    return P(Object.create(b), a);
  }
  function v() {}
  function Ya(b) {
    return b;
  }
  function ra(b) {
    return function () {
      return b;
    };
  }
  function rc(b) {
    return z(b.toString) && b.toString !== Object.prototype.toString;
  }
  function A(b) {
    return "undefined" === typeof b;
  }
  function w(b) {
    return "undefined" !== typeof b;
  }
  function H(b) {
    return null !== b && "object" === typeof b;
  }
  function nc(b) {
    return null !== b && "object" === typeof b && !sc(b);
  }
  function L(b) {
    return "string" === typeof b;
  }
  function V(b) {
    return "number" === typeof b;
  }
  function aa(b) {
    return "[object Date]" === sa.call(b);
  }
  function z(b) {
    return "function" === typeof b;
  }
  function Za(b) {
    return "[object RegExp]" === sa.call(b);
  }
  function Wa(b) {
    return b && b.window === b;
  }
  function $a(b) {
    return b && b.$evalAsync && b.$watch;
  }
  function ab(b) {
    return "boolean" === typeof b;
  }
  function tc(b) {
    return !(!b || !(b.nodeName || (b.prop && b.attr && b.find)));
  }
  function Wd(b) {
    var a = {};
    b = b.split(",");
    var c;
    for (c = 0; c < b.length; c++) a[b[c]] = !0;
    return a;
  }
  function ta(b) {
    return M(b.nodeName || (b[0] && b[0].nodeName));
  }
  function bb(b, a) {
    var c = b.indexOf(a);
    0 <= c && b.splice(c, 1);
    return c;
  }
  function fa(b, a, c, d) {
    if (Wa(b) || $a(b)) throw Fa("cpws");
    if (uc.test(sa.call(a))) throw Fa("cpta");
    if (a) {
      if (b === a) throw Fa("cpi");
      c = c || [];
      d = d || [];
      H(b) && (c.push(b), d.push(a));
      var e;
      if (G(b))
        for (e = a.length = 0; e < b.length; e++) a.push(fa(b[e], null, c, d));
      else {
        var f = a.$$hashKey;
        G(a)
          ? (a.length = 0)
          : m(a, function (b, c) {
              delete a[c];
            });
        if (nc(b)) for (e in b) a[e] = fa(b[e], null, c, d);
        else if (b && "function" === typeof b.hasOwnProperty)
          for (e in b) b.hasOwnProperty(e) && (a[e] = fa(b[e], null, c, d));
        else for (e in b) Xa.call(b, e) && (a[e] = fa(b[e], null, c, d));
        qc(a, f);
      }
    } else if (((a = b), H(b))) {
      if (c && -1 !== (f = c.indexOf(b))) return d[f];
      if (G(b)) return fa(b, [], c, d);
      if (uc.test(sa.call(b))) a = new b.constructor(b);
      else if (aa(b)) a = new Date(b.getTime());
      else if (Za(b))
        (a = new RegExp(b.source, b.toString().match(/[^\/]*$/)[0])),
          (a.lastIndex = b.lastIndex);
      else return (e = Object.create(sc(b))), fa(b, e, c, d);
      d && (c.push(b), d.push(a));
    }
    return a;
  }
  function ia(b, a) {
    if (G(b)) {
      a = a || [];
      for (var c = 0, d = b.length; c < d; c++) a[c] = b[c];
    } else if (H(b))
      for (c in ((a = a || {}), b))
        if ("$" !== c.charAt(0) || "$" !== c.charAt(1)) a[c] = b[c];
    return a || b;
  }
  function ka(b, a) {
    if (b === a) return !0;
    if (null === b || null === a) return !1;
    if (b !== b && a !== a) return !0;
    var c = typeof b,
      d;
    if (c == typeof a && "object" == c)
      if (G(b)) {
        if (!G(a)) return !1;
        if ((c = b.length) == a.length) {
          for (d = 0; d < c; d++) if (!ka(b[d], a[d])) return !1;
          return !0;
        }
      } else {
        if (aa(b)) return aa(a) ? ka(b.getTime(), a.getTime()) : !1;
        if (Za(b)) return Za(a) ? b.toString() == a.toString() : !1;
        if ($a(b) || $a(a) || Wa(b) || Wa(a) || G(a) || aa(a) || Za(a))
          return !1;
        c = ga();
        for (d in b)
          if ("$" !== d.charAt(0) && !z(b[d])) {
            if (!ka(b[d], a[d])) return !1;
            c[d] = !0;
          }
        for (d in a)
          if (!(d in c || "$" === d.charAt(0) || a[d] === t || z(a[d])))
            return !1;
        return !0;
      }
    return !1;
  }
  function cb(b, a, c) {
    return b.concat(za.call(a, c));
  }
  function vc(b, a) {
    var c = 2 < arguments.length ? za.call(arguments, 2) : [];
    return !z(a) || a instanceof RegExp
      ? a
      : c.length
      ? function () {
          return arguments.length
            ? a.apply(b, cb(c, arguments, 0))
            : a.apply(b, c);
        }
      : function () {
          return arguments.length ? a.apply(b, arguments) : a.call(b);
        };
  }
  function Xd(b, a) {
    var c = a;
    "string" === typeof b && "$" === b.charAt(0) && "$" === b.charAt(1)
      ? (c = t)
      : Wa(a)
      ? (c = "$WINDOW")
      : a && U === a
      ? (c = "$DOCUMENT")
      : $a(a) && (c = "$SCOPE");
    return c;
  }
  function db(b, a) {
    if ("undefined" === typeof b) return t;
    V(a) || (a = a ? 2 : null);
    return JSON.stringify(b, Xd, a);
  }
  function wc(b) {
    return L(b) ? JSON.parse(b) : b;
  }
  function xc(b, a) {
    var c = Date.parse("Jan 01, 1970 00:00:00 " + b) / 6e4;
    return isNaN(c) ? a : c;
  }
  function Pb(b, a, c) {
    c = c ? -1 : 1;
    var d = xc(a, b.getTimezoneOffset());
    a = b;
    b = c * (d - b.getTimezoneOffset());
    a = new Date(a.getTime());
    a.setMinutes(a.getMinutes() + b);
    return a;
  }
  function ua(b) {
    b = y(b).clone();
    try {
      b.empty();
    } catch (a) {}
    var c = y("<div>").append(b).html();
    try {
      return b[0].nodeType === Na
        ? M(c)
        : c.match(/^(<[^>]+>)/)[1].replace(/^<([\w\-]+)/, function (a, b) {
            return "<" + M(b);
          });
    } catch (d) {
      return M(c);
    }
  }
  function yc(b) {
    try {
      return decodeURIComponent(b);
    } catch (a) {}
  }
  function zc(b) {
    var a = {},
      c,
      d;
    m((b || "").split("&"), function (b) {
      b &&
        ((c = b.replace(/\+/g, "%20").split("=")),
        (d = yc(c[0])),
        w(d) &&
          ((b = w(c[1]) ? yc(c[1]) : !0),
          Xa.call(a, d)
            ? G(a[d])
              ? a[d].push(b)
              : (a[d] = [a[d], b])
            : (a[d] = b)));
    });
    return a;
  }
  function Qb(b) {
    var a = [];
    m(b, function (b, d) {
      G(b)
        ? m(b, function (b) {
            a.push(ma(d, !0) + (!0 === b ? "" : "=" + ma(b, !0)));
          })
        : a.push(ma(d, !0) + (!0 === b ? "" : "=" + ma(b, !0)));
    });
    return a.length ? a.join("&") : "";
  }
  function ob(b) {
    return ma(b, !0)
      .replace(/%26/gi, "&")
      .replace(/%3D/gi, "=")
      .replace(/%2B/gi, "+");
  }
  function ma(b, a) {
    return encodeURIComponent(b)
      .replace(/%40/gi, "@")
      .replace(/%3A/gi, ":")
      .replace(/%24/g, "$")
      .replace(/%2C/gi, ",")
      .replace(/%3B/gi, ";")
      .replace(/%20/g, a ? "%20" : "+");
  }
  function Yd(b, a) {
    var c,
      d,
      e = Oa.length;
    for (d = 0; d < e; ++d)
      if (((c = Oa[d] + a), L((c = b.getAttribute(c))))) return c;
    return null;
  }
  function Zd(b, a) {
    var c,
      d,
      e = {};
    m(Oa, function (a) {
      a += "app";
      !c &&
        b.hasAttribute &&
        b.hasAttribute(a) &&
        ((c = b), (d = b.getAttribute(a)));
    });
    m(Oa, function (a) {
      a += "app";
      var e;
      !c &&
        (e = b.querySelector("[" + a.replace(":", "\\:") + "]")) &&
        ((c = e), (d = e.getAttribute(a)));
    });
    c && ((e.strictDi = null !== Yd(c, "strict-di")), a(c, d ? [d] : [], e));
  }
  function Ac(b, a, c) {
    H(c) || (c = {});
    c = P({ strictDi: !1 }, c);
    var d = function () {
        b = y(b);
        if (b.injector()) {
          var d = b[0] === U ? "document" : ua(b);
          throw Fa("btstrpd", d.replace(/</, "&lt;").replace(/>/, "&gt;"));
        }
        a = a || [];
        a.unshift([
          "$provide",
          function (a) {
            a.value("$rootElement", b);
          },
        ]);
        c.debugInfoEnabled &&
          a.push([
            "$compileProvider",
            function (a) {
              a.debugInfoEnabled(!0);
            },
          ]);
        a.unshift("ng");
        d = eb(a, c.strictDi);
        d.invoke([
          "$rootScope",
          "$rootElement",
          "$compile",
          "$injector",
          function (a, b, c, d) {
            a.$apply(function () {
              b.data("$injector", d);
              c(b)(a);
            });
          },
        ]);
        return d;
      },
      e = /^NG_ENABLE_DEBUG_INFO!/,
      f = /^NG_DEFER_BOOTSTRAP!/;
    O &&
      e.test(O.name) &&
      ((c.debugInfoEnabled = !0), (O.name = O.name.replace(e, "")));
    if (O && !f.test(O.name)) return d();
    O.name = O.name.replace(f, "");
    ca.resumeBootstrap = function (b) {
      m(b, function (b) {
        a.push(b);
      });
      return d();
    };
    z(ca.resumeDeferredBootstrap) && ca.resumeDeferredBootstrap();
  }
  function $d() {
    O.name = "NG_ENABLE_DEBUG_INFO!" + O.name;
    O.location.reload();
  }
  function ae(b) {
    b = ca.element(b).injector();
    if (!b) throw Fa("test");
    return b.get("$$testability");
  }
  function Bc(b, a) {
    a = a || "_";
    return b.replace(be, function (b, d) {
      return (d ? a : "") + b.toLowerCase();
    });
  }
  function ce() {
    var b;
    if (!Cc) {
      var a = pb();
      la = O.jQuery;
      w(a) && (la = null === a ? t : O[a]);
      la && la.fn.on
        ? ((y = la),
          P(la.fn, {
            scope: Pa.scope,
            isolateScope: Pa.isolateScope,
            controller: Pa.controller,
            injector: Pa.injector,
            inheritedData: Pa.inheritedData,
          }),
          (b = la.cleanData),
          (la.cleanData = function (a) {
            var d;
            if (Rb) Rb = !1;
            else
              for (var e = 0, f; null != (f = a[e]); e++)
                (d = la._data(f, "events")) &&
                  d.$destroy &&
                  la(f).triggerHandler("$destroy");
            b(a);
          }))
        : (y = Q);
      ca.element = y;
      Cc = !0;
    }
  }
  function Sb(b, a, c) {
    if (!b) throw Fa("areq", a || "?", c || "required");
    return b;
  }
  function Qa(b, a, c) {
    c && G(b) && (b = b[b.length - 1]);
    Sb(
      z(b),
      a,
      "not a function, got " +
        (b && "object" === typeof b ? b.constructor.name || "Object" : typeof b)
    );
    return b;
  }
  function Ra(b, a) {
    if ("hasOwnProperty" === b) throw Fa("badname", a);
  }
  function Dc(b, a, c) {
    if (!a) return b;
    a = a.split(".");
    for (var d, e = b, f = a.length, g = 0; g < f; g++)
      (d = a[g]), b && (b = (e = b)[d]);
    return !c && z(b) ? vc(e, b) : b;
  }
  function qb(b) {
    var a = b[0];
    b = b[b.length - 1];
    var c = [a];
    do {
      a = a.nextSibling;
      if (!a) break;
      c.push(a);
    } while (a !== b);
    return y(c);
  }
  function ga() {
    return Object.create(null);
  }
  function de(b) {
    function a(a, b, c) {
      return a[b] || (a[b] = c());
    }
    var c = J("$injector"),
      d = J("ng");
    b = a(b, "angular", Object);
    b.$$minErr = b.$$minErr || J;
    return a(b, "module", function () {
      var b = {};
      return function (f, g, h) {
        if ("hasOwnProperty" === f) throw d("badname", "module");
        g && b.hasOwnProperty(f) && (b[f] = null);
        return a(b, f, function () {
          function a(b, c, e, f) {
            f || (f = d);
            return function () {
              f[e || "push"]([b, c, arguments]);
              return C;
            };
          }
          function b(a, c) {
            return function (b, e) {
              e && z(e) && (e.$$moduleName = f);
              d.push([a, c, arguments]);
              return C;
            };
          }
          if (!g) throw c("nomod", f);
          var d = [],
            e = [],
            s = [],
            x = a("$injector", "invoke", "push", e),
            C = {
              _invokeQueue: d,
              _configBlocks: e,
              _runBlocks: s,
              requires: g,
              name: f,
              provider: b("$provide", "provider"),
              factory: b("$provide", "factory"),
              service: b("$provide", "service"),
              value: a("$provide", "value"),
              constant: a("$provide", "constant", "unshift"),
              decorator: b("$provide", "decorator"),
              animation: b("$animateProvider", "register"),
              filter: b("$filterProvider", "register"),
              controller: b("$controllerProvider", "register"),
              directive: b("$compileProvider", "directive"),
              config: x,
              run: function (a) {
                s.push(a);
                return this;
              },
            };
          h && x(h);
          return C;
        });
      };
    });
  }
  function ee(b) {
    P(b, {
      bootstrap: Ac,
      copy: fa,
      extend: P,
      merge: Vd,
      equals: ka,
      element: y,
      forEach: m,
      injector: eb,
      noop: v,
      bind: vc,
      toJson: db,
      fromJson: wc,
      identity: Ya,
      isUndefined: A,
      isDefined: w,
      isString: L,
      isFunction: z,
      isObject: H,
      isNumber: V,
      isElement: tc,
      isArray: G,
      version: fe,
      isDate: aa,
      lowercase: M,
      uppercase: rb,
      callbacks: { counter: 0 },
      getTestability: ae,
      $$minErr: J,
      $$csp: fb,
      reloadWithDebugInfo: $d,
    });
    gb = de(O);
    try {
      gb("ngLocale");
    } catch (a) {
      gb("ngLocale", []).provider("$locale", ge);
    }
    gb(
      "ng",
      ["ngLocale"],
      [
        "$provide",
        function (a) {
          a.provider({ $$sanitizeUri: he });
          a.provider("$compile", Ec)
            .directive({
              a: ie,
              input: Fc,
              textarea: Fc,
              form: je,
              script: ke,
              select: le,
              style: me,
              option: ne,
              ngBind: oe,
              ngBindHtml: pe,
              ngBindTemplate: qe,
              ngClass: re,
              ngClassEven: se,
              ngClassOdd: te,
              ngCloak: ue,
              ngController: ve,
              ngForm: we,
              ngHide: xe,
              ngIf: ye,
              ngInclude: ze,
              ngInit: Ae,
              ngNonBindable: Be,
              ngPluralize: Ce,
              ngRepeat: De,
              ngShow: Ee,
              ngStyle: Fe,
              ngSwitch: Ge,
              ngSwitchWhen: He,
              ngSwitchDefault: Ie,
              ngOptions: Je,
              ngTransclude: Ke,
              ngModel: Le,
              ngList: Me,
              ngChange: Ne,
              pattern: Gc,
              ngPattern: Gc,
              required: Hc,
              ngRequired: Hc,
              minlength: Ic,
              ngMinlength: Ic,
              maxlength: Jc,
              ngMaxlength: Jc,
              ngValue: Oe,
              ngModelOptions: Pe,
            })
            .directive({ ngInclude: Qe })
            .directive(sb)
            .directive(Kc);
          a.provider({
            $anchorScroll: Re,
            $animate: Se,
            $$animateQueue: Te,
            $$AnimateRunner: Ue,
            $browser: Ve,
            $cacheFactory: We,
            $controller: Xe,
            $document: Ye,
            $exceptionHandler: Ze,
            $filter: Lc,
            $interpolate: $e,
            $interval: af,
            $http: bf,
            $httpParamSerializer: cf,
            $httpParamSerializerJQLike: df,
            $httpBackend: ef,
            $location: ff,
            $log: gf,
            $parse: hf,
            $rootScope: jf,
            $q: kf,
            $$q: lf,
            $sce: mf,
            $sceDelegate: nf,
            $sniffer: of,
            $templateCache: pf,
            $templateRequest: qf,
            $$testability: rf,
            $timeout: sf,
            $window: tf,
            $$rAF: uf,
            $$jqLite: vf,
            $$HashMap: wf,
            $$cookieReader: xf,
          });
        },
      ]
    );
  }
  function hb(b) {
    return b
      .replace(yf, function (a, b, d, e) {
        return e ? d.toUpperCase() : d;
      })
      .replace(zf, "Moz$1");
  }
  function Mc(b) {
    b = b.nodeType;
    return b === qa || !b || 9 === b;
  }
  function Nc(b, a) {
    var c,
      d,
      e = a.createDocumentFragment(),
      f = [];
    if (Tb.test(b)) {
      c = c || e.appendChild(a.createElement("div"));
      d = (Af.exec(b) || ["", ""])[1].toLowerCase();
      d = na[d] || na._default;
      c.innerHTML = d[1] + b.replace(Bf, "<$1></$2>") + d[2];
      for (d = d[0]; d--; ) c = c.lastChild;
      f = cb(f, c.childNodes);
      c = e.firstChild;
      c.textContent = "";
    } else f.push(a.createTextNode(b));
    e.textContent = "";
    e.innerHTML = "";
    m(f, function (a) {
      e.appendChild(a);
    });
    return e;
  }
  function Q(b) {
    if (b instanceof Q) return b;
    var a;
    L(b) && ((b = R(b)), (a = !0));
    if (!(this instanceof Q)) {
      if (a && "<" != b.charAt(0)) throw Ub("nosel");
      return new Q(b);
    }
    if (a) {
      a = U;
      var c;
      b = (c = Cf.exec(b))
        ? [a.createElement(c[1])]
        : (c = Nc(b, a))
        ? c.childNodes
        : [];
    }
    Oc(this, b);
  }
  function Vb(b) {
    return b.cloneNode(!0);
  }
  function tb(b, a) {
    a || ub(b);
    if (b.querySelectorAll)
      for (var c = b.querySelectorAll("*"), d = 0, e = c.length; d < e; d++)
        ub(c[d]);
  }
  function Pc(b, a, c, d) {
    if (w(d)) throw Ub("offargs");
    var e = (d = vb(b)) && d.events,
      f = d && d.handle;
    if (f)
      if (a)
        m(a.split(" "), function (a) {
          if (w(c)) {
            var d = e[a];
            bb(d || [], c);
            if (d && 0 < d.length) return;
          }
          b.removeEventListener(a, f, !1);
          delete e[a];
        });
      else
        for (a in e)
          "$destroy" !== a && b.removeEventListener(a, f, !1), delete e[a];
  }
  function ub(b, a) {
    var c = b.ng339,
      d = c && ib[c];
    d &&
      (a
        ? delete d.data[a]
        : (d.handle && (d.events.$destroy && d.handle({}, "$destroy"), Pc(b)),
          delete ib[c],
          (b.ng339 = t)));
  }
  function vb(b, a) {
    var c = b.ng339,
      c = c && ib[c];
    a &&
      !c &&
      ((b.ng339 = c = ++Df), (c = ib[c] = { events: {}, data: {}, handle: t }));
    return c;
  }
  function Wb(b, a, c) {
    if (Mc(b)) {
      var d = w(c),
        e = !d && a && !H(a),
        f = !a;
      b = (b = vb(b, !e)) && b.data;
      if (d) b[a] = c;
      else {
        if (f) return b;
        if (e) return b && b[a];
        P(b, a);
      }
    }
  }
  function wb(b, a) {
    return b.getAttribute
      ? -1 <
          (" " + (b.getAttribute("class") || "") + " ")
            .replace(/[\n\t]/g, " ")
            .indexOf(" " + a + " ")
      : !1;
  }
  function xb(b, a) {
    a &&
      b.setAttribute &&
      m(a.split(" "), function (a) {
        b.setAttribute(
          "class",
          R(
            (" " + (b.getAttribute("class") || "") + " ")
              .replace(/[\n\t]/g, " ")
              .replace(" " + R(a) + " ", " ")
          )
        );
      });
  }
  function yb(b, a) {
    if (a && b.setAttribute) {
      var c = (" " + (b.getAttribute("class") || "") + " ").replace(
        /[\n\t]/g,
        " "
      );
      m(a.split(" "), function (a) {
        a = R(a);
        -1 === c.indexOf(" " + a + " ") && (c += a + " ");
      });
      b.setAttribute("class", R(c));
    }
  }
  function Oc(b, a) {
    if (a)
      if (a.nodeType) b[b.length++] = a;
      else {
        var c = a.length;
        if ("number" === typeof c && a.window !== a) {
          if (c) for (var d = 0; d < c; d++) b[b.length++] = a[d];
        } else b[b.length++] = a;
      }
  }
  function Qc(b, a) {
    return zb(b, "$" + (a || "ngController") + "Controller");
  }
  function zb(b, a, c) {
    9 == b.nodeType && (b = b.documentElement);
    for (a = G(a) ? a : [a]; b; ) {
      for (var d = 0, e = a.length; d < e; d++)
        if ((c = y.data(b, a[d])) !== t) return c;
      b = b.parentNode || (11 === b.nodeType && b.host);
    }
  }
  function Rc(b) {
    for (tb(b, !0); b.firstChild; ) b.removeChild(b.firstChild);
  }
  function Xb(b, a) {
    a || tb(b);
    var c = b.parentNode;
    c && c.removeChild(b);
  }
  function Ef(b, a) {
    a = a || O;
    if ("complete" === a.document.readyState) a.setTimeout(b);
    else y(a).on("load", b);
  }
  function Sc(b, a) {
    var c = Ab[a.toLowerCase()];
    return c && Tc[ta(b)] && c;
  }
  function Ff(b, a) {
    var c = b.nodeName;
    return ("INPUT" === c || "TEXTAREA" === c) && Uc[a];
  }
  function Gf(b, a) {
    var c = function (c, e) {
      c.isDefaultPrevented = function () {
        return c.defaultPrevented;
      };
      var f = a[e || c.type],
        g = f ? f.length : 0;
      if (g) {
        if (A(c.immediatePropagationStopped)) {
          var h = c.stopImmediatePropagation;
          c.stopImmediatePropagation = function () {
            c.immediatePropagationStopped = !0;
            c.stopPropagation && c.stopPropagation();
            h && h.call(c);
          };
        }
        c.isImmediatePropagationStopped = function () {
          return !0 === c.immediatePropagationStopped;
        };
        1 < g && (f = ia(f));
        for (var l = 0; l < g; l++)
          c.isImmediatePropagationStopped() || f[l].call(b, c);
      }
    };
    c.elem = b;
    return c;
  }
  function vf() {
    this.$get = function () {
      return P(Q, {
        hasClass: function (b, a) {
          b.attr && (b = b[0]);
          return wb(b, a);
        },
        addClass: function (b, a) {
          b.attr && (b = b[0]);
          return yb(b, a);
        },
        removeClass: function (b, a) {
          b.attr && (b = b[0]);
          return xb(b, a);
        },
      });
    };
  }
  function Ga(b, a) {
    var c = b && b.$$hashKey;
    if (c) return "function" === typeof c && (c = b.$$hashKey()), c;
    c = typeof b;
    return (c =
      "function" == c || ("object" == c && null !== b)
        ? (b.$$hashKey = c + ":" + (a || Ud)())
        : c + ":" + b);
  }
  function Sa(b, a) {
    if (a) {
      var c = 0;
      this.nextUid = function () {
        return ++c;
      };
    }
    m(b, this.put, this);
  }
  function Hf(b) {
    return (b = b.toString().replace(Vc, "").match(Wc))
      ? "function(" + (b[1] || "").replace(/[\s\r\n]+/, " ") + ")"
      : "fn";
  }
  function eb(b, a) {
    function c(a) {
      return function (b, c) {
        if (H(b)) m(b, pc(a));
        else return a(b, c);
      };
    }
    function d(a, b) {
      Ra(a, "service");
      if (z(b) || G(b)) b = s.instantiate(b);
      if (!b.$get) throw Ha("pget", a);
      return (r[a + "Provider"] = b);
    }
    function e(a, b) {
      return function () {
        var c = C.invoke(b, this);
        if (A(c)) throw Ha("undef", a);
        return c;
      };
    }
    function f(a, b, c) {
      return d(a, { $get: !1 !== c ? e(a, b) : b });
    }
    function g(a) {
      var b = [],
        c;
      m(a, function (a) {
        function d(a) {
          var b, c;
          b = 0;
          for (c = a.length; b < c; b++) {
            var e = a[b],
              f = s.get(e[0]);
            f[e[1]].apply(f, e[2]);
          }
        }
        if (!n.get(a)) {
          n.put(a, !0);
          try {
            L(a)
              ? ((c = gb(a)),
                (b = b.concat(g(c.requires)).concat(c._runBlocks)),
                d(c._invokeQueue),
                d(c._configBlocks))
              : z(a)
              ? b.push(s.invoke(a))
              : G(a)
              ? b.push(s.invoke(a))
              : Qa(a, "module");
          } catch (e) {
            throw (
              (G(a) && (a = a[a.length - 1]),
              e.message &&
                e.stack &&
                -1 == e.stack.indexOf(e.message) &&
                (e = e.message + "\n" + e.stack),
              Ha("modulerr", a, e.stack || e.message || e))
            );
          }
        }
      });
      return b;
    }
    function h(b, c) {
      function d(a, e) {
        if (b.hasOwnProperty(a)) {
          if (b[a] === l) throw Ha("cdep", a + " <- " + k.join(" <- "));
          return b[a];
        }
        try {
          return k.unshift(a), (b[a] = l), (b[a] = c(a, e));
        } catch (f) {
          throw (b[a] === l && delete b[a], f);
        } finally {
          k.shift();
        }
      }
      function e(b, c, f, g) {
        "string" === typeof f && ((g = f), (f = null));
        var h = [],
          k = eb.$$annotate(b, a, g),
          l,
          s,
          n;
        s = 0;
        for (l = k.length; s < l; s++) {
          n = k[s];
          if ("string" !== typeof n) throw Ha("itkn", n);
          h.push(f && f.hasOwnProperty(n) ? f[n] : d(n, g));
        }
        G(b) && (b = b[l]);
        return b.apply(c, h);
      }
      return {
        invoke: e,
        instantiate: function (a, b, c) {
          var d = Object.create((G(a) ? a[a.length - 1] : a).prototype || null);
          a = e(a, d, b, c);
          return H(a) || z(a) ? a : d;
        },
        get: d,
        annotate: eb.$$annotate,
        has: function (a) {
          return r.hasOwnProperty(a + "Provider") || b.hasOwnProperty(a);
        },
      };
    }
    a = !0 === a;
    var l = {},
      k = [],
      n = new Sa([], !0),
      r = {
        $provide: {
          provider: c(d),
          factory: c(f),
          service: c(function (a, b) {
            return f(a, [
              "$injector",
              function (a) {
                return a.instantiate(b);
              },
            ]);
          }),
          value: c(function (a, b) {
            return f(a, ra(b), !1);
          }),
          constant: c(function (a, b) {
            Ra(a, "constant");
            r[a] = b;
            x[a] = b;
          }),
          decorator: function (a, b) {
            var c = s.get(a + "Provider"),
              d = c.$get;
            c.$get = function () {
              var a = C.invoke(d, c);
              return C.invoke(b, null, { $delegate: a });
            };
          },
        },
      },
      s = (r.$injector = h(r, function (a, b) {
        ca.isString(b) && k.push(b);
        throw Ha("unpr", k.join(" <- "));
      })),
      x = {},
      C = (x.$injector = h(x, function (a, b) {
        var c = s.get(a + "Provider", b);
        return C.invoke(c.$get, c, t, a);
      }));
    m(g(b), function (a) {
      a && C.invoke(a);
    });
    return C;
  }
  function Re() {
    var b = !0;
    this.disableAutoScrolling = function () {
      b = !1;
    };
    this.$get = [
      "$window",
      "$location",
      "$rootScope",
      function (a, c, d) {
        function e(a) {
          var b = null;
          Array.prototype.some.call(a, function (a) {
            if ("a" === ta(a)) return (b = a), !0;
          });
          return b;
        }
        function f(b) {
          if (b) {
            b.scrollIntoView();
            var c;
            c = g.yOffset;
            z(c)
              ? (c = c())
              : tc(c)
              ? ((c = c[0]),
                (c =
                  "fixed" !== a.getComputedStyle(c).position
                    ? 0
                    : c.getBoundingClientRect().bottom))
              : V(c) || (c = 0);
            c && ((b = b.getBoundingClientRect().top), a.scrollBy(0, b - c));
          } else a.scrollTo(0, 0);
        }
        function g(a) {
          a = L(a) ? a : c.hash();
          var b;
          a
            ? (b = h.getElementById(a))
              ? f(b)
              : (b = e(h.getElementsByName(a)))
              ? f(b)
              : "top" === a && f(null)
            : f(null);
        }
        var h = a.document;
        b &&
          d.$watch(
            function () {
              return c.hash();
            },
            function (a, b) {
              (a === b && "" === a) ||
                Ef(function () {
                  d.$evalAsync(g);
                });
            }
          );
        return g;
      },
    ];
  }
  function jb(b, a) {
    if (!b && !a) return "";
    if (!b) return a;
    if (!a) return b;
    G(b) && (b = b.join(" "));
    G(a) && (a = a.join(" "));
    return b + " " + a;
  }
  function If(b) {
    L(b) && (b = b.split(" "));
    var a = ga();
    m(b, function (b) {
      b.length && (a[b] = !0);
    });
    return a;
  }
  function Ia(b) {
    return H(b) ? b : {};
  }
  function Jf(b, a, c, d) {
    function e(a) {
      try {
        a.apply(null, za.call(arguments, 1));
      } finally {
        if ((C--, 0 === C))
          for (; F.length; )
            try {
              F.pop()();
            } catch (b) {
              c.error(b);
            }
      }
    }
    function f() {
      g();
      h();
    }
    function g() {
      a: {
        try {
          u = n.state;
          break a;
        } catch (a) {}
        u = void 0;
      }
      u = A(u) ? null : u;
      ka(u, D) && (u = D);
      D = u;
    }
    function h() {
      if (K !== l.url() || p !== u)
        (K = l.url()),
          (p = u),
          m(B, function (a) {
            a(l.url(), u);
          });
    }
    var l = this,
      k = b.location,
      n = b.history,
      r = b.setTimeout,
      s = b.clearTimeout,
      x = {};
    l.isMock = !1;
    var C = 0,
      F = [];
    l.$$completeOutstandingRequest = e;
    l.$$incOutstandingRequestCount = function () {
      C++;
    };
    l.notifyWhenNoOutstandingRequests = function (a) {
      0 === C ? a() : F.push(a);
    };
    var u,
      p,
      K = k.href,
      q = a.find("base"),
      I = null;
    g();
    p = u;
    l.url = function (a, c, e) {
      A(e) && (e = null);
      k !== b.location && (k = b.location);
      n !== b.history && (n = b.history);
      if (a) {
        var f = p === e;
        if (K === a && (!d.history || f)) return l;
        var h = K && Ja(K) === Ja(a);
        K = a;
        p = e;
        if (!d.history || (h && f)) {
          if (!h || I) I = a;
          c
            ? k.replace(a)
            : h
            ? ((c = k),
              (e = a.indexOf("#")),
              (a = -1 === e ? "" : a.substr(e)),
              (c.hash = a))
            : (k.href = a);
        } else n[c ? "replaceState" : "pushState"](e, "", a), g(), (p = u);
        return l;
      }
      return I || k.href.replace(/%27/g, "'");
    };
    l.state = function () {
      return u;
    };
    var B = [],
      N = !1,
      D = null;
    l.onUrlChange = function (a) {
      if (!N) {
        if (d.history) y(b).on("popstate", f);
        y(b).on("hashchange", f);
        N = !0;
      }
      B.push(a);
      return a;
    };
    l.$$applicationDestroyed = function () {
      y(b).off("hashchange popstate", f);
    };
    l.$$checkUrlChange = h;
    l.baseHref = function () {
      var a = q.attr("href");
      return a ? a.replace(/^(https?\:)?\/\/[^\/]*/, "") : "";
    };
    l.defer = function (a, b) {
      var c;
      C++;
      c = r(function () {
        delete x[c];
        e(a);
      }, b || 0);
      x[c] = !0;
      return c;
    };
    l.defer.cancel = function (a) {
      return x[a] ? (delete x[a], s(a), e(v), !0) : !1;
    };
  }
  function Ve() {
    this.$get = [
      "$window",
      "$log",
      "$sniffer",
      "$document",
      function (b, a, c, d) {
        return new Jf(b, d, a, c);
      },
    ];
  }
  function We() {
    this.$get = function () {
      function b(b, d) {
        function e(a) {
          a != r &&
            (s ? s == a && (s = a.n) : (s = a),
            f(a.n, a.p),
            f(a, r),
            (r = a),
            (r.n = null));
        }
        function f(a, b) {
          a != b && (a && (a.p = b), b && (b.n = a));
        }
        if (b in a) throw J("$cacheFactory")("iid", b);
        var g = 0,
          h = P({}, d, { id: b }),
          l = {},
          k = (d && d.capacity) || Number.MAX_VALUE,
          n = {},
          r = null,
          s = null;
        return (a[b] = {
          put: function (a, b) {
            if (!A(b)) {
              if (k < Number.MAX_VALUE) {
                var c = n[a] || (n[a] = { key: a });
                e(c);
              }
              a in l || g++;
              l[a] = b;
              g > k && this.remove(s.key);
              return b;
            }
          },
          get: function (a) {
            if (k < Number.MAX_VALUE) {
              var b = n[a];
              if (!b) return;
              e(b);
            }
            return l[a];
          },
          remove: function (a) {
            if (k < Number.MAX_VALUE) {
              var b = n[a];
              if (!b) return;
              b == r && (r = b.p);
              b == s && (s = b.n);
              f(b.n, b.p);
              delete n[a];
            }
            delete l[a];
            g--;
          },
          removeAll: function () {
            l = {};
            g = 0;
            n = {};
            r = s = null;
          },
          destroy: function () {
            n = h = l = null;
            delete a[b];
          },
          info: function () {
            return P({}, h, { size: g });
          },
        });
      }
      var a = {};
      b.info = function () {
        var b = {};
        m(a, function (a, e) {
          b[e] = a.info();
        });
        return b;
      };
      b.get = function (b) {
        return a[b];
      };
      return b;
    };
  }
  function pf() {
    this.$get = [
      "$cacheFactory",
      function (b) {
        return b("templates");
      },
    ];
  }
  function Ec(b, a) {
    function c(a, b, c) {
      var d = /^\s*([@&]|=(\*?))(\??)\s*(\w*)\s*$/,
        e = {};
      m(a, function (a, f) {
        var g = a.match(d);
        if (!g)
          throw ea(
            "iscp",
            b,
            f,
            a,
            c ? "controller bindings definition" : "isolate scope definition"
          );
        e[f] = {
          mode: g[1][0],
          collection: "*" === g[2],
          optional: "?" === g[3],
          attrName: g[4] || f,
        };
      });
      return e;
    }
    function d(a) {
      var b = a.charAt(0);
      if (!b || b !== M(b)) throw ea("baddir", a);
      if (a !== a.trim()) throw ea("baddir", a);
    }
    var e = {},
      f = /^\s*directive\:\s*([\w\-]+)\s+(.*)$/,
      g = /(([\w\-]+)(?:\:([^;]+))?;?)/,
      h = Wd("ngSrc,ngSrcset,src,srcset"),
      l = /^(?:(\^\^?)?(\?)?(\^\^?)?)?/,
      k = /^(on[a-z]+|formaction)$/;
    this.directive = function s(a, f) {
      Ra(a, "directive");
      L(a)
        ? (d(a),
          Sb(f, "directiveFactory"),
          e.hasOwnProperty(a) ||
            ((e[a] = []),
            b.factory(a + "Directive", [
              "$injector",
              "$exceptionHandler",
              function (b, d) {
                var f = [];
                m(e[a], function (e, g) {
                  try {
                    var h = b.invoke(e);
                    z(h)
                      ? (h = { compile: ra(h) })
                      : !h.compile && h.link && (h.compile = ra(h.link));
                    h.priority = h.priority || 0;
                    h.index = g;
                    h.name = h.name || a;
                    h.require = h.require || (h.controller && h.name);
                    h.restrict = h.restrict || "EA";
                    var k = h,
                      l = h,
                      s = h.name,
                      n = { isolateScope: null, bindToController: null };
                    H(l.scope) &&
                      (!0 === l.bindToController
                        ? ((n.bindToController = c(l.scope, s, !0)),
                          (n.isolateScope = {}))
                        : (n.isolateScope = c(l.scope, s, !1)));
                    H(l.bindToController) &&
                      (n.bindToController = c(l.bindToController, s, !0));
                    if (H(n.bindToController)) {
                      var C = l.controller,
                        $ = l.controllerAs;
                      if (!C) throw ea("noctrl", s);
                      var ha;
                      a: if ($ && L($)) ha = $;
                      else {
                        if (L(C)) {
                          var m = Xc.exec(C);
                          if (m) {
                            ha = m[3];
                            break a;
                          }
                        }
                        ha = void 0;
                      }
                      if (!ha) throw ea("noident", s);
                    }
                    var q = (k.$$bindings = n);
                    H(q.isolateScope) && (h.$$isolateBindings = q.isolateScope);
                    h.$$moduleName = e.$$moduleName;
                    f.push(h);
                  } catch (t) {
                    d(t);
                  }
                });
                return f;
              },
            ])),
          e[a].push(f))
        : m(a, pc(s));
      return this;
    };
    this.aHrefSanitizationWhitelist = function (b) {
      return w(b)
        ? (a.aHrefSanitizationWhitelist(b), this)
        : a.aHrefSanitizationWhitelist();
    };
    this.imgSrcSanitizationWhitelist = function (b) {
      return w(b)
        ? (a.imgSrcSanitizationWhitelist(b), this)
        : a.imgSrcSanitizationWhitelist();
    };
    var n = !0;
    this.debugInfoEnabled = function (a) {
      return w(a) ? ((n = a), this) : n;
    };
    this.$get = [
      "$injector",
      "$interpolate",
      "$exceptionHandler",
      "$templateRequest",
      "$parse",
      "$controller",
      "$rootScope",
      "$document",
      "$sce",
      "$animate",
      "$$sanitizeUri",
      function (a, b, c, d, u, p, K, q, I, B, N) {
        function D(a, b) {
          try {
            a.addClass(b);
          } catch (c) {}
        }
        function Z(a, b, c, d, e) {
          a instanceof y || (a = y(a));
          m(a, function (b, c) {
            b.nodeType == Na &&
              b.nodeValue.match(/\S+/) &&
              (a[c] = y(b).wrap("<span></span>").parent()[0]);
          });
          var f = S(a, b, a, c, d, e);
          Z.$$addScopeClass(a);
          var g = null;
          return function (b, c, d) {
            Sb(b, "scope");
            d = d || {};
            var e = d.parentBoundTranscludeFn,
              h = d.transcludeControllers;
            d = d.futureParentElement;
            e && e.$$boundTransclude && (e = e.$$boundTransclude);
            g ||
              (g = (d = d && d[0])
                ? "foreignobject" !== ta(d) && d.toString().match(/SVG/)
                  ? "svg"
                  : "html"
                : "html");
            d =
              "html" !== g
                ? y(Yb(g, y("<div>").append(a).html()))
                : c
                ? Pa.clone.call(a)
                : a;
            if (h)
              for (var k in h) d.data("$" + k + "Controller", h[k].instance);
            Z.$$addScopeInfo(d, b);
            c && c(d, b);
            f && f(b, d, d, e);
            return d;
          };
        }
        function S(a, b, c, d, e, f) {
          function g(a, c, d, e) {
            var f, k, l, s, n, B, C;
            if (p)
              for (C = Array(c.length), s = 0; s < h.length; s += 3)
                (f = h[s]), (C[f] = c[f]);
            else C = c;
            s = 0;
            for (n = h.length; s < n; )
              if (((k = C[h[s++]]), (c = h[s++]), (f = h[s++]), c)) {
                if (c.scope) {
                  if (
                    ((l = a.$new()),
                    Z.$$addScopeInfo(y(k), l),
                    (B = c.$$destroyBindings))
                  )
                    (c.$$destroyBindings = null), l.$on("$destroyed", B);
                } else l = a;
                B = c.transcludeOnThisElement
                  ? $(a, c.transclude, e)
                  : !c.templateOnThisElement && e
                  ? e
                  : !e && b
                  ? $(a, b)
                  : null;
                c(f, l, k, d, B, c);
              } else f && f(a, k.childNodes, t, e);
          }
          for (var h = [], k, l, s, n, p, B = 0; B < a.length; B++) {
            k = new aa();
            l = ha(a[B], [], k, 0 === B ? d : t, e);
            (f = l.length ? E(l, a[B], k, b, c, null, [], [], f) : null) &&
              f.scope &&
              Z.$$addScopeClass(k.$$element);
            k =
              (f && f.terminal) || !(s = a[B].childNodes) || !s.length
                ? null
                : S(
                    s,
                    f
                      ? (f.transcludeOnThisElement ||
                          !f.templateOnThisElement) &&
                          f.transclude
                      : b
                  );
            if (f || k) h.push(B, f, k), (n = !0), (p = p || f);
            f = null;
          }
          return n ? g : null;
        }
        function $(a, b, c) {
          return function (d, e, f, g, h) {
            d || ((d = a.$new(!1, h)), (d.$$transcluded = !0));
            return b(d, e, {
              parentBoundTranscludeFn: c,
              transcludeControllers: f,
              futureParentElement: g,
            });
          };
        }
        function ha(a, b, c, d, e) {
          var h = c.$attr,
            k;
          switch (a.nodeType) {
            case qa:
              w(b, wa(ta(a)), "E", d, e);
              for (
                var l, s, n, p = a.attributes, B = 0, C = p && p.length;
                B < C;
                B++
              ) {
                var x = !1,
                  S = !1;
                l = p[B];
                k = l.name;
                s = R(l.value);
                l = wa(k);
                if ((n = ia.test(l)))
                  k = k
                    .replace(Zc, "")
                    .substr(8)
                    .replace(/_(.)/g, function (a, b) {
                      return b.toUpperCase();
                    });
                var F = l.replace(/(Start|End)$/, "");
                A(F) &&
                  l === F + "Start" &&
                  ((x = k),
                  (S = k.substr(0, k.length - 5) + "end"),
                  (k = k.substr(0, k.length - 6)));
                l = wa(k.toLowerCase());
                h[l] = k;
                if (n || !c.hasOwnProperty(l))
                  (c[l] = s), Sc(a, l) && (c[l] = !0);
                V(a, b, s, l, n);
                w(b, l, "A", d, e, x, S);
              }
              a = a.className;
              H(a) && (a = a.animVal);
              if (L(a) && "" !== a)
                for (; (k = g.exec(a)); )
                  (l = wa(k[2])),
                    w(b, l, "C", d, e) && (c[l] = R(k[3])),
                    (a = a.substr(k.index + k[0].length));
              break;
            case Na:
              if (11 === Ua)
                for (
                  ;
                  a.parentNode &&
                  a.nextSibling &&
                  a.nextSibling.nodeType === Na;

                )
                  (a.nodeValue += a.nextSibling.nodeValue),
                    a.parentNode.removeChild(a.nextSibling);
              xa(b, a.nodeValue);
              break;
            case 8:
              try {
                if ((k = f.exec(a.nodeValue)))
                  (l = wa(k[1])), w(b, l, "M", d, e) && (c[l] = R(k[2]));
              } catch ($) {}
          }
          b.sort(Aa);
          return b;
        }
        function va(a, b, c) {
          var d = [],
            e = 0;
          if (b && a.hasAttribute && a.hasAttribute(b)) {
            do {
              if (!a) throw ea("uterdir", b, c);
              a.nodeType == qa &&
                (a.hasAttribute(b) && e++, a.hasAttribute(c) && e--);
              d.push(a);
              a = a.nextSibling;
            } while (0 < e);
          } else d.push(a);
          return y(d);
        }
        function Yc(a, b, c) {
          return function (d, e, f, g, h) {
            e = va(e[0], b, c);
            return a(d, e, f, g, h);
          };
        }
        function E(a, b, d, e, f, g, h, k, s) {
          function n(a, b, c, d) {
            if (a) {
              c && (a = Yc(a, c, d));
              a.require = E.require;
              a.directiveName = w;
              if (u === E || E.$$isolateScope) a = X(a, { isolateScope: !0 });
              h.push(a);
            }
            if (b) {
              c && (b = Yc(b, c, d));
              b.require = E.require;
              b.directiveName = w;
              if (u === E || E.$$isolateScope) b = X(b, { isolateScope: !0 });
              k.push(b);
            }
          }
          function B(a, b, c, d) {
            var e;
            if (L(b)) {
              var f = b.match(l);
              b = b.substring(f[0].length);
              var g = f[1] || f[3],
                f = "?" === f[2];
              "^^" === g
                ? (c = c.parent())
                : (e = (e = d && d[b]) && e.instance);
              e ||
                ((d = "$" + b + "Controller"),
                (e = g ? c.inheritedData(d) : c.data(d)));
              if (!e && !f) throw ea("ctreq", b, a);
            } else if (G(b))
              for (e = [], g = 0, f = b.length; g < f; g++)
                e[g] = B(a, b[g], c, d);
            return e || null;
          }
          function x(a, b, c, d, e, f) {
            var g = ga(),
              h;
            for (h in d) {
              var k = d[h],
                l = {
                  $scope: k === u || k.$$isolateScope ? e : f,
                  $element: a,
                  $attrs: b,
                  $transclude: c,
                },
                s = k.controller;
              "@" == s && (s = b[k.name]);
              l = p(s, l, !0, k.controllerAs);
              g[k.name] = l;
              q || a.data("$" + k.name + "Controller", l.instance);
            }
            return g;
          }
          function S(a, c, e, f, g, l) {
            function s(a, b, c) {
              var d;
              $a(a) || ((c = b), (b = a), (a = t));
              q && (d = m);
              c || (c = q ? ja.parent() : ja);
              return g(a, b, d, c, va);
            }
            var n, p, C, F, m, ha, ja;
            b === e
              ? ((f = d), (ja = d.$$element))
              : ((ja = y(e)), (f = new aa(ja, d)));
            u && (F = c.$new(!0));
            g && ((ha = s), (ha.$$boundTransclude = g));
            N && (m = x(ja, f, ha, N, F, c));
            u &&
              (Z.$$addScopeInfo(
                ja,
                F,
                !0,
                !(D && (D === u || D === u.$$originalDirective))
              ),
              Z.$$addScopeClass(ja, !0),
              (F.$$isolateBindings = u.$$isolateBindings),
              W(c, f, F, F.$$isolateBindings, u, F));
            if (m) {
              var K = u || $,
                I;
              K &&
                m[K.name] &&
                ((p = K.$$bindings.bindToController),
                (C = m[K.name]) &&
                  C.identifier &&
                  p &&
                  ((I = C), (l.$$destroyBindings = W(c, f, C.instance, p, K))));
              for (n in m) {
                C = m[n];
                var E = C();
                E !== C.instance &&
                  ((C.instance = E),
                  ja.data("$" + n + "Controller", E),
                  C === I &&
                    (l.$$destroyBindings(),
                    (l.$$destroyBindings = W(c, f, E, p, K))));
              }
            }
            n = 0;
            for (l = h.length; n < l; n++)
              (p = h[n]),
                Y(
                  p,
                  p.isolateScope ? F : c,
                  ja,
                  f,
                  p.require && B(p.directiveName, p.require, ja, m),
                  ha
                );
            var va = c;
            u && (u.template || null === u.templateUrl) && (va = F);
            a && a(va, e.childNodes, t, g);
            for (n = k.length - 1; 0 <= n; n--)
              (p = k[n]),
                Y(
                  p,
                  p.isolateScope ? F : c,
                  ja,
                  f,
                  p.require && B(p.directiveName, p.require, ja, m),
                  ha
                );
          }
          s = s || {};
          for (
            var F = -Number.MAX_VALUE,
              $ = s.newScopeDirective,
              N = s.controllerDirectives,
              u = s.newIsolateScopeDirective,
              D = s.templateDirective,
              m = s.nonTlbTranscludeDirective,
              K = !1,
              I = !1,
              q = s.hasElementTranscludeDirective,
              ba = (d.$$element = y(b)),
              E,
              w,
              v,
              A = e,
              Aa,
              xa = 0,
              Ta = a.length;
            xa < Ta;
            xa++
          ) {
            E = a[xa];
            var M = E.$$start,
              P = E.$$end;
            M && (ba = va(b, M, P));
            v = t;
            if (F > E.priority) break;
            if ((v = E.scope))
              E.templateUrl ||
                (H(v)
                  ? (O("new/isolated scope", u || $, E, ba), (u = E))
                  : O("new/isolated scope", u, E, ba)),
                ($ = $ || E);
            w = E.name;
            !E.templateUrl &&
              E.controller &&
              ((v = E.controller),
              (N = N || ga()),
              O("'" + w + "' controller", N[w], E, ba),
              (N[w] = E));
            if ((v = E.transclude))
              (K = !0),
                E.$$tlb || (O("transclusion", m, E, ba), (m = E)),
                "element" == v
                  ? ((q = !0),
                    (F = E.priority),
                    (v = ba),
                    (ba = d.$$element =
                      y(U.createComment(" " + w + ": " + d[w] + " "))),
                    (b = ba[0]),
                    T(f, za.call(v, 0), b),
                    (A = Z(v, e, F, g && g.name, {
                      nonTlbTranscludeDirective: m,
                    })))
                  : ((v = y(Vb(b)).contents()), ba.empty(), (A = Z(v, e)));
            if (E.template)
              if (
                ((I = !0),
                O("template", D, E, ba),
                (D = E),
                (v = z(E.template) ? E.template(ba, d) : E.template),
                (v = fa(v)),
                E.replace)
              ) {
                g = E;
                v = Tb.test(v) ? $c(Yb(E.templateNamespace, R(v))) : [];
                b = v[0];
                if (1 != v.length || b.nodeType !== qa)
                  throw ea("tplrt", w, "");
                T(f, ba, b);
                Ta = { $attr: {} };
                v = ha(b, [], Ta);
                var Q = a.splice(xa + 1, a.length - (xa + 1));
                u && ad(v);
                a = a.concat(v).concat(Q);
                J(d, Ta);
                Ta = a.length;
              } else ba.html(v);
            if (E.templateUrl)
              (I = !0),
                O("template", D, E, ba),
                (D = E),
                E.replace && (g = E),
                (S = Lf(a.splice(xa, a.length - xa), ba, d, f, K && A, h, k, {
                  controllerDirectives: N,
                  newScopeDirective: $ !== E && $,
                  newIsolateScopeDirective: u,
                  templateDirective: D,
                  nonTlbTranscludeDirective: m,
                })),
                (Ta = a.length);
            else if (E.compile)
              try {
                (Aa = E.compile(ba, d, A)),
                  z(Aa) ? n(null, Aa, M, P) : Aa && n(Aa.pre, Aa.post, M, P);
              } catch (Kf) {
                c(Kf, ua(ba));
              }
            E.terminal && ((S.terminal = !0), (F = Math.max(F, E.priority)));
          }
          S.scope = $ && !0 === $.scope;
          S.transcludeOnThisElement = K;
          S.templateOnThisElement = I;
          S.transclude = A;
          s.hasElementTranscludeDirective = q;
          return S;
        }
        function ad(a) {
          for (var b = 0, c = a.length; b < c; b++)
            a[b] = Ob(a[b], { $$isolateScope: !0 });
        }
        function w(b, d, f, g, h, k, l) {
          if (d === h) return null;
          h = null;
          if (e.hasOwnProperty(d)) {
            var n;
            d = a.get(d + "Directive");
            for (var p = 0, B = d.length; p < B; p++)
              try {
                (n = d[p]),
                  (g === t || g > n.priority) &&
                    -1 != n.restrict.indexOf(f) &&
                    (k && (n = Ob(n, { $$start: k, $$end: l })),
                    b.push(n),
                    (h = n));
              } catch (x) {
                c(x);
              }
          }
          return h;
        }
        function A(b) {
          if (e.hasOwnProperty(b))
            for (
              var c = a.get(b + "Directive"), d = 0, f = c.length;
              d < f;
              d++
            )
              if (((b = c[d]), b.multiElement)) return !0;
          return !1;
        }
        function J(a, b) {
          var c = b.$attr,
            d = a.$attr,
            e = a.$$element;
          m(a, function (d, e) {
            "$" != e.charAt(0) &&
              (b[e] && b[e] !== d && (d += ("style" === e ? ";" : " ") + b[e]),
              a.$set(e, d, !0, c[e]));
          });
          m(b, function (b, f) {
            "class" == f
              ? (D(e, b),
                (a["class"] = (a["class"] ? a["class"] + " " : "") + b))
              : "style" == f
              ? (e.attr("style", e.attr("style") + ";" + b),
                (a.style = (a.style ? a.style + ";" : "") + b))
              : "$" == f.charAt(0) ||
                a.hasOwnProperty(f) ||
                ((a[f] = b), (d[f] = c[f]));
          });
        }
        function Lf(a, b, c, e, f, g, h, k) {
          var l = [],
            s,
            n,
            p = b[0],
            B = a.shift(),
            C = Ob(B, {
              templateUrl: null,
              transclude: null,
              replace: null,
              $$originalDirective: B,
            }),
            x = z(B.templateUrl) ? B.templateUrl(b, c) : B.templateUrl,
            N = B.templateNamespace;
          b.empty();
          d(x).then(function (d) {
            var F, u;
            d = fa(d);
            if (B.replace) {
              d = Tb.test(d) ? $c(Yb(N, R(d))) : [];
              F = d[0];
              if (1 != d.length || F.nodeType !== qa)
                throw ea("tplrt", B.name, x);
              d = { $attr: {} };
              T(e, b, F);
              var K = ha(F, [], d);
              H(B.scope) && ad(K);
              a = K.concat(a);
              J(c, d);
            } else (F = p), b.html(d);
            a.unshift(C);
            s = E(a, F, c, f, b, B, g, h, k);
            m(e, function (a, c) {
              a == F && (e[c] = b[0]);
            });
            for (n = S(b[0].childNodes, f); l.length; ) {
              d = l.shift();
              u = l.shift();
              var I = l.shift(),
                va = l.shift(),
                K = b[0];
              if (!d.$$destroyed) {
                if (u !== p) {
                  var Z = u.className;
                  (k.hasElementTranscludeDirective && B.replace) || (K = Vb(F));
                  T(I, y(u), K);
                  D(y(K), Z);
                }
                u = s.transcludeOnThisElement ? $(d, s.transclude, va) : va;
                s(n, d, K, e, u, s);
              }
            }
            l = null;
          });
          return function (a, b, c, d, e) {
            a = e;
            b.$$destroyed ||
              (l
                ? l.push(b, c, d, a)
                : (s.transcludeOnThisElement && (a = $(b, s.transclude, e)),
                  s(n, b, c, d, a, s)));
          };
        }
        function Aa(a, b) {
          var c = b.priority - a.priority;
          return 0 !== c
            ? c
            : a.name !== b.name
            ? a.name < b.name
              ? -1
              : 1
            : a.index - b.index;
        }
        function O(a, b, c, d) {
          function e(a) {
            return a ? " (module: " + a + ")" : "";
          }
          if (b)
            throw ea(
              "multidir",
              b.name,
              e(b.$$moduleName),
              c.name,
              e(c.$$moduleName),
              a,
              ua(d)
            );
        }
        function xa(a, c) {
          var d = b(c, !0);
          d &&
            a.push({
              priority: 0,
              compile: function (a) {
                a = a.parent();
                var b = !!a.length;
                b && Z.$$addBindingClass(a);
                return function (a, c) {
                  var e = c.parent();
                  b || Z.$$addBindingClass(e);
                  Z.$$addBindingInfo(e, d.expressions);
                  a.$watch(d, function (a) {
                    c[0].nodeValue = a;
                  });
                };
              },
            });
        }
        function Yb(a, b) {
          a = M(a || "html");
          switch (a) {
            case "svg":
            case "math":
              var c = U.createElement("div");
              c.innerHTML = "<" + a + ">" + b + "</" + a + ">";
              return c.childNodes[0].childNodes;
            default:
              return b;
          }
        }
        function Q(a, b) {
          if ("srcdoc" == b) return I.HTML;
          var c = ta(a);
          if (
            "xlinkHref" == b ||
            ("form" == c && "action" == b) ||
            ("img" != c && ("src" == b || "ngSrc" == b))
          )
            return I.RESOURCE_URL;
        }
        function V(a, c, d, e, f) {
          var g = Q(a, e);
          f = h[e] || f;
          var l = b(d, !0, g, f);
          if (l) {
            if ("multiple" === e && "select" === ta(a))
              throw ea("selmulti", ua(a));
            c.push({
              priority: 100,
              compile: function () {
                return {
                  pre: function (a, c, h) {
                    c = h.$$observers || (h.$$observers = {});
                    if (k.test(e)) throw ea("nodomevents");
                    var s = h[e];
                    s !== d && ((l = s && b(s, !0, g, f)), (d = s));
                    l &&
                      ((h[e] = l(a)),
                      ((c[e] || (c[e] = [])).$$inter = !0),
                      ((h.$$observers && h.$$observers[e].$$scope) || a).$watch(
                        l,
                        function (a, b) {
                          "class" === e && a != b
                            ? h.$updateClass(a, b)
                            : h.$set(e, a);
                        }
                      ));
                  },
                };
              },
            });
          }
        }
        function T(a, b, c) {
          var d = b[0],
            e = b.length,
            f = d.parentNode,
            g,
            h;
          if (a)
            for (g = 0, h = a.length; g < h; g++)
              if (a[g] == d) {
                a[g++] = c;
                h = g + e - 1;
                for (var k = a.length; g < k; g++, h++)
                  h < k ? (a[g] = a[h]) : delete a[g];
                a.length -= e - 1;
                a.context === d && (a.context = c);
                break;
              }
          f && f.replaceChild(c, d);
          a = U.createDocumentFragment();
          a.appendChild(d);
          y.hasData(d) &&
            (y(c).data(y(d).data()),
            la ? ((Rb = !0), la.cleanData([d])) : delete y.cache[d[y.expando]]);
          d = 1;
          for (e = b.length; d < e; d++)
            (f = b[d]), y(f).remove(), a.appendChild(f), delete b[d];
          b[0] = c;
          b.length = 1;
        }
        function X(a, b) {
          return P(
            function () {
              return a.apply(null, arguments);
            },
            a,
            b
          );
        }
        function Y(a, b, d, e, f, g) {
          try {
            a(b, d, e, f, g);
          } catch (h) {
            c(h, ua(d));
          }
        }
        function W(a, c, d, e, f, g) {
          var h;
          m(e, function (e, g) {
            var k = e.attrName,
              l = e.optional,
              s = e.mode,
              n,
              p,
              B,
              C;
            Xa.call(c, k) || (c[k] = t);
            switch (s) {
              case "@":
                c[k] || l || (d[g] = t);
                c.$observe(k, function (a) {
                  d[g] = a;
                });
                c.$$observers[k].$$scope = a;
                c[k] && (d[g] = b(c[k])(a));
                break;
              case "=":
                if (l && !c[k]) break;
                p = u(c[k]);
                C = p.literal
                  ? ka
                  : function (a, b) {
                      return a === b || (a !== a && b !== b);
                    };
                B =
                  p.assign ||
                  function () {
                    n = d[g] = p(a);
                    throw ea("nonassign", c[k], f.name);
                  };
                n = d[g] = p(a);
                l = function (b) {
                  C(b, d[g]) || (C(b, n) ? B(a, (b = d[g])) : (d[g] = b));
                  return (n = b);
                };
                l.$stateful = !0;
                l = e.collection
                  ? a.$watchCollection(c[k], l)
                  : a.$watch(u(c[k], l), null, p.literal);
                h = h || [];
                h.push(l);
                break;
              case "&":
                p = u(c[k]);
                if (p === v && l) break;
                d[g] = function (b) {
                  return p(a, b);
                };
            }
          });
          e = h
            ? function () {
                for (var a = 0, b = h.length; a < b; ++a) h[a]();
              }
            : v;
          return g && e !== v ? (g.$on("$destroy", e), v) : e;
        }
        var aa = function (a, b) {
          if (b) {
            var c = Object.keys(b),
              d,
              e,
              f;
            d = 0;
            for (e = c.length; d < e; d++) (f = c[d]), (this[f] = b[f]);
          } else this.$attr = {};
          this.$$element = a;
        };
        aa.prototype = {
          $normalize: wa,
          $addClass: function (a) {
            a && 0 < a.length && B.addClass(this.$$element, a);
          },
          $removeClass: function (a) {
            a && 0 < a.length && B.removeClass(this.$$element, a);
          },
          $updateClass: function (a, b) {
            var c = bd(a, b);
            c && c.length && B.addClass(this.$$element, c);
            (c = bd(b, a)) && c.length && B.removeClass(this.$$element, c);
          },
          $set: function (a, b, d, e) {
            var f = this.$$element[0],
              g = Sc(f, a),
              h = Ff(f, a),
              f = a;
            g
              ? (this.$$element.prop(a, b), (e = g))
              : h && ((this[h] = b), (f = h));
            this[a] = b;
            e
              ? (this.$attr[a] = e)
              : (e = this.$attr[a]) || (this.$attr[a] = e = Bc(a, "-"));
            g = ta(this.$$element);
            if (("a" === g && "href" === a) || ("img" === g && "src" === a))
              this[a] = b = N(b, "src" === a);
            else if ("img" === g && "srcset" === a) {
              for (
                var g = "",
                  h = R(b),
                  k = /(\s+\d+x\s*,|\s+\d+w\s*,|\s+,|,\s+)/,
                  k = /\s/.test(h) ? k : /(,)/,
                  h = h.split(k),
                  k = Math.floor(h.length / 2),
                  l = 0;
                l < k;
                l++
              )
                var s = 2 * l,
                  g = g + N(R(h[s]), !0),
                  g = g + (" " + R(h[s + 1]));
              h = R(h[2 * l]).split(/\s/);
              g += N(R(h[0]), !0);
              2 === h.length && (g += " " + R(h[1]));
              this[a] = b = g;
            }
            !1 !== d &&
              (null === b || b === t
                ? this.$$element.removeAttr(e)
                : this.$$element.attr(e, b));
            (a = this.$$observers) &&
              m(a[f], function (a) {
                try {
                  a(b);
                } catch (d) {
                  c(d);
                }
              });
          },
          $observe: function (a, b) {
            var c = this,
              d = c.$$observers || (c.$$observers = ga()),
              e = d[a] || (d[a] = []);
            e.push(b);
            K.$evalAsync(function () {
              !e.$$inter && c.hasOwnProperty(a) && b(c[a]);
            });
            return function () {
              bb(e, b);
            };
          },
        };
        var ca = b.startSymbol(),
          da = b.endSymbol(),
          fa =
            "{{" == ca || "}}" == da
              ? Ya
              : function (a) {
                  return a.replace(/\{\{/g, ca).replace(/}}/g, da);
                },
          ia = /^ngAttr[A-Z]/;
        Z.$$addBindingInfo = n
          ? function (a, b) {
              var c = a.data("$binding") || [];
              G(b) ? (c = c.concat(b)) : c.push(b);
              a.data("$binding", c);
            }
          : v;
        Z.$$addBindingClass = n
          ? function (a) {
              D(a, "ng-binding");
            }
          : v;
        Z.$$addScopeInfo = n
          ? function (a, b, c, d) {
              a.data(
                c
                  ? d
                    ? "$isolateScopeNoTemplate"
                    : "$isolateScope"
                  : "$scope",
                b
              );
            }
          : v;
        Z.$$addScopeClass = n
          ? function (a, b) {
              D(a, b ? "ng-isolate-scope" : "ng-scope");
            }
          : v;
        return Z;
      },
    ];
  }
  function wa(b) {
    return hb(b.replace(Zc, ""));
  }
  function bd(b, a) {
    var c = "",
      d = b.split(/\s+/),
      e = a.split(/\s+/),
      f = 0;
    a: for (; f < d.length; f++) {
      for (var g = d[f], h = 0; h < e.length; h++) if (g == e[h]) continue a;
      c += (0 < c.length ? " " : "") + g;
    }
    return c;
  }
  function $c(b) {
    b = y(b);
    var a = b.length;
    if (1 >= a) return b;
    for (; a--; ) 8 === b[a].nodeType && Mf.call(b, a, 1);
    return b;
  }
  function Xe() {
    var b = {},
      a = !1;
    this.register = function (a, d) {
      Ra(a, "controller");
      H(a) ? P(b, a) : (b[a] = d);
    };
    this.allowGlobals = function () {
      a = !0;
    };
    this.$get = [
      "$injector",
      "$window",
      function (c, d) {
        function e(a, b, c, d) {
          if (!a || !H(a.$scope)) throw J("$controller")("noscp", d, b);
          a.$scope[b] = c;
        }
        return function (f, g, h, l) {
          var k, n, r;
          h = !0 === h;
          l && L(l) && (r = l);
          if (L(f)) {
            l = f.match(Xc);
            if (!l) throw Nf("ctrlfmt", f);
            n = l[1];
            r = r || l[3];
            f = b.hasOwnProperty(n)
              ? b[n]
              : Dc(g.$scope, n, !0) || (a ? Dc(d, n, !0) : t);
            Qa(f, n, !0);
          }
          if (h)
            return (
              (h = (G(f) ? f[f.length - 1] : f).prototype),
              (k = Object.create(h || null)),
              r && e(g, r, k, n || f.name),
              P(
                function () {
                  var a = c.invoke(f, k, g, n);
                  a !== k &&
                    (H(a) || z(a)) &&
                    ((k = a), r && e(g, r, k, n || f.name));
                  return k;
                },
                { instance: k, identifier: r }
              )
            );
          k = c.instantiate(f, g, n);
          r && e(g, r, k, n || f.name);
          return k;
        };
      },
    ];
  }
  function Ye() {
    this.$get = [
      "$window",
      function (b) {
        return y(b.document);
      },
    ];
  }
  function Ze() {
    this.$get = [
      "$log",
      function (b) {
        return function (a, c) {
          b.error.apply(b, arguments);
        };
      },
    ];
  }
  function Zb(b) {
    return H(b) ? (aa(b) ? b.toISOString() : db(b)) : b;
  }
  function cf() {
    this.$get = function () {
      return function (b) {
        if (!b) return "";
        var a = [];
        oc(b, function (b, d) {
          null === b ||
            A(b) ||
            (G(b)
              ? m(b, function (b, c) {
                  a.push(ma(d) + "=" + ma(Zb(b)));
                })
              : a.push(ma(d) + "=" + ma(Zb(b))));
        });
        return a.join("&");
      };
    };
  }
  function df() {
    this.$get = function () {
      return function (b) {
        function a(b, e, f) {
          null === b ||
            A(b) ||
            (G(b)
              ? m(b, function (b) {
                  a(b, e + "[]");
                })
              : H(b) && !aa(b)
              ? oc(b, function (b, c) {
                  a(b, e + (f ? "" : "[") + c + (f ? "" : "]"));
                })
              : c.push(ma(e) + "=" + ma(Zb(b))));
        }
        if (!b) return "";
        var c = [];
        a(b, "", !0);
        return c.join("&");
      };
    };
  }
  function $b(b, a) {
    if (L(b)) {
      var c = b.replace(Of, "").trim();
      if (c) {
        var d = a("Content-Type");
        (d = d && 0 === d.indexOf(cd)) ||
          (d = (d = c.match(Pf)) && Qf[d[0]].test(c));
        d && (b = wc(c));
      }
    }
    return b;
  }
  function dd(b) {
    var a = ga(),
      c;
    L(b)
      ? m(b.split("\n"), function (b) {
          c = b.indexOf(":");
          var e = M(R(b.substr(0, c)));
          b = R(b.substr(c + 1));
          e && (a[e] = a[e] ? a[e] + ", " + b : b);
        })
      : H(b) &&
        m(b, function (b, c) {
          var f = M(c),
            g = R(b);
          f && (a[f] = a[f] ? a[f] + ", " + g : g);
        });
    return a;
  }
  function ed(b) {
    var a;
    return function (c) {
      a || (a = dd(b));
      return c ? ((c = a[M(c)]), void 0 === c && (c = null), c) : a;
    };
  }
  function fd(b, a, c, d) {
    if (z(d)) return d(b, a, c);
    m(d, function (d) {
      b = d(b, a, c);
    });
    return b;
  }
  function bf() {
    var b = (this.defaults = {
        transformResponse: [$b],
        transformRequest: [
          function (a) {
            return H(a) &&
              "[object File]" !== sa.call(a) &&
              "[object Blob]" !== sa.call(a) &&
              "[object FormData]" !== sa.call(a)
              ? db(a)
              : a;
          },
        ],
        headers: {
          common: { Accept: "application/json, text/plain, */*" },
          post: ia(ac),
          put: ia(ac),
          patch: ia(ac),
        },
        xsrfCookieName: "XSRF-TOKEN",
        xsrfHeaderName: "X-XSRF-TOKEN",
        paramSerializer: "$httpParamSerializer",
      }),
      a = !1;
    this.useApplyAsync = function (b) {
      return w(b) ? ((a = !!b), this) : a;
    };
    var c = (this.interceptors = []);
    this.$get = [
      "$httpBackend",
      "$$cookieReader",
      "$cacheFactory",
      "$rootScope",
      "$q",
      "$injector",
      function (d, e, f, g, h, l) {
        function k(a) {
          function c(a) {
            var b = P({}, a);
            b.data = a.data
              ? fd(a.data, a.headers, a.status, e.transformResponse)
              : a.data;
            a = a.status;
            return 200 <= a && 300 > a ? b : h.reject(b);
          }
          function d(a, b) {
            var c,
              e = {};
            m(a, function (a, d) {
              z(a) ? ((c = a(b)), null != c && (e[d] = c)) : (e[d] = a);
            });
            return e;
          }
          if (!ca.isObject(a)) throw J("$http")("badreq", a);
          var e = P(
            {
              method: "get",
              transformRequest: b.transformRequest,
              transformResponse: b.transformResponse,
              paramSerializer: b.paramSerializer,
            },
            a
          );
          e.headers = (function (a) {
            var c = b.headers,
              e = P({}, a.headers),
              f,
              g,
              h,
              c = P({}, c.common, c[M(a.method)]);
            a: for (f in c) {
              g = M(f);
              for (h in e) if (M(h) === g) continue a;
              e[f] = c[f];
            }
            return d(e, ia(a));
          })(a);
          e.method = rb(e.method);
          e.paramSerializer = L(e.paramSerializer)
            ? l.get(e.paramSerializer)
            : e.paramSerializer;
          var f = [
              function (a) {
                var d = a.headers,
                  e = fd(a.data, ed(d), t, a.transformRequest);
                A(e) &&
                  m(d, function (a, b) {
                    "content-type" === M(b) && delete d[b];
                  });
                A(a.withCredentials) &&
                  !A(b.withCredentials) &&
                  (a.withCredentials = b.withCredentials);
                return n(a, e).then(c, c);
              },
              t,
            ],
            g = h.when(e);
          for (
            m(x, function (a) {
              (a.request || a.requestError) &&
                f.unshift(a.request, a.requestError);
              (a.response || a.responseError) &&
                f.push(a.response, a.responseError);
            });
            f.length;

          ) {
            a = f.shift();
            var k = f.shift(),
              g = g.then(a, k);
          }
          g.success = function (a) {
            Qa(a, "fn");
            g.then(function (b) {
              a(b.data, b.status, b.headers, e);
            });
            return g;
          };
          g.error = function (a) {
            Qa(a, "fn");
            g.then(null, function (b) {
              a(b.data, b.status, b.headers, e);
            });
            return g;
          };
          return g;
        }
        function n(c, f) {
          function l(b, c, d, e) {
            function f() {
              n(c, b, d, e);
            }
            N &&
              (200 <= b && 300 > b ? N.put(S, [b, c, dd(d), e]) : N.remove(S));
            a ? g.$applyAsync(f) : (f(), g.$$phase || g.$apply());
          }
          function n(a, b, d, e) {
            b = Math.max(b, 0);
            (200 <= b && 300 > b ? I.resolve : I.reject)({
              data: a,
              status: b,
              headers: ed(d),
              config: c,
              statusText: e,
            });
          }
          function x(a) {
            n(a.data, a.status, ia(a.headers()), a.statusText);
          }
          function m() {
            var a = k.pendingRequests.indexOf(c);
            -1 !== a && k.pendingRequests.splice(a, 1);
          }
          var I = h.defer(),
            B = I.promise,
            N,
            D,
            q = c.headers,
            S = r(c.url, c.paramSerializer(c.params));
          k.pendingRequests.push(c);
          B.then(m, m);
          (!c.cache && !b.cache) ||
            !1 === c.cache ||
            ("GET" !== c.method && "JSONP" !== c.method) ||
            (N = H(c.cache) ? c.cache : H(b.cache) ? b.cache : s);
          N &&
            ((D = N.get(S)),
            w(D)
              ? D && z(D.then)
                ? D.then(x, x)
                : G(D)
                ? n(D[1], D[0], ia(D[2]), D[3])
                : n(D, 200, {}, "OK")
              : N.put(S, B));
          A(D) &&
            ((D = gd(c.url) ? e()[c.xsrfCookieName || b.xsrfCookieName] : t) &&
              (q[c.xsrfHeaderName || b.xsrfHeaderName] = D),
            d(
              c.method,
              S,
              f,
              l,
              q,
              c.timeout,
              c.withCredentials,
              c.responseType
            ));
          return B;
        }
        function r(a, b) {
          0 < b.length && (a += (-1 == a.indexOf("?") ? "?" : "&") + b);
          return a;
        }
        var s = f("$http");
        b.paramSerializer = L(b.paramSerializer)
          ? l.get(b.paramSerializer)
          : b.paramSerializer;
        var x = [];
        m(c, function (a) {
          x.unshift(L(a) ? l.get(a) : l.invoke(a));
        });
        k.pendingRequests = [];
        (function (a) {
          m(arguments, function (a) {
            k[a] = function (b, c) {
              return k(P({}, c || {}, { method: a, url: b }));
            };
          });
        })("get", "delete", "head", "jsonp");
        (function (a) {
          m(arguments, function (a) {
            k[a] = function (b, c, d) {
              return k(P({}, d || {}, { method: a, url: b, data: c }));
            };
          });
        })("post", "put", "patch");
        k.defaults = b;
        return k;
      },
    ];
  }
  function Rf() {
    return new O.XMLHttpRequest();
  }
  function ef() {
    this.$get = [
      "$browser",
      "$window",
      "$document",
      function (b, a, c) {
        return Sf(b, Rf, b.defer, a.angular.callbacks, c[0]);
      },
    ];
  }
  function Sf(b, a, c, d, e) {
    function f(a, b, c) {
      var f = e.createElement("script"),
        n = null;
      f.type = "text/javascript";
      f.src = a;
      f.async = !0;
      n = function (a) {
        f.removeEventListener("load", n, !1);
        f.removeEventListener("error", n, !1);
        e.body.removeChild(f);
        f = null;
        var g = -1,
          x = "unknown";
        a &&
          ("load" !== a.type || d[b].called || (a = { type: "error" }),
          (x = a.type),
          (g = "error" === a.type ? 404 : 200));
        c && c(g, x);
      };
      f.addEventListener("load", n, !1);
      f.addEventListener("error", n, !1);
      e.body.appendChild(f);
      return n;
    }
    return function (e, h, l, k, n, r, s, x) {
      function C() {
        p && p();
        K && K.abort();
      }
      function F(a, d, e, f, g) {
        I !== t && c.cancel(I);
        p = K = null;
        a(d, e, f, g);
        b.$$completeOutstandingRequest(v);
      }
      b.$$incOutstandingRequestCount();
      h = h || b.url();
      if ("jsonp" == M(e)) {
        var u = "_" + (d.counter++).toString(36);
        d[u] = function (a) {
          d[u].data = a;
          d[u].called = !0;
        };
        var p = f(
          h.replace("JSON_CALLBACK", "angular.callbacks." + u),
          u,
          function (a, b) {
            F(k, a, d[u].data, "", b);
            d[u] = v;
          }
        );
      } else {
        var K = a();
        K.open(e, h, !0);
        m(n, function (a, b) {
          w(a) && K.setRequestHeader(b, a);
        });
        K.onload = function () {
          var a = K.statusText || "",
            b = "response" in K ? K.response : K.responseText,
            c = 1223 === K.status ? 204 : K.status;
          0 === c && (c = b ? 200 : "file" == Ba(h).protocol ? 404 : 0);
          F(k, c, b, K.getAllResponseHeaders(), a);
        };
        e = function () {
          F(k, -1, null, null, "");
        };
        K.onerror = e;
        K.onabort = e;
        s && (K.withCredentials = !0);
        if (x)
          try {
            K.responseType = x;
          } catch (q) {
            if ("json" !== x) throw q;
          }
        K.send(l);
      }
      if (0 < r) var I = c(C, r);
      else r && z(r.then) && r.then(C);
    };
  }
  function $e() {
    var b = "{{",
      a = "}}";
    this.startSymbol = function (a) {
      return a ? ((b = a), this) : b;
    };
    this.endSymbol = function (b) {
      return b ? ((a = b), this) : a;
    };
    this.$get = [
      "$parse",
      "$exceptionHandler",
      "$sce",
      function (c, d, e) {
        function f(a) {
          return "\\\\\\" + a;
        }
        function g(c) {
          return c.replace(n, b).replace(r, a);
        }
        function h(f, h, n, r) {
          function u(a) {
            try {
              var b = a;
              a = n ? e.getTrusted(n, b) : e.valueOf(b);
              var c;
              if (r && !w(a)) c = a;
              else if (null == a) c = "";
              else {
                switch (typeof a) {
                  case "string":
                    break;
                  case "number":
                    a = "" + a;
                    break;
                  default:
                    a = db(a);
                }
                c = a;
              }
              return c;
            } catch (g) {
              d(Ka.interr(f, g));
            }
          }
          r = !!r;
          for (
            var p, m, q = 0, I = [], B = [], N = f.length, D = [], t = [];
            q < N;

          )
            if (-1 != (p = f.indexOf(b, q)) && -1 != (m = f.indexOf(a, p + l)))
              q !== p && D.push(g(f.substring(q, p))),
                (q = f.substring(p + l, m)),
                I.push(q),
                B.push(c(q, u)),
                (q = m + k),
                t.push(D.length),
                D.push("");
            else {
              q !== N && D.push(g(f.substring(q)));
              break;
            }
          n && 1 < D.length && Ka.throwNoconcat(f);
          if (!h || I.length) {
            var S = function (a) {
              for (var b = 0, c = I.length; b < c; b++) {
                if (r && A(a[b])) return;
                D[t[b]] = a[b];
              }
              return D.join("");
            };
            return P(
              function (a) {
                var b = 0,
                  c = I.length,
                  e = Array(c);
                try {
                  for (; b < c; b++) e[b] = B[b](a);
                  return S(e);
                } catch (g) {
                  d(Ka.interr(f, g));
                }
              },
              {
                exp: f,
                expressions: I,
                $$watchDelegate: function (a, b) {
                  var c;
                  return a.$watchGroup(B, function (d, e) {
                    var f = S(d);
                    z(b) && b.call(this, f, d !== e ? c : f, a);
                    c = f;
                  });
                },
              }
            );
          }
        }
        var l = b.length,
          k = a.length,
          n = new RegExp(b.replace(/./g, f), "g"),
          r = new RegExp(a.replace(/./g, f), "g");
        h.startSymbol = function () {
          return b;
        };
        h.endSymbol = function () {
          return a;
        };
        return h;
      },
    ];
  }
  function af() {
    this.$get = [
      "$rootScope",
      "$window",
      "$q",
      "$$q",
      function (b, a, c, d) {
        function e(e, h, l, k) {
          var n = 4 < arguments.length,
            r = n ? za.call(arguments, 4) : [],
            s = a.setInterval,
            x = a.clearInterval,
            C = 0,
            F = w(k) && !k,
            u = (F ? d : c).defer(),
            p = u.promise;
          l = w(l) ? l : 0;
          p.then(
            null,
            null,
            n
              ? function () {
                  e.apply(null, r);
                }
              : e
          );
          p.$$intervalId = s(function () {
            u.notify(C++);
            0 < l &&
              C >= l &&
              (u.resolve(C), x(p.$$intervalId), delete f[p.$$intervalId]);
            F || b.$apply();
          }, h);
          f[p.$$intervalId] = u;
          return p;
        }
        var f = {};
        e.cancel = function (b) {
          return b && b.$$intervalId in f
            ? (f[b.$$intervalId].reject("canceled"),
              a.clearInterval(b.$$intervalId),
              delete f[b.$$intervalId],
              !0)
            : !1;
        };
        return e;
      },
    ];
  }
  function ge() {
    this.$get = function () {
      return {
        id: "en-us",
        NUMBER_FORMATS: {
          DECIMAL_SEP: ".",
          GROUP_SEP: ",",
          PATTERNS: [
            {
              minInt: 1,
              minFrac: 0,
              maxFrac: 3,
              posPre: "",
              posSuf: "",
              negPre: "-",
              negSuf: "",
              gSize: 3,
              lgSize: 3,
            },
            {
              minInt: 1,
              minFrac: 2,
              maxFrac: 2,
              posPre: "\u00a4",
              posSuf: "",
              negPre: "(\u00a4",
              negSuf: ")",
              gSize: 3,
              lgSize: 3,
            },
          ],
          CURRENCY_SYM: "$",
        },
        DATETIME_FORMATS: {
          MONTH:
            "January February March April May June July August September October November December".split(
              " "
            ),
          SHORTMONTH: "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(
            " "
          ),
          DAY: "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(
            " "
          ),
          SHORTDAY: "Sun Mon Tue Wed Thu Fri Sat".split(" "),
          AMPMS: ["AM", "PM"],
          medium: "MMM d, y h:mm:ss a",
          short: "M/d/yy h:mm a",
          fullDate: "EEEE, MMMM d, y",
          longDate: "MMMM d, y",
          mediumDate: "MMM d, y",
          shortDate: "M/d/yy",
          mediumTime: "h:mm:ss a",
          shortTime: "h:mm a",
          ERANAMES: ["Before Christ", "Anno Domini"],
          ERAS: ["BC", "AD"],
        },
        pluralCat: function (b) {
          return 1 === b ? "one" : "other";
        },
      };
    };
  }
  function bc(b) {
    b = b.split("/");
    for (var a = b.length; a--; ) b[a] = ob(b[a]);
    return b.join("/");
  }
  function hd(b, a) {
    var c = Ba(b);
    a.$$protocol = c.protocol;
    a.$$host = c.hostname;
    a.$$port = W(c.port) || Tf[c.protocol] || null;
  }
  function id(b, a) {
    var c = "/" !== b.charAt(0);
    c && (b = "/" + b);
    var d = Ba(b);
    a.$$path = decodeURIComponent(
      c && "/" === d.pathname.charAt(0) ? d.pathname.substring(1) : d.pathname
    );
    a.$$search = zc(d.search);
    a.$$hash = decodeURIComponent(d.hash);
    a.$$path && "/" != a.$$path.charAt(0) && (a.$$path = "/" + a.$$path);
  }
  function ya(b, a) {
    if (0 === a.indexOf(b)) return a.substr(b.length);
  }
  function Ja(b) {
    var a = b.indexOf("#");
    return -1 == a ? b : b.substr(0, a);
  }
  function Bb(b) {
    return b.replace(/(#.+)|#$/, "$1");
  }
  function cc(b) {
    return b.substr(0, Ja(b).lastIndexOf("/") + 1);
  }
  function dc(b, a) {
    this.$$html5 = !0;
    a = a || "";
    var c = cc(b);
    hd(b, this);
    this.$$parse = function (a) {
      var b = ya(c, a);
      if (!L(b)) throw Cb("ipthprfx", a, c);
      id(b, this);
      this.$$path || (this.$$path = "/");
      this.$$compose();
    };
    this.$$compose = function () {
      var a = Qb(this.$$search),
        b = this.$$hash ? "#" + ob(this.$$hash) : "";
      this.$$url = bc(this.$$path) + (a ? "?" + a : "") + b;
      this.$$absUrl = c + this.$$url.substr(1);
    };
    this.$$parseLinkUrl = function (d, e) {
      if (e && "#" === e[0]) return this.hash(e.slice(1)), !0;
      var f, g;
      (f = ya(b, d)) !== t
        ? ((g = f), (g = (f = ya(a, f)) !== t ? c + (ya("/", f) || f) : b + g))
        : (f = ya(c, d)) !== t
        ? (g = c + f)
        : c == d + "/" && (g = c);
      g && this.$$parse(g);
      return !!g;
    };
  }
  function ec(b, a) {
    var c = cc(b);
    hd(b, this);
    this.$$parse = function (d) {
      var e = ya(b, d) || ya(c, d),
        f;
      A(e) || "#" !== e.charAt(0)
        ? this.$$html5
          ? (f = e)
          : ((f = ""), A(e) && ((b = d), this.replace()))
        : ((f = ya(a, e)), A(f) && (f = e));
      id(f, this);
      d = this.$$path;
      var e = b,
        g = /^\/[A-Z]:(\/.*)/;
      0 === f.indexOf(e) && (f = f.replace(e, ""));
      g.exec(f) || (d = (f = g.exec(d)) ? f[1] : d);
      this.$$path = d;
      this.$$compose();
    };
    this.$$compose = function () {
      var c = Qb(this.$$search),
        e = this.$$hash ? "#" + ob(this.$$hash) : "";
      this.$$url = bc(this.$$path) + (c ? "?" + c : "") + e;
      this.$$absUrl = b + (this.$$url ? a + this.$$url : "");
    };
    this.$$parseLinkUrl = function (a, c) {
      return Ja(b) == Ja(a) ? (this.$$parse(a), !0) : !1;
    };
  }
  function jd(b, a) {
    this.$$html5 = !0;
    ec.apply(this, arguments);
    var c = cc(b);
    this.$$parseLinkUrl = function (d, e) {
      if (e && "#" === e[0]) return this.hash(e.slice(1)), !0;
      var f, g;
      b == Ja(d)
        ? (f = d)
        : (g = ya(c, d))
        ? (f = b + a + g)
        : c === d + "/" && (f = c);
      f && this.$$parse(f);
      return !!f;
    };
    this.$$compose = function () {
      var c = Qb(this.$$search),
        e = this.$$hash ? "#" + ob(this.$$hash) : "";
      this.$$url = bc(this.$$path) + (c ? "?" + c : "") + e;
      this.$$absUrl = b + a + this.$$url;
    };
  }
  function Db(b) {
    return function () {
      return this[b];
    };
  }
  function kd(b, a) {
    return function (c) {
      if (A(c)) return this[b];
      this[b] = a(c);
      this.$$compose();
      return this;
    };
  }
  function ff() {
    var b = "",
      a = { enabled: !1, requireBase: !0, rewriteLinks: !0 };
    this.hashPrefix = function (a) {
      return w(a) ? ((b = a), this) : b;
    };
    this.html5Mode = function (b) {
      return ab(b)
        ? ((a.enabled = b), this)
        : H(b)
        ? (ab(b.enabled) && (a.enabled = b.enabled),
          ab(b.requireBase) && (a.requireBase = b.requireBase),
          ab(b.rewriteLinks) && (a.rewriteLinks = b.rewriteLinks),
          this)
        : a;
    };
    this.$get = [
      "$rootScope",
      "$browser",
      "$sniffer",
      "$rootElement",
      "$window",
      function (c, d, e, f, g) {
        function h(a, b, c) {
          var e = k.url(),
            f = k.$$state;
          try {
            d.url(a, b, c), (k.$$state = d.state());
          } catch (g) {
            throw (k.url(e), (k.$$state = f), g);
          }
        }
        function l(a, b) {
          c.$broadcast("$locationChangeSuccess", k.absUrl(), a, k.$$state, b);
        }
        var k, n;
        n = d.baseHref();
        var r = d.url(),
          s;
        if (a.enabled) {
          if (!n && a.requireBase) throw Cb("nobase");
          s = r.substring(0, r.indexOf("/", r.indexOf("//") + 2)) + (n || "/");
          n = e.history ? dc : jd;
        } else (s = Ja(r)), (n = ec);
        k = new n(s, "#" + b);
        k.$$parseLinkUrl(r, r);
        k.$$state = d.state();
        var x = /^\s*(javascript|mailto):/i;
        f.on("click", function (b) {
          if (
            a.rewriteLinks &&
            !b.ctrlKey &&
            !b.metaKey &&
            !b.shiftKey &&
            2 != b.which &&
            2 != b.button
          ) {
            for (var e = y(b.target); "a" !== ta(e[0]); )
              if (e[0] === f[0] || !(e = e.parent())[0]) return;
            var h = e.prop("href"),
              l = e.attr("href") || e.attr("xlink:href");
            H(h) &&
              "[object SVGAnimatedString]" === h.toString() &&
              (h = Ba(h.animVal).href);
            x.test(h) ||
              !h ||
              e.attr("target") ||
              b.isDefaultPrevented() ||
              !k.$$parseLinkUrl(h, l) ||
              (b.preventDefault(),
              k.absUrl() != d.url() &&
                (c.$apply(), (g.angular["ff-684208-preventDefault"] = !0)));
          }
        });
        Bb(k.absUrl()) != Bb(r) && d.url(k.absUrl(), !0);
        var C = !0;
        d.onUrlChange(function (a, b) {
          c.$evalAsync(function () {
            var d = k.absUrl(),
              e = k.$$state,
              f;
            k.$$parse(a);
            k.$$state = b;
            f = c.$broadcast(
              "$locationChangeStart",
              a,
              d,
              b,
              e
            ).defaultPrevented;
            k.absUrl() === a &&
              (f
                ? (k.$$parse(d), (k.$$state = e), h(d, !1, e))
                : ((C = !1), l(d, e)));
          });
          c.$$phase || c.$digest();
        });
        c.$watch(function () {
          var a = Bb(d.url()),
            b = Bb(k.absUrl()),
            f = d.state(),
            g = k.$$replace,
            n = a !== b || (k.$$html5 && e.history && f !== k.$$state);
          if (C || n)
            (C = !1),
              c.$evalAsync(function () {
                var b = k.absUrl(),
                  d = c.$broadcast(
                    "$locationChangeStart",
                    b,
                    a,
                    k.$$state,
                    f
                  ).defaultPrevented;
                k.absUrl() === b &&
                  (d
                    ? (k.$$parse(a), (k.$$state = f))
                    : (n && h(b, g, f === k.$$state ? null : k.$$state),
                      l(a, f)));
              });
          k.$$replace = !1;
        });
        return k;
      },
    ];
  }
  function gf() {
    var b = !0,
      a = this;
    this.debugEnabled = function (a) {
      return w(a) ? ((b = a), this) : b;
    };
    this.$get = [
      "$window",
      function (c) {
        function d(a) {
          a instanceof Error &&
            (a.stack
              ? (a =
                  a.message && -1 === a.stack.indexOf(a.message)
                    ? "Error: " + a.message + "\n" + a.stack
                    : a.stack)
              : a.sourceURL &&
                (a = a.message + "\n" + a.sourceURL + ":" + a.line));
          return a;
        }
        function e(a) {
          var b = c.console || {},
            e = b[a] || b.log || v;
          a = !1;
          try {
            a = !!e.apply;
          } catch (l) {}
          return a
            ? function () {
                var a = [];
                m(arguments, function (b) {
                  a.push(d(b));
                });
                return e.apply(b, a);
              }
            : function (a, b) {
                e(a, null == b ? "" : b);
              };
        }
        return {
          log: e("log"),
          info: e("info"),
          warn: e("warn"),
          error: e("error"),
          debug: (function () {
            var c = e("debug");
            return function () {
              b && c.apply(a, arguments);
            };
          })(),
        };
      },
    ];
  }
  function Ca(b, a) {
    if (
      "__defineGetter__" === b ||
      "__defineSetter__" === b ||
      "__lookupGetter__" === b ||
      "__lookupSetter__" === b ||
      "__proto__" === b
    )
      throw da("isecfld", a);
    return b;
  }
  function oa(b, a) {
    if (b) {
      if (b.constructor === b) throw da("isecfn", a);
      if (b.window === b) throw da("isecwindow", a);
      if (b.children && (b.nodeName || (b.prop && b.attr && b.find)))
        throw da("isecdom", a);
      if (b === Object) throw da("isecobj", a);
    }
    return b;
  }
  function ld(b, a) {
    if (b) {
      if (b.constructor === b) throw da("isecfn", a);
      if (b === Uf || b === Vf || b === Wf) throw da("isecff", a);
    }
  }
  function Xf(b, a) {
    return "undefined" !== typeof b ? b : a;
  }
  function md(b, a) {
    return "undefined" === typeof b ? a : "undefined" === typeof a ? b : b + a;
  }
  function T(b, a) {
    var c, d;
    switch (b.type) {
      case q.Program:
        c = !0;
        m(b.body, function (b) {
          T(b.expression, a);
          c = c && b.expression.constant;
        });
        b.constant = c;
        break;
      case q.Literal:
        b.constant = !0;
        b.toWatch = [];
        break;
      case q.UnaryExpression:
        T(b.argument, a);
        b.constant = b.argument.constant;
        b.toWatch = b.argument.toWatch;
        break;
      case q.BinaryExpression:
        T(b.left, a);
        T(b.right, a);
        b.constant = b.left.constant && b.right.constant;
        b.toWatch = b.left.toWatch.concat(b.right.toWatch);
        break;
      case q.LogicalExpression:
        T(b.left, a);
        T(b.right, a);
        b.constant = b.left.constant && b.right.constant;
        b.toWatch = b.constant ? [] : [b];
        break;
      case q.ConditionalExpression:
        T(b.test, a);
        T(b.alternate, a);
        T(b.consequent, a);
        b.constant =
          b.test.constant && b.alternate.constant && b.consequent.constant;
        b.toWatch = b.constant ? [] : [b];
        break;
      case q.Identifier:
        b.constant = !1;
        b.toWatch = [b];
        break;
      case q.MemberExpression:
        T(b.object, a);
        b.computed && T(b.property, a);
        b.constant = b.object.constant && (!b.computed || b.property.constant);
        b.toWatch = [b];
        break;
      case q.CallExpression:
        c = b.filter ? !a(b.callee.name).$stateful : !1;
        d = [];
        m(b.arguments, function (b) {
          T(b, a);
          c = c && b.constant;
          b.constant || d.push.apply(d, b.toWatch);
        });
        b.constant = c;
        b.toWatch = b.filter && !a(b.callee.name).$stateful ? d : [b];
        break;
      case q.AssignmentExpression:
        T(b.left, a);
        T(b.right, a);
        b.constant = b.left.constant && b.right.constant;
        b.toWatch = [b];
        break;
      case q.ArrayExpression:
        c = !0;
        d = [];
        m(b.elements, function (b) {
          T(b, a);
          c = c && b.constant;
          b.constant || d.push.apply(d, b.toWatch);
        });
        b.constant = c;
        b.toWatch = d;
        break;
      case q.ObjectExpression:
        c = !0;
        d = [];
        m(b.properties, function (b) {
          T(b.value, a);
          c = c && b.value.constant;
          b.value.constant || d.push.apply(d, b.value.toWatch);
        });
        b.constant = c;
        b.toWatch = d;
        break;
      case q.ThisExpression:
        (b.constant = !1), (b.toWatch = []);
    }
  }
  function nd(b) {
    if (1 == b.length) {
      b = b[0].expression;
      var a = b.toWatch;
      return 1 !== a.length ? a : a[0] !== b ? a : t;
    }
  }
  function od(b) {
    return b.type === q.Identifier || b.type === q.MemberExpression;
  }
  function pd(b) {
    if (1 === b.body.length && od(b.body[0].expression))
      return {
        type: q.AssignmentExpression,
        left: b.body[0].expression,
        right: { type: q.NGValueParameter },
        operator: "=",
      };
  }
  function qd(b) {
    return (
      0 === b.body.length ||
      (1 === b.body.length &&
        (b.body[0].expression.type === q.Literal ||
          b.body[0].expression.type === q.ArrayExpression ||
          b.body[0].expression.type === q.ObjectExpression))
    );
  }
  function rd(b, a) {
    this.astBuilder = b;
    this.$filter = a;
  }
  function sd(b, a) {
    this.astBuilder = b;
    this.$filter = a;
  }
  function Eb(b, a, c, d) {
    oa(b, d);
    a = a.split(".");
    for (var e, f = 0; 1 < a.length; f++) {
      e = Ca(a.shift(), d);
      var g = oa(b[e], d);
      g || ((g = {}), (b[e] = g));
      b = g;
    }
    e = Ca(a.shift(), d);
    oa(b[e], d);
    return (b[e] = c);
  }
  function Fb(b) {
    return "constructor" == b;
  }
  function fc(b) {
    return z(b.valueOf) ? b.valueOf() : Yf.call(b);
  }
  function hf() {
    var b = ga(),
      a = ga();
    this.$get = [
      "$filter",
      "$sniffer",
      function (c, d) {
        function e(a, b) {
          return null == a || null == b
            ? a === b
            : "object" === typeof a && ((a = fc(a)), "object" === typeof a)
            ? !1
            : a === b || (a !== a && b !== b);
        }
        function f(a, b, c, d, f) {
          var g = d.inputs,
            h;
          if (1 === g.length) {
            var k = e,
              g = g[0];
            return a.$watch(
              function (a) {
                var b = g(a);
                e(b, k) || ((h = d(a, t, t, [b])), (k = b && fc(b)));
                return h;
              },
              b,
              c,
              f
            );
          }
          for (var l = [], n = [], r = 0, m = g.length; r < m; r++)
            (l[r] = e), (n[r] = null);
          return a.$watch(
            function (a) {
              for (var b = !1, c = 0, f = g.length; c < f; c++) {
                var k = g[c](a);
                if (b || (b = !e(k, l[c]))) (n[c] = k), (l[c] = k && fc(k));
              }
              b && (h = d(a, t, t, n));
              return h;
            },
            b,
            c,
            f
          );
        }
        function g(a, b, c, d) {
          var e, f;
          return (e = a.$watch(
            function (a) {
              return d(a);
            },
            function (a, c, d) {
              f = a;
              z(b) && b.apply(this, arguments);
              w(a) &&
                d.$$postDigest(function () {
                  w(f) && e();
                });
            },
            c
          ));
        }
        function h(a, b, c, d) {
          function e(a) {
            var b = !0;
            m(a, function (a) {
              w(a) || (b = !1);
            });
            return b;
          }
          var f, g;
          return (f = a.$watch(
            function (a) {
              return d(a);
            },
            function (a, c, d) {
              g = a;
              z(b) && b.call(this, a, c, d);
              e(a) &&
                d.$$postDigest(function () {
                  e(g) && f();
                });
            },
            c
          ));
        }
        function l(a, b, c, d) {
          var e;
          return (e = a.$watch(
            function (a) {
              return d(a);
            },
            function (a, c, d) {
              z(b) && b.apply(this, arguments);
              e();
            },
            c
          ));
        }
        function k(a, b) {
          if (!b) return a;
          var c = a.$$watchDelegate,
            c =
              c !== h && c !== g
                ? function (c, d, e, f) {
                    e = a(c, d, e, f);
                    return b(e, c, d);
                  }
                : function (c, d, e, f) {
                    e = a(c, d, e, f);
                    c = b(e, c, d);
                    return w(e) ? c : e;
                  };
          a.$$watchDelegate && a.$$watchDelegate !== f
            ? (c.$$watchDelegate = a.$$watchDelegate)
            : b.$stateful ||
              ((c.$$watchDelegate = f), (c.inputs = a.inputs ? a.inputs : [a]));
          return c;
        }
        var n = { csp: d.csp, expensiveChecks: !1 },
          r = { csp: d.csp, expensiveChecks: !0 };
        return function (d, e, C) {
          var m, u, p;
          switch (typeof d) {
            case "string":
              p = d = d.trim();
              var q = C ? a : b;
              m = q[p];
              m ||
                (":" === d.charAt(0) &&
                  ":" === d.charAt(1) &&
                  ((u = !0), (d = d.substring(2))),
                (C = C ? r : n),
                (m = new gc(C)),
                (m = new hc(m, c, C).parse(d)),
                m.constant
                  ? (m.$$watchDelegate = l)
                  : u
                  ? (m.$$watchDelegate = m.literal ? h : g)
                  : m.inputs && (m.$$watchDelegate = f),
                (q[p] = m));
              return k(m, e);
            case "function":
              return k(d, e);
            default:
              return v;
          }
        };
      },
    ];
  }
  function kf() {
    this.$get = [
      "$rootScope",
      "$exceptionHandler",
      function (b, a) {
        return td(function (a) {
          b.$evalAsync(a);
        }, a);
      },
    ];
  }
  function lf() {
    this.$get = [
      "$browser",
      "$exceptionHandler",
      function (b, a) {
        return td(function (a) {
          b.defer(a);
        }, a);
      },
    ];
  }
  function td(b, a) {
    function c(a, b, c) {
      function d(b) {
        return function (c) {
          e || ((e = !0), b.call(a, c));
        };
      }
      var e = !1;
      return [d(b), d(c)];
    }
    function d() {
      this.$$state = { status: 0 };
    }
    function e(a, b) {
      return function (c) {
        b.call(a, c);
      };
    }
    function f(c) {
      !c.processScheduled &&
        c.pending &&
        ((c.processScheduled = !0),
        b(function () {
          var b, d, e;
          e = c.pending;
          c.processScheduled = !1;
          c.pending = t;
          for (var f = 0, g = e.length; f < g; ++f) {
            d = e[f][0];
            b = e[f][c.status];
            try {
              z(b)
                ? d.resolve(b(c.value))
                : 1 === c.status
                ? d.resolve(c.value)
                : d.reject(c.value);
            } catch (h) {
              d.reject(h), a(h);
            }
          }
        }));
    }
    function g() {
      this.promise = new d();
      this.resolve = e(this, this.resolve);
      this.reject = e(this, this.reject);
      this.notify = e(this, this.notify);
    }
    var h = J("$q", TypeError);
    d.prototype = {
      then: function (a, b, c) {
        var d = new g();
        this.$$state.pending = this.$$state.pending || [];
        this.$$state.pending.push([d, a, b, c]);
        0 < this.$$state.status && f(this.$$state);
        return d.promise;
      },
      catch: function (a) {
        return this.then(null, a);
      },
      finally: function (a, b) {
        return this.then(
          function (b) {
            return k(b, !0, a);
          },
          function (b) {
            return k(b, !1, a);
          },
          b
        );
      },
    };
    g.prototype = {
      resolve: function (a) {
        this.promise.$$state.status ||
          (a === this.promise
            ? this.$$reject(h("qcycle", a))
            : this.$$resolve(a));
      },
      $$resolve: function (b) {
        var d, e;
        e = c(this, this.$$resolve, this.$$reject);
        try {
          if (H(b) || z(b)) d = b && b.then;
          z(d)
            ? ((this.promise.$$state.status = -1),
              d.call(b, e[0], e[1], this.notify))
            : ((this.promise.$$state.value = b),
              (this.promise.$$state.status = 1),
              f(this.promise.$$state));
        } catch (g) {
          e[1](g), a(g);
        }
      },
      reject: function (a) {
        this.promise.$$state.status || this.$$reject(a);
      },
      $$reject: function (a) {
        this.promise.$$state.value = a;
        this.promise.$$state.status = 2;
        f(this.promise.$$state);
      },
      notify: function (c) {
        var d = this.promise.$$state.pending;
        0 >= this.promise.$$state.status &&
          d &&
          d.length &&
          b(function () {
            for (var b, e, f = 0, g = d.length; f < g; f++) {
              e = d[f][0];
              b = d[f][3];
              try {
                e.notify(z(b) ? b(c) : c);
              } catch (h) {
                a(h);
              }
            }
          });
      },
    };
    var l = function (a, b) {
        var c = new g();
        b ? c.resolve(a) : c.reject(a);
        return c.promise;
      },
      k = function (a, b, c) {
        var d = null;
        try {
          z(c) && (d = c());
        } catch (e) {
          return l(e, !1);
        }
        return d && z(d.then)
          ? d.then(
              function () {
                return l(a, b);
              },
              function (a) {
                return l(a, !1);
              }
            )
          : l(a, b);
      },
      n = function (a, b, c, d) {
        var e = new g();
        e.resolve(a);
        return e.promise.then(b, c, d);
      },
      r = function x(a) {
        if (!z(a)) throw h("norslvr", a);
        if (!(this instanceof x)) return new x(a);
        var b = new g();
        a(
          function (a) {
            b.resolve(a);
          },
          function (a) {
            b.reject(a);
          }
        );
        return b.promise;
      };
    r.defer = function () {
      return new g();
    };
    r.reject = function (a) {
      var b = new g();
      b.reject(a);
      return b.promise;
    };
    r.when = n;
    r.resolve = n;
    r.all = function (a) {
      var b = new g(),
        c = 0,
        d = G(a) ? [] : {};
      m(a, function (a, e) {
        c++;
        n(a).then(
          function (a) {
            d.hasOwnProperty(e) || ((d[e] = a), --c || b.resolve(d));
          },
          function (a) {
            d.hasOwnProperty(e) || b.reject(a);
          }
        );
      });
      0 === c && b.resolve(d);
      return b.promise;
    };
    return r;
  }
  function uf() {
    this.$get = [
      "$window",
      "$timeout",
      function (b, a) {
        function c() {
          for (var a = 0; a < n.length; a++) {
            var b = n[a];
            b && ((n[a] = null), b());
          }
          k = n.length = 0;
        }
        function d(a) {
          var b = n.length;
          k++;
          n.push(a);
          0 === b && (l = h(c));
          return function () {
            0 <= b &&
              ((b = n[b] = null),
              0 === --k && l && (l(), (l = null), (n.length = 0)));
          };
        }
        var e = b.requestAnimationFrame || b.webkitRequestAnimationFrame,
          f =
            b.cancelAnimationFrame ||
            b.webkitCancelAnimationFrame ||
            b.webkitCancelRequestAnimationFrame,
          g = !!e,
          h = g
            ? function (a) {
                var b = e(a);
                return function () {
                  f(b);
                };
              }
            : function (b) {
                var c = a(b, 16.66, !1);
                return function () {
                  a.cancel(c);
                };
              };
        d.supported = g;
        var l,
          k = 0,
          n = [];
        return d;
      },
    ];
  }
  function jf() {
    function b(a) {
      function b() {
        this.$$watchers =
          this.$$nextSibling =
          this.$$childHead =
          this.$$childTail =
            null;
        this.$$listeners = {};
        this.$$listenerCount = {};
        this.$$watchersCount = 0;
        this.$id = ++nb;
        this.$$ChildScope = null;
      }
      b.prototype = a;
      return b;
    }
    var a = 10,
      c = J("$rootScope"),
      d = null,
      e = null;
    this.digestTtl = function (b) {
      arguments.length && (a = b);
      return a;
    };
    this.$get = [
      "$injector",
      "$exceptionHandler",
      "$parse",
      "$browser",
      function (f, g, h, l) {
        function k(a) {
          a.currentScope.$$destroyed = !0;
        }
        function n() {
          this.$id = ++nb;
          this.$$phase =
            this.$parent =
            this.$$watchers =
            this.$$nextSibling =
            this.$$prevSibling =
            this.$$childHead =
            this.$$childTail =
              null;
          this.$root = this;
          this.$$destroyed = !1;
          this.$$listeners = {};
          this.$$listenerCount = {};
          this.$$watchersCount = 0;
          this.$$isolateBindings = null;
        }
        function r(a) {
          if (p.$$phase) throw c("inprog", p.$$phase);
          p.$$phase = a;
        }
        function s(a, b) {
          do a.$$watchersCount += b;
          while ((a = a.$parent));
        }
        function x(a, b, c) {
          do
            (a.$$listenerCount[c] -= b),
              0 === a.$$listenerCount[c] && delete a.$$listenerCount[c];
          while ((a = a.$parent));
        }
        function q() {}
        function F() {
          for (; I.length; )
            try {
              I.shift()();
            } catch (a) {
              g(a);
            }
          e = null;
        }
        function u() {
          null === e &&
            (e = l.defer(function () {
              p.$apply(F);
            }));
        }
        n.prototype = {
          constructor: n,
          $new: function (a, c) {
            var d;
            c = c || this;
            a
              ? ((d = new n()), (d.$root = this.$root))
              : (this.$$ChildScope || (this.$$ChildScope = b(this)),
                (d = new this.$$ChildScope()));
            d.$parent = c;
            d.$$prevSibling = c.$$childTail;
            c.$$childHead
              ? ((c.$$childTail.$$nextSibling = d), (c.$$childTail = d))
              : (c.$$childHead = c.$$childTail = d);
            (a || c != this) && d.$on("$destroy", k);
            return d;
          },
          $watch: function (a, b, c, e) {
            var f = h(a);
            if (f.$$watchDelegate) return f.$$watchDelegate(this, b, c, f, a);
            var g = this,
              k = g.$$watchers,
              l = { fn: b, last: q, get: f, exp: e || a, eq: !!c };
            d = null;
            z(b) || (l.fn = v);
            k || (k = g.$$watchers = []);
            k.unshift(l);
            s(this, 1);
            return function () {
              0 <= bb(k, l) && s(g, -1);
              d = null;
            };
          },
          $watchGroup: function (a, b) {
            function c() {
              h = !1;
              k ? ((k = !1), b(e, e, g)) : b(e, d, g);
            }
            var d = Array(a.length),
              e = Array(a.length),
              f = [],
              g = this,
              h = !1,
              k = !0;
            if (!a.length) {
              var l = !0;
              g.$evalAsync(function () {
                l && b(e, e, g);
              });
              return function () {
                l = !1;
              };
            }
            if (1 === a.length)
              return this.$watch(a[0], function (a, c, f) {
                e[0] = a;
                d[0] = c;
                b(e, a === c ? e : d, f);
              });
            m(a, function (a, b) {
              var k = g.$watch(a, function (a, f) {
                e[b] = a;
                d[b] = f;
                h || ((h = !0), g.$evalAsync(c));
              });
              f.push(k);
            });
            return function () {
              for (; f.length; ) f.shift()();
            };
          },
          $watchCollection: function (a, b) {
            function c(a) {
              e = a;
              var b, d, g, h;
              if (!A(e)) {
                if (H(e))
                  if (Ea(e))
                    for (
                      f !== r && ((f = r), (m = f.length = 0), l++),
                        a = e.length,
                        m !== a && (l++, (f.length = m = a)),
                        b = 0;
                      b < a;
                      b++
                    )
                      (h = f[b]),
                        (g = e[b]),
                        (d = h !== h && g !== g),
                        d || h === g || (l++, (f[b] = g));
                  else {
                    f !== s && ((f = s = {}), (m = 0), l++);
                    a = 0;
                    for (b in e)
                      e.hasOwnProperty(b) &&
                        (a++,
                        (g = e[b]),
                        (h = f[b]),
                        b in f
                          ? ((d = h !== h && g !== g),
                            d || h === g || (l++, (f[b] = g)))
                          : (m++, (f[b] = g), l++));
                    if (m > a)
                      for (b in (l++, f))
                        e.hasOwnProperty(b) || (m--, delete f[b]);
                  }
                else f !== e && ((f = e), l++);
                return l;
              }
            }
            c.$stateful = !0;
            var d = this,
              e,
              f,
              g,
              k = 1 < b.length,
              l = 0,
              n = h(a, c),
              r = [],
              s = {},
              p = !0,
              m = 0;
            return this.$watch(n, function () {
              p ? ((p = !1), b(e, e, d)) : b(e, g, d);
              if (k)
                if (H(e))
                  if (Ea(e)) {
                    g = Array(e.length);
                    for (var a = 0; a < e.length; a++) g[a] = e[a];
                  } else
                    for (a in ((g = {}), e)) Xa.call(e, a) && (g[a] = e[a]);
                else g = e;
            });
          },
          $digest: function () {
            var b,
              f,
              h,
              k,
              n,
              s,
              m = a,
              x,
              u = [],
              E,
              I;
            r("$digest");
            l.$$checkUrlChange();
            this === p && null !== e && (l.defer.cancel(e), F());
            d = null;
            do {
              s = !1;
              for (x = this; t.length; ) {
                try {
                  (I = t.shift()), I.scope.$eval(I.expression, I.locals);
                } catch (v) {
                  g(v);
                }
                d = null;
              }
              a: do {
                if ((k = x.$$watchers))
                  for (n = k.length; n--; )
                    try {
                      if ((b = k[n]))
                        if (
                          (f = b.get(x)) !== (h = b.last) &&
                          !(b.eq
                            ? ka(f, h)
                            : "number" === typeof f &&
                              "number" === typeof h &&
                              isNaN(f) &&
                              isNaN(h))
                        )
                          (s = !0),
                            (d = b),
                            (b.last = b.eq ? fa(f, null) : f),
                            b.fn(f, h === q ? f : h, x),
                            5 > m &&
                              ((E = 4 - m),
                              u[E] || (u[E] = []),
                              u[E].push({
                                msg: z(b.exp)
                                  ? "fn: " + (b.exp.name || b.exp.toString())
                                  : b.exp,
                                newVal: f,
                                oldVal: h,
                              }));
                        else if (b === d) {
                          s = !1;
                          break a;
                        }
                    } catch (A) {
                      g(A);
                    }
                if (
                  !(k =
                    (x.$$watchersCount && x.$$childHead) ||
                    (x !== this && x.$$nextSibling))
                )
                  for (; x !== this && !(k = x.$$nextSibling); ) x = x.$parent;
              } while ((x = k));
              if ((s || t.length) && !m--)
                throw ((p.$$phase = null), c("infdig", a, u));
            } while (s || t.length);
            for (p.$$phase = null; w.length; )
              try {
                w.shift()();
              } catch (y) {
                g(y);
              }
          },
          $destroy: function () {
            if (!this.$$destroyed) {
              var a = this.$parent;
              this.$broadcast("$destroy");
              this.$$destroyed = !0;
              this === p && l.$$applicationDestroyed();
              s(this, -this.$$watchersCount);
              for (var b in this.$$listenerCount)
                x(this, this.$$listenerCount[b], b);
              a &&
                a.$$childHead == this &&
                (a.$$childHead = this.$$nextSibling);
              a &&
                a.$$childTail == this &&
                (a.$$childTail = this.$$prevSibling);
              this.$$prevSibling &&
                (this.$$prevSibling.$$nextSibling = this.$$nextSibling);
              this.$$nextSibling &&
                (this.$$nextSibling.$$prevSibling = this.$$prevSibling);
              this.$destroy =
                this.$digest =
                this.$apply =
                this.$evalAsync =
                this.$applyAsync =
                  v;
              this.$on =
                this.$watch =
                this.$watchGroup =
                  function () {
                    return v;
                  };
              this.$$listeners = {};
              this.$parent =
                this.$$nextSibling =
                this.$$prevSibling =
                this.$$childHead =
                this.$$childTail =
                this.$root =
                this.$$watchers =
                  null;
            }
          },
          $eval: function (a, b) {
            return h(a)(this, b);
          },
          $evalAsync: function (a, b) {
            p.$$phase ||
              t.length ||
              l.defer(function () {
                t.length && p.$digest();
              });
            t.push({ scope: this, expression: a, locals: b });
          },
          $$postDigest: function (a) {
            w.push(a);
          },
          $apply: function (a) {
            try {
              return r("$apply"), this.$eval(a);
            } catch (b) {
              g(b);
            } finally {
              p.$$phase = null;
              try {
                p.$digest();
              } catch (c) {
                throw (g(c), c);
              }
            }
          },
          $applyAsync: function (a) {
            function b() {
              c.$eval(a);
            }
            var c = this;
            a && I.push(b);
            u();
          },
          $on: function (a, b) {
            var c = this.$$listeners[a];
            c || (this.$$listeners[a] = c = []);
            c.push(b);
            var d = this;
            do
              d.$$listenerCount[a] || (d.$$listenerCount[a] = 0),
                d.$$listenerCount[a]++;
            while ((d = d.$parent));
            var e = this;
            return function () {
              var d = c.indexOf(b);
              -1 !== d && ((c[d] = null), x(e, 1, a));
            };
          },
          $emit: function (a, b) {
            var c = [],
              d,
              e = this,
              f = !1,
              h = {
                name: a,
                targetScope: e,
                stopPropagation: function () {
                  f = !0;
                },
                preventDefault: function () {
                  h.defaultPrevented = !0;
                },
                defaultPrevented: !1,
              },
              k = cb([h], arguments, 1),
              l,
              n;
            do {
              d = e.$$listeners[a] || c;
              h.currentScope = e;
              l = 0;
              for (n = d.length; l < n; l++)
                if (d[l])
                  try {
                    d[l].apply(null, k);
                  } catch (r) {
                    g(r);
                  }
                else d.splice(l, 1), l--, n--;
              if (f) return (h.currentScope = null), h;
              e = e.$parent;
            } while (e);
            h.currentScope = null;
            return h;
          },
          $broadcast: function (a, b) {
            var c = this,
              d = this,
              e = {
                name: a,
                targetScope: this,
                preventDefault: function () {
                  e.defaultPrevented = !0;
                },
                defaultPrevented: !1,
              };
            if (!this.$$listenerCount[a]) return e;
            for (var f = cb([e], arguments, 1), h, k; (c = d); ) {
              e.currentScope = c;
              d = c.$$listeners[a] || [];
              h = 0;
              for (k = d.length; h < k; h++)
                if (d[h])
                  try {
                    d[h].apply(null, f);
                  } catch (l) {
                    g(l);
                  }
                else d.splice(h, 1), h--, k--;
              if (
                !(d =
                  (c.$$listenerCount[a] && c.$$childHead) ||
                  (c !== this && c.$$nextSibling))
              )
                for (; c !== this && !(d = c.$$nextSibling); ) c = c.$parent;
            }
            e.currentScope = null;
            return e;
          },
        };
        var p = new n(),
          t = (p.$$asyncQueue = []),
          w = (p.$$postDigestQueue = []),
          I = (p.$$applyAsyncQueue = []);
        return p;
      },
    ];
  }
  function he() {
    var b = /^\s*(https?|ftp|mailto|tel|file):/,
      a = /^\s*((https?|ftp|file|blob):|data:image\/)/;
    this.aHrefSanitizationWhitelist = function (a) {
      return w(a) ? ((b = a), this) : b;
    };
    this.imgSrcSanitizationWhitelist = function (b) {
      return w(b) ? ((a = b), this) : a;
    };
    this.$get = function () {
      return function (c, d) {
        var e = d ? a : b,
          f;
        f = Ba(c).href;
        return "" === f || f.match(e) ? c : "unsafe:" + f;
      };
    };
  }
  function Zf(b) {
    if ("self" === b) return b;
    if (L(b)) {
      if (-1 < b.indexOf("***")) throw Da("iwcard", b);
      b = ud(b).replace("\\*\\*", ".*").replace("\\*", "[^:/.?&;]*");
      return new RegExp("^" + b + "$");
    }
    if (Za(b)) return new RegExp("^" + b.source + "$");
    throw Da("imatcher");
  }
  function vd(b) {
    var a = [];
    w(b) &&
      m(b, function (b) {
        a.push(Zf(b));
      });
    return a;
  }
  function nf() {
    this.SCE_CONTEXTS = pa;
    var b = ["self"],
      a = [];
    this.resourceUrlWhitelist = function (a) {
      arguments.length && (b = vd(a));
      return b;
    };
    this.resourceUrlBlacklist = function (b) {
      arguments.length && (a = vd(b));
      return a;
    };
    this.$get = [
      "$injector",
      function (c) {
        function d(a, b) {
          return "self" === a ? gd(b) : !!a.exec(b.href);
        }
        function e(a) {
          var b = function (a) {
            this.$$unwrapTrustedValue = function () {
              return a;
            };
          };
          a && (b.prototype = new a());
          b.prototype.valueOf = function () {
            return this.$$unwrapTrustedValue();
          };
          b.prototype.toString = function () {
            return this.$$unwrapTrustedValue().toString();
          };
          return b;
        }
        var f = function (a) {
          throw Da("unsafe");
        };
        c.has("$sanitize") && (f = c.get("$sanitize"));
        var g = e(),
          h = {};
        h[pa.HTML] = e(g);
        h[pa.CSS] = e(g);
        h[pa.URL] = e(g);
        h[pa.JS] = e(g);
        h[pa.RESOURCE_URL] = e(h[pa.URL]);
        return {
          trustAs: function (a, b) {
            var c = h.hasOwnProperty(a) ? h[a] : null;
            if (!c) throw Da("icontext", a, b);
            if (null === b || b === t || "" === b) return b;
            if ("string" !== typeof b) throw Da("itype", a);
            return new c(b);
          },
          getTrusted: function (c, e) {
            if (null === e || e === t || "" === e) return e;
            var g = h.hasOwnProperty(c) ? h[c] : null;
            if (g && e instanceof g) return e.$$unwrapTrustedValue();
            if (c === pa.RESOURCE_URL) {
              var g = Ba(e.toString()),
                r,
                s,
                m = !1;
              r = 0;
              for (s = b.length; r < s; r++)
                if (d(b[r], g)) {
                  m = !0;
                  break;
                }
              if (m)
                for (r = 0, s = a.length; r < s; r++)
                  if (d(a[r], g)) {
                    m = !1;
                    break;
                  }
              if (m) return e;
              throw Da("insecurl", e.toString());
            }
            if (c === pa.HTML) return f(e);
            throw Da("unsafe");
          },
          valueOf: function (a) {
            return a instanceof g ? a.$$unwrapTrustedValue() : a;
          },
        };
      },
    ];
  }
  function mf() {
    var b = !0;
    this.enabled = function (a) {
      arguments.length && (b = !!a);
      return b;
    };
    this.$get = [
      "$parse",
      "$sceDelegate",
      function (a, c) {
        if (b && 8 > Ua) throw Da("iequirks");
        var d = ia(pa);
        d.isEnabled = function () {
          return b;
        };
        d.trustAs = c.trustAs;
        d.getTrusted = c.getTrusted;
        d.valueOf = c.valueOf;
        b ||
          ((d.trustAs = d.getTrusted =
            function (a, b) {
              return b;
            }),
          (d.valueOf = Ya));
        d.parseAs = function (b, c) {
          var e = a(c);
          return e.literal && e.constant
            ? e
            : a(c, function (a) {
                return d.getTrusted(b, a);
              });
        };
        var e = d.parseAs,
          f = d.getTrusted,
          g = d.trustAs;
        m(pa, function (a, b) {
          var c = M(b);
          d[hb("parse_as_" + c)] = function (b) {
            return e(a, b);
          };
          d[hb("get_trusted_" + c)] = function (b) {
            return f(a, b);
          };
          d[hb("trust_as_" + c)] = function (b) {
            return g(a, b);
          };
        });
        return d;
      },
    ];
  }
  function of() {
    this.$get = [
      "$window",
      "$document",
      function (b, a) {
        var c = {},
          d = W(
            (/android (\d+)/.exec(M((b.navigator || {}).userAgent)) || [])[1]
          ),
          e = /Boxee/i.test((b.navigator || {}).userAgent),
          f = a[0] || {},
          g,
          h = /^(Moz|webkit|ms)(?=[A-Z])/,
          l = f.body && f.body.style,
          k = !1,
          n = !1;
        if (l) {
          for (var r in l)
            if ((k = h.exec(r))) {
              g = k[0];
              g = g.substr(0, 1).toUpperCase() + g.substr(1);
              break;
            }
          g || (g = "WebkitOpacity" in l && "webkit");
          k = !!("transition" in l || g + "Transition" in l);
          n = !!("animation" in l || g + "Animation" in l);
          !d ||
            (k && n) ||
            ((k = L(l.webkitTransition)), (n = L(l.webkitAnimation)));
        }
        return {
          history: !(!b.history || !b.history.pushState || 4 > d || e),
          hasEvent: function (a) {
            if ("input" === a && 11 >= Ua) return !1;
            if (A(c[a])) {
              var b = f.createElement("div");
              c[a] = "on" + a in b;
            }
            return c[a];
          },
          csp: fb(),
          vendorPrefix: g,
          transitions: k,
          animations: n,
          android: d,
        };
      },
    ];
  }
  function qf() {
    this.$get = [
      "$templateCache",
      "$http",
      "$q",
      "$sce",
      function (b, a, c, d) {
        function e(f, g) {
          e.totalPendingRequests++;
          (L(f) && b.get(f)) || (f = d.getTrustedResourceUrl(f));
          var h = a.defaults && a.defaults.transformResponse;
          G(h)
            ? (h = h.filter(function (a) {
                return a !== $b;
              }))
            : h === $b && (h = null);
          return a
            .get(f, { cache: b, transformResponse: h })
            ["finally"](function () {
              e.totalPendingRequests--;
            })
            .then(
              function (a) {
                b.put(f, a.data);
                return a.data;
              },
              function (a) {
                if (!g) throw ea("tpload", f, a.status, a.statusText);
                return c.reject(a);
              }
            );
        }
        e.totalPendingRequests = 0;
        return e;
      },
    ];
  }
  function rf() {
    this.$get = [
      "$rootScope",
      "$browser",
      "$location",
      function (b, a, c) {
        return {
          findBindings: function (a, b, c) {
            a = a.getElementsByClassName("ng-binding");
            var g = [];
            m(a, function (a) {
              var d = ca.element(a).data("$binding");
              d &&
                m(d, function (d) {
                  c
                    ? new RegExp("(^|\\s)" + ud(b) + "(\\s|\\||$)").test(d) &&
                      g.push(a)
                    : -1 != d.indexOf(b) && g.push(a);
                });
            });
            return g;
          },
          findModels: function (a, b, c) {
            for (
              var g = ["ng-", "data-ng-", "ng\\:"], h = 0;
              h < g.length;
              ++h
            ) {
              var l = a.querySelectorAll(
                "[" + g[h] + "model" + (c ? "=" : "*=") + '"' + b + '"]'
              );
              if (l.length) return l;
            }
          },
          getLocation: function () {
            return c.url();
          },
          setLocation: function (a) {
            a !== c.url() && (c.url(a), b.$digest());
          },
          whenStable: function (b) {
            a.notifyWhenNoOutstandingRequests(b);
          },
        };
      },
    ];
  }
  function sf() {
    this.$get = [
      "$rootScope",
      "$browser",
      "$q",
      "$$q",
      "$exceptionHandler",
      function (b, a, c, d, e) {
        function f(f, l, k) {
          z(f) || ((k = l), (l = f), (f = v));
          var n = za.call(arguments, 3),
            r = w(k) && !k,
            s = (r ? d : c).defer(),
            m = s.promise,
            q;
          q = a.defer(function () {
            try {
              s.resolve(f.apply(null, n));
            } catch (a) {
              s.reject(a), e(a);
            } finally {
              delete g[m.$$timeoutId];
            }
            r || b.$apply();
          }, l);
          m.$$timeoutId = q;
          g[q] = s;
          return m;
        }
        var g = {};
        f.cancel = function (b) {
          return b && b.$$timeoutId in g
            ? (g[b.$$timeoutId].reject("canceled"),
              delete g[b.$$timeoutId],
              a.defer.cancel(b.$$timeoutId))
            : !1;
        };
        return f;
      },
    ];
  }
  function Ba(b) {
    Ua && (X.setAttribute("href", b), (b = X.href));
    X.setAttribute("href", b);
    return {
      href: X.href,
      protocol: X.protocol ? X.protocol.replace(/:$/, "") : "",
      host: X.host,
      search: X.search ? X.search.replace(/^\?/, "") : "",
      hash: X.hash ? X.hash.replace(/^#/, "") : "",
      hostname: X.hostname,
      port: X.port,
      pathname: "/" === X.pathname.charAt(0) ? X.pathname : "/" + X.pathname,
    };
  }
  function gd(b) {
    b = L(b) ? Ba(b) : b;
    return b.protocol === wd.protocol && b.host === wd.host;
  }
  function tf() {
    this.$get = ra(O);
  }
  function xd(b) {
    function a(a) {
      try {
        return decodeURIComponent(a);
      } catch (b) {
        return a;
      }
    }
    var c = b[0] || {},
      d = {},
      e = "";
    return function () {
      var b, g, h, l, k;
      b = c.cookie || "";
      if (b !== e)
        for (e = b, b = e.split("; "), d = {}, h = 0; h < b.length; h++)
          (g = b[h]),
            (l = g.indexOf("=")),
            0 < l &&
              ((k = a(g.substring(0, l))),
              d[k] === t && (d[k] = a(g.substring(l + 1))));
      return d;
    };
  }
  function xf() {
    this.$get = xd;
  }
  function Lc(b) {
    function a(c, d) {
      if (H(c)) {
        var e = {};
        m(c, function (b, c) {
          e[c] = a(c, b);
        });
        return e;
      }
      return b.factory(c + "Filter", d);
    }
    this.register = a;
    this.$get = [
      "$injector",
      function (a) {
        return function (b) {
          return a.get(b + "Filter");
        };
      },
    ];
    a("currency", yd);
    a("date", zd);
    a("filter", $f);
    a("json", ag);
    a("limitTo", bg);
    a("lowercase", cg);
    a("number", Ad);
    a("orderBy", Bd);
    a("uppercase", dg);
  }
  function $f() {
    return function (b, a, c) {
      if (!Ea(b)) {
        if (null == b) return b;
        throw J("filter")("notarray", b);
      }
      var d;
      switch (ic(a)) {
        case "function":
          break;
        case "boolean":
        case "null":
        case "number":
        case "string":
          d = !0;
        case "object":
          a = eg(a, c, d);
          break;
        default:
          return b;
      }
      return Array.prototype.filter.call(b, a);
    };
  }
  function eg(b, a, c) {
    var d = H(b) && "$" in b;
    !0 === a
      ? (a = ka)
      : z(a) ||
        (a = function (a, b) {
          if (A(a)) return !1;
          if (null === a || null === b) return a === b;
          if (H(b) || (H(a) && !rc(a))) return !1;
          a = M("" + a);
          b = M("" + b);
          return -1 !== a.indexOf(b);
        });
    return function (e) {
      return d && !H(e) ? La(e, b.$, a, !1) : La(e, b, a, c);
    };
  }
  function La(b, a, c, d, e) {
    var f = ic(b),
      g = ic(a);
    if ("string" === g && "!" === a.charAt(0))
      return !La(b, a.substring(1), c, d);
    if (G(b))
      return b.some(function (b) {
        return La(b, a, c, d);
      });
    switch (f) {
      case "object":
        var h;
        if (d) {
          for (h in b) if ("$" !== h.charAt(0) && La(b[h], a, c, !0)) return !0;
          return e ? !1 : La(b, a, c, !1);
        }
        if ("object" === g) {
          for (h in a)
            if (
              ((e = a[h]),
              !z(e) &&
                !A(e) &&
                ((f = "$" === h), !La(f ? b : b[h], e, c, f, f)))
            )
              return !1;
          return !0;
        }
        return c(b, a);
      case "function":
        return !1;
      default:
        return c(b, a);
    }
  }
  function ic(b) {
    return null === b ? "null" : typeof b;
  }
  function yd(b) {
    var a = b.NUMBER_FORMATS;
    return function (b, d, e) {
      A(d) && (d = a.CURRENCY_SYM);
      A(e) && (e = a.PATTERNS[1].maxFrac);
      return null == b
        ? b
        : Cd(b, a.PATTERNS[1], a.GROUP_SEP, a.DECIMAL_SEP, e).replace(
            /\u00A4/g,
            d
          );
    };
  }
  function Ad(b) {
    var a = b.NUMBER_FORMATS;
    return function (b, d) {
      return null == b
        ? b
        : Cd(b, a.PATTERNS[0], a.GROUP_SEP, a.DECIMAL_SEP, d);
    };
  }
  function Cd(b, a, c, d, e) {
    if (H(b)) return "";
    var f = 0 > b;
    b = Math.abs(b);
    var g = Infinity === b;
    if (!g && !isFinite(b)) return "";
    var h = b + "",
      l = "",
      k = !1,
      n = [];
    g && (l = "\u221e");
    if (!g && -1 !== h.indexOf("e")) {
      var r = h.match(/([\d\.]+)e(-?)(\d+)/);
      r && "-" == r[2] && r[3] > e + 1 ? (b = 0) : ((l = h), (k = !0));
    }
    if (g || k) 0 < e && 1 > b && ((l = b.toFixed(e)), (b = parseFloat(l)));
    else {
      g = (h.split(Dd)[1] || "").length;
      A(e) && (e = Math.min(Math.max(a.minFrac, g), a.maxFrac));
      b = +(Math.round(+(b.toString() + "e" + e)).toString() + "e" + -e);
      var g = ("" + b).split(Dd),
        h = g[0],
        g = g[1] || "",
        r = 0,
        s = a.lgSize,
        m = a.gSize;
      if (h.length >= s + m)
        for (r = h.length - s, k = 0; k < r; k++)
          0 === (r - k) % m && 0 !== k && (l += c), (l += h.charAt(k));
      for (k = r; k < h.length; k++)
        0 === (h.length - k) % s && 0 !== k && (l += c), (l += h.charAt(k));
      for (; g.length < e; ) g += "0";
      e && "0" !== e && (l += d + g.substr(0, e));
    }
    0 === b && (f = !1);
    n.push(f ? a.negPre : a.posPre, l, f ? a.negSuf : a.posSuf);
    return n.join("");
  }
  function Gb(b, a, c) {
    var d = "";
    0 > b && ((d = "-"), (b = -b));
    for (b = "" + b; b.length < a; ) b = "0" + b;
    c && (b = b.substr(b.length - a));
    return d + b;
  }
  function Y(b, a, c, d) {
    c = c || 0;
    return function (e) {
      e = e["get" + b]();
      if (0 < c || e > -c) e += c;
      0 === e && -12 == c && (e = 12);
      return Gb(e, a, d);
    };
  }
  function Hb(b, a) {
    return function (c, d) {
      var e = c["get" + b](),
        f = rb(a ? "SHORT" + b : b);
      return d[f][e];
    };
  }
  function Ed(b) {
    var a = new Date(b, 0, 1).getDay();
    return new Date(b, 0, (4 >= a ? 5 : 12) - a);
  }
  function Fd(b) {
    return function (a) {
      var c = Ed(a.getFullYear());
      a =
        +new Date(
          a.getFullYear(),
          a.getMonth(),
          a.getDate() + (4 - a.getDay())
        ) - +c;
      a = 1 + Math.round(a / 6048e5);
      return Gb(a, b);
    };
  }
  function jc(b, a) {
    return 0 >= b.getFullYear() ? a.ERAS[0] : a.ERAS[1];
  }
  function zd(b) {
    function a(a) {
      var b;
      if ((b = a.match(c))) {
        a = new Date(0);
        var f = 0,
          g = 0,
          h = b[8] ? a.setUTCFullYear : a.setFullYear,
          l = b[8] ? a.setUTCHours : a.setHours;
        b[9] && ((f = W(b[9] + b[10])), (g = W(b[9] + b[11])));
        h.call(a, W(b[1]), W(b[2]) - 1, W(b[3]));
        f = W(b[4] || 0) - f;
        g = W(b[5] || 0) - g;
        h = W(b[6] || 0);
        b = Math.round(1e3 * parseFloat("0." + (b[7] || 0)));
        l.call(a, f, g, h, b);
      }
      return a;
    }
    var c =
      /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
    return function (c, e, f) {
      var g = "",
        h = [],
        l,
        k;
      e = e || "mediumDate";
      e = b.DATETIME_FORMATS[e] || e;
      L(c) && (c = fg.test(c) ? W(c) : a(c));
      V(c) && (c = new Date(c));
      if (!aa(c) || !isFinite(c.getTime())) return c;
      for (; e; )
        (k = gg.exec(e))
          ? ((h = cb(h, k, 1)), (e = h.pop()))
          : (h.push(e), (e = null));
      var n = c.getTimezoneOffset();
      f && ((n = xc(f, c.getTimezoneOffset())), (c = Pb(c, f, !0)));
      m(h, function (a) {
        l = hg[a];
        g += l
          ? l(c, b.DATETIME_FORMATS, n)
          : a.replace(/(^'|'$)/g, "").replace(/''/g, "'");
      });
      return g;
    };
  }
  function ag() {
    return function (b, a) {
      A(a) && (a = 2);
      return db(b, a);
    };
  }
  function bg() {
    return function (b, a, c) {
      a = Infinity === Math.abs(Number(a)) ? Number(a) : W(a);
      if (isNaN(a)) return b;
      V(b) && (b = b.toString());
      if (!G(b) && !L(b)) return b;
      c = !c || isNaN(c) ? 0 : W(c);
      c = 0 > c && c >= -b.length ? b.length + c : c;
      return 0 <= a
        ? b.slice(c, c + a)
        : 0 === c
        ? b.slice(a, b.length)
        : b.slice(Math.max(0, c + a), c);
    };
  }
  function Bd(b) {
    function a(a, c) {
      c = c ? -1 : 1;
      return a.map(function (a) {
        var d = 1,
          h = Ya;
        if (z(a)) h = a;
        else if (L(a)) {
          if ("+" == a.charAt(0) || "-" == a.charAt(0))
            (d = "-" == a.charAt(0) ? -1 : 1), (a = a.substring(1));
          if ("" !== a && ((h = b(a)), h.constant))
            var l = h(),
              h = function (a) {
                return a[l];
              };
        }
        return { get: h, descending: d * c };
      });
    }
    function c(a) {
      switch (typeof a) {
        case "number":
        case "boolean":
        case "string":
          return !0;
        default:
          return !1;
      }
    }
    return function (b, e, f) {
      if (!Ea(b)) return b;
      G(e) || (e = [e]);
      0 === e.length && (e = ["+"]);
      var g = a(e, f);
      b = Array.prototype.map.call(b, function (a, b) {
        return {
          value: a,
          predicateValues: g.map(function (d) {
            var e = d.get(a);
            d = typeof e;
            if (null === e) (d = "string"), (e = "null");
            else if ("string" === d) e = e.toLowerCase();
            else if ("object" === d)
              a: {
                if (
                  "function" === typeof e.valueOf &&
                  ((e = e.valueOf()), c(e))
                )
                  break a;
                if (rc(e) && ((e = e.toString()), c(e))) break a;
                e = b;
              }
            return { value: e, type: d };
          }),
        };
      });
      b.sort(function (a, b) {
        for (var c = 0, d = 0, e = g.length; d < e; ++d) {
          var c = a.predicateValues[d],
            f = b.predicateValues[d],
            m = 0;
          c.type === f.type
            ? c.value !== f.value && (m = c.value < f.value ? -1 : 1)
            : (m = c.type < f.type ? -1 : 1);
          if ((c = m * g[d].descending)) break;
        }
        return c;
      });
      return (b = b.map(function (a) {
        return a.value;
      }));
    };
  }
  function Ma(b) {
    z(b) && (b = { link: b });
    b.restrict = b.restrict || "AC";
    return ra(b);
  }
  function Gd(b, a, c, d, e) {
    var f = this,
      g = [],
      h = (f.$$parentForm = b.parent().controller("form") || Ib);
    f.$error = {};
    f.$$success = {};
    f.$pending = t;
    f.$name = e(a.name || a.ngForm || "")(c);
    f.$dirty = !1;
    f.$pristine = !0;
    f.$valid = !0;
    f.$invalid = !1;
    f.$submitted = !1;
    h.$addControl(f);
    f.$rollbackViewValue = function () {
      m(g, function (a) {
        a.$rollbackViewValue();
      });
    };
    f.$commitViewValue = function () {
      m(g, function (a) {
        a.$commitViewValue();
      });
    };
    f.$addControl = function (a) {
      Ra(a.$name, "input");
      g.push(a);
      a.$name && (f[a.$name] = a);
    };
    f.$$renameControl = function (a, b) {
      var c = a.$name;
      f[c] === a && delete f[c];
      f[b] = a;
      a.$name = b;
    };
    f.$removeControl = function (a) {
      a.$name && f[a.$name] === a && delete f[a.$name];
      m(f.$pending, function (b, c) {
        f.$setValidity(c, null, a);
      });
      m(f.$error, function (b, c) {
        f.$setValidity(c, null, a);
      });
      m(f.$$success, function (b, c) {
        f.$setValidity(c, null, a);
      });
      bb(g, a);
    };
    Hd({
      ctrl: this,
      $element: b,
      set: function (a, b, c) {
        var d = a[b];
        d ? -1 === d.indexOf(c) && d.push(c) : (a[b] = [c]);
      },
      unset: function (a, b, c) {
        var d = a[b];
        d && (bb(d, c), 0 === d.length && delete a[b]);
      },
      parentForm: h,
      $animate: d,
    });
    f.$setDirty = function () {
      d.removeClass(b, Va);
      d.addClass(b, Jb);
      f.$dirty = !0;
      f.$pristine = !1;
      h.$setDirty();
    };
    f.$setPristine = function () {
      d.setClass(b, Va, Jb + " ng-submitted");
      f.$dirty = !1;
      f.$pristine = !0;
      f.$submitted = !1;
      m(g, function (a) {
        a.$setPristine();
      });
    };
    f.$setUntouched = function () {
      m(g, function (a) {
        a.$setUntouched();
      });
    };
    f.$setSubmitted = function () {
      d.addClass(b, "ng-submitted");
      f.$submitted = !0;
      h.$setSubmitted();
    };
  }
  function kc(b) {
    b.$formatters.push(function (a) {
      return b.$isEmpty(a) ? a : a.toString();
    });
  }
  function kb(b, a, c, d, e, f) {
    var g = M(a[0].type);
    if (!e.android) {
      var h = !1;
      a.on("compositionstart", function (a) {
        h = !0;
      });
      a.on("compositionend", function () {
        h = !1;
        l();
      });
    }
    var l = function (b) {
      k && (f.defer.cancel(k), (k = null));
      if (!h) {
        var e = a.val();
        b = b && b.type;
        "password" === g || (c.ngTrim && "false" === c.ngTrim) || (e = R(e));
        (d.$viewValue !== e || ("" === e && d.$$hasNativeValidators)) &&
          d.$setViewValue(e, b);
      }
    };
    if (e.hasEvent("input")) a.on("input", l);
    else {
      var k,
        n = function (a, b, c) {
          k ||
            (k = f.defer(function () {
              k = null;
              (b && b.value === c) || l(a);
            }));
        };
      a.on("keydown", function (a) {
        var b = a.keyCode;
        91 === b ||
          (15 < b && 19 > b) ||
          (37 <= b && 40 >= b) ||
          n(a, this, this.value);
      });
      if (e.hasEvent("paste")) a.on("paste cut", n);
    }
    a.on("change", l);
    d.$render = function () {
      a.val(d.$isEmpty(d.$viewValue) ? "" : d.$viewValue);
    };
  }
  function Kb(b, a) {
    return function (c, d) {
      var e, f;
      if (aa(c)) return c;
      if (L(c)) {
        '"' == c.charAt(0) &&
          '"' == c.charAt(c.length - 1) &&
          (c = c.substring(1, c.length - 1));
        if (ig.test(c)) return new Date(c);
        b.lastIndex = 0;
        if ((e = b.exec(c)))
          return (
            e.shift(),
            (f = d
              ? {
                  yyyy: d.getFullYear(),
                  MM: d.getMonth() + 1,
                  dd: d.getDate(),
                  HH: d.getHours(),
                  mm: d.getMinutes(),
                  ss: d.getSeconds(),
                  sss: d.getMilliseconds() / 1e3,
                }
              : { yyyy: 1970, MM: 1, dd: 1, HH: 0, mm: 0, ss: 0, sss: 0 }),
            m(e, function (b, c) {
              c < a.length && (f[a[c]] = +b);
            }),
            new Date(
              f.yyyy,
              f.MM - 1,
              f.dd,
              f.HH,
              f.mm,
              f.ss || 0,
              1e3 * f.sss || 0
            )
          );
      }
      return NaN;
    };
  }
  function lb(b, a, c, d) {
    return function (e, f, g, h, l, k, n) {
      function r(a) {
        return a && !(a.getTime && a.getTime() !== a.getTime());
      }
      function s(a) {
        return w(a) ? (aa(a) ? a : c(a)) : t;
      }
      Id(e, f, g, h);
      kb(e, f, g, h, l, k);
      var m = h && h.$options && h.$options.timezone,
        q;
      h.$$parserName = b;
      h.$parsers.push(function (b) {
        return h.$isEmpty(b)
          ? null
          : a.test(b)
          ? ((b = c(b, q)), m && (b = Pb(b, m)), b)
          : t;
      });
      h.$formatters.push(function (a) {
        if (a && !aa(a)) throw Lb("datefmt", a);
        if (r(a)) return (q = a) && m && (q = Pb(q, m, !0)), n("date")(a, d, m);
        q = null;
        return "";
      });
      if (w(g.min) || g.ngMin) {
        var F;
        h.$validators.min = function (a) {
          return !r(a) || A(F) || c(a) >= F;
        };
        g.$observe("min", function (a) {
          F = s(a);
          h.$validate();
        });
      }
      if (w(g.max) || g.ngMax) {
        var u;
        h.$validators.max = function (a) {
          return !r(a) || A(u) || c(a) <= u;
        };
        g.$observe("max", function (a) {
          u = s(a);
          h.$validate();
        });
      }
    };
  }
  function Id(b, a, c, d) {
    (d.$$hasNativeValidators = H(a[0].validity)) &&
      d.$parsers.push(function (b) {
        var c = a.prop("validity") || {};
        return c.badInput && !c.typeMismatch ? t : b;
      });
  }
  function Jd(b, a, c, d, e) {
    if (w(d)) {
      b = b(d);
      if (!b.constant) throw J("ngModel")("constexpr", c, d);
      return b(a);
    }
    return e;
  }
  function lc(b, a) {
    b = "ngClass" + b;
    return [
      "$animate",
      function (c) {
        function d(a, b) {
          var c = [],
            d = 0;
          a: for (; d < a.length; d++) {
            for (var e = a[d], n = 0; n < b.length; n++)
              if (e == b[n]) continue a;
            c.push(e);
          }
          return c;
        }
        function e(a) {
          var b = [];
          return G(a)
            ? (m(a, function (a) {
                b = b.concat(e(a));
              }),
              b)
            : L(a)
            ? a.split(" ")
            : H(a)
            ? (m(a, function (a, c) {
                a && (b = b.concat(c.split(" ")));
              }),
              b)
            : a;
        }
        return {
          restrict: "AC",
          link: function (f, g, h) {
            function l(a, b) {
              var c = g.data("$classCounts") || ga(),
                d = [];
              m(a, function (a) {
                if (0 < b || c[a])
                  (c[a] = (c[a] || 0) + b), c[a] === +(0 < b) && d.push(a);
              });
              g.data("$classCounts", c);
              return d.join(" ");
            }
            function k(b) {
              if (!0 === a || f.$index % 2 === a) {
                var k = e(b || []);
                if (!n) {
                  var m = l(k, 1);
                  h.$addClass(m);
                } else if (!ka(b, n)) {
                  var q = e(n),
                    m = d(k, q),
                    k = d(q, k),
                    m = l(m, 1),
                    k = l(k, -1);
                  m && m.length && c.addClass(g, m);
                  k && k.length && c.removeClass(g, k);
                }
              }
              n = ia(b);
            }
            var n;
            f.$watch(h[b], k, !0);
            h.$observe("class", function (a) {
              k(f.$eval(h[b]));
            });
            "ngClass" !== b &&
              f.$watch("$index", function (c, d) {
                var g = c & 1;
                if (g !== (d & 1)) {
                  var k = e(f.$eval(h[b]));
                  g === a
                    ? ((g = l(k, 1)), h.$addClass(g))
                    : ((g = l(k, -1)), h.$removeClass(g));
                }
              });
          },
        };
      },
    ];
  }
  function Hd(b) {
    function a(a, b) {
      b && !f[a]
        ? (k.addClass(e, a), (f[a] = !0))
        : !b && f[a] && (k.removeClass(e, a), (f[a] = !1));
    }
    function c(b, c) {
      b = b ? "-" + Bc(b, "-") : "";
      a(mb + b, !0 === c);
      a(Kd + b, !1 === c);
    }
    var d = b.ctrl,
      e = b.$element,
      f = {},
      g = b.set,
      h = b.unset,
      l = b.parentForm,
      k = b.$animate;
    f[Kd] = !(f[mb] = e.hasClass(mb));
    d.$setValidity = function (b, e, f) {
      e === t
        ? (d.$pending || (d.$pending = {}), g(d.$pending, b, f))
        : (d.$pending && h(d.$pending, b, f),
          Ld(d.$pending) && (d.$pending = t));
      ab(e)
        ? e
          ? (h(d.$error, b, f), g(d.$$success, b, f))
          : (g(d.$error, b, f), h(d.$$success, b, f))
        : (h(d.$error, b, f), h(d.$$success, b, f));
      d.$pending
        ? (a(Md, !0), (d.$valid = d.$invalid = t), c("", null))
        : (a(Md, !1),
          (d.$valid = Ld(d.$error)),
          (d.$invalid = !d.$valid),
          c("", d.$valid));
      e =
        d.$pending && d.$pending[b]
          ? t
          : d.$error[b]
          ? !1
          : d.$$success[b]
          ? !0
          : null;
      c(b, e);
      l.$setValidity(b, e, d);
    };
  }
  function Ld(b) {
    if (b) for (var a in b) if (b.hasOwnProperty(a)) return !1;
    return !0;
  }
  var jg = /^\/(.+)\/([a-z]*)$/,
    M = function (b) {
      return L(b) ? b.toLowerCase() : b;
    },
    Xa = Object.prototype.hasOwnProperty,
    rb = function (b) {
      return L(b) ? b.toUpperCase() : b;
    },
    Ua,
    y,
    la,
    za = [].slice,
    Mf = [].splice,
    kg = [].push,
    sa = Object.prototype.toString,
    sc = Object.getPrototypeOf,
    Fa = J("ng"),
    ca = O.angular || (O.angular = {}),
    gb,
    nb = 0;
  Ua = U.documentMode;
  v.$inject = [];
  Ya.$inject = [];
  var G = Array.isArray,
    uc =
      /^\[object (Uint8(Clamped)?)|(Uint16)|(Uint32)|(Int8)|(Int16)|(Int32)|(Float(32)|(64))Array\]$/,
    R = function (b) {
      return L(b) ? b.trim() : b;
    },
    ud = function (b) {
      return b
        .replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1")
        .replace(/\x08/g, "\\x08");
    },
    fb = function () {
      if (w(fb.isActive_)) return fb.isActive_;
      var b = !(
        !U.querySelector("[ng-csp]") && !U.querySelector("[data-ng-csp]")
      );
      if (!b)
        try {
          new Function("");
        } catch (a) {
          b = !0;
        }
      return (fb.isActive_ = b);
    },
    pb = function () {
      if (w(pb.name_)) return pb.name_;
      var b,
        a,
        c = Oa.length,
        d,
        e;
      for (a = 0; a < c; ++a)
        if (
          ((d = Oa[a]),
          (b = U.querySelector("[" + d.replace(":", "\\:") + "jq]")))
        ) {
          e = b.getAttribute(d + "jq");
          break;
        }
      return (pb.name_ = e);
    },
    Oa = ["ng-", "data-ng-", "ng:", "x-ng-"],
    be = /[A-Z]/g,
    Cc = !1,
    Rb,
    qa = 1,
    Na = 3,
    fe = {
      full: "1.4.3",
      major: 1,
      minor: 4,
      dot: 3,
      codeName: "foam-acceleration",
    };
  Q.expando = "ng339";
  var ib = (Q.cache = {}),
    Df = 1;
  Q._data = function (b) {
    return this.cache[b[this.expando]] || {};
  };
  var yf = /([\:\-\_]+(.))/g,
    zf = /^moz([A-Z])/,
    lg = { mouseleave: "mouseout", mouseenter: "mouseover" },
    Ub = J("jqLite"),
    Cf = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    Tb = /<|&#?\w+;/,
    Af = /<([\w:]+)/,
    Bf =
      /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
    na = {
      option: [1, '<select multiple="multiple">', "</select>"],
      thead: [1, "<table>", "</table>"],
      col: [2, "<table><colgroup>", "</colgroup></table>"],
      tr: [2, "<table><tbody>", "</tbody></table>"],
      td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
      _default: [0, "", ""],
    };
  na.optgroup = na.option;
  na.tbody = na.tfoot = na.colgroup = na.caption = na.thead;
  na.th = na.td;
  var Pa = (Q.prototype = {
      ready: function (b) {
        function a() {
          c || ((c = !0), b());
        }
        var c = !1;
        "complete" === U.readyState
          ? setTimeout(a)
          : (this.on("DOMContentLoaded", a), Q(O).on("load", a));
      },
      toString: function () {
        var b = [];
        m(this, function (a) {
          b.push("" + a);
        });
        return "[" + b.join(", ") + "]";
      },
      eq: function (b) {
        return 0 <= b ? y(this[b]) : y(this[this.length + b]);
      },
      length: 0,
      push: kg,
      sort: [].sort,
      splice: [].splice,
    }),
    Ab = {};
  m(
    "multiple selected checked disabled readOnly required open".split(" "),
    function (b) {
      Ab[M(b)] = b;
    }
  );
  var Tc = {};
  m(
    "input select option textarea button form details".split(" "),
    function (b) {
      Tc[b] = !0;
    }
  );
  var Uc = {
    ngMinlength: "minlength",
    ngMaxlength: "maxlength",
    ngMin: "min",
    ngMax: "max",
    ngPattern: "pattern",
  };
  m(
    {
      data: Wb,
      removeData: ub,
      hasData: function (b) {
        for (var a in ib[b.ng339]) return !0;
        return !1;
      },
    },
    function (b, a) {
      Q[a] = b;
    }
  );
  m(
    {
      data: Wb,
      inheritedData: zb,
      scope: function (b) {
        return (
          y.data(b, "$scope") ||
          zb(b.parentNode || b, ["$isolateScope", "$scope"])
        );
      },
      isolateScope: function (b) {
        return (
          y.data(b, "$isolateScope") || y.data(b, "$isolateScopeNoTemplate")
        );
      },
      controller: Qc,
      injector: function (b) {
        return zb(b, "$injector");
      },
      removeAttr: function (b, a) {
        b.removeAttribute(a);
      },
      hasClass: wb,
      css: function (b, a, c) {
        a = hb(a);
        if (w(c)) b.style[a] = c;
        else return b.style[a];
      },
      attr: function (b, a, c) {
        var d = b.nodeType;
        if (d !== Na && 2 !== d && 8 !== d)
          if (((d = M(a)), Ab[d]))
            if (w(c))
              c
                ? ((b[a] = !0), b.setAttribute(a, d))
                : ((b[a] = !1), b.removeAttribute(d));
            else
              return b[a] || (b.attributes.getNamedItem(a) || v).specified
                ? d
                : t;
          else if (w(c)) b.setAttribute(a, c);
          else if (b.getAttribute)
            return (b = b.getAttribute(a, 2)), null === b ? t : b;
      },
      prop: function (b, a, c) {
        if (w(c)) b[a] = c;
        else return b[a];
      },
      text: (function () {
        function b(a, b) {
          if (A(b)) {
            var d = a.nodeType;
            return d === qa || d === Na ? a.textContent : "";
          }
          a.textContent = b;
        }
        b.$dv = "";
        return b;
      })(),
      val: function (b, a) {
        if (A(a)) {
          if (b.multiple && "select" === ta(b)) {
            var c = [];
            m(b.options, function (a) {
              a.selected && c.push(a.value || a.text);
            });
            return 0 === c.length ? null : c;
          }
          return b.value;
        }
        b.value = a;
      },
      html: function (b, a) {
        if (A(a)) return b.innerHTML;
        tb(b, !0);
        b.innerHTML = a;
      },
      empty: Rc,
    },
    function (b, a) {
      Q.prototype[a] = function (a, d) {
        var e,
          f,
          g = this.length;
        if (b !== Rc && (2 == b.length && b !== wb && b !== Qc ? a : d) === t) {
          if (H(a)) {
            for (e = 0; e < g; e++)
              if (b === Wb) b(this[e], a);
              else for (f in a) b(this[e], f, a[f]);
            return this;
          }
          e = b.$dv;
          g = e === t ? Math.min(g, 1) : g;
          for (f = 0; f < g; f++) {
            var h = b(this[f], a, d);
            e = e ? e + h : h;
          }
          return e;
        }
        for (e = 0; e < g; e++) b(this[e], a, d);
        return this;
      };
    }
  );
  m(
    {
      removeData: ub,
      on: function a(c, d, e, f) {
        if (w(f)) throw Ub("onargs");
        if (Mc(c)) {
          var g = vb(c, !0);
          f = g.events;
          var h = g.handle;
          h || (h = g.handle = Gf(c, f));
          for (
            var g = 0 <= d.indexOf(" ") ? d.split(" ") : [d], l = g.length;
            l--;

          ) {
            d = g[l];
            var k = f[d];
            k ||
              ((f[d] = []),
              "mouseenter" === d || "mouseleave" === d
                ? a(c, lg[d], function (a) {
                    var c = a.relatedTarget;
                    (c && (c === this || this.contains(c))) || h(a, d);
                  })
                : "$destroy" !== d && c.addEventListener(d, h, !1),
              (k = f[d]));
            k.push(e);
          }
        }
      },
      off: Pc,
      one: function (a, c, d) {
        a = y(a);
        a.on(c, function f() {
          a.off(c, d);
          a.off(c, f);
        });
        a.on(c, d);
      },
      replaceWith: function (a, c) {
        var d,
          e = a.parentNode;
        tb(a);
        m(new Q(c), function (c) {
          d ? e.insertBefore(c, d.nextSibling) : e.replaceChild(c, a);
          d = c;
        });
      },
      children: function (a) {
        var c = [];
        m(a.childNodes, function (a) {
          a.nodeType === qa && c.push(a);
        });
        return c;
      },
      contents: function (a) {
        return a.contentDocument || a.childNodes || [];
      },
      append: function (a, c) {
        var d = a.nodeType;
        if (d === qa || 11 === d) {
          c = new Q(c);
          for (var d = 0, e = c.length; d < e; d++) a.appendChild(c[d]);
        }
      },
      prepend: function (a, c) {
        if (a.nodeType === qa) {
          var d = a.firstChild;
          m(new Q(c), function (c) {
            a.insertBefore(c, d);
          });
        }
      },
      wrap: function (a, c) {
        c = y(c).eq(0).clone()[0];
        var d = a.parentNode;
        d && d.replaceChild(c, a);
        c.appendChild(a);
      },
      remove: Xb,
      detach: function (a) {
        Xb(a, !0);
      },
      after: function (a, c) {
        var d = a,
          e = a.parentNode;
        c = new Q(c);
        for (var f = 0, g = c.length; f < g; f++) {
          var h = c[f];
          e.insertBefore(h, d.nextSibling);
          d = h;
        }
      },
      addClass: yb,
      removeClass: xb,
      toggleClass: function (a, c, d) {
        c &&
          m(c.split(" "), function (c) {
            var f = d;
            A(f) && (f = !wb(a, c));
            (f ? yb : xb)(a, c);
          });
      },
      parent: function (a) {
        return (a = a.parentNode) && 11 !== a.nodeType ? a : null;
      },
      next: function (a) {
        return a.nextElementSibling;
      },
      find: function (a, c) {
        return a.getElementsByTagName ? a.getElementsByTagName(c) : [];
      },
      clone: Vb,
      triggerHandler: function (a, c, d) {
        var e,
          f,
          g = c.type || c,
          h = vb(a);
        if ((h = (h = h && h.events) && h[g]))
          (e = {
            preventDefault: function () {
              this.defaultPrevented = !0;
            },
            isDefaultPrevented: function () {
              return !0 === this.defaultPrevented;
            },
            stopImmediatePropagation: function () {
              this.immediatePropagationStopped = !0;
            },
            isImmediatePropagationStopped: function () {
              return !0 === this.immediatePropagationStopped;
            },
            stopPropagation: v,
            type: g,
            target: a,
          }),
            c.type && (e = P(e, c)),
            (c = ia(h)),
            (f = d ? [e].concat(d) : [e]),
            m(c, function (c) {
              e.isImmediatePropagationStopped() || c.apply(a, f);
            });
      },
    },
    function (a, c) {
      Q.prototype[c] = function (c, e, f) {
        for (var g, h = 0, l = this.length; h < l; h++)
          A(g)
            ? ((g = a(this[h], c, e, f)), w(g) && (g = y(g)))
            : Oc(g, a(this[h], c, e, f));
        return w(g) ? g : this;
      };
      Q.prototype.bind = Q.prototype.on;
      Q.prototype.unbind = Q.prototype.off;
    }
  );
  Sa.prototype = {
    put: function (a, c) {
      this[Ga(a, this.nextUid)] = c;
    },
    get: function (a) {
      return this[Ga(a, this.nextUid)];
    },
    remove: function (a) {
      var c = this[(a = Ga(a, this.nextUid))];
      delete this[a];
      return c;
    },
  };
  var wf = [
      function () {
        this.$get = [
          function () {
            return Sa;
          },
        ];
      },
    ],
    Wc = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
    mg = /,/,
    ng = /^\s*(_?)(\S+?)\1\s*$/,
    Vc = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm,
    Ha = J("$injector");
  eb.$$annotate = function (a, c, d) {
    var e;
    if ("function" === typeof a) {
      if (!(e = a.$inject)) {
        e = [];
        if (a.length) {
          if (c)
            throw ((L(d) && d) || (d = a.name || Hf(a)), Ha("strictdi", d));
          c = a.toString().replace(Vc, "");
          c = c.match(Wc);
          m(c[1].split(mg), function (a) {
            a.replace(ng, function (a, c, d) {
              e.push(d);
            });
          });
        }
        a.$inject = e;
      }
    } else
      G(a)
        ? ((c = a.length - 1), Qa(a[c], "fn"), (e = a.slice(0, c)))
        : Qa(a, "fn", !0);
    return e;
  };
  var Nd = J("$animate"),
    Ue = function () {
      this.$get = [
        "$q",
        "$$rAF",
        function (a, c) {
          function d() {}
          d.all = v;
          d.chain = v;
          d.prototype = {
            end: v,
            cancel: v,
            resume: v,
            pause: v,
            complete: v,
            then: function (d, f) {
              return a(function (a) {
                c(function () {
                  a();
                });
              }).then(d, f);
            },
          };
          return d;
        },
      ];
    },
    Te = function () {
      var a = new Sa(),
        c = [];
      this.$get = [
        "$$AnimateRunner",
        "$rootScope",
        function (d, e) {
          function f(d, f, l) {
            var k = a.get(d);
            k || (a.put(d, (k = {})), c.push(d));
            f &&
              m(f.split(" "), function (a) {
                a && (k[a] = !0);
              });
            l &&
              m(l.split(" "), function (a) {
                a && (k[a] = !1);
              });
            1 < c.length ||
              e.$$postDigest(function () {
                m(c, function (c) {
                  var d = a.get(c);
                  if (d) {
                    var e = If(c.attr("class")),
                      f = "",
                      g = "";
                    m(d, function (a, c) {
                      a !== !!e[c] &&
                        (a
                          ? (f += (f.length ? " " : "") + c)
                          : (g += (g.length ? " " : "") + c));
                    });
                    m(c, function (a) {
                      f && yb(a, f);
                      g && xb(a, g);
                    });
                    a.remove(c);
                  }
                });
                c.length = 0;
              });
          }
          return {
            enabled: v,
            on: v,
            off: v,
            pin: v,
            push: function (a, c, e, k) {
              k && k();
              e = e || {};
              e.from && a.css(e.from);
              e.to && a.css(e.to);
              (e.addClass || e.removeClass) && f(a, e.addClass, e.removeClass);
              return new d();
            },
          };
        },
      ];
    },
    Se = [
      "$provide",
      function (a) {
        var c = this;
        this.$$registeredAnimations = Object.create(null);
        this.register = function (d, e) {
          if (d && "." !== d.charAt(0)) throw Nd("notcsel", d);
          var f = d + "-animation";
          c.$$registeredAnimations[d.substr(1)] = f;
          a.factory(f, e);
        };
        this.classNameFilter = function (a) {
          if (
            1 === arguments.length &&
            (this.$$classNameFilter = a instanceof RegExp ? a : null) &&
            /(\s+|\/)ng-animate(\s+|\/)/.test(this.$$classNameFilter.toString())
          )
            throw Nd("nongcls", "ng-animate");
          return this.$$classNameFilter;
        };
        this.$get = [
          "$$animateQueue",
          function (a) {
            function c(a, d, e) {
              if (e) {
                var l;
                a: {
                  for (l = 0; l < e.length; l++) {
                    var k = e[l];
                    if (1 === k.nodeType) {
                      l = k;
                      break a;
                    }
                  }
                  l = void 0;
                }
                !l || l.parentNode || l.previousElementSibling || (e = null);
              }
              e ? e.after(a) : d.prepend(a);
            }
            return {
              on: a.on,
              off: a.off,
              pin: a.pin,
              enabled: a.enabled,
              cancel: function (a) {
                a.end && a.end();
              },
              enter: function (f, g, h, l) {
                g = g && y(g);
                h = h && y(h);
                g = g || h.parent();
                c(f, g, h);
                return a.push(f, "enter", Ia(l));
              },
              move: function (f, g, h, l) {
                g = g && y(g);
                h = h && y(h);
                g = g || h.parent();
                c(f, g, h);
                return a.push(f, "move", Ia(l));
              },
              leave: function (c, e) {
                return a.push(c, "leave", Ia(e), function () {
                  c.remove();
                });
              },
              addClass: function (c, e, h) {
                h = Ia(h);
                h.addClass = jb(h.addclass, e);
                return a.push(c, "addClass", h);
              },
              removeClass: function (c, e, h) {
                h = Ia(h);
                h.removeClass = jb(h.removeClass, e);
                return a.push(c, "removeClass", h);
              },
              setClass: function (c, e, h, l) {
                l = Ia(l);
                l.addClass = jb(l.addClass, e);
                l.removeClass = jb(l.removeClass, h);
                return a.push(c, "setClass", l);
              },
              animate: function (c, e, h, l, k) {
                k = Ia(k);
                k.from = k.from ? P(k.from, e) : e;
                k.to = k.to ? P(k.to, h) : h;
                k.tempClasses = jb(k.tempClasses, l || "ng-inline-animate");
                return a.push(c, "animate", k);
              },
            };
          },
        ];
      },
    ],
    ea = J("$compile");
  Ec.$inject = ["$provide", "$$sanitizeUriProvider"];
  var Zc = /^((?:x|data)[\:\-_])/i,
    Nf = J("$controller"),
    Xc = /^(\S+)(\s+as\s+(\w+))?$/,
    cd = "application/json",
    ac = { "Content-Type": cd + ";charset=utf-8" },
    Pf = /^\[|^\{(?!\{)/,
    Qf = { "[": /]$/, "{": /}$/ },
    Of = /^\)\]\}',?\n/,
    Ka = (ca.$interpolateMinErr = J("$interpolate"));
  Ka.throwNoconcat = function (a) {
    throw Ka("noconcat", a);
  };
  Ka.interr = function (a, c) {
    return Ka("interr", a, c.toString());
  };
  var og = /^([^\?#]*)(\?([^#]*))?(#(.*))?$/,
    Tf = { http: 80, https: 443, ftp: 21 },
    Cb = J("$location"),
    pg = {
      $$html5: !1,
      $$replace: !1,
      absUrl: Db("$$absUrl"),
      url: function (a) {
        if (A(a)) return this.$$url;
        var c = og.exec(a);
        (c[1] || "" === a) && this.path(decodeURIComponent(c[1]));
        (c[2] || c[1] || "" === a) && this.search(c[3] || "");
        this.hash(c[5] || "");
        return this;
      },
      protocol: Db("$$protocol"),
      host: Db("$$host"),
      port: Db("$$port"),
      path: kd("$$path", function (a) {
        a = null !== a ? a.toString() : "";
        return "/" == a.charAt(0) ? a : "/" + a;
      }),
      search: function (a, c) {
        switch (arguments.length) {
          case 0:
            return this.$$search;
          case 1:
            if (L(a) || V(a)) (a = a.toString()), (this.$$search = zc(a));
            else if (H(a))
              (a = fa(a, {})),
                m(a, function (c, e) {
                  null == c && delete a[e];
                }),
                (this.$$search = a);
            else throw Cb("isrcharg");
            break;
          default:
            A(c) || null === c
              ? delete this.$$search[a]
              : (this.$$search[a] = c);
        }
        this.$$compose();
        return this;
      },
      hash: kd("$$hash", function (a) {
        return null !== a ? a.toString() : "";
      }),
      replace: function () {
        this.$$replace = !0;
        return this;
      },
    };
  m([jd, ec, dc], function (a) {
    a.prototype = Object.create(pg);
    a.prototype.state = function (c) {
      if (!arguments.length) return this.$$state;
      if (a !== dc || !this.$$html5) throw Cb("nostate");
      this.$$state = A(c) ? null : c;
      return this;
    };
  });
  var da = J("$parse"),
    Uf = Function.prototype.call,
    Vf = Function.prototype.apply,
    Wf = Function.prototype.bind,
    Mb = ga();
  m("+ - * / % === !== == != < > <= >= && || ! = |".split(" "), function (a) {
    Mb[a] = !0;
  });
  var qg = { n: "\n", f: "\f", r: "\r", t: "\t", v: "\v", "'": "'", '"': '"' },
    gc = function (a) {
      this.options = a;
    };
  gc.prototype = {
    constructor: gc,
    lex: function (a) {
      this.text = a;
      this.index = 0;
      for (this.tokens = []; this.index < this.text.length; )
        if (((a = this.text.charAt(this.index)), '"' === a || "'" === a))
          this.readString(a);
        else if (this.isNumber(a) || ("." === a && this.isNumber(this.peek())))
          this.readNumber();
        else if (this.isIdent(a)) this.readIdent();
        else if (this.is(a, "(){}[].,;:?"))
          this.tokens.push({ index: this.index, text: a }), this.index++;
        else if (this.isWhitespace(a)) this.index++;
        else {
          var c = a + this.peek(),
            d = c + this.peek(2),
            e = Mb[c],
            f = Mb[d];
          Mb[a] || e || f
            ? ((a = f ? d : e ? c : a),
              this.tokens.push({ index: this.index, text: a, operator: !0 }),
              (this.index += a.length))
            : this.throwError(
                "Unexpected next character ",
                this.index,
                this.index + 1
              );
        }
      return this.tokens;
    },
    is: function (a, c) {
      return -1 !== c.indexOf(a);
    },
    peek: function (a) {
      a = a || 1;
      return this.index + a < this.text.length
        ? this.text.charAt(this.index + a)
        : !1;
    },
    isNumber: function (a) {
      return "0" <= a && "9" >= a && "string" === typeof a;
    },
    isWhitespace: function (a) {
      return (
        " " === a ||
        "\r" === a ||
        "\t" === a ||
        "\n" === a ||
        "\v" === a ||
        "\u00a0" === a
      );
    },
    isIdent: function (a) {
      return (
        ("a" <= a && "z" >= a) ||
        ("A" <= a && "Z" >= a) ||
        "_" === a ||
        "$" === a
      );
    },
    isExpOperator: function (a) {
      return "-" === a || "+" === a || this.isNumber(a);
    },
    throwError: function (a, c, d) {
      d = d || this.index;
      c = w(c)
        ? "s " + c + "-" + this.index + " [" + this.text.substring(c, d) + "]"
        : " " + d;
      throw da("lexerr", a, c, this.text);
    },
    readNumber: function () {
      for (var a = "", c = this.index; this.index < this.text.length; ) {
        var d = M(this.text.charAt(this.index));
        if ("." == d || this.isNumber(d)) a += d;
        else {
          var e = this.peek();
          if ("e" == d && this.isExpOperator(e)) a += d;
          else if (
            this.isExpOperator(d) &&
            e &&
            this.isNumber(e) &&
            "e" == a.charAt(a.length - 1)
          )
            a += d;
          else if (
            !this.isExpOperator(d) ||
            (e && this.isNumber(e)) ||
            "e" != a.charAt(a.length - 1)
          )
            break;
          else this.throwError("Invalid exponent");
        }
        this.index++;
      }
      this.tokens.push({ index: c, text: a, constant: !0, value: Number(a) });
    },
    readIdent: function () {
      for (var a = this.index; this.index < this.text.length; ) {
        var c = this.text.charAt(this.index);
        if (!this.isIdent(c) && !this.isNumber(c)) break;
        this.index++;
      }
      this.tokens.push({
        index: a,
        text: this.text.slice(a, this.index),
        identifier: !0,
      });
    },
    readString: function (a) {
      var c = this.index;
      this.index++;
      for (var d = "", e = a, f = !1; this.index < this.text.length; ) {
        var g = this.text.charAt(this.index),
          e = e + g;
        if (f)
          "u" === g
            ? ((f = this.text.substring(this.index + 1, this.index + 5)),
              f.match(/[\da-f]{4}/i) ||
                this.throwError("Invalid unicode escape [\\u" + f + "]"),
              (this.index += 4),
              (d += String.fromCharCode(parseInt(f, 16))))
            : (d += qg[g] || g),
            (f = !1);
        else if ("\\" === g) f = !0;
        else {
          if (g === a) {
            this.index++;
            this.tokens.push({ index: c, text: e, constant: !0, value: d });
            return;
          }
          d += g;
        }
        this.index++;
      }
      this.throwError("Unterminated quote", c);
    },
  };
  var q = function (a, c) {
    this.lexer = a;
    this.options = c;
  };
  q.Program = "Program";
  q.ExpressionStatement = "ExpressionStatement";
  q.AssignmentExpression = "AssignmentExpression";
  q.ConditionalExpression = "ConditionalExpression";
  q.LogicalExpression = "LogicalExpression";
  q.BinaryExpression = "BinaryExpression";
  q.UnaryExpression = "UnaryExpression";
  q.CallExpression = "CallExpression";
  q.MemberExpression = "MemberExpression";
  q.Identifier = "Identifier";
  q.Literal = "Literal";
  q.ArrayExpression = "ArrayExpression";
  q.Property = "Property";
  q.ObjectExpression = "ObjectExpression";
  q.ThisExpression = "ThisExpression";
  q.NGValueParameter = "NGValueParameter";
  q.prototype = {
    ast: function (a) {
      this.text = a;
      this.tokens = this.lexer.lex(a);
      a = this.program();
      0 !== this.tokens.length &&
        this.throwError("is an unexpected token", this.tokens[0]);
      return a;
    },
    program: function () {
      for (var a = []; ; )
        if (
          (0 < this.tokens.length &&
            !this.peek("}", ")", ";", "]") &&
            a.push(this.expressionStatement()),
          !this.expect(";"))
        )
          return { type: q.Program, body: a };
    },
    expressionStatement: function () {
      return { type: q.ExpressionStatement, expression: this.filterChain() };
    },
    filterChain: function () {
      for (var a = this.expression(); this.expect("|"); ) a = this.filter(a);
      return a;
    },
    expression: function () {
      return this.assignment();
    },
    assignment: function () {
      var a = this.ternary();
      this.expect("=") &&
        (a = {
          type: q.AssignmentExpression,
          left: a,
          right: this.assignment(),
          operator: "=",
        });
      return a;
    },
    ternary: function () {
      var a = this.logicalOR(),
        c,
        d;
      return this.expect("?") && ((c = this.expression()), this.consume(":"))
        ? ((d = this.expression()),
          {
            type: q.ConditionalExpression,
            test: a,
            alternate: c,
            consequent: d,
          })
        : a;
    },
    logicalOR: function () {
      for (var a = this.logicalAND(); this.expect("||"); )
        a = {
          type: q.LogicalExpression,
          operator: "||",
          left: a,
          right: this.logicalAND(),
        };
      return a;
    },
    logicalAND: function () {
      for (var a = this.equality(); this.expect("&&"); )
        a = {
          type: q.LogicalExpression,
          operator: "&&",
          left: a,
          right: this.equality(),
        };
      return a;
    },
    equality: function () {
      for (
        var a = this.relational(), c;
        (c = this.expect("==", "!=", "===", "!=="));

      )
        a = {
          type: q.BinaryExpression,
          operator: c.text,
          left: a,
          right: this.relational(),
        };
      return a;
    },
    relational: function () {
      for (
        var a = this.additive(), c;
        (c = this.expect("<", ">", "<=", ">="));

      )
        a = {
          type: q.BinaryExpression,
          operator: c.text,
          left: a,
          right: this.additive(),
        };
      return a;
    },
    additive: function () {
      for (var a = this.multiplicative(), c; (c = this.expect("+", "-")); )
        a = {
          type: q.BinaryExpression,
          operator: c.text,
          left: a,
          right: this.multiplicative(),
        };
      return a;
    },
    multiplicative: function () {
      for (var a = this.unary(), c; (c = this.expect("*", "/", "%")); )
        a = {
          type: q.BinaryExpression,
          operator: c.text,
          left: a,
          right: this.unary(),
        };
      return a;
    },
    unary: function () {
      var a;
      return (a = this.expect("+", "-", "!"))
        ? {
            type: q.UnaryExpression,
            operator: a.text,
            prefix: !0,
            argument: this.unary(),
          }
        : this.primary();
    },
    primary: function () {
      var a;
      this.expect("(")
        ? ((a = this.filterChain()), this.consume(")"))
        : this.expect("[")
        ? (a = this.arrayDeclaration())
        : this.expect("{")
        ? (a = this.object())
        : this.constants.hasOwnProperty(this.peek().text)
        ? (a = fa(this.constants[this.consume().text]))
        : this.peek().identifier
        ? (a = this.identifier())
        : this.peek().constant
        ? (a = this.constant())
        : this.throwError("not a primary expression", this.peek());
      for (var c; (c = this.expect("(", "[", ".")); )
        "(" === c.text
          ? ((a = {
              type: q.CallExpression,
              callee: a,
              arguments: this.parseArguments(),
            }),
            this.consume(")"))
          : "[" === c.text
          ? ((a = {
              type: q.MemberExpression,
              object: a,
              property: this.expression(),
              computed: !0,
            }),
            this.consume("]"))
          : "." === c.text
          ? (a = {
              type: q.MemberExpression,
              object: a,
              property: this.identifier(),
              computed: !1,
            })
          : this.throwError("IMPOSSIBLE");
      return a;
    },
    filter: function (a) {
      a = [a];
      for (
        var c = {
          type: q.CallExpression,
          callee: this.identifier(),
          arguments: a,
          filter: !0,
        };
        this.expect(":");

      )
        a.push(this.expression());
      return c;
    },
    parseArguments: function () {
      var a = [];
      if (")" !== this.peekToken().text) {
        do a.push(this.expression());
        while (this.expect(","));
      }
      return a;
    },
    identifier: function () {
      var a = this.consume();
      a.identifier || this.throwError("is not a valid identifier", a);
      return { type: q.Identifier, name: a.text };
    },
    constant: function () {
      return { type: q.Literal, value: this.consume().value };
    },
    arrayDeclaration: function () {
      var a = [];
      if ("]" !== this.peekToken().text) {
        do {
          if (this.peek("]")) break;
          a.push(this.expression());
        } while (this.expect(","));
      }
      this.consume("]");
      return { type: q.ArrayExpression, elements: a };
    },
    object: function () {
      var a = [],
        c;
      if ("}" !== this.peekToken().text) {
        do {
          if (this.peek("}")) break;
          c = { type: q.Property, kind: "init" };
          this.peek().constant
            ? (c.key = this.constant())
            : this.peek().identifier
            ? (c.key = this.identifier())
            : this.throwError("invalid key", this.peek());
          this.consume(":");
          c.value = this.expression();
          a.push(c);
        } while (this.expect(","));
      }
      this.consume("}");
      return { type: q.ObjectExpression, properties: a };
    },
    throwError: function (a, c) {
      throw da(
        "syntax",
        c.text,
        a,
        c.index + 1,
        this.text,
        this.text.substring(c.index)
      );
    },
    consume: function (a) {
      if (0 === this.tokens.length) throw da("ueoe", this.text);
      var c = this.expect(a);
      c || this.throwError("is unexpected, expecting [" + a + "]", this.peek());
      return c;
    },
    peekToken: function () {
      if (0 === this.tokens.length) throw da("ueoe", this.text);
      return this.tokens[0];
    },
    peek: function (a, c, d, e) {
      return this.peekAhead(0, a, c, d, e);
    },
    peekAhead: function (a, c, d, e, f) {
      if (this.tokens.length > a) {
        a = this.tokens[a];
        var g = a.text;
        if (g === c || g === d || g === e || g === f || !(c || d || e || f))
          return a;
      }
      return !1;
    },
    expect: function (a, c, d, e) {
      return (a = this.peek(a, c, d, e)) ? (this.tokens.shift(), a) : !1;
    },
    constants: {
      true: { type: q.Literal, value: !0 },
      false: { type: q.Literal, value: !1 },
      null: { type: q.Literal, value: null },
      undefined: { type: q.Literal, value: t },
      this: { type: q.ThisExpression },
    },
  };
  rd.prototype = {
    compile: function (a, c) {
      var d = this,
        e = this.astBuilder.ast(a);
      this.state = {
        nextId: 0,
        filters: {},
        expensiveChecks: c,
        fn: { vars: [], body: [], own: {} },
        assign: { vars: [], body: [], own: {} },
        inputs: [],
      };
      T(e, d.$filter);
      var f = "",
        g;
      this.stage = "assign";
      if ((g = pd(e)))
        (this.state.computing = "assign"),
          (f = this.nextId()),
          this.recurse(g, f),
          (f = "fn.assign=" + this.generateFunction("assign", "s,v,l"));
      g = nd(e.body);
      d.stage = "inputs";
      m(g, function (a, c) {
        var e = "fn" + c;
        d.state[e] = { vars: [], body: [], own: {} };
        d.state.computing = e;
        var f = d.nextId();
        d.recurse(a, f);
        d.return_(f);
        d.state.inputs.push(e);
        a.watchId = c;
      });
      this.state.computing = "fn";
      this.stage = "main";
      this.recurse(e);
      f =
        '"' +
        this.USE +
        " " +
        this.STRICT +
        '";\n' +
        this.filterPrefix() +
        "var fn=" +
        this.generateFunction("fn", "s,l,a,i") +
        f +
        this.watchFns() +
        "return fn;";
      f = new Function(
        "$filter",
        "ensureSafeMemberName",
        "ensureSafeObject",
        "ensureSafeFunction",
        "ifDefined",
        "plus",
        "text",
        f
      )(this.$filter, Ca, oa, ld, Xf, md, a);
      this.state = this.stage = t;
      f.literal = qd(e);
      f.constant = e.constant;
      return f;
    },
    USE: "use",
    STRICT: "strict",
    watchFns: function () {
      var a = [],
        c = this.state.inputs,
        d = this;
      m(c, function (c) {
        a.push("var " + c + "=" + d.generateFunction(c, "s"));
      });
      c.length && a.push("fn.inputs=[" + c.join(",") + "];");
      return a.join("");
    },
    generateFunction: function (a, c) {
      return "function(" + c + "){" + this.varsPrefix(a) + this.body(a) + "};";
    },
    filterPrefix: function () {
      var a = [],
        c = this;
      m(this.state.filters, function (d, e) {
        a.push(d + "=$filter(" + c.escape(e) + ")");
      });
      return a.length ? "var " + a.join(",") + ";" : "";
    },
    varsPrefix: function (a) {
      return this.state[a].vars.length
        ? "var " + this.state[a].vars.join(",") + ";"
        : "";
    },
    body: function (a) {
      return this.state[a].body.join("");
    },
    recurse: function (a, c, d, e, f, g) {
      var h,
        l,
        k = this,
        n,
        r;
      e = e || v;
      if (!g && w(a.watchId))
        (c = c || this.nextId()),
          this.if_(
            "i",
            this.lazyAssign(c, this.computedMember("i", a.watchId)),
            this.lazyRecurse(a, c, d, e, f, !0)
          );
      else
        switch (a.type) {
          case q.Program:
            m(a.body, function (c, d) {
              k.recurse(c.expression, t, t, function (a) {
                l = a;
              });
              d !== a.body.length - 1
                ? k.current().body.push(l, ";")
                : k.return_(l);
            });
            break;
          case q.Literal:
            r = this.escape(a.value);
            this.assign(c, r);
            e(r);
            break;
          case q.UnaryExpression:
            this.recurse(a.argument, t, t, function (a) {
              l = a;
            });
            r = a.operator + "(" + this.ifDefined(l, 0) + ")";
            this.assign(c, r);
            e(r);
            break;
          case q.BinaryExpression:
            this.recurse(a.left, t, t, function (a) {
              h = a;
            });
            this.recurse(a.right, t, t, function (a) {
              l = a;
            });
            r =
              "+" === a.operator
                ? this.plus(h, l)
                : "-" === a.operator
                ? this.ifDefined(h, 0) + a.operator + this.ifDefined(l, 0)
                : "(" + h + ")" + a.operator + "(" + l + ")";
            this.assign(c, r);
            e(r);
            break;
          case q.LogicalExpression:
            c = c || this.nextId();
            k.recurse(a.left, c);
            k.if_(
              "&&" === a.operator ? c : k.not(c),
              k.lazyRecurse(a.right, c)
            );
            e(c);
            break;
          case q.ConditionalExpression:
            c = c || this.nextId();
            k.recurse(a.test, c);
            k.if_(
              c,
              k.lazyRecurse(a.alternate, c),
              k.lazyRecurse(a.consequent, c)
            );
            e(c);
            break;
          case q.Identifier:
            c = c || this.nextId();
            d &&
              ((d.context =
                "inputs" === k.stage
                  ? "s"
                  : this.assign(
                      this.nextId(),
                      this.getHasOwnProperty("l", a.name) + "?l:s"
                    )),
              (d.computed = !1),
              (d.name = a.name));
            Ca(a.name);
            k.if_(
              "inputs" === k.stage || k.not(k.getHasOwnProperty("l", a.name)),
              function () {
                k.if_("inputs" === k.stage || "s", function () {
                  f &&
                    1 !== f &&
                    k.if_(
                      k.not(k.nonComputedMember("s", a.name)),
                      k.lazyAssign(k.nonComputedMember("s", a.name), "{}")
                    );
                  k.assign(c, k.nonComputedMember("s", a.name));
                });
              },
              c && k.lazyAssign(c, k.nonComputedMember("l", a.name))
            );
            (k.state.expensiveChecks || Fb(a.name)) && k.addEnsureSafeObject(c);
            e(c);
            break;
          case q.MemberExpression:
            h = (d && (d.context = this.nextId())) || this.nextId();
            c = c || this.nextId();
            k.recurse(
              a.object,
              h,
              t,
              function () {
                k.if_(
                  k.notNull(h),
                  function () {
                    if (a.computed)
                      (l = k.nextId()),
                        k.recurse(a.property, l),
                        k.addEnsureSafeMemberName(l),
                        f &&
                          1 !== f &&
                          k.if_(
                            k.not(k.computedMember(h, l)),
                            k.lazyAssign(k.computedMember(h, l), "{}")
                          ),
                        (r = k.ensureSafeObject(k.computedMember(h, l))),
                        k.assign(c, r),
                        d && ((d.computed = !0), (d.name = l));
                    else {
                      Ca(a.property.name);
                      f &&
                        1 !== f &&
                        k.if_(
                          k.not(k.nonComputedMember(h, a.property.name)),
                          k.lazyAssign(
                            k.nonComputedMember(h, a.property.name),
                            "{}"
                          )
                        );
                      r = k.nonComputedMember(h, a.property.name);
                      if (k.state.expensiveChecks || Fb(a.property.name))
                        r = k.ensureSafeObject(r);
                      k.assign(c, r);
                      d && ((d.computed = !1), (d.name = a.property.name));
                    }
                  },
                  function () {
                    k.assign(c, "undefined");
                  }
                );
                e(c);
              },
              !!f
            );
            break;
          case q.CallExpression:
            c = c || this.nextId();
            a.filter
              ? ((l = k.filter(a.callee.name)),
                (n = []),
                m(a.arguments, function (a) {
                  var c = k.nextId();
                  k.recurse(a, c);
                  n.push(c);
                }),
                (r = l + "(" + n.join(",") + ")"),
                k.assign(c, r),
                e(c))
              : ((l = k.nextId()),
                (h = {}),
                (n = []),
                k.recurse(a.callee, l, h, function () {
                  k.if_(
                    k.notNull(l),
                    function () {
                      k.addEnsureSafeFunction(l);
                      m(a.arguments, function (a) {
                        k.recurse(a, k.nextId(), t, function (a) {
                          n.push(k.ensureSafeObject(a));
                        });
                      });
                      h.name
                        ? (k.state.expensiveChecks ||
                            k.addEnsureSafeObject(h.context),
                          (r =
                            k.member(h.context, h.name, h.computed) +
                            "(" +
                            n.join(",") +
                            ")"))
                        : (r = l + "(" + n.join(",") + ")");
                      r = k.ensureSafeObject(r);
                      k.assign(c, r);
                    },
                    function () {
                      k.assign(c, "undefined");
                    }
                  );
                  e(c);
                }));
            break;
          case q.AssignmentExpression:
            l = this.nextId();
            h = {};
            if (!od(a.left)) throw da("lval");
            this.recurse(
              a.left,
              t,
              h,
              function () {
                k.if_(k.notNull(h.context), function () {
                  k.recurse(a.right, l);
                  k.addEnsureSafeObject(
                    k.member(h.context, h.name, h.computed)
                  );
                  r = k.member(h.context, h.name, h.computed) + a.operator + l;
                  k.assign(c, r);
                  e(c || r);
                });
              },
              1
            );
            break;
          case q.ArrayExpression:
            n = [];
            m(a.elements, function (a) {
              k.recurse(a, k.nextId(), t, function (a) {
                n.push(a);
              });
            });
            r = "[" + n.join(",") + "]";
            this.assign(c, r);
            e(r);
            break;
          case q.ObjectExpression:
            n = [];
            m(a.properties, function (a) {
              k.recurse(a.value, k.nextId(), t, function (c) {
                n.push(
                  k.escape(
                    a.key.type === q.Identifier ? a.key.name : "" + a.key.value
                  ) +
                    ":" +
                    c
                );
              });
            });
            r = "{" + n.join(",") + "}";
            this.assign(c, r);
            e(r);
            break;
          case q.ThisExpression:
            this.assign(c, "s");
            e("s");
            break;
          case q.NGValueParameter:
            this.assign(c, "v"), e("v");
        }
    },
    getHasOwnProperty: function (a, c) {
      var d = a + "." + c,
        e = this.current().own;
      e.hasOwnProperty(d) ||
        (e[d] = this.nextId(!1, a + "&&(" + this.escape(c) + " in " + a + ")"));
      return e[d];
    },
    assign: function (a, c) {
      if (a) return this.current().body.push(a, "=", c, ";"), a;
    },
    filter: function (a) {
      this.state.filters.hasOwnProperty(a) ||
        (this.state.filters[a] = this.nextId(!0));
      return this.state.filters[a];
    },
    ifDefined: function (a, c) {
      return "ifDefined(" + a + "," + this.escape(c) + ")";
    },
    plus: function (a, c) {
      return "plus(" + a + "," + c + ")";
    },
    return_: function (a) {
      this.current().body.push("return ", a, ";");
    },
    if_: function (a, c, d) {
      if (!0 === a) c();
      else {
        var e = this.current().body;
        e.push("if(", a, "){");
        c();
        e.push("}");
        d && (e.push("else{"), d(), e.push("}"));
      }
    },
    not: function (a) {
      return "!(" + a + ")";
    },
    notNull: function (a) {
      return a + "!=null";
    },
    nonComputedMember: function (a, c) {
      return a + "." + c;
    },
    computedMember: function (a, c) {
      return a + "[" + c + "]";
    },
    member: function (a, c, d) {
      return d ? this.computedMember(a, c) : this.nonComputedMember(a, c);
    },
    addEnsureSafeObject: function (a) {
      this.current().body.push(this.ensureSafeObject(a), ";");
    },
    addEnsureSafeMemberName: function (a) {
      this.current().body.push(this.ensureSafeMemberName(a), ";");
    },
    addEnsureSafeFunction: function (a) {
      this.current().body.push(this.ensureSafeFunction(a), ";");
    },
    ensureSafeObject: function (a) {
      return "ensureSafeObject(" + a + ",text)";
    },
    ensureSafeMemberName: function (a) {
      return "ensureSafeMemberName(" + a + ",text)";
    },
    ensureSafeFunction: function (a) {
      return "ensureSafeFunction(" + a + ",text)";
    },
    lazyRecurse: function (a, c, d, e, f, g) {
      var h = this;
      return function () {
        h.recurse(a, c, d, e, f, g);
      };
    },
    lazyAssign: function (a, c) {
      var d = this;
      return function () {
        d.assign(a, c);
      };
    },
    stringEscapeRegex: /[^ a-zA-Z0-9]/g,
    stringEscapeFn: function (a) {
      return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
    },
    escape: function (a) {
      if (L(a))
        return (
          "'" + a.replace(this.stringEscapeRegex, this.stringEscapeFn) + "'"
        );
      if (V(a)) return a.toString();
      if (!0 === a) return "true";
      if (!1 === a) return "false";
      if (null === a) return "null";
      if ("undefined" === typeof a) return "undefined";
      throw da("esc");
    },
    nextId: function (a, c) {
      var d = "v" + this.state.nextId++;
      a || this.current().vars.push(d + (c ? "=" + c : ""));
      return d;
    },
    current: function () {
      return this.state[this.state.computing];
    },
  };
  sd.prototype = {
    compile: function (a, c) {
      var d = this,
        e = this.astBuilder.ast(a);
      this.expression = a;
      this.expensiveChecks = c;
      T(e, d.$filter);
      var f, g;
      if ((f = pd(e))) g = this.recurse(f);
      f = nd(e.body);
      var h;
      f &&
        ((h = []),
        m(f, function (a, c) {
          var e = d.recurse(a);
          a.input = e;
          h.push(e);
          a.watchId = c;
        }));
      var l = [];
      m(e.body, function (a) {
        l.push(d.recurse(a.expression));
      });
      f =
        0 === e.body.length
          ? function () {}
          : 1 === e.body.length
          ? l[0]
          : function (a, c) {
              var d;
              m(l, function (e) {
                d = e(a, c);
              });
              return d;
            };
      g &&
        (f.assign = function (a, c, d) {
          return g(a, d, c);
        });
      h && (f.inputs = h);
      f.literal = qd(e);
      f.constant = e.constant;
      return f;
    },
    recurse: function (a, c, d) {
      var e,
        f,
        g = this,
        h;
      if (a.input) return this.inputs(a.input, a.watchId);
      switch (a.type) {
        case q.Literal:
          return this.value(a.value, c);
        case q.UnaryExpression:
          return (
            (f = this.recurse(a.argument)), this["unary" + a.operator](f, c)
          );
        case q.BinaryExpression:
          return (
            (e = this.recurse(a.left)),
            (f = this.recurse(a.right)),
            this["binary" + a.operator](e, f, c)
          );
        case q.LogicalExpression:
          return (
            (e = this.recurse(a.left)),
            (f = this.recurse(a.right)),
            this["binary" + a.operator](e, f, c)
          );
        case q.ConditionalExpression:
          return this["ternary?:"](
            this.recurse(a.test),
            this.recurse(a.alternate),
            this.recurse(a.consequent),
            c
          );
        case q.Identifier:
          return (
            Ca(a.name, g.expression),
            g.identifier(
              a.name,
              g.expensiveChecks || Fb(a.name),
              c,
              d,
              g.expression
            )
          );
        case q.MemberExpression:
          return (
            (e = this.recurse(a.object, !1, !!d)),
            a.computed ||
              (Ca(a.property.name, g.expression), (f = a.property.name)),
            a.computed && (f = this.recurse(a.property)),
            a.computed
              ? this.computedMember(e, f, c, d, g.expression)
              : this.nonComputedMember(
                  e,
                  f,
                  g.expensiveChecks,
                  c,
                  d,
                  g.expression
                )
          );
        case q.CallExpression:
          return (
            (h = []),
            m(a.arguments, function (a) {
              h.push(g.recurse(a));
            }),
            a.filter && (f = this.$filter(a.callee.name)),
            a.filter || (f = this.recurse(a.callee, !0)),
            a.filter
              ? function (a, d, e, g) {
                  for (var m = [], q = 0; q < h.length; ++q)
                    m.push(h[q](a, d, e, g));
                  a = f.apply(t, m, g);
                  return c ? { context: t, name: t, value: a } : a;
                }
              : function (a, d, e, r) {
                  var m = f(a, d, e, r),
                    q;
                  if (null != m.value) {
                    oa(m.context, g.expression);
                    ld(m.value, g.expression);
                    q = [];
                    for (var t = 0; t < h.length; ++t)
                      q.push(oa(h[t](a, d, e, r), g.expression));
                    q = oa(m.value.apply(m.context, q), g.expression);
                  }
                  return c ? { value: q } : q;
                }
          );
        case q.AssignmentExpression:
          return (
            (e = this.recurse(a.left, !0, 1)),
            (f = this.recurse(a.right)),
            function (a, d, h, r) {
              var m = e(a, d, h, r);
              a = f(a, d, h, r);
              oa(m.value, g.expression);
              m.context[m.name] = a;
              return c ? { value: a } : a;
            }
          );
        case q.ArrayExpression:
          return (
            (h = []),
            m(a.elements, function (a) {
              h.push(g.recurse(a));
            }),
            function (a, d, e, f) {
              for (var g = [], m = 0; m < h.length; ++m)
                g.push(h[m](a, d, e, f));
              return c ? { value: g } : g;
            }
          );
        case q.ObjectExpression:
          return (
            (h = []),
            m(a.properties, function (a) {
              h.push({
                key:
                  a.key.type === q.Identifier ? a.key.name : "" + a.key.value,
                value: g.recurse(a.value),
              });
            }),
            function (a, d, e, f) {
              for (var g = {}, m = 0; m < h.length; ++m)
                g[h[m].key] = h[m].value(a, d, e, f);
              return c ? { value: g } : g;
            }
          );
        case q.ThisExpression:
          return function (a) {
            return c ? { value: a } : a;
          };
        case q.NGValueParameter:
          return function (a, d, e, f) {
            return c ? { value: e } : e;
          };
      }
    },
    "unary+": function (a, c) {
      return function (d, e, f, g) {
        d = a(d, e, f, g);
        d = w(d) ? +d : 0;
        return c ? { value: d } : d;
      };
    },
    "unary-": function (a, c) {
      return function (d, e, f, g) {
        d = a(d, e, f, g);
        d = w(d) ? -d : 0;
        return c ? { value: d } : d;
      };
    },
    "unary!": function (a, c) {
      return function (d, e, f, g) {
        d = !a(d, e, f, g);
        return c ? { value: d } : d;
      };
    },
    "binary+": function (a, c, d) {
      return function (e, f, g, h) {
        var l = a(e, f, g, h);
        e = c(e, f, g, h);
        l = md(l, e);
        return d ? { value: l } : l;
      };
    },
    "binary-": function (a, c, d) {
      return function (e, f, g, h) {
        var l = a(e, f, g, h);
        e = c(e, f, g, h);
        l = (w(l) ? l : 0) - (w(e) ? e : 0);
        return d ? { value: l } : l;
      };
    },
    "binary*": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) * c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary/": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) / c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary%": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) % c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary===": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) === c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary!==": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) !== c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary==": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) == c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary!=": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) != c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary<": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) < c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary>": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) > c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary<=": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) <= c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary>=": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) >= c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary&&": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) && c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "binary||": function (a, c, d) {
      return function (e, f, g, h) {
        e = a(e, f, g, h) || c(e, f, g, h);
        return d ? { value: e } : e;
      };
    },
    "ternary?:": function (a, c, d, e) {
      return function (f, g, h, l) {
        f = a(f, g, h, l) ? c(f, g, h, l) : d(f, g, h, l);
        return e ? { value: f } : f;
      };
    },
    value: function (a, c) {
      return function () {
        return c ? { context: t, name: t, value: a } : a;
      };
    },
    identifier: function (a, c, d, e, f) {
      return function (g, h, l, k) {
        g = h && a in h ? h : g;
        e && 1 !== e && g && !g[a] && (g[a] = {});
        h = g ? g[a] : t;
        c && oa(h, f);
        return d ? { context: g, name: a, value: h } : h;
      };
    },
    computedMember: function (a, c, d, e, f) {
      return function (g, h, l, k) {
        var n = a(g, h, l, k),
          m,
          s;
        null != n &&
          ((m = c(g, h, l, k)),
          Ca(m, f),
          e && 1 !== e && n && !n[m] && (n[m] = {}),
          (s = n[m]),
          oa(s, f));
        return d ? { context: n, name: m, value: s } : s;
      };
    },
    nonComputedMember: function (a, c, d, e, f, g) {
      return function (h, l, k, n) {
        h = a(h, l, k, n);
        f && 1 !== f && h && !h[c] && (h[c] = {});
        l = null != h ? h[c] : t;
        (d || Fb(c)) && oa(l, g);
        return e ? { context: h, name: c, value: l } : l;
      };
    },
    inputs: function (a, c) {
      return function (d, e, f, g) {
        return g ? g[c] : a(d, e, f);
      };
    },
  };
  var hc = function (a, c, d) {
    this.lexer = a;
    this.$filter = c;
    this.options = d;
    this.ast = new q(this.lexer);
    this.astCompiler = d.csp ? new sd(this.ast, c) : new rd(this.ast, c);
  };
  hc.prototype = {
    constructor: hc,
    parse: function (a) {
      return this.astCompiler.compile(a, this.options.expensiveChecks);
    },
  };
  ga();
  ga();
  var Yf = Object.prototype.valueOf,
    Da = J("$sce"),
    pa = {
      HTML: "html",
      CSS: "css",
      URL: "url",
      RESOURCE_URL: "resourceUrl",
      JS: "js",
    },
    ea = J("$compile"),
    X = U.createElement("a"),
    wd = Ba(O.location.href);
  xd.$inject = ["$document"];
  Lc.$inject = ["$provide"];
  yd.$inject = ["$locale"];
  Ad.$inject = ["$locale"];
  var Dd = ".",
    hg = {
      yyyy: Y("FullYear", 4),
      yy: Y("FullYear", 2, 0, !0),
      y: Y("FullYear", 1),
      MMMM: Hb("Month"),
      MMM: Hb("Month", !0),
      MM: Y("Month", 2, 1),
      M: Y("Month", 1, 1),
      dd: Y("Date", 2),
      d: Y("Date", 1),
      HH: Y("Hours", 2),
      H: Y("Hours", 1),
      hh: Y("Hours", 2, -12),
      h: Y("Hours", 1, -12),
      mm: Y("Minutes", 2),
      m: Y("Minutes", 1),
      ss: Y("Seconds", 2),
      s: Y("Seconds", 1),
      sss: Y("Milliseconds", 3),
      EEEE: Hb("Day"),
      EEE: Hb("Day", !0),
      a: function (a, c) {
        return 12 > a.getHours() ? c.AMPMS[0] : c.AMPMS[1];
      },
      Z: function (a, c, d) {
        a = -1 * d;
        return (a =
          (0 <= a ? "+" : "") +
          (Gb(Math[0 < a ? "floor" : "ceil"](a / 60), 2) +
            Gb(Math.abs(a % 60), 2)));
      },
      ww: Fd(2),
      w: Fd(1),
      G: jc,
      GG: jc,
      GGG: jc,
      GGGG: function (a, c) {
        return 0 >= a.getFullYear() ? c.ERANAMES[0] : c.ERANAMES[1];
      },
    },
    gg =
      /((?:[^yMdHhmsaZEwG']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z|G+|w+))(.*)/,
    fg = /^\-?\d+$/;
  zd.$inject = ["$locale"];
  var cg = ra(M),
    dg = ra(rb);
  Bd.$inject = ["$parse"];
  var ie = ra({
      restrict: "E",
      compile: function (a, c) {
        if (!c.href && !c.xlinkHref)
          return function (a, c) {
            if ("a" === c[0].nodeName.toLowerCase()) {
              var f =
                "[object SVGAnimatedString]" === sa.call(c.prop("href"))
                  ? "xlink:href"
                  : "href";
              c.on("click", function (a) {
                c.attr(f) || a.preventDefault();
              });
            }
          };
      },
    }),
    sb = {};
  m(Ab, function (a, c) {
    function d(a, d, f) {
      a.$watch(f[e], function (a) {
        f.$set(c, !!a);
      });
    }
    if ("multiple" != a) {
      var e = wa("ng-" + c),
        f = d;
      "checked" === a &&
        (f = function (a, c, f) {
          f.ngModel !== f[e] && d(a, c, f);
        });
      sb[e] = function () {
        return { restrict: "A", priority: 100, link: f };
      };
    }
  });
  m(Uc, function (a, c) {
    sb[c] = function () {
      return {
        priority: 100,
        link: function (a, e, f) {
          if (
            "ngPattern" === c &&
            "/" == f.ngPattern.charAt(0) &&
            (e = f.ngPattern.match(jg))
          ) {
            f.$set("ngPattern", new RegExp(e[1], e[2]));
            return;
          }
          a.$watch(f[c], function (a) {
            f.$set(c, a);
          });
        },
      };
    };
  });
  m(["src", "srcset", "href"], function (a) {
    var c = wa("ng-" + a);
    sb[c] = function () {
      return {
        priority: 99,
        link: function (d, e, f) {
          var g = a,
            h = a;
          "href" === a &&
            "[object SVGAnimatedString]" === sa.call(e.prop("href")) &&
            ((h = "xlinkHref"), (f.$attr[h] = "xlink:href"), (g = null));
          f.$observe(c, function (c) {
            c
              ? (f.$set(h, c), Ua && g && e.prop(g, f[h]))
              : "href" === a && f.$set(h, null);
          });
        },
      };
    };
  });
  var Ib = {
    $addControl: v,
    $$renameControl: function (a, c) {
      a.$name = c;
    },
    $removeControl: v,
    $setValidity: v,
    $setDirty: v,
    $setPristine: v,
    $setSubmitted: v,
  };
  Gd.$inject = ["$element", "$attrs", "$scope", "$animate", "$interpolate"];
  var Od = function (a) {
      return [
        "$timeout",
        function (c) {
          return {
            name: "form",
            restrict: a ? "EAC" : "E",
            controller: Gd,
            compile: function (d, e) {
              d.addClass(Va).addClass(mb);
              var f = e.name ? "name" : a && e.ngForm ? "ngForm" : !1;
              return {
                pre: function (a, d, e, k) {
                  if (!("action" in e)) {
                    var n = function (c) {
                      a.$apply(function () {
                        k.$commitViewValue();
                        k.$setSubmitted();
                      });
                      c.preventDefault();
                    };
                    d[0].addEventListener("submit", n, !1);
                    d.on("$destroy", function () {
                      c(
                        function () {
                          d[0].removeEventListener("submit", n, !1);
                        },
                        0,
                        !1
                      );
                    });
                  }
                  var m = k.$$parentForm;
                  f &&
                    (Eb(a, k.$name, k, k.$name),
                    e.$observe(f, function (c) {
                      k.$name !== c &&
                        (Eb(a, k.$name, t, k.$name),
                        m.$$renameControl(k, c),
                        Eb(a, k.$name, k, k.$name));
                    }));
                  d.on("$destroy", function () {
                    m.$removeControl(k);
                    f && Eb(a, e[f], t, k.$name);
                    P(k, Ib);
                  });
                },
              };
            },
          };
        },
      ];
    },
    je = Od(),
    we = Od(!0),
    ig =
      /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,
    rg =
      /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,
    sg =
      /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i,
    tg = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))([eE][+-]?\d+)?\s*$/,
    Pd = /^(\d{4})-(\d{2})-(\d{2})$/,
    Qd = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d)(\.\d{1,3})?)?$/,
    mc = /^(\d{4})-W(\d\d)$/,
    Rd = /^(\d{4})-(\d\d)$/,
    Sd = /^(\d\d):(\d\d)(?::(\d\d)(\.\d{1,3})?)?$/,
    Td = {
      text: function (a, c, d, e, f, g) {
        kb(a, c, d, e, f, g);
        kc(e);
      },
      date: lb("date", Pd, Kb(Pd, ["yyyy", "MM", "dd"]), "yyyy-MM-dd"),
      "datetime-local": lb(
        "datetimelocal",
        Qd,
        Kb(Qd, "yyyy MM dd HH mm ss sss".split(" ")),
        "yyyy-MM-ddTHH:mm:ss.sss"
      ),
      time: lb("time", Sd, Kb(Sd, ["HH", "mm", "ss", "sss"]), "HH:mm:ss.sss"),
      week: lb(
        "week",
        mc,
        function (a, c) {
          if (aa(a)) return a;
          if (L(a)) {
            mc.lastIndex = 0;
            var d = mc.exec(a);
            if (d) {
              var e = +d[1],
                f = +d[2],
                g = (d = 0),
                h = 0,
                l = 0,
                k = Ed(e),
                f = 7 * (f - 1);
              c &&
                ((d = c.getHours()),
                (g = c.getMinutes()),
                (h = c.getSeconds()),
                (l = c.getMilliseconds()));
              return new Date(e, 0, k.getDate() + f, d, g, h, l);
            }
          }
          return NaN;
        },
        "yyyy-Www"
      ),
      month: lb("month", Rd, Kb(Rd, ["yyyy", "MM"]), "yyyy-MM"),
      number: function (a, c, d, e, f, g) {
        Id(a, c, d, e);
        kb(a, c, d, e, f, g);
        e.$$parserName = "number";
        e.$parsers.push(function (a) {
          return e.$isEmpty(a) ? null : tg.test(a) ? parseFloat(a) : t;
        });
        e.$formatters.push(function (a) {
          if (!e.$isEmpty(a)) {
            if (!V(a)) throw Lb("numfmt", a);
            a = a.toString();
          }
          return a;
        });
        if (w(d.min) || d.ngMin) {
          var h;
          e.$validators.min = function (a) {
            return e.$isEmpty(a) || A(h) || a >= h;
          };
          d.$observe("min", function (a) {
            w(a) && !V(a) && (a = parseFloat(a, 10));
            h = V(a) && !isNaN(a) ? a : t;
            e.$validate();
          });
        }
        if (w(d.max) || d.ngMax) {
          var l;
          e.$validators.max = function (a) {
            return e.$isEmpty(a) || A(l) || a <= l;
          };
          d.$observe("max", function (a) {
            w(a) && !V(a) && (a = parseFloat(a, 10));
            l = V(a) && !isNaN(a) ? a : t;
            e.$validate();
          });
        }
      },
      url: function (a, c, d, e, f, g) {
        kb(a, c, d, e, f, g);
        kc(e);
        e.$$parserName = "url";
        e.$validators.url = function (a, c) {
          var d = a || c;
          return e.$isEmpty(d) || rg.test(d);
        };
      },
      email: function (a, c, d, e, f, g) {
        kb(a, c, d, e, f, g);
        kc(e);
        e.$$parserName = "email";
        e.$validators.email = function (a, c) {
          var d = a || c;
          return e.$isEmpty(d) || sg.test(d);
        };
      },
      radio: function (a, c, d, e) {
        A(d.name) && c.attr("name", ++nb);
        c.on("click", function (a) {
          c[0].checked && e.$setViewValue(d.value, a && a.type);
        });
        e.$render = function () {
          c[0].checked = d.value == e.$viewValue;
        };
        d.$observe("value", e.$render);
      },
      checkbox: function (a, c, d, e, f, g, h, l) {
        var k = Jd(l, a, "ngTrueValue", d.ngTrueValue, !0),
          n = Jd(l, a, "ngFalseValue", d.ngFalseValue, !1);
        c.on("click", function (a) {
          e.$setViewValue(c[0].checked, a && a.type);
        });
        e.$render = function () {
          c[0].checked = e.$viewValue;
        };
        e.$isEmpty = function (a) {
          return !1 === a;
        };
        e.$formatters.push(function (a) {
          return ka(a, k);
        });
        e.$parsers.push(function (a) {
          return a ? k : n;
        });
      },
      hidden: v,
      button: v,
      submit: v,
      reset: v,
      file: v,
    },
    Fc = [
      "$browser",
      "$sniffer",
      "$filter",
      "$parse",
      function (a, c, d, e) {
        return {
          restrict: "E",
          require: ["?ngModel"],
          link: {
            pre: function (f, g, h, l) {
              l[0] && (Td[M(h.type)] || Td.text)(f, g, h, l[0], c, a, d, e);
            },
          },
        };
      },
    ],
    ug = /^(true|false|\d+)$/,
    Oe = function () {
      return {
        restrict: "A",
        priority: 100,
        compile: function (a, c) {
          return ug.test(c.ngValue)
            ? function (a, c, f) {
                f.$set("value", a.$eval(f.ngValue));
              }
            : function (a, c, f) {
                a.$watch(f.ngValue, function (a) {
                  f.$set("value", a);
                });
              };
        },
      };
    },
    oe = [
      "$compile",
      function (a) {
        return {
          restrict: "AC",
          compile: function (c) {
            a.$$addBindingClass(c);
            return function (c, e, f) {
              a.$$addBindingInfo(e, f.ngBind);
              e = e[0];
              c.$watch(f.ngBind, function (a) {
                e.textContent = a === t ? "" : a;
              });
            };
          },
        };
      },
    ],
    qe = [
      "$interpolate",
      "$compile",
      function (a, c) {
        return {
          compile: function (d) {
            c.$$addBindingClass(d);
            return function (d, f, g) {
              d = a(f.attr(g.$attr.ngBindTemplate));
              c.$$addBindingInfo(f, d.expressions);
              f = f[0];
              g.$observe("ngBindTemplate", function (a) {
                f.textContent = a === t ? "" : a;
              });
            };
          },
        };
      },
    ],
    pe = [
      "$sce",
      "$parse",
      "$compile",
      function (a, c, d) {
        return {
          restrict: "A",
          compile: function (e, f) {
            var g = c(f.ngBindHtml),
              h = c(f.ngBindHtml, function (a) {
                return (a || "").toString();
              });
            d.$$addBindingClass(e);
            return function (c, e, f) {
              d.$$addBindingInfo(e, f.ngBindHtml);
              c.$watch(h, function () {
                e.html(a.getTrustedHtml(g(c)) || "");
              });
            };
          },
        };
      },
    ],
    Ne = ra({
      restrict: "A",
      require: "ngModel",
      link: function (a, c, d, e) {
        e.$viewChangeListeners.push(function () {
          a.$eval(d.ngChange);
        });
      },
    }),
    re = lc("", !0),
    te = lc("Odd", 0),
    se = lc("Even", 1),
    ue = Ma({
      compile: function (a, c) {
        c.$set("ngCloak", t);
        a.removeClass("ng-cloak");
      },
    }),
    ve = [
      function () {
        return { restrict: "A", scope: !0, controller: "@", priority: 500 };
      },
    ],
    Kc = {},
    vg = { blur: !0, focus: !0 };
  m(
    "click dblclick mousedown mouseup mouseover mouseout mousemove mouseenter mouseleave keydown keyup keypress submit focus blur copy cut paste".split(
      " "
    ),
    function (a) {
      var c = wa("ng-" + a);
      Kc[c] = [
        "$parse",
        "$rootScope",
        function (d, e) {
          return {
            restrict: "A",
            compile: function (f, g) {
              var h = d(g[c], null, !0);
              return function (c, d) {
                d.on(a, function (d) {
                  var f = function () {
                    h(c, { $event: d });
                  };
                  vg[a] && e.$$phase ? c.$evalAsync(f) : c.$apply(f);
                });
              };
            },
          };
        },
      ];
    }
  );
  var ye = [
      "$animate",
      function (a) {
        return {
          multiElement: !0,
          transclude: "element",
          priority: 600,
          terminal: !0,
          restrict: "A",
          $$tlb: !0,
          link: function (c, d, e, f, g) {
            var h, l, k;
            c.$watch(e.ngIf, function (c) {
              c
                ? l ||
                  g(function (c, f) {
                    l = f;
                    c[c.length++] = U.createComment(
                      " end ngIf: " + e.ngIf + " "
                    );
                    h = { clone: c };
                    a.enter(c, d.parent(), d);
                  })
                : (k && (k.remove(), (k = null)),
                  l && (l.$destroy(), (l = null)),
                  h &&
                    ((k = qb(h.clone)),
                    a.leave(k).then(function () {
                      k = null;
                    }),
                    (h = null)));
            });
          },
        };
      },
    ],
    ze = [
      "$templateRequest",
      "$anchorScroll",
      "$animate",
      function (a, c, d) {
        return {
          restrict: "ECA",
          priority: 400,
          terminal: !0,
          transclude: "element",
          controller: ca.noop,
          compile: function (e, f) {
            var g = f.ngInclude || f.src,
              h = f.onload || "",
              l = f.autoscroll;
            return function (e, f, m, s, q) {
              var t = 0,
                F,
                u,
                p,
                v = function () {
                  u && (u.remove(), (u = null));
                  F && (F.$destroy(), (F = null));
                  p &&
                    (d.leave(p).then(function () {
                      u = null;
                    }),
                    (u = p),
                    (p = null));
                };
              e.$watch(g, function (g) {
                var m = function () {
                    !w(l) || (l && !e.$eval(l)) || c();
                  },
                  r = ++t;
                g
                  ? (a(g, !0).then(
                      function (a) {
                        if (r === t) {
                          var c = e.$new();
                          s.template = a;
                          a = q(c, function (a) {
                            v();
                            d.enter(a, null, f).then(m);
                          });
                          F = c;
                          p = a;
                          F.$emit("$includeContentLoaded", g);
                          e.$eval(h);
                        }
                      },
                      function () {
                        r === t && (v(), e.$emit("$includeContentError", g));
                      }
                    ),
                    e.$emit("$includeContentRequested", g))
                  : (v(), (s.template = null));
              });
            };
          },
        };
      },
    ],
    Qe = [
      "$compile",
      function (a) {
        return {
          restrict: "ECA",
          priority: -400,
          require: "ngInclude",
          link: function (c, d, e, f) {
            /SVG/.test(d[0].toString())
              ? (d.empty(),
                a(Nc(f.template, U).childNodes)(
                  c,
                  function (a) {
                    d.append(a);
                  },
                  { futureParentElement: d }
                ))
              : (d.html(f.template), a(d.contents())(c));
          },
        };
      },
    ],
    Ae = Ma({
      priority: 450,
      compile: function () {
        return {
          pre: function (a, c, d) {
            a.$eval(d.ngInit);
          },
        };
      },
    }),
    Me = function () {
      return {
        restrict: "A",
        priority: 100,
        require: "ngModel",
        link: function (a, c, d, e) {
          var f = c.attr(d.$attr.ngList) || ", ",
            g = "false" !== d.ngTrim,
            h = g ? R(f) : f;
          e.$parsers.push(function (a) {
            if (!A(a)) {
              var c = [];
              a &&
                m(a.split(h), function (a) {
                  a && c.push(g ? R(a) : a);
                });
              return c;
            }
          });
          e.$formatters.push(function (a) {
            return G(a) ? a.join(f) : t;
          });
          e.$isEmpty = function (a) {
            return !a || !a.length;
          };
        },
      };
    },
    mb = "ng-valid",
    Kd = "ng-invalid",
    Va = "ng-pristine",
    Jb = "ng-dirty",
    Md = "ng-pending",
    Lb = new J("ngModel"),
    wg = [
      "$scope",
      "$exceptionHandler",
      "$attrs",
      "$element",
      "$parse",
      "$animate",
      "$timeout",
      "$rootScope",
      "$q",
      "$interpolate",
      function (a, c, d, e, f, g, h, l, k, n) {
        this.$modelValue = this.$viewValue = Number.NaN;
        this.$$rawModelValue = t;
        this.$validators = {};
        this.$asyncValidators = {};
        this.$parsers = [];
        this.$formatters = [];
        this.$viewChangeListeners = [];
        this.$untouched = !0;
        this.$touched = !1;
        this.$pristine = !0;
        this.$dirty = !1;
        this.$valid = !0;
        this.$invalid = !1;
        this.$error = {};
        this.$$success = {};
        this.$pending = t;
        this.$name = n(d.name || "", !1)(a);
        var r = f(d.ngModel),
          s = r.assign,
          q = r,
          C = s,
          F = null,
          u,
          p = this;
        this.$$setOptions = function (a) {
          if ((p.$options = a) && a.getterSetter) {
            var c = f(d.ngModel + "()"),
              g = f(d.ngModel + "($$$p)");
            q = function (a) {
              var d = r(a);
              z(d) && (d = c(a));
              return d;
            };
            C = function (a, c) {
              z(r(a)) ? g(a, { $$$p: p.$modelValue }) : s(a, p.$modelValue);
            };
          } else if (!r.assign) throw Lb("nonassign", d.ngModel, ua(e));
        };
        this.$render = v;
        this.$isEmpty = function (a) {
          return A(a) || "" === a || null === a || a !== a;
        };
        var K = e.inheritedData("$formController") || Ib,
          y = 0;
        Hd({
          ctrl: this,
          $element: e,
          set: function (a, c) {
            a[c] = !0;
          },
          unset: function (a, c) {
            delete a[c];
          },
          parentForm: K,
          $animate: g,
        });
        this.$setPristine = function () {
          p.$dirty = !1;
          p.$pristine = !0;
          g.removeClass(e, Jb);
          g.addClass(e, Va);
        };
        this.$setDirty = function () {
          p.$dirty = !0;
          p.$pristine = !1;
          g.removeClass(e, Va);
          g.addClass(e, Jb);
          K.$setDirty();
        };
        this.$setUntouched = function () {
          p.$touched = !1;
          p.$untouched = !0;
          g.setClass(e, "ng-untouched", "ng-touched");
        };
        this.$setTouched = function () {
          p.$touched = !0;
          p.$untouched = !1;
          g.setClass(e, "ng-touched", "ng-untouched");
        };
        this.$rollbackViewValue = function () {
          h.cancel(F);
          p.$viewValue = p.$$lastCommittedViewValue;
          p.$render();
        };
        this.$validate = function () {
          if (!V(p.$modelValue) || !isNaN(p.$modelValue)) {
            var a = p.$$rawModelValue,
              c = p.$valid,
              d = p.$modelValue,
              e = p.$options && p.$options.allowInvalid;
            p.$$runValidators(a, p.$$lastCommittedViewValue, function (f) {
              e ||
                c === f ||
                ((p.$modelValue = f ? a : t),
                p.$modelValue !== d && p.$$writeModelToScope());
            });
          }
        };
        this.$$runValidators = function (a, c, d) {
          function e() {
            var d = !0;
            m(p.$validators, function (e, f) {
              var h = e(a, c);
              d = d && h;
              g(f, h);
            });
            return d
              ? !0
              : (m(p.$asyncValidators, function (a, c) {
                  g(c, null);
                }),
                !1);
          }
          function f() {
            var d = [],
              e = !0;
            m(p.$asyncValidators, function (f, h) {
              var k = f(a, c);
              if (!k || !z(k.then)) throw Lb("$asyncValidators", k);
              g(h, t);
              d.push(
                k.then(
                  function () {
                    g(h, !0);
                  },
                  function (a) {
                    e = !1;
                    g(h, !1);
                  }
                )
              );
            });
            d.length
              ? k.all(d).then(function () {
                  h(e);
                }, v)
              : h(!0);
          }
          function g(a, c) {
            l === y && p.$setValidity(a, c);
          }
          function h(a) {
            l === y && d(a);
          }
          y++;
          var l = y;
          (function () {
            var a = p.$$parserName || "parse";
            if (u === t) g(a, null);
            else
              return (
                u ||
                  (m(p.$validators, function (a, c) {
                    g(c, null);
                  }),
                  m(p.$asyncValidators, function (a, c) {
                    g(c, null);
                  })),
                g(a, u),
                u
              );
            return !0;
          })()
            ? e()
              ? f()
              : h(!1)
            : h(!1);
        };
        this.$commitViewValue = function () {
          var a = p.$viewValue;
          h.cancel(F);
          if (
            p.$$lastCommittedViewValue !== a ||
            ("" === a && p.$$hasNativeValidators)
          )
            (p.$$lastCommittedViewValue = a),
              p.$pristine && this.$setDirty(),
              this.$$parseAndValidate();
        };
        this.$$parseAndValidate = function () {
          var c = p.$$lastCommittedViewValue;
          if ((u = A(c) ? t : !0))
            for (var d = 0; d < p.$parsers.length; d++)
              if (((c = p.$parsers[d](c)), A(c))) {
                u = !1;
                break;
              }
          V(p.$modelValue) && isNaN(p.$modelValue) && (p.$modelValue = q(a));
          var e = p.$modelValue,
            f = p.$options && p.$options.allowInvalid;
          p.$$rawModelValue = c;
          f &&
            ((p.$modelValue = c),
            p.$modelValue !== e && p.$$writeModelToScope());
          p.$$runValidators(c, p.$$lastCommittedViewValue, function (a) {
            f ||
              ((p.$modelValue = a ? c : t),
              p.$modelValue !== e && p.$$writeModelToScope());
          });
        };
        this.$$writeModelToScope = function () {
          C(a, p.$modelValue);
          m(p.$viewChangeListeners, function (a) {
            try {
              a();
            } catch (d) {
              c(d);
            }
          });
        };
        this.$setViewValue = function (a, c) {
          p.$viewValue = a;
          (p.$options && !p.$options.updateOnDefault) ||
            p.$$debounceViewValueCommit(c);
        };
        this.$$debounceViewValueCommit = function (c) {
          var d = 0,
            e = p.$options;
          e &&
            w(e.debounce) &&
            ((e = e.debounce),
            V(e)
              ? (d = e)
              : V(e[c])
              ? (d = e[c])
              : V(e["default"]) && (d = e["default"]));
          h.cancel(F);
          d
            ? (F = h(function () {
                p.$commitViewValue();
              }, d))
            : l.$$phase
            ? p.$commitViewValue()
            : a.$apply(function () {
                p.$commitViewValue();
              });
        };
        a.$watch(function () {
          var c = q(a);
          if (
            c !== p.$modelValue &&
            (p.$modelValue === p.$modelValue || c === c)
          ) {
            p.$modelValue = p.$$rawModelValue = c;
            u = t;
            for (var d = p.$formatters, e = d.length, f = c; e--; ) f = d[e](f);
            p.$viewValue !== f &&
              ((p.$viewValue = p.$$lastCommittedViewValue = f),
              p.$render(),
              p.$$runValidators(c, f, v));
          }
          return c;
        });
      },
    ],
    Le = [
      "$rootScope",
      function (a) {
        return {
          restrict: "A",
          require: ["ngModel", "^?form", "^?ngModelOptions"],
          controller: wg,
          priority: 1,
          compile: function (c) {
            c.addClass(Va).addClass("ng-untouched").addClass(mb);
            return {
              pre: function (a, c, f, g) {
                var h = g[0],
                  l = g[1] || Ib;
                h.$$setOptions(g[2] && g[2].$options);
                l.$addControl(h);
                f.$observe("name", function (a) {
                  h.$name !== a && l.$$renameControl(h, a);
                });
                a.$on("$destroy", function () {
                  l.$removeControl(h);
                });
              },
              post: function (c, e, f, g) {
                var h = g[0];
                if (h.$options && h.$options.updateOn)
                  e.on(h.$options.updateOn, function (a) {
                    h.$$debounceViewValueCommit(a && a.type);
                  });
                e.on("blur", function (e) {
                  h.$touched ||
                    (a.$$phase
                      ? c.$evalAsync(h.$setTouched)
                      : c.$apply(h.$setTouched));
                });
              },
            };
          },
        };
      },
    ],
    xg = /(\s+|^)default(\s+|$)/,
    Pe = function () {
      return {
        restrict: "A",
        controller: [
          "$scope",
          "$attrs",
          function (a, c) {
            var d = this;
            this.$options = fa(a.$eval(c.ngModelOptions));
            this.$options.updateOn !== t
              ? ((this.$options.updateOnDefault = !1),
                (this.$options.updateOn = R(
                  this.$options.updateOn.replace(xg, function () {
                    d.$options.updateOnDefault = !0;
                    return " ";
                  })
                )))
              : (this.$options.updateOnDefault = !0);
          },
        ],
      };
    },
    Be = Ma({ terminal: !0, priority: 1e3 }),
    yg = J("ngOptions"),
    zg =
      /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?(?:\s+disable\s+when\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/,
    Je = [
      "$compile",
      "$parse",
      function (a, c) {
        function d(a, d, e) {
          function f(a, c, d, e, g) {
            this.selectValue = a;
            this.viewValue = c;
            this.label = d;
            this.group = e;
            this.disabled = g;
          }
          function n(a) {
            var c;
            if (!q && Ea(a)) c = a;
            else {
              c = [];
              for (var d in a)
                a.hasOwnProperty(d) && "$" !== d.charAt(0) && c.push(d);
            }
            return c;
          }
          var m = a.match(zg);
          if (!m) throw yg("iexp", a, ua(d));
          var s = m[5] || m[7],
            q = m[6];
          a = / as /.test(m[0]) && m[1];
          var t = m[9];
          d = c(m[2] ? m[1] : s);
          var v = (a && c(a)) || d,
            u = t && c(t),
            p = t
              ? function (a, c) {
                  return u(e, c);
                }
              : function (a) {
                  return Ga(a);
                },
            w = function (a, c) {
              return p(a, z(a, c));
            },
            y = c(m[2] || m[1]),
            A = c(m[3] || ""),
            B = c(m[4] || ""),
            N = c(m[8]),
            D = {},
            z = q
              ? function (a, c) {
                  D[q] = c;
                  D[s] = a;
                  return D;
                }
              : function (a) {
                  D[s] = a;
                  return D;
                };
          return {
            trackBy: t,
            getTrackByValue: w,
            getWatchables: c(N, function (a) {
              var c = [];
              a = a || [];
              for (var d = n(a), f = d.length, g = 0; g < f; g++) {
                var h = a === d ? g : d[g],
                  k = z(a[h], h),
                  h = p(a[h], k);
                c.push(h);
                if (m[2] || m[1]) (h = y(e, k)), c.push(h);
                m[4] && ((k = B(e, k)), c.push(k));
              }
              return c;
            }),
            getOptions: function () {
              for (
                var a = [],
                  c = {},
                  d = N(e) || [],
                  g = n(d),
                  h = g.length,
                  m = 0;
                m < h;
                m++
              ) {
                var r = d === g ? m : g[m],
                  s = z(d[r], r),
                  q = v(e, s),
                  r = p(q, s),
                  u = y(e, s),
                  x = A(e, s),
                  s = B(e, s),
                  q = new f(r, q, u, x, s);
                a.push(q);
                c[r] = q;
              }
              return {
                items: a,
                selectValueMap: c,
                getOptionFromViewValue: function (a) {
                  return c[w(a)];
                },
                getViewValueFromOption: function (a) {
                  return t ? ca.copy(a.viewValue) : a.viewValue;
                },
              };
            },
          };
        }
        var e = U.createElement("option"),
          f = U.createElement("optgroup");
        return {
          restrict: "A",
          terminal: !0,
          require: ["select", "?ngModel"],
          link: function (c, h, l, k) {
            function n(a, c) {
              a.element = c;
              c.disabled = a.disabled;
              a.value !== c.value && (c.value = a.selectValue);
              a.label !== c.label &&
                ((c.label = a.label), (c.textContent = a.label));
            }
            function r(a, c, d, e) {
              c && M(c.nodeName) === d
                ? (d = c)
                : ((d = e.cloneNode(!1)),
                  c ? a.insertBefore(d, c) : a.appendChild(d));
              return d;
            }
            function s(a) {
              for (var c; a; ) (c = a.nextSibling), Xb(a), (a = c);
            }
            function q(a) {
              var c = p && p[0],
                d = N && N[0];
              if (c || d) for (; a && (a === c || a === d); ) a = a.nextSibling;
              return a;
            }
            function t() {
              var a = D && u.readValue();
              D = z.getOptions();
              var c = {},
                d = h[0].firstChild;
              B && h.prepend(p);
              d = q(d);
              D.items.forEach(function (a) {
                var g, k;
                a.group
                  ? ((g = c[a.group]),
                    g ||
                      ((g = r(h[0], d, "optgroup", f)),
                      (d = g.nextSibling),
                      (g.label = a.group),
                      (g = c[a.group] =
                        {
                          groupElement: g,
                          currentOptionElement: g.firstChild,
                        })),
                    (k = r(
                      g.groupElement,
                      g.currentOptionElement,
                      "option",
                      e
                    )),
                    n(a, k),
                    (g.currentOptionElement = k.nextSibling))
                  : ((k = r(h[0], d, "option", e)),
                    n(a, k),
                    (d = k.nextSibling));
              });
              Object.keys(c).forEach(function (a) {
                s(c[a].currentOptionElement);
              });
              s(d);
              v.$render();
              if (!v.$isEmpty(a)) {
                var g = u.readValue();
                (z.trackBy ? ka(a, g) : a === g) ||
                  (v.$setViewValue(g), v.$render());
              }
            }
            var v = k[1];
            if (v) {
              var u = k[0];
              k = l.multiple;
              for (var p, w = 0, A = h.children(), I = A.length; w < I; w++)
                if ("" === A[w].value) {
                  p = A.eq(w);
                  break;
                }
              var B = !!p,
                N = y(e.cloneNode(!1));
              N.val("?");
              var D,
                z = d(l.ngOptions, h, c);
              k
                ? ((v.$isEmpty = function (a) {
                    return !a || 0 === a.length;
                  }),
                  (u.writeValue = function (a) {
                    D.items.forEach(function (a) {
                      a.element.selected = !1;
                    });
                    a &&
                      a.forEach(function (a) {
                        (a = D.getOptionFromViewValue(a)) &&
                          !a.disabled &&
                          (a.element.selected = !0);
                      });
                  }),
                  (u.readValue = function () {
                    var a = h.val() || [],
                      c = [];
                    m(a, function (a) {
                      a = D.selectValueMap[a];
                      a.disabled || c.push(D.getViewValueFromOption(a));
                    });
                    return c;
                  }),
                  z.trackBy &&
                    c.$watchCollection(
                      function () {
                        if (G(v.$viewValue))
                          return v.$viewValue.map(function (a) {
                            return z.getTrackByValue(a);
                          });
                      },
                      function () {
                        v.$render();
                      }
                    ))
                : ((u.writeValue = function (a) {
                    var c = D.getOptionFromViewValue(a);
                    c && !c.disabled
                      ? h[0].value !== c.selectValue &&
                        (N.remove(),
                        B || p.remove(),
                        (h[0].value = c.selectValue),
                        (c.element.selected = !0),
                        c.element.setAttribute("selected", "selected"))
                      : null === a || B
                      ? (N.remove(),
                        B || h.prepend(p),
                        h.val(""),
                        p.prop("selected", !0),
                        p.attr("selected", !0))
                      : (B || p.remove(),
                        h.prepend(N),
                        h.val("?"),
                        N.prop("selected", !0),
                        N.attr("selected", !0));
                  }),
                  (u.readValue = function () {
                    var a = D.selectValueMap[h.val()];
                    return a && !a.disabled
                      ? (B || p.remove(),
                        N.remove(),
                        D.getViewValueFromOption(a))
                      : null;
                  }),
                  z.trackBy &&
                    c.$watch(
                      function () {
                        return z.getTrackByValue(v.$viewValue);
                      },
                      function () {
                        v.$render();
                      }
                    ));
              B
                ? (p.remove(), a(p)(c), p.removeClass("ng-scope"))
                : (p = y(e.cloneNode(!1)));
              t();
              c.$watchCollection(z.getWatchables, t);
            }
          },
        };
      },
    ],
    Ce = [
      "$locale",
      "$interpolate",
      "$log",
      function (a, c, d) {
        var e = /{}/g,
          f = /^when(Minus)?(.+)$/;
        return {
          link: function (g, h, l) {
            function k(a) {
              h.text(a || "");
            }
            var n = l.count,
              r = l.$attr.when && h.attr(l.$attr.when),
              s = l.offset || 0,
              q = g.$eval(r) || {},
              t = {},
              w = c.startSymbol(),
              u = c.endSymbol(),
              p = w + n + "-" + s + u,
              y = ca.noop,
              z;
            m(l, function (a, c) {
              var d = f.exec(c);
              d &&
                ((d = (d[1] ? "-" : "") + M(d[2])),
                (q[d] = h.attr(l.$attr[c])));
            });
            m(q, function (a, d) {
              t[d] = c(a.replace(e, p));
            });
            g.$watch(n, function (c) {
              var e = parseFloat(c),
                f = isNaN(e);
              f || e in q || (e = a.pluralCat(e - s));
              e === z ||
                (f && V(z) && isNaN(z)) ||
                (y(),
                (f = t[e]),
                A(f)
                  ? (null != c &&
                      d.debug(
                        "ngPluralize: no rule defined for '" + e + "' in " + r
                      ),
                    (y = v),
                    k())
                  : (y = g.$watch(f, k)),
                (z = e));
            });
          },
        };
      },
    ],
    De = [
      "$parse",
      "$animate",
      function (a, c) {
        var d = J("ngRepeat"),
          e = function (a, c, d, e, k, m, r) {
            a[d] = e;
            k && (a[k] = m);
            a.$index = c;
            a.$first = 0 === c;
            a.$last = c === r - 1;
            a.$middle = !(a.$first || a.$last);
            a.$odd = !(a.$even = 0 === (c & 1));
          };
        return {
          restrict: "A",
          multiElement: !0,
          transclude: "element",
          priority: 1e3,
          terminal: !0,
          $$tlb: !0,
          compile: function (f, g) {
            var h = g.ngRepeat,
              l = U.createComment(" end ngRepeat: " + h + " "),
              k = h.match(
                /^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/
              );
            if (!k) throw d("iexp", h);
            var n = k[1],
              r = k[2],
              s = k[3],
              q = k[4],
              k = n.match(
                /^(?:(\s*[\$\w]+)|\(\s*([\$\w]+)\s*,\s*([\$\w]+)\s*\))$/
              );
            if (!k) throw d("iidexp", n);
            var v = k[3] || k[1],
              w = k[2];
            if (
              s &&
              (!/^[$a-zA-Z_][$a-zA-Z0-9_]*$/.test(s) ||
                /^(null|undefined|this|\$index|\$first|\$middle|\$last|\$even|\$odd|\$parent|\$root|\$id)$/.test(
                  s
                ))
            )
              throw d("badident", s);
            var u,
              p,
              z,
              A,
              I = { $id: Ga };
            q
              ? (u = a(q))
              : ((z = function (a, c) {
                  return Ga(c);
                }),
                (A = function (a) {
                  return a;
                }));
            return function (a, f, g, k, n) {
              u &&
                (p = function (c, d, e) {
                  w && (I[w] = c);
                  I[v] = d;
                  I.$index = e;
                  return u(a, I);
                });
              var q = ga();
              a.$watchCollection(r, function (g) {
                var k,
                  r,
                  u = f[0],
                  x,
                  D = ga(),
                  I,
                  H,
                  L,
                  G,
                  M,
                  J,
                  O;
                s && (a[s] = g);
                if (Ea(g)) (M = g), (r = p || z);
                else
                  for (O in ((r = p || A), (M = []), g))
                    g.hasOwnProperty(O) && "$" !== O.charAt(0) && M.push(O);
                I = M.length;
                O = Array(I);
                for (k = 0; k < I; k++)
                  if (
                    ((H = g === M ? k : M[k]),
                    (L = g[H]),
                    (G = r(H, L, k)),
                    q[G])
                  )
                    (J = q[G]), delete q[G], (D[G] = J), (O[k] = J);
                  else {
                    if (D[G])
                      throw (
                        (m(O, function (a) {
                          a && a.scope && (q[a.id] = a);
                        }),
                        d("dupes", h, G, L))
                      );
                    O[k] = { id: G, scope: t, clone: t };
                    D[G] = !0;
                  }
                for (x in q) {
                  J = q[x];
                  G = qb(J.clone);
                  c.leave(G);
                  if (G[0].parentNode)
                    for (k = 0, r = G.length; k < r; k++)
                      G[k].$$NG_REMOVED = !0;
                  J.scope.$destroy();
                }
                for (k = 0; k < I; k++)
                  if (
                    ((H = g === M ? k : M[k]), (L = g[H]), (J = O[k]), J.scope)
                  ) {
                    x = u;
                    do x = x.nextSibling;
                    while (x && x.$$NG_REMOVED);
                    J.clone[0] != x && c.move(qb(J.clone), null, y(u));
                    u = J.clone[J.clone.length - 1];
                    e(J.scope, k, v, L, w, H, I);
                  } else
                    n(function (a, d) {
                      J.scope = d;
                      var f = l.cloneNode(!1);
                      a[a.length++] = f;
                      c.enter(a, null, y(u));
                      u = f;
                      J.clone = a;
                      D[J.id] = J;
                      e(J.scope, k, v, L, w, H, I);
                    });
                q = D;
              });
            };
          },
        };
      },
    ],
    Ee = [
      "$animate",
      function (a) {
        return {
          restrict: "A",
          multiElement: !0,
          link: function (c, d, e) {
            c.$watch(e.ngShow, function (c) {
              a[c ? "removeClass" : "addClass"](d, "ng-hide", {
                tempClasses: "ng-hide-animate",
              });
            });
          },
        };
      },
    ],
    xe = [
      "$animate",
      function (a) {
        return {
          restrict: "A",
          multiElement: !0,
          link: function (c, d, e) {
            c.$watch(e.ngHide, function (c) {
              a[c ? "addClass" : "removeClass"](d, "ng-hide", {
                tempClasses: "ng-hide-animate",
              });
            });
          },
        };
      },
    ],
    Fe = Ma(function (a, c, d) {
      a.$watch(
        d.ngStyle,
        function (a, d) {
          d &&
            a !== d &&
            m(d, function (a, d) {
              c.css(d, "");
            });
          a && c.css(a);
        },
        !0
      );
    }),
    Ge = [
      "$animate",
      function (a) {
        return {
          require: "ngSwitch",
          controller: [
            "$scope",
            function () {
              this.cases = {};
            },
          ],
          link: function (c, d, e, f) {
            var g = [],
              h = [],
              l = [],
              k = [],
              n = function (a, c) {
                return function () {
                  a.splice(c, 1);
                };
              };
            c.$watch(e.ngSwitch || e.on, function (c) {
              var d, e;
              d = 0;
              for (e = l.length; d < e; ++d) a.cancel(l[d]);
              d = l.length = 0;
              for (e = k.length; d < e; ++d) {
                var q = qb(h[d].clone);
                k[d].$destroy();
                (l[d] = a.leave(q)).then(n(l, d));
              }
              h.length = 0;
              k.length = 0;
              (g = f.cases["!" + c] || f.cases["?"]) &&
                m(g, function (c) {
                  c.transclude(function (d, e) {
                    k.push(e);
                    var f = c.element;
                    d[d.length++] = U.createComment(" end ngSwitchWhen: ");
                    h.push({ clone: d });
                    a.enter(d, f.parent(), f);
                  });
                });
            });
          },
        };
      },
    ],
    He = Ma({
      transclude: "element",
      priority: 1200,
      require: "^ngSwitch",
      multiElement: !0,
      link: function (a, c, d, e, f) {
        e.cases["!" + d.ngSwitchWhen] = e.cases["!" + d.ngSwitchWhen] || [];
        e.cases["!" + d.ngSwitchWhen].push({ transclude: f, element: c });
      },
    }),
    Ie = Ma({
      transclude: "element",
      priority: 1200,
      require: "^ngSwitch",
      multiElement: !0,
      link: function (a, c, d, e, f) {
        e.cases["?"] = e.cases["?"] || [];
        e.cases["?"].push({ transclude: f, element: c });
      },
    }),
    Ke = Ma({
      restrict: "EAC",
      link: function (a, c, d, e, f) {
        if (!f) throw J("ngTransclude")("orphan", ua(c));
        f(function (a) {
          c.empty();
          c.append(a);
        });
      },
    }),
    ke = [
      "$templateCache",
      function (a) {
        return {
          restrict: "E",
          terminal: !0,
          compile: function (c, d) {
            "text/ng-template" == d.type && a.put(d.id, c[0].text);
          },
        };
      },
    ],
    Ag = { $setViewValue: v, $render: v },
    Bg = [
      "$element",
      "$scope",
      "$attrs",
      function (a, c, d) {
        var e = this,
          f = new Sa();
        e.ngModelCtrl = Ag;
        e.unknownOption = y(U.createElement("option"));
        e.renderUnknownOption = function (c) {
          c = "? " + Ga(c) + " ?";
          e.unknownOption.val(c);
          a.prepend(e.unknownOption);
          a.val(c);
        };
        c.$on("$destroy", function () {
          e.renderUnknownOption = v;
        });
        e.removeUnknownOption = function () {
          e.unknownOption.parent() && e.unknownOption.remove();
        };
        e.readValue = function () {
          e.removeUnknownOption();
          return a.val();
        };
        e.writeValue = function (c) {
          e.hasOption(c)
            ? (e.removeUnknownOption(),
              a.val(c),
              "" === c && e.emptyOption.prop("selected", !0))
            : null == c && e.emptyOption
            ? (e.removeUnknownOption(), a.val(""))
            : e.renderUnknownOption(c);
        };
        e.addOption = function (a, c) {
          Ra(a, '"option value"');
          "" === a && (e.emptyOption = c);
          var d = f.get(a) || 0;
          f.put(a, d + 1);
        };
        e.removeOption = function (a) {
          var c = f.get(a);
          c &&
            (1 === c
              ? (f.remove(a), "" === a && (e.emptyOption = t))
              : f.put(a, c - 1));
        };
        e.hasOption = function (a) {
          return !!f.get(a);
        };
      },
    ],
    le = function () {
      return {
        restrict: "E",
        require: ["select", "?ngModel"],
        controller: Bg,
        link: function (a, c, d, e) {
          var f = e[1];
          if (f) {
            var g = e[0];
            g.ngModelCtrl = f;
            f.$render = function () {
              g.writeValue(f.$viewValue);
            };
            c.on("change", function () {
              a.$apply(function () {
                f.$setViewValue(g.readValue());
              });
            });
            if (d.multiple) {
              g.readValue = function () {
                var a = [];
                m(c.find("option"), function (c) {
                  c.selected && a.push(c.value);
                });
                return a;
              };
              g.writeValue = function (a) {
                var d = new Sa(a);
                m(c.find("option"), function (a) {
                  a.selected = w(d.get(a.value));
                });
              };
              var h,
                l = NaN;
              a.$watch(function () {
                l !== f.$viewValue ||
                  ka(h, f.$viewValue) ||
                  ((h = ia(f.$viewValue)), f.$render());
                l = f.$viewValue;
              });
              f.$isEmpty = function (a) {
                return !a || 0 === a.length;
              };
            }
          }
        },
      };
    },
    ne = [
      "$interpolate",
      function (a) {
        function c(a) {
          a[0].hasAttribute("selected") && (a[0].selected = !0);
        }
        return {
          restrict: "E",
          priority: 100,
          compile: function (d, e) {
            if (A(e.value)) {
              var f = a(d.text(), !0);
              f || e.$set("value", d.text());
            }
            return function (a, d, e) {
              var k = d.parent(),
                m =
                  k.data("$selectController") ||
                  k.parent().data("$selectController");
              m &&
                m.ngModelCtrl &&
                (f
                  ? a.$watch(f, function (a, f) {
                      e.$set("value", a);
                      f !== a && m.removeOption(f);
                      m.addOption(a, d);
                      m.ngModelCtrl.$render();
                      c(d);
                    })
                  : (m.addOption(e.value, d), m.ngModelCtrl.$render(), c(d)),
                d.on("$destroy", function () {
                  m.removeOption(e.value);
                  m.ngModelCtrl.$render();
                }));
            };
          },
        };
      },
    ],
    me = ra({ restrict: "E", terminal: !1 }),
    Hc = function () {
      return {
        restrict: "A",
        require: "?ngModel",
        link: function (a, c, d, e) {
          e &&
            ((d.required = !0),
            (e.$validators.required = function (a, c) {
              return !d.required || !e.$isEmpty(c);
            }),
            d.$observe("required", function () {
              e.$validate();
            }));
        },
      };
    },
    Gc = function () {
      return {
        restrict: "A",
        require: "?ngModel",
        link: function (a, c, d, e) {
          if (e) {
            var f,
              g = d.ngPattern || d.pattern;
            d.$observe("pattern", function (a) {
              L(a) && 0 < a.length && (a = new RegExp("^" + a + "$"));
              if (a && !a.test) throw J("ngPattern")("noregexp", g, a, ua(c));
              f = a || t;
              e.$validate();
            });
            e.$validators.pattern = function (a) {
              return e.$isEmpty(a) || A(f) || f.test(a);
            };
          }
        },
      };
    },
    Jc = function () {
      return {
        restrict: "A",
        require: "?ngModel",
        link: function (a, c, d, e) {
          if (e) {
            var f = -1;
            d.$observe("maxlength", function (a) {
              a = W(a);
              f = isNaN(a) ? -1 : a;
              e.$validate();
            });
            e.$validators.maxlength = function (a, c) {
              return 0 > f || e.$isEmpty(c) || c.length <= f;
            };
          }
        },
      };
    },
    Ic = function () {
      return {
        restrict: "A",
        require: "?ngModel",
        link: function (a, c, d, e) {
          if (e) {
            var f = 0;
            d.$observe("minlength", function (a) {
              f = W(a) || 0;
              e.$validate();
            });
            e.$validators.minlength = function (a, c) {
              return e.$isEmpty(c) || c.length >= f;
            };
          }
        },
      };
    };
  O.angular.bootstrap
    ? console.log("WARNING: Tried to load angular more than once.")
    : (ce(),
      ee(ca),
      y(U).ready(function () {
        Zd(U, Ac);
      }));
})(window, document);
!window.angular.$$csp() &&
  window.angular
    .element(document.head)
    .prepend(
      '<style type="text/css">@charset "UTF-8";[ng\\:cloak],[ng-cloak],[data-ng-cloak],[x-ng-cloak],.ng-cloak,.x-ng-cloak,.ng-hide:not(.ng-hide-animate){display:none !important;}ng\\:form{display:block;}.ng-animate-shim{visibility:hidden;}.ng-anchor{position:absolute;}</style>'
    );
(function (p, c, C) {
  "use strict";
  function v(r, h, g) {
    return {
      restrict: "ECA",
      terminal: !0,
      priority: 400,
      transclude: "element",
      link: function (a, f, b, d, y) {
        function z() {
          k && (g.cancel(k), (k = null));
          l && (l.$destroy(), (l = null));
          m &&
            ((k = g.leave(m)),
            k.then(function () {
              k = null;
            }),
            (m = null));
        }
        function x() {
          var b = r.current && r.current.locals;
          if (c.isDefined(b && b.$template)) {
            var b = a.$new(),
              d = r.current;
            m = y(b, function (b) {
              g.enter(b, null, m || f).then(function () {
                !c.isDefined(t) || (t && !a.$eval(t)) || h();
              });
              z();
            });
            l = d.scope = b;
            l.$emit("$viewContentLoaded");
            l.$eval(w);
          } else z();
        }
        var l,
          m,
          k,
          t = b.autoscroll,
          w = b.onload || "";
        a.$on("$routeChangeSuccess", x);
        x();
      },
    };
  }
  function A(c, h, g) {
    return {
      restrict: "ECA",
      priority: -400,
      link: function (a, f) {
        var b = g.current,
          d = b.locals;
        f.html(d.$template);
        var y = c(f.contents());
        b.controller &&
          ((d.$scope = a),
          (d = h(b.controller, d)),
          b.controllerAs && (a[b.controllerAs] = d),
          f.data("$ngControllerController", d),
          f.children().data("$ngControllerController", d));
        y(a);
      },
    };
  }
  p = c.module("ngRoute", ["ng"]).provider("$route", function () {
    function r(a, f) {
      return c.extend(Object.create(a), f);
    }
    function h(a, c) {
      var b = c.caseInsensitiveMatch,
        d = { originalPath: a, regexp: a },
        g = (d.keys = []);
      a = a
        .replace(/([().])/g, "\\$1")
        .replace(/(\/)?:(\w+)([\?\*])?/g, function (a, c, b, d) {
          a = "?" === d ? d : null;
          d = "*" === d ? d : null;
          g.push({ name: b, optional: !!a });
          c = c || "";
          return (
            "" +
            (a ? "" : c) +
            "(?:" +
            (a ? c : "") +
            ((d && "(.+?)") || "([^/]+)") +
            (a || "") +
            ")" +
            (a || "")
          );
        })
        .replace(/([\/$\*])/g, "\\$1");
      d.regexp = new RegExp("^" + a + "$", b ? "i" : "");
      return d;
    }
    var g = {};
    this.when = function (a, f) {
      var b = c.copy(f);
      c.isUndefined(b.reloadOnSearch) && (b.reloadOnSearch = !0);
      c.isUndefined(b.caseInsensitiveMatch) &&
        (b.caseInsensitiveMatch = this.caseInsensitiveMatch);
      g[a] = c.extend(b, a && h(a, b));
      if (a) {
        var d = "/" == a[a.length - 1] ? a.substr(0, a.length - 1) : a + "/";
        g[d] = c.extend({ redirectTo: a }, h(d, b));
      }
      return this;
    };
    this.caseInsensitiveMatch = !1;
    this.otherwise = function (a) {
      "string" === typeof a && (a = { redirectTo: a });
      this.when(null, a);
      return this;
    };
    this.$get = [
      "$rootScope",
      "$location",
      "$routeParams",
      "$q",
      "$injector",
      "$templateRequest",
      "$sce",
      function (a, f, b, d, h, p, x) {
        function l(b) {
          var e = s.current;
          (v =
            (n = k()) &&
            e &&
            n.$$route === e.$$route &&
            c.equals(n.pathParams, e.pathParams) &&
            !n.reloadOnSearch &&
            !w) ||
            (!e && !n) ||
            (a.$broadcast("$routeChangeStart", n, e).defaultPrevented &&
              b &&
              b.preventDefault());
        }
        function m() {
          var u = s.current,
            e = n;
          if (v)
            (u.params = e.params),
              c.copy(u.params, b),
              a.$broadcast("$routeUpdate", u);
          else if (e || u)
            (w = !1),
              (s.current = e) &&
                e.redirectTo &&
                (c.isString(e.redirectTo)
                  ? f.path(t(e.redirectTo, e.params)).search(e.params).replace()
                  : f
                      .url(e.redirectTo(e.pathParams, f.path(), f.search()))
                      .replace()),
              d
                .when(e)
                .then(function () {
                  if (e) {
                    var a = c.extend({}, e.resolve),
                      b,
                      f;
                    c.forEach(a, function (b, e) {
                      a[e] = c.isString(b)
                        ? h.get(b)
                        : h.invoke(b, null, null, e);
                    });
                    c.isDefined((b = e.template))
                      ? c.isFunction(b) && (b = b(e.params))
                      : c.isDefined((f = e.templateUrl)) &&
                        (c.isFunction(f) && (f = f(e.params)),
                        c.isDefined(f) &&
                          ((e.loadedTemplateUrl = x.valueOf(f)), (b = p(f))));
                    c.isDefined(b) && (a.$template = b);
                    return d.all(a);
                  }
                })
                .then(
                  function (f) {
                    e == s.current &&
                      (e && ((e.locals = f), c.copy(e.params, b)),
                      a.$broadcast("$routeChangeSuccess", e, u));
                  },
                  function (b) {
                    e == s.current &&
                      a.$broadcast("$routeChangeError", e, u, b);
                  }
                );
        }
        function k() {
          var a, b;
          c.forEach(g, function (d, g) {
            var q;
            if ((q = !b)) {
              var h = f.path();
              q = d.keys;
              var l = {};
              if (d.regexp)
                if ((h = d.regexp.exec(h))) {
                  for (var k = 1, m = h.length; k < m; ++k) {
                    var n = q[k - 1],
                      p = h[k];
                    n && p && (l[n.name] = p);
                  }
                  q = l;
                } else q = null;
              else q = null;
              q = a = q;
            }
            q &&
              ((b = r(d, {
                params: c.extend({}, f.search(), a),
                pathParams: a,
              })),
              (b.$$route = d));
          });
          return b || (g[null] && r(g[null], { params: {}, pathParams: {} }));
        }
        function t(a, b) {
          var d = [];
          c.forEach((a || "").split(":"), function (a, c) {
            if (0 === c) d.push(a);
            else {
              var f = a.match(/(\w+)(?:[?*])?(.*)/),
                g = f[1];
              d.push(b[g]);
              d.push(f[2] || "");
              delete b[g];
            }
          });
          return d.join("");
        }
        var w = !1,
          n,
          v,
          s = {
            routes: g,
            reload: function () {
              w = !0;
              a.$evalAsync(function () {
                l();
                m();
              });
            },
            updateParams: function (a) {
              if (this.current && this.current.$$route)
                (a = c.extend({}, this.current.params, a)),
                  f.path(t(this.current.$$route.originalPath, a)),
                  f.search(a);
              else throw B("norout");
            },
          };
        a.$on("$locationChangeStart", l);
        a.$on("$locationChangeSuccess", m);
        return s;
      },
    ];
  });
  var B = c.$$minErr("ngRoute");
  p.provider("$routeParams", function () {
    this.$get = function () {
      return {};
    };
  });
  p.directive("ngView", v);
  p.directive("ngView", A);
  v.$inject = ["$route", "$anchorScroll", "$animate"];
  A.$inject = ["$compile", "$controller", "$route"];
})(window, window.angular);
(function (F, t, W) {
  "use strict";
  function ua(a, b, c) {
    if (!a) throw ngMinErr("areq", b || "?", c || "required");
    return a;
  }
  function va(a, b) {
    if (!a && !b) return "";
    if (!a) return b;
    if (!b) return a;
    X(a) && (a = a.join(" "));
    X(b) && (b = b.join(" "));
    return a + " " + b;
  }
  function Ea(a) {
    var b = {};
    a && (a.to || a.from) && ((b.to = a.to), (b.from = a.from));
    return b;
  }
  function ba(a, b, c) {
    var d = "";
    a = X(a) ? a : a && U(a) && a.length ? a.split(/\s+/) : [];
    u(a, function (a, s) {
      a && 0 < a.length && ((d += 0 < s ? " " : ""), (d += c ? b + a : a + b));
    });
    return d;
  }
  function Fa(a) {
    if (a instanceof G)
      switch (a.length) {
        case 0:
          return [];
        case 1:
          if (1 === a[0].nodeType) return a;
          break;
        default:
          return G(ka(a));
      }
    if (1 === a.nodeType) return G(a);
  }
  function ka(a) {
    if (!a[0]) return a;
    for (var b = 0; b < a.length; b++) {
      var c = a[b];
      if (1 == c.nodeType) return c;
    }
  }
  function Ga(a, b, c) {
    u(b, function (b) {
      a.addClass(b, c);
    });
  }
  function Ha(a, b, c) {
    u(b, function (b) {
      a.removeClass(b, c);
    });
  }
  function ha(a) {
    return function (b, c) {
      c.addClass && (Ga(a, b, c.addClass), (c.addClass = null));
      c.removeClass && (Ha(a, b, c.removeClass), (c.removeClass = null));
    };
  }
  function ia(a) {
    a = a || {};
    if (!a.$$prepared) {
      var b = a.domOperation || H;
      a.domOperation = function () {
        a.$$domOperationFired = !0;
        b();
        b = H;
      };
      a.$$prepared = !0;
    }
    return a;
  }
  function ca(a, b) {
    wa(a, b);
    xa(a, b);
  }
  function wa(a, b) {
    b.from && (a.css(b.from), (b.from = null));
  }
  function xa(a, b) {
    b.to && (a.css(b.to), (b.to = null));
  }
  function R(a, b, c) {
    var d = (b.addClass || "") + " " + (c.addClass || ""),
      e = (b.removeClass || "") + " " + (c.removeClass || "");
    a = Ia(a.attr("class"), d, e);
    ya(b, c);
    b.addClass = a.addClass ? a.addClass : null;
    b.removeClass = a.removeClass ? a.removeClass : null;
    return b;
  }
  function Ia(a, b, c) {
    function d(a) {
      U(a) && (a = a.split(" "));
      var b = {};
      u(a, function (a) {
        a.length && (b[a] = !0);
      });
      return b;
    }
    var e = {};
    a = d(a);
    b = d(b);
    u(b, function (a, b) {
      e[b] = 1;
    });
    c = d(c);
    u(c, function (a, b) {
      e[b] = 1 === e[b] ? null : -1;
    });
    var s = { addClass: "", removeClass: "" };
    u(e, function (b, c) {
      var d, e;
      1 === b
        ? ((d = "addClass"), (e = !a[c]))
        : -1 === b && ((d = "removeClass"), (e = a[c]));
      e && (s[d].length && (s[d] += " "), (s[d] += c));
    });
    return s;
  }
  function z(a) {
    return a instanceof t.element ? a[0] : a;
  }
  function za(a, b, c) {
    var d = Object.create(null),
      e = a.getComputedStyle(b) || {};
    u(c, function (a, b) {
      var c = e[a];
      if (c) {
        var k = c.charAt(0);
        if ("-" === k || "+" === k || 0 <= k) c = Ja(c);
        0 === c && (c = null);
        d[b] = c;
      }
    });
    return d;
  }
  function Ja(a) {
    var b = 0;
    a = a.split(/\s*,\s*/);
    u(a, function (a) {
      "s" == a.charAt(a.length - 1) && (a = a.substring(0, a.length - 1));
      a = parseFloat(a) || 0;
      b = b ? Math.max(a, b) : a;
    });
    return b;
  }
  function la(a) {
    return 0 === a || null != a;
  }
  function Aa(a, b) {
    var c = O,
      d = a + "s";
    b ? (c += "Duration") : (d += " linear all");
    return [c, d];
  }
  function ja(a, b) {
    var c = b ? "-" + b + "s" : "";
    da(a, [ea, c]);
    return [ea, c];
  }
  function ma(a, b) {
    var c = b ? "paused" : "",
      d = V + "PlayState";
    da(a, [d, c]);
    return [d, c];
  }
  function da(a, b) {
    a.style[b[0]] = b[1];
  }
  function Ba() {
    var a = Object.create(null);
    return {
      flush: function () {
        a = Object.create(null);
      },
      count: function (b) {
        return (b = a[b]) ? b.total : 0;
      },
      get: function (b) {
        return (b = a[b]) && b.value;
      },
      put: function (b, c) {
        a[b] ? a[b].total++ : (a[b] = { total: 1, value: c });
      },
    };
  }
  var H = t.noop,
    ya = t.extend,
    G = t.element,
    u = t.forEach,
    X = t.isArray,
    U = t.isString,
    na = t.isObject,
    Ka = t.isUndefined,
    La = t.isDefined,
    Ca = t.isFunction,
    oa = t.isElement,
    O,
    pa,
    V,
    qa;
  F.ontransitionend === W && F.onwebkittransitionend !== W
    ? ((O = "WebkitTransition"), (pa = "webkitTransitionEnd transitionend"))
    : ((O = "transition"), (pa = "transitionend"));
  F.onanimationend === W && F.onwebkitanimationend !== W
    ? ((V = "WebkitAnimation"), (qa = "webkitAnimationEnd animationend"))
    : ((V = "animation"), (qa = "animationend"));
  var ra = V + "Delay",
    sa = V + "Duration",
    ea = O + "Delay";
  F = O + "Duration";
  var Ma = {
      transitionDuration: F,
      transitionDelay: ea,
      transitionProperty: O + "Property",
      animationDuration: sa,
      animationDelay: ra,
      animationIterationCount: V + "IterationCount",
    },
    Na = {
      transitionDuration: F,
      transitionDelay: ea,
      animationDuration: sa,
      animationDelay: ra,
    };
  t.module("ngAnimate", [])
    .directive("ngAnimateChildren", [
      function () {
        return function (a, b, c) {
          a = c.ngAnimateChildren;
          t.isString(a) && 0 === a.length
            ? b.data("$$ngAnimateChildren", !0)
            : c.$observe("ngAnimateChildren", function (a) {
                b.data("$$ngAnimateChildren", "on" === a || "true" === a);
              });
        };
      },
    ])
    .factory("$$rAFMutex", [
      "$$rAF",
      function (a) {
        return function () {
          var b = !1;
          a(function () {
            b = !0;
          });
          return function (c) {
            b ? c() : a(c);
          };
        };
      },
    ])
    .factory("$$rAFScheduler", [
      "$$rAF",
      function (a) {
        function b(a) {
          d.push([].concat(a));
          c();
        }
        function c() {
          if (d.length) {
            for (var b = [], n = 0; n < d.length; n++) {
              var h = d[n];
              h.shift()();
              h.length && b.push(h);
            }
            d = b;
            e ||
              a(function () {
                e || c();
              });
          }
        }
        var d = [],
          e;
        b.waitUntilQuiet = function (b) {
          e && e();
          e = a(function () {
            e = null;
            b();
            c();
          });
        };
        return b;
      },
    ])
    .factory("$$AnimateRunner", [
      "$q",
      "$$rAFMutex",
      function (a, b) {
        function c(a) {
          this.setHost(a);
          this._doneCallbacks = [];
          this._runInAnimationFrame = b();
          this._state = 0;
        }
        c.chain = function (a, b) {
          function c() {
            if (n === a.length) b(!0);
            else
              a[n](function (a) {
                !1 === a ? b(!1) : (n++, c());
              });
          }
          var n = 0;
          c();
        };
        c.all = function (a, b) {
          function c(s) {
            h = h && s;
            ++n === a.length && b(h);
          }
          var n = 0,
            h = !0;
          u(a, function (a) {
            a.done(c);
          });
        };
        c.prototype = {
          setHost: function (a) {
            this.host = a || {};
          },
          done: function (a) {
            2 === this._state ? a() : this._doneCallbacks.push(a);
          },
          progress: H,
          getPromise: function () {
            if (!this.promise) {
              var b = this;
              this.promise = a(function (a, c) {
                b.done(function (b) {
                  !1 === b ? c() : a();
                });
              });
            }
            return this.promise;
          },
          then: function (a, b) {
            return this.getPromise().then(a, b);
          },
          catch: function (a) {
            return this.getPromise()["catch"](a);
          },
          finally: function (a) {
            return this.getPromise()["finally"](a);
          },
          pause: function () {
            this.host.pause && this.host.pause();
          },
          resume: function () {
            this.host.resume && this.host.resume();
          },
          end: function () {
            this.host.end && this.host.end();
            this._resolve(!0);
          },
          cancel: function () {
            this.host.cancel && this.host.cancel();
            this._resolve(!1);
          },
          complete: function (a) {
            var b = this;
            0 === b._state &&
              ((b._state = 1),
              b._runInAnimationFrame(function () {
                b._resolve(a);
              }));
          },
          _resolve: function (a) {
            2 !== this._state &&
              (u(this._doneCallbacks, function (b) {
                b(a);
              }),
              (this._doneCallbacks.length = 0),
              (this._state = 2));
          },
        };
        return c;
      },
    ])
    .provider("$$animateQueue", [
      "$animateProvider",
      function (a) {
        function b(a, b, c, h) {
          return d[a].some(function (a) {
            return a(b, c, h);
          });
        }
        function c(a, b) {
          a = a || {};
          var c = 0 < (a.addClass || "").length,
            d = 0 < (a.removeClass || "").length;
          return b ? c && d : c || d;
        }
        var d = (this.rules = { skip: [], cancel: [], join: [] });
        d.join.push(function (a, b, d) {
          return !b.structural && c(b.options);
        });
        d.skip.push(function (a, b, d) {
          return !b.structural && !c(b.options);
        });
        d.skip.push(function (a, b, c) {
          return "leave" == c.event && b.structural;
        });
        d.skip.push(function (a, b, c) {
          return c.structural && !b.structural;
        });
        d.cancel.push(function (a, b, c) {
          return c.structural && b.structural;
        });
        d.cancel.push(function (a, b, c) {
          return 2 === c.state && b.structural;
        });
        d.cancel.push(function (a, b, c) {
          a = b.options;
          c = c.options;
          return (
            (a.addClass && a.addClass === c.removeClass) ||
            (a.removeClass && a.removeClass === c.addClass)
          );
        });
        this.$get = [
          "$$rAF",
          "$rootScope",
          "$rootElement",
          "$document",
          "$$HashMap",
          "$$animation",
          "$$AnimateRunner",
          "$templateRequest",
          "$$jqLite",
          function (d, s, n, h, k, D, A, Z, I) {
            function w(a, b) {
              var c = z(a),
                f = [],
                m = l[b];
              m &&
                u(m, function (a) {
                  a.node.contains(c) && f.push(a.callback);
                });
              return f;
            }
            function B(a, b, c, f) {
              d(function () {
                u(w(b, a), function (a) {
                  a(b, c, f);
                });
              });
            }
            function r(a, S, p) {
              function d(b, c, f, p) {
                B(c, a, f, p);
                b.progress(c, f, p);
              }
              function g(b) {
                Da(a, p);
                ca(a, p);
                p.domOperation();
                l.complete(!b);
              }
              var P, E;
              if ((a = Fa(a))) (P = z(a)), (E = a.parent());
              p = ia(p);
              var l = new A();
              if (!P) return g(), l;
              X(p.addClass) && (p.addClass = p.addClass.join(" "));
              X(p.removeClass) && (p.removeClass = p.removeClass.join(" "));
              p.from && !na(p.from) && (p.from = null);
              p.to && !na(p.to) && (p.to = null);
              var e = [P.className, p.addClass, p.removeClass].join(" ");
              if (!v(e)) return g(), l;
              var M = 0 <= ["enter", "move", "leave"].indexOf(S),
                h = !x || L.get(P),
                e = (!h && m.get(P)) || {},
                k = !!e.state;
              h || (k && 1 == e.state) || (h = !ta(a, E, S));
              if (h) return g(), l;
              M && K(a);
              h = {
                structural: M,
                element: a,
                event: S,
                close: g,
                options: p,
                runner: l,
              };
              if (k) {
                if (b("skip", a, h, e)) {
                  if (2 === e.state) return g(), l;
                  R(a, e.options, p);
                  return e.runner;
                }
                if (b("cancel", a, h, e))
                  2 === e.state
                    ? e.runner.end()
                    : e.structural
                    ? e.close()
                    : R(a, h.options, e.options);
                else if (b("join", a, h, e))
                  if (2 === e.state) R(a, p, {});
                  else
                    return (
                      (S = h.event = e.event),
                      (p = R(a, e.options, h.options)),
                      l
                    );
              } else R(a, p, {});
              (k = h.structural) ||
                (k =
                  ("animate" === h.event &&
                    0 < Object.keys(h.options.to || {}).length) ||
                  c(h.options));
              if (!k) return g(), C(a), l;
              M && f(E);
              var r = (e.counter || 0) + 1;
              h.counter = r;
              ga(a, 1, h);
              s.$$postDigest(function () {
                var b = m.get(P),
                  v = !b,
                  b = b || {},
                  e = a.parent() || [],
                  E =
                    0 < e.length &&
                    ("animate" === b.event || b.structural || c(b.options));
                if (v || b.counter !== r || !E) {
                  v && (Da(a, p), ca(a, p));
                  if (v || (M && b.event !== S)) p.domOperation(), l.end();
                  E || C(a);
                } else
                  (S =
                    !b.structural && c(b.options, !0) ? "setClass" : b.event),
                    b.structural && f(e),
                    ga(a, 2),
                    (b = D(a, S, b.options)),
                    b.done(function (b) {
                      g(!b);
                      (b = m.get(P)) && b.counter === r && C(z(a));
                      d(l, S, "close", {});
                    }),
                    l.setHost(b),
                    d(l, S, "start", {});
              });
              return l;
            }
            function K(a) {
              a = z(a).querySelectorAll("[data-ng-animate]");
              u(a, function (a) {
                var b = parseInt(a.getAttribute("data-ng-animate")),
                  c = m.get(a);
                switch (b) {
                  case 2:
                    c.runner.end();
                  case 1:
                    c && m.remove(a);
                }
              });
            }
            function C(a) {
              a = z(a);
              a.removeAttribute("data-ng-animate");
              m.remove(a);
            }
            function E(a, b) {
              return z(a) === z(b);
            }
            function f(a) {
              a = z(a);
              do {
                if (!a || 1 !== a.nodeType) break;
                var b = m.get(a);
                if (b) {
                  var f = a;
                  !b.structural &&
                    c(b.options) &&
                    (2 === b.state && b.runner.end(), C(f));
                }
                a = a.parentNode;
              } while (1);
            }
            function ta(a, b, c) {
              var f = (c = !1),
                d = !1,
                v;
              for ((a = a.data("$ngAnimatePin")) && (b = a); b && b.length; ) {
                f || (f = E(b, n));
                a = b[0];
                if (1 !== a.nodeType) break;
                var e = m.get(a) || {};
                d || (d = e.structural || L.get(a));
                if (Ka(v) || !0 === v)
                  (a = b.data("$$ngAnimateChildren")), La(a) && (v = a);
                if (d && !1 === v) break;
                f ||
                  ((f = E(b, n)),
                  f || ((a = b.data("$ngAnimatePin")) && (b = a)));
                c || (c = E(b, g));
                b = b.parent();
              }
              return (!d || v) && f && c;
            }
            function ga(a, b, c) {
              c = c || {};
              c.state = b;
              a = z(a);
              a.setAttribute("data-ng-animate", b);
              c = (b = m.get(a)) ? ya(b, c) : c;
              m.put(a, c);
            }
            var m = new k(),
              L = new k(),
              x = null,
              M = s.$watch(
                function () {
                  return 0 === Z.totalPendingRequests;
                },
                function (a) {
                  a &&
                    (M(),
                    s.$$postDigest(function () {
                      s.$$postDigest(function () {
                        null === x && (x = !0);
                      });
                    }));
                }
              ),
              g = G(h[0].body),
              l = {},
              P = a.classNameFilter(),
              v = P
                ? function (a) {
                    return P.test(a);
                  }
                : function () {
                    return !0;
                  },
              Da = ha(I);
            return {
              on: function (a, b, c) {
                b = ka(b);
                l[a] = l[a] || [];
                l[a].push({ node: b, callback: c });
              },
              off: function (a, b, c) {
                function f(a, b, c) {
                  var d = ka(b);
                  return a.filter(function (a) {
                    return !(a.node === d && (!c || a.callback === c));
                  });
                }
                var d = l[a];
                d && (l[a] = 1 === arguments.length ? null : f(d, b, c));
              },
              pin: function (a, b) {
                ua(oa(a), "element", "not an element");
                ua(oa(b), "parentElement", "not an element");
                a.data("$ngAnimatePin", b);
              },
              push: function (a, b, c, f) {
                c = c || {};
                c.domOperation = f;
                return r(a, b, c);
              },
              enabled: function (a, b) {
                var c = arguments.length;
                if (0 === c) b = !!x;
                else if (oa(a)) {
                  var f = z(a),
                    d = L.get(f);
                  1 === c
                    ? (b = !d)
                    : (b = !!b)
                    ? d && L.remove(f)
                    : L.put(f, !0);
                } else b = x = !!a;
                return b;
              },
            };
          },
        ];
      },
    ])
    .provider("$$animation", [
      "$animateProvider",
      function (a) {
        function b(a) {
          return a.data("$$animationRunner");
        }
        var c = (this.drivers = []);
        this.$get = [
          "$$jqLite",
          "$rootScope",
          "$injector",
          "$$AnimateRunner",
          "$$rAFScheduler",
          function (a, e, s, n, h) {
            var k = [],
              D = ha(a),
              A = 0,
              Z = 0,
              I = [];
            return function (w, B, r) {
              function K(a) {
                a = a.hasAttribute("ng-animate-ref")
                  ? [a]
                  : a.querySelectorAll("[ng-animate-ref]");
                var b = [];
                u(a, function (a) {
                  var c = a.getAttribute("ng-animate-ref");
                  c && c.length && b.push(a);
                });
                return b;
              }
              function C(a) {
                var b = [],
                  c = {};
                u(a, function (a, f) {
                  var d = z(a.element),
                    m = 0 <= ["enter", "move"].indexOf(a.event),
                    d = a.structural ? K(d) : [];
                  if (d.length) {
                    var g = m ? "to" : "from";
                    u(d, function (a) {
                      var b = a.getAttribute("ng-animate-ref");
                      c[b] = c[b] || {};
                      c[b][g] = { animationID: f, element: G(a) };
                    });
                  } else b.push(a);
                });
                var f = {},
                  d = {};
                u(c, function (c, m) {
                  var g = c.from,
                    e = c.to;
                  if (g && e) {
                    var l = a[g.animationID],
                      h = a[e.animationID],
                      x = g.animationID.toString();
                    if (!d[x]) {
                      var B = (d[x] = {
                        structural: !0,
                        beforeStart: function () {
                          l.beforeStart();
                          h.beforeStart();
                        },
                        close: function () {
                          l.close();
                          h.close();
                        },
                        classes: E(l.classes, h.classes),
                        from: l,
                        to: h,
                        anchors: [],
                      });
                      B.classes.length ? b.push(B) : (b.push(l), b.push(h));
                    }
                    d[x].anchors.push({ out: g.element, in: e.element });
                  } else (g = g ? g.animationID : e.animationID), (e = g.toString()), f[e] || ((f[e] = !0), b.push(a[g]));
                });
                return b;
              }
              function E(a, b) {
                a = a.split(" ");
                b = b.split(" ");
                for (var c = [], f = 0; f < a.length; f++) {
                  var d = a[f];
                  if ("ng-" !== d.substring(0, 3))
                    for (var g = 0; g < b.length; g++)
                      if (d === b[g]) {
                        c.push(d);
                        break;
                      }
                }
                return c.join(" ");
              }
              function f(a) {
                for (var b = c.length - 1; 0 <= b; b--) {
                  var f = c[b];
                  if (s.has(f) && (f = s.get(f)(a))) return f;
                }
              }
              function ta(a, c) {
                a.from && a.to
                  ? (b(a.from.element).setHost(c), b(a.to.element).setHost(c))
                  : b(a.element).setHost(c);
              }
              function ga() {
                var a = b(w);
                !a || ("leave" === B && r.$$domOperationFired) || a.end();
              }
              function m(b) {
                w.off("$destroy", ga);
                w.removeData("$$animationRunner");
                D(w, r);
                ca(w, r);
                r.domOperation();
                g && a.removeClass(w, g);
                w.removeClass("ng-animate");
                x.complete(!b);
              }
              r = ia(r);
              var L = 0 <= ["enter", "move", "leave"].indexOf(B),
                x = new n({
                  end: function () {
                    m();
                  },
                  cancel: function () {
                    m(!0);
                  },
                });
              if (!c.length) return m(), x;
              w.data("$$animationRunner", x);
              var M = va(w.attr("class"), va(r.addClass, r.removeClass)),
                g = r.tempClasses;
              g && ((M += " " + g), (r.tempClasses = null));
              var l;
              L || ((l = A), (A += 1));
              k.push({
                element: w,
                classes: M,
                event: B,
                classBasedIndex: l,
                structural: L,
                options: r,
                beforeStart: function () {
                  w.addClass("ng-animate");
                  g && a.addClass(w, g);
                },
                close: m,
              });
              w.on("$destroy", ga);
              if (1 < k.length) return x;
              e.$$postDigest(function () {
                Z = A;
                A = 0;
                I.length = 0;
                var a = [];
                u(k, function (c) {
                  b(c.element) && a.push(c);
                });
                k.length = 0;
                u(C(a), function (a) {
                  function c() {
                    a.beforeStart();
                    var d,
                      g = a.close,
                      e = a.anchors
                        ? a.from.element || a.to.element
                        : a.element;
                    b(e) && z(e).parentNode && (e = f(a)) && (d = e.start);
                    d
                      ? ((d = d()),
                        d.done(function (a) {
                          g(!a);
                        }),
                        ta(a, d))
                      : g();
                  }
                  a.structural
                    ? c()
                    : (I.push({ node: z(a.element), fn: c }),
                      a.classBasedIndex === Z - 1 &&
                        ((I = I.sort(function (a, b) {
                          return b.node.contains(a.node);
                        }).map(function (a) {
                          return a.fn;
                        })),
                        h(I)));
                });
              });
              return x;
            };
          },
        ];
      },
    ])
    .provider("$animateCss", [
      "$animateProvider",
      function (a) {
        var b = Ba(),
          c = Ba();
        this.$get = [
          "$window",
          "$$jqLite",
          "$$AnimateRunner",
          "$timeout",
          "$document",
          "$sniffer",
          "$$rAFScheduler",
          function (a, e, s, n, h, k, D) {
            function A(a, b) {
              var c = a.parentNode;
              return (
                (c.$$ngAnimateParentKey || (c.$$ngAnimateParentKey = ++r)) +
                "-" +
                a.getAttribute("class") +
                "-" +
                b
              );
            }
            function Z(h, f, B, k) {
              var m;
              0 < b.count(B) &&
                ((m = c.get(B)),
                m ||
                  ((f = ba(f, "-stagger")),
                  e.addClass(h, f),
                  (m = za(a, h, k)),
                  (m.animationDuration = Math.max(m.animationDuration, 0)),
                  (m.transitionDuration = Math.max(m.transitionDuration, 0)),
                  e.removeClass(h, f),
                  c.put(B, m)));
              return m || {};
            }
            function I(a) {
              C.push(a);
              D.waitUntilQuiet(function () {
                b.flush();
                c.flush();
                for (var a = K.offsetWidth + 1, d = 0; d < C.length; d++)
                  C[d](a);
                C.length = 0;
              });
            }
            function w(c, f, e) {
              f = b.get(e);
              f ||
                ((f = za(a, c, Ma)),
                "infinite" === f.animationIterationCount &&
                  (f.animationIterationCount = 1));
              b.put(e, f);
              c = f;
              e = c.animationDelay;
              f = c.transitionDelay;
              c.maxDelay = e && f ? Math.max(e, f) : e || f;
              c.maxDuration = Math.max(
                c.animationDuration * c.animationIterationCount,
                c.transitionDuration
              );
              return c;
            }
            var B = ha(e),
              r = 0,
              K = z(h).body,
              C = [];
            return function (a, c) {
              function d() {
                m();
              }
              function h() {
                m(!0);
              }
              function m(b) {
                if (!(K || (C && D))) {
                  K = !0;
                  D = !1;
                  e.removeClass(a, Y);
                  e.removeClass(a, W);
                  ma(g, !1);
                  ja(g, !1);
                  u(l, function (a) {
                    g.style[a[0]] = "";
                  });
                  B(a, c);
                  ca(a, c);
                  if (c.onDone) c.onDone();
                  p && p.complete(!b);
                }
              }
              function L(a) {
                q.blockTransition && ja(g, a);
                q.blockKeyframeAnimation && ma(g, !!a);
              }
              function x() {
                p = new s({ end: d, cancel: h });
                m();
                return {
                  $$willAnimate: !1,
                  start: function () {
                    return p;
                  },
                  end: d,
                };
              }
              function M() {
                function b() {
                  if (!K) {
                    L(!1);
                    u(l, function (a) {
                      g.style[a[0]] = a[1];
                    });
                    B(a, c);
                    e.addClass(a, W);
                    if (q.recalculateTimingStyles) {
                      fa = g.className + " " + Y;
                      $ = A(g, fa);
                      y = w(g, fa, $);
                      Q = y.maxDelay;
                      H = Math.max(Q, 0);
                      J = y.maxDuration;
                      if (0 === J) {
                        m();
                        return;
                      }
                      q.hasTransitions = 0 < y.transitionDuration;
                      q.hasAnimations = 0 < y.animationDuration;
                    }
                    if (q.applyTransitionDelay || q.applyAnimationDelay) {
                      Q =
                        "boolean" !== typeof c.delay && la(c.delay)
                          ? parseFloat(c.delay)
                          : Q;
                      H = Math.max(Q, 0);
                      var k;
                      q.applyTransitionDelay &&
                        ((y.transitionDelay = Q),
                        (k = [ea, Q + "s"]),
                        l.push(k),
                        (g.style[k[0]] = k[1]));
                      q.applyAnimationDelay &&
                        ((y.animationDelay = Q),
                        (k = [ra, Q + "s"]),
                        l.push(k),
                        (g.style[k[0]] = k[1]));
                    }
                    F = 1e3 * H;
                    G = 1e3 * J;
                    if (c.easing) {
                      var r = c.easing;
                      q.hasTransitions &&
                        ((k = O + "TimingFunction"),
                        l.push([k, r]),
                        (g.style[k] = r));
                      q.hasAnimations &&
                        ((k = V + "TimingFunction"),
                        l.push([k, r]),
                        (g.style[k] = r));
                    }
                    y.transitionDuration && p.push(pa);
                    y.animationDuration && p.push(qa);
                    x = Date.now();
                    a.on(p.join(" "), h);
                    n(d, F + 1.5 * G);
                    xa(a, c);
                  }
                }
                function d() {
                  m();
                }
                function h(a) {
                  a.stopPropagation();
                  var b = a.originalEvent || a;
                  a = b.$manualTimeStamp || b.timeStamp || Date.now();
                  b = parseFloat(b.elapsedTime.toFixed(3));
                  Math.max(a - x, 0) >= F && b >= J && ((C = !0), m());
                }
                if (!K)
                  if (g.parentNode) {
                    var x,
                      p = [],
                      k = function (a) {
                        if (C) D && a && ((D = !1), m());
                        else if (((D = !a), y.animationDuration))
                          if (((a = ma(g, D)), D)) l.push(a);
                          else {
                            var b = l,
                              c = b.indexOf(a);
                            0 <= a && b.splice(c, 1);
                          }
                      },
                      r =
                        0 < U &&
                        ((y.transitionDuration && 0 === T.transitionDuration) ||
                          (y.animationDuration && 0 === T.animationDuration)) &&
                        Math.max(T.animationDelay, T.transitionDelay);
                    r ? n(b, Math.floor(r * U * 1e3), !1) : b();
                    t.resume = function () {
                      k(!0);
                    };
                    t.pause = function () {
                      k(!1);
                    };
                  } else m();
              }
              var g = z(a);
              if (!g || !g.parentNode) return x();
              c = ia(c);
              var l = [],
                r = a.attr("class"),
                v = Ea(c),
                K,
                D,
                C,
                p,
                t,
                H,
                F,
                J,
                G;
              if (0 === c.duration || (!k.animations && !k.transitions))
                return x();
              var aa = c.event && X(c.event) ? c.event.join(" ") : c.event,
                R = "",
                N = "";
              aa && c.structural ? (R = ba(aa, "ng-", !0)) : aa && (R = aa);
              c.addClass && (N += ba(c.addClass, "-add"));
              c.removeClass &&
                (N.length && (N += " "), (N += ba(c.removeClass, "-remove")));
              c.applyClassesEarly && N.length && (B(a, c), (N = ""));
              var Y = [R, N].join(" ").trim(),
                fa = r + " " + Y,
                W = ba(Y, "-active"),
                r = v.to && 0 < Object.keys(v.to).length;
              if (!(0 < (c.keyframeStyle || "").length || r || Y)) return x();
              var $, T;
              0 < c.stagger
                ? ((v = parseFloat(c.stagger)),
                  (T = {
                    transitionDelay: v,
                    animationDelay: v,
                    transitionDuration: 0,
                    animationDuration: 0,
                  }))
                : (($ = A(g, fa)), (T = Z(g, Y, $, Na)));
              e.addClass(a, Y);
              c.transitionStyle &&
                ((v = [O, c.transitionStyle]), da(g, v), l.push(v));
              0 <= c.duration &&
                ((v = 0 < g.style[O].length),
                (v = Aa(c.duration, v)),
                da(g, v),
                l.push(v));
              c.keyframeStyle &&
                ((v = [V, c.keyframeStyle]), da(g, v), l.push(v));
              var U = T
                ? 0 <= c.staggerIndex
                  ? c.staggerIndex
                  : b.count($)
                : 0;
              (aa = 0 === U) && ja(g, 9999);
              var y = w(g, fa, $),
                Q = y.maxDelay;
              H = Math.max(Q, 0);
              J = y.maxDuration;
              var q = {};
              q.hasTransitions = 0 < y.transitionDuration;
              q.hasAnimations = 0 < y.animationDuration;
              q.hasTransitionAll =
                q.hasTransitions && "all" == y.transitionProperty;
              q.applyTransitionDuration =
                r &&
                ((q.hasTransitions && !q.hasTransitionAll) ||
                  (q.hasAnimations && !q.hasTransitions));
              q.applyAnimationDuration = c.duration && q.hasAnimations;
              q.applyTransitionDelay =
                la(c.delay) && (q.applyTransitionDuration || q.hasTransitions);
              q.applyAnimationDelay = la(c.delay) && q.hasAnimations;
              q.recalculateTimingStyles = 0 < N.length;
              if (q.applyTransitionDuration || q.applyAnimationDuration)
                (J = c.duration ? parseFloat(c.duration) : J),
                  q.applyTransitionDuration &&
                    ((q.hasTransitions = !0),
                    (y.transitionDuration = J),
                    (v = 0 < g.style[O + "Property"].length),
                    l.push(Aa(J, v))),
                  q.applyAnimationDuration &&
                    ((q.hasAnimations = !0),
                    (y.animationDuration = J),
                    l.push([sa, J + "s"]));
              if (0 === J && !q.recalculateTimingStyles) return x();
              null == c.duration &&
                0 < y.transitionDuration &&
                (q.recalculateTimingStyles = q.recalculateTimingStyles || aa);
              F = 1e3 * H;
              G = 1e3 * J;
              c.skipBlocking ||
                ((q.blockTransition = 0 < y.transitionDuration),
                (q.blockKeyframeAnimation =
                  0 < y.animationDuration &&
                  0 < T.animationDelay &&
                  0 === T.animationDuration));
              wa(a, c);
              q.blockTransition || ja(g, !1);
              L(J);
              return {
                $$willAnimate: !0,
                end: d,
                start: function () {
                  if (!K)
                    return (
                      (t = { end: d, cancel: h, resume: null, pause: null }),
                      (p = new s(t)),
                      I(M),
                      p
                    );
                },
              };
            };
          },
        ];
      },
    ])
    .provider("$$animateCssDriver", [
      "$$animationProvider",
      function (a) {
        a.drivers.push("$$animateCssDriver");
        this.$get = [
          "$animateCss",
          "$rootScope",
          "$$AnimateRunner",
          "$rootElement",
          "$document",
          "$sniffer",
          function (a, c, d, e, s, n) {
            function h(a) {
              return a.replace(/\bng-\S+\b/g, "");
            }
            function k(a, b) {
              U(a) && (a = a.split(" "));
              U(b) && (b = b.split(" "));
              return a
                .filter(function (a) {
                  return -1 === b.indexOf(a);
                })
                .join(" ");
            }
            function D(c, e, A) {
              function D(a) {
                var b = {},
                  c = z(a).getBoundingClientRect();
                u(["width", "height", "top", "left"], function (a) {
                  var d = c[a];
                  switch (a) {
                    case "top":
                      d += I.scrollTop;
                      break;
                    case "left":
                      d += I.scrollLeft;
                  }
                  b[a] = Math.floor(d) + "px";
                });
                return b;
              }
              function s() {
                var c = h(A.attr("class") || ""),
                  d = k(c, t),
                  c = k(t, c),
                  d = a(n, {
                    to: D(A),
                    addClass: "ng-anchor-in " + d,
                    removeClass: "ng-anchor-out " + c,
                    delay: !0,
                  });
                return d.$$willAnimate ? d : null;
              }
              function f() {
                n.remove();
                e.removeClass("ng-animate-shim");
                A.removeClass("ng-animate-shim");
              }
              var n = G(z(e).cloneNode(!0)),
                t = h(n.attr("class") || "");
              e.addClass("ng-animate-shim");
              A.addClass("ng-animate-shim");
              n.addClass("ng-anchor");
              w.append(n);
              var m;
              c = (function () {
                var c = a(n, {
                  addClass: "ng-anchor-out",
                  delay: !0,
                  from: D(e),
                });
                return c.$$willAnimate ? c : null;
              })();
              if (!c && ((m = s()), !m)) return f();
              var L = c || m;
              return {
                start: function () {
                  function a() {
                    c && c.end();
                  }
                  var b,
                    c = L.start();
                  c.done(function () {
                    c = null;
                    if (!m && (m = s()))
                      return (
                        (c = m.start()),
                        c.done(function () {
                          c = null;
                          f();
                          b.complete();
                        }),
                        c
                      );
                    f();
                    b.complete();
                  });
                  return (b = new d({ end: a, cancel: a }));
                },
              };
            }
            function A(a, b, c, e) {
              var h = t(a),
                f = t(b),
                k = [];
              u(e, function (a) {
                (a = D(c, a.out, a["in"])) && k.push(a);
              });
              if (h || f || 0 !== k.length)
                return {
                  start: function () {
                    function a() {
                      u(b, function (a) {
                        a.end();
                      });
                    }
                    var b = [];
                    h && b.push(h.start());
                    f && b.push(f.start());
                    u(k, function (a) {
                      b.push(a.start());
                    });
                    var c = new d({ end: a, cancel: a });
                    d.all(b, function (a) {
                      c.complete(a);
                    });
                    return c;
                  },
                };
            }
            function t(c) {
              var d = c.element,
                e = c.options || {};
              c.structural
                ? ((e.structural = e.applyClassesEarly = !0),
                  (e.event = c.event),
                  "leave" === e.event && (e.onDone = e.domOperation))
                : (e.event = null);
              c = a(d, e);
              return c.$$willAnimate ? c : null;
            }
            if (!n.animations && !n.transitions) return H;
            var I = z(s).body;
            c = z(e);
            var w = G(I.parentNode === c ? I : c);
            return function (a) {
              return a.from && a.to
                ? A(a.from, a.to, a.classes, a.anchors)
                : t(a);
            };
          },
        ];
      },
    ])
    .provider("$$animateJs", [
      "$animateProvider",
      function (a) {
        this.$get = [
          "$injector",
          "$$AnimateRunner",
          "$$rAFMutex",
          "$$jqLite",
          function (b, c, d, e) {
            function s(c) {
              c = X(c) ? c : c.split(" ");
              for (var d = [], e = {}, A = 0; A < c.length; A++) {
                var n = c[A],
                  s = a.$$registeredAnimations[n];
                s && !e[n] && (d.push(b.get(s)), (e[n] = !0));
              }
              return d;
            }
            var n = ha(e);
            return function (a, b, d, e) {
              function t() {
                e.domOperation();
                n(a, e);
              }
              function z(a, b, d, e, g) {
                switch (d) {
                  case "animate":
                    b = [b, e.from, e.to, g];
                    break;
                  case "setClass":
                    b = [b, r, K, g];
                    break;
                  case "addClass":
                    b = [b, r, g];
                    break;
                  case "removeClass":
                    b = [b, K, g];
                    break;
                  default:
                    b = [b, g];
                }
                b.push(e);
                if ((a = a.apply(a, b)))
                  if ((Ca(a.start) && (a = a.start()), a instanceof c))
                    a.done(g);
                  else if (Ca(a)) return a;
                return H;
              }
              function w(a, b, d, e, g) {
                var f = [];
                u(e, function (e) {
                  var h = e[g];
                  h &&
                    f.push(function () {
                      var e,
                        g,
                        f = !1,
                        l = function (a) {
                          f || ((f = !0), (g || H)(a), e.complete(!a));
                        };
                      e = new c({
                        end: function () {
                          l();
                        },
                        cancel: function () {
                          l(!0);
                        },
                      });
                      g = z(h, a, b, d, function (a) {
                        l(!1 === a);
                      });
                      return e;
                    });
                });
                return f;
              }
              function B(a, b, d, e, g) {
                var f = w(a, b, d, e, g);
                if (0 === f.length) {
                  var h, k;
                  "beforeSetClass" === g
                    ? ((h = w(a, "removeClass", d, e, "beforeRemoveClass")),
                      (k = w(a, "addClass", d, e, "beforeAddClass")))
                    : "setClass" === g &&
                      ((h = w(a, "removeClass", d, e, "removeClass")),
                      (k = w(a, "addClass", d, e, "addClass")));
                  h && (f = f.concat(h));
                  k && (f = f.concat(k));
                }
                if (0 !== f.length)
                  return function (a) {
                    var b = [];
                    f.length &&
                      u(f, function (a) {
                        b.push(a());
                      });
                    b.length ? c.all(b, a) : a();
                    return function (a) {
                      u(b, function (b) {
                        a ? b.cancel() : b.end();
                      });
                    };
                  };
              }
              3 === arguments.length && na(d) && ((e = d), (d = null));
              e = ia(e);
              d ||
                ((d = a.attr("class") || ""),
                e.addClass && (d += " " + e.addClass),
                e.removeClass && (d += " " + e.removeClass));
              var r = e.addClass,
                K = e.removeClass,
                C = s(d),
                E,
                f;
              if (C.length) {
                var F, G;
                "leave" == b
                  ? ((G = "leave"), (F = "afterLeave"))
                  : ((G = "before" + b.charAt(0).toUpperCase() + b.substr(1)),
                    (F = b));
                "enter" !== b && "move" !== b && (E = B(a, b, e, C, G));
                f = B(a, b, e, C, F);
              }
              if (E || f)
                return {
                  start: function () {
                    function b(c) {
                      n = !0;
                      t();
                      ca(a, e);
                      g.complete(c);
                    }
                    var d,
                      k = [];
                    E &&
                      k.push(function (a) {
                        d = E(a);
                      });
                    k.length
                      ? k.push(function (a) {
                          t();
                          a(!0);
                        })
                      : t();
                    f &&
                      k.push(function (a) {
                        d = f(a);
                      });
                    var n = !1,
                      g = new c({
                        end: function () {
                          n || ((d || H)(void 0), b(void 0));
                        },
                        cancel: function () {
                          n || ((d || H)(!0), b(!0));
                        },
                      });
                    c.chain(k, b);
                    return g;
                  },
                };
            };
          },
        ];
      },
    ])
    .provider("$$animateJsDriver", [
      "$$animationProvider",
      function (a) {
        a.drivers.push("$$animateJsDriver");
        this.$get = [
          "$$animateJs",
          "$$AnimateRunner",
          function (a, c) {
            function d(c) {
              return a(c.element, c.event, c.classes, c.options);
            }
            return function (a) {
              if (a.from && a.to) {
                var b = d(a.from),
                  n = d(a.to);
                if (b || n)
                  return {
                    start: function () {
                      function a() {
                        return function () {
                          u(d, function (a) {
                            a.end();
                          });
                        };
                      }
                      var d = [];
                      b && d.push(b.start());
                      n && d.push(n.start());
                      c.all(d, function (a) {
                        e.complete(a);
                      });
                      var e = new c({ end: a(), cancel: a() });
                      return e;
                    },
                  };
              } else return d(a);
            };
          },
        ];
      },
    ]);
})(window, window.angular);
(function (p, g, l) {
  "use strict";
  function m(b, a, f) {
    var c = f.baseHref(),
      k = b[0];
    return function (b, d, e) {
      var f, h;
      e = e || {};
      h = e.expires;
      f = g.isDefined(e.path) ? e.path : c;
      d === l && ((h = "Thu, 01 Jan 1970 00:00:00 GMT"), (d = ""));
      g.isString(h) && (h = new Date(h));
      d = encodeURIComponent(b) + "=" + encodeURIComponent(d);
      d = d + (f ? ";path=" + f : "") + (e.domain ? ";domain=" + e.domain : "");
      d += h ? ";expires=" + h.toUTCString() : "";
      d += e.secure ? ";secure" : "";
      e = d.length + 1;
      4096 < e &&
        a.warn(
          "Cookie '" +
            b +
            "' possibly not set or overflowed because it was too large (" +
            e +
            " > 4096 bytes)!"
        );
      k.cookie = d;
    };
  }
  g.module("ngCookies", ["ng"]).provider("$cookies", [
    function () {
      var b = (this.defaults = {});
      this.$get = [
        "$$cookieReader",
        "$$cookieWriter",
        function (a, f) {
          return {
            get: function (c) {
              return a()[c];
            },
            getObject: function (c) {
              return (c = this.get(c)) ? g.fromJson(c) : c;
            },
            getAll: function () {
              return a();
            },
            put: function (c, a, n) {
              f(c, a, n ? g.extend({}, b, n) : b);
            },
            putObject: function (c, b, a) {
              this.put(c, g.toJson(b), a);
            },
            remove: function (a, k) {
              f(a, l, k ? g.extend({}, b, k) : b);
            },
          };
        },
      ];
    },
  ]);
  g.module("ngCookies").factory("$cookieStore", [
    "$cookies",
    function (b) {
      return {
        get: function (a) {
          return b.getObject(a);
        },
        put: function (a, f) {
          b.putObject(a, f);
        },
        remove: function (a) {
          b.remove(a);
        },
      };
    },
  ]);
  m.$inject = ["$document", "$log", "$browser"];
  g.module("ngCookies").provider("$$cookieWriter", function () {
    this.$get = m;
  });
})(window, window.angular);
!(function (e, t, n) {
  "use strict";
  angular.module("mgcrea.ngStrap", [
    "mgcrea.ngStrap.modal",
    "mgcrea.ngStrap.aside",
    "mgcrea.ngStrap.alert",
    "mgcrea.ngStrap.button",
    "mgcrea.ngStrap.select",
    "mgcrea.ngStrap.datepicker",
    "mgcrea.ngStrap.timepicker",
    "mgcrea.ngStrap.navbar",
    "mgcrea.ngStrap.tooltip",
    "mgcrea.ngStrap.popover",
    "mgcrea.ngStrap.dropdown",
    "mgcrea.ngStrap.typeahead",
    "mgcrea.ngStrap.scrollspy",
    "mgcrea.ngStrap.affix",
    "mgcrea.ngStrap.tab",
    "mgcrea.ngStrap.collapse",
  ]),
    angular
      .module("mgcrea.ngStrap.affix", [
        "mgcrea.ngStrap.helpers.dimensions",
        "mgcrea.ngStrap.helpers.debounce",
      ])
      .provider("$affix", function () {
        var e = (this.defaults = { offsetTop: "auto", inlineStyles: !0 });
        this.$get = [
          "$window",
          "debounce",
          "dimensions",
          function (t, n, a) {
            function o(o, s) {
              function l(e, t, n) {
                var a = u(),
                  o = c();
                return v >= a
                  ? "top"
                  : null !== e && a + e <= t.top
                  ? "middle"
                  : null !== w && t.top + n + $ >= o - w
                  ? "bottom"
                  : "middle";
              }
              function u() {
                return p[0] === t ? t.pageYOffset : p[0].scrollTop;
              }
              function c() {
                return p[0] === t
                  ? t.document.body.scrollHeight
                  : p[0].scrollHeight;
              }
              var d = {},
                f = angular.extend({}, e, s),
                p = f.target,
                g = "affix affix-top affix-bottom",
                m = !1,
                $ = 0,
                h = 0,
                v = 0,
                w = 0,
                y = null,
                b = null,
                D = o.parent();
              if (f.offsetParent)
                if (f.offsetParent.match(/^\d+$/))
                  for (var k = 0; k < 1 * f.offsetParent - 1; k++)
                    D = D.parent();
                else D = angular.element(f.offsetParent);
              return (
                (d.init = function () {
                  this.$parseOffsets(),
                    (h = a.offset(o[0]).top + $),
                    (m = !o[0].style.width),
                    p.on("scroll", this.checkPosition),
                    p.on("click", this.checkPositionWithEventLoop),
                    r.on("resize", this.$debouncedOnResize),
                    this.checkPosition(),
                    this.checkPositionWithEventLoop();
                }),
                (d.destroy = function () {
                  p.off("scroll", this.checkPosition),
                    p.off("click", this.checkPositionWithEventLoop),
                    r.off("resize", this.$debouncedOnResize);
                }),
                (d.checkPositionWithEventLoop = function () {
                  setTimeout(d.checkPosition, 1);
                }),
                (d.checkPosition = function () {
                  var e = u(),
                    t = a.offset(o[0]),
                    n = a.height(o[0]),
                    r = l(b, t, n);
                  y !== r &&
                    ((y = r),
                    o
                      .removeClass(g)
                      .addClass("affix" + ("middle" !== r ? "-" + r : "")),
                    "top" === r
                      ? ((b = null),
                        m && o.css("width", ""),
                        f.inlineStyles &&
                          (o.css("position", f.offsetParent ? "" : "relative"),
                          o.css("top", "")))
                      : "bottom" === r
                      ? ((b = f.offsetUnpin ? -(1 * f.offsetUnpin) : t.top - e),
                        m && o.css("width", ""),
                        f.inlineStyles &&
                          (o.css("position", f.offsetParent ? "" : "relative"),
                          o.css(
                            "top",
                            f.offsetParent
                              ? ""
                              : i[0].offsetHeight - w - n - h + "px"
                          )))
                      : ((b = null),
                        m && o.css("width", o[0].offsetWidth + "px"),
                        f.inlineStyles &&
                          (o.css("position", "fixed"),
                          o.css("top", $ + "px"))));
                }),
                (d.$onResize = function () {
                  d.$parseOffsets(), d.checkPosition();
                }),
                (d.$debouncedOnResize = n(d.$onResize, 50)),
                (d.$parseOffsets = function () {
                  var e = o.css("position");
                  f.inlineStyles &&
                    o.css("position", f.offsetParent ? "" : "relative"),
                    f.offsetTop &&
                      ("auto" === f.offsetTop && (f.offsetTop = "+0"),
                      f.offsetTop.match(/^[-+]\d+$/)
                        ? (($ = 1 * -f.offsetTop),
                          (v = f.offsetParent
                            ? a.offset(D[0]).top + 1 * f.offsetTop
                            : a.offset(o[0]).top -
                              a.css(o[0], "marginTop", !0) +
                              1 * f.offsetTop))
                        : (v = 1 * f.offsetTop)),
                    f.offsetBottom &&
                      (w =
                        f.offsetParent && f.offsetBottom.match(/^[-+]\d+$/)
                          ? c() -
                            (a.offset(D[0]).top + a.height(D[0])) +
                            1 * f.offsetBottom +
                            1
                          : 1 * f.offsetBottom),
                    f.inlineStyles && o.css("position", e);
                }),
                d.init(),
                d
              );
            }
            var i = angular.element(t.document.body),
              r = angular.element(t);
            return o;
          },
        ];
      })
      .directive("bsAffix", [
        "$affix",
        "$window",
        function (e, t) {
          return {
            restrict: "EAC",
            require: "^?bsAffixTarget",
            link: function (n, a, o, i) {
              var r = { scope: n, target: i ? i.$element : angular.element(t) };
              angular.forEach(
                [
                  "offsetTop",
                  "offsetBottom",
                  "offsetParent",
                  "offsetUnpin",
                  "inlineStyles",
                ],
                function (e) {
                  if (angular.isDefined(o[e])) {
                    var t = o[e];
                    /true/i.test(t) && (t = !0),
                      /false/i.test(t) && (t = !1),
                      (r[e] = t);
                  }
                }
              );
              var s = e(a, r);
              n.$on("$destroy", function () {
                s && s.destroy(), (r = null), (s = null);
              });
            },
          };
        },
      ])
      .directive("bsAffixTarget", function () {
        return {
          controller: [
            "$element",
            function (e) {
              this.$element = e;
            },
          ],
        };
      }),
    angular
      .module("mgcrea.ngStrap.alert", ["mgcrea.ngStrap.modal"])
      .provider("$alert", function () {
        var e = (this.defaults = {
          animation: "am-fade",
          prefixClass: "alert",
          prefixEvent: "alert",
          placement: null,
          template: "alert/alert.tpl.html",
          container: !1,
          element: null,
          backdrop: !1,
          keyboard: !0,
          show: !0,
          duration: !1,
          type: !1,
          dismissable: !0,
        });
        this.$get = [
          "$modal",
          "$timeout",
          function (t, n) {
            function a(a) {
              var o = {},
                i = angular.extend({}, e, a);
              (o = t(i)),
                (o.$scope.dismissable = !!i.dismissable),
                i.type && (o.$scope.type = i.type);
              var r = o.show;
              return (
                i.duration &&
                  (o.show = function () {
                    r(),
                      n(function () {
                        o.hide();
                      }, 1e3 * i.duration);
                  }),
                o
              );
            }
            return a;
          },
        ];
      })
      .directive("bsAlert", [
        "$window",
        "$sce",
        "$alert",
        function (e, t, n) {
          e.requestAnimationFrame || e.setTimeout;
          return {
            restrict: "EAC",
            scope: !0,
            link: function (e, a, o, i) {
              var r = { scope: e, element: a, show: !1 };
              angular.forEach(
                [
                  "template",
                  "placement",
                  "keyboard",
                  "html",
                  "container",
                  "animation",
                  "duration",
                  "dismissable",
                ],
                function (e) {
                  angular.isDefined(o[e]) && (r[e] = o[e]);
                }
              );
              var s = /^(false|0|)$/i;
              angular.forEach(
                ["keyboard", "html", "container", "dismissable"],
                function (e) {
                  angular.isDefined(o[e]) && s.test(o[e]) && (r[e] = !1);
                }
              ),
                e.hasOwnProperty("title") || (e.title = ""),
                angular.forEach(["title", "content", "type"], function (n) {
                  o[n] &&
                    o.$observe(n, function (a, o) {
                      e[n] = t.trustAsHtml(a);
                    });
                }),
                o.bsAlert &&
                  e.$watch(
                    o.bsAlert,
                    function (t, n) {
                      angular.isObject(t)
                        ? angular.extend(e, t)
                        : (e.content = t);
                    },
                    !0
                  );
              var l = n(r);
              a.on(o.trigger || "click", l.toggle),
                e.$on("$destroy", function () {
                  l && l.destroy(), (r = null), (l = null);
                });
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.aside", ["mgcrea.ngStrap.modal"])
      .provider("$aside", function () {
        var e = (this.defaults = {
          animation: "am-fade-and-slide-right",
          prefixClass: "aside",
          prefixEvent: "aside",
          placement: "right",
          template: "aside/aside.tpl.html",
          contentTemplate: !1,
          container: !1,
          element: null,
          backdrop: !0,
          keyboard: !0,
          html: !1,
          show: !0,
        });
        this.$get = [
          "$modal",
          function (t) {
            function n(n) {
              var a = {},
                o = angular.extend({}, e, n);
              return (a = t(o));
            }
            return n;
          },
        ];
      })
      .directive("bsAside", [
        "$window",
        "$sce",
        "$aside",
        function (e, t, n) {
          e.requestAnimationFrame || e.setTimeout;
          return {
            restrict: "EAC",
            scope: !0,
            link: function (e, a, o, i) {
              var r = { scope: e, element: a, show: !1 };
              angular.forEach(
                [
                  "template",
                  "contentTemplate",
                  "placement",
                  "backdrop",
                  "keyboard",
                  "html",
                  "container",
                  "animation",
                ],
                function (e) {
                  angular.isDefined(o[e]) && (r[e] = o[e]);
                }
              );
              var s = /^(false|0|)$/i;
              angular.forEach(
                ["backdrop", "keyboard", "html", "container"],
                function (e) {
                  angular.isDefined(o[e]) && s.test(o[e]) && (r[e] = !1);
                }
              ),
                angular.forEach(["title", "content"], function (n) {
                  o[n] &&
                    o.$observe(n, function (a, o) {
                      e[n] = t.trustAsHtml(a);
                    });
                }),
                o.bsAside &&
                  e.$watch(
                    o.bsAside,
                    function (t, n) {
                      angular.isObject(t)
                        ? angular.extend(e, t)
                        : (e.content = t);
                    },
                    !0
                  );
              var l = n(r);
              a.on(o.trigger || "click", l.toggle),
                e.$on("$destroy", function () {
                  l && l.destroy(), (r = null), (l = null);
                });
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.collapse", [])
      .provider("$collapse", function () {
        var e = (this.defaults = {
            animation: "am-collapse",
            disallowToggle: !1,
            activeClass: "in",
            startCollapsed: !1,
            allowMultiple: !1,
          }),
          t = (this.controller = function (t, n, a) {
            function o(e) {
              for (var t = l.$targets.$active, n = 0; n < t.length; n++)
                e < t[n] && (t[n] = t[n] - 1),
                  t[n] === l.$targets.length && (t[n] = l.$targets.length - 1);
            }
            function i(e) {
              var t = l.$targets.$active;
              return -1 === t.indexOf(e) ? !1 : !0;
            }
            function r(e) {
              var t = l.$targets.$active.indexOf(e);
              -1 !== t && l.$targets.$active.splice(t, 1);
            }
            function s(e) {
              l.$options.allowMultiple || l.$targets.$active.splice(0, 1),
                -1 === l.$targets.$active.indexOf(e) &&
                  l.$targets.$active.push(e);
            }
            var l = this;
            (l.$options = angular.copy(e)),
              angular.forEach(
                [
                  "animation",
                  "disallowToggle",
                  "activeClass",
                  "startCollapsed",
                  "allowMultiple",
                ],
                function (e) {
                  angular.isDefined(a[e]) && (l.$options[e] = a[e]);
                }
              );
            var u = /^(false|0|)$/i;
            angular.forEach(
              ["disallowToggle", "startCollapsed", "allowMultiple"],
              function (e) {
                angular.isDefined(a[e]) && u.test(a[e]) && (l.$options[e] = !1);
              }
            ),
              (l.$toggles = []),
              (l.$targets = []),
              (l.$viewChangeListeners = []),
              (l.$registerToggle = function (e) {
                l.$toggles.push(e);
              }),
              (l.$registerTarget = function (e) {
                l.$targets.push(e);
              }),
              (l.$unregisterToggle = function (e) {
                var t = l.$toggles.indexOf(e);
                l.$toggles.splice(t, 1);
              }),
              (l.$unregisterTarget = function (e) {
                var t = l.$targets.indexOf(e);
                l.$targets.splice(t, 1),
                  l.$options.allowMultiple && r(e),
                  o(t),
                  l.$viewChangeListeners.forEach(function (e) {
                    e();
                  });
              }),
              (l.$targets.$active = l.$options.startCollapsed ? [] : [0]),
              (l.$setActive = t.$setActive =
                function (e) {
                  angular.isArray(e)
                    ? (l.$targets.$active = e)
                    : l.$options.disallowToggle
                    ? s(e)
                    : i(e)
                    ? r(e)
                    : s(e),
                    l.$viewChangeListeners.forEach(function (e) {
                      e();
                    });
                }),
              (l.$activeIndexes = function () {
                return l.$options.allowMultiple
                  ? l.$targets.$active
                  : 1 === l.$targets.$active.length
                  ? l.$targets.$active[0]
                  : -1;
              });
          });
        this.$get = function () {
          var n = {};
          return (n.defaults = e), (n.controller = t), n;
        };
      })
      .directive("bsCollapse", [
        "$window",
        "$animate",
        "$collapse",
        function (e, t, n) {
          n.defaults;
          return {
            require: ["?ngModel", "bsCollapse"],
            controller: ["$scope", "$element", "$attrs", n.controller],
            link: function (e, t, n, a) {
              var o = a[0],
                i = a[1];
              o &&
                (i.$viewChangeListeners.push(function () {
                  o.$setViewValue(i.$activeIndexes());
                }),
                o.$formatters.push(function (e) {
                  if (angular.isArray(e)) i.$setActive(e);
                  else {
                    var t = i.$activeIndexes();
                    angular.isArray(t)
                      ? -1 === t.indexOf(1 * e) && i.$setActive(1 * e)
                      : t !== 1 * e && i.$setActive(1 * e);
                  }
                  return e;
                }));
            },
          };
        },
      ])
      .directive("bsCollapseToggle", function () {
        return {
          require: ["^?ngModel", "^bsCollapse"],
          link: function (e, t, n, a) {
            var o = (a[0], a[1]);
            t.attr("data-toggle", "collapse"),
              o.$registerToggle(t),
              e.$on("$destroy", function () {
                o.$unregisterToggle(t);
              }),
              t.on("click", function () {
                var a = n.bsCollapseToggle || o.$toggles.indexOf(t);
                o.$setActive(1 * a), e.$apply();
              });
          },
        };
      })
      .directive("bsCollapseTarget", [
        "$animate",
        function (e) {
          return {
            require: ["^?ngModel", "^bsCollapse"],
            link: function (t, n, a, o) {
              function i() {
                var t = r.$targets.indexOf(n),
                  a = r.$activeIndexes(),
                  o = "removeClass";
                angular.isArray(a)
                  ? -1 !== a.indexOf(t) && (o = "addClass")
                  : t === a && (o = "addClass"),
                  e[o](n, r.$options.activeClass);
              }
              var r = (o[0], o[1]);
              n.addClass("collapse"),
                r.$options.animation && n.addClass(r.$options.animation),
                r.$registerTarget(n),
                t.$on("$destroy", function () {
                  r.$unregisterTarget(n);
                }),
                r.$viewChangeListeners.push(function () {
                  i();
                }),
                i();
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.datepicker", [
        "mgcrea.ngStrap.helpers.dateParser",
        "mgcrea.ngStrap.helpers.dateFormatter",
        "mgcrea.ngStrap.tooltip",
      ])
      .provider("$datepicker", function () {
        var e = (this.defaults = {
          animation: "am-fade",
          prefixClass: "datepicker",
          placement: "bottom-left",
          template: "datepicker/datepicker.tpl.html",
          trigger: "focus",
          container: !1,
          keyboard: !0,
          html: !1,
          delay: 0,
          useNative: !1,
          dateType: "date",
          dateFormat: "shortDate",
          timezone: null,
          modelDateFormat: null,
          dayFormat: "dd",
          monthFormat: "MMM",
          yearFormat: "yyyy",
          monthTitleFormat: "MMMM yyyy",
          yearTitleFormat: "yyyy",
          strictFormat: !1,
          autoclose: !1,
          minDate: -(1 / 0),
          maxDate: +(1 / 0),
          startView: 0,
          minView: 0,
          startWeek: 0,
          daysOfWeekDisabled: "",
          iconLeft: "glyphicon glyphicon-chevron-left",
          iconRight: "glyphicon glyphicon-chevron-right",
        });
        this.$get = [
          "$window",
          "$document",
          "$rootScope",
          "$sce",
          "$dateFormatter",
          "datepickerViews",
          "$tooltip",
          "$timeout",
          function (t, n, a, o, i, r, s, l) {
            function u(t, n, a) {
              function o(e) {
                e.selected = u.$isSelected(e.date);
              }
              function i() {
                t[0].focus();
              }
              var u = s(t, angular.extend({}, e, a)),
                f = a.scope,
                p = u.$options,
                g = u.$scope;
              p.startView && (p.startView -= p.minView);
              var m = r(u);
              u.$views = m.views;
              var $ = m.viewDate;
              (g.$mode = p.startView),
                (g.$iconLeft = p.iconLeft),
                (g.$iconRight = p.iconRight);
              var h = u.$views[g.$mode];
              (g.$select = function (e) {
                u.select(e);
              }),
                (g.$selectPane = function (e) {
                  u.$selectPane(e);
                }),
                (g.$toggleMode = function () {
                  u.setMode((g.$mode + 1) % u.$views.length);
                }),
                (u.update = function (e) {
                  angular.isDate(e) &&
                    !isNaN(e.getTime()) &&
                    ((u.$date = e), h.update.call(h, e)),
                    u.$build(!0);
                }),
                (u.updateDisabledDates = function (e) {
                  p.disabledDateRanges = e;
                  for (var t = 0, n = g.rows.length; n > t; t++)
                    angular.forEach(g.rows[t], u.$setDisabledEl);
                }),
                (u.select = function (e, t) {
                  angular.isDate(n.$dateValue) || (n.$dateValue = new Date(e)),
                    !g.$mode || t
                      ? (n.$setViewValue(angular.copy(e)),
                        n.$render(),
                        p.autoclose &&
                          !t &&
                          l(function () {
                            u.hide(!0);
                          }))
                      : (angular.extend($, {
                          year: e.getFullYear(),
                          month: e.getMonth(),
                          date: e.getDate(),
                        }),
                        u.setMode(g.$mode - 1),
                        u.$build());
                }),
                (u.setMode = function (e) {
                  (g.$mode = e), (h = u.$views[g.$mode]), u.$build();
                }),
                (u.$build = function (e) {
                  (e === !0 && h.built) ||
                    ((e !== !1 || h.built) && h.build.call(h));
                }),
                (u.$updateSelected = function () {
                  for (var e = 0, t = g.rows.length; t > e; e++)
                    angular.forEach(g.rows[e], o);
                }),
                (u.$isSelected = function (e) {
                  return h.isSelected(e);
                }),
                (u.$setDisabledEl = function (e) {
                  e.disabled = h.isDisabled(e.date);
                }),
                (u.$selectPane = function (e) {
                  var t = h.steps,
                    n = new Date(
                      Date.UTC(
                        $.year + (t.year || 0) * e,
                        $.month + (t.month || 0) * e,
                        1
                      )
                    );
                  angular.extend($, {
                    year: n.getUTCFullYear(),
                    month: n.getUTCMonth(),
                    date: n.getUTCDate(),
                  }),
                    u.$build();
                }),
                (u.$onMouseDown = function (e) {
                  if ((e.preventDefault(), e.stopPropagation(), d)) {
                    var t = angular.element(e.target);
                    "button" !== t[0].nodeName.toLowerCase() &&
                      (t = t.parent()),
                      t.triggerHandler("click");
                  }
                }),
                (u.$onKeyDown = function (e) {
                  if (
                    /(38|37|39|40|13)/.test(e.keyCode) &&
                    !e.shiftKey &&
                    !e.altKey
                  ) {
                    if (
                      (e.preventDefault(),
                      e.stopPropagation(),
                      13 === e.keyCode)
                    )
                      return g.$mode
                        ? g.$apply(function () {
                            u.setMode(g.$mode - 1);
                          })
                        : u.hide(!0);
                    h.onKeyDown(e), f.$digest();
                  }
                });
              var v = u.init;
              u.init = function () {
                return c && p.useNative
                  ? (t.prop("type", "date"),
                    void t.css("-webkit-appearance", "textfield"))
                  : (d &&
                      (t.prop("type", "text"),
                      t.attr("readonly", "true"),
                      t.on("click", i)),
                    void v());
              };
              var w = u.destroy;
              u.destroy = function () {
                c && p.useNative && t.off("click", i), w();
              };
              var y = u.show;
              u.show = function () {
                y(),
                  l(
                    function () {
                      u.$isShown &&
                        (u.$element.on(
                          d ? "touchstart" : "mousedown",
                          u.$onMouseDown
                        ),
                        p.keyboard && t.on("keydown", u.$onKeyDown));
                    },
                    0,
                    !1
                  );
              };
              var b = u.hide;
              return (
                (u.hide = function (e) {
                  u.$isShown &&
                    (u.$element.off(
                      d ? "touchstart" : "mousedown",
                      u.$onMouseDown
                    ),
                    p.keyboard && t.off("keydown", u.$onKeyDown),
                    b(e));
                }),
                u
              );
            }
            var c =
                (angular.element(t.document.body),
                /(ip(a|o)d|iphone|android)/gi.test(t.navigator.userAgent)),
              d = "createTouch" in t.document && c;
            return (
              e.lang || (e.lang = i.getDefaultLocale()), (u.defaults = e), u
            );
          },
        ];
      })
      .directive("bsDatepicker", [
        "$window",
        "$parse",
        "$q",
        "$dateFormatter",
        "$dateParser",
        "$datepicker",
        function (e, t, n, a, o, i) {
          var r =
            (i.defaults,
            /(ip(a|o)d|iphone|android)/gi.test(e.navigator.userAgent));
          return {
            restrict: "EAC",
            require: "ngModel",
            link: function (e, t, n, s) {
              function l(e) {
                return e && e.length ? e : null;
              }
              function u(e) {
                if (angular.isDate(e)) {
                  var t =
                      isNaN(p.$options.minDate) ||
                      e.getTime() >= p.$options.minDate,
                    n =
                      isNaN(p.$options.maxDate) ||
                      e.getTime() <= p.$options.maxDate,
                    a = t && n;
                  s.$setValidity("date", a),
                    s.$setValidity("min", t),
                    s.$setValidity("max", n),
                    a && (s.$dateValue = e);
                }
              }
              function c() {
                return !s.$dateValue || isNaN(s.$dateValue.getTime())
                  ? ""
                  : m(s.$dateValue, d.dateFormat);
              }
              var d = { scope: e, controller: s };
              angular.forEach(
                [
                  "placement",
                  "container",
                  "delay",
                  "trigger",
                  "html",
                  "animation",
                  "template",
                  "autoclose",
                  "dateType",
                  "dateFormat",
                  "timezone",
                  "modelDateFormat",
                  "dayFormat",
                  "strictFormat",
                  "startWeek",
                  "startDate",
                  "useNative",
                  "lang",
                  "startView",
                  "minView",
                  "iconLeft",
                  "iconRight",
                  "daysOfWeekDisabled",
                  "id",
                  "prefixClass",
                  "prefixEvent",
                ],
                function (e) {
                  angular.isDefined(n[e]) && (d[e] = n[e]);
                }
              );
              var f = /^(false|0|)$/i;
              angular.forEach(
                ["html", "container", "autoclose", "useNative"],
                function (e) {
                  angular.isDefined(n[e]) && f.test(n[e]) && (d[e] = !1);
                }
              ),
                n.bsShow &&
                  e.$watch(n.bsShow, function (e, t) {
                    p &&
                      angular.isDefined(e) &&
                      (angular.isString(e) &&
                        (e = !!e.match(/true|,?(datepicker),?/i)),
                      e === !0 ? p.show() : p.hide());
                  });
              var p = i(t, s, d);
              (d = p.$options),
                r && d.useNative && (d.dateFormat = "yyyy-MM-dd");
              var g = d.lang,
                m = function (e, t) {
                  return a.formatDate(e, t, g);
                },
                $ = o({
                  format: d.dateFormat,
                  lang: g,
                  strict: d.strictFormat,
                });
              angular.forEach(["minDate", "maxDate"], function (e) {
                angular.isDefined(n[e]) &&
                  n.$observe(e, function (t) {
                    (p.$options[e] = $.getDateForAttribute(e, t)),
                      !isNaN(p.$options[e]) && p.$build(!1),
                      u(s.$dateValue);
                  });
              }),
                e.$watch(
                  n.ngModel,
                  function (e, t) {
                    p.update(s.$dateValue);
                  },
                  !0
                ),
                angular.isDefined(n.disabledDates) &&
                  e.$watch(n.disabledDates, function (e, t) {
                    (e = l(e)), (t = l(t)), e && p.updateDisabledDates(e);
                  }),
                s.$parsers.unshift(function (e) {
                  var t;
                  if (!e) return s.$setValidity("date", !0), null;
                  var n = $.parse(e, s.$dateValue);
                  return !n || isNaN(n.getTime())
                    ? void s.$setValidity("date", !1)
                    : (u(n),
                      "string" === d.dateType
                        ? ((t = $.timezoneOffsetAdjust(n, d.timezone, !0)),
                          m(t, d.modelDateFormat || d.dateFormat))
                        : ((t = $.timezoneOffsetAdjust(
                            s.$dateValue,
                            d.timezone,
                            !0
                          )),
                          "number" === d.dateType
                            ? t.getTime()
                            : "unix" === d.dateType
                            ? t.getTime() / 1e3
                            : "iso" === d.dateType
                            ? t.toISOString()
                            : new Date(t)));
                }),
                s.$formatters.push(function (e) {
                  var t;
                  return (
                    (t =
                      angular.isUndefined(e) || null === e
                        ? 0 / 0
                        : angular.isDate(e)
                        ? e
                        : "string" === d.dateType
                        ? $.parse(e, null, d.modelDateFormat)
                        : new Date("unix" === d.dateType ? 1e3 * e : e)),
                    (s.$dateValue = $.timezoneOffsetAdjust(t, d.timezone)),
                    c()
                  );
                }),
                (s.$render = function () {
                  t.val(c());
                }),
                e.$on("$destroy", function () {
                  p && p.destroy(), (d = null), (p = null);
                });
            },
          };
        },
      ])
      .provider("datepickerViews", function () {
        function e(e, t) {
          for (var n = []; e.length > 0; ) n.push(e.splice(0, t));
          return n;
        }
        function t(e, t) {
          return ((e % t) + t) % t;
        }
        this.defaults = { dayFormat: "dd", daySplit: 7 };
        this.$get = [
          "$dateFormatter",
          "$dateParser",
          "$sce",
          function (n, a, o) {
            return function (i) {
              var r = i.$scope,
                s = i.$options,
                l = s.lang,
                u = function (e, t) {
                  return n.formatDate(e, t, l);
                },
                c = a({
                  format: s.dateFormat,
                  lang: l,
                  strict: s.strictFormat,
                }),
                d = n.weekdaysShort(l),
                f = d.slice(s.startWeek).concat(d.slice(0, s.startWeek)),
                p = o.trustAsHtml(
                  '<th class="dow text-center">' +
                    f.join('</th><th class="dow text-center">') +
                    "</th>"
                ),
                g =
                  i.$date ||
                  (s.startDate
                    ? c.getDateForAttribute("startDate", s.startDate)
                    : new Date()),
                m = {
                  year: g.getFullYear(),
                  month: g.getMonth(),
                  date: g.getDate(),
                },
                $ = [
                  {
                    format: s.dayFormat,
                    split: 7,
                    steps: { month: 1 },
                    update: function (e, t) {
                      !this.built ||
                      t ||
                      e.getFullYear() !== m.year ||
                      e.getMonth() !== m.month
                        ? (angular.extend(m, {
                            year: i.$date.getFullYear(),
                            month: i.$date.getMonth(),
                            date: i.$date.getDate(),
                          }),
                          i.$build())
                        : (e.getDate() !== m.date || 1 === e.getDate()) &&
                          ((m.date = i.$date.getDate()), i.$updateSelected());
                    },
                    build: function () {
                      var n = new Date(m.year, m.month, 1),
                        a = n.getTimezoneOffset(),
                        o = new Date(
                          +n - 864e5 * t(n.getDay() - s.startWeek, 7)
                        ),
                        l = o.getTimezoneOffset(),
                        d = c
                          .timezoneOffsetAdjust(new Date(), s.timezone)
                          .toDateString();
                      l !== a && (o = new Date(+o + 6e4 * (l - a)));
                      for (var f, g = [], $ = 0; 42 > $; $++)
                        (f = c.daylightSavingAdjust(
                          new Date(
                            o.getFullYear(),
                            o.getMonth(),
                            o.getDate() + $
                          )
                        )),
                          g.push({
                            date: f,
                            isToday: f.toDateString() === d,
                            label: u(f, this.format),
                            selected: i.$date && this.isSelected(f),
                            muted: f.getMonth() !== m.month,
                            disabled: this.isDisabled(f),
                          });
                      (r.title = u(n, s.monthTitleFormat)),
                        (r.showLabels = !0),
                        (r.labels = p),
                        (r.rows = e(g, this.split)),
                        (this.built = !0);
                    },
                    isSelected: function (e) {
                      return (
                        i.$date &&
                        e.getFullYear() === i.$date.getFullYear() &&
                        e.getMonth() === i.$date.getMonth() &&
                        e.getDate() === i.$date.getDate()
                      );
                    },
                    isDisabled: function (e) {
                      var t = e.getTime();
                      if (t < s.minDate || t > s.maxDate) return !0;
                      if (-1 !== s.daysOfWeekDisabled.indexOf(e.getDay()))
                        return !0;
                      if (s.disabledDateRanges)
                        for (var n = 0; n < s.disabledDateRanges.length; n++)
                          if (
                            t >= s.disabledDateRanges[n].start &&
                            t <= s.disabledDateRanges[n].end
                          )
                            return !0;
                      return !1;
                    },
                    onKeyDown: function (e) {
                      if (i.$date) {
                        var t,
                          n = i.$date.getTime();
                        37 === e.keyCode
                          ? (t = new Date(n - 864e5))
                          : 38 === e.keyCode
                          ? (t = new Date(n - 6048e5))
                          : 39 === e.keyCode
                          ? (t = new Date(n + 864e5))
                          : 40 === e.keyCode && (t = new Date(n + 6048e5)),
                          this.isDisabled(t) || i.select(t, !0);
                      }
                    },
                  },
                  {
                    name: "month",
                    format: s.monthFormat,
                    split: 4,
                    steps: { year: 1 },
                    update: function (e, t) {
                      this.built && e.getFullYear() === m.year
                        ? e.getMonth() !== m.month &&
                          (angular.extend(m, {
                            month: i.$date.getMonth(),
                            date: i.$date.getDate(),
                          }),
                          i.$updateSelected())
                        : (angular.extend(m, {
                            year: i.$date.getFullYear(),
                            month: i.$date.getMonth(),
                            date: i.$date.getDate(),
                          }),
                          i.$build());
                    },
                    build: function () {
                      for (
                        var t, n = (new Date(m.year, 0, 1), []), a = 0;
                        12 > a;
                        a++
                      )
                        (t = new Date(m.year, a, 1)),
                          n.push({
                            date: t,
                            label: u(t, this.format),
                            selected: i.$isSelected(t),
                            disabled: this.isDisabled(t),
                          });
                      (r.title = u(t, s.yearTitleFormat)),
                        (r.showLabels = !1),
                        (r.rows = e(n, this.split)),
                        (this.built = !0);
                    },
                    isSelected: function (e) {
                      return (
                        i.$date &&
                        e.getFullYear() === i.$date.getFullYear() &&
                        e.getMonth() === i.$date.getMonth()
                      );
                    },
                    isDisabled: function (e) {
                      var t = +new Date(e.getFullYear(), e.getMonth() + 1, 0);
                      return t < s.minDate || e.getTime() > s.maxDate;
                    },
                    onKeyDown: function (e) {
                      if (i.$date) {
                        var t = i.$date.getMonth(),
                          n = new Date(i.$date);
                        37 === e.keyCode
                          ? n.setMonth(t - 1)
                          : 38 === e.keyCode
                          ? n.setMonth(t - 4)
                          : 39 === e.keyCode
                          ? n.setMonth(t + 1)
                          : 40 === e.keyCode && n.setMonth(t + 4),
                          this.isDisabled(n) || i.select(n, !0);
                      }
                    },
                  },
                  {
                    name: "year",
                    format: s.yearFormat,
                    split: 4,
                    steps: { year: 12 },
                    update: function (e, t) {
                      !this.built ||
                      t ||
                      parseInt(e.getFullYear() / 20, 10) !==
                        parseInt(m.year / 20, 10)
                        ? (angular.extend(m, {
                            year: i.$date.getFullYear(),
                            month: i.$date.getMonth(),
                            date: i.$date.getDate(),
                          }),
                          i.$build())
                        : e.getFullYear() !== m.year &&
                          (angular.extend(m, {
                            year: i.$date.getFullYear(),
                            month: i.$date.getMonth(),
                            date: i.$date.getDate(),
                          }),
                          i.$updateSelected());
                    },
                    build: function () {
                      for (
                        var t,
                          n = m.year - (m.year % (3 * this.split)),
                          a = [],
                          o = 0;
                        12 > o;
                        o++
                      )
                        (t = new Date(n + o, 0, 1)),
                          a.push({
                            date: t,
                            label: u(t, this.format),
                            selected: i.$isSelected(t),
                            disabled: this.isDisabled(t),
                          });
                      (r.title = a[0].label + "-" + a[a.length - 1].label),
                        (r.showLabels = !1),
                        (r.rows = e(a, this.split)),
                        (this.built = !0);
                    },
                    isSelected: function (e) {
                      return (
                        i.$date && e.getFullYear() === i.$date.getFullYear()
                      );
                    },
                    isDisabled: function (e) {
                      var t = +new Date(e.getFullYear() + 1, 0, 0);
                      return t < s.minDate || e.getTime() > s.maxDate;
                    },
                    onKeyDown: function (e) {
                      if (i.$date) {
                        var t = i.$date.getFullYear(),
                          n = new Date(i.$date);
                        37 === e.keyCode
                          ? n.setYear(t - 1)
                          : 38 === e.keyCode
                          ? n.setYear(t - 4)
                          : 39 === e.keyCode
                          ? n.setYear(t + 1)
                          : 40 === e.keyCode && n.setYear(t + 4),
                          this.isDisabled(n) || i.select(n, !0);
                      }
                    },
                  },
                ];
              return {
                views: s.minView ? Array.prototype.slice.call($, s.minView) : $,
                viewDate: m,
              };
            };
          },
        ];
      }),
    angular
      .module("mgcrea.ngStrap.dropdown", ["mgcrea.ngStrap.tooltip"])
      .provider("$dropdown", function () {
        var e = (this.defaults = {
          animation: "am-fade",
          prefixClass: "dropdown",
          prefixEvent: "dropdown",
          placement: "bottom-left",
          template: "dropdown/dropdown.tpl.html",
          trigger: "click",
          container: !1,
          keyboard: !0,
          html: !1,
          delay: 0,
        });
        this.$get = [
          "$window",
          "$rootScope",
          "$tooltip",
          "$timeout",
          function (t, n, a, o) {
            function i(t, i) {
              function l(e) {
                return e.target !== t[0]
                  ? e.target !== t[0] && u.hide()
                  : void 0;
              }
              {
                var u = {},
                  c = angular.extend({}, e, i);
                u.$scope = (c.scope && c.scope.$new()) || n.$new();
              }
              u = a(t, c);
              var d = t.parent();
              u.$onKeyDown = function (e) {
                if (/(38|40)/.test(e.keyCode)) {
                  e.preventDefault(), e.stopPropagation();
                  var t = angular.element(
                    u.$element[0].querySelectorAll("li:not(.divider) a")
                  );
                  if (t.length) {
                    var n;
                    angular.forEach(t, function (e, t) {
                      s && s.call(e, ":focus") && (n = t);
                    }),
                      38 === e.keyCode && n > 0
                        ? n--
                        : 40 === e.keyCode && n < t.length - 1
                        ? n++
                        : angular.isUndefined(n) && (n = 0),
                      t.eq(n)[0].focus();
                  }
                }
              };
              var f = u.show;
              u.show = function () {
                f(),
                  o(
                    function () {
                      c.keyboard &&
                        u.$element &&
                        u.$element.on("keydown", u.$onKeyDown),
                        r.on("click", l);
                    },
                    0,
                    !1
                  ),
                  d.hasClass("dropdown") && d.addClass("open");
              };
              var p = u.hide;
              u.hide = function () {
                u.$isShown &&
                  (c.keyboard &&
                    u.$element &&
                    u.$element.off("keydown", u.$onKeyDown),
                  r.off("click", l),
                  d.hasClass("dropdown") && d.removeClass("open"),
                  p());
              };
              var g = u.destroy;
              return (
                (u.destroy = function () {
                  r.off("click", l), g();
                }),
                u
              );
            }
            var r = angular.element(t.document.body),
              s =
                Element.prototype.matchesSelector ||
                Element.prototype.webkitMatchesSelector ||
                Element.prototype.mozMatchesSelector ||
                Element.prototype.msMatchesSelector ||
                Element.prototype.oMatchesSelector;
            return i;
          },
        ];
      })
      .directive("bsDropdown", [
        "$window",
        "$sce",
        "$dropdown",
        function (e, t, n) {
          return {
            restrict: "EAC",
            scope: !0,
            link: function (e, t, a, o) {
              var i = { scope: e };
              angular.forEach(
                [
                  "placement",
                  "container",
                  "delay",
                  "trigger",
                  "keyboard",
                  "html",
                  "animation",
                  "template",
                  "id",
                ],
                function (e) {
                  angular.isDefined(a[e]) && (i[e] = a[e]);
                }
              );
              var r = /^(false|0|)$/i;
              angular.forEach(["html", "container"], function (e) {
                angular.isDefined(a[e]) && r.test(a[e]) && (i[e] = !1);
              }),
                a.bsDropdown &&
                  e.$watch(
                    a.bsDropdown,
                    function (t, n) {
                      e.content = t;
                    },
                    !0
                  ),
                a.bsShow &&
                  e.$watch(a.bsShow, function (e, t) {
                    s &&
                      angular.isDefined(e) &&
                      (angular.isString(e) &&
                        (e = !!e.match(/true|,?(dropdown),?/i)),
                      e === !0 ? s.show() : s.hide());
                  });
              var s = n(t, i);
              e.$on("$destroy", function () {
                s && s.destroy(), (i = null), (s = null);
              });
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.button", [])
      .provider("$button", function () {
        var e = (this.defaults = {
          activeClass: "active",
          toggleEvent: "click",
        });
        this.$get = function () {
          return { defaults: e };
        };
      })
      .directive("bsCheckboxGroup", function () {
        return {
          restrict: "A",
          require: "ngModel",
          compile: function (e, t) {
            e.attr("data-toggle", "buttons"), e.removeAttr("ng-model");
            var n = e[0].querySelectorAll('input[type="checkbox"]');
            angular.forEach(n, function (e) {
              var n = angular.element(e);
              n.attr("bs-checkbox", ""),
                n.attr("ng-model", t.ngModel + "." + n.attr("value"));
            });
          },
        };
      })
      .directive("bsCheckbox", [
        "$button",
        "$$rAF",
        function (e, t) {
          var n = e.defaults,
            a = /^(true|false|\d+)$/;
          return {
            restrict: "A",
            require: "ngModel",
            link: function (e, o, i, r) {
              var s = n,
                l = "INPUT" === o[0].nodeName,
                u = l ? o.parent() : o,
                c = angular.isDefined(i.trueValue) ? i.trueValue : !0;
              a.test(i.trueValue) && (c = e.$eval(i.trueValue));
              var d = angular.isDefined(i.falseValue) ? i.falseValue : !1;
              a.test(i.falseValue) && (d = e.$eval(i.falseValue));
              var f = "boolean" != typeof c || "boolean" != typeof d;
              f &&
                (r.$parsers.push(function (e) {
                  return e ? c : d;
                }),
                r.$formatters.push(function (e) {
                  return angular.equals(e, c);
                }),
                e.$watch(i.ngModel, function (e, t) {
                  r.$render();
                })),
                (r.$render = function () {
                  var e = angular.equals(r.$modelValue, c);
                  t(function () {
                    l && (o[0].checked = e), u.toggleClass(s.activeClass, e);
                  });
                }),
                o.bind(s.toggleEvent, function () {
                  e.$apply(function () {
                    l || r.$setViewValue(!u.hasClass("active")),
                      f || r.$render();
                  });
                });
            },
          };
        },
      ])
      .directive("bsRadioGroup", function () {
        return {
          restrict: "A",
          require: "ngModel",
          compile: function (e, t) {
            e.attr("data-toggle", "buttons"), e.removeAttr("ng-model");
            var n = e[0].querySelectorAll('input[type="radio"]');
            angular.forEach(n, function (e) {
              angular.element(e).attr("bs-radio", ""),
                angular.element(e).attr("ng-model", t.ngModel);
            });
          },
        };
      })
      .directive("bsRadio", [
        "$button",
        "$$rAF",
        function (e, t) {
          var n = e.defaults,
            a = /^(true|false|\d+)$/;
          return {
            restrict: "A",
            require: "ngModel",
            link: function (e, o, i, r) {
              var s,
                l = n,
                u = "INPUT" === o[0].nodeName,
                c = u ? o.parent() : o;
              i.$observe("value", function (t) {
                (s = a.test(t) ? e.$eval(t) : t), r.$render();
              }),
                (r.$render = function () {
                  var e = angular.equals(r.$modelValue, s);
                  t(function () {
                    u && (o[0].checked = e), c.toggleClass(l.activeClass, e);
                  });
                }),
                o.bind(l.toggleEvent, function () {
                  e.$apply(function () {
                    r.$setViewValue(s), r.$render();
                  });
                });
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.helpers.dateFormatter", [])
      .service("$dateFormatter", [
        "$locale",
        "dateFilter",
        function (e, t) {
          function n(e) {
            return /(h+)([:\.])?(m+)([:\.])?(s*)[ ]?(a?)/i.exec(e).slice(1);
          }
          (this.getDefaultLocale = function () {
            return e.id;
          }),
            (this.getDatetimeFormat = function (t, n) {
              return e.DATETIME_FORMATS[t] || t;
            }),
            (this.weekdaysShort = function (t) {
              return e.DATETIME_FORMATS.SHORTDAY;
            }),
            (this.hoursFormat = function (e) {
              return n(e)[0];
            }),
            (this.minutesFormat = function (e) {
              return n(e)[2];
            }),
            (this.secondsFormat = function (e) {
              return n(e)[4];
            }),
            (this.timeSeparator = function (e) {
              return n(e)[1];
            }),
            (this.showSeconds = function (e) {
              return !!n(e)[4];
            }),
            (this.showAM = function (e) {
              return !!n(e)[5];
            }),
            (this.formatDate = function (e, n, a, o) {
              return t(e, n, o);
            });
        },
      ]),
    angular
      .module("mgcrea.ngStrap.helpers.dateParser", [])
      .provider("$dateParser", [
        "$localeProvider",
        function (e) {
          function t() {
            (this.year = 1970),
              (this.month = 0),
              (this.day = 1),
              (this.hours = 0),
              (this.minutes = 0),
              (this.seconds = 0),
              (this.milliseconds = 0);
          }
          function n() {}
          function a(e) {
            return !isNaN(parseFloat(e)) && isFinite(e);
          }
          function o(e, t) {
            for (
              var n = e.length, a = t.toString().toLowerCase(), o = 0;
              n > o;
              o++
            )
              if (e[o].toLowerCase() === a) return o;
            return -1;
          }
          (t.prototype.setMilliseconds = function (e) {
            this.milliseconds = e;
          }),
            (t.prototype.setSeconds = function (e) {
              this.seconds = e;
            }),
            (t.prototype.setMinutes = function (e) {
              this.minutes = e;
            }),
            (t.prototype.setHours = function (e) {
              this.hours = e;
            }),
            (t.prototype.getHours = function () {
              return this.hours;
            }),
            (t.prototype.setDate = function (e) {
              this.day = e;
            }),
            (t.prototype.setMonth = function (e) {
              this.month = e;
            }),
            (t.prototype.setFullYear = function (e) {
              this.year = e;
            }),
            (t.prototype.fromDate = function (e) {
              return (
                (this.year = e.getFullYear()),
                (this.month = e.getMonth()),
                (this.day = e.getDate()),
                (this.hours = e.getHours()),
                (this.minutes = e.getMinutes()),
                (this.seconds = e.getSeconds()),
                (this.milliseconds = e.getMilliseconds()),
                this
              );
            }),
            (t.prototype.toDate = function () {
              return new Date(
                this.year,
                this.month,
                this.day,
                this.hours,
                this.minutes,
                this.seconds,
                this.milliseconds
              );
            });
          var i = t.prototype,
            r = (this.defaults = { format: "shortDate", strict: !1 });
          this.$get = [
            "$locale",
            "dateFilter",
            function (e, s) {
              var l = function (l) {
                function u(e) {
                  var t,
                    n = Object.keys(h),
                    a = [],
                    o = [],
                    i = e;
                  for (t = 0; t < n.length; t++)
                    if (e.split(n[t]).length > 1) {
                      var r = i.search(n[t]);
                      (e = e.split(n[t]).join("")), h[n[t]] && (a[r] = h[n[t]]);
                    }
                  return (
                    angular.forEach(a, function (e) {
                      e && o.push(e);
                    }),
                    o
                  );
                }
                function c(e) {
                  return e
                    .replace(/\//g, "[\\/]")
                    .replace("/-/g", "[-]")
                    .replace(/\./g, "[.]")
                    .replace(/\\s/g, "[\\s]");
                }
                function d(e) {
                  var t,
                    n = Object.keys($),
                    a = e;
                  for (t = 0; t < n.length; t++)
                    a = a.split(n[t]).join("${" + t + "}");
                  for (t = 0; t < n.length; t++)
                    a = a.split("${" + t + "}").join("(" + $[n[t]] + ")");
                  return (e = c(e)), new RegExp("^" + a + "$", ["i"]);
                }
                var f,
                  p,
                  g = angular.extend({}, r, l),
                  m = {},
                  $ = {
                    sss: "[0-9]{3}",
                    ss: "[0-5][0-9]",
                    s: g.strict ? "[1-5]?[0-9]" : "[0-9]|[0-5][0-9]",
                    mm: "[0-5][0-9]",
                    m: g.strict ? "[1-5]?[0-9]" : "[0-9]|[0-5][0-9]",
                    HH: "[01][0-9]|2[0-3]",
                    H: g.strict ? "1?[0-9]|2[0-3]" : "[01]?[0-9]|2[0-3]",
                    hh: "[0][1-9]|[1][012]",
                    h: g.strict ? "[1-9]|1[012]" : "0?[1-9]|1[012]",
                    a: "AM|PM",
                    EEEE: e.DATETIME_FORMATS.DAY.join("|"),
                    EEE: e.DATETIME_FORMATS.SHORTDAY.join("|"),
                    dd: "0[1-9]|[12][0-9]|3[01]",
                    d: g.strict
                      ? "[1-9]|[1-2][0-9]|3[01]"
                      : "0?[1-9]|[1-2][0-9]|3[01]",
                    MMMM: e.DATETIME_FORMATS.MONTH.join("|"),
                    MMM: e.DATETIME_FORMATS.SHORTMONTH.join("|"),
                    MM: "0[1-9]|1[012]",
                    M: g.strict ? "[1-9]|1[012]" : "0?[1-9]|1[012]",
                    yyyy: "[1]{1}[0-9]{3}|[2]{1}[0-9]{3}",
                    yy: "[0-9]{2}",
                    y: g.strict ? "-?(0|[1-9][0-9]{0,3})" : "-?0*[0-9]{1,4}",
                  },
                  h = {
                    sss: i.setMilliseconds,
                    ss: i.setSeconds,
                    s: i.setSeconds,
                    mm: i.setMinutes,
                    m: i.setMinutes,
                    HH: i.setHours,
                    H: i.setHours,
                    hh: i.setHours,
                    h: i.setHours,
                    EEEE: n,
                    EEE: n,
                    dd: i.setDate,
                    d: i.setDate,
                    a: function (e) {
                      var t = this.getHours() % 12;
                      return this.setHours(e.match(/pm/i) ? t + 12 : t);
                    },
                    MMMM: function (t) {
                      return this.setMonth(o(e.DATETIME_FORMATS.MONTH, t));
                    },
                    MMM: function (t) {
                      return this.setMonth(o(e.DATETIME_FORMATS.SHORTMONTH, t));
                    },
                    MM: function (e) {
                      return this.setMonth(1 * e - 1);
                    },
                    M: function (e) {
                      return this.setMonth(1 * e - 1);
                    },
                    yyyy: i.setFullYear,
                    yy: function (e) {
                      return this.setFullYear(2e3 + 1 * e);
                    },
                    y: i.setFullYear,
                  };
                return (
                  (m.init = function () {
                    (m.$format = e.DATETIME_FORMATS[g.format] || g.format),
                      (f = d(m.$format)),
                      (p = u(m.$format));
                  }),
                  (m.isValid = function (e) {
                    return angular.isDate(e) ? !isNaN(e.getTime()) : f.test(e);
                  }),
                  (m.parse = function (n, a, o, i) {
                    o && (o = e.DATETIME_FORMATS[o] || o),
                      angular.isDate(n) && (n = s(n, o || m.$format, i));
                    var r = o ? d(o) : f,
                      l = o ? u(o) : p,
                      c = r.exec(n);
                    if (!c) return !1;
                    for (
                      var g = new t().fromDate(
                          a && !isNaN(a.getTime()) ? a : new Date(1970, 0, 1, 0)
                        ),
                        $ = 0;
                      $ < c.length - 1;
                      $++
                    )
                      l[$] && l[$].call(g, c[$ + 1]);
                    var h = g.toDate();
                    return parseInt(g.day, 10) !== h.getDate() ? !1 : h;
                  }),
                  (m.getDateForAttribute = function (e, t) {
                    var n;
                    if ("today" === t) {
                      var o = new Date();
                      n = new Date(
                        o.getFullYear(),
                        o.getMonth(),
                        o.getDate() + ("maxDate" === e ? 1 : 0),
                        0,
                        0,
                        0,
                        "minDate" === e ? 0 : -1
                      );
                    } else
                      n =
                        angular.isString(t) && t.match(/^".+"$/)
                          ? new Date(t.substr(1, t.length - 2))
                          : a(t)
                          ? new Date(parseInt(t, 10))
                          : angular.isString(t) && 0 === t.length
                          ? "minDate" === e
                            ? -(1 / 0)
                            : +(1 / 0)
                          : new Date(t);
                    return n;
                  }),
                  (m.getTimeForAttribute = function (e, t) {
                    var n;
                    return (n =
                      "now" === t
                        ? new Date().setFullYear(1970, 0, 1)
                        : angular.isString(t) && t.match(/^".+"$/)
                        ? new Date(t.substr(1, t.length - 2)).setFullYear(
                            1970,
                            0,
                            1
                          )
                        : a(t)
                        ? new Date(parseInt(t, 10)).setFullYear(1970, 0, 1)
                        : angular.isString(t) && 0 === t.length
                        ? "minTime" === e
                          ? -(1 / 0)
                          : +(1 / 0)
                        : m.parse(t, new Date(1970, 0, 1, 0)));
                  }),
                  (m.daylightSavingAdjust = function (e) {
                    return e
                      ? (e.setHours(e.getHours() > 12 ? e.getHours() + 2 : 0),
                        e)
                      : null;
                  }),
                  (m.timezoneOffsetAdjust = function (e, t, n) {
                    return e
                      ? (t &&
                          "UTC" === t &&
                          ((e = new Date(e.getTime())),
                          e.setMinutes(
                            e.getMinutes() +
                              (n ? -1 : 1) * e.getTimezoneOffset()
                          )),
                        e)
                      : null;
                  }),
                  m.init(),
                  m
                );
              };
              return l;
            },
          ];
        },
      ]),
    angular
      .module("mgcrea.ngStrap.helpers.debounce", [])
      .factory("debounce", [
        "$timeout",
        function (e) {
          return function (t, n, a) {
            var o = null;
            return function () {
              var i = this,
                r = arguments,
                s = a && !o;
              return (
                o && e.cancel(o),
                (o = e(
                  function () {
                    (o = null), a || t.apply(i, r);
                  },
                  n,
                  !1
                )),
                s && t.apply(i, r),
                o
              );
            };
          };
        },
      ])
      .factory("throttle", [
        "$timeout",
        function (e) {
          return function (t, n, a) {
            var o = null;
            return (
              a || (a = {}),
              function () {
                var i = this,
                  r = arguments;
                o ||
                  (a.leading !== !1 && t.apply(i, r),
                  (o = e(
                    function () {
                      (o = null), a.trailing !== !1 && t.apply(i, r);
                    },
                    n,
                    !1
                  )));
              }
            );
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.helpers.dimensions", [])
      .factory("dimensions", [
        "$document",
        "$window",
        function (t, n) {
          var a = (angular.element, {}),
            o = (a.nodeName = function (e, t) {
              return e.nodeName && e.nodeName.toLowerCase() === t.toLowerCase();
            });
          (a.css = function (t, n, a) {
            var o;
            return (
              (o = t.currentStyle
                ? t.currentStyle[n]
                : e.getComputedStyle
                ? e.getComputedStyle(t)[n]
                : t.style[n]),
              a === !0 ? parseFloat(o) || 0 : o
            );
          }),
            (a.offset = function (t) {
              var n = t.getBoundingClientRect(),
                a = t.ownerDocument;
              return {
                width: n.width || t.offsetWidth,
                height: n.height || t.offsetHeight,
                top:
                  n.top +
                  (e.pageYOffset || a.documentElement.scrollTop) -
                  (a.documentElement.clientTop || 0),
                left:
                  n.left +
                  (e.pageXOffset || a.documentElement.scrollLeft) -
                  (a.documentElement.clientLeft || 0),
              };
            }),
            (a.setOffset = function (e, t, n) {
              var o,
                i,
                r,
                s,
                l,
                u,
                c,
                d = a.css(e, "position"),
                f = angular.element(e),
                p = {};
              "static" === d && (e.style.position = "relative"),
                (l = a.offset(e)),
                (r = a.css(e, "top")),
                (u = a.css(e, "left")),
                (c =
                  ("absolute" === d || "fixed" === d) &&
                  (r + u).indexOf("auto") > -1),
                c
                  ? ((o = a.position(e)), (s = o.top), (i = o.left))
                  : ((s = parseFloat(r) || 0), (i = parseFloat(u) || 0)),
                angular.isFunction(t) && (t = t.call(e, n, l)),
                null !== t.top && (p.top = t.top - l.top + s),
                null !== t.left && (p.left = t.left - l.left + i),
                "using" in t
                  ? t.using.call(f, p)
                  : f.css({ top: p.top + "px", left: p.left + "px" });
            }),
            (a.position = function (e) {
              var t,
                n,
                r = { top: 0, left: 0 };
              return (
                "fixed" === a.css(e, "position")
                  ? (n = e.getBoundingClientRect())
                  : ((t = i(e)),
                    (n = a.offset(e)),
                    o(t, "html") || (r = a.offset(t)),
                    (r.top += a.css(t, "borderTopWidth", !0)),
                    (r.left += a.css(t, "borderLeftWidth", !0))),
                {
                  width: e.offsetWidth,
                  height: e.offsetHeight,
                  top: n.top - r.top - a.css(e, "marginTop", !0),
                  left: n.left - r.left - a.css(e, "marginLeft", !0),
                }
              );
            });
          var i = function (e) {
            var t = e.ownerDocument,
              n = e.offsetParent || t;
            if (o(n, "#document")) return t.documentElement;
            for (; n && !o(n, "html") && "static" === a.css(n, "position"); )
              n = n.offsetParent;
            return n || t.documentElement;
          };
          return (
            (a.height = function (e, t) {
              var n = e.offsetHeight;
              return (
                t
                  ? (n +=
                      a.css(e, "marginTop", !0) + a.css(e, "marginBottom", !0))
                  : (n -=
                      a.css(e, "paddingTop", !0) +
                      a.css(e, "paddingBottom", !0) +
                      a.css(e, "borderTopWidth", !0) +
                      a.css(e, "borderBottomWidth", !0)),
                n
              );
            }),
            (a.width = function (e, t) {
              var n = e.offsetWidth;
              return (
                t
                  ? (n +=
                      a.css(e, "marginLeft", !0) + a.css(e, "marginRight", !0))
                  : (n -=
                      a.css(e, "paddingLeft", !0) +
                      a.css(e, "paddingRight", !0) +
                      a.css(e, "borderLeftWidth", !0) +
                      a.css(e, "borderRightWidth", !0)),
                n
              );
            }),
            a
          );
        },
      ]),
    angular
      .module("mgcrea.ngStrap.helpers.parseOptions", [])
      .provider("$parseOptions", function () {
        var e = (this.defaults = {
          regexp:
            /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/,
        });
        this.$get = [
          "$parse",
          "$q",
          function (t, n) {
            function a(a, o) {
              function i(e, t) {
                return e.map(function (e, n) {
                  var a,
                    o,
                    i = {};
                  return (
                    (i[c] = e),
                    (a = u(t, i)),
                    (o = p(t, i)),
                    { label: a, value: o, index: n }
                  );
                });
              }
              var r = {},
                s = angular.extend({}, e, o);
              r.$values = [];
              var l, u, c, d, f, p, g;
              return (
                (r.init = function () {
                  (r.$match = l = a.match(s.regexp)),
                    (u = t(l[2] || l[1])),
                    (c = l[4] || l[6]),
                    (d = l[5]),
                    (f = t(l[3] || "")),
                    (p = t(l[2] ? l[1] : c)),
                    (g = t(l[7]));
                }),
                (r.valuesFn = function (e, t) {
                  return n.when(g(e, t)).then(function (t) {
                    return (r.$values = t ? i(t, e) : {}), r.$values;
                  });
                }),
                (r.displayValue = function (e) {
                  var t = {};
                  return (t[c] = e), u(t);
                }),
                r.init(),
                r
              );
            }
            return a;
          },
        ];
      }),
    angular.version.minor < 3 &&
      angular.version.dot < 14 &&
      angular.module("ng").factory("$$rAF", [
        "$window",
        "$timeout",
        function (e, t) {
          var n =
              e.requestAnimationFrame ||
              e.webkitRequestAnimationFrame ||
              e.mozRequestAnimationFrame,
            a =
              e.cancelAnimationFrame ||
              e.webkitCancelAnimationFrame ||
              e.mozCancelAnimationFrame ||
              e.webkitCancelRequestAnimationFrame,
            o = !!n,
            i = o
              ? function (e) {
                  var t = n(e);
                  return function () {
                    a(t);
                  };
                }
              : function (e) {
                  var n = t(e, 16.66, !1);
                  return function () {
                    t.cancel(n);
                  };
                };
          return (i.supported = o), i;
        },
      ]),
    angular
      .module("mgcrea.ngStrap.modal", ["mgcrea.ngStrap.helpers.dimensions"])
      .provider("$modal", function () {
        var e = (this.defaults = {
          animation: "am-fade",
          backdropAnimation: "am-fade",
          prefixClass: "modal",
          prefixEvent: "modal",
          placement: "top",
          template: "modal/modal.tpl.html",
          contentTemplate: !1,
          container: !1,
          element: null,
          backdrop: !0,
          keyboard: !0,
          html: !1,
          show: !0,
        });
        this.$get = [
          "$window",
          "$rootScope",
          "$compile",
          "$q",
          "$templateCache",
          "$http",
          "$animate",
          "$timeout",
          "$sce",
          "dimensions",
          function (n, a, o, i, r, s, l, u, c, d) {
            function f(t) {
              function n() {
                f.$emit(d.prefixEvent + ".show", u);
              }
              function i() {
                f.$emit(d.prefixEvent + ".hide", u),
                  w.removeClass(d.prefixClass + "-open"),
                  d.animation &&
                    w.removeClass(d.prefixClass + "-with-" + d.animation);
              }
              function r(e) {
                e.target === e.currentTarget &&
                  ("static" === d.backdrop ? u.focus() : u.hide());
              }
              function s(e) {
                e.preventDefault();
              }
              var u = {},
                d = (u.$options = angular.extend({}, e, t));
              u.$promise = m(d.template);
              var f = (u.$scope = (d.scope && d.scope.$new()) || a.$new());
              d.element || d.container || (d.container = "body"),
                (u.$id = d.id || (d.element && d.element.attr("id")) || ""),
                $(["title", "content"], function (e) {
                  d[e] && (f[e] = c.trustAsHtml(d[e]));
                }),
                (f.$hide = function () {
                  f.$$postDigest(function () {
                    u.hide();
                  });
                }),
                (f.$show = function () {
                  f.$$postDigest(function () {
                    u.show();
                  });
                }),
                (f.$toggle = function () {
                  f.$$postDigest(function () {
                    u.toggle();
                  });
                }),
                (u.$isShown = f.$isShown = !1),
                d.contentTemplate &&
                  (u.$promise = u.$promise.then(function (e) {
                    var n = angular.element(e);
                    return m(d.contentTemplate).then(function (e) {
                      var a = g('[ng-bind="content"]', n[0])
                        .removeAttr("ng-bind")
                        .html(e);
                      return t.template || a.next().remove(), n[0].outerHTML;
                    });
                  }));
              var b,
                D,
                k = angular.element(
                  '<div class="' + d.prefixClass + '-backdrop"/>'
                );
              return (
                k.css({
                  position: "fixed",
                  top: "0px",
                  left: "0px",
                  bottom: "0px",
                  right: "0px",
                  "z-index": 1038,
                }),
                u.$promise.then(function (e) {
                  angular.isObject(e) && (e = e.data),
                    d.html && (e = e.replace(y, 'ng-bind-html="')),
                    (e = h.apply(e)),
                    (b = o(e)),
                    u.init();
                }),
                (u.init = function () {
                  d.show &&
                    f.$$postDigest(function () {
                      u.show();
                    });
                }),
                (u.destroy = function () {
                  D && (D.remove(), (D = null)),
                    k && (k.remove(), (k = null)),
                    f.$destroy();
                }),
                (u.show = function () {
                  if (!u.$isShown) {
                    var e, t;
                    if (
                      (angular.isElement(d.container)
                        ? ((e = d.container),
                          (t = d.container[0].lastChild
                            ? angular.element(d.container[0].lastChild)
                            : null))
                        : d.container
                        ? ((e = g(d.container)),
                          (t =
                            e[0] && e[0].lastChild
                              ? angular.element(e[0].lastChild)
                              : null))
                        : ((e = null), (t = d.element)),
                      (D = u.$element = b(f, function (e, t) {})),
                      !f.$emit(d.prefixEvent + ".show.before", u)
                        .defaultPrevented)
                    ) {
                      D.css({ display: "block" }).addClass(d.placement),
                        d.animation &&
                          (d.backdrop && k.addClass(d.backdropAnimation),
                          D.addClass(d.animation)),
                        d.backdrop && l.enter(k, w, null),
                        angular.version.minor <= 2
                          ? l.enter(D, e, t, n)
                          : l.enter(D, e, t).then(n),
                        (u.$isShown = f.$isShown = !0),
                        p(f);
                      var a = D[0];
                      v(function () {
                        a.focus();
                      }),
                        w.addClass(d.prefixClass + "-open"),
                        d.animation &&
                          w.addClass(d.prefixClass + "-with-" + d.animation),
                        d.backdrop &&
                          (D.on("click", r),
                          k.on("click", r),
                          k.on("wheel", s)),
                        d.keyboard && D.on("keyup", u.$onKeyUp);
                    }
                  }
                }),
                (u.hide = function () {
                  u.$isShown &&
                    (f.$emit(d.prefixEvent + ".hide.before", u)
                      .defaultPrevented ||
                      (angular.version.minor <= 2
                        ? l.leave(D, i)
                        : l.leave(D).then(i),
                      d.backdrop && l.leave(k),
                      (u.$isShown = f.$isShown = !1),
                      p(f),
                      d.backdrop &&
                        (D.off("click", r),
                        k.off("click", r),
                        k.off("wheel", s)),
                      d.keyboard && D.off("keyup", u.$onKeyUp)));
                }),
                (u.toggle = function () {
                  u.$isShown ? u.hide() : u.show();
                }),
                (u.focus = function () {
                  D[0].focus();
                }),
                (u.$onKeyUp = function (e) {
                  27 === e.which &&
                    u.$isShown &&
                    (u.hide(), e.stopPropagation());
                }),
                u
              );
            }
            function p(e) {
              e.$$phase || (e.$root && e.$root.$$phase) || e.$digest();
            }
            function g(e, n) {
              return angular.element((n || t).querySelectorAll(e));
            }
            function m(e) {
              return b[e]
                ? b[e]
                : (b[e] = s.get(e, { cache: r }).then(function (e) {
                    return e.data;
                  }));
            }
            var $ = angular.forEach,
              h = String.prototype.trim,
              v = n.requestAnimationFrame || n.setTimeout,
              w = angular.element(n.document.body),
              y = /ng-bind="/gi,
              b = {};
            return f;
          },
        ];
      })
      .directive("bsModal", [
        "$window",
        "$sce",
        "$modal",
        function (e, t, n) {
          return {
            restrict: "EAC",
            scope: !0,
            link: function (e, a, o, i) {
              var r = { scope: e, element: a, show: !1 };
              angular.forEach(
                [
                  "template",
                  "contentTemplate",
                  "placement",
                  "backdrop",
                  "keyboard",
                  "html",
                  "container",
                  "animation",
                  "id",
                  "prefixEvent",
                  "prefixClass",
                ],
                function (e) {
                  angular.isDefined(o[e]) && (r[e] = o[e]);
                }
              );
              var s = /^(false|0|)$/i;
              angular.forEach(
                ["backdrop", "keyboard", "html", "container"],
                function (e) {
                  angular.isDefined(o[e]) && s.test(o[e]) && (r[e] = !1);
                }
              ),
                angular.forEach(["title", "content"], function (n) {
                  o[n] &&
                    o.$observe(n, function (a, o) {
                      e[n] = t.trustAsHtml(a);
                    });
                }),
                o.bsModal &&
                  e.$watch(
                    o.bsModal,
                    function (t, n) {
                      angular.isObject(t)
                        ? angular.extend(e, t)
                        : (e.content = t);
                    },
                    !0
                  );
              var l = n(r);
              a.on(o.trigger || "click", l.toggle),
                e.$on("$destroy", function () {
                  l && l.destroy(), (r = null), (l = null);
                });
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.navbar", [])
      .provider("$navbar", function () {
        var e = (this.defaults = {
          activeClass: "active",
          routeAttr: "data-match-route",
          strict: !1,
        });
        this.$get = function () {
          return { defaults: e };
        };
      })
      .directive("bsNavbar", [
        "$window",
        "$location",
        "$navbar",
        function (e, t, n) {
          var a = n.defaults;
          return {
            restrict: "A",
            link: function (e, n, o, i) {
              var r = angular.copy(a);
              angular.forEach(Object.keys(a), function (e) {
                angular.isDefined(o[e]) && (r[e] = o[e]);
              }),
                e.$watch(
                  function () {
                    return t.path();
                  },
                  function (e, t) {
                    var a = n[0].querySelectorAll("li[" + r.routeAttr + "]");
                    angular.forEach(a, function (t) {
                      var n = angular.element(t),
                        a = n.attr(r.routeAttr).replace("/", "\\/");
                      r.strict && (a = "^" + a + "$");
                      var o = new RegExp(a, "i");
                      o.test(e)
                        ? n.addClass(r.activeClass)
                        : n.removeClass(r.activeClass);
                    });
                  }
                );
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.popover", ["mgcrea.ngStrap.tooltip"])
      .provider("$popover", function () {
        var e = (this.defaults = {
          animation: "am-fade",
          customClass: "",
          container: !1,
          target: !1,
          placement: "right",
          template: "popover/popover.tpl.html",
          contentTemplate: !1,
          trigger: "click",
          keyboard: !0,
          html: !1,
          title: "",
          content: "",
          delay: 0,
          autoClose: !1,
        });
        this.$get = [
          "$tooltip",
          function (t) {
            function n(n, a) {
              var o = angular.extend({}, e, a),
                i = t(n, o);
              return o.content && (i.$scope.content = o.content), i;
            }
            return n;
          },
        ];
      })
      .directive("bsPopover", [
        "$window",
        "$sce",
        "$popover",
        function (e, t, n) {
          var a = e.requestAnimationFrame || e.setTimeout;
          return {
            restrict: "EAC",
            scope: !0,
            link: function (e, o, i) {
              var r = { scope: e };
              angular.forEach(
                [
                  "template",
                  "contentTemplate",
                  "placement",
                  "container",
                  "delay",
                  "trigger",
                  "html",
                  "animation",
                  "customClass",
                  "autoClose",
                  "id",
                  "prefixClass",
                  "prefixEvent",
                ],
                function (e) {
                  angular.isDefined(i[e]) && (r[e] = i[e]);
                }
              );
              var s = /^(false|0|)$/i;
              angular.forEach(["html", "container", "autoClose"], function (e) {
                angular.isDefined(i[e]) && s.test(i[e]) && (r[e] = !1);
              });
              var l = o.attr("data-target");
              angular.isDefined(l) && (r.target = s.test(l) ? !1 : l),
                angular.forEach(["title", "content"], function (n) {
                  i[n] &&
                    i.$observe(n, function (o, i) {
                      (e[n] = t.trustAsHtml(o)),
                        angular.isDefined(i) &&
                          a(function () {
                            u && u.$applyPlacement();
                          });
                    });
                }),
                i.bsPopover &&
                  e.$watch(
                    i.bsPopover,
                    function (t, n) {
                      angular.isObject(t)
                        ? angular.extend(e, t)
                        : (e.content = t),
                        angular.isDefined(n) &&
                          a(function () {
                            u && u.$applyPlacement();
                          });
                    },
                    !0
                  ),
                i.bsShow &&
                  e.$watch(i.bsShow, function (e, t) {
                    u &&
                      angular.isDefined(e) &&
                      (angular.isString(e) &&
                        (e = !!e.match(/true|,?(popover),?/i)),
                      e === !0 ? u.show() : u.hide());
                  }),
                i.viewport &&
                  e.$watch(i.viewport, function (e) {
                    u && angular.isDefined(e) && u.setViewport(e);
                  });
              var u = n(o, r);
              e.$on("$destroy", function () {
                u && u.destroy(), (r = null), (u = null);
              });
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.scrollspy", [
        "mgcrea.ngStrap.helpers.debounce",
        "mgcrea.ngStrap.helpers.dimensions",
      ])
      .provider("$scrollspy", function () {
        var e = (this.$$spies = {}),
          n = (this.defaults = { debounce: 150, throttle: 100, offset: 100 });
        this.$get = [
          "$window",
          "$document",
          "$rootScope",
          "dimensions",
          "debounce",
          "throttle",
          function (a, o, i, r, s, l) {
            function u(e, t) {
              return (
                e[0].nodeName && e[0].nodeName.toLowerCase() === t.toLowerCase()
              );
            }
            function c(o) {
              var c = angular.extend({}, n, o);
              c.element || (c.element = p);
              var g = u(c.element, "body"),
                m = g ? d : c.element,
                $ = g ? "window" : c.id;
              if (e[$]) return e[$].$$count++, e[$];
              var h,
                v,
                w,
                y,
                b,
                D,
                k,
                S,
                x = {},
                T = (x.$trackedElements = []),
                C = [];
              return (
                (x.init = function () {
                  (this.$$count = 1),
                    (y = s(this.checkPosition, c.debounce)),
                    (b = l(this.checkPosition, c.throttle)),
                    m.on("click", this.checkPositionWithEventLoop),
                    d.on("resize", y),
                    m.on("scroll", b),
                    (D = s(this.checkOffsets, c.debounce)),
                    (h = i.$on("$viewContentLoaded", D)),
                    (v = i.$on("$includeContentLoaded", D)),
                    D(),
                    $ && (e[$] = x);
                }),
                (x.destroy = function () {
                  this.$$count--,
                    this.$$count > 0 ||
                      (m.off("click", this.checkPositionWithEventLoop),
                      d.off("resize", y),
                      m.off("scroll", b),
                      h(),
                      v(),
                      $ && delete e[$]);
                }),
                (x.checkPosition = function () {
                  if (C.length) {
                    if (
                      ((S = (g ? a.pageYOffset : m.prop("scrollTop")) || 0),
                      (k = Math.max(a.innerHeight, f.prop("clientHeight"))),
                      S < C[0].offsetTop && w !== C[0].target)
                    )
                      return x.$activateElement(C[0]);
                    for (var e = C.length; e--; )
                      if (
                        !angular.isUndefined(C[e].offsetTop) &&
                        null !== C[e].offsetTop &&
                        w !== C[e].target &&
                        !(
                          S < C[e].offsetTop ||
                          (C[e + 1] && S > C[e + 1].offsetTop)
                        )
                      )
                        return x.$activateElement(C[e]);
                  }
                }),
                (x.checkPositionWithEventLoop = function () {
                  setTimeout(x.checkPosition, 1);
                }),
                (x.$activateElement = function (e) {
                  if (w) {
                    var t = x.$getTrackedElement(w);
                    t &&
                      (t.source.removeClass("active"),
                      u(t.source, "li") &&
                        u(t.source.parent().parent(), "li") &&
                        t.source.parent().parent().removeClass("active"));
                  }
                  (w = e.target),
                    e.source.addClass("active"),
                    u(e.source, "li") &&
                      u(e.source.parent().parent(), "li") &&
                      e.source.parent().parent().addClass("active");
                }),
                (x.$getTrackedElement = function (e) {
                  return T.filter(function (t) {
                    return t.target === e;
                  })[0];
                }),
                (x.checkOffsets = function () {
                  angular.forEach(T, function (e) {
                    var n = t.querySelector(e.target);
                    (e.offsetTop = n ? r.offset(n).top : null),
                      c.offset &&
                        null !== e.offsetTop &&
                        (e.offsetTop -= 1 * c.offset);
                  }),
                    (C = T.filter(function (e) {
                      return null !== e.offsetTop;
                    }).sort(function (e, t) {
                      return e.offsetTop - t.offsetTop;
                    })),
                    y();
                }),
                (x.trackElement = function (e, t) {
                  T.push({ target: e, source: t });
                }),
                (x.untrackElement = function (e, t) {
                  for (var n, a = T.length; a--; )
                    if (T[a].target === e && T[a].source === t) {
                      n = a;
                      break;
                    }
                  T = T.splice(n, 1);
                }),
                (x.activate = function (e) {
                  T[e].addClass("active");
                }),
                x.init(),
                x
              );
            }
            var d = angular.element(a),
              f = angular.element(o.prop("documentElement")),
              p = angular.element(a.document.body);
            return c;
          },
        ];
      })
      .directive("bsScrollspy", [
        "$rootScope",
        "debounce",
        "dimensions",
        "$scrollspy",
        function (e, t, n, a) {
          return {
            restrict: "EAC",
            link: function (e, t, n) {
              var o = { scope: e };
              angular.forEach(["offset", "target"], function (e) {
                angular.isDefined(n[e]) && (o[e] = n[e]);
              });
              var i = a(o);
              i.trackElement(o.target, t),
                e.$on("$destroy", function () {
                  i && (i.untrackElement(o.target, t), i.destroy()),
                    (o = null),
                    (i = null);
                });
            },
          };
        },
      ])
      .directive("bsScrollspyList", [
        "$rootScope",
        "debounce",
        "dimensions",
        "$scrollspy",
        function (e, t, n, a) {
          return {
            restrict: "A",
            compile: function (e, t) {
              var n = e[0].querySelectorAll("li > a[href]");
              angular.forEach(n, function (e) {
                var t = angular.element(e);
                t.parent()
                  .attr("bs-scrollspy", "")
                  .attr("data-target", t.attr("href"));
              });
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.select", [
        "mgcrea.ngStrap.tooltip",
        "mgcrea.ngStrap.helpers.parseOptions",
      ])
      .provider("$select", function () {
        var e = (this.defaults = {
          animation: "am-fade",
          prefixClass: "select",
          prefixEvent: "$select",
          placement: "bottom-left",
          template: "select/select.tpl.html",
          trigger: "focus",
          container: !1,
          keyboard: !0,
          html: !1,
          delay: 0,
          multiple: !1,
          allNoneButtons: !1,
          sort: !0,
          caretHtml: '&nbsp;<span class="caret"></span>',
          placeholder: "Choose among the following...",
          allText: "All",
          noneText: "None",
          maxLength: 3,
          maxLengthHtml: "selected",
          iconCheckmark: "glyphicon glyphicon-ok",
        });
        this.$get = [
          "$window",
          "$document",
          "$rootScope",
          "$tooltip",
          "$timeout",
          function (t, n, a, o, i) {
            function r(t, n, a) {
              var r = {},
                s = angular.extend({}, e, a);
              r = o(t, s);
              var u = r.$scope;
              (u.$matches = []),
                (u.$activeIndex = s.multiple ? [] : -1),
                (u.$isMultiple = s.multiple),
                (u.$showAllNoneButtons = s.allNoneButtons && s.multiple),
                (u.$iconCheckmark = s.iconCheckmark),
                (u.$allText = s.allText),
                (u.$noneText = s.noneText),
                (u.$activate = function (e) {
                  u.$$postDigest(function () {
                    r.activate(e);
                  });
                }),
                (u.$select = function (e, t) {
                  u.$$postDigest(function () {
                    r.select(e);
                  });
                }),
                (u.$isVisible = function () {
                  return r.$isVisible();
                }),
                (u.$isActive = function (e) {
                  return r.$isActive(e);
                }),
                (u.$selectAll = function () {
                  for (var e = 0; e < u.$matches.length; e++)
                    u.$isActive(e) || u.$select(e);
                }),
                (u.$selectNone = function () {
                  for (var e = 0; e < u.$matches.length; e++)
                    u.$isActive(e) && u.$select(e);
                }),
                (r.update = function (e) {
                  (u.$matches = e), r.$updateActiveIndex();
                }),
                (r.activate = function (e) {
                  return (
                    s.multiple
                      ? (r.$isActive(e)
                          ? u.$activeIndex.splice(u.$activeIndex.indexOf(e), 1)
                          : u.$activeIndex.push(e),
                        s.sort &&
                          u.$activeIndex.sort(function (e, t) {
                            return e - t;
                          }))
                      : (u.$activeIndex = e),
                    u.$activeIndex
                  );
                }),
                (r.select = function (e) {
                  var t = u.$matches[e].value;
                  u.$apply(function () {
                    r.activate(e),
                      s.multiple
                        ? n.$setViewValue(
                            u.$activeIndex.map(function (e) {
                              return u.$matches[e].value;
                            })
                          )
                        : (n.$setViewValue(t), r.hide());
                  }),
                    u.$emit(s.prefixEvent + ".select", t, e, r);
                }),
                (r.$updateActiveIndex = function () {
                  n.$modelValue && u.$matches.length
                    ? (u.$activeIndex =
                        s.multiple && angular.isArray(n.$modelValue)
                          ? n.$modelValue.map(function (e) {
                              return r.$getIndex(e);
                            })
                          : r.$getIndex(n.$modelValue))
                    : u.$activeIndex >= u.$matches.length &&
                      (u.$activeIndex = s.multiple ? [] : 0);
                }),
                (r.$isVisible = function () {
                  return s.minLength && n
                    ? u.$matches.length && n.$viewValue.length >= s.minLength
                    : u.$matches.length;
                }),
                (r.$isActive = function (e) {
                  return s.multiple
                    ? -1 !== u.$activeIndex.indexOf(e)
                    : u.$activeIndex === e;
                }),
                (r.$getIndex = function (e) {
                  var t = u.$matches.length,
                    n = t;
                  if (t) {
                    for (n = t; n-- && u.$matches[n].value !== e; );
                    if (!(0 > n)) return n;
                  }
                }),
                (r.$onMouseDown = function (e) {
                  if ((e.preventDefault(), e.stopPropagation(), l)) {
                    var t = angular.element(e.target);
                    t.triggerHandler("click");
                  }
                }),
                (r.$onKeyDown = function (e) {
                  return /(9|13|38|40)/.test(e.keyCode)
                    ? (e.preventDefault(),
                      e.stopPropagation(),
                      s.multiple && 9 === e.keyCode
                        ? r.hide()
                        : s.multiple || (13 !== e.keyCode && 9 !== e.keyCode)
                        ? void (
                            s.multiple ||
                            (38 === e.keyCode && u.$activeIndex > 0
                              ? u.$activeIndex--
                              : 38 === e.keyCode && u.$activeIndex < 0
                              ? (u.$activeIndex = u.$matches.length - 1)
                              : 40 === e.keyCode &&
                                u.$activeIndex < u.$matches.length - 1
                              ? u.$activeIndex++
                              : angular.isUndefined(u.$activeIndex) &&
                                (u.$activeIndex = 0),
                            u.$digest())
                          )
                        : r.select(u.$activeIndex))
                    : void 0;
                });
              var c = r.show;
              r.show = function () {
                c(),
                  s.multiple && r.$element.addClass("select-multiple"),
                  i(
                    function () {
                      r.$element.on(
                        l ? "touchstart" : "mousedown",
                        r.$onMouseDown
                      ),
                        s.keyboard && t.on("keydown", r.$onKeyDown);
                    },
                    0,
                    !1
                  );
              };
              var d = r.hide;
              return (
                (r.hide = function () {
                  s.multiple || n.$modelValue || (u.$activeIndex = -1),
                    r.$element.off(
                      l ? "touchstart" : "mousedown",
                      r.$onMouseDown
                    ),
                    s.keyboard && t.off("keydown", r.$onKeyDown),
                    d(!0);
                }),
                r
              );
            }
            var s =
                (angular.element(t.document.body),
                /(ip(a|o)d|iphone|android)/gi.test(t.navigator.userAgent)),
              l = "createTouch" in t.document && s;
            return (r.defaults = e), r;
          },
        ];
      })
      .directive("bsSelect", [
        "$window",
        "$parse",
        "$q",
        "$select",
        "$parseOptions",
        function (e, t, n, a, o) {
          var i = a.defaults;
          return {
            restrict: "EAC",
            require: "ngModel",
            link: function (e, t, n, r) {
              var s = { scope: e, placeholder: i.placeholder };
              angular.forEach(
                [
                  "placement",
                  "container",
                  "delay",
                  "trigger",
                  "keyboard",
                  "html",
                  "animation",
                  "template",
                  "placeholder",
                  "allNoneButtons",
                  "maxLength",
                  "maxLengthHtml",
                  "allText",
                  "noneText",
                  "iconCheckmark",
                  "autoClose",
                  "id",
                  "sort",
                  "caretHtml",
                  "prefixClass",
                  "prefixEvent",
                ],
                function (e) {
                  angular.isDefined(n[e]) && (s[e] = n[e]);
                }
              );
              var l = /^(false|0|)$/i;
              angular.forEach(
                ["html", "container", "allNoneButtons", "sort"],
                function (e) {
                  angular.isDefined(n[e]) && l.test(n[e]) && (s[e] = !1);
                }
              );
              var u = t.attr("data-multiple");
              if (
                (angular.isDefined(u) && (s.multiple = l.test(u) ? !1 : u),
                "select" === t[0].nodeName.toLowerCase())
              ) {
                var c = t;
                c.css("display", "none"),
                  (t = angular.element(
                    '<button type="button" class="btn btn-default"></button>'
                  )),
                  c.after(t);
              }
              var d = o(n.bsOptions),
                f = a(t, r, s),
                p = d.$match[7].replace(/\|.+/, "").trim();
              e.$watchCollection(p, function (t, n) {
                d.valuesFn(e, r).then(function (e) {
                  f.update(e), r.$render();
                });
              }),
                e.$watch(
                  n.ngModel,
                  function (e, t) {
                    f.$updateActiveIndex(), r.$render();
                  },
                  !0
                ),
                (r.$render = function () {
                  var e, n;
                  s.multiple && angular.isArray(r.$modelValue)
                    ? ((e = r.$modelValue
                        .map(function (e) {
                          return (
                            (n = f.$getIndex(e)),
                            angular.isDefined(n)
                              ? f.$scope.$matches[n].label
                              : !1
                          );
                        })
                        .filter(angular.isDefined)),
                      (e =
                        e.length > (s.maxLength || i.maxLength)
                          ? e.length +
                            " " +
                            (s.maxLengthHtml || i.maxLengthHtml)
                          : e.join(", ")))
                    : ((n = f.$getIndex(r.$modelValue)),
                      (e = angular.isDefined(n)
                        ? f.$scope.$matches[n].label
                        : !1)),
                    t.html(
                      (e ? e : s.placeholder) +
                        (s.caretHtml ? s.caretHtml : i.caretHtml)
                    );
                }),
                s.multiple &&
                  (r.$isEmpty = function (e) {
                    return !e || 0 === e.length;
                  }),
                e.$on("$destroy", function () {
                  f && f.destroy(), (s = null), (f = null);
                });
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.tab", [])
      .provider("$tab", function () {
        var e = (this.defaults = {
            animation: "am-fade",
            template: "tab/tab.tpl.html",
            navClass: "nav-tabs",
            activeClass: "active",
          }),
          t = (this.controller = function (t, n, a) {
            var o = this;
            (o.$options = angular.copy(e)),
              angular.forEach(
                ["animation", "navClass", "activeClass"],
                function (e) {
                  angular.isDefined(a[e]) && (o.$options[e] = a[e]);
                }
              ),
              (t.$navClass = o.$options.navClass),
              (t.$activeClass = o.$options.activeClass),
              (o.$panes = t.$panes = []),
              (o.$activePaneChangeListeners = o.$viewChangeListeners = []),
              (o.$push = function (e) {
                angular.isUndefined(o.$panes.$active) &&
                  t.$setActive(e.name || 0),
                  o.$panes.push(e);
              }),
              (o.$remove = function (e) {
                var t,
                  n = o.$panes.indexOf(e),
                  a = o.$panes.$active;
                (t = angular.isString(a)
                  ? o.$panes
                      .map(function (e) {
                        return e.name;
                      })
                      .indexOf(a)
                  : o.$panes.$active),
                  o.$panes.splice(n, 1),
                  t > n ? t-- : n === t && t === o.$panes.length && t--,
                  t >= 0 && t < o.$panes.length
                    ? o.$setActive(o.$panes[t].name || t)
                    : o.$setActive();
              }),
              (o.$setActive = t.$setActive =
                function (e) {
                  (o.$panes.$active = e),
                    o.$activePaneChangeListeners.forEach(function (e) {
                      e();
                    });
                }),
              (o.$isActive = t.$isActive =
                function (e, t) {
                  return o.$panes.$active === e.name || o.$panes.$active === t;
                });
          });
        this.$get = function () {
          var n = {};
          return (n.defaults = e), (n.controller = t), n;
        };
      })
      .directive("bsTabs", [
        "$window",
        "$animate",
        "$tab",
        "$parse",
        function (e, t, n, a) {
          var o = n.defaults;
          return {
            require: ["?ngModel", "bsTabs"],
            transclude: !0,
            scope: !0,
            controller: ["$scope", "$element", "$attrs", n.controller],
            templateUrl: function (e, t) {
              return t.template || o.template;
            },
            link: function (e, t, n, o) {
              var i = o[0],
                r = o[1];
              if (
                (i &&
                  (r.$activePaneChangeListeners.push(function () {
                    i.$setViewValue(r.$panes.$active);
                  }),
                  i.$formatters.push(function (e) {
                    return r.$setActive(e), e;
                  })),
                n.bsActivePane)
              ) {
                var s = a(n.bsActivePane);
                r.$activePaneChangeListeners.push(function () {
                  s.assign(e, r.$panes.$active);
                }),
                  e.$watch(
                    n.bsActivePane,
                    function (e, t) {
                      r.$setActive(e);
                    },
                    !0
                  );
              }
            },
          };
        },
      ])
      .directive("bsPane", [
        "$window",
        "$animate",
        "$sce",
        function (e, t, n) {
          return {
            require: ["^?ngModel", "^bsTabs"],
            scope: !0,
            link: function (e, a, o, i) {
              function r() {
                var n = s.$panes.indexOf(e);
                t[s.$isActive(e, n) ? "addClass" : "removeClass"](
                  a,
                  s.$options.activeClass
                );
              }
              var s = (i[0], i[1]);
              a.addClass("tab-pane"),
                o.$observe("title", function (t, a) {
                  e.title = n.trustAsHtml(t);
                }),
                (e.name = o.name),
                s.$options.animation && a.addClass(s.$options.animation),
                o.$observe("disabled", function (t, n) {
                  e.disabled = e.$eval(t);
                }),
                s.$push(e),
                e.$on("$destroy", function () {
                  s.$remove(e);
                }),
                s.$activePaneChangeListeners.push(function () {
                  r();
                }),
                r();
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.timepicker", [
        "mgcrea.ngStrap.helpers.dateParser",
        "mgcrea.ngStrap.helpers.dateFormatter",
        "mgcrea.ngStrap.tooltip",
      ])
      .provider("$timepicker", function () {
        var e = (this.defaults = {
          animation: "am-fade",
          prefixClass: "timepicker",
          placement: "bottom-left",
          template: "timepicker/timepicker.tpl.html",
          trigger: "focus",
          container: !1,
          keyboard: !0,
          html: !1,
          delay: 0,
          useNative: !0,
          timeType: "date",
          timeFormat: "shortTime",
          timezone: null,
          modelTimeFormat: null,
          autoclose: !1,
          minTime: -(1 / 0),
          maxTime: +(1 / 0),
          length: 5,
          hourStep: 1,
          minuteStep: 5,
          secondStep: 5,
          roundDisplay: !1,
          iconUp: "glyphicon glyphicon-chevron-up",
          iconDown: "glyphicon glyphicon-chevron-down",
          arrowBehavior: "pager",
        });
        this.$get = [
          "$window",
          "$document",
          "$rootScope",
          "$sce",
          "$dateFormatter",
          "$tooltip",
          "$timeout",
          function (t, n, a, o, i, r, s) {
            function l(t, n, a) {
              function o(e) {
                var t = 6e4 * g.minuteStep;
                return new Date(Math.floor(e.getTime() / t) * t);
              }
              function l(e, n) {
                var a = e + n;
                if (t[0].createTextRange) {
                  var o = t[0].createTextRange();
                  o.collapse(!0),
                    o.moveStart("character", e),
                    o.moveEnd("character", a),
                    o.select();
                } else
                  t[0].setSelectionRange
                    ? t[0].setSelectionRange(e, a)
                    : angular.isUndefined(t[0].selectionStart) &&
                      ((t[0].selectionStart = e), (t[0].selectionEnd = a));
              }
              function d() {
                t[0].focus();
              }
              var f = r(t, angular.extend({}, e, a)),
                p = a.scope,
                g = f.$options,
                m = f.$scope,
                $ = g.lang,
                h = function (e, t, n) {
                  return i.formatDate(e, t, $, n);
                },
                v = 0,
                w = g.roundDisplay ? o(new Date()) : new Date(),
                y = n.$dateValue || w,
                b = {
                  hour: y.getHours(),
                  meridian: y.getHours() < 12,
                  minute: y.getMinutes(),
                  second: y.getSeconds(),
                  millisecond: y.getMilliseconds(),
                },
                D = i.getDatetimeFormat(g.timeFormat, $),
                k = i.hoursFormat(D),
                S = i.timeSeparator(D),
                x = i.minutesFormat(D),
                T = i.secondsFormat(D),
                C = i.showSeconds(D),
                M = i.showAM(D);
              (m.$iconUp = g.iconUp),
                (m.$iconDown = g.iconDown),
                (m.$select = function (e, t) {
                  f.select(e, t);
                }),
                (m.$moveIndex = function (e, t) {
                  f.$moveIndex(e, t);
                }),
                (m.$switchMeridian = function (e) {
                  f.switchMeridian(e);
                }),
                (f.update = function (e) {
                  angular.isDate(e) && !isNaN(e.getTime())
                    ? ((f.$date = e),
                      angular.extend(b, {
                        hour: e.getHours(),
                        minute: e.getMinutes(),
                        second: e.getSeconds(),
                        millisecond: e.getMilliseconds(),
                      }),
                      f.$build())
                    : f.$isBuilt || f.$build();
                }),
                (f.select = function (e, t, a) {
                  (!n.$dateValue || isNaN(n.$dateValue.getTime())) &&
                    (n.$dateValue = new Date(1970, 0, 1)),
                    angular.isDate(e) || (e = new Date(e)),
                    0 === t
                      ? n.$dateValue.setHours(e.getHours())
                      : 1 === t
                      ? n.$dateValue.setMinutes(e.getMinutes())
                      : 2 === t && n.$dateValue.setSeconds(e.getSeconds()),
                    n.$setViewValue(angular.copy(n.$dateValue)),
                    n.$render(),
                    g.autoclose &&
                      !a &&
                      s(function () {
                        f.hide(!0);
                      });
                }),
                (f.switchMeridian = function (e) {
                  if (n.$dateValue && !isNaN(n.$dateValue.getTime())) {
                    var t = (e || n.$dateValue).getHours();
                    n.$dateValue.setHours(12 > t ? t + 12 : t - 12),
                      n.$setViewValue(angular.copy(n.$dateValue)),
                      n.$render();
                  }
                }),
                (f.$build = function () {
                  var e,
                    t,
                    n = (m.midIndex = parseInt(g.length / 2, 10)),
                    a = [];
                  for (e = 0; e < g.length; e++)
                    (t = new Date(1970, 0, 1, b.hour - (n - e) * g.hourStep)),
                      a.push({
                        date: t,
                        label: h(t, k),
                        selected: f.$date && f.$isSelected(t, 0),
                        disabled: f.$isDisabled(t, 0),
                      });
                  var o,
                    i = [];
                  for (e = 0; e < g.length; e++)
                    (o = new Date(
                      1970,
                      0,
                      1,
                      0,
                      b.minute - (n - e) * g.minuteStep
                    )),
                      i.push({
                        date: o,
                        label: h(o, x),
                        selected: f.$date && f.$isSelected(o, 1),
                        disabled: f.$isDisabled(o, 1),
                      });
                  var r,
                    s = [];
                  for (e = 0; e < g.length; e++)
                    (r = new Date(
                      1970,
                      0,
                      1,
                      0,
                      0,
                      b.second - (n - e) * g.secondStep
                    )),
                      s.push({
                        date: r,
                        label: h(r, T),
                        selected: f.$date && f.$isSelected(r, 2),
                        disabled: f.$isDisabled(r, 2),
                      });
                  var l = [];
                  for (e = 0; e < g.length; e++)
                    l.push(C ? [a[e], i[e], s[e]] : [a[e], i[e]]);
                  (m.rows = l),
                    (m.showSeconds = C),
                    (m.showAM = M),
                    (m.isAM = (f.$date || a[n].date).getHours() < 12),
                    (m.timeSeparator = S),
                    (f.$isBuilt = !0);
                }),
                (f.$isSelected = function (e, t) {
                  return f.$date
                    ? 0 === t
                      ? e.getHours() === f.$date.getHours()
                      : 1 === t
                      ? e.getMinutes() === f.$date.getMinutes()
                      : 2 === t
                      ? e.getSeconds() === f.$date.getSeconds()
                      : void 0
                    : !1;
                }),
                (f.$isDisabled = function (e, t) {
                  var n;
                  return (
                    0 === t
                      ? (n = e.getTime() + 6e4 * b.minute + 1e3 * b.second)
                      : 1 === t
                      ? (n = e.getTime() + 36e5 * b.hour + 1e3 * b.second)
                      : 2 === t &&
                        (n = e.getTime() + 36e5 * b.hour + 6e4 * b.minute),
                    n < 1 * g.minTime || n > 1 * g.maxTime
                  );
                }),
                (m.$arrowAction = function (e, t) {
                  "picker" === g.arrowBehavior
                    ? f.$setTimeByStep(e, t)
                    : f.$moveIndex(e, t);
                }),
                (f.$setTimeByStep = function (e, t) {
                  {
                    var n = new Date(f.$date),
                      a = n.getHours(),
                      o = (h(n, k).length, n.getMinutes()),
                      i = (h(n, x).length, n.getSeconds());
                    h(n, T).length;
                  }
                  0 === t
                    ? n.setHours(a - parseInt(g.hourStep, 10) * e)
                    : 1 === t
                    ? n.setMinutes(o - parseInt(g.minuteStep, 10) * e)
                    : 2 === t &&
                      n.setSeconds(i - parseInt(g.secondStep, 10) * e),
                    f.select(n, t, !0);
                }),
                (f.$moveIndex = function (e, t) {
                  var n;
                  0 === t
                    ? ((n = new Date(
                        1970,
                        0,
                        1,
                        b.hour + e * g.length,
                        b.minute,
                        b.second
                      )),
                      angular.extend(b, { hour: n.getHours() }))
                    : 1 === t
                    ? ((n = new Date(
                        1970,
                        0,
                        1,
                        b.hour,
                        b.minute + e * g.length * g.minuteStep,
                        b.second
                      )),
                      angular.extend(b, { minute: n.getMinutes() }))
                    : 2 === t &&
                      ((n = new Date(
                        1970,
                        0,
                        1,
                        b.hour,
                        b.minute,
                        b.second + e * g.length * g.secondStep
                      )),
                      angular.extend(b, { second: n.getSeconds() })),
                    f.$build();
                }),
                (f.$onMouseDown = function (e) {
                  if (
                    ("input" !== e.target.nodeName.toLowerCase() &&
                      e.preventDefault(),
                    e.stopPropagation(),
                    c)
                  ) {
                    var t = angular.element(e.target);
                    "button" !== t[0].nodeName.toLowerCase() &&
                      (t = t.parent()),
                      t.triggerHandler("click");
                  }
                }),
                (f.$onKeyDown = function (e) {
                  if (
                    /(38|37|39|40|13)/.test(e.keyCode) &&
                    !e.shiftKey &&
                    !e.altKey
                  ) {
                    if (
                      (e.preventDefault(),
                      e.stopPropagation(),
                      13 === e.keyCode)
                    )
                      return f.hide(!0);
                    var t = new Date(f.$date),
                      n = t.getHours(),
                      a = h(t, k).length,
                      o = t.getMinutes(),
                      i = h(t, x).length,
                      r = t.getSeconds(),
                      s = h(t, T).length,
                      u = 1,
                      c = /(37|39)/.test(e.keyCode),
                      d = 2 + 1 * C + 1 * M;
                    c &&
                      (37 === e.keyCode
                        ? (v = 1 > v ? d - 1 : v - 1)
                        : 39 === e.keyCode && (v = d - 1 > v ? v + 1 : 0));
                    var m = [0, a],
                      $ = 0;
                    38 === e.keyCode && ($ = -1), 40 === e.keyCode && ($ = 1);
                    var w = 2 === v && C,
                      y = (2 === v && !C) || (3 === v && C);
                    0 === v
                      ? (t.setHours(n + $ * parseInt(g.hourStep, 10)),
                        (a = h(t, k).length),
                        (m = [0, a]))
                      : 1 === v
                      ? (t.setMinutes(o + $ * parseInt(g.minuteStep, 10)),
                        (i = h(t, x).length),
                        (m = [a + u, i]))
                      : w
                      ? (t.setSeconds(r + $ * parseInt(g.secondStep, 10)),
                        (s = h(t, T).length),
                        (m = [a + u + i + u, s]))
                      : y &&
                        (c || f.switchMeridian(),
                        (m = [a + u + i + u + (s + u) * C, 2])),
                      f.select(t, v, !0),
                      l(m[0], m[1]),
                      p.$digest();
                  }
                });
              var E = f.init;
              f.init = function () {
                return u && g.useNative
                  ? (t.prop("type", "time"),
                    void t.css("-webkit-appearance", "textfield"))
                  : (c &&
                      (t.prop("type", "text"),
                      t.attr("readonly", "true"),
                      t.on("click", d)),
                    void E());
              };
              var A = f.destroy;
              f.destroy = function () {
                u && g.useNative && t.off("click", d), A();
              };
              var F = f.show;
              f.show = function () {
                F(),
                  s(
                    function () {
                      f.$element &&
                        f.$element.on(
                          c ? "touchstart" : "mousedown",
                          f.$onMouseDown
                        ),
                        g.keyboard && t && t.on("keydown", f.$onKeyDown);
                    },
                    0,
                    !1
                  );
              };
              var V = f.hide;
              return (
                (f.hide = function (e) {
                  f.$isShown &&
                    (f.$element &&
                      f.$element.off(
                        c ? "touchstart" : "mousedown",
                        f.$onMouseDown
                      ),
                    g.keyboard && t && t.off("keydown", f.$onKeyDown),
                    V(e));
                }),
                f
              );
            }
            var u =
                (angular.element(t.document.body),
                /(ip(a|o)d|iphone|android)/gi.test(t.navigator.userAgent)),
              c = "createTouch" in t.document && u;
            return (
              e.lang || (e.lang = i.getDefaultLocale()), (l.defaults = e), l
            );
          },
        ];
      })
      .directive("bsTimepicker", [
        "$window",
        "$parse",
        "$q",
        "$dateFormatter",
        "$dateParser",
        "$timepicker",
        function (e, t, n, a, o, i) {
          {
            var r = i.defaults,
              s = /(ip(a|o)d|iphone|android)/gi.test(e.navigator.userAgent);
            e.requestAnimationFrame || e.setTimeout;
          }
          return {
            restrict: "EAC",
            require: "ngModel",
            link: function (e, t, n, l) {
              function u(e) {
                if (angular.isDate(e)) {
                  var t =
                      isNaN(d.minTime) ||
                      new Date(e.getTime()).setFullYear(1970, 0, 1) >=
                        d.minTime,
                    n =
                      isNaN(d.maxTime) ||
                      new Date(e.getTime()).setFullYear(1970, 0, 1) <=
                        d.maxTime,
                    a = t && n;
                  l.$setValidity("date", a),
                    l.$setValidity("min", t),
                    l.$setValidity("max", n),
                    a && (l.$dateValue = e);
                }
              }
              function c() {
                return !l.$dateValue || isNaN(l.$dateValue.getTime())
                  ? ""
                  : m(l.$dateValue, d.timeFormat);
              }
              var d = { scope: e, controller: l };
              angular.forEach(
                [
                  "placement",
                  "container",
                  "delay",
                  "trigger",
                  "keyboard",
                  "html",
                  "animation",
                  "template",
                  "autoclose",
                  "timeType",
                  "timeFormat",
                  "timezone",
                  "modelTimeFormat",
                  "useNative",
                  "hourStep",
                  "minuteStep",
                  "secondStep",
                  "length",
                  "arrowBehavior",
                  "iconUp",
                  "iconDown",
                  "roundDisplay",
                  "id",
                  "prefixClass",
                  "prefixEvent",
                ],
                function (e) {
                  angular.isDefined(n[e]) && (d[e] = n[e]);
                }
              );
              var f = /^(false|0|)$/i;
              angular.forEach(
                ["html", "container", "autoclose", "useNative", "roundDisplay"],
                function (e) {
                  angular.isDefined(n[e]) && f.test(n[e]) && (d[e] = !1);
                }
              ),
                n.bsShow &&
                  e.$watch(n.bsShow, function (e, t) {
                    p &&
                      angular.isDefined(e) &&
                      (angular.isString(e) &&
                        (e = !!e.match(/true|,?(timepicker),?/i)),
                      e === !0 ? p.show() : p.hide());
                  }),
                s && (d.useNative || r.useNative) && (d.timeFormat = "HH:mm");
              var p = i(t, l, d);
              d = p.$options;
              var g = d.lang,
                m = function (e, t, n) {
                  return a.formatDate(e, t, g, n);
                },
                $ = o({ format: d.timeFormat, lang: g });
              angular.forEach(["minTime", "maxTime"], function (e) {
                angular.isDefined(n[e]) &&
                  n.$observe(e, function (t) {
                    (p.$options[e] = $.getTimeForAttribute(e, t)),
                      !isNaN(p.$options[e]) && p.$build(),
                      u(l.$dateValue);
                  });
              }),
                e.$watch(
                  n.ngModel,
                  function (e, t) {
                    p.update(l.$dateValue);
                  },
                  !0
                ),
                l.$parsers.unshift(function (e) {
                  var t;
                  if (!e) return l.$setValidity("date", !0), null;
                  var n = angular.isDate(e) ? e : $.parse(e, l.$dateValue);
                  return !n || isNaN(n.getTime())
                    ? void l.$setValidity("date", !1)
                    : (u(n),
                      "string" === d.timeType
                        ? ((t = $.timezoneOffsetAdjust(n, d.timezone, !0)),
                          m(t, d.modelTimeFormat || d.timeFormat))
                        : ((t = $.timezoneOffsetAdjust(
                            l.$dateValue,
                            d.timezone,
                            !0
                          )),
                          "number" === d.timeType
                            ? t.getTime()
                            : "unix" === d.timeType
                            ? t.getTime() / 1e3
                            : "iso" === d.timeType
                            ? t.toISOString()
                            : new Date(t)));
                }),
                l.$formatters.push(function (e) {
                  var t;
                  return (
                    (t =
                      angular.isUndefined(e) || null === e
                        ? 0 / 0
                        : angular.isDate(e)
                        ? e
                        : "string" === d.timeType
                        ? $.parse(e, null, d.modelTimeFormat)
                        : new Date("unix" === d.timeType ? 1e3 * e : e)),
                    (l.$dateValue = $.timezoneOffsetAdjust(t, d.timezone)),
                    c()
                  );
                }),
                (l.$render = function () {
                  t.val(c());
                }),
                e.$on("$destroy", function () {
                  p && p.destroy(), (d = null), (p = null);
                });
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.tooltip", ["mgcrea.ngStrap.helpers.dimensions"])
      .provider("$tooltip", function () {
        var e = (this.defaults = {
          animation: "am-fade",
          customClass: "",
          prefixClass: "tooltip",
          prefixEvent: "tooltip",
          container: !1,
          target: !1,
          placement: "top",
          template: "tooltip/tooltip.tpl.html",
          contentTemplate: !1,
          trigger: "hover focus",
          keyboard: !1,
          html: !1,
          show: !1,
          title: "",
          type: "",
          delay: 0,
          autoClose: !1,
          bsEnabled: !0,
          viewport: { selector: "body", padding: 0 },
        });
        this.$get = [
          "$window",
          "$rootScope",
          "$compile",
          "$q",
          "$templateCache",
          "$http",
          "$animate",
          "$sce",
          "dimensions",
          "$$rAF",
          "$timeout",
          function (n, a, o, i, r, s, l, u, c, d, f) {
            function p(i, r) {
              function s() {
                N.$emit(H.prefixEvent + ".show", I);
              }
              function p() {
                if ((N.$emit(H.prefixEvent + ".hide", I), z === B)) {
                  if (W && "focus" === H.trigger) return i[0].blur();
                  O();
                }
              }
              function b() {
                var e = H.trigger.split(" ");
                angular.forEach(e, function (e) {
                  "click" === e
                    ? i.on("click", I.toggle)
                    : "manual" !== e &&
                      (i.on("hover" === e ? "mouseenter" : "focus", I.enter),
                      i.on("hover" === e ? "mouseleave" : "blur", I.leave),
                      "button" === P &&
                        "hover" !== e &&
                        i.on(
                          v ? "touchstart" : "mousedown",
                          I.$onFocusElementMouseDown
                        ));
                });
              }
              function D() {
                for (var e = H.trigger.split(" "), t = e.length; t--; ) {
                  var n = e[t];
                  "click" === n
                    ? i.off("click", I.toggle)
                    : "manual" !== n &&
                      (i.off("hover" === n ? "mouseenter" : "focus", I.enter),
                      i.off("hover" === n ? "mouseleave" : "blur", I.leave),
                      "button" === P &&
                        "hover" !== n &&
                        i.off(
                          v ? "touchstart" : "mousedown",
                          I.$onFocusElementMouseDown
                        ));
                }
              }
              function k() {
                "focus" !== H.trigger
                  ? z.on("keyup", I.$onKeyUp)
                  : i.on("keyup", I.$onFocusKeyUp);
              }
              function S() {
                "focus" !== H.trigger
                  ? z.off("keyup", I.$onKeyUp)
                  : i.off("keyup", I.$onFocusKeyUp);
              }
              function x() {
                f(
                  function () {
                    z.on("click", C), y.on("click", I.hide), (_ = !0);
                  },
                  0,
                  !1
                );
              }
              function T() {
                _ && (z.off("click", C), y.off("click", I.hide), (_ = !1));
              }
              function C(e) {
                e.stopPropagation();
              }
              function M(e) {
                e = e || H.target || i;
                var a = e[0],
                  o = "BODY" === a.tagName,
                  r = a.getBoundingClientRect(),
                  s = {};
                for (var l in r) s[l] = r[l];
                null === s.width &&
                  (s = angular.extend({}, s, {
                    width: r.right - r.left,
                    height: r.bottom - r.top,
                  }));
                var u = o ? { top: 0, left: 0 } : c.offset(a),
                  d = {
                    scroll: o
                      ? t.documentElement.scrollTop || t.body.scrollTop
                      : e.prop("scrollTop") || 0,
                  },
                  f = o
                    ? {
                        width: t.documentElement.clientWidth,
                        height: n.innerHeight,
                      }
                    : null;
                return angular.extend({}, s, d, f, u);
              }
              function E(e, t, n, a) {
                var o,
                  i = e.split("-");
                switch (i[0]) {
                  case "right":
                    o = {
                      top: t.top + t.height / 2 - a / 2,
                      left: t.left + t.width,
                    };
                    break;
                  case "bottom":
                    o = {
                      top: t.top + t.height,
                      left: t.left + t.width / 2 - n / 2,
                    };
                    break;
                  case "left":
                    o = { top: t.top + t.height / 2 - a / 2, left: t.left - n };
                    break;
                  default:
                    o = { top: t.top - a, left: t.left + t.width / 2 - n / 2 };
                }
                if (!i[1]) return o;
                if ("top" === i[0] || "bottom" === i[0])
                  switch (i[1]) {
                    case "left":
                      o.left = t.left;
                      break;
                    case "right":
                      o.left = t.left + t.width - n;
                  }
                else if ("left" === i[0] || "right" === i[0])
                  switch (i[1]) {
                    case "top":
                      o.top = t.top - a;
                      break;
                    case "bottom":
                      o.top = t.top + t.height;
                  }
                return o;
              }
              function A(e, t) {
                var n = z[0],
                  a = n.offsetWidth,
                  o = n.offsetHeight,
                  i = parseInt(c.css(n, "margin-top"), 10),
                  r = parseInt(c.css(n, "margin-left"), 10);
                isNaN(i) && (i = 0),
                  isNaN(r) && (r = 0),
                  (e.top = e.top + i),
                  (e.left = e.left + r),
                  c.setOffset(
                    n,
                    angular.extend(
                      {
                        using: function (e) {
                          z.css({
                            top: Math.round(e.top) + "px",
                            left: Math.round(e.left) + "px",
                            right: "",
                          });
                        },
                      },
                      e
                    ),
                    0
                  );
                var s = n.offsetWidth,
                  l = n.offsetHeight;
                if (
                  ("top" === t && l !== o && (e.top = e.top + o - l),
                  !/top-left|top-right|bottom-left|bottom-right/.test(t))
                ) {
                  var u = F(t, e, s, l);
                  if (
                    (u.left ? (e.left += u.left) : (e.top += u.top),
                    c.setOffset(n, e),
                    /top|right|bottom|left/.test(t))
                  ) {
                    var d = /top|bottom/.test(t),
                      f = d ? 2 * u.left - a + s : 2 * u.top - o + l,
                      p = d ? "offsetWidth" : "offsetHeight";
                    V(f, n[p], d);
                  }
                }
              }
              function F(e, t, n, a) {
                var o = { top: 0, left: 0 },
                  i = H.viewport && m(H.viewport.selector || H.viewport);
                if (!i) return o;
                var r = (H.viewport && H.viewport.padding) || 0,
                  s = M(i);
                if (/right|left/.test(e)) {
                  var l = t.top - r - s.scroll,
                    u = t.top + r - s.scroll + a;
                  l < s.top
                    ? (o.top = s.top - l)
                    : u > s.top + s.height && (o.top = s.top + s.height - u);
                } else {
                  var c = t.left - r,
                    d = t.left + r + n;
                  c < s.left
                    ? (o.left = s.left - c)
                    : d > s.width && (o.left = s.left + s.width - d);
                }
                return o;
              }
              function V(e, t, n) {
                var a = m(".tooltip-arrow, .arrow", z[0]);
                a.css(n ? "left" : "top", 50 * (1 - e / t) + "%").css(
                  n ? "top" : "left",
                  ""
                );
              }
              function O() {
                clearTimeout(R),
                  I.$isShown &&
                    null !== z &&
                    (H.autoClose && T(), H.keyboard && S()),
                  j && (j.$destroy(), (j = null)),
                  z && (z.remove(), (z = I.$element = null));
              }
              var I = {},
                P = i[0].nodeName.toLowerCase(),
                H = (I.$options = angular.extend({}, e, r));
              I.$promise = $(H.template);
              var N = (I.$scope = (H.scope && H.scope.$new()) || a.$new());
              if (H.delay && angular.isString(H.delay)) {
                var L = H.delay.split(",").map(parseFloat);
                H.delay = L.length > 1 ? { show: L[0], hide: L[1] } : L[0];
              }
              (I.$id = H.id || i.attr("id") || ""),
                H.title && (N.title = u.trustAsHtml(H.title)),
                (N.$setEnabled = function (e) {
                  N.$$postDigest(function () {
                    I.setEnabled(e);
                  });
                }),
                (N.$hide = function () {
                  N.$$postDigest(function () {
                    I.hide();
                  });
                }),
                (N.$show = function () {
                  N.$$postDigest(function () {
                    I.show();
                  });
                }),
                (N.$toggle = function () {
                  N.$$postDigest(function () {
                    I.toggle();
                  });
                }),
                (I.$isShown = N.$isShown = !1);
              var R, Y;
              H.contentTemplate &&
                (I.$promise = I.$promise.then(function (e) {
                  var t = angular.element(e);
                  return $(H.contentTemplate).then(function (e) {
                    var n = m('[ng-bind="content"]', t[0]);
                    return (
                      n.length || (n = m('[ng-bind="title"]', t[0])),
                      n.removeAttr("ng-bind").html(e),
                      t[0].outerHTML
                    );
                  });
                }));
              var q, z, K, U, j;
              I.$promise.then(function (e) {
                angular.isObject(e) && (e = e.data),
                  H.html && (e = e.replace(w, 'ng-bind-html="')),
                  (e = h.apply(e)),
                  (K = e),
                  (q = o(e)),
                  I.init();
              }),
                (I.init = function () {
                  H.delay &&
                    angular.isNumber(H.delay) &&
                    (H.delay = { show: H.delay, hide: H.delay }),
                    "self" === H.container
                      ? (U = i)
                      : angular.isElement(H.container)
                      ? (U = H.container)
                      : H.container && (U = m(H.container)),
                    b(),
                    H.target &&
                      (H.target = angular.isElement(H.target)
                        ? H.target
                        : m(H.target)),
                    H.show &&
                      N.$$postDigest(function () {
                        "focus" === H.trigger ? i[0].focus() : I.show();
                      });
                }),
                (I.destroy = function () {
                  D(), O(), N.$destroy();
                }),
                (I.enter = function () {
                  return (
                    clearTimeout(R),
                    (Y = "in"),
                    H.delay && H.delay.show
                      ? void (R = setTimeout(function () {
                          "in" === Y && I.show();
                        }, H.delay.show))
                      : I.show()
                  );
                }),
                (I.show = function () {
                  if (H.bsEnabled && !I.$isShown) {
                    N.$emit(H.prefixEvent + ".show.before", I);
                    var e, t;
                    H.container
                      ? ((e = U),
                        (t = U[0].lastChild
                          ? angular.element(U[0].lastChild)
                          : null))
                      : ((e = null), (t = i)),
                      z && O(),
                      (j = I.$scope.$new()),
                      (z = I.$element = q(j, function (e, t) {})),
                      z.css({
                        top: "-9999px",
                        left: "-9999px",
                        right: "auto",
                        display: "block",
                        visibility: "hidden",
                      }),
                      H.animation && z.addClass(H.animation),
                      H.type && z.addClass(H.prefixClass + "-" + H.type),
                      H.customClass && z.addClass(H.customClass),
                      t ? t.after(z) : e.prepend(z),
                      (I.$isShown = N.$isShown = !0),
                      g(N),
                      I.$applyPlacement(),
                      angular.version.minor <= 2
                        ? l.enter(z, e, t, s)
                        : l.enter(z, e, t).then(s),
                      g(N),
                      d(function () {
                        z && z.css({ visibility: "visible" });
                      }),
                      H.keyboard && ("focus" !== H.trigger && I.focus(), k()),
                      H.autoClose && x();
                  }
                }),
                (I.leave = function () {
                  return (
                    clearTimeout(R),
                    (Y = "out"),
                    H.delay && H.delay.hide
                      ? void (R = setTimeout(function () {
                          "out" === Y && I.hide();
                        }, H.delay.hide))
                      : I.hide()
                  );
                });
              var W, B;
              (I.hide = function (e) {
                I.$isShown &&
                  (N.$emit(H.prefixEvent + ".hide.before", I),
                  (W = e),
                  (B = z),
                  angular.version.minor <= 2
                    ? l.leave(z, p)
                    : l.leave(z).then(p),
                  (I.$isShown = N.$isShown = !1),
                  g(N),
                  H.keyboard && null !== z && S(),
                  H.autoClose && null !== z && T());
              }),
                (I.toggle = function () {
                  I.$isShown ? I.leave() : I.enter();
                }),
                (I.focus = function () {
                  z[0].focus();
                }),
                (I.setEnabled = function (e) {
                  H.bsEnabled = e;
                }),
                (I.setViewport = function (e) {
                  H.viewport = e;
                }),
                (I.$applyPlacement = function () {
                  if (z) {
                    var t = H.placement,
                      n = /\s?auto?\s?/i,
                      a = n.test(t);
                    a && (t = t.replace(n, "") || e.placement),
                      z.addClass(H.placement);
                    var o = M(),
                      r = z.prop("offsetWidth"),
                      s = z.prop("offsetHeight");
                    if (a) {
                      var l = t,
                        u = H.container ? m(H.container) : i.parent(),
                        c = M(u);
                      l.indexOf("bottom") >= 0 && o.bottom + s > c.bottom
                        ? (t = l.replace("bottom", "top"))
                        : l.indexOf("top") >= 0 &&
                          o.top - s < c.top &&
                          (t = l.replace("top", "bottom")),
                        ("right" === l ||
                          "bottom-left" === l ||
                          "top-left" === l) &&
                        o.right + r > c.width
                          ? (t =
                              "right" === l
                                ? "left"
                                : t.replace("left", "right"))
                          : ("left" === l ||
                              "bottom-right" === l ||
                              "top-right" === l) &&
                            o.left - r < c.left &&
                            (t =
                              "left" === l
                                ? "right"
                                : t.replace("right", "left")),
                        z.removeClass(l).addClass(t);
                    }
                    var d = E(t, o, r, s);
                    A(d, t);
                  }
                }),
                (I.$onKeyUp = function (e) {
                  27 === e.which &&
                    I.$isShown &&
                    (I.hide(), e.stopPropagation());
                }),
                (I.$onFocusKeyUp = function (e) {
                  27 === e.which && (i[0].blur(), e.stopPropagation());
                }),
                (I.$onFocusElementMouseDown = function (e) {
                  e.preventDefault(),
                    e.stopPropagation(),
                    I.$isShown ? i[0].blur() : i[0].focus();
                });
              var _ = !1;
              return I;
            }
            function g(e) {
              e.$$phase || (e.$root && e.$root.$$phase) || e.$digest();
            }
            function m(e, n) {
              return angular.element((n || t).querySelectorAll(e));
            }
            function $(e) {
              return b[e]
                ? b[e]
                : (b[e] = s.get(e, { cache: r }).then(function (e) {
                    return e.data;
                  }));
            }
            var h = String.prototype.trim,
              v = "createTouch" in n.document,
              w = /ng-bind="/gi,
              y = angular.element(n.document),
              b = {};
            return p;
          },
        ];
      })
      .directive("bsTooltip", [
        "$window",
        "$location",
        "$sce",
        "$tooltip",
        "$$rAF",
        function (e, t, n, a, o) {
          return {
            restrict: "EAC",
            scope: !0,
            link: function (e, t, i, r) {
              var s = { scope: e };
              angular.forEach(
                [
                  "template",
                  "contentTemplate",
                  "placement",
                  "container",
                  "delay",
                  "trigger",
                  "html",
                  "animation",
                  "backdropAnimation",
                  "type",
                  "customClass",
                  "id",
                ],
                function (e) {
                  angular.isDefined(i[e]) && (s[e] = i[e]);
                }
              );
              var l = /^(false|0|)$/i;
              angular.forEach(["html", "container"], function (e) {
                angular.isDefined(i[e]) && l.test(i[e]) && (s[e] = !1);
              });
              var u = t.attr("data-target");
              angular.isDefined(u) && (s.target = l.test(u) ? !1 : u),
                e.hasOwnProperty("title") || (e.title = ""),
                i.$observe("title", function (t) {
                  if (angular.isDefined(t) || !e.hasOwnProperty("title")) {
                    var a = e.title;
                    (e.title = n.trustAsHtml(t)),
                      angular.isDefined(a) &&
                        o(function () {
                          c && c.$applyPlacement();
                        });
                  }
                }),
                i.bsTooltip &&
                  e.$watch(
                    i.bsTooltip,
                    function (t, n) {
                      angular.isObject(t)
                        ? angular.extend(e, t)
                        : (e.title = t),
                        angular.isDefined(n) &&
                          o(function () {
                            c && c.$applyPlacement();
                          });
                    },
                    !0
                  ),
                i.bsShow &&
                  e.$watch(i.bsShow, function (e, t) {
                    c &&
                      angular.isDefined(e) &&
                      (angular.isString(e) &&
                        (e = !!e.match(/true|,?(tooltip),?/i)),
                      e === !0 ? c.show() : c.hide());
                  }),
                i.bsEnabled &&
                  e.$watch(i.bsEnabled, function (e, t) {
                    c &&
                      angular.isDefined(e) &&
                      (angular.isString(e) &&
                        (e = !!e.match(/true|1|,?(tooltip),?/i)),
                      c.setEnabled(e === !1 ? !1 : !0));
                  }),
                i.viewport &&
                  e.$watch(i.viewport, function (e) {
                    c && angular.isDefined(e) && c.setViewport(e);
                  });
              var c = a(t, s);
              e.$on("$destroy", function () {
                c && c.destroy(), (s = null), (c = null);
              });
            },
          };
        },
      ]),
    angular
      .module("mgcrea.ngStrap.typeahead", [
        "mgcrea.ngStrap.tooltip",
        "mgcrea.ngStrap.helpers.parseOptions",
      ])
      .provider("$typeahead", function () {
        var e = (this.defaults = {
          animation: "am-fade",
          prefixClass: "typeahead",
          prefixEvent: "$typeahead",
          placement: "bottom-left",
          template: "typeahead/typeahead.tpl.html",
          trigger: "focus",
          container: !1,
          keyboard: !0,
          html: !1,
          delay: 0,
          minLength: 1,
          filter: "filter",
          limit: 6,
          autoSelect: !1,
          comparator: "",
          trimValue: !0,
        });
        this.$get = [
          "$window",
          "$rootScope",
          "$tooltip",
          "$timeout",
          function (t, n, a, o) {
            function i(t, n, i) {
              var r = {},
                s = angular.extend({}, e, i);
              r = a(t, s);
              var l = i.scope,
                u = r.$scope;
              (u.$resetMatches = function () {
                (u.$matches = []), (u.$activeIndex = s.autoSelect ? 0 : -1);
              }),
                u.$resetMatches(),
                (u.$activate = function (e) {
                  u.$$postDigest(function () {
                    r.activate(e);
                  });
                }),
                (u.$select = function (e, t) {
                  u.$$postDigest(function () {
                    r.select(e);
                  });
                }),
                (u.$isVisible = function () {
                  return r.$isVisible();
                }),
                (r.update = function (e) {
                  (u.$matches = e),
                    u.$activeIndex >= e.length &&
                      (u.$activeIndex = s.autoSelect ? 0 : -1),
                    /^(bottom|bottom-left|bottom-right)$/.test(s.placement) ||
                      o(r.$applyPlacement);
                }),
                (r.activate = function (e) {
                  u.$activeIndex = e;
                }),
                (r.select = function (e) {
                  if (-1 !== e) {
                    var t = u.$matches[e].value;
                    n.$setViewValue(t),
                      n.$render(),
                      u.$resetMatches(),
                      l && l.$digest(),
                      u.$emit(s.prefixEvent + ".select", t, e, r);
                  }
                }),
                (r.$isVisible = function () {
                  return s.minLength && n
                    ? u.$matches.length &&
                        angular.isString(n.$viewValue) &&
                        n.$viewValue.length >= s.minLength
                    : !!u.$matches.length;
                }),
                (r.$getIndex = function (e) {
                  var t = u.$matches.length,
                    n = t;
                  if (t) {
                    for (n = t; n-- && u.$matches[n].value !== e; );
                    if (!(0 > n)) return n;
                  }
                }),
                (r.$onMouseDown = function (e) {
                  e.preventDefault(), e.stopPropagation();
                }),
                (r.$onKeyDown = function (e) {
                  /(38|40|13)/.test(e.keyCode) &&
                    (!r.$isVisible() ||
                      (13 === e.keyCode && -1 === u.$activeIndex) ||
                      (e.preventDefault(), e.stopPropagation()),
                    13 === e.keyCode && u.$matches.length
                      ? r.select(u.$activeIndex)
                      : 38 === e.keyCode && u.$activeIndex > 0
                      ? u.$activeIndex--
                      : 40 === e.keyCode &&
                        u.$activeIndex < u.$matches.length - 1
                      ? u.$activeIndex++
                      : angular.isUndefined(u.$activeIndex) &&
                        (u.$activeIndex = 0),
                    u.$digest());
                });
              var c = r.show;
              r.show = function () {
                c(),
                  o(
                    function () {
                      r.$element && r.$element.on("mousedown", r.$onMouseDown),
                        s.keyboard && t && t.on("keydown", r.$onKeyDown);
                    },
                    0,
                    !1
                  );
              };
              var d = r.hide;
              return (
                (r.hide = function () {
                  r.$element && r.$element.off("mousedown", r.$onMouseDown),
                    s.keyboard && t && t.off("keydown", r.$onKeyDown),
                    s.autoSelect || r.activate(-1),
                    d();
                }),
                r
              );
            }
            angular.element(t.document.body);
            return (i.defaults = e), i;
          },
        ];
      })
      .directive("bsTypeahead", [
        "$window",
        "$parse",
        "$q",
        "$typeahead",
        "$parseOptions",
        function (e, t, n, a, o) {
          var i = a.defaults;
          return {
            restrict: "EAC",
            require: "ngModel",
            link: function (e, t, n, r) {
              var s = { scope: e };
              angular.forEach(
                [
                  "placement",
                  "container",
                  "delay",
                  "trigger",
                  "keyboard",
                  "html",
                  "animation",
                  "template",
                  "filter",
                  "limit",
                  "minLength",
                  "watchOptions",
                  "selectMode",
                  "autoSelect",
                  "comparator",
                  "id",
                  "prefixEvent",
                  "prefixClass",
                ],
                function (e) {
                  angular.isDefined(n[e]) && (s[e] = n[e]);
                }
              );
              var l = /^(false|0|)$/i;
              angular.forEach(["html", "container", "trimValue"], function (e) {
                angular.isDefined(n[e]) && l.test(n[e]) && (s[e] = !1);
              }),
                t.attr("autocomplete", "off");
              var u = s.filter || i.filter,
                c = s.limit || i.limit,
                d = s.comparator || i.comparator,
                f = n.bsOptions;
              u && (f += " | " + u + ":$viewValue"),
                d && (f += ":" + d),
                c && (f += " | limitTo:" + c);
              var p = o(f),
                g = a(t, r, s);
              if (s.watchOptions) {
                var m = p.$match[7]
                  .replace(/\|.+/, "")
                  .replace(/\(.*\)/g, "")
                  .trim();
                e.$watchCollection(m, function (t, n) {
                  p.valuesFn(e, r).then(function (e) {
                    g.update(e), r.$render();
                  });
                });
              }
              e.$watch(n.ngModel, function (t, n) {
                (e.$modelValue = t),
                  p.valuesFn(e, r).then(function (e) {
                    if (s.selectMode && !e.length && t.length > 0)
                      return void r.$setViewValue(
                        r.$viewValue.substring(0, r.$viewValue.length - 1)
                      );
                    e.length > c && (e = e.slice(0, c));
                    var n = g.$isVisible();
                    n && g.update(e),
                      (1 !== e.length || e[0].value !== t) &&
                        (!n && g.update(e), r.$render());
                  });
              }),
                r.$formatters.push(function (e) {
                  var t = p.displayValue(e);
                  return t ? t : e && "object" != typeof e ? e : "";
                }),
                (r.$render = function () {
                  if (r.$isEmpty(r.$viewValue)) return t.val("");
                  var e = g.$getIndex(r.$modelValue),
                    n = angular.isDefined(e)
                      ? g.$scope.$matches[e].label
                      : r.$viewValue;
                  n = angular.isObject(n) ? p.displayValue(n) : n;
                  var a = n ? n.toString().replace(/<(?:.|\n)*?>/gm, "") : "";
                  t.val(s.trimValue === !1 ? a : a.trim());
                }),
                e.$on("$destroy", function () {
                  g && g.destroy(), (s = null), (g = null);
                });
            },
          };
        },
      ]);
})(window, document);
(function (window, document, undefined) {
  "use strict";
  angular.module("mgcrea.ngStrap.alert").run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "alert/alert.tpl.html",
        '<div class="alert" ng-class="[type ? \'alert-\' + type : null]"><button type="button" class="close" ng-if="dismissable" ng-click="$hide()">&times;</button> <strong ng-bind="title"></strong>&nbsp;<span ng-bind-html="content"></span></div>'
      );
    },
  ]);
  angular.module("mgcrea.ngStrap.aside").run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "aside/aside.tpl.html",
        '<div class="aside" tabindex="-1" role="dialog"><div class="aside-dialog"><div class="aside-content"><div class="aside-header" ng-show="title"><button type="button" class="close" ng-click="$hide()">&times;</button><h4 class="aside-title" ng-bind="title"></h4></div><div class="aside-body" ng-bind="content"></div><div class="aside-footer"><button type="button" class="btn btn-default" ng-click="$hide()">Close</button></div></div></div></div>'
      );
    },
  ]);
  angular.module("mgcrea.ngStrap.datepicker").run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "datepicker/datepicker.tpl.html",
        '<div class="dropdown-menu datepicker" ng-class="\'datepicker-mode-\' + $mode" style="max-width: 320px"><table style="table-layout: fixed; height: 100%; width: 100%"><thead><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$selectPane(-1)"><i class="{{$iconLeft}}"></i></button></th><th colspan="{{ rows[0].length - 2 }}"><button tabindex="-1" type="button" class="btn btn-default btn-block text-strong" ng-click="$toggleMode()"><strong style="text-transform: capitalize" ng-bind="title"></strong></button></th><th><button tabindex="-1" type="button" class="btn btn-default pull-right" ng-click="$selectPane(+1)"><i class="{{$iconRight}}"></i></button></th></tr><tr ng-show="showLabels" ng-bind-html="labels"></tr></thead><tbody><tr ng-repeat="(i, row) in rows" height="{{ 100 / rows.length }}%"><td class="text-center" ng-repeat="(j, el) in row"><button tabindex="-1" type="button" class="btn btn-default" style="width: 100%" ng-class="{\'btn-primary\': el.selected, \'btn-info btn-today\': el.isToday && !el.selected}" ng-click="$select(el.date)" ng-disabled="el.disabled"><span ng-class="{\'text-muted\': el.muted}" ng-bind="el.label"></span></button></td></tr></tbody></table></div>'
      );
    },
  ]);
  angular.module("mgcrea.ngStrap.dropdown").run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "dropdown/dropdown.tpl.html",
        '<ul tabindex="-1" class="dropdown-menu" role="menu"><li role="presentation" ng-class="{divider: item.divider}" ng-repeat="item in content"><a role="menuitem" tabindex="-1" ng-href="{{item.href}}" ng-if="!item.divider && item.href" target="{{item.target || \'\'}}" ng-bind="item.text"></a> <a role="menuitem" tabindex="-1" href="javascript:void(0)" ng-if="!item.divider && item.click" ng-click="$eval(item.click);$hide()" ng-bind="item.text"></a></li></ul>'
      );
    },
  ]);
  angular.module("mgcrea.ngStrap.modal").run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "modal/modal.tpl.html",
        '<div class="modal" tabindex="-1" role="dialog" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-header" ng-show="title"><button type="button" class="close" aria-label="Close" ng-click="$hide()"><span aria-hidden="true">&times;</span></button><h4 class="modal-title" ng-bind="title"></h4></div><div class="modal-body" ng-bind="content"></div><div class="modal-footer"><button type="button" class="btn btn-default" ng-click="$hide()">Close</button></div></div></div></div>'
      );
    },
  ]);
  angular.module("mgcrea.ngStrap.popover").run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "popover/popover.tpl.html",
        '<div class="popover"><div class="arrow"></div><h3 class="popover-title" ng-bind="title" ng-show="title"></h3><div class="popover-content" ng-bind="content"></div></div>'
      );
    },
  ]);
  angular.module("mgcrea.ngStrap.select").run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "select/select.tpl.html",
        '<ul tabindex="-1" class="select dropdown-menu" ng-show="$isVisible()" role="select"><li ng-if="$showAllNoneButtons"><div class="btn-group" style="margin-bottom: 5px; margin-left: 5px"><button type="button" class="btn btn-default btn-xs" ng-click="$selectAll()">{{$allText}}</button> <button type="button" class="btn btn-default btn-xs" ng-click="$selectNone()">{{$noneText}}</button></div></li><li role="presentation" ng-repeat="match in $matches" ng-class="{active: $isActive($index)}"><a style="cursor: default" role="menuitem" tabindex="-1" ng-click="$select($index, $event)"><i class="{{$iconCheckmark}} pull-right" ng-if="$isMultiple && $isActive($index)"></i> <span ng-bind="match.label"></span></a></li></ul>'
      );
    },
  ]);
  angular.module("mgcrea.ngStrap.tab").run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "tab/tab.tpl.html",
        '<ul class="nav" ng-class="$navClass" role="tablist"><li role="presentation" ng-repeat="$pane in $panes track by $index" ng-class="[ $isActive($pane, $index) ? $activeClass : \'\', $pane.disabled ? \'disabled\' : \'\' ]"><a role="tab" data-toggle="tab" ng-click="!$pane.disabled && $setActive($pane.name || $index)" data-index="{{ $index }}" ng-bind-html="$pane.title" aria-controls="$pane.title"></a></li></ul><div ng-transclude class="tab-content"></div>'
      );
    },
  ]);
  angular.module("mgcrea.ngStrap.timepicker").run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "timepicker/timepicker.tpl.html",
        '<div class="dropdown-menu timepicker" style="min-width: 0px;width: auto"><table height="100%"><thead><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(-1, 0)"><i class="{{ $iconUp }}"></i></button></th><th>&nbsp;</th><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(-1, 1)"><i class="{{ $iconUp }}"></i></button></th><th>&nbsp;</th><th><button ng-if="showSeconds" tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(-1, 2)"><i class="{{ $iconUp }}"></i></button></th></tr></thead><tbody><tr ng-repeat="(i, row) in rows"><td class="text-center"><button tabindex="-1" style="width: 100%" type="button" class="btn btn-default" ng-class="{\'btn-primary\': row[0].selected}" ng-click="$select(row[0].date, 0)" ng-disabled="row[0].disabled"><span ng-class="{\'text-muted\': row[0].muted}" ng-bind="row[0].label"></span></button></td><td><span ng-bind="i == midIndex ? timeSeparator : \' \'"></span></td><td class="text-center"><button tabindex="-1" ng-if="row[1].date" style="width: 100%" type="button" class="btn btn-default" ng-class="{\'btn-primary\': row[1].selected}" ng-click="$select(row[1].date, 1)" ng-disabled="row[1].disabled"><span ng-class="{\'text-muted\': row[1].muted}" ng-bind="row[1].label"></span></button></td><td><span ng-bind="i == midIndex ? timeSeparator : \' \'"></span></td><td class="text-center"><button tabindex="-1" ng-if="showSeconds && row[2].date" style="width: 100%" type="button" class="btn btn-default" ng-class="{\'btn-primary\': row[2].selected}" ng-click="$select(row[2].date, 2)" ng-disabled="row[2].disabled"><span ng-class="{\'text-muted\': row[2].muted}" ng-bind="row[2].label"></span></button></td><td ng-if="showAM">&nbsp;</td><td ng-if="showAM"><button tabindex="-1" ng-show="i == midIndex - !isAM * 1" style="width: 100%" type="button" ng-class="{\'btn-primary\': !!isAM}" class="btn btn-default" ng-click="$switchMeridian()" ng-disabled="el.disabled">AM</button> <button tabindex="-1" ng-show="i == midIndex + 1 - !isAM * 1" style="width: 100%" type="button" ng-class="{\'btn-primary\': !isAM}" class="btn btn-default" ng-click="$switchMeridian()" ng-disabled="el.disabled">PM</button></td></tr></tbody><tfoot><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(1, 0)"><i class="{{ $iconDown }}"></i></button></th><th>&nbsp;</th><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(1, 1)"><i class="{{ $iconDown }}"></i></button></th><th>&nbsp;</th><th><button ng-if="showSeconds" tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$arrowAction(1, 2)"><i class="{{ $iconDown }}"></i></button></th></tr></tfoot></table></div>'
      );
    },
  ]);
  angular.module("mgcrea.ngStrap.tooltip").run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "tooltip/tooltip.tpl.html",
        '<div class="tooltip in" ng-show="title"><div class="tooltip-arrow"></div><div class="tooltip-inner" ng-bind="title"></div></div>'
      );
    },
  ]);
  angular.module("mgcrea.ngStrap.typeahead").run([
    "$templateCache",
    function ($templateCache) {
      $templateCache.put(
        "typeahead/typeahead.tpl.html",
        '<ul tabindex="-1" class="typeahead dropdown-menu" ng-show="$isVisible()" role="select"><li role="presentation" ng-repeat="match in $matches" ng-class="{active: $index == $activeIndex}"><a role="menuitem" tabindex="-1" ng-click="$select($index, $event)" ng-bind="match.label"></a></li></ul>'
      );
    },
  ]);
})(window, document);
!(function () {
  var a = angular.module("restangular", []);
  a.provider("Restangular", function () {
    var a = {};
    a.init = function (a, b) {
      function c(a, b, c, d) {
        var e = {};
        return (
          _.each(_.keys(d), function (f) {
            var g = d[f];
            (g.params = _.extend(
              {},
              g.params,
              a.defaultRequestParams[g.method.toLowerCase()]
            )),
              _.isEmpty(g.params) && delete g.params,
              (e[f] = a.isSafe(g.method)
                ? function () {
                    return b(_.extend(g, { url: c }));
                  }
                : function (a) {
                    return b(_.extend(g, { url: c, data: a }));
                  });
          }),
          e
        );
      }
      a.configuration = b;
      var d = ["get", "head", "options", "trace", "getlist"];
      b.isSafe = function (a) {
        return _.contains(d, a.toLowerCase());
      };
      var e = /^https?:\/\//i;
      (b.isAbsoluteUrl = function (a) {
        return _.isUndefined(b.absoluteUrl) || _.isNull(b.absoluteUrl)
          ? a && e.test(a)
          : b.absoluteUrl;
      }),
        (b.absoluteUrl = _.isUndefined(b.absoluteUrl) ? !0 : b.absoluteUrl),
        (a.setSelfLinkAbsoluteUrl = function (a) {
          b.absoluteUrl = a;
        }),
        (b.baseUrl = _.isUndefined(b.baseUrl) ? "" : b.baseUrl),
        (a.setBaseUrl = function (a) {
          return (
            (b.baseUrl = /\/$/.test(a) ? a.substring(0, a.length - 1) : a), this
          );
        }),
        (b.extraFields = b.extraFields || []),
        (a.setExtraFields = function (a) {
          return (b.extraFields = a), this;
        }),
        (b.defaultHttpFields = b.defaultHttpFields || {}),
        (a.setDefaultHttpFields = function (a) {
          return (b.defaultHttpFields = a), this;
        }),
        (b.withHttpValues = function (a, c) {
          return _.defaults(c, a, b.defaultHttpFields);
        }),
        (b.encodeIds = _.isUndefined(b.encodeIds) ? !0 : b.encodeIds),
        (a.setEncodeIds = function (a) {
          b.encodeIds = a;
        }),
        (b.defaultRequestParams = b.defaultRequestParams || {
          get: {},
          post: {},
          put: {},
          remove: {},
          common: {},
        }),
        (a.setDefaultRequestParams = function (a, c) {
          var d = [],
            e = c || a;
          return (
            _.isUndefined(c)
              ? d.push("common")
              : _.isArray(a)
              ? (d = a)
              : d.push(a),
            _.each(d, function (a) {
              b.defaultRequestParams[a] = e;
            }),
            this
          );
        }),
        (a.requestParams = b.defaultRequestParams),
        (b.defaultHeaders = b.defaultHeaders || {}),
        (a.setDefaultHeaders = function (c) {
          return (
            (b.defaultHeaders = c), (a.defaultHeaders = b.defaultHeaders), this
          );
        }),
        (a.defaultHeaders = b.defaultHeaders),
        (b.methodOverriders = b.methodOverriders || []),
        (a.setMethodOverriders = function (a) {
          var c = _.extend([], a);
          return (
            b.isOverridenMethod("delete", c) && c.push("remove"),
            (b.methodOverriders = c),
            this
          );
        }),
        (b.jsonp = _.isUndefined(b.jsonp) ? !1 : b.jsonp),
        (a.setJsonp = function (a) {
          b.jsonp = a;
        }),
        (b.isOverridenMethod = function (a, c) {
          var d = c || b.methodOverriders;
          return !_.isUndefined(
            _.find(d, function (b) {
              return b.toLowerCase() === a.toLowerCase();
            })
          );
        }),
        (b.urlCreator = b.urlCreator || "path"),
        (a.setUrlCreator = function (a) {
          if (!_.has(b.urlCreatorFactory, a))
            throw new Error("URL Path selected isn't valid");
          return (b.urlCreator = a), this;
        }),
        (b.restangularFields = b.restangularFields || {
          id: "id",
          route: "route",
          parentResource: "parentResource",
          restangularCollection: "restangularCollection",
          cannonicalId: "__cannonicalId",
          etag: "restangularEtag",
          selfLink: "href",
          get: "get",
          getList: "getList",
          put: "put",
          post: "post",
          remove: "remove",
          head: "head",
          trace: "trace",
          options: "options",
          patch: "patch",
          getRestangularUrl: "getRestangularUrl",
          getRequestedUrl: "getRequestedUrl",
          putElement: "putElement",
          addRestangularMethod: "addRestangularMethod",
          getParentList: "getParentList",
          clone: "clone",
          ids: "ids",
          httpConfig: "_$httpConfig",
          reqParams: "reqParams",
          one: "one",
          all: "all",
          several: "several",
          oneUrl: "oneUrl",
          allUrl: "allUrl",
          customPUT: "customPUT",
          customPOST: "customPOST",
          customDELETE: "customDELETE",
          customGET: "customGET",
          customGETLIST: "customGETLIST",
          customOperation: "customOperation",
          doPUT: "doPUT",
          doPOST: "doPOST",
          doDELETE: "doDELETE",
          doGET: "doGET",
          doGETLIST: "doGETLIST",
          fromServer: "fromServer",
          withConfig: "withConfig",
          withHttpConfig: "withHttpConfig",
          singleOne: "singleOne",
          plain: "plain",
          save: "save",
          restangularized: "restangularized",
        }),
        (a.setRestangularFields = function (a) {
          return (b.restangularFields = _.extend(b.restangularFields, a)), this;
        }),
        (b.isRestangularized = function (a) {
          return !!a[b.restangularFields.restangularized];
        }),
        (b.setFieldToElem = function (a, b, c) {
          var d = a.split("."),
            e = b;
          return (
            _.each(_.initial(d), function (a) {
              (e[a] = {}), (e = e[a]);
            }),
            (e[_.last(d)] = c),
            this
          );
        }),
        (b.getFieldFromElem = function (a, b) {
          var c = a.split("."),
            d = b;
          return (
            _.each(c, function (a) {
              d && (d = d[a]);
            }),
            angular.copy(d)
          );
        }),
        (b.setIdToElem = function (a, c) {
          return b.setFieldToElem(b.restangularFields.id, a, c), this;
        }),
        (b.getIdFromElem = function (a) {
          return b.getFieldFromElem(b.restangularFields.id, a);
        }),
        (b.isValidId = function (a) {
          return "" !== a && !_.isUndefined(a) && !_.isNull(a);
        }),
        (b.setUrlToElem = function (a, c) {
          return b.setFieldToElem(b.restangularFields.selfLink, a, c), this;
        }),
        (b.getUrlFromElem = function (a) {
          return b.getFieldFromElem(b.restangularFields.selfLink, a);
        }),
        (b.useCannonicalId = _.isUndefined(b.useCannonicalId)
          ? !1
          : b.useCannonicalId),
        (a.setUseCannonicalId = function (a) {
          return (b.useCannonicalId = a), this;
        }),
        (b.getCannonicalIdFromElem = function (a) {
          var c = a[b.restangularFields.cannonicalId],
            d = b.isValidId(c) ? c : b.getIdFromElem(a);
          return d;
        }),
        (b.responseInterceptors = b.responseInterceptors || []),
        (b.defaultResponseInterceptor = function (a) {
          return a;
        }),
        (b.responseExtractor = function (a, c, d, e, f, g) {
          var h = angular.copy(b.responseInterceptors);
          h.push(b.defaultResponseInterceptor);
          var i = a;
          return (
            _.each(h, function (a) {
              i = a(i, c, d, e, f, g);
            }),
            i
          );
        }),
        (a.addResponseInterceptor = function (a) {
          return b.responseInterceptors.push(a), this;
        }),
        (b.errorInterceptors = b.errorInterceptors || []),
        (a.addErrorInterceptor = function (a) {
          return b.errorInterceptors.push(a), this;
        }),
        (a.setResponseInterceptor = a.addResponseInterceptor),
        (a.setResponseExtractor = a.addResponseInterceptor),
        (a.setErrorInterceptor = a.addErrorInterceptor),
        (b.requestInterceptors = b.requestInterceptors || []),
        (b.defaultInterceptor = function (a, b, c, d, e, f, g) {
          return { element: a, headers: e, params: f, httpConfig: g };
        }),
        (b.fullRequestInterceptor = function (a, c, d, e, f, g, h) {
          var i = angular.copy(b.requestInterceptors),
            j = b.defaultInterceptor(a, c, d, e, f, g, h);
          return _.reduce(
            i,
            function (a, b) {
              return _.extend(
                a,
                b(a.element, c, d, e, a.headers, a.params, a.httpConfig)
              );
            },
            j
          );
        }),
        (a.addRequestInterceptor = function (a) {
          return (
            b.requestInterceptors.push(function (b, c, d, e, f, g, h) {
              return {
                headers: f,
                params: g,
                element: a(b, c, d, e),
                httpConfig: h,
              };
            }),
            this
          );
        }),
        (a.setRequestInterceptor = a.addRequestInterceptor),
        (a.addFullRequestInterceptor = function (a) {
          return b.requestInterceptors.push(a), this;
        }),
        (a.setFullRequestInterceptor = a.addFullRequestInterceptor),
        (b.onBeforeElemRestangularized =
          b.onBeforeElemRestangularized ||
          function (a) {
            return a;
          }),
        (a.setOnBeforeElemRestangularized = function (a) {
          return (b.onBeforeElemRestangularized = a), this;
        }),
        (a.setRestangularizePromiseInterceptor = function (a) {
          return (b.restangularizePromiseInterceptor = a), this;
        }),
        (b.onElemRestangularized =
          b.onElemRestangularized ||
          function (a) {
            return a;
          }),
        (a.setOnElemRestangularized = function (a) {
          return (b.onElemRestangularized = a), this;
        }),
        (b.shouldSaveParent =
          b.shouldSaveParent ||
          function () {
            return !0;
          }),
        (a.setParentless = function (a) {
          return (
            _.isArray(a)
              ? (b.shouldSaveParent = function (b) {
                  return !_.contains(a, b);
                })
              : _.isBoolean(a) &&
                (b.shouldSaveParent = function () {
                  return !a;
                }),
            this
          );
        }),
        (b.suffix = _.isUndefined(b.suffix) ? null : b.suffix),
        (a.setRequestSuffix = function (a) {
          return (b.suffix = a), this;
        }),
        (b.transformers = b.transformers || {}),
        (a.addElementTransformer = function (c, d, e) {
          var f = null,
            g = null;
          2 === arguments.length ? (g = d) : ((g = e), (f = d));
          var h = b.transformers[c];
          return (
            h || (h = b.transformers[c] = []),
            h.push(function (a, b) {
              return _.isNull(f) || a === f ? g(b) : b;
            }),
            a
          );
        }),
        (a.extendCollection = function (b, c) {
          return a.addElementTransformer(b, !0, c);
        }),
        (a.extendModel = function (b, c) {
          return a.addElementTransformer(b, !1, c);
        }),
        (b.transformElem = function (a, c, d, e, f) {
          if (
            !f &&
            !b.transformLocalElements &&
            !a[b.restangularFields.fromServer]
          )
            return a;
          var g = b.transformers[d],
            h = a;
          return (
            g &&
              _.each(g, function (a) {
                h = a(c, h);
              }),
            b.onElemRestangularized(h, c, d, e)
          );
        }),
        (b.transformLocalElements = _.isUndefined(b.transformLocalElements)
          ? !1
          : b.transformLocalElements),
        (a.setTransformOnlyServerElements = function (a) {
          b.transformLocalElements = !a;
        }),
        (b.fullResponse = _.isUndefined(b.fullResponse) ? !1 : b.fullResponse),
        (a.setFullResponse = function (a) {
          return (b.fullResponse = a), this;
        }),
        (b.urlCreatorFactory = {});
      var f = function () {};
      (f.prototype.setConfig = function (a) {
        return (this.config = a), this;
      }),
        (f.prototype.parentsArray = function (a) {
          for (var b = []; a; )
            b.push(a), (a = a[this.config.restangularFields.parentResource]);
          return b.reverse();
        }),
        (f.prototype.resource = function (a, d, e, f, g, h, i, j) {
          var k = _.defaults(g || {}, this.config.defaultRequestParams.common),
            l = _.defaults(f || {}, this.config.defaultHeaders);
          i && (b.isSafe(j) ? (l["If-None-Match"] = i) : (l["If-Match"] = i));
          var m = this.base(a);
          if (h) {
            var n = "";
            /\/$/.test(m) || (n += "/"), (n += h), (m += n);
          }
          return (
            this.config.suffix &&
              -1 ===
                m.indexOf(
                  this.config.suffix,
                  m.length - this.config.suffix.length
                ) &&
              !this.config.getUrlFromElem(a) &&
              (m += this.config.suffix),
            (a[this.config.restangularFields.httpConfig] = void 0),
            c(this.config, d, m, {
              getList: this.config.withHttpValues(e, {
                method: "GET",
                params: k,
                headers: l,
              }),
              get: this.config.withHttpValues(e, {
                method: "GET",
                params: k,
                headers: l,
              }),
              jsonp: this.config.withHttpValues(e, {
                method: "jsonp",
                params: k,
                headers: l,
              }),
              put: this.config.withHttpValues(e, {
                method: "PUT",
                params: k,
                headers: l,
              }),
              post: this.config.withHttpValues(e, {
                method: "POST",
                params: k,
                headers: l,
              }),
              remove: this.config.withHttpValues(e, {
                method: "DELETE",
                params: k,
                headers: l,
              }),
              head: this.config.withHttpValues(e, {
                method: "HEAD",
                params: k,
                headers: l,
              }),
              trace: this.config.withHttpValues(e, {
                method: "TRACE",
                params: k,
                headers: l,
              }),
              options: this.config.withHttpValues(e, {
                method: "OPTIONS",
                params: k,
                headers: l,
              }),
              patch: this.config.withHttpValues(e, {
                method: "PATCH",
                params: k,
                headers: l,
              }),
            })
          );
        });
      var g = function () {};
      (g.prototype = new f()),
        (g.prototype.normalizeUrl = function (a) {
          var b = /(http[s]?:\/\/)?(.*)?/.exec(a);
          return (
            (b[2] = b[2].replace(/[\\\/]+/g, "/")),
            "undefined" != typeof b[1] ? b[1] + b[2] : b[2]
          );
        }),
        (g.prototype.base = function (a) {
          var c = this;
          return _.reduce(
            this.parentsArray(a),
            function (a, d) {
              var e,
                f = c.config.getUrlFromElem(d);
              if (f) {
                if (c.config.isAbsoluteUrl(f)) return f;
                e = f;
              } else if (
                ((e = d[c.config.restangularFields.route]),
                d[c.config.restangularFields.restangularCollection])
              ) {
                var g = d[c.config.restangularFields.ids];
                g && (e += "/" + g.join(","));
              } else {
                var h;
                (h = c.config.useCannonicalId
                  ? c.config.getCannonicalIdFromElem(d)
                  : c.config.getIdFromElem(d)),
                  b.isValidId(h) &&
                    !d.singleOne &&
                    (e +=
                      "/" + (c.config.encodeIds ? encodeURIComponent(h) : h));
              }
              return (a = a.replace(/\/$/, "") + "/" + e), c.normalizeUrl(a);
            },
            this.config.baseUrl
          );
        }),
        (g.prototype.fetchUrl = function (a, b) {
          var c = this.base(a);
          return b && (c += "/" + b), c;
        }),
        (g.prototype.fetchRequestedUrl = function (a, c) {
          function d(a) {
            var b = [];
            for (var c in a) a.hasOwnProperty(c) && b.push(c);
            return b.sort();
          }
          function e(a, b, c) {
            for (var e = d(a), f = 0; f < e.length; f++)
              b.call(c, a[e[f]], e[f]);
            return e;
          }
          function f(a, b) {
            return encodeURIComponent(a)
              .replace(/%40/gi, "@")
              .replace(/%3A/gi, ":")
              .replace(/%24/g, "$")
              .replace(/%2C/gi, ",")
              .replace(/%20/g, b ? "%20" : "+");
          }
          var g = this.fetchUrl(a, c),
            h = a[b.restangularFields.reqParams];
          if (!h) return g + (this.config.suffix || "");
          var i = [];
          return (
            e(h, function (a, b) {
              null !== a &&
                void 0 !== a &&
                (angular.isArray(a) || (a = [a]),
                angular.forEach(a, function (a) {
                  angular.isObject(a) && (a = angular.toJson(a)),
                    i.push(f(b) + "=" + f(a));
                }));
            }),
            g +
              (this.config.suffix || "") +
              (-1 === g.indexOf("?") ? "?" : "&") +
              i.join("&")
          );
        }),
        (b.urlCreatorFactory.path = g);
    };
    var b = {};
    a.init(this, b),
      (this.$get = [
        "$http",
        "$q",
        function (c, d) {
          function e(b) {
            function f(a, c, d, e, f) {
              if (
                ((c[b.restangularFields.route] = d),
                (c[b.restangularFields.getRestangularUrl] = _.bind(
                  P.fetchUrl,
                  P,
                  c
                )),
                (c[b.restangularFields.getRequestedUrl] = _.bind(
                  P.fetchRequestedUrl,
                  P,
                  c
                )),
                (c[b.restangularFields.addRestangularMethod] = _.bind(L, c)),
                (c[b.restangularFields.clone] = _.bind(r, c, c)),
                (c[b.restangularFields.reqParams] = _.isEmpty(e) ? null : e),
                (c[b.restangularFields.withHttpConfig] = _.bind(z, c)),
                (c[b.restangularFields.plain] = _.bind(p, c, c)),
                (c[b.restangularFields.restangularized] = !0),
                (c[b.restangularFields.one] = _.bind(g, c, c)),
                (c[b.restangularFields.all] = _.bind(h, c, c)),
                (c[b.restangularFields.several] = _.bind(i, c, c)),
                (c[b.restangularFields.oneUrl] = _.bind(j, c, c)),
                (c[b.restangularFields.allUrl] = _.bind(k, c, c)),
                (c[b.restangularFields.fromServer] = !!f),
                a && b.shouldSaveParent(d))
              ) {
                var l = b.getIdFromElem(a),
                  m = b.getUrlFromElem(a),
                  n = _.union(
                    _.values(
                      _.pick(b.restangularFields, [
                        "route",
                        "singleOne",
                        "parentResource",
                      ])
                    ),
                    b.extraFields
                  ),
                  o = _.pick(a, n);
                b.isValidId(l) && b.setIdToElem(o, l, d),
                  b.isValidId(m) && b.setUrlToElem(o, m, d),
                  (c[b.restangularFields.parentResource] = o);
              } else c[b.restangularFields.parentResource] = null;
              return c;
            }
            function g(a, c, d, e) {
              var f;
              if (_.isNumber(c) || _.isNumber(a))
                throw (
                  ((f =
                    "You're creating a Restangular entity with the number "),
                  (f +=
                    "instead of the route or the parent. For example, you can't call .one(12)."),
                  new Error(f))
                );
              if (_.isUndefined(c))
                throw (
                  ((f =
                    "You're creating a Restangular entity either without the path. "),
                  (f +=
                    "For example you can't call .one(). Please check if your arguments are valid."),
                  new Error(f))
                );
              var g = {};
              return (
                b.setIdToElem(g, d, c),
                b.setFieldToElem(b.restangularFields.singleOne, g, e),
                s(a, g, c, !1)
              );
            }
            function h(a, b) {
              return t(a, [], b, !1);
            }
            function i(a, c) {
              var d = [];
              return (
                (d[b.restangularFields.ids] = Array.prototype.splice.call(
                  arguments,
                  2
                )),
                t(a, d, c, !1)
              );
            }
            function j(a, c, d) {
              if (!c)
                throw new Error(
                  "Route is mandatory when creating new Restangular objects."
                );
              var e = {};
              return b.setUrlToElem(e, d, c), s(a, e, c, !1);
            }
            function k(a, c, d) {
              if (!c)
                throw new Error(
                  "Route is mandatory when creating new Restangular objects."
                );
              var e = {};
              return b.setUrlToElem(e, d, c), t(a, e, c, !1);
            }
            function l(a, c, d) {
              return (
                (a.call = _.bind(m, a)),
                (a.get = _.bind(n, a)),
                (a[b.restangularFields.restangularCollection] = c),
                c && (a.push = _.bind(m, a, "push")),
                (a.$object = d),
                b.restangularizePromiseInterceptor &&
                  b.restangularizePromiseInterceptor(a),
                a
              );
            }
            function m(a) {
              var c = d.defer(),
                e = arguments,
                f = {};
              return (
                this.then(function (b) {
                  var d = Array.prototype.slice.call(e, 1),
                    g = b[a];
                  g.apply(b, d), (f = b), c.resolve(b);
                }),
                l(c.promise, this[b.restangularFields.restangularCollection], f)
              );
            }
            function n(a) {
              var c = d.defer(),
                e = {};
              return (
                this.then(function (b) {
                  (e = b[a]), c.resolve(e);
                }),
                l(c.promise, this[b.restangularFields.restangularCollection], e)
              );
            }
            function o(a, c, d, e) {
              return (
                _.extend(e, d),
                b.fullResponse
                  ? a.resolve(_.extend(c, { data: d }))
                  : (a.resolve(d), void 0)
              );
            }
            function p(a) {
              if (_.isArray(a)) {
                var c = [];
                return (
                  _.each(a, function (a) {
                    c.push(b.isRestangularized(a) ? p(a) : a);
                  }),
                  c
                );
              }
              return _.omit(a, _.values(_.omit(b.restangularFields, "id")));
            }
            function q(a) {
              (a[b.restangularFields.customOperation] = _.bind(K, a)),
                _.each(["put", "post", "get", "delete"], function (b) {
                  _.each(["do", "custom"], function (c) {
                    var d,
                      e = "delete" === b ? "remove" : b,
                      f = c + b.toUpperCase();
                    (d =
                      "put" !== e && "post" !== e
                        ? K
                        : function (a, b, c, d, e) {
                            return _.bind(K, this)(a, c, d, e, b);
                          }),
                      (a[f] = _.bind(d, a, e));
                  });
                }),
                (a[b.restangularFields.customGETLIST] = _.bind(y, a)),
                (a[b.restangularFields.doGETLIST] =
                  a[b.restangularFields.customGETLIST]);
            }
            function r(a, c) {
              var d = angular.copy(a, c);
              return s(
                d[b.restangularFields.parentResource],
                d,
                d[b.restangularFields.route],
                !0
              );
            }
            function s(a, c, d, e, g, h) {
              var i = b.onBeforeElemRestangularized(c, !1, d),
                j = f(a, i, d, h, e);
              return (
                b.useCannonicalId &&
                  (j[b.restangularFields.cannonicalId] = b.getIdFromElem(j)),
                g &&
                  (j[b.restangularFields.getParentList] = function () {
                    return g;
                  }),
                (j[b.restangularFields.restangularCollection] = !1),
                (j[b.restangularFields.get] = _.bind(C, j)),
                (j[b.restangularFields.getList] = _.bind(y, j)),
                (j[b.restangularFields.put] = _.bind(E, j)),
                (j[b.restangularFields.post] = _.bind(F, j)),
                (j[b.restangularFields.remove] = _.bind(D, j)),
                (j[b.restangularFields.head] = _.bind(G, j)),
                (j[b.restangularFields.trace] = _.bind(H, j)),
                (j[b.restangularFields.options] = _.bind(I, j)),
                (j[b.restangularFields.patch] = _.bind(J, j)),
                (j[b.restangularFields.save] = _.bind(A, j)),
                q(j),
                b.transformElem(j, !1, d, O, !0)
              );
            }
            function t(a, c, d, e, g) {
              var h = b.onBeforeElemRestangularized(c, !0, d),
                i = f(a, h, d, g, e);
              return (
                (i[b.restangularFields.restangularCollection] = !0),
                (i[b.restangularFields.post] = _.bind(F, i, null)),
                (i[b.restangularFields.remove] = _.bind(D, i)),
                (i[b.restangularFields.head] = _.bind(G, i)),
                (i[b.restangularFields.trace] = _.bind(H, i)),
                (i[b.restangularFields.putElement] = _.bind(w, i)),
                (i[b.restangularFields.options] = _.bind(I, i)),
                (i[b.restangularFields.patch] = _.bind(J, i)),
                (i[b.restangularFields.get] = _.bind(v, i)),
                (i[b.restangularFields.getList] = _.bind(y, i, null)),
                q(i),
                b.transformElem(i, !0, d, O, !0)
              );
            }
            function u(a, b, c) {
              var d = t(a, b, c, !1);
              return (
                _.each(d, function (b) {
                  s(a, b, c, !1);
                }),
                d
              );
            }
            function v(a, b, c) {
              return this.customGET(a.toString(), b, c);
            }
            function w(a, c, e) {
              var f = this,
                g = this[a],
                h = d.defer(),
                i = [];
              return (
                (i = b.transformElem(i, !0, g[b.restangularFields.route], O)),
                g.put(c, e).then(
                  function (b) {
                    var c = r(f);
                    (c[a] = b), (i = c), h.resolve(c);
                  },
                  function (a) {
                    h.reject(a);
                  }
                ),
                l(h.promise, !0, i)
              );
            }
            function x(a, c, d, e, f, g) {
              var h = b.responseExtractor(a, c, d, e, f, g),
                i = f.headers("ETag");
              return h && i && (h[b.restangularFields.etag] = i), h;
            }
            function y(a, e, f) {
              var g = this,
                h = d.defer(),
                i = "getList",
                j = P.fetchUrl(this, a),
                k = a || g[b.restangularFields.route],
                m = b.fullRequestInterceptor(
                  null,
                  i,
                  k,
                  j,
                  f || {},
                  e || {},
                  this[b.restangularFields.httpConfig] || {}
                ),
                n = [];
              n = b.transformElem(n, !0, k, O);
              var p = "getList";
              b.jsonp && (p = "jsonp");
              var q = function (c) {
                var d = c.data,
                  e = c.config.params,
                  f = x(d, i, k, j, c, h);
                if (((_.isUndefined(f) || "" === f) && (f = []), !_.isArray(f)))
                  throw new Error(
                    "Response for getList SHOULD be an array and not an object or something else"
                  );
                var l = _.map(f, function (c) {
                  return g[b.restangularFields.restangularCollection]
                    ? s(
                        g[b.restangularFields.parentResource],
                        c,
                        g[b.restangularFields.route],
                        !0,
                        f
                      )
                    : s(g, c, a, !0, f);
                });
                (l = _.extend(f, l)),
                  g[b.restangularFields.restangularCollection]
                    ? o(
                        h,
                        c,
                        t(
                          g[b.restangularFields.parentResource],
                          l,
                          g[b.restangularFields.route],
                          !0,
                          e
                        ),
                        n
                      )
                    : o(h, c, t(g, l, a, !0, e), n);
              };
              return (
                P.resource(
                  this,
                  c,
                  m.httpConfig,
                  m.headers,
                  m.params,
                  a,
                  this[b.restangularFields.etag],
                  i
                )
                  [p]()
                  .then(q, function (a) {
                    304 === a.status &&
                    g[b.restangularFields.restangularCollection]
                      ? o(h, a, g, n)
                      : _.every(b.errorInterceptors, function (b) {
                          return b(a, h, q) !== !1;
                        }) && h.reject(a);
                  }),
                l(h.promise, !0, n)
              );
            }
            function z(a) {
              return (this[b.restangularFields.httpConfig] = a), this;
            }
            function A(a, c) {
              return this[b.restangularFields.fromServer]
                ? this[b.restangularFields.put](a, c)
                : _.bind(B, this)("post", void 0, a, void 0, c);
            }
            function B(a, e, f, g, h) {
              var i = this,
                j = d.defer(),
                k = f || {},
                m = e || this[b.restangularFields.route],
                n = P.fetchUrl(this, e),
                q = g || this,
                r =
                  q[b.restangularFields.etag] ||
                  ("post" !== a ? this[b.restangularFields.etag] : null);
              _.isObject(q) && b.isRestangularized(q) && (q = p(q));
              var t = b.fullRequestInterceptor(
                  q,
                  a,
                  m,
                  n,
                  h || {},
                  k || {},
                  this[b.restangularFields.httpConfig] || {}
                ),
                u = {};
              u = b.transformElem(u, !1, m, O);
              var v = function (c) {
                  var d = c.data,
                    e = c.config.params,
                    f = x(d, a, m, n, c, j);
                  if (f)
                    if (
                      "post" !== a ||
                      i[b.restangularFields.restangularCollection]
                    ) {
                      var g = s(
                        i[b.restangularFields.parentResource],
                        f,
                        i[b.restangularFields.route],
                        !0,
                        null,
                        e
                      );
                      (g[b.restangularFields.singleOne] =
                        i[b.restangularFields.singleOne]),
                        o(j, c, g, u);
                    } else {
                      var g = s(
                        i[b.restangularFields.parentResource],
                        f,
                        m,
                        !0,
                        null,
                        e
                      );
                      o(j, c, g, u);
                    }
                  else o(j, c, void 0, u);
                },
                w = function (c) {
                  304 === c.status && b.isSafe(a)
                    ? o(j, c, i, u)
                    : _.every(b.errorInterceptors, function (a) {
                        return a(c, j, v) !== !1;
                      }) && j.reject(c);
                },
                y = a,
                z = _.extend({}, t.headers),
                A = b.isOverridenMethod(a);
              return (
                A
                  ? ((y = "post"),
                    (z = _.extend(z, {
                      "X-HTTP-Method-Override":
                        "remove" === a ? "DELETE" : a.toUpperCase(),
                    })))
                  : b.jsonp && "get" === y && (y = "jsonp"),
                b.isSafe(a)
                  ? A
                    ? P.resource(this, c, t.httpConfig, z, t.params, e, r, y)
                        [y]({})
                        .then(v, w)
                    : P.resource(this, c, t.httpConfig, z, t.params, e, r, y)
                        [y]()
                        .then(v, w)
                  : P.resource(this, c, t.httpConfig, z, t.params, e, r, y)
                      [y](t.element)
                      .then(v, w),
                l(j.promise, !1, u)
              );
            }
            function C(a, b) {
              return _.bind(B, this)("get", void 0, a, void 0, b);
            }
            function D(a, b) {
              return _.bind(B, this)("remove", void 0, a, void 0, b);
            }
            function E(a, b) {
              return _.bind(B, this)("put", void 0, a, void 0, b);
            }
            function F(a, b, c, d) {
              return _.bind(B, this)("post", a, c, b, d);
            }
            function G(a, b) {
              return _.bind(B, this)("head", void 0, a, void 0, b);
            }
            function H(a, b) {
              return _.bind(B, this)("trace", void 0, a, void 0, b);
            }
            function I(a, b) {
              return _.bind(B, this)("options", void 0, a, void 0, b);
            }
            function J(a, b, c) {
              return _.bind(B, this)("patch", void 0, b, a, c);
            }
            function K(a, b, c, d, e) {
              return _.bind(B, this)(a, b, c, e, d);
            }
            function L(a, c, d, e, f, g) {
              var h;
              h = "getList" === c ? _.bind(y, this, d) : _.bind(K, this, c, d);
              var i = function (a, b, c) {
                var d = _.defaults(
                  { params: a, headers: b, elem: c },
                  { params: e, headers: f, elem: g }
                );
                return h(d.params, d.headers, d.elem);
              };
              this[a] = b.isSafe(c)
                ? i
                : function (a, b, c) {
                    return i(b, c, a);
                  };
            }
            function M(c) {
              var d = angular.copy(_.omit(b, "configuration"));
              return a.init(d, d), c(d), e(d);
            }
            function N(a, c) {
              var d = _.values(b.restangularFields),
                e = {},
                f = (c || O).all(a);
              (e.one = _.bind(g, c || O, c, a)),
                (e.post = _.bind(f.post, f)),
                (e.getList = _.bind(f.getList, f));
              for (var h in f)
                f.hasOwnProperty(h) &&
                  _.isFunction(f[h]) &&
                  !_.contains(d, h) &&
                  (e[h] = _.bind(f[h], f));
              return e;
            }
            var O = {},
              P = new b.urlCreatorFactory[b.urlCreator]();
            return (
              P.setConfig(b),
              a.init(O, b),
              (O.copy = _.bind(r, O)),
              (O.service = _.bind(N, O)),
              (O.withConfig = _.bind(M, O)),
              (O.one = _.bind(g, O, null)),
              (O.all = _.bind(h, O, null)),
              (O.several = _.bind(i, O, null)),
              (O.oneUrl = _.bind(j, O, null)),
              (O.allUrl = _.bind(k, O, null)),
              (O.stripRestangular = _.bind(p, O)),
              (O.restangularizeElement = _.bind(s, O)),
              (O.restangularizeCollection = _.bind(u, O)),
              O
            );
          }
          return e(b);
        },
      ]);
  });
})();
