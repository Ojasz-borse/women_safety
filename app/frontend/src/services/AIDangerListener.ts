
import { Accelerometer } from "expo-sensors";

export const startDangerListening = (triggerSOS: () => void) => {
  Accelerometer.setUpdateInterval(500);
  
  const subscription = Accelerometer.addListener(({ x, y, z }) => {
    const acceleration = Math.sqrt(x * x + y * y + z * z);
    
    if (acceleration > 2.5) {
      triggerSOS();
    }
  });
  
  return () => {
    subscription.remove();
  };
};

