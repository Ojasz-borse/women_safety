import { Accelerometer } from 'expo-sensors';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform, Alert, Linking, Vibration } from 'react-native';
import * as Location from 'expo-location';
import { triggerSOS } from './sosService';

const SHAKE_THRESHOLD = 2.5; // Acceleration threshold for shake
const SHAKE_WINDOW_MS = 3000; // Time window to count 3 shakes
const MIN_SHAKE_INTERVAL = 500; // Minimum time between shakes

class ShakeDetectorService {
  private shakeCount = 0;
  private lastShakeTime = 0;
  private accelerometerSubscription: any = null;
  private isEnabled = false;
  private onShakeDetected?: () => void;

  // Initialize background task for iOS
  async initBackgroundTask() {
    if (Platform.OS === 'ios') {
      try {
        await BackgroundFetch.registerTaskAsync('shake-detector', {
          minimumInterval: 15 * 60, // 15 minutes (minimum allowed)
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log('✅ Background shake detection task registered');
      } catch (error) {
        console.log('❌ Failed to register background task:', error);
      }
    }
  }

  // Start listening for shakes
  start(onShake: () => void) {
    if (this.isEnabled) {
      console.log('⚠️ Shake detector already running');
      return;
    }

    this.onShakeDetected = onShake;
    this.isEnabled = true;
    this.shakeCount = 0;

    // Set update interval (200ms for responsive detection)
    Accelerometer.setUpdateInterval(200);

    console.log('🎯 Starting accelerometer with threshold:', SHAKE_THRESHOLD);

    this.accelerometerSubscription = Accelerometer.addListener((data) => {
      this.handleAcceleration(data.x, data.y, data.z);
    });

    console.log('✅ Shake detector started - listening for shakes...');
  }

  // Stop listening
  stop() {
    if (!this.isEnabled) return;

    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }

    this.isEnabled = false;
    this.onShakeDetected = undefined;
    console.log('⚠️ Shake detector stopped');
  }

  // Handle acceleration data
  private handleAcceleration(x: number, y: number, z: number) {
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    
    // Log high acceleration values for debugging
    if (acceleration > 2.0) {
      console.log(`📊 Acceleration: ${acceleration.toFixed(2)}G - [${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}]`);
    }

    if (acceleration > SHAKE_THRESHOLD) {
      const now = Date.now();

      // Check if enough time has passed since last shake
      if (now - this.lastShakeTime > MIN_SHAKE_INTERVAL) {
        this.lastShakeTime = now;
        this.shakeCount++;

        console.log(`📳 SHAKE DETECTED! Count: ${this.shakeCount}/3`);
        
        // Vibrate on each shake detected
        Vibration.vibrate(50);

        // Reset shake count after window expires
        setTimeout(() => {
          if (this.shakeCount > 0) {
            console.log('⏰ Shake window expired, resetting count');
            this.shakeCount = 0;
          }
        }, SHAKE_WINDOW_MS);

        // Trigger SOS on 3 shakes
        if (this.shakeCount >= 3) {
          console.log('🚨 3 SHAKES DETECTED! TRIGGERING SOS NOW!');
          this.shakeCount = 0;
          if (this.onShakeDetected) {
            this.onShakeDetected();
          }
        }
      }
    }
  }

  // Check if service is running
  isRunning(): boolean {
    return this.isEnabled;
  }

  // Get current shake count (for debugging)
  getShakeCount(): number {
    return this.shakeCount;
  }
}

// Export singleton instance
export const shakeDetectorService = new ShakeDetectorService();

// Background task handler for iOS
TaskManager.defineTask('shake-detector', async () => {
  try {
    console.log('🔄 Background shake detection task running...');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.log('❌ Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
