// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => Promise.resolve()),
    };
  },
}));

// Mock date-fns to use a fixed date in tests
jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns');
  const fixedDate = new Date('2023-01-15T12:00:00Z');
  
  return {
    ...actual,
    format: (date, formatStr) => {
      return actual.format(date || fixedDate, formatStr);
    },
    isToday: (date) => {
      return actual.isToday(date || fixedDate);
    },
    isSameDay: (date1, date2) => {
      return actual.isSameDay(date1 || fixedDate, date2 || fixedDate);
    },
    isBefore: (date, dateToCompare) => {
      return actual.isBefore(date || fixedDate, dateToCompare || fixedDate);
    },
    isAfter: (date, dateToCompare) => {
      return actual.isAfter(date || fixedDate, dateToCompare || fixedDate);
    },
    addDays: (date, amount) => {
      return actual.addDays(date || fixedDate, amount);
    },
    subDays: (date, amount) => {
      return actual.subDays(date || fixedDate, amount);
    },
    differenceInDays: (dateLeft, dateRight) => {
      return actual.differenceInDays(
        dateLeft || fixedDate, 
        dateRight || fixedDate
      );
    },
  };
});
