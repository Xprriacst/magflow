export function sendJobToAgent(io, connectedAgents, agentId, job) {
  const agent = connectedAgents.get(agentId);

  if (!agent) {
    return false;
  }

  io.to(agent.socketId).emit('job:new', job);
  return true;
}

export function isAgentConnected(connectedAgents, agentId) {
  return connectedAgents.has(agentId);
}
