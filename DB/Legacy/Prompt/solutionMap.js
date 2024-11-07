const {
  cb_test_friend,
  cb_test_family,
  cb_test_school,
  cb_test_remain,
} = require("./cognitive_behavior_test");

const solutionMap = {
  cognitive: {
    School: cb_test_school,
    Friend: cb_test_friend,
    Family: cb_test_family,
    Mood: cb_test_remain,
    Health: cb_test_remain,
    Self: cb_test_remain,
  },
  emotion: {
    Friend: {},
    Mood: {},
    Health: {},
  },
};

module.exports = {};
