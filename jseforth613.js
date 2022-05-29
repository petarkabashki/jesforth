﻿/* jeforth 6.13
19feb21cht 6.13 see, dump, to, is, evaluate
11feb21cht 6.03 jsBach, qf, q@, does
25jan21cht 5.03 one AudioContext, 6 voices polypohny
18jan21cht 4.01-4.03 haiku eforth 
08jan21cht 3.01-3.02 colon words have token lists in pf. 
07jan21cht 2.01-2.03 execute-nest-exit, quit loop 
2011/12/23 initial version by Cheahshen Yap and Sam Chen */
"uses strict";

module.exports = {
  jeforth:
    function (logtype) {
      var ip = 0, wp = 0, w = 0;         // instruction and word pointers
      // top of stack and return stack
      var tos = null, rtos = null;
      function spush(v){
        stack.push(v);
        tos = v;
      }
      function rpush(v){
        rstack.push(v);
        rtos = v;
      }
      function spop(v){
        tos = stack[stack.length - 2];
        return stack.pop();
      }
      function rpop(v){
        rtos = rstack[rstack.length - 2];
        return rstack.pop();
      }
      var stack = [], rstack = [];    // array allows push and pop
      var tib = "", ntib = 0, base = 10;
      var idiom = "";
      var compiling = false;
      var fence = 0;
      var newname;
      // for long strings with custom ending character
      function  parse$(delimit) {
        // idiom = "";
        if (delimit === undefined) delimit = "~";
        // while (tib.charCodeAt(ntib) <= 32) ntib++;
        var buffer = '';
        ntib = 3;
        while (ntib < tib.length && tib.substr(ntib, delimit.length)
          != delimit) { buffer += tib.substr(ntib++, 1); }
        // if (delimit != " ") ntib++;
        ntib += delimit.length;
        if (buffer === "") throw (" < " + stack.join(" ") + " >ok ");
        return buffer;
      }
      // for word under construction
      function  parse(delimit) {
        idiom = "";
        if (delimit === undefined) delimit = " ";
        while (tib.charCodeAt(ntib) <= 32) ntib++;
        while (ntib < tib.length && tib.substr(ntib, 1)
          != delimit && tib.substr(ntib, 1) != "\n") { idiom += tib.substr(ntib++, 1); }
        if (delimit != " ") ntib++;
        if (idiom === "") throw (" < " + stack.join(" ") + " >ok ");
        return idiom;
      }
      function find(name) {
        for (i = words.length - 1; i >= 0; i--) { if (words[i].name === name) return i; }
        return -1;
      }
      function dictcompile(n) { words[words.length - 1].pf.push(n); }
      function compilecode(nword) {
        if (typeof (nword) === "string") { var n = find(nword); }
        else n = nword;
        if (n > -1) dictcompile(n);
        else { stack = []; throw (" " + nword + " ? "); }
      }
      function exec(n) { w = n; words[n].xt(); }
      function exit() { ip = -1; }
      function nest() {               // inner interpreter
        rstack.push(wp); rstack.push(ip); wp = w; ip = 0;
        while (ip >= 0) { w = words[wp].pf[ip++]; words[w].xt(); }
        ip = rstack.pop(); wp = rstack.pop();
      }
      function evaluate() {         // interpreter/compiler
        var n = parseFloat(idiom);   // convert to number
        var nword = find(idiom);
        if (base != 10) { n = parseInt(idiom, base); }
        if (nword > -1) {
          if (compiling && !words[nword].immediate) dictcompile(nword);
          else { exec(nword); }
        }       // nest, docon, dovar need pf
        else if (n || idiom == 0) {  // if the idiom is a number
          if (compiling) {
            compilecode("dolit");    // compile an literal
            dictcompile(n);
          }
          else { stack.push(n); }
        }
        else {
          if (compiling) words.pop();// error, delete defective word
          stack = []; throw (" " + idiom + " ? ");
        }
      }
      function dovar() { stack.push(w); }
      function docon() { stack.push(words[w].qf[0]); }
      function tick() {
        idiom = parse(); var i = find(idiom);
        if (i >= 0) stack.push(i);
        else throw (" " + idiom + " ? ");
      }
      function main(cmd) {
        tib = cmd; ntib = 0;
        rstack = []; wp = 0; ip = 0; w = 0; compiling = false; exec(0);
      }

      // audio
      function sleep(ms) {
        var d = Date.now(); var n = 0;
        do { n = Date.now(); } while (n - d < ms);
      }
      function poly(vol, bass, tenor, alto, soprano, pedal, flute, ms) {
        amp.gain.value = vol;
        osc1.frequency.value = bass;
        osc2.frequency.value = tenor;
        osc3.frequency.value = alto;
        osc4.frequency.value = soprano;
        osc5.frequency.value = pedal;
        osc6.frequency.value = flute;
        sleep(ms);
      }

      // word objects
      var words = [
        { name: "quit", xt: function () { nest(); }, pf: [1, 2, 3, 0] }
        , { name: "parse", xt: function () { idiom = parse(); } }
        , { name: "evaluate", xt: function () { evaluate(idiom); } }
        , { name: "branch", xt: function () { ip = words[wp].pf[ip]; } }

        // stacks
        , { name: "dup", xt: function () { stack = stack.concat(stack.slice(-1)); } }
        , { name: "over", xt: function () { stack = stack.concat(stack.slice(-2, -1)); } }
        , { name: "2dup", xt: function () { stack = stack.concat(stack.slice(-2)); } }
        , { name: "2over", xt: function () { stack = stack.concat(stack.slice(-4, -2)); } }
        , { name: "4dup", xt: function () { stack = stack.concat(stack.slice(-4)); } }
        , { name: "swap", xt: function () { stack = stack.concat(stack.splice(-2, 1)); } }
        , { name: "rot", xt: function () { stack = stack.concat(stack.splice(-3, 1)); } }
        , { name: "-rot", xt: function () { stack.splice(-2, 0, stack.pop()); } }
        , { name: "2swap", xt: function () { stack = stack.concat(stack.splice(-4, 2)); } }
        , { name: "2over", xt: function () { stack = stack.concat(stack.slice(-4, -2)); } }
        , {
          name: "pick", xt: function () {
            j = stack.pop() + 1; stack.push(stack.slice(-j, -j + 1));
          }
        }
        , {
          name: "roll", xt: function () {
            j = stack.pop() + 1; stack.push(stack.splice(-j, 1));
          }
        }
        , { name: "drop", xt: function () { stack.pop(); } }
        , { name: "nip", xt: function () { stack[stack.length - 2] = stack.pop(); } }
        , { name: "2drop", xt: function () { stack.pop(); stack.pop(); } }
        , { name: ">r", xt: function () { rstack.push(stack.pop()); } }
        , { name: "r>", xt: function () { stack.push(rstack.pop()); } }
        , { name: "r@", xt: function () { stack.push(rstack[rstack.length - 1]); } }
        , { name: "push", xt: function () { rstack.push(stack.pop()); } }
        , { name: "pop", xt: function () { stack.push(rstack.pop()); } }

        // math
        , { name: "+", xt: function () { stack.push(stack.pop() - (0 - stack.pop())); } }
        , { name: "-", xt: function () { b = stack.pop(); stack.push(stack.pop() - b); } }
        , { name: "*", xt: function () { stack.push(stack.pop() * stack.pop()); } }
        , { name: "/", xt: function () { b = stack.pop(); stack.push(stack.pop() / b); } }
        , { name: "mod", xt: function () { b = stack.pop(); stack.push(stack.pop() % b); } }
        , { name: "and", xt: function () { stack.push(stack.pop() & stack.pop()); } }
        , { name: "or", xt: function () { stack.push(stack.pop() | stack.pop()); } }
        , { name: "xor", xt: function () { stack.push(stack.pop() ^ stack.pop()); } }
        , { name: "negate", xt: function () { stack.push(0 - stack.pop()); } }

        // compare
        , { name: "0=", xt: function () { stack.push(stack.pop() === 0); } }
        , { name: "0<", xt: function () { stack.push(stack.pop() < 0); } }
        , { name: "0>", xt: function () { stack.push(stack.pop() > 0); } }
        , { name: "0<>", xt: function () { stack.push(stack.pop() !== 0); } }
        , { name: "0<=", xt: function () { stack.push(stack.pop() <= 0); } }
        , { name: "0>=", xt: function () { stack.push(stack.pop() >= 0); } }
        , { name: "=", xt: function () { stack.push(stack.pop() === stack.pop()); } }
        , { name: ">", xt: function () { b = stack.pop(); stack.push(stack.pop() > b); } }
        , { name: "<", xt: function () { b = stack.pop(); stack.push(stack.pop() < b); } }
        , { name: "<>", xt: function () { stack.push(stack.pop() !== stack.pop()); } }
        , { name: ">=", xt: function () { b = stack.pop(); stack.push(stack.pop() >= b); } }
        , { name: "<=", xt: function () { b = stack.pop(); stack.push(stack.pop() <= b); } }
        , { name: "==", xt: function () { stack.push(stack.pop() == stack.pop()); } }

        // output
        , { name: "base@", xt: function () { stack.push(base); } }
        , { name: "base!", xt: function () { base = stack.pop(); } }
        , { name: "hex", xt: function () { base = 16; } }
        , { name: "decimal", xt: function () { base = 10; } }
        , { name: "cr", xt: function () { logtype("\n"); } }
        , { name: ".", xt: function () { logtype(stack.pop().toString(base) + " "); } }
        , {
          name: ".r", xt: function () {
            n = stack.pop(); logtype(stack.pop().toString().padStart(n, " "));
          }
        }
        , {
          name: "emit", xt: function () {
            s = String.fromCharCode(stack.pop()); logtype(s);
          }
        }
        , { name: "space", xt: function () { s = " "; logtype(s); } }
        , {
          name: "spaces", xt: function () {
            n = stack.pop(); s = ""; for (i = 0; i < n; i++)s += " "; logtype(s);
          }
        }

        // strings
        , { name: "[", xt: function () { compiling = false; }, immediate: true }
        , { name: "]", xt: function () { compiling = true; } }
        , { name: "find", xt: function () { idiom = parse(); stack.push(find(idiom)); } }
        , { name: "'", xt: function () { tick(); } }
        , { name: "(')", xt: function () { stack.push(words[w].pf[ip++]); } }
        , {
          name: "[']", xt: function () {
            compilecode("(')");
            tick(); compilecode(stack.pop());
          }, immediate: true
        }
        , { name: "dolit", xt: function () { stack.push(words[wp].pf[ip++]); } }
        , { name: "dostr", xt: function () { stack.push(words[w].pf[ip++]); } }
        , {
          name: 's"', xt: function () {
            s = parse('"');
            if (compiling) { compilecode("dostr"); dictcompile(s); }
            else { stack.push(s); };
          }, immediate: true
        }
        // , {
        //   name: 'ss"', xt: function () {
        //     s = parse('"ss');
        //     if (compiling) { compilecode("dostr"); dictcompile(s); }
        //     else { stack.push(s); };
        //   }, immediate: true
        // }        
        , { name: "dotstr", xt: function () { n = words[wp].pf[ip++]; logtype(n); } }
        , {
          name: '."', xt: function () {
            s = parse('"');
            if (compiling) { compilecode("dotstr"); dictcompile(s); }
            else { logtype(s); };
          }, immediate: true
        }
        , { name: '(', xt: function () { s = parse(')'); }, immediate: true }
        , { name: '.(', xt: function () { s = parse(')'); logtype(s); }, immediate: true }
        , { name: '\\', xt: function () { s = parse('\n'); }, immediate: true }

        // structures
        , { name: "exit", xt: function () { exit(); } }
        , {
          name: "0branch", xt: function () {
            if (stack.pop()) ip++; else ip = words[wp].pf[ip];
          }
        }
        , {
          name: "donext", xt: function () {
            i = rstack.pop() - 1;
            if (i >= 0) { ip = words[wp].pf[ip]; rstack.push(i); } else { ip++; };
          }
        }
        , {
          name: "if", xt: function () {    // if    ( -- here ) 
            compilecode("0branch");
            stack.push(words[words.length - 1].pf.length); dictcompile(0);
          }, immediate: true
        }
        , {
          name: "else", xt: function () {    // else ( here -- there )
            compilecode("branch"); h = words[words.length - 1].pf.length; dictcompile(0);
            words[words.length - 1].pf[stack.pop()]
              = words[words.length - 1].pf.length; stack.push(h);
          }, immediate: true
        }
        , {
          name: "then", xt: function () {    // then    ( there -- ) 
            words[words.length - 1].pf[stack.pop()]
              = words[words.length - 1].pf.length;
          }, immediate: true
        }
        , {
          name: "begin", xt: function () { // begin    ( -- here ) 
            stack.push(words[words.length - 1].pf.length);
          }, immediate: true
        }
        , {
          name: "again", xt: function () { // again    ( there -- ) 
            compilecode("branch"); compilecode(stack.pop());
          }, immediate: true
        }
        , {
          name: "until", xt: function () { // until    ( there -- ) 
            compilecode("0branch"); compilecode(stack.pop());
          }, immediate: true
        }
        , {
          name: "while", xt: function () { // while    ( there -- there here ) 
            compilecode("0branch");
            stack.push(words[words.length - 1].pf.length); dictcompile(0);
          }, immediate: true
        }
        , {
          name: "repeat", xt: function () { // repeat    ( there1 there2 -- ) 
            compilecode("branch"); t = stack.pop(); compilecode(stack.pop());
            words[words.length - 1].pf[t] = words[words.length - 1].pf.length;
          }, immediate: true
        }
        , {
          name: "for", xt: function () {    // for ( -- here )
            compilecode(">r"); stack.push(words[words.length - 1].pf.length);
          }, immediate: true
        }
        , {
          name: "next", xt: function () {    // next ( here -- )
            compilecode("donext"); compilecode(stack.pop());
          }, immediate: true
        }
        , {
          name: "aft", xt: function () {    // aft ( here -- here there )
            stack.pop(); compilecode("branch");
            h = words[words.length - 1].pf.length; dictcompile(0);
            stack.push(words[words.length - 1].pf.length); stack.push(h);
          }, immediate: true
        }

        // defining words
        , {
          name: ":", xt: function () {
            newname = parse(); compiling = true;
            words.push({ name: newname, xt: function () { nest(); }, pf: [] });
          }
        }
        , {
          name: ";", xt: function () { compiling = false; compilecode("exit"); },
          immediate: true
        }
        , {
          name: "create", xt: function () {
            newname = parse();
            words.push({ name: newname, xt: function () { dovar(); }, qf: [] });
          }
        }
        , {
          name: "variable", xt: function () {
            newname = parse();
            words.push({ name: newname, xt: function () { dovar(); }, qf: [0] });
          }
        }
        , {
          name: "constant", xt: function () {
            newname = parse();
            words.push({ name: newname, xt: function () { docon(); }, qf: [stack.pop()] });
          }
        }
        , { name: ",", xt: function () { dictcompile(stack.pop()); } }
        , {
          name: "allot", xt: function () {
            n = stack.pop();
            for (i = 0; i < n; i++) words[words.length - 1].qf.push(0);
          }
        }
        , {
          name: "does", xt: function () {
            words[words.length - 1].xt = function () { nest(); };
            words[words.length - 1].pf = words[wp].pf.slice(ip); ip = -1;
          }
        }
        , {
          name: "q@", xt: function () { // q@ ( i -- n ) designed for does words
            i = stack.pop(); stack.push(words[wp].qf[i]);
          }
        }

        // tools
        , { name: "here", xt: function () { stack.push(words.length); } }
        , {
          name: "words", xt: function () {
            for (i = words.length - 1; i >= 0; i--)logtype(words[i].name + " ");
          }
        }
        , {
          name: "dump", xt: function () {
            logtype('words[\n');
            for (i = 0; i < words.length; i++) {
              logtype('{name:"' + words[i].name + '", xt:' + words[i].xt.toString());
              if (words[i].pf) logtype(', pf:[' + words[i].pf.toString() + ']');
              if (words[i].qf) logtype(', qf:[' + words[i].qf.toString() + ']');
              if (words[i].immediate) logtype(' ,immediate:' + words[i].immediate);
              logtype('}},\n');
            }
            logtype(']\n');
          }
        }
        , {
          name: "forget", xt: function () {
            tick(); n = stack.pop();
            if (n < fence) { stack = []; throw (" " + idiom + " below fence"); }
            for (i = words.length - 1; i >= n; i--)words.pop();
          }
        }
        , {
          name: "boot", xt: function () {
            for (i = words.length - 1; i >= fence; i--)words.pop();
          }
        }
        , {
          name: "see", xt: function () {
            tick(); n = stack.pop(); p = words[n].pf; s = "";
            for (i = 0; i < p.length; i++) {
              if (s == "dolit" || s == "branch" || s == "0branch"
                || s == "donext" || s == "dostr" || s == "dotstr") { s = " "; logtype(p[i].toString() + " "); }
              else { s = words[p[i]].name; logtype(s + " "); }
            }
          }
        }
        , { name: "date", xt: function () { d = new Date(); logtype(d + "\n"); } }
        , { name: "@", xt: function () { a = stack.pop(); stack.push(words[a].qf[0]); } }
        , { name: "!", xt: function () { a = stack.pop(); words[a].qf[0] = stack.pop(); } }
        , { name: "+!", xt: function () { a = stack.pop(); words[a].qf[0] += stack.pop(); } }
        , {
          name: "?", xt: function () {
            logtype(words[stack.pop()].pf[0].toString(base) + " ");
          }
        }
        , {
          name: "array@", xt: function () { // array@ ( w i -- n ) 
            i = stack.pop(); a = stack.pop(); stack.push(words[a].qf[i]);
          }
        }
        , {
          name: "array!", xt: function () { // array! ( n w i -- ) 
            i = stack.pop(); a = stack.pop(); words[a].qf[i] = stack.pop();
          }
        }
        , {
          name: "is", xt: function () { // ( a -- ) vector a to next word 
            tick(); b = stack.pop(); a = stack.pop(); words[b].pf = words[a].pf;
          }
        }
        , {
          name: "to", xt: function () { // ( a -- ) change value of next word
            a = words[wp].pf[ip++]; words[a].qf[0] = stack.pop();
          }
        }
        , { name: "ms", xt: function () { sleep(stack.pop()); } }

        // transcendental
        , { name: "pi", xt: function () { stack.push(Math.PI); } }
        , { name: "random", xt: function () { stack.push(Math.random()); } }
        , { name: "int", xt: function () { stack.push(Math.trunc(stack.pop())); } }
        , { name: "ceil", xt: function () { stack.push(Math.ceil(stack.pop())); } }
        , { name: "floor", xt: function () { stack.push(Math.floor(stack.pop())); } }
        , { name: "sin", xt: function () { stack.push(Math.sin(stack.pop())); } }
        , { name: "cos", xt: function () { stack.push(Math.cos(stack.pop())); } }
        , { name: "tan", xt: function () { stack.push(Math.tan(stack.pop())); } }
        , { name: "asin", xt: function () { stack.push(Math.asin(stack.pop())); } }
        , { name: "acos", xt: function () { stack.push(Math.acos(stack.pop())); } }
        , { name: "exp", xt: function () { stack.push(Math.exp(stack.pop())); } }
        , { name: "log", xt: function () { stack.push(Math.log(stack.pop())); } }
        , { name: "sqrt", xt: function () { stack.push(Math.sqrt(stack.pop())); } }
        , { name: "abs", xt: function () { stack.push(Math.abs(stack.pop())); } }
        , {
          name: "max", xt: function () {
            b = stack.pop(); stack.push(Math.max(stack.pop(), b));
          }
        }
        , {
          name: "min", xt: function () {
            b = stack.pop(); stack.push(Math.min(stack.pop(), b));
          }
        }
        , {
          name: "atan2", xt: function () {
            b = stack.pop(); stack.push(Math.atan2(stack.pop(), b));
          }
        }
        , {
          name: "pow", xt: function () {
            b = stack.pop(); stack.push(Math.pow(stack.pop(), b));
          }
        }

        // canvas
        , {
          name: "image@", xt: function () {         // ( a -- r g b )
            a = stack.pop();
            stack.push(imagedata.data[a]);       // Red
            stack.push(imagedata.data[a + 1]);     // Green
            stack.push(imagedata.data[a + 2]);
          }
        }   // Blue
        , {
          name: "image!", xt: function () {         // ( r g b a -- )
            a = stack.pop(); b = stack.pop(); g = stack.pop(); r = stack.pop();
            imagedata.data[a] = r;             // Red
            imagedata.data[a + 1] = g;             // Green
            imagedata.data[a + 2] = b;             // Blue
            imagedata.data[a + 3] = 255;
          }
        }         // Alpha
        , { name: "show", xt: function () { context.putImageData(imagedata, 0, 0); } }

        // tone
        , {
          name: "poly", xt: function () { // vol bass tenor alto soprano pedal flute ms
            a = stack.pop(); b = stack.pop(); c = stack.pop();
            d = stack.pop(); e = stack.pop(); f = stack.pop(); g = stack.pop();
            h = stack.pop(); poly(h, g, f, e, d, c, b, a);
          }
        }
        , { name: "e6", xt: function () { docon(); }, qf: [1318.6] }
        , { name: "d6#", xt: function () { docon(); }, qf: [1244.6] }
        , { name: "e6b", xt: function () { docon(); }, qf: [1244.6] }
        , { name: "d6", xt: function () { docon(); }, qf: [1174.6] }
        , { name: "d6b", xt: function () { docon(); }, qf: [1108.8] }
        , { name: "c6#", xt: function () { docon(); }, qf: [1108.8] }
        , { name: "c6", xt: function () { docon(); }, qf: [1047] }
        , { name: "b5", xt: function () { docon(); }, qf: [987.8] }
        , { name: "a5#", xt: function () { docon(); }, qf: [932.3] }
        , { name: "b5b", xt: function () { docon(); }, qf: [932.3] }
        , { name: "a5", xt: function () { docon(); }, qf: [880] }
        , { name: "g5#", xt: function () { docon(); }, qf: [830.6] }
        , { name: "a5b", xt: function () { docon(); }, qf: [830.6] }
        , { name: "g5", xt: function () { docon(); }, qf: [784] }
        , { name: "f5#", xt: function () { docon(); }, qf: [740] }
        , { name: "g5b", xt: function () { docon(); }, qf: [740] }
        , { name: "f5", xt: function () { docon(); }, qf: [698.5] }
        , { name: "e5", xt: function () { docon(); }, qf: [659.3] }
        , { name: "d5#", xt: function () { docon(); }, qf: [622.3] }
        , { name: "e5b", xt: function () { docon(); }, qf: [622.3] }
        , { name: "d5", xt: function () { docon(); }, qf: [587.3] }
        , { name: "c5#", xt: function () { docon(); }, qf: [554.4] }
        , { name: "d5b", xt: function () { docon(); }, qf: [554.4] }
        , { name: "c5", xt: function () { docon(); }, qf: [523.3] }
        , { name: "b4", xt: function () { docon(); }, qf: [493.9] }
        , { name: "b4b", xt: function () { docon(); }, qf: [466.2] }
        , { name: "a4#", xt: function () { docon(); }, qf: [466.2] }
        , { name: "a4", xt: function () { docon(); }, qf: [440] }
        , { name: "g4#", xt: function () { docon(); }, qf: [415.3] }
        , { name: "a4b", xt: function () { docon(); }, qf: [415.3] }
        , { name: "g4", xt: function () { docon(); }, qf: [392] }
        , { name: "f4#", xt: function () { docon(); }, qf: [370] }
        , { name: "g4b", xt: function () { docon(); }, qf: [370] }
        , { name: "f4", xt: function () { docon(); }, qf: [349.2] }
        , { name: "e4", xt: function () { docon(); }, qf: [329.6] }
        , { name: "d4#", xt: function () { docon(); }, qf: [311.1] }
        , { name: "e4b", xt: function () { docon(); }, qf: [311.1] }
        , { name: "d4", xt: function () { docon(); }, qf: [293.7] }
        , { name: "c4#", xt: function () { docon(); }, qf: [277.2] }
        , { name: "d4b", xt: function () { docon(); }, qf: [277.2] }
        , { name: "c4", xt: function () { docon(); }, qf: [261.6] }
        , { name: "b3", xt: function () { docon(); }, qf: [246.9] }
        , { name: "a3#", xt: function () { docon(); }, qf: [233.1] }
        , { name: "b3b", xt: function () { docon(); }, qf: [233.1] }
        , { name: "a3", xt: function () { docon(); }, qf: [220] }
        , { name: "g3#", xt: function () { docon(); }, qf: [207.7] }
        , { name: "a3b", xt: function () { docon(); }, qf: [207.7] }
        , { name: "g3", xt: function () { docon(); }, qf: [196] }
        , { name: "f3#", xt: function () { docon(); }, qf: [185] }
        , { name: "g3b", xt: function () { docon(); }, qf: [185] }
        , { name: "f3", xt: function () { docon(); }, qf: [174.6] }
        , { name: "e3", xt: function () { docon(); }, qf: [164.8] }
        , { name: "d3#", xt: function () { docon(); }, qf: [155.6] }
        , { name: "e3b", xt: function () { docon(); }, qf: [155.6] }
        , { name: "d3", xt: function () { docon(); }, qf: [146.8] }
        , { name: "c3#", xt: function () { docon(); }, qf: [138.6] }
        , { name: "d3b", xt: function () { docon(); }, qf: [138.6] }
        , { name: "c3", xt: function () { docon(); }, qf: [130.8] }
        , { name: "b2", xt: function () { docon(); }, qf: [123.5] }
        , { name: "a2#", xt: function () { docon(); }, qf: [116.5] }
        , { name: "b2b", xt: function () { docon(); }, qf: [116.5] }
        , { name: "a2", xt: function () { docon(); }, qf: [110] }
        , { name: "g2#", xt: function () { docon(); }, qf: [103.8] }
        , { name: "a2b", xt: function () { docon(); }, qf: [103.8] }
        , { name: "g2", xt: function () { docon(); }, qf: [98] }
        , { name: "f2#", xt: function () { docon(); }, qf: [92.50] }
        , { name: "g2b", xt: function () { docon(); }, qf: [92.50] }
        , { name: "f2", xt: function () { docon(); }, qf: [87.31] }
        , { name: "e2", xt: function () { docon(); }, qf: [82.41] }
        , { name: "d2#", xt: function () { docon(); }, qf: [77.78] }
        , { name: "e2b", xt: function () { docon(); }, qf: [77.78] }
        , { name: "d2", xt: function () { docon(); }, qf: [73.42] }
        , { name: "c2#", xt: function () { docon(); }, qf: [69.30] }
        , { name: "d2b", xt: function () { docon(); }, qf: [69.30] }
        , { name: "c2", xt: function () { docon(); }, qf: [65.41] }
        , { name: "b1", xt: function () { docon(); }, qf: [61.75] }
        , { name: "a1#", xt: function () { docon(); }, qf: [58.25] }
        , { name: "b1b", xt: function () { docon(); }, qf: [58.25] }
        , { name: "a1", xt: function () { docon(); }, qf: [55] }
        , { name: "g1#", xt: function () { docon(); }, qf: [51.9] }
        , { name: "a1b", xt: function () { docon(); }, qf: [51.9] }
        , { name: "g1", xt: function () { docon(); }, qf: [49] }

        
        , { name: 's~', xt: function () { stack.push(parse$(stack.pop())); } }
        , { name: 'j!', xt: function () { eval(stack.pop()); } }
        , { name: 'j>', xt: function () { stack.push(eval(stack.pop())); } }
      ]
      fence = words.length;
      // this.main = main;  // make main become a public interface
      return {main}
    }
  // window.KsanaVm = KsanaVm;  // export KsanaVm as a global variable 

};
