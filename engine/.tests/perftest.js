// simple test to evaluate the best iterator to use on array
datas = [
  { s:"un", c: 1},
  { s:"deux", c: 2 },
  { s:"trois", c: 3 },
  { s:"quatre", c: 4 },
  { s:"cinq", c: 5 },
  { s:"six", c: 6 },
  { s:"sept", c: 7 },
  { s:"huit", c: 8 },
  { s:"neuf", c: 9 },
  { s:"dix", c: 10 },
  { s:"onze", c: 11 },
  { s:"douze", c: 12 },
  { s:"treize", c: 13 },
  { s:"quatorze", c: 14 },
  { s:"quinze", c: 15 },
  { s:"seize", c: 16 },
]

// setTimeout allows to realease cpu charge
cnt = 0
do_perftest = (name, fu) => {
  setTimeout(()=>{
  console.time(name)
  for (let j = 0; j < count; j++) {
    fu()
  }
  console.timeEnd(name)
  }, 2000 + cnt++ * 1000)
}
log = (msg) => {
  setTimeout(()=>{
    console.log(msg)
  }, 2000 + cnt++ * 1000)
}

for (let z=1; z<5; z++){
for (let k=2; k<4; k++){
count = 10 ** k
nbdata = 2 ** z
log('TEST '+count+' pass with '+nbdata+ 'datas')
objs = datas.slice(0,nbdata)

do_perftest('for i;;i++', () => {
  let sum = 0
  let str = ""
  let o
  for (let i = 0; i < objs.length; i++) {
    o=objs[i]
    sum += o.c
    str += o.s
  }
})

do_perftest('while', () => {
  let sum = 0
  let str = ""
  let o
  let i = objs.length
  while (i--) {
    o=objs[i]
    sum += o.c
    str += o.s
  }
})

do_perftest('while shifting', () => {
  let sum = 0
  let str = ""
  let o
  while (o = objs.shift()) {
    sum += o.c
    str += o.s
  }
})

do_perftest('forEach', () => {
  let sum = 0
  let str = ""
  objs.forEach(o => {
    sum += o.c
    str += o.s
  })
})

do_perftest('reduce', () => {
  let sum = objs.reduce((s, o) => s += o.c, 0)
  let str = objs.reduce((s, o) => s += o.s, 0)
})

do_perftest('map', () => {
  let sum = 0
  let str = ""
  objs.map((o) => sum += o.c)
  objs.map((o) => str += o.s)
})

