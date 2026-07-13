export {};

declare global {
  interface Window {
    stackmendDesktop: {
      getDaemonStatus: () => Promise<{
        state: string;
        protocolVersion: string;
        activeProjects: number;
      }>;
    };
  }
}
