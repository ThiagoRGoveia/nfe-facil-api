const setGherkingSuiteDescription = ({ testType, architecturalLevel, feature, scenario }) =>
  `[${testType}][${architecturalLevel}][${feature}]:
    SCENARIO: ${scenario}`;

// To set it() text description
const setGherkingTestDescription = ({ given, when, then }) => `
    _ GIVEN: ${given}
    _ WHEN: ${when}
    _ THEN: ${then}`;

// Helpers to works with more readable
const useGiven = (callback) => callback();
const useWhen = (callback) => callback();
const useThen = (callback) => callback();

export { setGherkingSuiteDescription, setGherkingTestDescription, useGiven, useWhen, useThen };
