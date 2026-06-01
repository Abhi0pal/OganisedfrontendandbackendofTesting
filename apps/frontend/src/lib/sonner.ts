// Lightweight toast shim (replaces sonner when not installed)
// Provides toast.success(), toast.error(), toast.info() using browser alerts

const toast = {
  success: (message: string) => {
    if (typeof window !== 'undefined') {
      console.log(`✅ ${message}`);
      // Optional: use a simple notification div instead of alert
    }
  },
  error: (message: string) => {
    if (typeof window !== 'undefined') {
      console.error(`❌ ${message}`);
    }
  },
  info: (message: string) => {
    if (typeof window !== 'undefined') {
      console.log(`ℹ️ ${message}`);
    }
  },
};

export { toast };
