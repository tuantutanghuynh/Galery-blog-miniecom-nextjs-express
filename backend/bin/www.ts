#!/usr/bin/env node
import app from '../app';
import { port } from '../config/env';
import { startExpiredOrderSweeper } from '../workers/releaseExpiredOrders';

app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);

  // Runs inside the web process rather than as a separate service. That is enough while there is
  // one instance, and the job claims each order with a conditional UPDATE so it stays correct if a
  // second instance ever appears. It should move to a real scheduler once the deployment grows.
  startExpiredOrderSweeper();
});
