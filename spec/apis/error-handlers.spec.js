import * as singleSpa from 'single-spa';

describe('error handlers api', () => {
  let errs;

  function handleError(err) {
    errs.push(err);
  }

  beforeAll(() => {
    singleSpa.start();
  })

  beforeEach(() => {
    errs = [];
    singleSpa.addErrorHandler(handleError);
  })

  afterEach(() => {
    expect(singleSpa.removeErrorHandler(handleError)).toBe(true)
  });

  it(`reports an error during load`, () => {
    singleSpa.registerApplication('load-error', () => Promise.reject('Could not load this one'), location => location.hash === '#load-error');

    location.hash = '#load-error';

    return singleSpa
      .triggerAppChange()
      .then(() => {
        expect(errs.length).toBe(1);
        expect(errs[0].appOrParcelName).toBe('load-error');
        expect(errs[0].message.indexOf(`'load-error' died in status LOADING_SOURCE_CODE: "Could not load this one"`)).toBeGreaterThan(-1);
      })
  })

  it(`reports an error during bootstrap`, () => {
    const app = {
      bootstrap() {
        return Promise.reject(new Error(`couldn't bootstrap`));
      },
      mount() {
        return Promise.resolve();
      },
      unmount() {
        return Promise.resolve();
      },
    };

    singleSpa.registerApplication('bootstrap-error', app, location => location.hash === '#bootstrap-error');

    location.hash = '#bootstrap-error';

    return singleSpa
      .triggerAppChange()
      .then(() => {
        expect(errs.length).toBe(1);
        expect(errs[0].appOrParcelName).toBe('bootstrap-error');
        expect(errs[0].message.indexOf(`'bootstrap-error' died in status SKIP_BECAUSE_BROKEN: couldn't bootstrap`)).toBeGreaterThan(-1);
      })
  })

  it(`reports an error during mount`, () => {
    const app = {
      bootstrap() {
        return Promise.resolve();
      },
      mount() {
        return Promise.reject(`couldn't mount`);
      },
      unmount() {
        return Promise.resolve();
      },
    };

    singleSpa.registerApplication('mount-error',app, location => location.hash === '#mount-error');

    location.hash = '#mount-error';

    return singleSpa
      .triggerAppChange()
      .then(() => {
        expect(errs.length).toBe(1);
        expect(errs[0].appOrParcelName).toBe('mount-error');
        expect(errs[0].message.indexOf(`'mount-error' died in status NOT_MOUNTED: "couldn't mount"`)).toBeGreaterThan(-1);
      })
  })

  it(`reports an error during unmount`, () => {
    const app = {
      bootstrap() {
        return Promise.resolve();
      },
      mount() {
        return Promise.resolve();
      },
      unmount() {
        return Promise.reject(new Error(`couldn't unmount`));
      },
    };

    singleSpa.registerApplication('unmount-error', app, location => location.hash === '#unmount-error');

    location.hash = '#unmount-error';

    return singleSpa
      .triggerAppChange()
      .then(() => {
        location.hash = '#something-else';
        return singleSpa.triggerAppChange()
      })
      .then(() => {
        expect(errs.length).toBe(1);
        expect(errs[0].appOrParcelName).toBe('unmount-error');
        expect(errs[0].message.indexOf(`'unmount-error' died in status UNMOUNTING: couldn't unmount`)).toBeGreaterThan(-1);
      })
  })

  it(`reports an error during activity functions`, () => {
    const app = {
      bootstrap() {
        return Promise.resolve();
      },
      mount() {
        return Promise.resolve();
      },
      unmount() {
        return Promise.resolve();
      },
    };

    singleSpa.registerApplication('activity-error', app, location => {throw new Error('bad activity function')});

    location.hash = '#activity-error';

    return singleSpa
      .triggerAppChange()
      .then(() => {
        expect(errs.length).toBe(1);
        expect(errs[0].appOrParcelName).toBe('activity-error');
        expect(errs[0].message.indexOf(`'activity-error' died in status NOT_LOADED: bad activity function`)).toBeGreaterThan(-1);
      })
  })
})
