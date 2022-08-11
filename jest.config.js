module.exports = async () => {
  return {
    verbose: true,
    collectCoverage: true,
    coverageReporters: ["html", "lcov"],
    collectCoverageFrom: ["src/**/*.{js,jsx}"],
  };
};
