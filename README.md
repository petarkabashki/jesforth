# Javascript/Node eForth extensions using Dr. C. H. Ting's jeforth613.

The extensions are:
- Node terminal runner. If you want to pass multi-line input to the jeforth vm, tell the node terminal wrapper so by surrounding your script with <<< and >>> like
<<<
s" makaroni na furna s kaima"
. cr
>>>

- Reading javascript strings with a custom terminator character and placing that object on the stack

s" |"
<<<
s~ makaroni
    na furna
      s kaima|
>>>

- Executing string on the stack via javascript eval with `j!`
s~ console.log('js called')~ j!

- Executing string a javascript string and placing the result on the stack `j>`
s~ function testj(){ return 458; }~ j>


- exposes stack and return stack manipulation functions to compiled javascript via spop(), spush(), rspop(), rspush()


3 5 s" ~" s~ `${stack.pop()} + ' ' + ${stack.pop()}`~ js> js>


## Examples

s" |"
<<<
s~ makaroni
    na furna
      s kaima|
>>>
