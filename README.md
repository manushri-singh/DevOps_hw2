# HW2
## Test Generation and Coverage

This repository contains the code for implementing Homework2 requirements of DevOps (CSC519) in Fall 2017.

### Scripts

1. main.js: https://github.ncsu.edu/manush/HW2/blob/master/main.js

### Coverage Report:
Coverage report for subject.js:
![Alt text](subject_js_coverage.png?raw=true "Screen shot of Coverage Report of Subject.js")

Coverage report for mystery.js:
![Alt text](mystery_js_coverage.png?raw=true "Screen shot of Coverage Report of Mystery.js")

### Instructions for Running the scripts:
1. Install npm and nodejs-legacy on the host machine
2. Clone the repository
3. cd HW2/
4. Execute the command: npm install
5. Install istanbul: npm install istanbul -G
6. Generate the test.js file: node main.js mystery.js
7. Run istanbul on the generated test.js file: node_modules/.bin/istanbul cover test.js


