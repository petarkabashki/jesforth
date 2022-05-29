// import { jeForth } from './projectk'


const fs = require("fs");
// var Forth = require("./kernel/forth.js");
// var forth = Forth();
// forth.run(fs.readFileSync("forth/forth.fth"), out);

const out = process.stdout.write.bind(process.stdout);
const { jeforth } = require("./jseforth613");
vm = jeforth(out);


// vm.type = out;

buffer = "";
gather = false;

process.stdin.pipe(require('split')('\n')).on('data', processLine)
// process.stdin.on('data', processLine)

function processLine (line) {
  try{
    if (line == '<<<') {
      gather = true;
      return;
    } else if (line == '>>>') {
      gather = false;      
      line = buffer;
      buffer = '';
      vm.main(line);
      return;
    }
    if (gather) {
      buffer = (buffer && buffer + '\n' || '') + line;
      return;
    } else {
      vm.main(line);
    }
    // const cont = line.slice(-1) === '\\';
    // line = cont && line.slice(0,-1) || line;
    // buffer = buffer + ( buffer && '\n' || '') + line
    // if (cont) {
    // } else {
    //   vm.main(buffer);
    //   buffer = '';
    // }
  } catch(e) {
    console.log(e);
    // buffer = '';
  }  
}
