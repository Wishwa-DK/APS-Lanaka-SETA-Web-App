// Real-time policy synchronization utility
// This will handle cross-tab communication and automatic updates

class PolicySync {
  private static instance: PolicySync | null = null;
  private listeners: Set<() => void> = new Set();
  private lastFetchTime: number = 0;
  private isOnline: boolean = true;

  static getInstance(): PolicySync {
    if (!PolicySync.instance) {
      PolicySync.instance = new PolicySync();
    }
    return PolicySync.instance;
  }

  constructor() {
    // Listen for storage changes (cross-tab communication)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Listen for focus events (when user switches back to tab)
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  // Register a component to receive policy updates
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all subscribed components
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in policy sync listener:', error);
      }
    });
  }

  // Handle storage changes from other tabs
  private handleStorageChange(event: StorageEvent): void {
    if (event.key === 'policy_update_timestamp') {
      const timestamp = parseInt(event.newValue || '0');
      if (timestamp > this.lastFetchTime) {
        console.log('📡 Policy update detected from another tab, refreshing...');
        this.notifyListeners();
      }
    }
  }

  // Handle window focus (user switches back to tab)
  private handleWindowFocus(): void {
    if (this.shouldRefresh()) {
      console.log('🔍 Window focused, checking for policy updates...');
      this.notifyListeners();
    }
  }

  // Handle visibility change
  private handleVisibilityChange(): void {
    if (!document.hidden && this.shouldRefresh()) {
      console.log('👁️ Tab became visible, checking for policy updates...');
      this.notifyListeners();
    }
  }

  // Check if we should refresh based on time elapsed
  private shouldRefresh(): boolean {
    const now = Date.now();
    const timeSinceLastFetch = now - this.lastFetchTime;
    return timeSinceLastFetch > 10000; // 10 seconds minimum between refreshes
  }

  // Call this when policies are successfully fetched
  updateLastFetchTime(): void {
    this.lastFetchTime = Date.now();
  }

  // Call this when policies are updated (from admin panel)
  notifyPolicyUpdate(): void {
    const timestamp = Date.now().toString();
    localStorage.setItem('policy_update_timestamp', timestamp);
    this.lastFetchTime = parseInt(timestamp);
    
    // Also notify current tab
    setTimeout(() => {
      this.notifyListeners();
    }, 100); // Small delay to ensure storage event propagates
  }

  // Check if we're online
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Force refresh all listeners
  forceRefresh(): void {
    console.log('🔄 Force refreshing all policy components...');
    this.notifyListeners();
  }
}

export default PolicySync;