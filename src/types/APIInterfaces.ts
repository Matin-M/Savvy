export interface ServerResponse {
  response: number;
  data: OverallStats;
}

export interface OverallStats {
  account: Record<string, string>;
  battlePass: Record<string, number>;
  image: string;
  stats: {
    all: {
      overall: Record<string, number>;
    };
  };
}
