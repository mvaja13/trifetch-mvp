const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Setup Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('startAnalysis', (data) => {
      console.log('Analysis started:', data.analysisId);

      // Simulate processing stages
      let progress = 0;
      const stages = [
        { progress: 20, stage: 'preprocessing', message: 'Preprocessing audio file...' },
        { progress: 40, stage: 'extraction', message: 'Extracting audio features...' },
        { progress: 60, stage: 'analysis', message: 'Analyzing vocal biomarkers...' },
        { progress: 80, stage: 'processing', message: 'Processing stress indicators...' },
        { progress: 100, stage: 'complete', message: 'Analysis complete!' }
      ];

      stages.forEach((stageData, index) => {
        setTimeout(() => {
          socket.emit('analysisProgress', {
            analysisId: data.analysisId,
            ...stageData
          });
        }, (index + 1) * 1000);
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
