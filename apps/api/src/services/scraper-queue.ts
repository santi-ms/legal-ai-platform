import { logger } from '../utils/logger.js';

interface QueueJob {
  id: string;
  tenantId: string;
  portal: string;
  addedAt: Date;
  attempts: number;
}

interface QueueResult {
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  message?: string;
}

class ScraperQueue {
  private queue: QueueJob[] = [];
  private running = false;
  private results = new Map<string, QueueResult>();

  async enqueue(job: Omit<QueueJob, 'addedAt' | 'attempts'>): Promise<string> {
    const jobId = job.id;

    // Check if same tenant+portal already has a pending job
    const existing = this.queue.find(j => j.tenantId === job.tenantId && j.portal === job.portal);
    if (existing) {
      logger.info(`[scraper-queue] Skipping duplicate job for tenant ${job.tenantId} / portal ${job.portal}`);
      return existing.id;
    }

    this.queue.push({ ...job, addedAt: new Date(), attempts: 0 });
    this.results.set(jobId, { jobId, status: 'queued' });

    logger.info(`[scraper-queue] Job ${jobId} queued. Queue size: ${this.queue.length}`);

    // Start processing if not already running
    if (!this.running) {
      setImmediate(() => this.processNext());
    }

    return jobId;
  }

  getStatus(jobId: string): QueueResult | null {
    return this.results.get(jobId) || null;
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.running = false;
      return;
    }

    this.running = true;
    const job = this.queue.shift()!;

    this.results.set(job.id, { jobId: job.id, status: 'running' });
    logger.info(`[scraper-queue] Processing job ${job.id} for tenant ${job.tenantId} / portal ${job.portal}`);

    try {
      // Import dynamically to avoid circular deps
      const { syncTenantPortal } = await import('./portal-sync-service.js');
      await syncTenantPortal(job.tenantId, job.portal, 'manual');

      this.results.set(job.id, { jobId: job.id, status: 'done', message: 'Sincronización completada' });
      logger.info(`[scraper-queue] Job ${job.id} completed`);
    } catch (error: any) {
      logger.error(`[scraper-queue] Job ${job.id} failed: ${error.message}`);
      this.results.set(job.id, { jobId: job.id, status: 'failed', message: error.message });
    }

    // Limit stored results to 100 entries (keep recent ones)
    if (this.results.size > 100) {
      const toDelete = Array.from(this.results.entries())
        .filter(([, r]) => r.status === 'done' || r.status === 'failed')
        .slice(0, this.results.size - 100);
      for (const [id] of toDelete) this.results.delete(id);
    }

    // Process next job after a small delay to avoid hammering portals
    setTimeout(() => this.processNext(), 500);
  }
}

export const scraperQueue = new ScraperQueue();
