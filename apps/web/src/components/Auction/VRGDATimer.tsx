interface VRGDATimerProps {
  timeToNextDrop: number; // seconds until next price drop
}

export const VRGDATimer = ({ timeToNextDrop }: VRGDATimerProps) => {
  const minutes = Math.floor(timeToNextDrop / 60);
  const seconds = timeToNextDrop % 60;
  
  return (
    <span className="vrgda-timer text-content-primary/80">
      {minutes.toString().padStart(2, '0')}:
      {seconds.toString().padStart(2, '0')}
    </span>
  );
};