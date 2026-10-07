const path = require('path');

function resolveConfiguredPath(value, fallback) {
  return path.resolve(value || fallback);
}

function createAgentConfig({ env = process.env, userDataDir } = {}) {
  if (!userDataDir && !env.MAGFLOW_DATA_DIR) {
    throw new Error('userDataDir ou MAGFLOW_DATA_DIR est requis');
  }
  const dataDir = resolveConfiguredPath(env.MAGFLOW_DATA_DIR, userDataDir);
  return Object.freeze({
    dataDir,
    templatesDir: resolveConfiguredPath(env.MAGFLOW_TEMPLATES_DIR, path.join(dataDir, 'templates')),
    jobsDir: resolveConfiguredPath(env.MAGFLOW_JOBS_DIR, path.join(dataDir, 'jobs'))
  });
}

module.exports = { createAgentConfig };
