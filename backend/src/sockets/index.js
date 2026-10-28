const jwt = require('jsonwebtoken');

const setupSockets = (io) => {
  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    if (token) {
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      try {
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'super_secret_midflow_jwt_dev_key_2026');
        socket.user = decoded;
        return next();
      } catch (err) {
        console.warn(`[Socket Auth Warning] Invalid token provided: ${err.message}`);
        // Allow connection with unauthenticated tag for public room subscriptions
        socket.user = null;
        return next();
      }
    }
    socket.user = null;
    next();
  });

  io.on('connection', (socket) => {
    // 1. Join user private room for personal notifications & queue alerts
    socket.on('join:user', (userId) => {
      if (socket.user && socket.user.id === userId) {
        socket.join(`user:${userId}`);
      } else if (!socket.user) {
        // Fallback for public demo client
        socket.join(`user:${userId}`);
      }
    });

    // 2. Join doctor queue room
    socket.on('join:doctor', (doctorId) => {
      socket.join(`doctor:${doctorId}`);
    });

    // 3. Join queue room (compatible with existing report)
    socket.on('join:queue', (data) => {
      const room = typeof data === 'object' ? data.doctorId || data.hospitalId : data;
      if (room) {
        socket.join(`queue:${room}`);
      }
    });

    // 4. Join hospital room for hospital admin real-time telemetry
    socket.on('join:hospital', (hospitalId) => {
      socket.join(`hospital:${hospitalId}`);
    });

    socket.on('disconnect', () => {
      // Cleanup happens automatically in Socket.IO
    });
  });
};

module.exports = setupSockets;
