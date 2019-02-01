const t = require('tap')
const { parse, env, jack, opt, flag, list, count, num } = require('../')

const options = {
  verbose: count({
    short: 'v',
    negate: {
      short: 'V'
    }
  }),
  asdf: flag({
    short: 'a',
    alias: ['--no-xyz', '-vvv']
  }),
  xyz: flag({
    short: 'x',
    negate: {
      short: 'X'
    }
  }),
  files: list({
    short: 'f'
  }),
  implication: flag({
    implies: {
      xyz: true,
      verbose: 9,
      files: [ 'deadbeat', 'folly', 'frump', 'lagamuffin' ]
    }
  }),
  'long-list': list(),
  'long-opt': opt(),
  'default-true': flag({ default: true }),
  'noarg-flag': flag(),
  'alias': opt({
    alias: ['--long-opt=${value}', '--long-list=${value}']
  })

}

const test = (argv, msg) => t.matchSnapshot(jack({ ...options, argv }), msg)

test([], 'empty')

test(['--long-list', '1', '--long-list=2'])

test([
  '-vvxX',
  '-ffoo',
  'positional',
  '--files=bar',
  'arg',
], 'positionals and some expansions')

test([
  process.execPath,
  '-v',
], 'execPath')

test([
  process.execPath,
  require.main.filename,
  '-v',
], 'execPath and main file')

t.matchSnapshot(parse(options), 'parse only, using process.argv')

test([
  '-vvfone',
  '-vvf=two',
], 'list using short arg, with and without =')

test([
  '-vvfone',
  '--long-opt=value',
  '--',
  '-vv',
  '--file', 'two',
], 'using --')

test([ '-xa' ], 'short flag alias')
test([ '--alias=foo' ], 'long opt alias')
test(['-vvVvV'], 'negate some verbosity')
test(['--implication'], 'imply some things')

t.test('main fn', t => {
  let called = false
  const main = (options) => {
    t.matchSnapshot(options, 'options in main fn')
    t.notOk(called, 'should be called only once')
    called = true
  }
  jack({ ...options, main }, ['-v'])
  t.ok(called, 'called main fn')
  t.end()
})

t.test('usage and help strings', t => {
  t.matchSnapshot(jack({ ...options, usage: 'you can use this thing' }, []))
  t.matchSnapshot(jack({ ...options, help: 'you can help this thing' }, []))
  t.end()
})

t.test('env things', t => {
  jack({
    env: {
      lines: `a,b,c,d`,
      flagon: '1',
      flagoff: '0',
      flagmaybe: '',
      num1: '1',
      num2: '',
      nums: '1,2,,3,4,',
      counter: '1,0,1,0,0,0,1'
    },
    unset: num({ envDefault: 'unset', default: 7, min: 2 }),
    one: num({ envDefault: 'num1' }),
    numbers: list(num({ envDefault: 'nums', delimiter: ',' })),
    counter: env(count({ delimiter: ',' })),
    foo: env({
      default: 'baz',
    }),
    lines: env(list({
      delimiter: ',',
    })),
    nums: env(list(num({ max: 5, delimiter: ',' }))),
    dreams: env(list({ delimiter: ',' })),
    flagon: env(flag()),
    flagoff: env(flag()),
    flagmaybe: env(flag()),
    num1: env(num()),
    num2: num(env()),
    main: result => t.matchSnapshot(result),
  })
  t.end()
})
