// Create performance monitoring utility
export const performanceMonitor = {
  frameCount: 0,
  lastTime: 1,
  currentFPS: 60,
  lowFPSCounter: 0,
  FPS_THRESHOLD: 30,
  CONSECUTIVE_LOW_FPS_LIMIT: 3,
  
  update(time) {
    // Initialize on first call
    if (this.lastTime === null) {
      this.lastTime = time;
      return true;
    }
    
    this.frameCount++;
    const elapsed = time - this.lastTime;
    // console.log("ELAPSED", elapsed)
    // Calculate FPS once per second
    if (elapsed >= 1000) {
      this.currentFPS = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = time;
      
      console.log(`Current FPS: ${this.currentFPS}`);
      
      // Check if FPS is below threshold
      if (this.currentFPS < this.FPS_THRESHOLD) {
        this.lowFPSCounter++;
        console.warn(`Low FPS detected: ${this.currentFPS}, count: ${this.lowFPSCounter}`);
        
        if (this.lowFPSCounter >= this.CONSECUTIVE_LOW_FPS_LIMIT) {
          console.error(`Consistently low FPS (${this.currentFPS}), recommending fallback`);
          return false;
        }
      } else {
        // Reset counter if FPS recovers
        this.lowFPSCounter = 0;
      }
    }
    
    return true;
  }
};

// Memory usage monitoring utility
export const memoryMonitor = {
  lastCheckTime: 0,
  CHECK_INTERVAL: 5000, // Check every 5 seconds
  MEMORY_THRESHOLD: 0.9, // 90% of available heap
  
  check(time) {
    // Only check periodically to reduce overhead
    if (time - this.lastCheckTime < this.CHECK_INTERVAL) {
      return true;
    }
    
    this.lastCheckTime = time;
    
    // Check if performance.memory is available (Chrome)
    if (performance && performance.memory) {
      const usedHeapSizeMB = performance.memory.usedJSHeapSize / (1024 * 1024);
      const heapLimitMB = performance.memory.jsHeapSizeLimit / (1024 * 1024);
      const memoryUsageRatio = usedHeapSizeMB / heapLimitMB;
      
      console.log(`Memory usage: ${Math.round(usedHeapSizeMB)}MB / ${Math.round(heapLimitMB)}MB (${Math.round(memoryUsageRatio * 100)}%)`);
      
      if (memoryUsageRatio > this.MEMORY_THRESHOLD) {
        console.error(`High memory usage detected: ${Math.round(memoryUsageRatio * 100)}%, recommending fallback`);
        return false;
      }
    }
    
    return true;
  }
};