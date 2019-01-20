const t = require('tap')
const { parse, env, jack, opt, flag, list, count } = require('../')

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
    },
    foo: env({
      default: 'baz',
    }),
    lines: env(list({
      delimiter: ',',
    })),
    dreams: env(list({ delimiter: ',' })),
    flagon: env(flag()),
    flagoff: env(flag()),
    flagmaybe: env(flag()),
    num1: env({type: 'number'}),
    num2: env({type: 'number' }),
    main: result => t.matchSnapshot(result),
  })
  t.end()
})
