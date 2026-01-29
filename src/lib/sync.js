import { supabase } from './supabase'

const QUEUE_KEY = 'mistake_queue';
const BATCH_SIZE = 5;
const SYNC_INTERVAL = 60000; // 60 seconds

class SyncManager {
    constructor() {
        this.timer = null;
        // Try to sync on load in case there are leftovers
        this.sync();
    }

    getQueue() {
        try {
            const item = localStorage.getItem(QUEUE_KEY);
            return item ? JSON.parse(item) : [];
        } catch (e) {
            return [];
        }
    }

    setQueue(queue) {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }

    async addMistake(mistake) {
        const queue = this.getQueue();
        queue.push({
            ...mistake,
            created_at: new Date().toISOString()
        });

        this.setQueue(queue);

        // If queue reaches batch size, sync immediately
        if (queue.length >= BATCH_SIZE) {
            await this.sync();
        } else {
            // Otherwise ensure a timer is running
            this.startTimer();
        }
    }

    startTimer() {
        if (!this.timer) {
            this.timer = setTimeout(() => {
                this.sync();
            }, SYNC_INTERVAL);
        }
    }

    async sync() {
        const queue = this.getQueue();
        if (queue.length === 0) return;

        // Clear timer if running, as we are syncing now
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        try {
            console.log(`[Sync] Attempting to sync ${queue.length} mistakes...`);

            // Supabase allows bulk insert
            const { error } = await supabase
                .from('mistakes')
                .insert(queue);

            if (error) {
                console.error('[Sync] Failed:', error);
                // On error, we keep items in queue and retry later (timer will restart on next add or reload)
                // Optionally start timer retry here
                this.startTimer();
            } else {
                console.log('[Sync] Success!');
                // On success, clear the queue
                this.setQueue([]);
            }
        } catch (err) {
            console.error('[Sync] Network error:', err);
            this.startTimer();
        }
    }
}

export const syncManager = new SyncManager();
