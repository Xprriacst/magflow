const assert = require('assert');
const path = require('path');
const { createAgentConfig } = require('./config');

const defaults = createAgentConfig({ env: {}, userDataDir: '/runtime/magflow' });
assert.equal(defaults.templatesDir, path.resolve('/runtime/magflow/templates'));
assert.equal(defaults.jobsDir, path.resolve('/runtime/magflow/jobs'));

const configured = createAgentConfig({
  env: {
    MAGFLOW_DATA_DIR: './agent-data',
    MAGFLOW_TEMPLATES_DIR: './client-templates',
    MAGFLOW_JOBS_DIR: './render-jobs'
  }
});
assert.equal(configured.templatesDir, path.resolve('./client-templates'));
assert.equal(configured.jobsDir, path.resolve('./render-jobs'));

console.log('Configuration agent: OK');
